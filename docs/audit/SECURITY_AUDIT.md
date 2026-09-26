# OpenCATS — Security Audit

**Scope.** Static, defensive security review of the OpenCATS repository at `/home/user/OpenCATS` (legacy PHP ATS, CATS 0.9.x lineage; `CATS_VERSION = '0.9.7.4'`, `constants.php:45`). This document covers authentication, authorization, injection (SQL / command / code / XXE / LDAP), XSS, CSRF, file handling, secrets/config, transport/headers, SSRF, open redirects, information disclosure, dependency exposure, and privacy controls. It reports what is verified in code with `file:line` evidence, marks unconfirmed items as **Potential**, and ends with a prioritized remediation plan. No live system was tested and no exploit code is included.

**Method.** I read the core request pipeline (`index.php`, `ajax.php`, `lib/ModuleUtility.php`, `lib/UserInterface.php`, `lib/AJAXInterface.php`), the auth stack (`lib/Users.php`, `lib/Session.php`, `lib/LDAP.php`, `lib/LoginActivity.php`, `lib/ACL.php`, `modules/login/LoginUI.php`), DB layer (`lib/DatabaseConnection.php`, `lib/DatabaseSearch.php`, `lib/DataGrid.php`, `lib/Search.php`), file handling (`lib/FileUtility.php`, `lib/Attachments.php`, `modules/attachments/AttachmentsUI.php`), the public surface (`modules/careers/CareersUI.php`, `modules/xml`, `modules/rss`, `modules/graphs`, `modules/toolbar`, `modules/install`), config/secrets (`config.php`, `constants.php`, `docker/`, `db/`, `test/data/`), and all AJAX endpoints under `ajax/` and `modules/*/ajax/`. I ran `grep -n`/`sed -n` to fix line numbers, wrote two helper scripts in the scratchpad (`count_echo.php` — template escaping census; `acl_cases.php` — per-action access-check census), and reviewed git history for prior security fixes (`git log`). PHP 8.4 CLI was used only to run those read-only analysis scripts; nothing in the repo was modified.

## Summary of findings

| ID | Title | Severity |
|----|-------|----------|
| SEC-001 | Passwords stored as unsalted MD5; strict-comparison verification | CRITICAL |
| SEC-002 | No secure password reset; forgot-password flow designed to e-mail the password and currently fatal | HIGH |
| SEC-003 | Default admin credentials `admin`/`cats` shipped and demo/tester creds in config | CRITICAL |
| SEC-004 | No CSRF protection anywhere; state changes via GET | HIGH |
| SEC-005 | Stored & reflected XSS pervasive in back-end templates (DB fields echoed raw) | HIGH |
| SEC-006 | LDAP authentication: injection in filters, no TLS, anonymous-bind fallback logic | HIGH |
| SEC-007 | No session fixation defense (`session_regenerate_id` never called); weak cookie handling | HIGH |
| SEC-008 | Attachment download authorization bypass (no site scoping; guessable hash) | HIGH |
| SEC-009 | Uploaded files served inline from web root; HTML/SVG → stored XSS; nginx ignores `.htaccess` | HIGH |
| SEC-010 | Unauthenticated info/functionality: `getLicenseKey`, `graphs`, `toolbar`, config-writing installer AJAX | HIGH |
| SEC-011 | `eval()` on hook strings and DataGrid render fields; `unserialize()` of DB column prefs | MEDIUM |
| SEC-012 | SQL error messages and full request dumped to the browser | MEDIUM |
| SEC-013 | Privilege escalation: SA can create/keep ROOT-level user; no access-level clamp | MEDIUM |
| SEC-014 | No login throttling / account lockout; attempts only logged | MEDIUM |
| SEC-015 | No security response headers (CSP/HSTS/X-Frame-Options/nosniff); clickjacking | MEDIUM |
| SEC-016 | ORDER BY / column identifiers interpolated into SQL in DataGrid | MEDIUM (Potential) |
| SEC-017 | SSRF-ish outbound calls (Google Maps by ZIP, catsone phone-home, Resfly SOAP) | MEDIUM |
| SEC-018 | Hardcoded DB/SMTP/LDAP/license secrets in `config.php`; weak/removed crypto libs | MEDIUM |
| SEC-019 | EOL / vulnerable bundled front-end libs (jQuery 1.3.2, CKEditor4, fpdf 1.53, artichow, simpletest) | MEDIUM |
| SEC-020 | Insecure temp/backup file handling; predictable `md5(rand()+time())` names; world-writable (0777) | MEDIUM |
| SEC-021 | No session idle timeout; weak "single session" enforcement | LOW |
| SEC-022 | Privacy: EEO/PII exposure, no access audit logging, no data-subject tooling | LOW |
| SEC-023 | Docker/CI defaults ship weak DB roots, phpMyAdmin, world-readable seed creds | LOW |
| SEC-024 | Public careers "apply" trusts client-supplied `candidateID` → unauthenticated overwrite of any candidate (= API-002) | CRITICAL |
| SEC-025 | Careers "registered candidate" login is a forgeable knowledge-based cookie; can delete any attachment (= API-004) | HIGH |
| SEC-026 | AJAX layer enforces login only; state-changing handlers skip access-level checks (= API-005) | HIGH |
| SEC-027 | Ineffective regex sanitizer in `DataGrid::get()` → relative-path include + arbitrary class instantiation (= API-007) | HIGH |
| SEC-028 | Unauthenticated maintenance/ops endpoints (`install:maint`, `QueueCLI.php`, `rebuild_old_docs.php`) (= API-008) | MEDIUM |

---

## 1. Authentication

### SEC-001 — Passwords stored as unsalted MD5 with strict-comparison verification
- **Severity:** CRITICAL
- **Finding:** User passwords are hashed with bare, unsalted `md5()`. `Security.MD` admits MD5, and the code confirms it everywhere. There is no per-user salt, no iteration, no `password_hash()`/bcrypt. Verification uses PHP's loose/strict `!==` string compare of hex digests (not `hash_equals`).
- **Evidence:**
  - `lib/Users.php:93` — `$md5pwd = $password == LDAPUSER_PASSWORD ? $password : md5($password);` (create)
  - `lib/Users.php:701` / `:755` — `password = md5(%s)` (change / reset)
  - `lib/Users.php:840` — `if ($rs['password'] !== md5($password))` (login)
  - `lib/Users.php:679` — `if ($rs['password'] !== md5($currentPassword))` (change)
  - Seed hashes confirm plain MD5: `db/cats_schema.sql:1108` stores `'admin'` literally as the password of user `admin` (pre-hash seed) and `test/data/test.sql:1618` stores `21232f297a57a5a743894a0e4a801fc3` = `md5('admin')` (verified locally).
- **Impact:** A single database leak exposes every password to instant rainbow-table / GPU cracking. MD5 is cryptographically broken for password storage. Password reuse across systems amplifies impact.
- **Recommendation:** Migrate to `password_hash($pw, PASSWORD_DEFAULT)` + `password_verify()`, rehash-on-login for legacy MD5 rows, and use `hash_equals()` for any remaining digest comparison. Add a migration path keyed on hash length/format.

### SEC-002 — No secure password-reset mechanism; the forgot-password flow is designed to e-mail the current password and is broken (fatal)
- **Severity:** HIGH
- **Finding:** The "forgot password" handler is written to look up the user's *current* password and e-mail it in the message body. With MD5 storage (SEC-001) the plaintext is not recoverable, and in the current code the flow does not work at all: it calls a method and constants that do not exist, so the request dies with a PHP fatal error. There is therefore **no working, secure self-service password reset**; the only recovery path is an administrator changing the password.
- **Evidence:**
  - `modules/login/LoginUI.php:455-462` — `if ($password = $user->getPassword($username)) { ... sprintf(PASSWORD_RESET_BODY, $password) ... }`.
  - `Users::getPassword()` is not defined: `grep -rn "function getPassword"` finds only `lib/Session.php:366` (a `CATSSession` method) and test/simpletest code; `class Users` (`lib/Users.php:63`) has no `__call`. Calling an undefined method is a fatal `Error` on PHP 7/8.
  - `PASSWORD_RESET_SUBJECT` / `PASSWORD_RESET_BODY` are never `define()`d anywhere; `config.php:172-174` defines `FORGOT_PASSWORD_SUBJECT` / `FORGOT_PASSWORD_BODY` (`'... Your current password is %s.'`) instead — i.e. the intended design is "mail the password".
  - `modules/login/LoginUI.php:448` `onForgotPassword()` takes `username` from `$_POST` with no rate limiting; form at `modules/login/ForgotPassword.tpl:34`.
  - Cross-checked by the API audit (API-011).
- **Impact:** (a) Users locked out cannot recover access without an admin — an operational and support burden. (b) Unauthenticated users can trigger a fatal error path on demand (information disclosure if `display_errors` is on). (c) The *intended* design (e-mail the credential) is an anti-pattern; a naive "fix" that restores it would reintroduce a critical weakness.
- **Recommendation:** Do not repair this flow as designed. Replace it with a tokenized reset: single-use, time-limited random token stored hashed, reset *link* by e-mail, uniform response regardless of whether the user exists, rate limiting, and invalidation of existing sessions on reset. Remove `FORGOT_PASSWORD_BODY` from `config.php`.

### SEC-003 — Default admin credentials and demo/tester credentials shipped
- **Severity:** CRITICAL
- **Finding:** The default administrator password is the constant string `cats`, and the login template even ships a JS `defaultLogin()` that fills `admin`/`cats`. Demo and automated-tester credentials are hardcoded in `config.php`. The seed DB creates `admin`.
- **Evidence:**
  - `constants.php:178` — `define('DEFAULT_ADMIN_PASSWORD', 'cats');`
  - `modules/login/Login.tpl:96-97` — `document.getElementById('username').value = 'admin'; ... 'password' ... 'cats';`
  - `config.php:188-197` — `TESTER_LOGIN='john@mycompany.net'`, `TESTER_PASSWORD='john99'`, `DEMO_LOGIN`, `DEMO_PASSWORD='john99'`.
  - `db/cats_schema.sql:1108` seeds user `admin`. Login only *prompts* a change post-login (`modules/login/LoginUI.php:332`,`:393`) — it does not force it before granting a session.
  - **Effective default on a fresh install is `admin`/`admin`, not `admin`/`cats`:** `db/cats_schema.sql:1108` seeds the literal password `'admin'`, and the in-app migration `modules/install/Schema.php:1329` runs `UPDATE user SET password = md5(password) WHERE can_change_password=1;`, turning it into `md5('admin')` (matches `test/data/test.sql:1618`, `21232f297a57a5a743894a0e4a801fc3`). The change-password prompt only fires when the typed password equals `DEFAULT_ADMIN_PASSWORD` = `'cats'` (`modules/login/LoginUI.php:332`), so an `admin`/`admin` login is **never** prompted to change it. (Cross-checked with DATABASE_AUDIT DB-009.)
- **Impact:** Any fresh or partially-configured install is trivially compromised with known creds. The demo credentials, if `ENABLE_DEMO_MODE` is on, are exposed in page source (`Login.tpl:90-91`).
- **Recommendation:** Force a password change on first admin login before any authenticated action; remove `defaultLogin()`/`demoLogin()` credential-filling from the template; do not ship demo/tester credentials in the default config.

### SEC-006 — LDAP authentication weaknesses (injection, no TLS, bind logic)
- **Severity:** HIGH
- **Finding:** `lib/LDAP.php` builds search filters by directly concatenating the untrusted username, uses `ldap_connect` without `ldaps://`/`STARTTLS`, and its bind logic authenticates against a rebind. Filter/DN injection is possible via crafted usernames. In `sql+ldap` mode a DB user whose stored password equals the sentinel `_LDAPUSER_` is routed to LDAP.
- **Evidence:**
  - `lib/LDAP.php:68` — `ldap_search($this->_connection, LDAP_BASEDN, LDAP_ATTRIBUTE_UID . '=' . $username)` (no `ldap_escape`).
  - `lib/LDAP.php:130` — same unescaped filter in `getUserInfo()`.
  - `lib/LDAP.php:96` — `$username = strtr(LDAP_ACCOUNT, $trans);` builds a bind DN from the raw username.
  - `lib/LDAP.php:40` — `@ldap_connect(LDAP_HOST, LDAP_PORT)` (plaintext 389 by default, `config.php:267`); no TLS options set.
  - `lib/Users.php:824` / `:849` — `sql+ldap` routing on `LDAPUSER_PASSWORD` sentinel (`lib/Users.php:56`).
  - Default LDAP config points at a public test server: `config.php:266` `LDAP_HOST='ldap.forumsys.com'`, bind pw `'password'` (`config.php:273`).
- **Impact:** LDAP filter injection can alter which entry is matched; cleartext LDAP exposes bind and user credentials on the wire; the sentinel-routing logic can be abused to force auth mode.
- **Recommendation:** Use `ldap_escape($username, '', LDAP_ESCAPE_FILTER)`; require `ldaps://` or `ldap_start_tls()`; validate that exactly one entry is returned before rebinding; remove public default host/creds.

### SEC-014 — No login throttling or account lockout
- **Severity:** MEDIUM
- **Finding:** `Users::isCorrectLogin()` / `Session::processLogin()` accept unlimited attempts. `lib/LoginActivity.php` and `Users::addLoginHistory()` only *record* attempts (successful and failed); nothing counts failures or locks/backs-off. No CAPTCHA.
- **Evidence:** `lib/Session.php:642` `processLogin()` calls `isCorrectLogin` then logs via `addLoginHistory` (`lib/Users.php:956`); `lib/LoginActivity.php` is read-only reporting (`getPage()` at `:119`). No `failedAttempts`/lockout column consulted anywhere.
- **Impact:** Online brute force and credential stuffing are unimpeded — especially damaging given MD5 storage and weak/default passwords.
- **Recommendation:** Add per-account and per-IP failure counters with exponential backoff / temporary lockout and optional CAPTCHA.

### SEC-021 — No idle session timeout; weak single-session enforcement
- **Severity:** LOW
- **Finding:** There is no server-side idle timeout: sessions persist until logout/GC. `ENABLE_SINGLE_SESSION` is off by default (`config.php:183`) and even when on, `checkForceLogout()` exempts root/read/site-200 accounts and compares a DB `session_cookie` string rather than rotating identifiers.
- **Evidence:** `lib/Session.php:171-234` `checkForceLogout()`; no `gc_maxlifetime`/last-activity check (grep found only `updateLastRefresh`, `lib/Session.php:626`).
- **Recommendation:** Implement absolute + idle session lifetimes; make single-session enforcement default and identifier-based.

---

## 2. Authorization

### SEC-004 — No CSRF protection; state-changing GET requests
- **Severity:** HIGH
- **Finding:** There are **no** CSRF tokens anywhere in the codebase (grep for `csrf|xsrf|nonce|token` across `*.php/*.tpl/*.js` returns nothing relevant). Destructive actions are reachable by GET and depend only on the session cookie.
- **Evidence:**
  - Delete-by-GET: `modules/candidates/CandidatesUI.php:1407` `onDelete()` reads `$_GET['candidateID']` and calls `$candidates->delete()`, reached via `case 'delete'` (`:128`). Same pattern for companies/contacts/joborders (`case 'delete'` at `CompaniesUI.php:123`, `ContactsUI.php:125`, `JobOrdersUI.php:148`).
  - AJAX writes accept `$_REQUEST` with no token: `modules/lists/ajax/deleteList.php:46`, `ajax/deleteActivity.php:43`, `ajax/setColumnWidth.php`.
- **Impact:** A logged-in user visiting a malicious page can be forced to delete candidates/jobs/lists, add users (SEC-013), change settings, or trigger backups — classic CSRF.
- **Recommendation:** Add a per-session CSRF token to all state-changing forms/AJAX and verify server-side; convert deletes/mutations to POST; set `SameSite` on the *session* cookie (see SEC-007).

### SEC-013 — Privilege escalation: no access-level clamp on user creation/editing
- **Severity:** MEDIUM
- **Finding:** `onAddUser()` inserts whatever `accessLevel` the POST contains, bounded only by license seat logic (`> ACCESS_LEVEL_READ` needs a seat) — not by the acting user's own level. A Standard Admin (400) can create a ROOT (500) user, or set a user to `MULTI_SA`/`ROOT`. `onEditUser()` only pins the *self* edit to the current level (`:1375`), not edits of other users.
- **Evidence:** `modules/settings/SettingsUI.php:1142` `$accessLevel = getTrimmedInput('accessLevel', $_POST)`; `:1151` only checks license, then `:1192` `$users->add(..., $accessLevel, ...)`. `Users::add()` inserts it verbatim (`lib/Users.php:89-124`). Edit path `:1333` reads `accessLevel` from POST; self-pin at `:1375`.
- **Impact:** Vertical privilege escalation from SA to ROOT; combined with SEC-004 a CSRF can create an attacker ROOT account.
- **Recommendation:** Reject `accessLevel` greater than the acting user's `getRealAccessLevel()`; forbid creating/elevating to ROOT except by ROOT.

### Access-control census (per-action)
A scripted pass over every `handleRequest()` switch (`scratchpad/notes/acl_cases.php`) shows the core CRUD modules (candidates/companies/contacts/joborders) check `getUserAccessLevel(...)` in each case, but several modules perform **no inline per-action check**:
- `modules/reports/ReportsUI.php` — 9 cases, **0** access checks in the file. EEO report generation (`generateEEOReportPreview`, `:82`) is reachable by any authenticated user; EEO visibility (`canSeeEEOInfo`) is *not* consulted here (grep shows EEO gating only in `candidates/Show.tpl:260`). **Related privacy issue, see SEC-022.**
- `modules/lists/ListsUI.php` — 8 cases, **0** checks; `deleteStaticList`/`removeFromListDatagrid` mutate data. The feature test suite even expects READONLY users to reach `deleteStaticList` (`test/features/GET_POST_requestsSecurity.feature:731`), i.e. the *tests bless* the missing check.
- `modules/activity/ActivityUI.php`, `modules/home/HomeUI.php`, `modules/export/ExportUI.php` — 0 inline checks; `export` streams full record CSVs (`ExportUI.php:69`).
These are authenticated-user-scoped (login is enforced by `index.php`), so they are horizontal/least-privilege gaps rather than anonymous access, hence folded into SEC-013's theme; flagged here for the remediation plan.

### SEC-008 — Attachment download authorization bypass
- **Severity:** HIGH
- **Finding:** `AttachmentsUI::getAttachment()` fetches the attachment with `verifySiteID = false` and authorizes the download solely by matching `md5($rs['directoryName'])` against a `directoryNameHash` GET parameter — not against the requesting user's `site_id` or record ownership. Any authenticated user who learns/guesses an attachment ID + directory-name hash can download another tenant's resume.
- **Evidence:**
  - `modules/attachments/AttachmentsUI.php:84` — `$rs = $attachments->get($attachmentID, false);` (site check disabled).
  - `:83-90` — authorization is `md5($rs['directoryName']) != $_GET['directoryNameHash']`.
  - `Attachments::get()` builds the hash into the retrieval URL itself (`lib/Attachments.php:620` `urlencode(md5($rs['directoryName']))`), so the "secret" travels in every listing the user can see; directory names are `md5(rand()+time())` (`lib/FileUtility.php:246`, weak entropy).
- **Impact:** Cross-site (multi-tenant) and cross-record document disclosure (résumés, PII, backups). The same handler serves `catsbackup` content types, so a full DB/attachment backup is downloadable by ID/hash.
- **Recommendation:** Enforce `site_id` (and ownership/ACL) in `get()`; do not use a hash of a stored field as the authorization secret; use unguessable capability tokens tied to the user.

### Installer / test / toolbar reachability
- `modules/install/ajax/ui.php` is gated by `if (file_exists('INSTALL_BLOCK'))` at `:55` — after install it refuses actions. **Good**, but `INSTALL_BLOCK` is a repo-root file (created at `:975`) and is in `.gitignore`; if it is ever removed or not created, the installer AJAX writes attacker-controlled values straight into `config.php` (`:120-135`, `:224-237`) with **no auth** (it uses base `AJAXInterface`, not `SecureAJAXInterface`). See SEC-010.
- `installwizard.php` / `installtest.php` are **not** gated by `INSTALL_BLOCK`; `installtest.php` runs DB connectivity tests and prints `mysqli_connect_error()` (`lib/InstallationTests.php:393-419`) — info disclosure if left deployed.
- `modules/tests/TestsUI.php` requires authentication (`:64`) but the test runner (`runSelectedTests`, `:99`) is reachable by *any* logged-in user and executes SimpleTest web/AJAX cases that hammer the app as `TESTER_LOGIN`/`TESTER_PASSWORD` (`modules/tests/CATSWebTestCase.php:74-75`). This module should not be deployed to production.

---

## 3. Injection

### SQL injection — overall posture
The DB layer provides `makeQueryString()` (`lib/DatabaseConnection.php:495`, quotes + `mysqli_real_escape_string`) and `makeQueryInteger()` (`:546`, `(integer)` cast), and the bulk of queries use them. I found no query that concatenates `$_GET/$_POST/$_REQUEST` *values* directly into SQL without a helper (grep for request superglobals inside SQL strings returned nothing). Free-text search goes through `DatabaseSearch::makeBooleanSQLWhere()` which escapes via `escapeString()` before REGEXP/LIKE assembly (`lib/DatabaseSearch.php:293`). IN-lists are integer-cast before `implode` in the audited paths (`lib/Candidates.php:653-656`, `modules/candidates/CandidatesUI.php:3387-3395`, `SavedLists.php:419-421`). Git history shows prior SQLi fixes (`f4ef001` tag update, `df7e373` `entriesPerPage`, `e7a8eeb` `viewerrors` importID).

### SEC-016 — ORDER BY / identifier interpolation in DataGrid (Potential)
- **Severity:** MEDIUM (Potential)
- **Finding:** `DataGrid` builds `ORDER BY $sortBy $sortDirection` by string interpolation. `sortBy` is validated against the grid's declared sortable columns and `sortDirection`/`filterAlpha`/`maxResults` are validated/cast, so a direct break-out is not demonstrable through the grid constructor. However `filterAlpha` is interpolated into a `HAVING ORD(UPPER($sortBy))=ORD(UPPER('$filterAlpha'))` clause and `sortBy` also appears there; the `filter` parameter is split and mapped to per-column `filter` SQL fragments. The validation is a column-name allowlist, which mitigates injection *if* every grid's column definitions are static — but some column `filter`/`filterRender=#` fragments are `eval()`'d (see SEC-011) and one builds `IN (".implode(",",$arguments).")` where `$arguments` originate from the request filter string.
- **Evidence:**
  - `lib/DataGrid.php:1330` — `$orderSQL = 'ORDER BY ' . $this->_parameters['sortBy'] . ' ' . $this->_parameters['sortDirection'];`
  - `:1317` — `$havingSQL[] = 'ORD(UPPER('.$this->_parameters['sortBy'].')) = ORD(UPPER(\''.$this->_parameters['filterAlpha'].'\'))';`
  - `:1206`/`:1211` — `eval($this->_classColumns[$columnName]['filterRender=#'])`.
  - `lib/Candidates.php:2250` — `... tag_id IN (". implode(",",$arguments)."))` inside a `filterRender=#` string; `$arguments` come from the exploded request `filter` value (`lib/DataGrid.php:1074-1119`) and are **not** integer-cast in this branch.
  - `Search::byKeySkills/byCity/...` interpolate `$sortBy`/`$sortDirection` (`lib/Search.php:530-531`,`:710-711`), but callers validate them via `SearchPager::isSortByValid/isSortDirectionValid` (`modules/candidates/CandidatesUI.php:1949-1964`, `lib/Pager.php:175-203`).
- **Impact:** If any request-reachable grid tag filter reaches the `tag_id IN (...)` branch with non-numeric `$arguments`, SQL injection is possible. Needs a runtime trace to confirm which grids expose `filterTypes '=#'` on that column to unprivileged input.
- **Recommendation:** Cast tag/id arguments with `makeQueryInteger` before `implode`; whitelist `sortDirection` to `ASC|DESC` inside DataGrid itself; avoid `eval()` for SQL fragments (SEC-011).

### SEC-011 — `eval()` on hook strings, DataGrid render fields, and careers fields; `unserialize()` of DB data
- **Severity:** MEDIUM
- **Finding:** The framework runs `eval(Hooks::get(...))` on essentially every request path, `eval()`s DataGrid column render strings, `eval()`s per-field assignment strings in the careers portal, and `unserialize()`s a DB-stored column-preferences blob and the modules cache.
- **Evidence:**
  - Hook eval on hot paths: `index.php:209`, `ajax.php:118` and `:127` (`foreach ($filters as $filter) eval($filter);`), plus dozens of `eval(Hooks::get('...'))` across modules (e.g. `modules/login/LoginUI.php:439`).
  - DataGrid render eval: `lib/DataGrid.php:1206`,`:1211`,`:1441`,`:1530`,`:1912`.
  - Careers eval on POST-driven field names from a **fixed** array (`modules/careers/CareersUI.php:280`,`:285`,`:1272`) — field *names* are hardcoded, values are assigned, so not directly injectable, but the pattern is dangerous.
  - `unserialize()`: `lib/Session.php:850` (`columnPreferences` DB column → PHP object instantiation), `lib/ModuleUtility.php:210` (`modules.cache` file), `modules/settings/SettingsUI.php:2010`,`:2040`, `modules/joborders/JobOrdersUI.php:1462` (mailer settings blob).
- **Impact:** `eval` of `$filters` in `ajax.php` (populated by hooks) and of DataGrid strings is a code-execution surface if any hook/column definition ever incorporates request data. `unserialize()` of the `user.column_preferences` column enables PHP object injection if that column is writable via any flaw (it is set from `setColumnWidth` AJAX which stores serialized data — `ajax/setColumnWidth.php` → `Session::setColumnPreferences` → `serialize`, `lib/Session.php:1200`).
- **Recommendation:** Replace hook `eval` with real callables; replace DataGrid render `eval` with closures; replace `unserialize()` with `json_decode`/`unserialize(..., ['allowed_classes'=>false])`; treat `modules.cache` as trusted-only and prefer opcache.

### Command injection
- **Assessment (FACT):** `lib/DocumentToText.php` escapes the filename with `escapeshellarg(realpath($fileName))` before building `antiword`/`pdftotext`/`html2text` commands (`:100-127`), and the executable paths come from `config.php` constants, not request data. No user-controlled string reaches `exec()` unescaped there.
- **SEC-020 relevant:** `scripts/makeBackup.php` builds `exec('tar ...')`/`exec('rm -rf ...')`/`exec('zip ...')` with a numeric `$random`/`$siteID` and fixed paths (`:110-222`); `$siteID` is `(int)`-cast from `argv` (`:62`). Low command-injection risk, but the script also `exec('rm -rf ...')` and `chdir()`s, and if reachable via web (it opens `php://output` when not CLI, `:36-40`) with a `Site ID` argument it would run server-side — verify it is not web-exposed.

### XXE
- **Finding (FACT):** `lib/DocumentToText.php::readZippedXML()` parses DOCX/ODT XML with `libxml_disable_entity_loader(true)` set immediately before `DOMDocument::loadXML($data, LIBXML_NOENT | LIBXML_XINCLUDE | ...)` (`:415-417`). `libxml_disable_entity_loader(true)` blocks external entity resolution, so classic XXE is mitigated on PHP ≤7.x; on PHP 8 that function is a deprecated no-op but external entity loading is off by default, so this is largely safe. However `LIBXML_NOENT` *enables* entity substitution and `LIBXML_XINCLUDE` enables XInclude — if run on an old libxml with entity loader re-enabled elsewhere, billion-laughs/XInclude file reads become possible. **Potential**, low-to-medium.
- `lib/ZipLookup.php:26` `simplexml_load_file($sUrl . $zip)` fetches a remote URL (see SEC-017), not local XXE.
- **Recommendation:** Drop `LIBXML_NOENT`/`LIBXML_XINCLUDE`; keep entity loading disabled explicitly.

### Email header injection
- **Finding:** `lib/Mailer.php` uses PHPMailer 6.8 (`::send`, `:193`), which sanitizes headers; `From`/recipient come from settings and validated addresses (`ajax/testEmailSettings.php:57-79` checks for `@`). No raw header concatenation found. **Low risk.**

---

## 4. Cross-Site Scripting (XSS)

### SEC-005 — Pervasive back-end XSS (unescaped DB fields in templates)
- **Severity:** HIGH
- **Finding:** `Security.MD` claims internal XSS protection since v0.9.7.2, but a full template census contradicts this for many DB-backed fields. Census of the 136 `.tpl` files (`scratchpad/notes/count_echo.php`): **1705** echo-like statements; only **44** wrap output in an escaping/encoding function; **892** use the escaping helper `$this->_()` (which calls `htmlspecialchars`, `lib/Template.php:53`); but **1302** echo raw expressions with no escaping, **251** of which emit raw record/array data (`$this->data[...]`, `$row[...]`, etc.).
- **Evidence (representative, verified):**
  - Notes rendered raw: `modules/candidates/Show.tpl:303`,`:308` `echo($this->data['notes'])` and `:299` `shortNotes`. `CandidatesUI` runs `nl2br(htmlspecialchars(...))` on notes (`:514`) so *notes* are escaped — but the same template echoes other raw fields:
  - `modules/candidates/Show.tpl:66` `echo($this->data['titleClass'])`; `:145`/`:215` `echo($this->extraFieldRS[$i]['display'])` (extra-field HTML stored by admins); `:347` `echo $questionnaire['questionnaireDescription']`; `:497`/`:603` `echo($activityData['notes'])` / `ratingLine`; `:577` `echo $list['name']` — **saved-list names are attacker-settable** via `modules/lists/ajax/newList.php:52` (`SavedLists::newListName` stores with `makeQueryString` only, `lib/SavedLists.php:218`), rendered raw here → **stored XSS**.
  - `modules/companies/Show.tpl:30`,`:55`,`:69`,`:84`,`:126` raw `$this->data[...]`/`extraFieldRS['display']`.
  - Extra-field `addHTML`/`editHTML`/`display` are echoed raw across Add/Edit/Show templates (`Add.tpl:155`, `Edit.tpl:199`) — an SA who defines an extra field with markup gets stored XSS against all users.
- **Impact:** Stored XSS via candidate/company/contact/joborder free-text, saved-list names, extra-field definitions, questionnaire text, and activity notes rendered outside the escaped paths. An attacker (including an external applicant whose data lands in a record, or a low-priv user) can run script in a recruiter/admin session → session/cookie theft, CSRF chaining, account takeover.
- **Recommendation:** Escape at output for *all* DB fields by defaulting to `$this->_()`/`htmlspecialchars`; treat extra-field/template HTML as a deliberate, restricted, sanitized (HTMLPurifier) feature; add a Content-Security-Policy (SEC-015) as defense-in-depth.

### Careers portal (public) — partial protection
- **FACT:** The public apply path sanitizes inputs via `getSanitisedInput()` = `trim(htmlspecialchars($v, ENT_QUOTES, FALSE))` before persistence (`modules/careers/CareersUI.php:1211-1232`, helper at `lib/UserInterface.php`). The apply-form *pre-population* branch, however, reflects raw `$_POST` values straight into HTML attribute values without escaping — e.g. `str_replace('<input-firstName>', '<input ... value="' . $firstName . '" />', ...)` where `$firstName = $_POST['firstName']` (`CareersUI.php:415-433`, output at `:581-596`). Because these come from the same request, this is **reflected XSS** on the careers apply page (self-XSS unless combined with a POST-based CSRF/link). `extraNotes` is reflected raw at `:617`. Confirmed the `ENT_QUOTES, FALSE` third arg is a bug: passing `FALSE` as the charset disables proper encoding on some PHP versions.
- **Recommendation:** Escape reflected values with `htmlspecialchars(..., ENT_QUOTES, 'UTF-8')`; fix the `FALSE` charset argument in `getSanitisedInput()`.

### Careers page template injection (admin-controlled) — Potential
- The active career-portal template is loaded from the `settings` table and rendered with `str_replace` of `<tag>` placeholders, then `echo`ed. Admins/`careerportal`-category users edit these templates (`SettingsUI` `careerPortalTemplateEdit`, `:317`). A template author can embed arbitrary HTML/JS served on the public portal (stored XSS to applicants) — expected for a template feature but should be documented as trusted-author-only.

---

## 5. CSRF
Covered as SEC-004 (HIGH). No tokens exist; deletes and admin actions are GET/`$_REQUEST`-driven; the session cookie is the only gate.

---

## 6. File handling

### SEC-009 — Uploaded files served inline from web root; script/HTML execution risk
- **Severity:** HIGH
- **Finding:** Attachments live under `attachments/` inside the web root and are streamed back with `Content-Disposition: inline` and a MIME type derived from the file extension via `lib/mime.types`. The upload whitelist **allows `html`** (and `bak`), and `Attachments::fileMimeType()` maps `.html`→`text/html` (`lib/mime.types:531`). An uploaded `*.html` résumé is therefore served inline as `text/html` and executes in the victim's browser (stored XSS / same-origin). The `.htaccess` protections only work on Apache; the shipped Docker stack uses **nginx** (`docker/docker-compose.yml` image `prooph/nginx:www`), which ignores `.htaccess` entirely.
- **Evidence:**
  - `modules/attachments/AttachmentsUI.php:127` — `header('Content-Disposition: inline; filename="' . $fileName . '"');` then `:129` `Content-Type: ' . $contentType` where `$contentType = Attachments::fileMimeType($fileName)` (`:117`).
  - Whitelist includes `html`: `lib/FileUtility.php:192` `$GoodFileExtensions = array('bak','bmp','csv','doc','docx','heic','html', ...)`; `.htaccess` FilesMatch also grants `html` (`attachments/.htaccess`, `upload/.htaccess`).
  - `.htaccess`-only defense: `attachments/.htaccess`/`upload/.htaccess` use `AddHandler cgi-script`/`FilesMatch` — Apache-only; nginx compose file `docker/docker-compose.yml:6-13`.
  - Files are written world-writable: `lib/FileUtility.php:634` `chmod($uploadPath.'/'.$newFileName, 0777)`, dirs `mkdir(...,0777)` (`Attachments.php:1288-1349`).
- **Impact:** Stored XSS via uploaded HTML served same-origin; on nginx there is no execution/serving restriction at all, so an uploaded `.html`/`.svg` (svg maps to `image/svg+xml`, `lib/mime.types:462`) runs script in the app origin. World-writable files/dirs worsen local risk.
- **Recommendation:** Store uploads outside the web root and stream only via the authorized handler with `Content-Disposition: attachment` and a neutral `application/octet-stream` (or sanitized) type; drop `html`/`svg`/`bak` from the whitelist or force-download them; ship nginx location rules (the `.htaccess` files do nothing on the shipped stack); remove `0777`.

### Path traversal / filename handling
- **FACT:** `makeSafeFilename()` strips `/` and `\` directory parts and non-ASCII, and appends `.txt` to any non-whitelisted extension (`lib/FileUtility.php:166-201`). Download traversal is constrained because `getAttachment()` derives the path from DB `directory_name`+`stored_filename` (`AttachmentsUI.php:96`), not from a raw path parameter. `isUploadFileSafe()` does `str_replace('..','',$fileName)` and prefix-checks the upload path (`lib/FileUtility.php:504-527`) — the `..` strip is weak (non-recursive) but the prefix check mitigates. No confirmed traversal, but the `..` filter should be replaced with `realpath()` containment.

### SEC-020 — Predictable temp/backup names; backups in web-reachable areas
- **Severity:** MEDIUM
- **Finding:** Temp and attachment directory names use `md5(rand() . time() . ...)` / `md5($padding.time().mt_rand())` (`lib/FileUtility.php:246`,`:261`) — not `random_bytes`, so predictable under load. Admin backup writes a full DB+attachment archive as an *attachment* (`catsbackup`) downloadable through the same weakly-authorized handler (SEC-008), and the CLI `scripts/makeBackup.php` writes archives under `scripts/backup/` guarded only by a generated `.htaccess`/`index.php` (`:110-111`) — again Apache-only.
- **Evidence:** `modules/settings/ajax/backup.php:92-100` creates a `catsbackup` attachment; `scripts/makeBackup.php:195`,`:221` produce `_full.tar`/`catsbackup.bak` in `scripts/backup/`.
- **Recommendation:** Use `random_bytes()`/`bin2hex` for all temp/dir names; store backups outside web root; protect via the app, not `.htaccess`.

---

## 7. Secrets & configuration

### SEC-018 — Hardcoded secrets and weak/removed crypto
- **Severity:** MEDIUM
- **Finding:** `config.php` ships hardcoded DB creds, a license key, SMTP creds, and an LDAP bind password. `lib/Encryption.php` relies on the **removed** `mcrypt_*` extension (deleted in PHP 7.2+) and defaults to **ECB** mode; `lib/HashUtility.php` is CRC32 (non-cryptographic). Settings such as SMTP/EEO are stored in the DB `settings` table in plaintext.
- **Evidence:**
  - `config.php:31` `LICENSE_KEY='3163GQ-...'`; `:40-43` DB creds `cats`/`password`; `:219-223` SMTP `user`/`password`; `:272-273` LDAP bind `cn=read-only-admin...`/`password`.
  - `lib/Encryption.php:44` `mcrypt_module_open(...)`, default `$mode='ecb'` (`:36`); ECB leaks plaintext structure. `mcrypt` is unavailable on supported PHP → class is dead/broken.
  - `lib/HashUtility.php` = CRC32 only (`:30-`), used for file dedup (`lib/FileCompressor.php:462`), not security — but named "HashUtility".
  - `modules/install/ajax/ui.php:154-155` echoes `DATABASE_USER`/`DATABASE_PASS` into the install form (only pre-`INSTALL_BLOCK`).
- **Impact:** Repo-committed secrets leak on any source disclosure; ECB/mcrypt code is unusable/insecure if ever wired in; plaintext settings expand blast radius of DB read.
- **Recommendation:** Move secrets to environment variables / a secrets store; delete the mcrypt-based `Encryption` class or reimplement with `sodium`/`openssl` (AES-GCM); never echo DB creds.

### SEC-023 — Weak Docker/CI defaults & seeded credentials
- **Severity:** LOW
- **Finding:** The shipped compose file exposes MariaDB on `3306:3306` with `MYSQL_ROOT_PASSWORD=root`, mounts `test/data` as init SQL, and runs phpMyAdmin on `:8080` with `dev/dev` (`docker/docker-compose.yml:29-49`). Seed/test data contains known MD5 creds and valid `session_cookie` values (`test/data/securityTests.sql:5-7`, `test/data/test.sql:1618`).
- **Recommendation:** Do not expose DB port publicly; strong compose secrets; exclude phpMyAdmin and test seed data from any production image.

---

## 8. Transport / headers

### SEC-015 — Missing security response headers; clickjacking; caching
- **Severity:** MEDIUM
- **Finding:** The app sets only `Content-Type`, `Content-Length`, `Content-Disposition`, `Expires`, `Last-Modified`, `Pragma`, `Cache-Control`, and one `Location` header (header census across `*.php`). There is **no** `Content-Security-Policy`, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, or `Strict-Transport-Security` anywhere (grep returns none). `SSL_ENABLED` defaults `false` (`config.php:54`) and only affects URL generation (`lib/CATSUtility.php:381`), not enforcement/HSTS.
- **Impact:** No clickjacking defense; MIME-sniffing amplifies SEC-009; no CSP to blunt SEC-005; no HSTS. `X-Content-Type-Options` absence lets browsers sniff uploaded content as HTML.
- **Recommendation:** Emit `X-Frame-Options: DENY` (or `frame-ancestors`), `X-Content-Type-Options: nosniff`, a restrictive `Content-Security-Policy`, `Referrer-Policy`, and HSTS behind TLS; centralize header emission.

### SEC-007 — Session fixation & cookie flags
- **Severity:** HIGH
- **Finding:** `session_regenerate_id()` is **never** called (grep across the repo: no hits) — the PHP session ID is not rotated on login, enabling session fixation. The app also does not configure the PHP session cookie via `session_set_cookie_params`; `session_start()` runs with defaults (`index.php:75`). Separately, login sets an unrelated `session_cookie` cookie with `Secure=true` hardcoded (`lib/Session.php:901`) even when the site is served over plain HTTP, which will silently drop the cookie; the app's real auth cookie (the PHP session, name `CATS`) gets **no** `HttpOnly`/`Secure`/`SameSite` flags. Git history shows repeated churn here (`f8b37c9`, `d6042a5`, `cf77174`) that broke and partially reverted SameSite handling.
- **Evidence:**
  - No `session_regenerate_id` anywhere; `index.php:75` `session_start()` after `@session_name(CATS_SESSION_NAME)` with no `ini_set('session.cookie_httponly'...)`.
  - `lib/Session.php:895-903` sets `$secure=true; $httponly=true;` and `setcookie('session_cookie', ...)` — but this is a secondary cookie, and `Secure=true` on HTTP breaks it; the SameSite value computed at `:904` is not applied by the current `setcookie` signature.
  - `Session::getCookie()` returns `CATS_SESSION_NAME . '=' . session_id()` (`:555`), i.e. the session id is stored in the DB `session_cookie` column and used for the fragile single-session check.
- **Impact:** Session fixation (attacker sets victim's session id pre-login, inherits authenticated session); missing `HttpOnly` on the PHP session cookie makes SEC-005 XSS directly session-stealing.
- **Recommendation:** Call `session_regenerate_id(true)` on privilege change/login; set `session.cookie_httponly=1`, `cookie_secure` (when TLS), `cookie_samesite=Lax/Strict` via `session_set_cookie_params()` before `session_start()`; remove the confused secondary `session_cookie`.

---

## 9. SSRF / outbound

### SEC-017 — Server-side outbound requests
- **Severity:** MEDIUM
- **Finding:** Three outbound channels exist. (a) ZIP lookup fetches `http://maps.googleapis.com/maps/api/geocode/xml?...&address=<zip>` via `simplexml_load_file` with the user-supplied `zip` concatenated into the URL (`lib/ZipLookup.php:23-26`), reachable **unauthenticated** through `ajax/zipLookup.php` (base `AJAXInterface`, `:9`). (b) `NewVersionCheck` phones home to `www.catsone.com:80` over a raw socket, sending license key, site name, PHP version, active-user count, and UID (`lib/NewVersionCheck.php:98-115`,`:195` `fsockopen`). (c) Resume parsing uses a SOAP client to `http://soap.resfly.com/parse.php` (`wsdl/parse.wsdl:78`, `lib/ParseUtility.php`), gated by `PARSING_ENABLED`.
- **Impact:** (a) The `zip` value is only `str_replace(' ','')`-cleaned (`ZipLookup.php:11`); CRLF/URL metacharacters could manipulate the outbound request, and the endpoint is unauthenticated (request-forgery amplifier / info leak of internal responses reflected back in XML). (b) Phone-home discloses license key + deployment telemetry over plaintext HTTP to a third party by default. (c) Résumé content is shipped to a third-party SOAP service.
- **Recommendation:** Validate `zip` as `^[A-Za-z0-9 -]{3,10}$` and use HTTPS with `urlencode`; make version-check opt-in and HTTPS; document Resfly data egress; require auth on `zipLookup`.

## 10. Open redirects
- **FACT:** Login redirects use `CATSUtility::transferRelativeURI($_GET['reloginVars'])` (`modules/login/LoginUI.php:383-385`), which prepends the app's own absolute base + `index.php?` (`lib/CATSUtility.php:256-262`), so the destination is constrained to the app origin — not an open redirect. `transferURL()` is only called with the hardcoded `http://www.catsone.com` for the demo domain (`index.php:249`). **No open redirect confirmed.** (`reloginVars` is however reflected as a URL-encoded value into the login form action — low XSS risk, urlencoded.)

## 11. Information disclosure

### SEC-012 — SQL errors and full request dumped to the browser
- **Severity:** MEDIUM
- **Finding:** On query failure the DB layer prints "MySQL Query Failed" plus the **full SQL and error** to the page and `die()`s (`lib/DatabaseConnection.php:181-219`, connect errors `:113-141`). `UserInterface::fatal()` appends the entire `$_REQUEST` (urlencoded) inside an HTML comment on error pages (`lib/UserInterface.php:180-186`). `installtest.php` prints `mysqli_connect_error()` (`lib/InstallationTests.php:393-419`). No global `display_errors=0` is enforced.
- **Impact:** Leaks schema, query structure (aids SQLi), and request contents to any user hitting an error; assists attackers and exposes internal data.
- **Recommendation:** Log errors server-side; show a generic message; set `display_errors=0`, `mysqli_report(MYSQLI_REPORT_OFF)` for production; remove request dumps.

Version disclosure: `CATS_VERSION` is printed on the login page (`modules/login/Login.tpl` "Version ..."), and `modules/settings/SystemInformation.tpl:29` runs `php_uname()` (SA-gated but broad). Minor.

## 12. Dependency exposure

### SEC-019 — EOL / vulnerable bundled and pinned dependencies
- **Severity:** MEDIUM (cross-reference the dependency audit for depth)
- **Finding / Evidence:**
  - **jQuery 1.3.2** bundled and loaded on every page: `js/jquery-1.3.2.min.js`, included at `lib/TemplateUtility.php:1194`. jQuery 1.3.2 (2009) has multiple known XSS issues (`$()` HTML parsing, `location.hash`), unmaintained.
  - **CKEditor 4.25.1** (`composer.lock`: `ckeditor/ckeditor 4.25.1`; loaded e.g. `modules/candidates/SendEmail.tpl:2`, `joborders/Add.tpl:2`). CKEditor 4 reached **end-of-life (Jan 2023)**; the security-support program is commercial-only. 4.x line has multiple historical XSS CVEs.
  - **PHPMailer 6.8.0** (`composer.lock`) — reasonably current but should track the latest 6.x for CVE fixes.
  - Bundled legacy libs with no upstream patching: `lib/fpdf` (`FPDF_VERSION 1.53`, ~2004), `lib/artichow` (abandoned), `lib/simpletest` (abandoned; also its `authentication.php`/`url.php` contain credential helpers).
  - Dev dependencies (`packages-dev` in `composer.lock`: guzzle 6.5.8, symfony 2.8/3.x/4.x, phpunit 7.5) are old; `Security.MD` warns to install with `--no-dev` — but the pinned lockfile ships them.
- **Impact:** Client-side XSS sinks (jQuery/CKEditor) compound SEC-005; server-side PDF/graph libs are unmaintained.
- **Recommendation:** Upgrade to jQuery 3.7+, migrate off CKEditor 4 (to CKEditor 5 or an actively supported editor), replace fpdf/artichow, remove simpletest and dev deps from production builds. (Defer detailed CVE mapping to the dependency audit.)

## 13. Privacy / compliance

### SEC-022 — EEO/PII access controls, audit logging, data-subject rights
- **Severity:** LOW (compliance-weighted)
- **Finding:** EEO data (ethnicity, gender, veteran, disability) is collected on the public apply form (`CareersUI.php:1229-1232`) and stored per candidate. Display is gated by `canSeeEEOInfo` **only in the candidate Show template** (`modules/candidates/Show.tpl:260`,`:278`); the **reports module performs no access check** (`ReportsUI.php` — 0 inline checks; `generateEEOReportPreview` at `:82`), so aggregate EEO statistics are viewable by any authenticated user regardless of `canSeeEEOInfo`. CSV export (`ExportUI.php:69`) streams candidate records with no field-level EEO restriction. There is no access/audit log of *who viewed* a candidate's PII (only login history and record *change* history via `lib/History.php`). No data-subject export/delete tooling beyond raw record delete.
- **Impact:** Over-broad access to sensitive EEO/PII; weak accountability; gaps vs GDPR/CCPA (right of access/erasure, purpose limitation, audit).
- **Recommendation:** Enforce `canSeeEEOInfo` in reports and exports; add read-access audit logging for candidate PII; add data-subject export/erase workflows and retention controls.

---

## 14. Existing security tests — coverage assessment
- The Behat suites `test/features/GET_POST_requestsSecurity.feature`, `moduleMainPagesSecurity.feature`, `moduleSubPagesSecurity.feature` cover **ACL by access level** (DISABLED/READONLY/EDIT/…) across module *pages and actions* (candidates/joborders/companies/contacts/activities/home/lists/calendar/reports/settings). This is real, valuable coverage of vertical access control on `index.php?m=...&a=...` routes.
- **Gaps (what is NOT covered):**
  - **Zero** tests hit `ajax.php` / `ajax/*` / `modules/*/ajax/*` endpoints (grep: `ajax.php` count = 0 in all three feature files) — the AJAX authorization surface (SEC-010, testEmailSettings, backup, lists mutations) is untested.
  - No XSS/injection/CSRF tests (grep for `script>|xss|inject|csrf` in features: none). SEC-004/005/016 are unguarded by tests.
  - The lists tests **assert that READONLY users may reach `deleteStaticList`** (`GET_POST_requestsSecurity.feature:731`), encoding the missing check (SEC-013 theme) as expected behavior.
  - No tests for attachment authorization (SEC-008), file-upload type handling (SEC-009), session fixation (SEC-007), or the public careers/xml/rss surface.
- **Recommendation:** Add negative tests for AJAX auth, IDOR on attachments (cross-site IDs), CSRF token enforcement, upload-type rejection, and reflected/stored XSS payloads on record fields.

---

## 15. Addendum — cross-verified findings originating in API_AUDIT.md

These were found by the API/integrations audit, independently re-verified by the lead auditor against the code, and are recorded here so the security register is complete. Full detail lives in `API_AUDIT.md`.

### SEC-024 — Public careers "apply" trusts a client-supplied `candidateID` (unauthenticated candidate overwrite)
- **Severity:** CRITICAL
- **Finding:** The public application handler reads `candidateID` from POST and, if present, calls `Candidates::update()` on that record with the submitter's data. No login, token or ownership proof is involved.
- **Evidence:** `modules/careers/CareersUI.php:725` — `$candidateID = isset($_POST['candidateID']) ? intval($_POST['candidateID']) : -1;` → `:750` `$this->onApplyToJobOrder($siteID, $candidateID);` → `:1279-1290` `if ($candidateID !== false) { ... $candidates->update($candidateID, ...` (re-verified by lead auditor). The hidden field is emitted at `:699`/`:710`.
- **Impact:** Anyone on the internet who can see one public job order can overwrite PII/EEO data and ownership of arbitrary candidates by iterating IDs, and attach arbitrary files to them. Integrity breach of the core dataset; GDPR-reportable.
- **Recommendation:** Immediately stop accepting candidate identity from the client (remove the hidden field and `:725`); always create a new candidate or a `candidate_duplicates` link. Long-term: verified candidate sessions (magic link). Add a Behat regression test.

### SEC-025 — Careers registered-candidate "login" is a forgeable cookie; arbitrary attachment deletion
- **Severity:** HIGH (feature off by default: `lib/CareerPortal.php:79`)
- **Evidence:** `modules/careers/CareersUI.php:1635-1763` (identity = e-mail + last name + ZIP from POST or cookie), `:291`, `:340` (`attachmentID` from `$_GET`), `lib/Attachments.php:304-335` (delete scoped only by `site_id`).
- **Recommendation:** See API-004.

### SEC-026 — AJAX handlers enforce authentication but not authorization
- **Severity:** HIGH
- **Evidence:** `lib/AJAXInterface.php:210-216` (login check only); `ajax/deleteActivity.php:33-47`; `modules/lists/ajax/*.php`; `ajax/testEmailSettings.php:86-93`; `modules/settings/SettingsUI.php:130-192` vs `:234`.
- **Impact:** Read-only users can delete activities/lists/tags and send mail via the SMTP relay; together with SEC-004 (no CSRF) this is reachable cross-site.
- **Recommendation:** See API-005 — declarative per-handler `requireAccess()`.

### SEC-027 — Ineffective sanitizer in `DataGrid::get()` (path include / class instantiation)
- **Severity:** HIGH (authenticated; RCE depends on planting a file named `dataGrids.php` — UNKNOWN)
- **Evidence:** `lib/DataGrid.php:267-268` — `preg_replace("[^A-Za-z0-9]", "", ...)` (no delimiters; `[`/`]` are treated as delimiters). Lead auditor ran `php -r 'var_dump(preg_replace("[^A-Za-z0-9]", "", "../../x/y"));'` → `string(9) "../../x/y"`. Value flows to `include_once` and `new $class(...)` (`lib/DataGrid.php:275-282`) from `ajax/getDataGridPager.php:43-58` and `modules/export/ExportUI.php:135-140`.
- **Recommendation:** Fix regex to `'/[^A-Za-z0-9]/'` and switch to an allowlist of DataGrid identifiers.

### SEC-028 — Unauthenticated maintenance/operations endpoints
- **Severity:** MEDIUM
- **Evidence:** `modules/install/ajax/maint.php:30-37`; `modules/install/ajax/attachmentsReindex.php:32-35`; `QueueCLI.php` and `rebuild_old_docs.php` are in web root with no CLI guard (see API-008).
- **Recommendation:** Guard with `PHP_SAPI === 'cli'` or move out of the web root; require ROOT for install/maintenance AJAX.

---

## OWASP Top 10 (2021) mapping

| OWASP 2021 category | Findings |
|---|---|
| A01 Broken Access Control | SEC-004, SEC-008, SEC-010, SEC-013, SEC-022, SEC-024, SEC-025, SEC-026, SEC-028; missing per-action checks (reports/lists/export) |
| A02 Cryptographic Failures | SEC-001, SEC-002, SEC-007, SEC-018 |
| A03 Injection | SEC-005 (XSS), SEC-006 (LDAP), SEC-011 (code/eval), SEC-016 (SQL, Potential), SEC-027 (path include); XXE (§3, Potential) |
| A04 Insecure Design | SEC-002, SEC-004, SEC-024, SEC-025, SEC-014, SEC-020, careers template injection |
| A05 Security Misconfiguration | SEC-003, SEC-009, SEC-012, SEC-015, SEC-018, SEC-023 |
| A06 Vulnerable & Outdated Components | SEC-019 |
| A07 Identification & Auth Failures | SEC-001, SEC-003, SEC-006, SEC-007, SEC-014, SEC-021 |
| A08 Software & Data Integrity Failures | SEC-011 (`unserialize`/`modules.cache`), SEC-019 |
| A09 Logging & Monitoring Failures | SEC-014, SEC-022 (no read-access/PII audit) |
| A10 SSRF | SEC-017 |

---

## Prioritized remediation plan

**Immediate (exploitable now / trivial takeover):**
0. SEC-024 — remove client-supplied `candidateID` from the public careers apply flow (unauthenticated data overwrite).
1. SEC-003 — force admin password change on first login; strip `defaultLogin()`/demo creds from `Login.tpl`; remove demo/tester creds from default `config.php`.
2. SEC-001 — switch to `password_hash`/`password_verify` with legacy-MD5 rehash-on-login.
3. SEC-002 — replace forgot-password with tokenized reset links; stop mailing passwords.
4. SEC-008 — enforce `site_id`/ownership on attachment downloads; stop using a stored-field hash as the auth secret.
5. SEC-009 — force `Content-Disposition: attachment` + neutral MIME; drop `html`/`svg`/`bak` from the upload whitelist; move uploads out of web root; ship nginx rules (the `.htaccess` files do nothing on the shipped stack).
6. SEC-010 — verify `INSTALL_BLOCK` is always present in production and add an auth/deploy guard around `installwizard.php`/`installtest.php`/installer AJAX; require auth (or remove) `getLicenseKey`, unauth graphs, and the toolbar module.

**Short-term (weeks):**
7. SEC-004 — global CSRF tokens; convert destructive GET actions to POST.
8. SEC-005 — default all template DB-field output to `htmlspecialchars`/`$this->_()`; sanitize extra-field/template HTML; fix the `getSanitisedInput()` `FALSE` charset bug.
9. SEC-007 — `session_regenerate_id(true)` on login; set HttpOnly/Secure/SameSite on the PHP session cookie via `session_set_cookie_params`.
10. SEC-006 — `ldap_escape` filters, require LDAPS/StartTLS, remove public default host/creds.
11. SEC-012 / SEC-015 — suppress SQL/stack output in production; add CSP/X-Frame-Options/nosniff/HSTS.
12. SEC-013 — clamp `accessLevel` to the acting user's level; add missing per-action checks in reports/lists/export.
13. SEC-014 — login throttling/lockout.
13a. SEC-026 / SEC-027 / SEC-028 — per-handler authorization in AJAX; fix DataGrid sanitizer; CLI-guard maintenance scripts. SEC-025 before enabling candidate registration.

**Structural (design-level):**
14. SEC-011 — remove `eval()` from the hook/DataGrid/careers paths (real callables/closures); replace `unserialize()` of DB/cache data with safe formats.
15. SEC-016 — cast all id/tag arguments; whitelist `sortDirection` inside DataGrid; eliminate SQL-fragment `eval`.
16. SEC-018 / SEC-023 — secrets to env/secret store; remove mcrypt-ECB `Encryption`; harden Docker/CI defaults; exclude test seed creds and phpMyAdmin from prod.
17. SEC-017 — HTTPS + input validation for outbound calls; make phone-home/Resfly opt-in.
18. SEC-019 — upgrade jQuery, migrate off CKEditor 4, replace fpdf/artichow/simpletest, ship `--no-dev`.
19. SEC-022 — enforce EEO gating everywhere, add PII read-access audit logging and data-subject tooling.
20. Add the missing security test coverage from §14.

---

## Facts vs Assumptions

**Verified facts (read in code):** MD5 password storage and `!==` comparison (SEC-001); forgot-password mails the password value (SEC-002); default creds `admin`/`cats` and demo/tester creds (SEC-003); no CSRF tokens repo-wide (SEC-004); template escaping census 1302/1705 raw echoes and specific raw DB-field sinks incl. attacker-settable saved-list names (SEC-005); LDAP unescaped filters + plaintext connect (SEC-006); no `session_regenerate_id`, session cookie flags unset, `Secure=true` secondary cookie on HTTP (SEC-007); attachment `get(..., false)` + hash-only auth (SEC-008); `Content-Disposition: inline`, `html` in whitelist, nginx stack (SEC-009); unauth `getLicenseKey`/graphs/zipLookup, installer AJAX writing config gated only by `INSTALL_BLOCK` (SEC-010); `eval`/`unserialize` sites (SEC-011); SQL error + request dump to browser (SEC-012); no accessLevel clamp on add/edit user (SEC-013); no lockout (SEC-014); no security headers (SEC-015); hardcoded secrets + mcrypt/ECB (SEC-018); jQuery 1.3.2 + CKEditor 4.25.1 + fpdf 1.53 (SEC-019); `md5(rand()+time())` names, 0777 (SEC-020); outbound Google/catsone/Resfly calls (SEC-017); EEO ungated in reports/export (SEC-022); Docker root/dev creds (SEC-023).

**Assumptions / inferences:** `command injection` is mitigated by `escapeshellarg` (assumes `realpath` never yields shell metacharacters — true). XXE is largely mitigated by `libxml_disable_entity_loader(true)` on PHP ≤7.x; residual risk depends on libxml/PHP version — labeled Potential. Open-redirect is *not* present because `transferRelativeURI` re-anchors to the app origin.

## Unknowns / needs further investigation
- **SEC-016 (SQLi via DataGrid tag filter `IN (...)`):** requires a runtime trace to confirm an unprivileged request can reach `lib/Candidates.php:2250` with non-numeric `$arguments`. Static reachability is plausible but not proven.
- **`scripts/makeBackup.php` web exposure:** it opens `php://output` when not run under CLI (`:36-40`) and acts on `$_SERVER['argv'][1]`; whether the deployed web server can invoke it (and pass an argv/GET) needs runtime confirmation.
- **XXE residual:** confirm the target PHP/libxml versions in production to determine whether `LIBXML_NOENT|LIBXML_XINCLUDE` (`lib/DocumentToText.php:417`) is exploitable.
- **`ENABLE_DEMO_MODE` in production:** if enabled, `Login.tpl:90-91` exposes demo creds in page source; confirm deployment default.
- **Careers portal enabled state:** stored-XSS/template-injection impact of SEC-005/careers templates depends on whether the public portal (`candidateRegistration`, template editing) is enabled per site.

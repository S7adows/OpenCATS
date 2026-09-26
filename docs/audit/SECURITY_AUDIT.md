# OpenCATS — Security Assessment
Complete edition · 2026-09-26 · code at d607279 (OpenCATS 0.9.7.4)

## Scope and method

- **Inspected (static, read-only):** request pipeline (`index.php`, `ajax.php`, `careers/index.php`, `lib/ModuleUtility.php`, `lib/UserInterface.php`, `lib/AJAXInterface.php`), authentication and sessions (`lib/Users.php`, `lib/Session.php`, `lib/LDAP.php`, `modules/login/`), DB layer and grids (`lib/DatabaseConnection.php`, `lib/DataGrid.php`, `lib/Candidates.php`), files (`lib/FileUtility.php`, `lib/Attachments.php`, `modules/attachments/`, `.htaccess` files), the public surface (`modules/careers/`, `modules/toolbar/`, `modules/graphs/`, installer, web-root scripts), all 32 AJAX handler files, templates, `config.php`, `constants.php`, `db/`, `test/data/`, `docker/`.
- **Commands:** `grep`/`sed -n`/`awk` for every citation; a loop over `ajax/*.php modules/*/ajax/*.php` to list handlers without `SecureAJAXInterface`; a template census with `grep -o`; read-only `php -r` checks (PHP 8.4 CLI): the DataGrid regex, `isset()` on a failed query result, a replica of the MIME lookup, `htmlspecialchars()` with a `FALSE` charset, `md5()` of seed passwords.
- **Runtime evidence used (Phase 0.5, PHP 7.2.16 / nginx 1.17.3):** `docs/baseline/KNOWN_RUNTIME_ERRORS.md` RT-02/03/04/05/07/09/15/17; `SMOKE_TEST.md` rows 1, 11, 13, 14, 15 and steps #02, #04, #05, #29, #52, #77, #85, #86, #88; `CURRENT_UI_MAP.md` login row; `ENVIRONMENT.md:37-38`, `:65-67`; `INSTALLATION.md:68`; `evidence/final-run/php_errors.log` and `results.json`.
- **Not done:** no runtime security testing of any kind (no crafted requests, no payloads, no scanners); the smoke run used only the administrator account, so multi-level permission behaviour is untested; no CVE-by-CVE dependency mapping (see `DEPENDENCY_AUDIT.md`). Audit tooling (`.github/workflows/preview.yml`, `docs/baseline/preview/`, `docs/baseline/env/`) is not product and was not assessed.
- **Label convention:** the confirmation label describes the finding's core claim. Where a finding also mentions a side point that was inferred, that point is marked "(inference)". Weaknesses are described defensively; no exploit detail is given.

## Summary

| ID | Title | Severity | Confirmation |
|---|---|---|---|
| SEC-001 | Passwords stored as unsalted MD5; plaintext hashed inside SQL | HIGH | Runtime |
| SEC-002 | No working or safe password reset; forgot-password is a public fatal error | HIGH | Runtime |
| SEC-003 | Default login `admin`/`admin` never forced to change; credential helpers in login page | CRITICAL | Runtime |
| SEC-004 | No CSRF protection; state changes accepted via GET | HIGH | Static |
| SEC-005 | Stored and reflected XSS from inconsistent output escaping | HIGH | Static |
| SEC-006 | LDAP: unescaped filters, no TLS by default, public test directory in config | MEDIUM | Static |
| SEC-007 | Session ID not regenerated at login; session cookie attributes left to PHP defaults | HIGH | Partial |
| SEC-008 | Stored attachments reachable without authorization (direct URLs; site-unscoped handler) | HIGH | Runtime |
| SEC-009 | Uploads served inline with an extension-derived type; HTML uploads allowed | HIGH | Partial |
| SEC-010 | Unauthenticated toolbar and installer surfaces | MEDIUM | Static |
| SEC-011 | `eval()` of hook, grid, migration and careers strings; `unserialize()` of stored data | MEDIUM | Static |
| SEC-012 | Error output exposes stack traces, paths, call arguments and request data, incl. to anonymous visitors | MEDIUM | Runtime |
| SEC-013 | No access-level ceiling when administrators create or edit users | MEDIUM | Static |
| SEC-014 | No login throttling, lockout or abuse controls | MEDIUM | Static |
| SEC-015 | The application sets no security headers; protection depends on the web server | MEDIUM | Runtime |
| SEC-016 | SQL injection in DataGrid `ORDER BY` and tag filter, reachable by any logged-in user | CRITICAL | Static |
| SEC-017 | Outbound calls: unauthenticated ZIP lookup, résumé text over HTTP to a third party, phone-home | MEDIUM | Static |
| SEC-018 | Secrets and unsafe defaults committed in `config.php`; dead ECB crypto class | MEDIUM | Static |
| SEC-019 | End-of-life client libraries on back-office pages | MEDIUM | Partial |
| SEC-020 | Predictable names and web-root locations for temp files and backups | MEDIUM | Static |
| SEC-021 | No idle or absolute session timeout; single-session control off and partial | LOW | Static |
| SEC-022 | EEO and candidate PII available to every logged-in user via reports and export; no read audit | MEDIUM | Static |
| SEC-023 | Shipped Docker Compose exposes DB admin tools with known passwords and serves the whole repository | MEDIUM | Static |
| SEC-024 | Public careers apply trusts a client-supplied `candidateID` (unauthenticated overwrite) | CRITICAL | Static |
| SEC-025 | Careers registered-candidate identity is a forgeable cookie; applicant PII kept in a plain cookie | HIGH | Static |
| SEC-026 | AJAX handlers check login but not access level | HIGH | Static |
| SEC-027 | DataGrid identifier sanitizer is a no-op: relative include and arbitrary class instantiation | HIGH | Static |
| SEC-028 | Unauthenticated maintenance and operations entry points | MEDIUM | Static |
| SEC-029 | Session identifier copied into page HTML, AJAX bodies, the database and a second cookie | MEDIUM | Static |
| SEC-030 | Absolute URLs built from the client's Host header: server-side fetch and recruiter e-mail links | MEDIUM | Runtime |
| SEC-031 | CSV exports do not neutralise spreadsheet formulas | MEDIUM | Static |

31 findings — 3 CRITICAL / 10 HIGH / 17 MEDIUM / 1 LOW · Runtime 7 / Static 21 / Partial 3 / Unverified 0 (no withdrawn or merged stubs).

---

## 1. Authentication

### SEC-001 — Passwords stored as unsalted MD5; plaintext hashed inside SQL
*Confirmation: **Runtime** · Phase 0 severity: CRITICAL → now HIGH (use of the weakness needs a copy of the `user` table or DB logs first; the scale places weaknesses with a precondition at HIGH) · Related: DB-009, API-016, SEC-003, SEC-016*

- **Confirmed fact:** Local passwords are stored as bare `md5()` hex digests with no salt and no work factor. Login and password change compare digests with `!==` (not a constant-time comparison). Password changes send the plaintext inside SQL text (`password = md5(%s)`), so hashing happens in the database.
- **Evidence:**
  - `lib/Users.php:93` — `add()` stores `md5($password)` (or the LDAP sentinel `_LDAPUSER_`).
  - `lib/Users.php:679`, `:840` — `!== md5(...)` checks in change-password and login.
  - `lib/Users.php:701`, `:755` — `UPDATE ... password = md5(%s)` with the plaintext as the SQL literal.
  - `modules/install/Schema.php:1328-1330` — migration 364 hashes seeded plaintext passwords in place.
  - Runtime: the seed stores plaintext `admin` (`db/cats_schema.sql:1108`) and after install `admin`/`admin` logs in (#05; `SMOKE_TEST.md` row 1). With the comparison at `lib/Users.php:840` this works only when the stored value is `md5('admin')`, which `INSTALLATION.md:68` also records. The stored hash itself is not in the evidence set.
  - `php -r 'echo md5("admin");'` → `21232f297a57a5a743894a0e4a801fc3`, the value shipped in `test/data/test.sql:1618`.
- **Impact:** Anyone who obtains the `user` table (through SEC-016, a backup — SEC-008/SEC-020, a DB dump, or a MySQL general log that received plaintext from `:701`/`:755`) can recover most passwords quickly. Reused passwords then open other systems.
- **Severity:** HIGH — serious weakness with a precondition (read access to the user table or DB logs).
- **Recommendation:** Store passwords with a salted, adaptive algorithm (PHP's `password_hash` family) and rehash legacy MD5 rows at next login. Hash in PHP, never in SQL text, so plaintext does not reach DB logs or error output.
- **Unknown / needs further validation:** Whether production MySQL servers have the general or slow query log enabled (needs deployment inspection); how many production rows are still legacy MD5 (all of them, unless patched locally).

### SEC-002 — No working or safe password reset; forgot-password is a public fatal error
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-03, RT-13, API-011, SEC-012*

- **Confirmed fact:** The forgot-password form is reachable without login. Its handler calls `Users::getPassword()`, which does not exist, and uses `PASSWORD_RESET_SUBJECT`/`PASSWORD_RESET_BODY`, which are never defined. The request ends in an uncaught `Error`, shown to the anonymous visitor with a stack trace. The intended design is to e-mail the user's current password (`FORGOT_PASSWORD_BODY` "Your current password is %s."), which MD5 storage makes impossible anyway. There is no other self-service recovery path.
- **Evidence:**
  - `modules/login/LoginUI.php:43` (login module does not require authentication), `:57-65` (POST routes to `onForgotPassword()`), `:448-475` (handler; `getPassword()` at `:455`; constants at `:460-461`).
  - `grep -rn "function getPassword"` → only `lib/Session.php:366`, `test/features/bootstrap/FeatureContext.php:445` and SimpleTest; `grep -rn PASSWORD_RESET_` → only the two uses above; `config.php:172-174` defines `FORGOT_PASSWORD_*` instead.
  - Runtime: #04 — `Fatal error: Uncaught Error: Call to undefined method Users::getPassword() in /var/www/public/modules/login/LoginUI.php:455` with stack trace (RT-03; first entry of `evidence/final-run/php_errors.log`; screenshot `04-15-email-forgot-password-submit-for-admin.png`). The page before it misses two images (#03, RT-13).
- **Impact:** Locked-out users depend on an administrator. Any anonymous visitor can trigger a fatal error that discloses server paths (SEC-012). Repairing the flow "as designed" would mail credentials in clear text.
- **Severity:** HIGH — the account-recovery workflow is broken and its intended design is unsafe.
- **Recommendation:** Remove the password-mailing design (handler and `FORGOT_PASSWORD_*` constants). If recovery is offered, it should use single-use, expiring reset links, give the same response whether or not the account exists, and be rate-limited.
- **Unknown / needs further validation:** None for the defect itself. Whether any deployment carries a local patch for `Users::getPassword()` is unknown.

### SEC-003 — Default login `admin`/`admin` never forced to change; credential helpers in login page
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: DB-009, DB-024, RISK-003, SEC-001*

- **Confirmed fact:** A fresh install accepts `admin`/`admin` for a ROOT (500) account. The first-login password wizard and the `newInstallPassword` redirect fire only when the typed password equals `DEFAULT_ADMIN_PASSWORD` (`cats`), so `admin`/`admin` is never prompted. The login page's JavaScript always defines `defaultLogin()` (fills and submits `admin`/`cats`) and `demoLogin()` (fills and submits `DEMO_LOGIN`/`DEMO_PASSWORD` = `john@mycompany.net`/`john99` from `config.php`); `defaultLogin()` runs automatically when the URL carries a `defaultlogin` parameter.
- **Evidence:**
  - `db/cats_schema.sql:1108` — user 1 `admin`, password `'admin'`, access 500, `can_change_password=1`; `modules/install/Schema.php:1329` hashes it.
  - `constants.php:178` (`DEFAULT_ADMIN_PASSWORD 'cats'`); `modules/login/LoginUI.php:332`, `:392-395` — the only triggers of the password wizard and redirect; `modules/install/ajax/ui.php:1048` — the installer's default-login check also looks for `cats` (DB-009).
  - `modules/login/Login.tpl:88-99` (helpers, inside a condition true for every normal page), `:101-103` (auto-call); `config.php:188-197` (tester and demo credentials).
  - Runtime: `SMOKE_TEST.md` row 1 and #05 (`admin/admin` → Dashboard, no password prompt); `INSTALLATION.md:68`; `CURRENT_UI_MAP.md` login row (helpers present in page JS; #01, `S6`).
- **Impact:** Any install whose operator did not change the password by hand is open to anyone who can reach the login page, with ROOT rights (all records, users, settings and backups). The page source advertises credential pairs; the demo pair works only where that account exists.
- **Severity:** CRITICAL — an unauthenticated actor can take over the highest-privilege account on default installs.
- **Recommendation:** Ship no usable default password (generate one at install, or force a change before any other action whatever the initial value), and remove credential-filling helpers and demo/tester credentials from shipped templates and configuration.
- **Unknown / needs further validation:** How many deployed instances still use the default (needs a deployment survey). Installs created from the demo dataset use `admin`/`cats`, but that path is unusable on PHP 7.2 (RT-01).

### SEC-006 — LDAP: unescaped filters, no TLS by default, public test directory in config
*Confirmation: **Static** · Phase 0 severity: HIGH → now MEDIUM (LDAP is off by default — `AUTH_MODE 'sql'`; filter manipulation cannot bypass the password bind; an encrypted `ldaps://` URI can be configured) · Related: API-016, SEC-018*

- **Confirmed fact:** In `ldap` or `sql+ldap` mode the typed username is concatenated into the search filter without escaping and into the bind-DN template. The connection gets no StartTLS; the shipped settings point to a public third-party test directory (`ldap.forumsys.com`, port 389) with a published bind password. The first returned entry is used for the password bind without checking how many entries matched. Unknown LDAP users are auto-created **disabled** (`LOGIN_PENDING_APPROVAL`). Empty passwords are rejected before LDAP is contacted.
- **Evidence:**
  - `lib/LDAP.php:40` (`ldap_connect(LDAP_HOST, LDAP_PORT)`), `:46-49` (only protocol/referral options)
  - `:68`, `:130` (filter `LDAP_ATTRIBUTE_UID . '=' . $username`)
  - `:75-78` (`$result[0]` then bind with the user's password)
  - `:95-97` (DN built with `strtr(LDAP_ACCOUNT, …)`)
  - `config.php:48` (`AUTH_MODE 'sql'`), `:266-275` (host, port, base DN, bind DN/password, account template)
  - `lib/Users.php:792` (empty password rejected), `:823-835` (routing on the `_LDAPUSER_` sentinel), `:846-851` (auto-create disabled)
- **Impact:** With LDAP enabled on the defaults, directory passwords cross the network in clear text, and an operator who enables LDAP without editing the host authenticates users against an outside party's directory. A crafted username can change which entry is matched, but a successful bind still needs that entry's password (inference from the code; not tested).
- **Severity:** MEDIUM — limited to installs that enable LDAP.
- **Recommendation:** Escape usernames for LDAP filters and DNs, require an encrypted connection whenever LDAP is enabled, accept exactly one matching entry, and ship the LDAP settings empty.
- **Unknown / needs further validation:** Behaviour against real directory servers with unusual usernames needs authorized testing on an isolated instance with a test directory; whether deployments use LDAP or set `ldaps://` in `LDAP_HOST` is unknown.

### SEC-014 — No login throttling, lockout or abuse controls
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: API-014, SEC-001, SEC-003*

- **Confirmed fact:** Login attempts are unlimited. `isCorrectLogin()` checks credentials and `processLogin()` records each outcome in `user_login`, but nothing counts failures, delays or locks. No challenge (CAPTCHA) is used on login, forgot password, toolbar login or careers apply; an unused CAPTCHA renderer exists. The careers form sends its confirmation template to whatever address the applicant types.
- **Evidence:**
  - `lib/Users.php:782` (`isCorrectLogin`)
  - `lib/Session.php:642` (`processLogin`; history writes at `:733`, `:751`, `:769`, `:860`)
  - `grep -i "lockout|throttl|failed_attempt|captcha"` over `lib/`, `modules/`, `index.php`, `ajax.php` → only `lib/GraphGenerator.php:432` (unused generator)
  - `modules/toolbar/ToolbarUI.php:95-103`
  - `modules/careers/CareersUI.php:1518-1523` (API-014)
  - runtime #02: a wrong password returns the generic message "Invalid username or password" (only one failure was tried)
- **Impact:** Online password guessing and credential stuffing are unimpeded, which weighs more because of SEC-001 and SEC-003. The careers form can be used to send mail to arbitrary addresses and to fill the database.
- **Severity:** MEDIUM — enables other attacks; no direct compromise on its own.
- **Recommendation:** Limit failed logins per account and per source with increasing delays, and put rate limits (and an optional challenge) on public forms that write data or send mail.
- **Unknown / needs further validation:** Whether production deployments sit behind a proxy or WAF that rate-limits (needs deployment inspection).

### SEC-025 — Careers registered-candidate identity is a forgeable cookie; applicant PII kept in a plain cookie
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: API-004, API-003, SEC-024, SEC-022*

- **Confirmed fact:** With candidate registration enabled (off by default), a returning candidate is identified only by matching template fields (by default e-mail, last name and ZIP) taken from POST or from the client cookie `cats<siteID>cw`; no secret is involved. The profile handler then updates the matched candidate and deletes the attachment named by `attachmentID` from the query string, and `Attachments::delete()` is scoped only by site. Separately, **every** careers application (registration on or off) writes the applicant's name, e-mail, address, city, state, ZIP and phone numbers into that cookie in clear text for one hour (two weeks with "remember me"), with no Secure, HttpOnly or SameSite attribute.
- **Evidence:**
  - `lib/CareerPortal.php:79` (`candidateRegistration => '0'`)
  - `modules/careers/CareersUI.php:1629-1735` (`isCandidateRegistered`), `:1737-1763` (cookie name and parsing), `:291`, `:340` (`attachmentID` from `$_GET`), `:1265-1277` (cookie written on every apply, built with `eval`), `:354`, `:1728` (two-week cookie)
  - `lib/Attachments.php:304-335` (delete by `site_id` only)
- **Impact:** With registration on, anyone who knows a candidate's e-mail, last name and ZIP can edit that profile and delete any attachment on the site, including other résumés and backup records. With registration off, applicant PII still sits in the browser, readable by scripts, sent over HTTP, and visible to the next user of a shared computer.
- **Severity:** HIGH — unauthenticated profile takeover and file deletion, conditional on a non-default setting.
- **Recommendation:** Identify returning candidates only through a verified server-side session (for example an e-mailed one-time link), scope any file change to that candidate's own records, and stop storing applicant PII in cookies.
- **Unknown / needs further validation:** Registration was not covered by the smoke run; needs authorized testing on an isolated instance with registration enabled.

---

## 2. Session management

### SEC-007 — Session ID not regenerated at login; session cookie attributes left to PHP defaults
*Confirmation: **Partial** · Phase 0 severity: unchanged · Related: API-006, SEC-029, SEC-004, SEC-005*

- **Confirmed fact:** No `session_regenerate_id()` call exists anywhere. No `session_set_cookie_params()`, `ini_set('session.*')` or equivalent runs before any `session_start()`. The session cookie is named `CATS`. The identifier issued before login therefore becomes the authenticated one, and the cookie's HttpOnly, Secure and SameSite attributes, and strict mode, are whatever the PHP configuration provides.
- **Evidence:**
  - `grep -rn "session_regenerate_id|session_set_cookie_params|cookie_httponly|cookie_samesite|use_strict_mode"` over first-party PHP → no hits
  - `index.php:74-75`, `lib/AJAXInterface.php:206-207`, `QueueCLI.php:56` (`session_name` + `session_start`)
  - installer `modules/install/ajax/ui.php:240`, `:520`, `:936`, `:980`
  - `config.php:151` (`CATS_SESSION_NAME 'CATS'`)
  - `ENVIRONMENT.md:37` — the baseline image runs without a `php.ini` (built-in defaults)
- **Impact:** (Inference — the Partial part.) PHP's built-in defaults leave `session.cookie_httponly`, `session.cookie_secure` and `session.use_strict_mode` off and `session.cookie_samesite` empty, so on the baseline image the `CATS` cookie would carry none of these attributes; no `Set-Cookie` header was captured. If an attacker can place a session identifier in a victim's browser before login (sibling-subdomain cookie, network position on plain HTTP), the attacker shares the victim's session afterwards. Without HttpOnly any XSS (SEC-005, SEC-009) can read the cookie; without SameSite, cross-site requests carry it (SEC-004); without Secure it travels over HTTP.
- **Severity:** HIGH — session takeover with a precondition (cookie planting, network position or XSS).
- **Recommendation:** Issue a new session identifier at login and on privilege change, enable strict session mode, and set HttpOnly, SameSite and (under TLS) Secure explicitly in the application instead of relying on server defaults.
- **Unknown / needs further validation:** Actual cookie attributes and session settings on the baseline image and in production — capture response headers and `php -i` on an isolated instance.

### SEC-021 — No idle or absolute session timeout; single-session control off and partial
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: SEC-029*

- **Confirmed fact:** The application never expires a session for inactivity or age; lifetime is left to PHP garbage collection and the browser. `ENABLE_SINGLE_SESSION` is false by default. When enabled, `checkForceLogout()` compares the DB `session_cookie` value with the current session but exempts demo users, READ-level and ROOT-level accounts, the user `cognizo` and site 200.
- **Evidence:**
  - `config.php:183`
  - `lib/Session.php:171-234`
  - `lib/Session.php:626` / `lib/Users.php:1014` (`updateLastRefresh` records activity; nothing compares it with a limit)
  - grep for `gc_maxlifetime|last_activity` → no first-party hits
- **Impact:** Sessions on shared or unattended machines stay valid; a stolen session identifier stays useful longer.
- **Severity:** LOW — hygiene weakness that lengthens exposure from other findings.
- **Recommendation:** Enforce server-side idle and absolute lifetimes, and end all sessions of a user on logout and password change.
- **Unknown / needs further validation:** Effective `session.gc_maxlifetime` in deployments.

### SEC-029 — Session identifier copied into page HTML, AJAX bodies, the database and a second cookie
*Confirmation: **Static** · New in this edition · Related: SEC-007, API-006, SEC-005, SEC-016, SEC-020*

- **Confirmed fact:** `Session::getCookie()` returns `CATS=<session id>`. This value is (a) written into the HTML and JavaScript of many back-office pages (template variable `sessionCookie`, inline `onclick` handlers, DataGrid output), (b) appended to every AJAX POST body by `js/lib.js`, (c) stored in plain text in `user.session_cookie` at each login, and (d) set as a second cookie named `session_cookie` with a one-hour expiry, `Secure` and `HttpOnly` hard-coded and no SameSite (a `$samesite = 'Strict'` variable is defined but never used).
- **Evidence:**
  - `lib/Session.php:555-558` (`getCookie()`), `:893-903` (second cookie; `$secure = true` fixed), `:1009-1021` (`UPDATE user SET session_cookie`)
  - `modules/candidates/Show.tpl:521` (echoed into `onclick`)
  - `lib/DataGrid.php:1730`, `:1851`, `:2182`, `:2402`, `:2549`
  - `ajax/getPipelineJobOrder.php:112`
  - 14 `assign('sessionCookie', …)` calls in `modules/{candidates,joborders,contacts,settings,lists}`
  - `js/lib.js:332-335`, `:349-351`
  - `db/cats_schema.sql:1108` shows the stored format (`CATS=e29233…`)
- **Impact:** Setting HttpOnly on the real cookie (SEC-007) would not stop injected script from reading the identifier from the page. Anyone who can read the `user` table (SEC-016, backups SEC-020) gets each user's latest session identifier, usable while that session lives. Request bodies that contain it can end up in proxy or application logs. On plain HTTP, browsers reject the second cookie because of its fixed `Secure` flag (inference from browser behaviour; not captured).
- **Severity:** MEDIUM — turns XSS and DB-read weaknesses into session hijacking.
- **Recommendation:** Keep the session identifier only in the session cookie; if single-session enforcement needs a DB marker, use a separate random value stored hashed, and remove the redundant cookie.
- **Unknown / needs further validation:** Whether PHP in production accepts session identifiers from request bodies (`session.use_only_cookies`, on by default) and whether any logs capture POST bodies — needs configuration review.

---

## 3. Authorization

### SEC-024 — Public careers apply trusts a client-supplied `candidateID` (unauthenticated overwrite)
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: API-002, API-003, RISK-002, RT-04, RT-12*

- **Confirmed fact:** The public apply form round-trips a hidden `candidateID`. On submit the handler takes it from POST and, when present, updates that candidate with the submitter's data (names, contact data, key skills, source, EEO fields, owner) before attaching the file, adding the pipeline row and logging activity. No login, token or ownership check is involved, and the path does not depend on candidate registration. The same handler also takes a pending-upload file name from POST (`file`) and attaches that file from the site's careers upload folder, then deletes the source.
- **Evidence:**
  - `modules/careers/CareersUI.php:699`, `:710` (hidden field), `:725-726` (read from `$_POST`), `:750`, `:1190`, `:1279-1293` (`$candidates->update($candidateID, …)`), `:1376-1392` (`$_POST['file']` → `getUploadFilePath` → attach)
  - `lib/Candidates.php:249-254` (update scoped by `site_id` only)
  - `lib/FileUtility.php:537-552` (path confined to the upload folder)
  - `lib/Attachments.php:1243-1261` (copy, then unlink source)
  - runtime context only: #85/#86 show the anonymous apply handler writes candidate, pipeline and activity rows before the mail step fails (RT-04), while the overwrite path itself was not exercised
- **Impact:** Anyone on the internet who can see one public job can overwrite personal data, EEO data and ownership of existing candidates by ID and attach files to them. API-003's misaligned arguments additionally corrupt EEO fields and trigger mail. A pending upload of another applicant can be attached to the wrong application and removed from its own.
- **Severity:** CRITICAL — unauthenticated modification of core recruiting data.
- **Recommendation:** Never accept candidate identity or file references from the public client; create a new candidate (or a duplicate link for review) and bind uploads to the submitting session on the server.
- **Unknown / needs further validation:** End-to-end confirmation needs authorized testing on an isolated instance with the careers site enabled; whether production data already contains unexplained overwrites needs a review of `history` and candidate ownership changes.

### SEC-008 — Stored attachments reachable without authorization (direct URLs; site-unscoped handler)
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-17, SEC-009, SEC-020, RISK-007*

- **Confirmed fact:**
  - Files are stored as `attachments/site_<id>/<group>/<md5 directory>/<file>` inside the web root. Under the repository's nginx image an unauthenticated request for such a path returned the file (RT-17). The careers flow writes that raw path into the activity note of each application, so every back-office user who can see the activity holds a link that works without a session.
  - The download handler loads the record with site checking disabled and authorizes only by comparing `md5(directory_name)` from the database with the `directoryNameHash` URL parameter. The same hash is embedded in every download link. There is no check of the user's site or of record-level permission.
  - `attachments/.htaccess` and `upload/.htaccess` contain no deny rule: they switch off CGI execution and directory indexes and explicitly grant access to the listed extensions.
  - Careers uploads wait in `upload/<siteID>/careerportaladd/` under the applicant's original file name until the application is submitted. No other code references that folder, so files of abandoned applications are never removed.
- **Evidence:**
  - RT-17 (`KNOWN_RUNTIME_ERRORS.md:137-141`), `ENVIRONMENT.md:66`
  - `modules/careers/CareersUI.php:1442-1453` (raw `<a href="…">` to the stored file in the activity note)
  - #29 (download links carry `directoryNameHash`, served with 200)
  - `modules/attachments/AttachmentsUI.php:43` (login required), `:83-92` (`new Attachments(-1)`, `get($attachmentID, false)`, hash comparison), `:97`
  - `lib/Attachments.php:579-621` (`get()` puts `urlencode(md5($rs['directoryName']))` in the URL)
  - `lib/FileUtility.php:246` (directory names from `md5(rand() . time() …)`)
  - `attachments/.htaccess:1-9`, `upload/.htaccess:1-10`
  - `lib/FileUtility.php:468-492`, `:576` (upload folder; original name kept)
- **Impact:** (Inference) because the `.htaccess` files deny nothing, direct reads are not blocked on Apache either (Apache was not run), and the `upload/` folder is likely reachable the same way (not requested in the baseline). Résumés and other candidate documents can be read by anyone who holds or later obtains the path (browser history, forwarded links, logs), with no session, even after the user who saw it loses access. On multi-site installs, a user of one site can fetch another site's files through the handler if they obtain an ID and hash. The same handler serves full backup archives (SEC-020).
- **Severity:** HIGH — unauthenticated access to candidate documents, with the precondition of knowing a path.
- **Recommendation:** Keep stored files outside the web root and serve them only through a handler that checks the session, the site and record permission; do not use a value derived from a stored field as the access secret, and link to the handler instead of raw paths.
- **Unknown / needs further validation:** Guessability of directory names, direct reachability of `upload/`, and Apache behaviour all need authorized testing on an isolated instance.

### SEC-026 — AJAX handlers check login but not access level
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: API-005, SEC-004, SEC-005*

- **Confirmed fact:** `SecureAJAXInterface` only verifies that a user is logged in. State-changing handlers do no access-level check, while the page UI offers the same actions only to higher levels. Examples: delete and edit activity; create, rename and delete lists and add list items; send a test e-mail with any sender address to any recipient through the configured relay; write column preferences; mass-import items; and the settings tag add/delete/update actions (the tags page itself requires SA).
- **Evidence:**
  - `lib/AJAXInterface.php:202-216`
  - `ajax/deleteActivity.php:33-47`
  - `ajax/editActivity.php:36`, `:113`
  - `modules/lists/ajax/deleteList.php:36-51` and sibling handlers
  - `ajax/testEmailSettings.php:33`, `:57-58`, `:86-93`
  - `ajax/setColumnWidth.php:32-46`
  - `modules/import/ajax/processMassImportItem.php:62-65`
  - `modules/settings/SettingsUI.php:675-700` (no check) vs `:234` (SA check on the page)
  - UI gating `modules/candidates/Show.tpl:611`, `modules/contacts/Show.tpl:287`
- **Impact:** A READ-only user can destroy activity history, lists and tags, and can use the SMTP relay to send mail under any sender name. Combined with SEC-004 this is reachable from any website a logged-in user visits.
- **Severity:** HIGH — low-privileged destruction of data and abuse of the mail relay.
- **Recommendation:** Enforce in each AJAX handler the same access level as the page action it mirrors, declared per handler and checked centrally.
- **Unknown / needs further validation:** Only the administrator was used in the smoke run; per-level behaviour needs authorized testing on an isolated instance.

### SEC-013 — No access-level ceiling when administrators create or edit users
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: SEC-004, SEC-026*

- **Confirmed fact:** The add-user and edit-user POST handlers are gated at Site Administrator (400) but store the `accessLevel` sent in the request without comparing it with the actor's own level. An SA can therefore create accounts at, or raise accounts to, MULTI_SA (450) or ROOT (500). Only edits of one's own account are pinned. The setup wizard's GET-based add-user action does clamp to below SA.
- **Evidence:**
  - `modules/settings/SettingsUI.php:376-395` (SA gates), `:1142`, `:1151`, `:1192` (add), `:1331-1337`, `:1372-1376`, `:1395` (edit; self pin), `:3010-3011` (wizard clamp)
  - `lib/Users.php:88-124` (`add()` stores the value)
  - `constants.php:74-82` (levels)
- **Impact:** Vertical escalation from SA to ROOT. Through SEC-004 an outside site can drive an SA's browser to do it.
- **Severity:** MEDIUM — needs an SA account or an SA's browser.
- **Recommendation:** Reject any requested level above the acting user's real level and reserve ROOT assignment to ROOT.
- **Unknown / needs further validation:** Whether the edit form lists ROOT for SAs does not change the server-side gap; authorized testing on an isolated instance would confirm.

### SEC-010 — Unauthenticated toolbar and installer surfaces
*Confirmation: **Static** · Phase 0 severity: HIGH → now MEDIUM (a working install always has `INSTALL_BLOCK`, because `index.php` sends every request to the installer without it, so the config-writing installer is exposed only before installation completes; the remaining items disclose little) · Related: API-008, API-009, API-014, SEC-028, SEC-017*

- **Confirmed fact:**
  - The toolbar module requires no authentication. `a=getLicenseKey` prints `LICENSE_KEY` (the committed shared default). Toolbar login reads `CATSUser`/`CATSPassword` from the query string and calls `processLogin()`, so credentials land in URLs and logs, and a third-party page can log a browser into an account of the third party's choosing. `attemptLogin` calls a method that does not exist.
  - The installer AJAX `install:ui` has no authentication check and, whenever `INSTALL_BLOCK` is absent, writes request values into `config.php` by string concatenation; its form is pre-filled with the current DB user and password. `installwizard.php` (the page that drives `install:ui`) and `installtest.php` are served regardless of `INSTALL_BLOCK`; `installtest.php` runs environment and DB connectivity checks for anonymous visitors and prints the results, including `mysqli_connect_error()`.
  - Correction: Phase 0 listed the graphs module as information disclosure. The public graph actions render images from request data only; every graph that reads database statistics requires login. The public actions are a resource-use surface (API-014).
- **Evidence:**
  - `modules/toolbar/ToolbarUI.php:46`, `:59-61`, `:83-85`, `:95-103`, `:282-285`
  - `config.php:31`
  - `modules/install/ajax/ui.php:30-33`, `:54-55`, `:120-125`, `:154-155`
  - `lib/CATSUtility.php:142-167` (`changeConfigSetting` writes `define('%s', %s);`)
  - `index.php:44-48`
  - `installtest.php:156-161`
  - `lib/InstallationTests.php:393-419`
  - `modules/graphs/GraphsUI.php:48`, `:80-99`, `:101-134`
- **Impact:** Credentials exposed through URLs; forced login into a chosen account; takeover of `config.php` (and so code execution) on any web-reachable copy that has not finished installation; environment details disclosed to anonymous visitors.
- **Severity:** MEDIUM — the serious part needs an uninstalled, reachable copy; the rest is limited disclosure.
- **Recommendation:** Remove the obsolete toolbar module, keep installer and test scripts out of production packages or deny them at the web server, and require an operator secret before the installer changes configuration.
- **Unknown / needs further validation:** Whether release packages include `installtest.php`/`installwizard.php` and whether production web-server rules hide them (the audit-only preview gateway hides them, `PREVIEW_ENVIRONMENT.md:89`, but that is not product).

### SEC-028 — Unauthenticated maintenance and operations entry points
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: API-008, SEC-010, SEC-011, SEC-020*

- **Confirmed fact:** `ajax.php?f=install:maint` has no authentication; it deletes `modules.cache` and includes `index.php` in maintenance mode, which runs pending module migrations (SQL and `PHP:` code blocks) one step per request. `QueueCLI.php` and `rebuild_old_docs.php` sit in the web root with no CLI guard: the first runs queued tasks (including reminder e-mails), the second re-converts unindexed attachments and prints stored file names. `scripts/makeBackup.php` has explicit non-CLI output handling and starts a backup whenever `$_SERVER['argv'][1]` is set. `install:attachmentsReindex` requires login once `INSTALL_BLOCK` exists. A census of the 32 handler files finds five without `SecureAJAXInterface`: `getParsedAddress`, `getReportHTML` (empty file), `zipLookup`, `install:maint`, `install:ui`.
- **Evidence:**
  - `modules/install/ajax/maint.php:30-37`
  - `lib/ModuleUtility.php:517-546` (`eval($PHPCode)` at `:542`)
  - `modules/install/ajax/attachmentsReindex.php:32-35`
  - `QueueCLI.php:34-101`
  - `rebuild_old_docs.php:14-65` (prints at `:32`, `:37`, `:44`, `:51`)
  - `scripts/makeBackup.php:37-62`, `:87-111`
- **Impact:** Anonymous users can trigger migration steps, CPU-heavy document conversion and the reminder queue, and learn stored file names.
- **Severity:** MEDIUM — availability and limited disclosure; no direct data read.
- **Recommendation:** Make operations scripts CLI-only or move them out of the web root, and require a ROOT session for maintenance AJAX actions.
- **Unknown / needs further validation:** (Unverified lead) whether a web request can reach `scripts/makeBackup.php` with `argv` populated depends on the deployed `register_argc_argv` setting and web-server rules; needs inspection on an isolated instance.

### Reference: per-action access checks (census)
Core CRUD modules (candidates, companies, contacts, job orders, calendar) check an access level in each action. These modules check none (count of `getUserAccessLevel`/`ACCESS_LEVEL_` references, re-run):

| Module file | `case` labels | Access checks | Note |
|---|---|---|---|
| `modules/reports/ReportsUI.php` | 30 (9 actions plus a period sub-switch) | 0 | EEO report reachable by any logged-in user (SEC-022) |
| `modules/lists/ListsUI.php` | 7 | 0 (2 references are commented out, `:57-58`) | `deleteStaticList`, `removeFromListDatagrid` mutate data; Behat expects READONLY may call `deleteStaticList` (`test/features/GET_POST_requestsSecurity.feature:746`) |
| `modules/activity/ActivityUI.php` | 7 (2 actions plus a period sub-switch) | 0 | read views |
| `modules/home/HomeUI.php` | 5 | 0 | saved-search add/delete are per-user writes |
| `modules/export/ExportUI.php` | 2 | 0 | full candidate export (SEC-022, SEC-031) |
| `modules/tests/TestsUI.php` | 2 | 0 | runs SimpleTest suites against the live DB (API-022) |

Login is enforced by `index.php` for all of these, so these are least-privilege gaps, not anonymous access. Also recorded elsewhere: private calendar events are sent to every user and hidden only in browser JavaScript (FEAT-004, `lib/Calendar.php:137-142`).

---

## 4. Injection (SQL / command / code / LDAP)

LDAP filter injection is covered under SEC-006 (Authentication).

### SEC-016 — SQL injection in DataGrid `ORDER BY` and tag filter, reachable by any logged-in user
*Confirmation: **Static** · Phase 0 severity: MEDIUM (Potential) → now CRITICAL (re-verification found a request-controlled value concatenated into SQL with no validation, reachable by the lowest active access level) · Related: SEC-027, SEC-001, SEC-012, API-007*

- **Confirmed fact:** DataGrid parameters come from the request as JSON: `parameters<instance>` in the query string for page grids, and `p` for the pager AJAX handler and CSV export. `sortBy` is checked against the grid's sortable columns, `filterAlpha` must be a single letter, and `rangeStart`/`maxResults` are cast to integers. `sortDirection` is never validated when `sortBy` is supplied (it is only defaulted when `sortBy` is missing) and is concatenated into `ORDER BY`, and the query is executed. In the candidate grids the tag filter builds `tag_id IN (…)` by joining request-derived arguments without integer casting (and with a hard-coded `site_id = 1`).
- **Evidence:**
  - Request sources: `lib/DataGrid.php:381-385` (GET override of all parameters); `lib/DataGrid.php:295-303` and `ajax/getDataGridPager.php:43-58` (`p` → parameters; handler requires login only).
  - Validation: `lib/DataGrid.php:423-441` (`sortBy` allowlist; `sortDirection` assigned only at `:427`), `:444-465` (integer casts), `:468-474` (`filterAlpha`). `grep -n "'ASC'\|'DESC'" lib/DataGrid.php` shows no validation elsewhere.
  - Sink: `lib/DataGrid.php:1330-1334` (`'ORDER BY ' . sortBy . ' ' . sortDirection` → `getSQL()` → `getAllAssoc()`).
  - Tag filter: `lib/DataGrid.php:1074-1127` (filter string split into arguments), `:1201-1212` (`eval` of `filterRender=#`); `lib/Candidates.php:2244-2251` (`IN (". implode(",",$arguments)."))`); grids pass parameters straight through (`lib/Candidates.php:2282`, `modules/candidates/dataGrids.php:36-38`).
  - Mitigations elsewhere: most queries use `makeQueryString`/`makeQueryInteger` (`lib/DatabaseConnection.php:480-546`); free-text search escapes input (`lib/DatabaseSearch.php:293`); `Search::*` sort values are validated by `SearchPager` (`lib/Pager.php:175-203`, `modules/candidates/CandidatesUI.php:1949-1964`).
- **Impact:** Any authenticated user, including READ-only, can change the SQL of grid queries. Through the SELECT this can expose any table the application's DB account can read: records of all sites and the `user` table with MD5 hashes (SEC-001), which leads to account takeover. `mysqli_query` runs one statement, so adding separate write statements is not possible through this path.
- **Severity:** CRITICAL — a low-privileged account can read the whole database, including credentials.
- **Recommendation:** Validate the sort direction against a fixed set inside DataGrid, integer-cast every ID argument before building IN lists, and stop assembling SQL fragments with `eval`.
- **Unknown / needs further validation:** Exploitability was not tested (no security testing was allowed); needs authorized testing on an isolated instance. Other grids that define `filterRender=#` or `filterHavingRender=#` should be enumerated the same way.

### SEC-027 — DataGrid identifier sanitizer is a no-op: relative include and arbitrary class instantiation
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: API-007, SEC-016, SEC-011*

- **Confirmed fact:** `DataGrid::get()` splits the request identifier on `:` and "sanitizes" the module and class parts with `preg_replace("[^A-Za-z0-9]", "", …)`. Without delimiters, PHP treats `[` and `]` as the delimiters, so the pattern matches only the literal text `^A-Za-z0-9` and removes nothing else. The module part then goes into `include_once('modules/%s/dataGrids.php')` and the class part into `new $class(...)`. The preceding `file_exists` check only raises a notice.
- **Evidence:**
  - `lib/DataGrid.php:265-282`
  - `php -r 'var_dump(preg_replace("[^A-Za-z0-9]", "", "../x/y"));'` → `string(6) "../x/y"`
  - request sources `ajax/getDataGridPager.php:43-58` and `lib/DataGrid.php:295-303` (used by `modules/export/ExportUI.php:135-140`)
  - the dispatcher uses the correct pattern (`ajax.php:78`)
- **Impact:** Any logged-in user can include any file named `dataGrids.php` reachable by relative path and instantiate any loaded class with request-shaped arguments. Code execution depends on placing such a file; uploads cannot do it directly because `.php` is not on the upload allowlist and gets `.txt` appended (`lib/FileUtility.php:192-196`).
- **Severity:** HIGH — authenticated code-loading primitive; full impact depends on a second weakness.
- **Recommendation:** Map DataGrid identifiers through a fixed allowlist of known grids and classes instead of filtering free text.
- **Unknown / needs further validation:** Whether any writable location can hold a file named `dataGrids.php`, and which loaded classes have harmful constructors, needs authorized testing on an isolated instance.

### SEC-011 — `eval()` of hook, grid, migration and careers strings; `unserialize()` of stored data
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: API-017, RISK-016, RT-01, SEC-016, SEC-027*

- **Confirmed fact:** 248 call sites run `eval(Hooks::get(…))`; `Hooks::get()` returns PHP source concatenated from `$_SESSION['hooks']`. `ajax.php` also evaluates hook filters. DataGrid evaluates column render and filter strings; module migrations (`PHP:` blocks) are evaluated on the first request that needs them (RT-01 shows this path failing inside "eval()'d code"); the wizard evaluates page code; the queue builds class instances with `eval`; the careers module evaluates per-field assignments (field names are constants in code). `unserialize()` is applied to `user.column_preferences`, the `modules.cache` file in the web root, and mailer settings.
- **Evidence:**
  - `grep -rho "eval(Hooks::get('[A-Z_]*')"` → 248
  - `lib/Hooks.php:52-72`
  - `ajax.php:118`, `:125-128`
  - `index.php:209`
  - `lib/DataGrid.php:1206`, `:1211`, `:1441`, `:1530`, `:1912`
  - `lib/ModuleUtility.php:542`
  - `modules/wizard/WizardUI.php:181`
  - `lib/QueueProcessor.php:210`
  - `modules/careers/CareersUI.php:280`, `:285`, `:1272`
  - `lib/Session.php:850` (value written by `serialize()` at `:1204`)
  - `lib/ModuleUtility.php:210`
  - `modules/settings/SettingsUI.php:2010`, `:2040`
  - `modules/joborders/JobOrdersUI.php:1462`
- **Impact:** No path from request data into an evaluated string or an unserialized value was found. The pattern turns any write access to the session, `modules.cache` or the relevant DB columns into code execution or PHP object injection, and hides behaviour from static analysis tools.
- **Severity:** MEDIUM — no direct exploit path found; high blast radius when combined with a write primitive.
- **Recommendation:** Replace string evaluation with ordinary calls or registered callbacks, and replace `unserialize()` of stored data with a data-only format.
- **Unknown / needs further validation:** Proving that no request value reaches these sinks needs taint-analysis tooling beyond this review.

### SEC-031 — CSV exports do not neutralise spreadsheet formulas
*Confirmation: **Static** · New in this edition · Related: API-020, SEC-022*

- **Confirmed fact:** Candidate export and DataGrid CSV export only double embedded quotes. Cell values that start with `=`, `+`, `-` or `@` are written unchanged. Public applicants control several exported fields, and the careers input encoding (`htmlspecialchars`) does not change these characters.
- **Evidence:**
  - `lib/Export.php:161`
  - `lib/DataGrid.php:1451`
  - `modules/export/ExportUI.php:77-127`, `:135-140`
  - `lib/UserInterface.php:392`
- **Impact:** When a recruiter opens an export in a spreadsheet program, content supplied by an outside applicant may be evaluated as a formula (for example to send data to an outside address or to raise command prompts, depending on the program and its settings).
- **Severity:** MEDIUM — needs a recruiter action and depends on the spreadsheet program.
- **Recommendation:** Neutralise leading formula characters in exported cells (or offer a format that is not evaluated) and document the behaviour.
- **Unknown / needs further validation:** Behaviour depends on the organisation's spreadsheet software and settings; needs a test with those tools on non-production data.

### Reference: injection classes checked with no finding

| Class | What was checked | Result |
|---|---|---|
| Command injection | `lib/DocumentToText.php:101` (`escapeshellarg(realpath(…))`), `:378` (`exec`); tool paths come from `config.php`; `scripts/makeBackup.php:137-160` builds `exec()` strings from `rand()` and an `(int)` site ID | No request string reaches a shell unescaped. |
| XXE (DOCX/ODT text extraction) | `lib/DocumentToText.php:415-417` | On the supported PHP 7.2 the entity loader is disabled right before `loadXML()`, so no external entity is fetched. Latent: on PHP 8 that call is deprecated and has no effect, and the `LIBXML_NOENT` flag then lets libxml substitute external entities (PHP 8.0 migration notes; external knowledge, not tested). Relevant to any PHP 8 port. |
| E-mail header injection | `lib/Mailer.php` (PHPMailer 6.8.0) | Headers are built by PHPMailer; no raw header concatenation found. The test-mail handler accepts any sender (SEC-026). |
| Open redirect | `modules/login/LoginUI.php:385`, `lib/CATSUtility.php:256-262`, `index.php:249` | Targets are re-anchored to the application's own base URL (built from the Host header — SEC-030); the one absolute target is a fixed constant. No open redirect. |
| Path traversal | `lib/FileUtility.php:166-201`, `:504-527`; `modules/attachments/AttachmentsUI.php:97` | Directory parts are stripped from names; downloads use DB-stored names; `isUploadFileSafe()` removes `..` non-recursively but also checks the path prefix. No traversal found. |

---

## 5. Output encoding / XSS

### SEC-005 — Stored and reflected XSS from inconsistent output escaping
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: API-015, UX-003, SEC-009, SEC-029, SEC-004, DEP-003*

- **Confirmed fact:**
  - Templates mix escaped and raw output. Census re-run over 136 templates: 892 uses of the escaping helper `$this->_()` (`htmlspecialchars`, `lib/Template.php:51-54`); 1,579 `echo`/`<?=` statements, of which 30 wrap the value in an escaping or encoding function and 358 unescaped ones print array or record values. Many record fields are HTML-encoded on input instead (`getSanitisedInput`, about 150 calls in the candidate, company, contact, job-order and careers handlers), so whether a raw echo is exploitable depends on the write path.
  - Verified write-to-render chains with no escaping: saved-list names created through AJAX (`modules/lists/ajax/newList.php:52` → `lib/SavedLists.php:218`, SQL-escaped only) are printed raw at `modules/candidates/Show.tpl:577`; activity notes edited through AJAX are stored as received (`ajax/editActivity.php:69`, `:113`; HTML escaping happens only in browser JavaScript, `js/activity.js:425`) and printed raw at `Show.tpl:603`; administrator-defined extra-field HTML is printed raw (`modules/candidates/Show.tpl:145`, `:215`, `Add.tpl:400`, `Edit.tpl:317`; `modules/companies/Show.tpl:69`, `:126`); questionnaire text (`Show.tpl:347`).
  - Public careers apply page: when redisplayed after the "Upload" step it writes raw POST values into input `value` attributes and the extra-notes textarea (`modules/careers/CareersUI.php:411-416`, `:582-617`) — reflected XSS on an unauthenticated page, triggerable from another site because there is no CSRF protection (SEC-004).
  - Careers page templates are administrator-edited HTML published as-is (a trusted-author feature; `SettingsUI` template editor).
  - Correction: Phase 0 said the `FALSE` third argument of `getSanitisedInput()` breaks encoding. It is the charset argument; PHP falls back to the default charset and encodes correctly (`php -r` check on PHP 8.4). Its real effect is repeated encoding of already-encoded text (UX-003), not an XSS gap.
- **Evidence:**
  - citations inline above
  - `lib/UserInterface.php:388-395` (`getSanitisedInput`)
  - RT-17 shows that the careers flow stores an HTML link inside an activity note by design (`CareersUI.php:1442-1453`)
- **Impact:** A low-privileged user — and, through the careers page, an outside party — can run script in a recruiter's or administrator's session, act as them (SEC-004, SEC-026), read session identifiers from the page (SEC-029) or change data.
- **Severity:** HIGH — script execution in privileged sessions from low-privileged or outside sources.
- **Recommendation:** Escape all dynamic output at render time with context-appropriate encoding, store input unencoded, and treat intentional HTML (extra fields, careers and e-mail templates) as a separate, sanitized and restricted feature.
- **Unknown / needs further validation:** Sink-by-sink confirmation needs authorized testing on an isolated instance; the census is an upper bound (some raw values are integers or were encoded on input).

---

## 6. CSRF

### SEC-004 — No CSRF protection; state changes accepted via GET
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: API-006, SEC-026, SEC-013, SEC-007*

- **Confirmed fact:** No anti-CSRF token exists in first-party PHP, templates or JavaScript. Forms and AJAX calls are authorized by the session cookie alone, and the application sets no SameSite attribute on it (SEC-007). Several destructive or privileged actions work over GET: record deletes, the setup wizard's add-user and delete-user actions (the new user's password travels in the query string), toolbar login, and every `ajax.php` handler (the dispatcher and handlers read `$_REQUEST`).
- **Evidence:**
  - `grep -rlni "csrf|xsrf|nonce|form_token|_token"` over first-party PHP/TPL/JS (vendor, SimpleTest and CKEditor excluded) → no files
  - `modules/candidates/CandidatesUI.php:128`, `:1407-1415` (`onDelete` reads `$_GET['candidateID']`)
  - `modules/companies/CompaniesUI.php:123`, `modules/contacts/ContactsUI.php:125`, `modules/joborders/JobOrdersUI.php:148` (`case 'delete'`)
  - `modules/settings/SettingsUI.php:702-727`, `:3003-3079` (wizard add/delete user from `$_GET`, SA-gated)
  - `ajax.php:63-91`
  - `modules/lists/ajax/deleteList.php:46`
  - `ajax/deleteActivity.php:43`
  - `ajax/setColumnWidth.php:32-34`
  - `modules/toolbar/ToolbarUI.php:95-103`
- **Impact:** Any website a logged-in user visits can make that browser delete records, create users with the victim's rights (SEC-013), change settings, send mail through the relay (SEC-026), or log the browser into another account.
- **Severity:** HIGH — cross-site control of privileged actions; needs a logged-in victim.
- **Recommendation:** Require an unguessable per-session token on every state-changing request, accept state changes only on POST, and set SameSite on the session cookie.
- **Unknown / needs further validation:** End-to-end confirmation needs authorized testing on an isolated instance; the shipped nginx image does not add SameSite (`ENVIRONMENT.md:38`).

---

## 7. File handling & uploads

Direct reachability of stored files and the download handler's authorization are covered by SEC-008 (Authorization).

### SEC-009 — Uploads served inline with an extension-derived type; HTML uploads allowed
*Confirmation: **Partial** · Phase 0 severity: unchanged · Related: RT-17, SEC-008, SEC-015, SEC-005*

- **Confirmed fact:** The download handler sends every attachment with `Content-Disposition: inline` and a Content-Type looked up from the file extension in `lib/mime.types`. The upload allowlist (shared by the back office and the public careers form) includes `html` and `bak`; a replica of the lookup maps `html` to `text/html`. Names with extensions outside the allowlist get `.txt` appended, so an `.svg` upload is stored as `.svg.txt` and served as `text/plain` (Phase 0's SVG example does not hold). Upload folders and stored files are created world-writable (0777). Runtime: downloads are served `inline` (#29, `SMOKE_TEST.md` row 14: `text/plain`, `application/pdf`, `application/octet-stream` for TXT/PDF/DOCX); stored files are also served directly by nginx from the web root (RT-17).
- **Evidence:**
  - `modules/attachments/AttachmentsUI.php:113`, `:127-128`
  - `lib/Attachments.php:708-723` (`fileMimeType`)
  - `lib/mime.types:531`
  - `lib/FileUtility.php:166-201` (allowlist `:192`, `.txt` suffix `:193-196`), `:330` (extension lower-cased)
  - `php -r` replica of the lookup: html → `text/html`, txt → `text/plain`, pdf → `application/pdf`, docx and bak → `application/octet-stream` (docx matches #29)
  - 0777 at `lib/FileUtility.php:479`, `:488`, `:600` and `lib/Attachments.php:1288-1382`
  - `attachments/.htaccess:1` (`AddHandler cgi-script … .htm .html`, Apache-only)
- **Impact:** (Inference — the Partial part; not exercised.) An uploaded `.html` résumé opened through the handler or the direct path is rendered as a page in the application's origin, where its script runs with the viewer's session. This gives stored XSS against recruiters from any applicant or user who can upload a file (SEC-005 impact applies: act as the viewer, read session identifiers — SEC-029). World-writable storage lets any local account on the server alter or replace stored files.
- **Severity:** HIGH — outside parties can plant active content that runs in privileged sessions (browser behaviour inferred).
- **Recommendation:** Serve attachments as downloads with a neutral or allowlisted type and `nosniff`, remove active formats such as HTML from the upload allowlist, and create files and folders with least-privilege permissions.
- **Unknown / needs further validation:** Browser handling with the exact headers of the shipped nginx image (it adds `X-Content-Type-Options`, `ENVIRONMENT.md:38`) and of Apache deployments needs authorized testing on an isolated instance.

### SEC-020 — Predictable names and web-root locations for temp files and backups
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: SEC-008, SEC-028, SEC-001, DB-005*

- **Confirmed fact:** Attachment directory and temp-file names are built from `md5(rand() . time() …)` and `md5($padding . time() . mt_rand())`, not from a cryptographic random source. The in-app backup builds `catsbackup.bak` (DB dump plus attachments) and registers it as an attachment of the administrative site, so it lives under `attachments/` and is downloaded through the handler of SEC-008. The CLI backup writes to `scripts/backup/<rand()>/` inside the web root, protected only by a generated `deny from all` `.htaccess` (Apache-only). Temp files go to `./temp` in the web root.
- **Evidence:**
  - `lib/FileUtility.php:218`, `:246`, `:261`
  - `config.php:87` (`CATS_TEMP_DIR './temp'`)
  - `modules/settings/ajax/backup.php:93-95`, `:156-209`
  - `scripts/makeBackup.php:87-111`, `:124-160`
- **Impact:** A leaked or guessed backup path yields the whole database (including password hashes, SEC-001) and every attachment, without a session on nginx (SEC-008 mechanism).
- **Severity:** MEDIUM — high-value target, but paths are not directly advertised to outsiders.
- **Recommendation:** Generate file and directory names from a cryptographic random source, write backups outside the web root, and deliver them only through an authenticated, ROOT-only handler.
- **Unknown / needs further validation:** The in-app backup was deliberately not run in the baseline (`SMOKE_TEST.md` row 11), and DB-005 reports that it cannot dump data; both need an isolated run.

---

## 8. Secrets & configuration

### SEC-018 — Secrets and unsafe defaults committed in `config.php`; dead ECB crypto class
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DEP-010, SEC-003, SEC-006, SEC-010, RT-04, RT-08*

- **Confirmed fact:** The tracked `config.php` contains a shared licence key, DB credentials (`cats`/`password`), SMTP settings with credentials (`localhost:587`, TLS, `user`/`password`), an LDAP bind DN and password for a public test directory, tester and demo credentials, and a forgot-password template that mails passwords. Every clone starts with the same values. The web installer rewrites the DB and mail settings from operator input, but not the licence key, LDAP, tester/demo or forgot-password values. The baseline ran on the committed file unchanged: the DB credentials `cats`/`password` worked, mail went to the committed SMTP host (RT-04) and tool paths were the committed placeholders (RT-08). `lib/Encryption.php` is an mcrypt-based class defaulting to ECB mode; mcrypt is absent from supported PHP and nothing instantiates the class (dead code). `lib/HashUtility.php` is CRC32 for file comparison, not a security use.
- **Evidence:**
  - `config.php:31`, `:40-43`, `:172-174`, `:188-197`, `:208-225`, `:266-275`
  - `INSTALLATION.md:5`, `:46` (config used as committed; installer rewrites `DATABASE_*`, `MAIL_*`, `OFFSET_GMT`, `ENABLE_DEMO_MODE`); `ENVIRONMENT.md:24`, `:53`
  - `lib/Encryption.php:43`, `:52`
  - `grep -rn "new Encryption"` → no hits
  - `lib/HashUtility.php:67`
- **Impact:** Values committed to a public repository are public. Installs that keep them expose the licence key (SEC-010) and any service that accepts the default credentials; configuring the app means editing a tracked PHP file, which invites committing real secrets.
- **Severity:** MEDIUM — exposure depends on operators keeping defaults.
- **Recommendation:** Ship configuration without secrets (empty or generated at install), read secrets from the environment or an untracked file, and delete the dead mcrypt class.
- **Unknown / needs further validation:** Whether production installs changed these values (needs deployment review).

### SEC-023 — Shipped Docker Compose exposes DB admin tools with known passwords and serves the whole repository
*Confirmation: **Static** · Phase 0 severity: LOW → now MEDIUM (a published phpMyAdmin with automatic login and MariaDB `root/root` on all interfaces give full DB control if the file is used on a reachable host; aligned with DEP-008) · Related: DEP-008, SEC-001, SEC-003, SEC-008*

- **Confirmed fact:** `docker/docker-compose.yml` publishes MariaDB on port 3306 with `MYSQL_ROOT_PASSWORD=root` and a `dev/dev` account, publishes phpMyAdmin on port 8080 logged in automatically as `dev`, initialises the DB from `test/data` (which holds `admin`/`admin` and eight `tester*` accounts with password `tester`, one of them ROOT), and mounts the repository root as the web root.
- **Evidence:**
  - `docker/docker-compose.yml:5-8`, `:21-22`, `:25-37`, `:39-49`
  - `test/data/test.sql:1618`
  - `test/data/securityTests.sql:5-12` (hash `f5d1278e…` = `md5('tester')`, checked with `php -r`)
- **Impact:** Anyone who can reach the host gets database administration and known application logins. (Inference) because the web root is the repository root and nginx serves non-PHP files directly (RT-17), SQL seeds, test fixtures, documentation and vendor samples are also reachable over HTTP in this layout; this was not requested in the baseline.
- **Severity:** MEDIUM — full compromise, but only where this development file is used beyond a workstation.
- **Recommendation:** Keep development-only services and fixtures out of any compose file that may be used beyond a developer workstation, bind such services to localhost, and take credentials from untracked environment files.
- **Unknown / needs further validation:** Whether real deployments use this file; the baseline used its own tooling (`docs/baseline/env/`), so this file was not exercised.

---

## 9. Transport & security headers

### SEC-015 — The application sets no security headers; protection depends on the web server
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: SEC-005, SEC-009, SEC-007, SEC-030*

- **Confirmed fact:** No first-party PHP, template or `.htaccess` file emits Content-Security-Policy, X-Frame-Options or `frame-ancestors`, X-Content-Type-Options, Referrer-Policy or Strict-Transport-Security. `SSL_ENABLED` (false by default) only changes generated URLs; nothing redirects HTTP to HTTPS, and absolute links and redirects use `http://` unless the current request is HTTPS. The shipped nginx image adds X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, two HSTS headers and `Access-Control-Allow-Origin: *` to responses (observed and recorded in the baseline). Apache deployments get only what their own server configuration adds.
- **Evidence:**
  - grep for those header names over first-party code and `.htaccess` files → no hits
  - `config.php:54`
  - `lib/CATSUtility.php:224-233`, `:295`, `:362`, `:381`
  - `ENVIRONMENT.md:38` (image header set)
- **Impact:** No CSP limits SEC-005/SEC-009; deployments whose web server adds nothing have no clickjacking or MIME-sniffing protection; HSTS sent over plain HTTP is ignored by browsers; the wildcard CORS header lets any website read responses that need no login (careers pages, XML feed, public AJAX handlers).
- **Severity:** MEDIUM — missing defence in depth; exposure varies by deployment.
- **Recommendation:** Emit a baseline set of security headers from the application (or ship tested web-server rules for both nginx and Apache), including a restrictive CSP and frame protection, and drop the wildcard CORS header.
- **Unknown / needs further validation:** Exact header values of the nginx image and production TLS settings need capture on an isolated instance.

---

## 10. Error handling & information disclosure

### SEC-012 — Error output exposes stack traces, paths, call arguments and request data, incl. to anonymous visitors
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-02, RT-03, RT-04, RT-05, RT-06, RT-15, SEC-002, SEC-024, DB-003*

- **Confirmed fact:**
  - Observed: with the image default `display_errors=On` and no application error or exception handler, PHP fatals and warnings are printed into the page and served with HTTP 200 (RT-15: all 206 logged requests were 200 or 302). Traces show absolute paths (`/var/www/public/…`) and truncated call arguments. Anonymous visitors reach such pages through forgot-password (#04), the careers application (#85, #86) and the RSS feed (#88); back-office users through test e-mail (#77), e-mailing candidates (#79) and company pages (RT-06 warnings).
  - Observed (RT-04): on the careers site the applicant's error page shows the mail subject and the start of the applicant's e-mail address as call arguments (`CareerPortalSettings->sendEmail('1250', 'jorda…')`), after the application had already been saved.
  - Static: `UserInterface::fatal()` appends every request parameter (GET and POST, URL-encoded) inside an HTML comment of the error page; DB connection failures print `mysqli_connect_error()`; `installtest.php` prints DB connection errors.
  - Correction: Phase 0 said failed SQL queries print the SQL text and error. The two branches that would do so test `connect_errno` on the query result, which is never set (`php -r` check: `isset($r->connect_errno)` is false when `$r` is `false`), so they cannot run. Failed queries are ignored silently and show up only as later PHP warnings (RT-02) — a data-integrity problem (DB-003), not a disclosure.
- **Evidence:**
  - `ENVIRONMENT.md:37`, `:67`
  - `KNOWN_RUNTIME_ERRORS.md` RT-04, RT-15
  - `evidence/final-run/php_errors.log` (the `Users::getPassword()` fatal, four PHPMailer fatals including both careers traces, the RSS fatal)
  - `lib/UserInterface.php:242-271` (request dump at `:259-268`)
  - `lib/DatabaseConnection.php:113-141` (connect errors), `:184-219` (unreachable query-error branches)
  - `lib/InstallationTests.php:393-419`
  - grep → no `set_error_handler`/`set_exception_handler` outside `modules/install/backupDB.php:68`
- **Impact:** Anonymous visitors learn file-system layout, library versions and code structure. Applicants see raw failures that include their own data. POST fields (possibly passwords) can land in page source when `fatal()` runs on a form post. Failures are invisible to monitoring that relies on HTTP status codes.
- **Severity:** MEDIUM — limited-scope disclosure; no credentials were seen in the captured output.
- **Recommendation:** Turn off error display in production, log errors server-side, return a generic error page with an error status code, and never write request data into pages.
- **Unknown / needs further validation:** Whether production PHP configurations display errors; how the output would change on PHP 8.1+, where `mysqli` throws exceptions by default and uncaught traces would show the database error message with parts of the query (relevant to any PHP 8 port; not tested).

**Decision on RT-04 applicant data.** RT-04 is folded into SEC-012 rather than raised as a separate finding: the only personal data observed on the careers error page was the submitting applicant's own (truncated) address, so the distinct harm is the public error disclosure itself, which SEC-012 covers.

Minor disclosures (no finding): the login page prints the version (`modules/login/Login.tpl:78`); the SA-only system information page prints `php_uname()` (`modules/settings/SystemInformation.tpl:29`, gate `modules/settings/SettingsUI.php:2424`).

---

## 11. Outbound calls / third parties

### SEC-017 — Outbound calls: unauthenticated ZIP lookup, résumé text over HTTP to a third party, phone-home
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: API-010, API-013, DEP-010, RISK-005, SEC-030*

- **Confirmed fact:**
  - ZIP lookup: `ajax.php?f=zipLookup` has no authentication and fetches a Google geocoding URL over HTTP with the request's `zip` value appended after only removing spaces.
  - Résumé parsing: `LicenseUtility::isParsingEnabled()` returns true on every path, including when `PARSING_ENABLED` is false (the flag only skips a status call). Callers — including the public careers `resumeParse` sub-action — then create a SOAP client for `http://soap.resfly.com/parse.php` and send the licence key and the résumé text in clear text.
  - Version check: sends the licence key, site name, PHP version and usage data to `www.catsone.com:80` over a raw socket. It is off on a fresh install (`disable_version_check = 1`) but an administrator can turn it on.
- **Evidence:**
  - `ajax/zipLookup.php:9-23`
  - `lib/ZipLookup.php:11`, `:23-26`
  - `lib/License.php:687-727`
  - `modules/careers/CareersUI.php:521-528`, `:610-612`
  - `lib/ParseUtility.php:60`, `:85-101`
  - `wsdl/parse.wsdl:78`
  - `config.php:51`
  - `lib/NewVersionCheck.php:76`, `:106-122`, `:200`
  - `db/cats_schema.sql:1044`
- **Impact:** Anonymous users can make the server send requests to Google with partly controlled query text. Candidate résumés and the licence key would travel unencrypted to a host outside the operator's control whenever a parse runs; API-010 reports that the host no longer resolves, so today the call fails, but if the domain is registered again the data would go to its new owner.
- **Severity:** MEDIUM — privacy exposure conditional on an external event; limited request forgery.
- **Recommendation:** Require login for the ZIP lookup and encode its input, make parsing honour its configuration flag and use only operator-configured HTTPS services, and keep telemetry opt-in over HTTPS.
- **Unknown / needs further validation:** Current DNS status of `soap.resfly.com` and presence of ext-soap in deployments; no outbound call was exercised in the baseline.

### SEC-030 — Absolute URLs built from the client's Host header: server-side fetch and recruiter e-mail links
*Confirmation: **Runtime** · New in this edition · Related: RT-09, API-012, SEC-017, SEC-015*

- **Confirmed fact:**
  - Observed: the job-order PDF report makes PHP fetch its graph image from `http://<Host header>/index.php?m=graphs&a=jobOrderReportGraph…`. The fetch target follows the Host header of the user's request: it failed for `localhost:8080` and succeeded when the request carried `Host: web` (RT-09, `ENVIRONMENT.md:65`).
  - Static: `CATSUtility::getAbsoluteURI()` and several modules build absolute URLs from `$_SERVER['HTTP_HOST']`. The public careers application builds the candidate and job-order links in the "a candidate has applied" e-mail to the job owner and recruiter from the anonymous applicant's Host header; redirects and feed links use the same source.
- **Evidence:**
  - `modules/reports/ReportsUI.php:494-500` (URI passed to `$pdf->Image()`)
  - `evidence/final-run/php_errors.log` (`getimagesize(http://localhost:8080/index.php?m=graphs…)` in `lib/fpdf/fpdf.php:1508`)
  - `evidence/final-run/joborder-report-with-internal-host.pdf`
  - `lib/CATSUtility.php:220-233`, `:295`, `:362`
  - `modules/careers/CareersUI.php:1569-1573`, `:1585-1600`
  - `modules/candidates/CandidatesUI.php:1289-1290`
  - `modules/joborders/JobOrdersUI.php:507`, `:1080-1081`
- **Impact:** A logged-in user who can run reports can make the server open HTTP connections to a host and port of their choosing (fixed path) and tell from the error text whether the connection worked — a probe into the server's network. An anonymous applicant can make recruiter notification e-mails link to another host (phishing of recruiter credentials), wherever the web server passes arbitrary Host values, as the baseline nginx did.
- **Severity:** MEDIUM — limited request forgery and link poisoning; no direct data access.
- **Recommendation:** Take the application's public base URL from configuration, never from the request, and render report graphs in-process instead of fetching them over HTTP.
- **Unknown / needs further validation:** What production PHP servers can reach internally and whether front-end proxies normalise Host needs authorized testing on an isolated instance; the e-mail path was not exercised (no SMTP in the baseline).

---

## 12. Privacy & auditability

### SEC-022 — EEO and candidate PII available to every logged-in user via reports and export; no read audit
*Confirmation: **Static** · Phase 0 severity: LOW → now MEDIUM (re-verified that the EEO report and the full candidate export have no access check, so READ-only users reach special-category and bulk PII) · Related: API-020, DB-011, DB-013, DB-016, FEAT-004, RISK-005, SEC-031*

- **Confirmed fact:** EEO fields (gender, ethnicity, veteran status, disability) are collected on the public apply form and stored per candidate. The per-user `canSeeEEOInfo` flag is enforced only in the candidate Show and Edit templates. The reports module has no per-action access check, so the EEO report (aggregate statistics) is available to any logged-in user; the export module has none either, and its "all records" mode exports every candidate's contact data. Record changes are written to `history`, but views of candidate records, downloads and exports are not logged. There is no function to export or erase one person's data other than a hard delete.
- **Evidence:**
  - `modules/careers/CareersUI.php:1229-1232`
  - `modules/candidates/Show.tpl:260`, `:278`
  - `modules/candidates/Edit.tpl:230`
  - `modules/reports/ReportsUI.php:78-83` (EEO actions; 0 access checks in the file)
  - `modules/export/ExportUI.php:77-127` (0 access checks)
  - `lib/Candidates.php:645-670`
  - runtime #52 shows the EEO report preview renders (as administrator; lower levels untested)
- **Impact:** Special-category data and bulk PII reach users who were not meant to see them; misuse leaves no trail; data-subject requests need manual database work.
- **Severity:** MEDIUM — over-broad access to sensitive data by authenticated users.
- **Recommendation:** Enforce the EEO visibility flag and an explicit export permission on the server, log access to candidate records, downloads and exports, and provide per-person export and erasure.
- **Unknown / needs further validation:** Whether tab-level UI settings hide reports or export from low levels in practice needs a multi-level test on an isolated instance; legal obligations depend on jurisdiction.

---

## 13. Supply chain (security-specific)

### SEC-019 — End-of-life client libraries on back-office pages
*Confirmation: **Partial** · Phase 0 severity: unchanged · Related: DEP-002, DEP-003, DEP-006, DEP-013, RT-07*

- **Confirmed fact:** jQuery 1.3.2 (2009) is included on every back-office page by the shared header. CKEditor is the 4.25.1 LTS build (Composer lock); at runtime it refuses to start without a commercial licence key (RT-07) and is served from the public `vendor/` path. Bundled server-side libraries are unmaintained (FPDF 1.53, Artichow, SimpleTest in `lib/`). PHPMailer is v6.8.0.
- **Evidence:**
  - `lib/TemplateUtility.php:1194`
  - `js/jquery-1.3.2.min.js`
  - `composer.lock` (`ckeditor/ckeditor` 4.25.1, `phpmailer/phpmailer` v6.8.0)
  - `lib/fpdf/fpdf.php:16`
  - RT-07 console message (#19, #78)
- **Impact:** (External knowledge, not verified here — the Partial part.) Public advisories affect jQuery 1.3.x and older CKEditor 4 releases; whether the application passes untrusted input to the affected APIs was not traced. If it does, the result is XSS in the page context. In any case these libraries will be flagged by customer security scans and will not receive fixes.
- **Severity:** MEDIUM — security impact depends on usage not traced here (`DEPENDENCY_AUDIT.md` rates DEP-002/DEP-003 HIGH, adding licensing and maintenance factors).
- **Recommendation:** Remove or replace end-of-life client libraries with maintained ones and track front-end dependencies with the same tooling as Composer packages (details in `DEPENDENCY_AUDIT.md`).
- **Unknown / needs further validation:** Advisory-by-advisory applicability needs a traced review of call sites and authorized testing on an isolated instance.

---

## 14. Reference: what is exposed to whom

| Who can reach it | Surface | Findings |
|---|---|---|
| Anyone on the internet | Login page: default `admin`/`admin`, credential helpers in page source, no throttling | SEC-003, SEC-014 |
| | Forgot password: fatal error with stack trace | SEC-002, SEC-012 |
| | Careers apply: candidate overwrite, pending-file reuse, reflected XSS, HTML uploads, raw error pages, PII cookie, formula-bearing values, Host-derived links in recruiter mail | SEC-024, SEC-005, SEC-009, SEC-012, SEC-025, SEC-031, SEC-030 |
| | Careers registered-candidate profile (only if enabled) | SEC-025 |
| | Careers `resumeParse` → third-party SOAP over HTTP | SEC-017 |
| | RSS (fatal, RT-05) and XML feeds | SEC-012; API-012 |
| | Toolbar module (licence key, login by GET) | SEC-010 |
| | Public graph actions (request-supplied data only) | SEC-010; API-014 |
| | AJAX without login: `zipLookup`, `getParsedAddress`, `install:maint`, `install:ui` (pre-install) | SEC-017, SEC-028, SEC-010 |
| | Web-root scripts: `QueueCLI.php`, `rebuild_old_docs.php`, `installtest.php`, `installwizard.php`, `scripts/makeBackup.php` (unverified) | SEC-028, SEC-010 |
| | Stored files by direct URL (`attachments/`; `upload/` inferred) | SEC-008, SEC-009 |
| | Docker Compose services and repository files (if that file is used) | SEC-023 |
| Any logged-in user, incl. READ-only | DataGrid SQL injection; DataGrid include/instantiation | SEC-016, SEC-027 |
| | AJAX writes without access checks (activities, lists, tags, test mail) | SEC-026 |
| | Reports (EEO), export, lists, in-app test runner | SEC-022, SEC-031, API-022 |
| | Attachment handler across sites (ID + hash) | SEC-008 |
| | Stored-XSS write paths (list names, activity notes, uploads) | SEC-005, SEC-009 |
| | Job-order PDF server-side fetch via Host | SEC-030 |
| Site administrator (SA) | Create or raise users to ROOT; extra-field HTML; careers templates; backups | SEC-013, SEC-005, SEC-020 |
| Any website a logged-in user visits | Every state change (no tokens; GET mutations) | SEC-004 |
| Anyone who can read the DB or a backup | MD5 hashes, live session identifiers, stored settings | SEC-001, SEC-029, SEC-020 |
| Network observer on plain HTTP | Session cookie, LDAP binds, parser and version-check traffic | SEC-007, SEC-006, SEC-017, SEC-015 |

## 15. Reference: OWASP Top 10 (2021) mapping

| OWASP 2021 category | Findings |
|---|---|
| A01 Broken Access Control | SEC-004, SEC-008, SEC-010, SEC-013, SEC-022, SEC-024, SEC-025, SEC-026, SEC-028; census in §3 |
| A02 Cryptographic Failures | SEC-001, SEC-006, SEC-007, SEC-015, SEC-017, SEC-018 |
| A03 Injection | SEC-005, SEC-006, SEC-011, SEC-016, SEC-027, SEC-031 |
| A04 Insecure Design | SEC-002, SEC-014, SEC-020, SEC-024, SEC-025, SEC-029, SEC-030 |
| A05 Security Misconfiguration | SEC-003, SEC-009, SEC-012, SEC-015, SEC-018, SEC-023 |
| A06 Vulnerable and Outdated Components | SEC-019 |
| A07 Identification and Authentication Failures | SEC-001, SEC-002, SEC-003, SEC-006, SEC-007, SEC-014, SEC-021, SEC-025, SEC-029 |
| A08 Software and Data Integrity Failures | SEC-011 |
| A09 Security Logging and Monitoring Failures | SEC-012 (fatals served as HTTP 200), SEC-014, SEC-022 |
| A10 Server-Side Request Forgery | SEC-017, SEC-030 |

## 16. Reference: existing security tests

- The Behat suites `test/features/GET_POST_requestsSecurity.feature`, `moduleMainPagesSecurity.feature` and `moduleSubPagesSecurity.feature` check page and action access by level (DISABLED … ROOT) for `index.php?m=…&a=…` routes. This is real coverage of vertical access control on page routes and is worth keeping.
- No active scenario calls `ajax.php`; the AJAX rows are commented out under "AJAX not tested" (`GET_POST_requestsSecurity.feature:1330-1370`, API-021). SEC-026 and SEC-027 are therefore untested.
- No tests exist for XSS, CSRF, SQL injection, attachment authorization, upload types, session handling or the careers apply flow (SEC-004, SEC-005, SEC-008, SEC-009, SEC-016, SEC-024).
- The lists rows expect READONLY users to be allowed to call `deleteStaticList` (`GET_POST_requestsSecurity.feature:746`), which encodes the missing check as correct behaviour.

## Area-level unknowns

1. **No runtime security testing was done.** Every Static and Partial finding needs confirmation by authorized testing on an isolated instance loaded with fictional data — first SEC-016, SEC-024, SEC-005, SEC-009, SEC-027, SEC-004, SEC-026.
2. **Effective PHP configuration.** Session cookie attributes, strict mode, `session.use_only_cookies`, `register_argc_argv`, `display_errors` and `session.gc_maxlifetime` in the baseline image and in production (capture `php -i` and response headers on an isolated instance). Affects SEC-007, SEC-012, SEC-021, SEC-028, SEC-029.
3. **Deployment topology.** Apache or nginx, the web root, and whether `upload/`, `temp/`, `scripts/`, `db/`, `test/` and `vendor/` samples are served (request inventory on an isolated instance). Affects SEC-008, SEC-009, SEC-020, SEC-023, SEC-028.
4. **Behaviour per access level.** Only the administrator account was used in the smoke run; run the page and AJAX actions as each level (the existing Behat security suite plus AJAX cases). Affects SEC-013, SEC-022, SEC-026 and the §3 census.
5. **Careers settings in production.** Whether the careers site, candidate registration and questionnaires are enabled per site (configuration review). Affects SEC-024, SEC-025, SEC-005.
6. **Signs of past abuse.** Whether production data shows unexplained candidate overwrites, unexpected ROOT users, deleted attachments or odd saved-list names (data review of `history`, `user`, `attachment`, `saved_list`). Affects SEC-024, SEC-013, SEC-025, SEC-005.
7. **Third-party endpoints.** DNS status of `soap.resfly.com`, reachability of `www.catsone.com` and Google geocoding, and ext-soap presence (network and configuration check). Affects SEC-017.
8. **Database logging.** Whether MySQL general or slow query logs are enabled, since password changes put plaintext in SQL text (DB configuration review). Affects SEC-001.
9. **PHP 8 behaviour.** The app does not start on PHP 8 today; any port changes error output (mysqli exceptions with query text) and removes the XXE guard (§4 reference table). Needs testing as part of any runtime change.

## Changes from the Phase 0 edition

- **Re-rated:**
  - SEC-001 CRITICAL → HIGH: using the weakness needs a copy of the user table or DB logs first (precondition → HIGH on the shared scale); consistent with DB-009.
  - SEC-006 HIGH → MEDIUM: LDAP is off by default, a crafted filter cannot bypass the password bind, and `ldaps://` can be configured.
  - SEC-010 HIGH → MEDIUM: a working install always has `INSTALL_BLOCK` (`index.php:44-48`), so the config-writing installer is exposed only before installation completes; graphs expose no stored data.
  - SEC-016 MEDIUM (Potential) → CRITICAL: `sortDirection` is not validated anywhere and reaches `ORDER BY` from request JSON for any logged-in user.
  - SEC-022 LOW → MEDIUM: EEO report and full candidate export verified to have no access check.
  - SEC-023 LOW → MEDIUM: published phpMyAdmin with automatic login and `root/root` DB; aligned with DEP-008.
- **Withdrawn or merged IDs:** none.
- **New IDs:** SEC-029 (session identifier copied into pages, AJAX bodies, DB and a second cookie — answers the cookie-attribute question together with SEC-007), SEC-030 (Host-header-derived URLs: server-side fetch observed in RT-09, recruiter e-mail links), SEC-031 (CSV formula injection, cross-verified from API-020).
- **Missing section added:** SEC-010 appeared in the Phase 0 summary table but had no finding section; it now has one.
- **Folded rather than raised as new IDs:** RT-04 applicant data on careers error pages → SEC-012 (reason in §10); committed `config.php` defaults (SMTP, public LDAP test host, demo credentials) → SEC-018, SEC-006, SEC-003; applicant PII in the careers cookie → SEC-025; repository-as-web-root → SEC-023; pending careers uploads → SEC-008 and SEC-024; toolbar GET login → SEC-010 and SEC-004; public-endpoint abuse (API-014) → SEC-014.
- **Corrected claims:** SVG uploads are stored as `.svg.txt`, not served as SVG (SEC-009); the `getSanitisedInput()` `FALSE` argument does not break encoding (SEC-005); failed SQL queries do not print SQL — those branches are unreachable (SEC-012); the graphs module does not disclose stored data without login (SEC-010); the `.htaccess` files do not deny reads even on Apache (SEC-008); `lib/Encryption.php` is dead code, not live weak crypto (SEC-018); the XXE note now records the PHP 8 caveat (§4).
- **Confirmation upgrades from runtime evidence:** Runtime — SEC-001 (#05, `INSTALLATION.md:68`), SEC-002 (RT-03, #04), SEC-003 (#05, SMOKE row 1, UI map login row), SEC-008 (RT-17, #29), SEC-012 (RT-15, RT-03/04/05), SEC-015 (`ENVIRONMENT.md:38`), SEC-030 (RT-09). Partial — SEC-007 (cookie attributes inferred from PHP defaults), SEC-009 (inline serving observed, HTML rendering inferred), SEC-019 (advisories are external knowledge).
- **Line numbers fixed:** `AttachmentsUI.php:117`→`:113` and `:129`→`:128`; `Attachments.php:620`→`:621`; `FileUtility.php:634`→`:600`; `Session.php:1200`→`:1204` and `:895-903`→`:893-903`; `NewVersionCheck.php:98-115`/`:195`→`:106-122`/`:200`; candidates `Add.tpl:155`→`:400`, `Edit.tpl:199`→`:317`; Behat lists row `:731`→`:746`; `scripts/makeBackup.php:36-40`→`:37-46`; `modules/settings/ajax/backup.php:92-100`→`:93-95`; LDAP config `config.php:266-273`→`:266-275`.
- **Removed:** the Phase 0 prioritized remediation plan and "Facts vs Assumptions" section (this edition is findings-only; facts and inferences are separated inside each finding).

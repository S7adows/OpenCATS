# Upstream Reconciliation: fork `d607279` vs upstream `opencats/OpenCATS` `d5cf733`

- **Phase:** 3 (transformation planning). This is an engineering inventory. It is not legal advice. Licensing items are listed so that legal can review them; see also `docs/transformation/LICENSE_AND_DISTRIBUTION_ANALYSIS.md`.
- **Method:** I compared the upstream code at `d5cf733` directly against Phase 0 evidence (`docs/audit/*.md`). I did not rely on commit subjects. The comparison used `git diff d607279 d5cf733`, file reads at stated `file:line`, `php -l` on PHP 8.4.19 for syntax only (no code was executed), and a dry-run merge in a throwaway clone under the scratchpad, which was then deleted. Nothing was merged, committed or installed in `/home/user/OpenCATS`.
- **Tags:** [FACT] means verified in code or git. [INFERENCE] means reasoned from code but not executed. [RECOMMENDATION] and [UNKNOWN] are as named.
- **Line numbers:** unless a line says otherwise, `file:line` refers to **upstream `d5cf733`**. "Fork" refers to `d607279`.

---

## 1. Current repo commit

| Item | Value |
|---|---|
| Fork product code base | `master` @ `d607279d2a9f680195ca192bb9d2554455af6290` (2026-01-26, "Triggering CI/CD for security audit") [FACT] |
| `CATS_VERSION` (fork) | `0.9.7.4` (`constants.php:45` @ `d607279`) [FACT] |
| Working branch | `claude/friendly-pasteur-cmsxc5` (HEAD `d89f19e` at the time of writing). It adds only `docs/` [FACT] |
| Non-docs divergence | `git diff --stat d607279 HEAD -- . ':!docs'` prints **nothing** (0 lines) [FACT] |
| Fork syntax health on PHP 8.4 | 6 of 355 tracked `.php` files fail `php -l`: `lib/CATSUtility.php:108`, `lib/artichow/AntiSpam.class.php:63`, `lib/fpdf/fpdf.php:434`, `lib/fpdf/font/makefont/makefont.php:18` (curly-brace offsets), `src/OpenCATS/Entity/JobOrderRepositoryException.php:2`, and a SimpleTest fixture [FACT] |

## 2. Upstream baseline

| Item | Value |
|---|---|
| Upstream HEAD | `d5cf733f20d62b70dca1fcac23f64d6f2b021ff3` (2026-09-21, "chore: bump phpunit/phpunit from 13.3.3 to 13.3.4 (#897)"). `git describe`: `v0.11.1-9-gd5cf733` [FACT] |
| Ancestry | `d607279` is an ancestor of `d5cf733`. Upstream is **176 commits ahead**. The full clone is not shallow [FACT] |
| Tags since fork point | `v0.10.0` `e8caaa6` (2026-06-23, 103 commits after `d607279`) · `v0.11.0` `07b45f6` (2026-08-27, +44) · `v0.11.1` `d83e426` (2026-09-03, +20) · 9 commits on master after `v0.11.1` [FACT] |
| Previous tag | `0.9.7.4` `5781f41` (2024-04-23) [FACT] |
| `CATS_VERSION` upstream | Still `'0.10.0'` (`constants.php:27`). It was **not bumped** for v0.11.x [FACT] |
| Size of change | 650 files, +28,375 / −89,270. Most of the deletions are the bundled SimpleTest, FPDF, Sphinx API, the toolbar, the tests module and the licence code [FACT] |
| Upstream syntax health on PHP 8.4 | 243 of 243 tracked `.php` files pass `php -l` [FACT] |
| GitHub release notes | [UNKNOWN] The GitHub API is not configured for `opencats/OpenCATS` in this session, so release bodies were not read |

---

## 3. Material differences table

Each classification describes what **we** should do with the upstream change.

| # | Area | Fork `d607279` | Upstream `d5cf733` (evidence) | Classification | Rationale |
|---|---|---|---|---|---|
| M1 | PHP runtime | Mixed PHP 5/7 code; 6 parse errors on PHP 8 (§1); `get_magic_quotes_*` fatal on PHP ≥ 8 (API-019) | `composer.json` requires `"php": "^8.4.1"`. Magic quotes, curly offsets, `create_function` and `implode` order fixed (`2326a53` #787). PHP 8 runtime modernised (`d685cff` #792). Installer fixed for PHP 8.4.1/8.5 (`eeaa82f` #840). Runtime gate in `installwizard.php:5` and `lib/InstallationTests.php:137`. No removed functions found by grep (`each`, `create_function`, `ereg`, `mysql_*`, `utf8_encode`, `strftime`) [FACT] | **TAKE UPSTREAM** | The fork cannot run on any supported PHP. Upstream parses cleanly on 8.4 |
| M2 | Dynamic properties | Unaddressed | Only `lib/Template.php` has `#[AllowDynamicProperties]` [FACT]. Other deprecations were not assessed [UNKNOWN] | **TAKE**, then an audit task | Deprecations are warnings, not fatal errors, on 8.4 |
| M3 | Vendored libs | `lib/fpdf` 1.53, `lib/sphinx`, `lib/simpletest`, `lib/artichow` | FPDF comes from Composer as `setasign/fpdf` 1.9.0. Sphinx API comes from `neutron/sphinxsearch-api` (`f8ea1bc` #755). SimpleTest was removed (`21e8484` #754). **Artichow is still vendored**; only `AntiSpam.class.php` changed (`{$i}`→`[$i]`). Artichow headers say "Public Domain" (`lib/artichow/Artichow.cfg.php:2-7`) [FACT] | **TAKE UPSTREAM**; **REBUILD** charts later | Artichow is unmaintained GD code. Replace it when reporting is rebuilt |
| M4 | Passwords | Unsalted MD5 with strict compare (SEC-001) | `password_hash(PASSWORD_DEFAULT)` with lazy MD5 migration on login and on password change (`lib/Users.php:1154-1225`, `2d8b01b` #685). `rehashPasswordIfNeeded()` (`:1174-1181`) skips legacy/LDAP hashes and rehashes when `password_needs_rehash`. Column widened to `VARCHAR(255)` (`db/cats_schema.sql:979`) [FACT] | **TAKE**, then **ADAPT** | Gaps: (a) the MD5 compare uses `!==`, not `hash_equals` (`:1198`); (b) dormant accounts stay MD5 indefinitely, with no bulk wrap such as `password_hash(md5)`; (c) the seed still inserts `md5('cats')` (`db/cats_schema.sql:1011`) |
| M5 | Default admin | `admin`/`cats`, forced change bypassable (SEC-003/DB-009) | Mandatory default-password change restored (`903c8c8` #873) [FACT] | **TAKE** | Not verified at runtime [INFERENCE] |
| M6 | CSRF | None (SEC-004/API-006) | Per-session token: `random_bytes(32)` plus `hash_equals` (`lib/Session.php:1032-1071`). Enforced for **logged-in POST** in `index.php:110-126`, `ajax.php:25-54` and `lib/AJAXInterface.php:199-212`. Injected into forms by JS (`lib/TemplateUtility.php:1314-1373`). GET deletes were converted to POST via `isPostBack()` (for example `modules/candidates/CandidatesUI.php:110-122`, `CalendarUI.php:61`, `SettingsUI.php:398,600,868`) (`6223ab5` #693) [FACT] | **TAKE**, then **ADAPT** | Gaps: GET is never token-checked, so any GET handler that still mutates state is unprotected. AJAX handlers that read `$_REQUEST` accept GET. The careers, RSS and XML paths are excluded by design (`index.php:111-115`). No token rotation on login (SEC-007) |
| M7 | AJAX authorization | Login-only (SEC-026/API-005) | #724 (`aa3b414`) added access checks to `deleteActivity`, `editActivity`, `testEmailSettings` and list AJAX. #828 (`972f81a`) added `lib/CandidateAuthorization.php` (admin-hidden check) to attachments, candidates, companies and `addToLists` [FACT] | **TAKE**, then **ADAPT** | Still open: `ajax_tags_add/del/upd` have no access-level check (`modules/settings/SettingsUI.php:665-705`), although the tags page requires SA (`:215`). `CandidateAuthorization` enforces only admin-hidden visibility, not ownership |
| M8 | DB engine | MyISAM (DB-003) | Migration 375 converts every MyISAM table to InnoDB (`modules/install/Schema.php:1500-1516`, `5a98c41` #705). The schema has 54 `ENGINE=InnoDB` and 0 MyISAM [FACT] | **TAKE** | No FKs (`FOREIGN KEY` count 0) and no transactional code paths, so DB-003 is only partly closed [FACT] |
| M9 | Encoding | `utf8`/mixed collations (DB-008) | Migration 390 runs `ALTER DATABASE` plus `CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci` on every table (`Schema.php:2076-2096`). Connection uses `SQL_CHARACTER_SET 'utf8mb4'` (`config.php:112`, `lib/DatabaseConnection.php:107`) (`9c5653f` #805) [FACT] | **TAKE** (with a pre-upgrade check) | Risk: index-prefix limits and long `ALTER`s on older MySQL/MariaDB [INFERENCE] |
| M10 | Migration mechanism | `Schema.php` eval'd PHP / `;`-split SQL, run implicitly at session start (DB-006) | **Same mechanism** (`lib/ModuleUtility.php:520-550`: `eval($PHPCode)`, `explode(';')`). Changes: install migrations now run **only** on the maintenance page (`:423-428`, `1f73423` #832). Logged-in users see `PendingMigrations.tpl` (`index.php:135-148`, `lib/SchemaMigrationStatus.php`, `78cc21e` #803). Careers returns 503 while migrations are pending (`index.php:151-163`). Existing installs are routed through maintenance before the installer questions (`fad9f71` #814). Legacy pre-0.9.x upgrade path and `db/upgrade-*.sql` removed (`0b83169` #767). 0.9.4→current upgrade covered in CI (`5500bee` #843, `LegacyUpgradeTest.php`) [FACT] | **TAKE**; **REBUILD** later | The gating is a real safety improvement. The eval/split runner remains technical debt |
| M11 | Multi-tenancy | Vestigial `site_id` (DB-012) | Removed (`20cc753` #823). Migration 391 deletes site 180 rows. Migration 392 **drops `site_id` columns and indexes** from all tables (`Schema.php:2097-2297`) [FACT] | **TAKE** | Our product direction is single-tenant per install. Irreversible; see §6 |
| M12 | Licensing code | Licence key, "Professional" gates, `License.php` | Removed (`e422abf` #802). `LICENSE_KEY` removed from `config.php` [FACT] | **TAKE** | Dead commercial-gating code |
| M13 | Licence headers / attribution | Full CPL 1.1a Exhibit A headers | #864 (`be93937`) replaced the headers with a 5-line "Portions Copyright… See LICENSE.md" notice. "Powered by OpenCATS" and the CPL warning comments remain (`lib/TemplateUtility.php:847-862`, `modules/careers/Blank.tpl:38-40`, `modules/login/Login.tpl:96`). `LICENSE.md` is unchanged [FACT] | **ADAPT: hold for legal review** | A merge brings this in automatically. Legal must decide whether the shortened headers are acceptable (see LICENSE_AND_DISTRIBUTION_ANALYSIS.md) |
| M14 | Removed legacy integrations | Toolbar, tests module, licence wizard, Professional page present | Removed: `modules/toolbar` (+ `wsdl/keyCheck.wsdl`), `modules/tests` (#754), `lib/ControlPanel.php`, `Profile.php`, `Encryption.php` (#778), multi-site login `&s=` (#823) [FACT]. **Still present:** Resfly SOAP parser (`lib/ParseUtility.php:39,81`, endpoint `http://soap.resfly.com/parse.php` in `wsdl/parse.wsdl`), gated only on the SOAP extension (`lib/CATSUtility.php:643-651`). `PARSING_ENABLED` (`config.php:30`) is **not consulted** anywhere. **Phone-home** to `www.catsone.com:80/catsnewversion.php`, sending site name, UID, user agent and active user count (`lib/NewVersionCheck.php:86-98`), called from `LoginUI.php:274` and `SettingsUI.php:2226,2657,2668`. New installs default to `disable_version_check = 1` (`db/cats_schema.sql:958`); existing installs keep their setting [FACT] | **TAKE** removals; **REBUILD/remove** Resfly and phone-home ourselves | Both send data over plaintext HTTP to third parties that may be defunct |
| M15 | Architecture | `lib/` + `modules/` + `.tpl`; PSR-4 `src/OpenCATS` (tiny) | **Unchanged in shape.** Still include-based `lib/`, `modules/*UI.php`, PHP `.tpl` templates, `index.php?m=&a=` routing. `src/OpenCATS` grew only in tests plus minor entity fixes. New: `ajax/bootstrap.php`, centralised escaping helpers in `lib/Template.php:45-133`, versioned asset URLs (`d642ff0` #749) [FACT] | **TAKE** | Upstream did not re-architect. Our 2.0 architecture work remains ours (REBUILD) |
| M16 | Dependencies | phpmailer 6.8.0, ckeditor **4.25.1**, phpunit 7.5.7, behat 3.0.15, Goutte, codacy | Runtime: phpmailer 7.1.1, ckeditor **4.22.1** (pinned: `eaf2279` #856, "pin CKEditor to open-source release"), gregwar/captcha 2.1.1, fpdf 1.9.0, sphinxsearch-api 2.0.8.1, symfony/finder 8.1.5. Dev: phpunit 13.3.4, behat 3.33.0, mink 1.13, BrowserKit driver. `jquery-1.3.2.min.js` **still shipped** (`js/`) [FACT] | **TAKE** (CKEditor pin needs legal/security sign-off) | 4.25.1 carries commercial LTS terms (Phase 0). 4.22.1 is open source but EOL, and may miss fixes that only shipped in LTS [UNKNOWN which]. jQuery 1.3.2 remains a REBUILD item |
| M17 | CI / build / release | Travis (dead) + a basic GH workflow | `.github/workflows/ci.yml`: PHP matrix `8.4.1`, `8.5`; PHPUnit unit tests; Docker integration tests; Behat default and security suites; 0.9.4 upgrade test. Release job on `v*` tags runs `composer install --no-dev` and tars/zips **with `vendor/`** (`77f64e5` #859, `cd93542` #867). Dependabot auto-merge and PR-title lint. Weaknesses: lint covers only `src/`; `composer audit \|\| true`; JUnit publish `fail_on_failure: false` [FACT] | **TAKE**, then **ADAPT** | Make `composer audit` blocking, lint everything, and keep release packaging |
| M18 | Config file | Production-style defaults, LDAP constants present | **Regression on master after v0.11.1:** `be93937` #864 overwrote `config.php` with the test config. It now has `DATABASE_HOST 'opencatsdb'`, `DATABASE_NAME 'cats_test'`, user/pass `dev`/`dev` (`config.php:19-22`) and `US_ZIPS_ENABLED true`. It **removed `LDAP_ACCOUNT`, `LDAP_ATTRIBUTE_*` and `LDAP_AD`**, which `lib/LDAP.php` still references [FACT]. On PHP 8, an undefined constant is an `Error`, so LDAP login would fatal [INFERENCE] | **ADAPT** | Restore the LDAP constants and production defaults before any release from post-v0.11.1 master |
| M19 | Docs | Phase 0–3 `docs/` | Added `CONTRIBUTING.md`, `FEATURE_REQUESTS.md`, README contributing section, updated `Security.MD` (password_hash, XSS wording) and `README-testing.md`. `CHANGELOG.MD` was last touched in 2017 (`e3b52c8`) [FACT] | **KEEP OUR** `docs/`; **TAKE** upstream root docs | There are no path collisions: upstream has no `docs/` changes |
| M20 | Docker | nginx + phpMyAdmin + MariaDB | Dev stack unchanged: `prooph/nginx:www`, phpMyAdmin (`docker/docker-compose.yml:4,42`). New `docker/php/Dockerfile` for PHP 8.4.1 [FACT] | **IGNORE** for production | nginx ignores the new `attachments/.htaccess` deny rules (SEC-009) [INFERENCE] |

---

## 4. Security fixes available upstream

### 4.1 Upstream security commits (verified by diff)

| Commit / PR | Change | Evidence |
|---|---|---|
| `2d8b01b` #685 | password_hash with MD5 lazy migration | `lib/Users.php:1154-1225` |
| `de5c781`…`f4e709d` (PR #681) | Deny direct `attachments/` access (Apache); remove `getAttachmentLocal`; upload whitelist | `attachments/.htaccess`; `lib/Attachments.php:872-887` |
| `058f2df` #692 | nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options SAMEORIGIN (Apache `mod_headers` only; no CSP, no HSTS) | `.htaccess` |
| `7a6e22c` #691, `3002a29` #706 | No DB password exposure during upgrade; AJAX restricted while the installer is active; escaped config writes | `ajax.php:68-90` |
| `6223ab5` #693 | CSRF tokens; GET→POST for state changes | §3 M6 |
| `56363da` #697, `81c630d` #723, `6361194` #751, `0915607` #757, `451b9a6` #761 | XSS hardening; `Template::escapeHtml/Attr/Js/Url` | `lib/Template.php:45-133` |
| `aa3b414` #724, `972f81a` #828 | AJAX/module authorization; `CandidateAuthorization` | §3 M7 |
| `b336853` #795 | Deny web access to `temp/` | `temp/.htaccess` |
| `7f15174` #808 | Validate staged import file identifiers | `modules/import` |
| GHSA merges `1b58211`, `883c7d8` | DataGrid: skip non-filterable columns; `sortDirection` restricted to ASC/DESC | `lib/DataGrid.php` |
| GHSA merge `814542d` | SQLi in activity/home datagrid `period`/`startDate`/`endDate` | `modules/activity/dataGrids.php`, `modules/home/dataGrids.php` |
| GHSA merge `6d3d4e3` | Candidates duplicate/merge SQL: `makeQueryInteger` and an escaped `SET` builder | `lib/Candidates.php:1403+` |
| GHSA merge `bff217d` | Extra-field checkbox value injection | `lib/ExtraFields.php:480` |
| GHSA merge `c900fcd` | Installer `timeZone` config/SQL injection | `modules/install/ajax/ui.php` |
| GHSA merges `0aefb0f`, `a6440a8` | Import field-mapping whitelist; mass-import unlink path check | `modules/import/ImportUI.php` |
| GHSA merge `d83e426` (= v0.11.1) | Reflected XSS: `advancedSearchOn`, JS data arrays | `lib/TemplateUtility.php` |
| `a641d79` #778, `b80cdf9` #833 | Removed the unused mcrypt `Encryption` wrapper and mcrypt from the Docker image | `lib/Encryption.php` deleted |

[FACT] Upstream ships 9 "Merge commit from fork" commits. That is GitHub's pattern for private security advisories. [UNKNOWN] The GHSA/CVE identifiers could not be read because the API is not available.

### 4.2 Phase 0 CRITICAL/HIGH finding mapping

**Status key:** **Fixed** = the Phase 0 root cause is gone. **Partial** = materially improved but exploitable residue remains. **Not fixed** = the vulnerable code is unchanged.

| Phase 0 ID | Sev | Upstream status | Evidence at `d5cf733` | Our action |
|---|---|---|---|---|
| **SEC-024 / API-002** careers `candidateID` overwrite | CRIT | **Not fixed** | `modules/careers/CareersUI.php:815` `$candidateID = intval($_POST['candidateID'])` → `:840` → `:1695-1710` `$candidates->update($candidateID, …)` with no ownership proof. Optional CAPTCHA (`:804-811`, #785) does not mitigate it | **REBUILD** (hotfix now; contribute upstream) |
| **DB-001** merge corrupts polymorphic rows | CRIT | **Not fixed** (SQL escaping part fixed) | `lib/Candidates.php:1290-1328`: `UPDATE activity/attachment/calendar_event SET data_item_id … WHERE data_item_id = %s`, still **no `data_item_type`** filter (the `site_id` filter was also dropped by #823). `saved_list_entry` at `:1606-1616` likewise. Final `DELETE FROM candidate` (`:1560-1565`) bypasses `Candidates::delete()` cascades. The `SET`-clause injection was fixed by `6d3d4e3` (`:1403+`) | **REBUILD** (hotfix) |
| SEC-001 MD5 passwords | CRIT | **Fixed** (residue) | §3 M4 | TAKE and ADAPT |
| SEC-003 default creds | CRIT | **Partial** | Seed `md5('cats')` (`db/cats_schema.sql:1011`); forced change restored (#873) | TAKE |
| SEC-002 forgot password | HIGH | **Not fixed** | `modules/login/LoginUI.php:313-345` calls `$user->getPassword()`, which does not exist in `lib/Users.php` (fatal), and is designed to mail the plaintext password; also enumerates usernames | REBUILD (token reset) |
| SEC-004 / API-006 CSRF | HIGH | **Partial** | POST-only token (§3 M6). SameSite=Lax is set only on the auxiliary `session_cookie` (`lib/Session.php:833-856`), not on the PHP session cookie | TAKE and ADAPT |
| SEC-005 back-end XSS | HIGH | **Partial** (large improvement) | Escaping helpers applied widely: fork 188 vs upstream 463 `Template::escape*`/`htmlspecialchars` calls in `modules`/`lib`. Saved-list names escaped (`modules/candidates/Show.tpl:618`); extra-field display escaped at source (`lib/ExtraFields.php:485-514`). Residue: `addHTML`/`editHTML` echoed raw (`Add.tpl:411`, `Edit.tpl:337`); careers TODO admits inconsistent escaping (`CareersUI.php:1615-1616`); no CSP | TAKE, then CSP/audit |
| SEC-006 LDAP | HIGH | **Not fixed** (regressed in config) | `lib/LDAP.php` is byte-identical to the fork (no `ldap_escape`, no StartTLS); constants removed from `config.php` (§3 M18) | REBUILD (or remove LDAP) |
| SEC-007 session fixation / cookie | HIGH | **Not fixed** | No `session_regenerate_id`, `session_set_cookie_params` or `cookie_secure`/`httponly`/`samesite` for the PHP session anywhere in first-party code (grep); `index.php:47-48` bare `session_start()` | REBUILD (hotfix) |
| SEC-008 attachment authz | HIGH | **Partial** | `modules/attachments/AttachmentsUI.php:69-84`: still `md5(directoryName)` capability plus `CandidateAuthorization` (admin-hidden only). Single-tenant now, so the cross-site aspect is moot | TAKE; add per-record authz later |
| SEC-009 inline served uploads | HIGH | **Partial** | UI upload whitelist excludes html/svg/txt (`lib/Attachments.php:872-887`). But careers and mass-import paths use `createFromFile()` (`:924-935`, no whitelist) and `FileUtility` still allows `html` (`lib/FileUtility.php:171`). Download is still `Content-Disposition: inline` with extension MIME (`AttachmentsUI.php:119-120`). `.htaccess` deny is ineffective on nginx | ADAPT (force `attachment` disposition, whitelist every path) |
| SEC-010 unauthenticated functionality | HIGH | **Partial** | Toolbar/`getLicenseKey` gone; installer AJAX gated. `graphs` still `_authenticationRequired = false` (`modules/graphs/GraphsUI.php:30`); `zipLookup` uses the unauthenticated `AJAXInterface` and now proxies to Nominatim (`ajax/zipLookup.php:10`, `lib/ZipLookup.php:27`) | ADAPT |
| SEC-025 / API-004 careers cookie login | HIGH | **Not fixed** | Knowledge-based match (`CareersUI.php:2080-2180`); `attachmentID` taken from POST and deleted without checking that it belongs to the candidate (`:321-330`, `:380`) | REBUILD |
| SEC-026 / API-005 AJAX access levels | HIGH | **Partial** | §3 M7; `ajax_tags_*` open | ADAPT (hotfix) |
| SEC-027 / API-007 DataGrid include | HIGH | **Not fixed** | `lib/DataGrid.php:267-268` `preg_replace("[^A-Za-z0-9]", "", …)`: the brackets act as delimiters, so the filter is still ineffective; `include_once(sprintf('modules/%s/dataGrids.php'))` and `new $class` follow (`:275-282`) | REBUILD (hotfix: allowlist) |
| API-003 careers update misaligned args | HIGH | **Partial** | Argument order now matches the signature (`lib/Candidates.php:231-236`, #729 `9db9d3f`, #862 `dcb46a8`), but the owner is still overwritten with the automated user (`CareersUI.php:1704`) | Subsumed by SEC-024 fix |
| API-010 Resfly | HIGH | **Not fixed** | §3 M14 | REBUILD/remove |
| API-011 Mailer | HIGH | **Partial** | Disabled-mode check (`lib/Mailer.php:170`) and careers fatal fixed (`71df8ae` #820); `new PHPMailer(true)` with no try/catch (`:51`); forgot-password is still broken | ADAPT |
| API-019 PHP 8 fatal | HIGH | **Fixed** | #787, #792, #840 | TAKE |
| API-001 no REST API | HIGH | **Not fixed** (out of scope upstream) | — | REBUILD (our roadmap) |
| DB-002 error handling | HIGH | **Not fixed** | `lib/DatabaseConnection.php:163-190` dead `connect_errno` branches unchanged; `getError()` still returns the connect error (`:563-568`); installer `MySQLQuery` checks the connection, not the result (`modules/install/ajax/ui.php:1076-1096`). On PHP ≥ 8.1, SQL errors surface as uncaught `mysqli_sql_exception` because nothing calls `mysqli_report` [FACT/INFERENCE] | REBUILD |
| DB-003 MyISAM | HIGH | **Partial** | InnoDB yes; no FKs or transactions | TAKE |
| DB-004 referential integrity | HIGH | **Partial** | Delete cascades improved (`5211b38` #769, `EntityDeleteCleanupTest.php`); orphan cleanup migrations 371/385; still no FKs | TAKE |
| DB-005 backup | HIGH | **Partial** | Dump now uses `DatabaseConnection` (`modules/install/backupDB.php:105-110`, after #765), so the reversed-argument fatal is gone [INFERENCE: not executed]. Still: the 5-required-parameter error handler (`:20`) turns any warning into an `ArgumentCountError`; `history` skipped (`:101-102`); NULLs dumped as `''` via `makeQueryString`; odd `john@mycompany.net` → access_level 500 rewrite (`:138`) | ADAPT; recommend `mysqldump` |
| DB-006 migrations | HIGH | **Partial** | §3 M10 | TAKE; REBUILD later |
| DB-007 schema drift | HIGH | **Partial** | Snapshot normalised (#773); upgrade-path CI (#843) | TAKE |
| DB-008 utf8mb3 | HIGH | **Fixed** | §3 M9 | TAKE |
| DB-009 MD5 / admin seed | HIGH | **Partial** | See SEC-001/003 | TAKE |
| DB-010 string SQL | HIGH | **Partial** | Several GHSA injection fixes; still no prepared statements | TAKE |
| DB-011 PII/EEO plaintext | HIGH | **Not fixed** | No encryption or erasure tooling added (grep) [INFERENCE] | REBUILD |

Mediums spot-checked: SEC-011 `eval` is unchanged (282 `eval(` calls upstream vs 286 in the fork; `unserialize` in `lib/Session.php:807`). SEC-015 is partial (headers but no CSP/HSTS). SEC-016 is partial (sort direction and filters hardened). SEC-019 is partial (FPDF/SimpleTest fixed; jQuery 1.3.2 and CKEditor 4 remain). API-008 is partial (`attachmentsReindex` requires SA; `install:maint` is still reachable unauthenticated via POST at `modules/install/ajax/maint.php:12-37`; `QueueCLI.php` and `rebuild_old_docs.php` have no CLI guard). SEC-023 is not fixed (phpMyAdmin is still in the compose file). [FACT]

---

## 5. Features available upstream

[FACT] These are user-visible additions since `d607279`, from commit and PR evidence.

- **Careers:** CAPTCHA (`20fcaf1` #785); required-field support (`d7fe1bd` #677); HTML job descriptions with sanitiser (`8b0dd61` #857, UTF-8 fix `0f7d7c4` #866); questionnaire fixes (#854); no spurious ownership mail (#862).
- **Addresses and locale:** `address2` (#675); country support on candidate/company/contact (#742, migration 382); country-aware OpenStreetMap ZIP lookup (#817); E.164 phones with a default country code (#686 series); IANA time zone column (#806); 12/24-hour time formats (#812); user date format respected (#683).
- **Activities:** manual activity date and time (#758, `date_occurred` column via migration 380); newest-first ordering (#717); "Status Change" activity type (#737, #741); "Call" renamed to "Not reached" (#726, migration 376); explicit type selection (#700); line breaks rendered (#733); closed jobs excluded from references (#764); shared schedule-event modal (#782); company contact activity stream (#688).
- **Pipeline:** "Candidate Declined" status 675 (#783, migration 393).
- **Job orders and contacts:** state optional (#743); contact title optional (#786).
- **Operations:** pending-migration gate (#803); demo data seed `db/cats_demo_data.sql` (#796); asset cache-busting (#749); email signature fix (#855).

---

## 6. Migration conflicts

### 6.1 Git merge (code)

- [FACT] A dry run was done in a throwaway clone at `scratchpad/phase3/mergetest` (branch HEAD `d89f19e`, upstream fetched from GitHub; deleted afterwards). Running `git merge --no-commit --no-ff upstream/master` gave "Automatic merge went well". There were **0 conflicted paths**, the staged diff was 650 files (+28,375/−89,270), and upstream touches **0 files under `docs/`**. The merged tree excluding `docs/` is **identical to `d5cf733`**. The merge was aborted and the clone removed.
- [INFERENCE] Upstream effectively fast-forwards our product code. The only practical choice is which upstream commit to take, not how to resolve conflicts.

### 6.2 Deployed-install (data/runtime) risks

| Risk | Evidence | Severity |
|---|---|---|
| **PHP ≥ 8.4.1 required** at install and in Composer. Hosts on PHP 7.x/8.0–8.3 cannot upgrade | `composer.json` `"php": "^8.4.1"`; `installwizard.php:5`; phpunit 13 | HIGH (hosting) [FACT] |
| **Irreversible schema changes:** InnoDB (375), utf8mb4 (390), `site_id` dropped (392), password hashes rewritten on login. No down-migrations; a downgrade requires restoring a backup | `Schema.php` | HIGH [FACT] |
| **Destructive data cleanup:** 371 deletes orphan `extra_field`; `scripts/385.php` deletes orphan activity/calendar/attachment rows **and deletes attachment directories on disk** (`:360-417`); 391 deletes site-180 users/settings | `Schema.php:1471,2097`; `scripts/385.php` | HIGH [FACT]. DB-001-corrupted rows may be classed as orphans and deleted [INFERENCE] |
| Installs that really used several `site_id`s get merged into one tenant when `site_id` is dropped | `Schema.php:2103-2297`: no guard found other than table existence | MEDIUM [INFERENCE] |
| Data rewrite: 372 decodes stored HTML entities (#702); 377 activity notes; 384/389 careers templates | `scripts/372.php`, `Schema.php:1522,1682,2021` | MEDIUM [FACT] |
| Long `ALTER TABLE` on large DBs; utf8mb4 index-prefix limits on MySQL < 5.7 / MariaDB < 10.2 | 375/390 | MEDIUM [INFERENCE] |
| Existing `config.php` is kept by admins. New code expects `SQL_CHARACTER_SET` etc.; removed constants are harmless, but the post-v0.11.1 upstream `config.php` is broken for LDAP (§3 M18) | `config.php` | MEDIUM [FACT] |
| Migrations now run only via maintenance. Until an admin runs it, logged-in users see the maintenance gate and careers returns 503 | `index.php:135-163` | MEDIUM, behaviour [FACT] |
| Test fixtures, installer, CI and phpunit all changed. Our Phase 0 test notes do not apply | #754, #756 | LOW [FACT] |

### 6.3 Behaviour changes users would notice

[FACT]
- State-changing actions are POST-only, so bookmarked or scripted GET delete URLs break, and stale pages hit "Invalid request" on CSRF.
- Direct `attachments/…` URLs return 403 on Apache.
- UI uploads of `.txt`/`.html` are rejected.
- The toolbar, the "Professional" page, the licence wizard, the in-app tests and multi-site `&s=` login are gone.
- "Call" is now "Not reached". Activity lists are newest-first. Activity type selection is mandatory.
- New Country, address2 and time-format settings.
- Optional careers CAPTCHA.
- `CATS_VERSION` still reads 0.10.0 on v0.11.x.

---

## 7. Phase 0 findings still open upstream

[FACT] These were verified at `d5cf733` (details in §4.2):

- **CRITICAL:** SEC-024 / API-002; DB-001.
- **HIGH, not fixed:** SEC-002, SEC-006, SEC-007, SEC-025 / API-004, SEC-027 / API-007, API-001, API-010, DB-002, DB-011.
- **HIGH, partial:** SEC-003, SEC-004, SEC-005, SEC-008, SEC-009, SEC-010, SEC-026, API-003, API-011, DB-003, DB-004, DB-005, DB-006, DB-007, DB-009, DB-010.
- **New since the fork point:** the `config.php` regression (§3 M18); `zipLookup` as an unauthenticated outbound proxy to Nominatim; CKEditor pinned to an EOL 4.22.1.

---

## 8. Recommendations

**[RECOMMENDATION] Strategy: rebase our product baseline onto upstream, then carry a thin security patch series and send it upstream.** Our fork has no code divergence, and upstream fixes the PHP 8 blocker plus most of the easier security debt. Re-implementing any of this ourselves would be waste. Keep our `docs/` as the planning layer.

Order:

1. **Decide the target commit.** Two options:
   - Merge upstream `master` `d5cf733` and immediately ADAPT `config.php`: restore the LDAP constants and production defaults.
   - Merge tag `v0.11.1` (`d83e426`) and cherry-pick the post-tag fixes #873 (`903c8c8`), #866 (`0f7d7c4`) and #867 (`cd93542`).

   Either way, **legal must review #864 (`be93937`) header changes before we distribute a build that contains them** (LICENSE_AND_DISTRIBUTION_ANALYSIS.md). Recommended: take v0.11.1 plus cherry-picks if legal has not cleared #864; otherwise take `d5cf733` with the config fix.
2. **Merge on a branch** (`git merge upstream/<target>`; expected conflict-free per §6.1). Run the upstream CI matrix (8.4.1/8.5) and the 0.9.4 upgrade test.
3. **Hotfix series before any deployment** (REBUILD, small patches, each with a Behat/PHPUnit regression test, offered upstream as a private advisory where exploitable):
   - (a) SEC-024: ignore the client `candidateID`.
   - (b) DB-001: add `data_item_type = DATA_ITEM_CANDIDATE` and route the final delete through `Candidates::delete()`.
   - (c) SEC-025: bind `attachmentID` to the candidate.
   - (d) SEC-027: allowlist datagrid modules and classes.
   - (e) SEC-007: `session_regenerate_id(true)` on login; secure/HttpOnly/SameSite session cookie params; rotate the CSRF token.
   - (f) `ajax_tags_*` access checks.
   - (g) SEC-009: `Content-Disposition: attachment` plus a whitelist in `createFromFile`.
   - (h) Disable Resfly and the phone-home by default, or remove them.
   - (i) SEC-002: disable forgot-password until a token reset exists.
   - (j) Authenticate `graphs` and `zipLookup`.
4. **Upgrade runbook for existing installs:**
   - Confirm PHP ≥ 8.4.1 and MySQL ≥ 5.7 / MariaDB ≥ 10.2 [INFERENCE on the DB minimums].
   - Take a full `mysqldump` **and** a copy of `attachments/` (migration 385 deletes files).
   - Check for multi-`site_id` data.
   - Run the maintenance migration.
   - Verify record counts.
   - Rotate the default admin password.
5. **CI adaptation:** make `composer audit` blocking, lint all PHP rather than only `src/`, and set JUnit `fail_on_failure: true`.
6. **Then** continue the 2.0 REBUILD items that upstream has not started: REST API (API-001), prepared statements/DB layer (DB-002/DB-010), FKs, the migration runner (DB-006), PII controls (DB-011), and front-end replacement (jQuery 1.3.2, CKEditor 4, Artichow).
7. **Track upstream continuously:** add an `upstream` remote and a monthly merge. Contribute fixes upstream to keep the divergence small.

Per-item classification summary: TAKE M1, M3, M4–M12, M14 (removals), M15–M17, M19. ADAPT M4, M6, M7, M13 (legal hold), M17, M18. REBUILD the open findings in §7, Resfly/phone-home, charts and the migration runner. KEEP OUR `docs/`. IGNORE the upstream dev Docker stack for production.

---

## 9. Facts vs inferences

- **FACT:**
  - Ancestry and commit counts; the empty non-docs divergence; the dry-run merge result.
  - All `file:line` citations; lint results.
  - Composer and lock versions; CI content.
  - Presence or absence of specific code (for example, no `session_regenerate_id`, no `data_item_type` in merge SQL, the `DataGrid` regex, the Resfly/phone-home endpoints, the `config.php` contents).
- **INFERENCE (not executed):**
  - Runtime success of the PHP 8.4 upgrade.
  - The backup dump now working.
  - LDAP fataling on the missing constants.
  - SQL errors surfacing as exceptions.
  - nginx ignoring `.htaccess`.
  - DB version limits for utf8mb4.
  - DB-001-damaged rows being deleted by migration 385.
  - Merged multi-site data.

## 10. Unknowns

- [UNKNOWN] GitHub release notes and the GHSA/CVE IDs for the 9 fork-merge commits (API not available in this session).
- [UNKNOWN] Whether upstream intends to fix the `be93937` `config.php` regression, and whether a v0.11.2 is planned.
- [UNKNOWN] Which CKEditor 4.x security fixes are missing from 4.22.1 compared with 4.25.1-lts.
- [UNKNOWN] Real-world duration and success of migrations 375/390/392 on large or legacy (MySQL 5.5/5.6) databases. They were not executed here.
- [UNKNOWN] Whether any of our intended deployments use LDAP, multiple `site_id`s or the Resfly parser.
- [UNKNOWN] Full PHP 8.4/8.5 deprecation coverage (dynamic properties and similar) at runtime. Only syntax was checked.
- [UNKNOWN] Legal acceptability of #864 header shortening and of the CKEditor licence change. This is for legal review; no opinion is given here.

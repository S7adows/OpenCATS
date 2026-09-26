# OpenCATS — Risk Register

**Scope.** Consolidated register of (A) risks carried by the *current* system if it is operated as-is, and (B) risks to the *transformation programme* itself. Each risk links to the detailed finding(s) in the domain audits. This register is the input to sequencing decisions in `RECOMMENDED_ROADMAP.md`.

**Method.** Synthesised from the domain audits in `docs/audit/` (ARCHITECTURE, DATABASE, SECURITY, API, UX_UI, PERFORMANCE, TESTING, DEPENDENCY, TECHNICAL_DEBT, FEATURE_INVENTORY). The highest-stakes claims were independently re-verified by the lead auditor against the code at commit `d607279` (see "Lead-auditor verification log" at the end). Likelihood is a qualitative judgement (**ASSUMPTION**) — High / Medium / Low — based on how reachable the defect is (e.g. unauthenticated vs. admin-only) and on deployment defaults.

---

## Summary table

| ID | Risk | Type | Severity | Likelihood |
|---|---|---|---|---|
| RISK-001 | Runtime is end-of-life: app cannot boot on PHP ≥ 8.0; only PHP 7.x (EOL) works | Operational / Security | CRITICAL | Certain |
| RISK-002 | Unauthenticated overwrite of any candidate record via the public careers portal | Security / Data integrity | CRITICAL | High (if portal enabled) |
| RISK-003 | Credential compromise: MD5 passwords, `admin`/`admin` default never forced to change, no MFA/lockout, session fixation | Security | CRITICAL | High |
| RISK-004 | Candidate merge silently corrupts unrelated records (activities/attachments/events/list entries of other entity types) | Data integrity | CRITICAL | Medium (whenever merge is used) |
| RISK-005 | Privacy/regulatory exposure: plaintext PII/EEO data, no consent/retention/erasure, resumes sent to a defunct third party over HTTP | Legal / Compliance | CRITICAL | High (EU/UK/CA deployments) |
| RISK-006 | Stored XSS + no CSRF + weak AJAX authorization → cross-user account actions and data destruction | Security | HIGH | High |
| RISK-007 | Uploaded files served inline from web root; `.htaccess` protections ignored on the shipped nginx stack; attachment IDOR | Security | HIGH | Medium |
| RISK-008 | Silent data loss / partial writes: MyISAM (no transactions/FKs), DB errors never detected, backup tool cannot dump data | Data integrity / DR | HIGH | Medium |
| RISK-009 | Schema drift: fresh vs. upgraded installs have different schemas; migrations run implicitly on first request | Operational / Migration | HIGH | High |
| RISK-010 | Release artefact is broken (no `vendor/`), CI does not fail on test failures and tests only PHP 7.2 | Delivery | HIGH | High |
| RISK-011 | Characterisation gap: near-zero automated coverage of domain behaviour makes any refactor/migration unverifiable | Transformation | HIGH | Certain |
| RISK-012 | Big-bang rewrite risk: losing implicit behaviour (status side-effects, reports, careers templates, EEO) and stalling for a long period | Transformation | HIGH | Medium |
| RISK-013 | Data migration risk: polymorphic IDs, sentinel dates, double-escaped text, orphans, mixed charsets | Transformation | HIGH | High |
| RISK-014 | Vulnerable/EOL third-party components (jQuery 1.3.2, CKEditor 4, fpdf 1.53, artichow, SimpleTest, Sphinx API) | Security / Supply chain | HIGH | Medium |
| RISK-015 | Scalability ceiling: table locks, REGEXP full scans over resume text, session lock per request, local-disk state | Performance | MEDIUM | Medium (grows with data) |
| RISK-016 | Hidden executable code paths: `eval()` of hooks/renderers/migrations, including values from `$_SESSION` | Security / Maintainability | MEDIUM | Low–Medium |
| RISK-017 | Licensing / IP ambiguity: dual CPL 1.1a + MPL 2.0 code, GPL Sphinx API, "Powered by" attribution obligation, CKEditor 4 LTS licensing | Legal | MEDIUM | Medium |
| RISK-018 | Small maintainer base; bus factor ≈ 1 on upstream | Organisational | MEDIUM | High |
| RISK-019 | Scope creep: product gaps list (25 items) far exceeds a realistic first release | Transformation | MEDIUM | High |
| RISK-020 | Operational blind spots: no logging/observability, cron-dependent reminders silently not sent | Operational | MEDIUM | High |

---

## A. Risks of operating the current system

### RISK-001 — End-of-life runtime lock-in
- **Severity:** CRITICAL · **Likelihood:** Certain
- **Finding:** The application cannot start on PHP 8.0+ and is therefore pinned to PHP 7.x, which receives no security fixes (PHP 7.4 EOL Nov 2022; CI/Docker use 7.2, EOL Nov 2020).
- **Evidence (lead-verified):** `lib/CATSUtility.php:108` `$data{0}` → `php -l` on PHP 8.4: *"syntax error, unexpected token "{" … on line 108"*; the file is included by `index.php:61` and `ajax.php:43`. `index.php:93`, `ajax.php:50`, `QueueCLI.php:59` call `get_magic_quotes_runtime()`, which `function_exists()` reports as absent on PHP 8.4 (no polyfill in repo). `lib/DataGrid.php:1292,1299,1328` and `lib/MRU.php:159` use legacy `implode($array, $glue)` → `TypeError` on PHP 8. CI matrix `['7.2']` (`.github/workflows/ci.yml:21`); `docker/docker-compose.yml` uses `opencats/php-base:7.2-fpm-alpine`. Details: `ARCHITECTURE.md` ARCH-001, `TECHNICAL_DEBT.md`.
- **Impact:** Every deployment runs an unpatched language runtime; OS distributions and hosting providers no longer ship PHP 7; security scanners fail compliance checks.
- **Recommendation:** Phase 1 priority: minimal, test-backed PHP 8.3 compatibility patch set (parse errors, removed functions, `implode` order, dynamic properties, `mysqli` exception mode) and a PHP 8.3 CI matrix — as a *bridge* only, not as the modernisation.

### RISK-002 — Unauthenticated candidate overwrite (careers portal)
- **Severity:** CRITICAL · **Likelihood:** High when the careers portal is enabled with at least one public job
- **Evidence (lead-verified):** `modules/careers/CareersUI.php:725` reads `candidateID` from `$_POST`; `:750` passes it to `onApplyToJobOrder()`; `:1279-1290` calls `$candidates->update($candidateID, …)` with submitter-supplied data and no ownership proof. `SECURITY_AUDIT.md` SEC-024 / `API_AUDIT.md` API-002. Compounded by argument misalignment corrupting EEO fields (`API_AUDIT.md` API-003).
- **Impact:** Anyone on the internet can alter PII/EEO data and ownership of arbitrary candidates by iterating IDs — a reportable integrity breach.
- **Recommendation:** Hotfix in Phase 1 week 1: never accept candidate identity from the client; add a regression test.

### RISK-003 — Credential and session compromise
- **Severity:** CRITICAL · **Likelihood:** High
- **Evidence (lead-verified):** unsalted `md5()` + `!==` compare (`lib/Users.php:93,701,755,840`); seed password `'admin'` (`db/cats_schema.sql:1108`) hashed in place by migration `modules/install/Schema.php:1329`, while the change-password prompt only triggers for `'cats'` (`modules/login/LoginUI.php:332`, `constants.php:178`) → effective default `admin`/`admin` never prompted; `Login.tpl:94-103` embeds `admin`/`cats` auto-login JS; no `session_regenerate_id` anywhere; no lockout. `SECURITY_AUDIT.md` SEC-001/003/007/014; `DATABASE_AUDIT.md` DB-009.
- **Impact:** Trivial takeover of unhardened installs; offline cracking of the whole user table after any SQL/backup leak.
- **Recommendation:** Phase 1: `password_hash` with rehash-on-login, forced first-login change for any default credential, session regeneration + cookie flags, rate limiting.

### RISK-004 — Candidate merge corrupts unrelated entities
- **Severity:** CRITICAL · **Likelihood:** Medium (every use of the duplicates merge feature)
- **Evidence (lead-verified):** `lib/Candidates.php:1314-1359` — `UPDATE activity|attachment|calendar_event SET data_item_id = … WHERE data_item_id = … AND site_id = …` with **no `data_item_type` predicate**, so rows of companies/contacts/job orders that share the numeric ID are re-parented to the candidate; `saved_list_entry` likewise at `:1627`; the final candidate delete lacks a `site_id` filter (`:1579`). `DATABASE_AUDIT.md` DB-001; `FEATURE_INVENTORY.md` FEAT-002.
- **Impact:** Silent, irreversible cross-entity corruption; cannot be detected without a data audit.
- **Recommendation:** Phase 1: disable or fix merge (add `data_item_type = DATA_ITEM_CANDIDATE`), and run a one-off data-integrity scan on production copies before migration.

### RISK-005 — Privacy and regulatory exposure
- **Severity:** CRITICAL · **Likelihood:** High for any EU/UK/California deployment
- **Evidence:** plaintext EEO special-category data (`db/cats_schema.sql:188-191`); no consent/retention/erasure (`PRODUCT_GAPS.md` GAP-002); deletions leave residual PII (`DATABASE_AUDIT.md` DB-011); resume text (and the license key) is sent via SOAP over plain HTTP to `soap.resfly.com` whenever a parse is triggered — candidate-add "parse" (`modules/candidates/CandidatesUI.php:895`), careers `resumeParse` (`modules/careers/CareersUI.php:524-527`), mass import (`modules/import/ImportUI.php:1374`) — **even though `config.php:51` sets `PARSING_ENABLED` to `false`**, because `LicenseUtility::getParsingStatus()` returns `true` when parsing is disabled and `isParsingEnabled()` returns `true` on every path (`lib/License.php:687-727` — lead-verified; `wsdl/parse.wsdl:78`). The phone-home version check (`lib/NewVersionCheck.php:98-133`, sends site name and license key) is disabled on a fresh install (`db/cats_schema.sql:1044`, `disable_version_check=1`) but can be enabled by admins.
- **Impact:** Fines, breach notification duties, procurement disqualification.
- **Recommendation:** Phase 1: make `isParsingEnabled()` honour `PARSING_ENABLED` (or remove Resfly entirely) and keep the version check off; document data flows. Privacy-by-design in the new platform (GAP-002).

### RISK-006 — XSS + CSRF + missing AJAX authorization
- **Severity:** HIGH · **Likelihood:** High
- **Evidence:** 1,302 of 1,705 template echoes unescaped (`SECURITY_AUDIT.md` SEC-005); zero CSRF tokens (lead-verified: no `csrf|nonce|_token` in first-party PHP/TPL); `ajax.php` accepts GET for mutations; `SecureAJAXInterface` checks login only (`lib/AJAXInterface.php:210-216`) — SEC-004/026, API-005/006.
- **Impact:** A malicious candidate name/resume or a hostile web page can act as a logged-in recruiter (delete data, send mail via the SMTP relay, exfiltrate).
- **Recommendation:** Phase 1 hardening: CSRF middleware in `index.php`/`ajax.php`, POST-only mutations, escape-by-default helper applied to the shared header/MRU/title first, per-handler access checks; CSP header.

### RISK-007 — File upload/serving and attachment IDOR
- **Severity:** HIGH · **Likelihood:** Medium
- **Evidence:** uploads stored under web root with 0777 dirs; `html` whitelisted and served `inline`; protections are Apache `.htaccess` while Docker uses nginx; download authorisation is an md5 of a stored directory name without `site_id` scoping (`modules/attachments/AttachmentsUI.php:83-90,127`, `lib/FileUtility.php:192`) — SEC-008/009.
- **Recommendation:** Phase 1: force `Content-Disposition: attachment`, drop active-content types, ship nginx deny rules; new platform: object storage with signed URLs and malware scanning.

### RISK-008 — Silent data loss and non-recoverability
- **Severity:** HIGH · **Likelihood:** Medium
- **Evidence:** 55/55 tables MyISAM (lead-verified: `grep -o "ENGINE=[A-Za-z]*" db/cats_schema.sql | sort | uniq -c` → `55 ENGINE=MyISAM`); `DatabaseConnection::query()` error branches test `connect_errno` on a result (`lib/DatabaseConnection.php:181-198`) so failed queries go unnoticed; in-app backup cannot dump data and skips `history` (`modules/install/backupDB.php:152`) — DB-002/003/005.
- **Impact:** Half-applied deletes/merges after timeouts; crashed tables after unclean shutdown; operators believe they have backups they do not.
- **Recommendation:** Phase 1: document and test `mysqldump --single-transaction` + attachments backup; convert to InnoDB + utf8mb4 via a proper migration tool; make DB errors throw and log.

### RISK-009 — Schema drift and implicit migrations
- **Severity:** HIGH · **Likelihood:** High (every long-lived install)
- **Evidence:** tag tables never created by the upgrade path; column-width and default differences between `cats_schema.sql` and `Schema.php` (`DATABASE_AUDIT.md` DB-007); migrations execute inside the first request of any new session, including anonymous careers visitors, with `eval` and removed `mysql_*` calls (`lib/ModuleUtility.php:443-573`; ARCH-005, DB-006).
- **Impact:** There is no single "current schema"; migration tooling must detect and reconcile variants; an upgrade can be triggered by a crawler.
- **Recommendation:** Phase 1: freeze legacy migrations, introduce an explicit CLI migration tool with a baseline + reconciliation script, and a schema-diff check in CI.

### RISK-010 — Broken delivery pipeline
- **Severity:** HIGH · **Likelihood:** High
- **Evidence:** the tag-release job zips the checkout without `composer install` (`.github/workflows/ci.yml` release job) while runtime requires `./vendor/autoload.php` (`lib/Mailer.php:43`, `lib/TemplateUtility.php:38` — lead-verified); JUnit publishing uses `fail_on_failure: false`; `composer audit || true`; lint covers `src/` only; PHP matrix only 7.2 (`TESTING_AUDIT.md`, `ARCHITECTURE.md` ARCH-002).
- **Recommendation:** Phase 1: make CI authoritative (fail on test failure, lint everything, PHP 7.4 + 8.3 matrix, build release with `composer install --no-dev`).

### RISK-014 — Vulnerable and EOL components
- **Severity:** HIGH · **Likelihood:** Medium
- **Evidence:** `js/jquery-1.3.2.min.js` loaded on every page (multiple public XSS CVEs — external knowledge); CKEditor 4 (EOL for open-source line; `composer.lock`); fpdf 1.53, artichow, SimpleTest, Sphinx API vendored in `lib/`; see `DEPENDENCY_AUDIT.md`.
- **Recommendation:** Upgrade/replace in the new UI; in the bridge, restrict CKEditor usage and apply CSP.

### RISK-015 — Scalability ceiling
- **Severity:** MEDIUM · **Likelihood:** grows with data volume
- **Evidence:** REGEXP full scans of `attachment.text` twice per search (`lib/DatabaseSearch.php:362`, `lib/Search.php:1939-2024`); `SQL_CALC_FOUND_ROWS` grids with row-multiplying joins; per-request writes (`user_login`, `site.page_views`); session lock held for the whole request; local-disk attachments/sessions/`modules.cache` block horizontal scaling (`PERFORMANCE_AUDIT.md` PERF-001…018).
- **Recommendation:** Measure first (slow query log, APM); fix the top queries only where the bridge requires it; solve structurally in the new platform (search engine, InnoDB, object storage, stateless app tier).

### RISK-016 — Hidden executable code paths (`eval`)
- **Severity:** MEDIUM
- **Evidence:** 232+ `eval(Hooks::get(...))` points (`lib/Hooks.php:52-72`), `ajax.php:127` `eval($filter)`, DataGrid renderers (`lib/DataGrid.php:1530`), wizard pages (`modules/wizard/WizardUI.php:181`), `PHP:` migrations — ARCH-004, SEC-011.
- **Impact:** Any write primitive to the session, DB-stored renderers or module files becomes code execution; static analysis cannot see behaviour.
- **Recommendation:** Inventory implemented hooks (only a handful exist), replace with explicit calls/events; forbid `eval` via static analysis in CI.

### RISK-020 — Operational blind spots
- **Severity:** MEDIUM
- **Evidence:** no logging facility (errors via `die()`/HTML — ARCH-020); reminders need an unprovisioned cron that fatals on PHP 8 (`QueueCLI.php:59`, ARCH-016); RSS entry point broken on every PHP version (`rss/index.php:37`, ARCH-022).
- **Recommendation:** Structured logging + health endpoint in the bridge; durable queue in the new platform.

---

## B. Risks to the transformation programme

### RISK-011 — No safety net for change
- **Severity:** HIGH · **Likelihood:** Certain
- **Finding:** Automated tests cover utilities and a few Behat flows; there are no tests of pipeline side-effects, careers apply, permissions matrix, import/export, reports or merge (`TESTING_AUDIT.md`). Existing CI does not fail on red tests.
- **Impact:** Any refactor or migration can silently change behaviour that users rely on (report numbers, e-mails sent on status change, EEO capture).
- **Recommendation:** Before modifying behaviour: golden-master HTTP characterisation tests for the top journeys, DB-snapshot assertions for status changes/merge/delete, and report-number fixtures. Treat these as the acceptance baseline for the new platform too.

### RISK-012 — Big-bang rewrite
- **Severity:** HIGH · **Likelihood:** Medium
- **Finding:** The codebase has high implicit behaviour density (status-change side effects in one 400-line function `modules/candidates/CandidatesUI.php:2900-3302`; careers templates stored as DB HTML; EEO logic spread across modules; 9 steps of side-effects per status change — `FEATURE_INVENTORY.md`). A from-scratch rewrite that must reach parity before release historically stalls.
- **Recommendation:** Strangler-fig: new platform in front (reverse proxy), migrate capability slices (auth → careers → candidates/pipeline API → UI), keep legacy running read/write until each slice is cut over. Define parity by the characterisation tests (RISK-011), not by reading code.

### RISK-013 — Data migration complexity
- **Severity:** HIGH · **Likelihood:** High
- **Finding:** Polymorphic `(data_item_type, data_item_id)` references with colliding IDs across entity types; `1000-01-01`/`0000-00-00` sentinel dates; HTML-escaped-on-input text that has been escaped repeatedly on edit (`UX_UI_AUDIT.md` UX-003); orphans from non-cascading deletes; utf8mb3 + mixed collations; EAV extra fields; schema variants (RISK-009); possible pre-existing corruption from RISK-004.
- **Recommendation:** Build the migration as a product: profiling scripts first (orphans, sentinel dates, entity-decoding candidates, collation conflicts), idempotent ETL with reconciliation reports (row counts, checksums per entity), rehearsals on anonymised production copies, and a rollback plan.

### RISK-017 — Licensing and IP
- **Severity:** MEDIUM
- **Evidence:** `LICENSE.md` — OpenCATS code under MPL 2.0, original CATS code under CATS Public License 1.1a; "Powered by OpenCATS" attribution in `lib/TemplateUtility.php:816-831` and `modules/careers/Blank.tpl:38-41`; Sphinx API is GPL (`lib/sphinx/`); CKEditor 4 versions after 4.22 are distributed under a commercial LTS licence (external knowledge — ASSUMPTION, verify `composer.lock` version and terms).
- **Impact:** A commercial/enterprise distribution must respect file-level MPL obligations and CPL attribution; GPL code bundled in a non-GPL distribution is a compliance risk.
- **Recommendation:** Legal review of licence obligations before the new product's licensing model is decided; remove GPL Sphinx API and CKEditor 4 in the new stack; keep a third-party notice file.

### RISK-018 — Upstream maintainer concentration
- **Severity:** MEDIUM · **Likelihood:** High
- **Evidence:** in the available (shallow, 57-commit, 2022–2026) history, one author accounts for the majority of commits (`git shortlog -sn`: RussH 32 + variants); upstream security contact is a single e-mail (`Security.MD`). This fork (`S7adows/OpenCATS`) inherits that. Full history not available in this clone (UNKNOWN beyond 2022).
- **Impact:** Little upstream capacity to absorb or review large changes; the transformation should assume it owns the code.
- **Recommendation:** Decide fork strategy explicitly (hard fork vs. upstream contributions for security fixes); contribute Phase 1 security fixes upstream where feasible (responsible disclosure first for RISK-002/003/004).

### RISK-019 — Scope creep
- **Severity:** MEDIUM · **Likelihood:** High
- **Finding:** 25 product gaps, 100+ technical findings.
- **Recommendation:** Fixed phase exit criteria (see roadmap); a single prioritised backlog; product decisions (agency vs. corporate TA focus) made before Phase 2 design.

---

## Lead-auditor verification log

The following claims were independently re-checked by the lead auditor (commands run read-only at commit `d607279`):

| Claim | Check | Result |
|---|---|---|
| PHP 8 parse failure | `php -l lib/CATSUtility.php` (PHP 8.4.19) | Parse error line 108 |
| Removed function | `php -r 'var_dump(function_exists("get_magic_quotes_runtime"));'` | `bool(false)`; 11 call sites, no polyfill |
| MD5 passwords | `sed -n '/function isCorrectLogin/,/^    }/p' lib/Users.php` | `!== md5($password)` |
| Default admin | `db/cats_schema.sql:1108`, `modules/install/Schema.php:1329`, `modules/login/LoginUI.php:332` | seed `'admin'` → `md5(password)`; prompt only for `'cats'` |
| Forgot password | `grep -rn "function getPassword"` | Not defined on `Users` → fatal (SEC-002 corrected accordingly) |
| No CSRF | `grep -rln "csrf\|CSRF\|_token\|nonce"` over first-party PHP/TPL | No hits |
| Careers overwrite | `modules/careers/CareersUI.php:725,750,1279-1290` | Confirmed |
| Merge corruption | `lib/Candidates.php:1310-1350` | No `data_item_type` predicate |
| DataGrid sanitizer | `php -r 'var_dump(preg_replace("[^A-Za-z0-9]", "", "../../x/y"));'` | `"../../x/y"` (no-op) |
| Bulk-selection bug | `lib/DataGrid.php:257-259` vs `:1988-1993` | `serialize()` encoded, `json_decode()` decoded; `if ($index = 'exportIDs')` assignment |
| Private calendar events | `lib/Calendar.php:132-145` | No public/private predicate in SQL |
| Parsing always enabled | `lib/License.php:687-727`; call sites via `grep -rn isParsingEnabled` | Every branch returns `true`, including when `PARSING_ENABLED=false`; SOAP call made on user-triggered parse/import |
| Release without vendor | `.github/workflows/ci.yml` release job; `lib/Mailer.php:43` | Confirmed |
| MyISAM everywhere | `grep -o "ENGINE=..." db/cats_schema.sql` | 55 × MyISAM |

## Facts vs Assumptions
- **FACT:** All evidence citations above; the verification log.
- **ASSUMPTION:** Likelihood ratings; regulatory impact; status of external services and licences (Resfly, CKEditor LTS); that production deployments resemble the shipped Docker configuration.

## Unknowns / Needs Further Investigation
- Actual deployment topology of target customers (Apache vs nginx, PHP version, whether careers portal / LDAP / demo mode are enabled).
- Whether RISK-004 has already corrupted production data (needs a data scan).
- Data volumes and growth (sizing for migration and search).
- Legal position on licence obligations and on AI features.

# OpenCATS — Database and Schema Assessment
Complete edition · 2026-09-26 · code at d607279 (OpenCATS 0.9.7.4)

## Scope and method

- **Inspected:** `db/cats_schema.sql` (all 55 `CREATE TABLE` blocks and seed rows), `db/upgrade-*.sql`, `test/data/test.sql`, `test/data/securityTests.sql`, `modules/install/Schema.php` (all revisions), `modules/install/ajax/ui.php` (installer DB steps), `modules/install/backupDB.php`, `lib/ModuleUtility.php`, `lib/DatabaseConnection.php`, and the SQL in the `lib/` model classes (`Candidates`, `Pipelines`, `JobOrders`, `Companies`, `Contacts`, `ExtraFields`, `History`, `Users`, `Tags`, `Mailer`, `Search`, `DatabaseSearch`, `Calendar`, `Statistics`, `SystemInfo`, `Session`, `Site`).
- **Commands (read-only):** `grep -n`/`grep -c` over the schema and code; an `awk` pass over `db/cats_schema.sql` for per-table column, index, `site_id`, engine and collation counts; an `awk` scan of `lib/`, `modules/` and `ajax/` for polymorphic joins that use `data_item_id` with no `data_item_type` within five lines (helper outputs kept outside the repository); `sed -n` checks of every carried-over `file:line`; `git show 19f1fcd`; two `php -r` checks with the local PHP 8.4 CLI (length of the serialized status map; `empty(trim("0"))`). Phase 0's PHP 8.4 language checks (TypeError/ArgumentCountError) were not re-run and are cited as Phase 0 results.
- **Runtime evidence used:** `docs/baseline/KNOWN_RUNTIME_ERRORS.md` (RT-01, RT-02, RT-04, RT-08), `INSTALLATION.md`, `ENVIRONMENT.md`, `SMOKE_TEST.md` (steps #NN), `evidence/demo-data-path/*` (seed log, fatal page, PHP log), `evidence/empty-db-before-seed/first-request.html`, `evidence/final-run/mariadb.log`. The baseline ran on PHP 7.2.16 / MariaDB 10.7.8 with a near-empty database (4 candidates, 1 job order).
- **Not done:** nothing was executed against a database. No merge, delete, backup, restore, import or upgrade was run for this edition. Server settings of the baseline database (`@@sql_mode`, `@@time_zone`) were not recorded, so statements about them are marked as unknown or inference.
- **Out of scope here:** exploitation detail (see `SECURITY_AUDIT.md`), query latency (see `PERFORMANCE_AUDIT.md`), target data model and migration planning (a later phase).

## Summary

| ID | Title | Severity | Confirmation |
|---|---|---|---|
| DB-001 | Candidate merge re-points other entities' activities, attachments, events and list entries | CRITICAL | Static |
| DB-002 | SQL errors are never detected by the access layer; the installer ignores failed statements | HIGH | Runtime |
| DB-003 | All 55 tables are MyISAM: no transactions, no foreign keys, table locks, no crash recovery | HIGH | Static |
| DB-004 | No referential integrity; hand-written cascades leave orphan rows | HIGH | Static |
| DB-005 | Built-in backup cannot dump data on PHP 7/8 and skips `history` | HIGH | Partial |
| DB-006 | Migrations are `eval`'d strings run inside web requests; old revisions fatal on PHP 7 | HIGH | Runtime |
| DB-007 | Fresh and upgraded installs end with different schemas | HIGH | Runtime |
| DB-008 | `utf8` (utf8mb3) everywhere with mixed collations; 4-byte characters cannot be stored | HIGH | Static |
| DB-009 | Unsalted MD5 passwords hashed inside SQL; seeded `admin`/`admin` is never forced to change | HIGH | Runtime |
| DB-010 | SQL built by string interpolation; several unescaped values reach the database | HIGH | Static |
| DB-011 | PII and EEO data in plaintext, copied into many tables, with no erasure path | HIGH | Static |
| DB-012 | Tenant column `site_id` is vestigial and inconsistently enforced | MEDIUM | Static |
| DB-013 | No retention policy; deletes remove pipeline status history and change past reports | HIGH | Static |
| DB-014 | Weak data typing (money as text, free-text status, sentinels, swapped lat/lng) | MEDIUM | Static |
| DB-015 | Extra-field values keyed by field name, with no uniqueness and weak indexes | MEDIUM | Static |
| DB-016 | `history` audit table is incomplete, mutable and excluded from backups | MEDIUM | Static |
| DB-017 | The application never sets `sql_mode`; behaviour depends on server defaults | MEDIUM | Static |
| DB-018 | Pipeline table has no unique `(candidate_id, joborder_id)`; check-then-insert race | MEDIUM | Static |
| DB-019 | `settings` key/value store: no unique key and a malformed `DELETE` | MEDIUM | Static |
| DB-020 | Time zones handled by rewriting SQL text around a fixed `OFFSET_GMT` | MEDIUM | Static |
| DB-021 | Schema-level search gaps: no FULLTEXT, `REGEXP '[[:<:]]'`, function-wrapped predicates | MEDIUM | Runtime |
| DB-022 | Dead tables and code that queries tables that do not exist | LOW | Static |
| DB-023 | Access-layer hygiene: `set_time_limit(0)` per query, wrong error accessor, no TLS, no logging | LOW | Static |
| DB-024 | Seed and fixture hygiene: fixed license key and UID, test sites, legacy demo dump | LOW | Runtime |
| DB-025 | Pipeline list joins attachments without `data_item_type` | LOW | Static |
| DB-026 | Stored text is a mix of raw and HTML-encoded values, depending on the write path | MEDIUM | Static |
| DB-027 | Starting the app against an unseeded database builds a partial schema | MEDIUM | Runtime |
| DB-028 | Failed text extraction stores `attachment.text = NULL` with no retry; resumes become unsearchable | MEDIUM | Runtime |

28 findings — 1 CRITICAL / 11 HIGH / 12 MEDIUM / 4 LOW · Runtime 8 / Static 19 / Partial 1 / Unverified 0 (no withdrawn or merged stubs).

---

## 1. Platform, engine, character set and SQL mode

### DB-003 — All 55 tables are MyISAM: no transactions, no foreign keys, table locks, no crash recovery
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-004, PERF-009*

- **Confirmed fact:** Every table in `db/cats_schema.sql` is `ENGINE=MyISAM`. There is no `FOREIGN KEY` and no `REFERENCES` clause in the schema. `DatabaseConnection` offers `beginTransaction()/commitTransaction()/rollbackTransaction()`, but they send `BEGIN`/`COMMIT` with errors ignored. The only caller is `lib/Profile.php`, which is dead code (DB-022). Multi-statement operations (candidate delete, company delete, candidate merge, pipeline status change) therefore run without atomicity.
- **Evidence:**
  - `grep -o "ENGINE=[A-Za-z]*" db/cats_schema.sql | sort | uniq -c` → `55 ENGINE=MyISAM`; `grep -c "FOREIGN KEY\|REFERENCES" db/cats_schema.sql` → `0`.
  - `lib/DatabaseConnection.php:718-729` — `// Ignore errors (if called for MyISAM, for example)` then `$this->query('BEGIN', true);`.
  - `lib/Profile.php:390-391` — `// Begin transaction (if one delete fails, roll everything back, I <3 InnoDB)`; no other caller in `lib/`, `modules/`, `src/`.
  - `db/upgrade-0.6.x-0.7.0.sql:80,84,88` — `ALTER TABLE … TYPE = MYISAM` converts three legacy InnoDB tables back to MyISAM.
  - `lib/InstallationTests.php:425,429` — the installer's permission test creates its test table as MyISAM.
  - Runtime: the baseline database was built from this schema on MariaDB 10.7.8 (`INSTALLATION.md` §1 step 5a, 188 statements, 0 errors). Table engines were not listed at runtime, so this remains a static finding.
- **Impact:** A PHP fatal, timeout or lost connection in the middle of a multi-statement operation leaves half-applied changes (for example a candidate row deleted but its pipelines kept). Every write takes a table lock, so concurrent writers and long reads block each other. After an unclean shutdown MyISAM tables can be marked crashed and need `REPAIR TABLE`, with possible row loss. Hosted MySQL services and clusters that require InnoDB cannot run this schema as shipped (inference from vendor documentation).
- **Severity:** HIGH — data-integrity risk on every multi-step write, and a barrier to any change that needs transactions or foreign keys.
- **Recommendation:** Move the schema to a transactional engine and make `beginTransaction()` fail loudly instead of ignoring errors. Until then, treat every multi-statement operation as non-atomic when assessing data quality.
- **Unknown / needs further validation:** How often crashed tables or partial writes have occurred in real installs. Needs `CHECK TABLE` output and error logs from production databases.

### DB-008 — `utf8` (utf8mb3) everywhere with mixed collations; 4-byte characters cannot be stored
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-002, DB-017*

- **Confirmed fact:** The connection uses `SQL_CHARACTER_SET = 'utf8'`. All tables are `DEFAULT CHARSET=utf8`. 39 tables declare `COLLATE=utf8_unicode_ci`; 16 declare no collation and fall back to the server default for `utf8` (normally `utf8_general_ci`). No file in the repository uses `utf8mb4`. `utf8` in MySQL/MariaDB is the 3-byte `utf8mb3` character set, which cannot hold characters outside the Basic Multilingual Plane (emoji, some CJK extension characters).
- **Evidence:**
  - `config.php:136` — `define('SQL_CHARACTER_SET', 'utf8');`; `lib/DatabaseConnection.php:128` — `mysqli_set_charset($this->_connection, SQL_CHARACTER_SET);`; `db/cats_schema.sql:8` — `SET NAMES utf8`.
  - `grep -o "COLLATE=utf8_unicode_ci" db/cats_schema.sql | wc -l` → 39; `grep -c "DEFAULT CHARSET=utf8;" db/cats_schema.sql` → 16.
  - The 16 tables without an explicit collation: all six `career_portal_*` tables, `eeo_ethnic_type`, `eeo_veteran_type`, `extension_statistics`, `extra_field`, `http_log`, `http_log_types`, `queue`, `sph_counter`, `xml_feed_submits`, `xml_feeds` (awk pass). Example: `extra_field` (`db/cats_schema.sql:665`) vs `extra_field_settings` (`:682`, `utf8_unicode_ci`).
- **Impact:** A candidate name, note or resume text containing a 4-byte character is either rejected (strict mode, error 1366) or truncated at that character (non-strict mode), depending on the server's `sql_mode` (DB-017). Because query errors are not detected (DB-002), a rejected write looks like a success to the user. Comparing a `utf8_general_ci` column with a `utf8_unicode_ci` column in one expression can raise "Illegal mix of collations". These effects follow from documented MySQL/MariaDB behaviour; none was observed in the baseline, whose test data contained only ASCII.
- **Severity:** HIGH — silent loss or rejection of user text on common modern input (emoji in names, notes, resumes).
- **Recommendation:** Move tables and the connection to `utf8mb4` with one explicit collation for all tables, and check the index prefix lengths (`IDX_key_skills(key_skills(255))`, `IDX_site_id_email_1_2`) against the byte limit of the chosen engine.
- **Unknown / needs further validation:** Whether real databases already contain truncated values. Needs a scan of text columns in a production copy for values that end where a 4-byte character would have been (for example resume text shorter than the source file's text).

### DB-017 — The application never sets `sql_mode`; behaviour depends on server defaults
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-006, DB-008*

- **Confirmed fact:** The schema dump sets `SQL_MODE=''` and then `NO_AUTO_VALUE_ON_ZERO` only for its own load session and restores the old value at the end. Runtime connections never set a mode. The code contains patterns whose result depends on the mode: zero-date literals and `TEXT … DEFAULT ''` in migrations, and string values longer than the target column with no validation in PHP (for example `joborder.title varchar(64)`).
- **Evidence:**
  - `db/cats_schema.sql:10,12,1188` (set and restore of `SQL_MODE`).
  - No `sql_mode` string in `lib/` or `modules/` (`grep -rn sql_mode lib modules` → nothing).
  - Zero dates: `modules/install/Schema.php:178,465,845,1217`. `TEXT` defaults: `:869,1118,1226`.
  - `GROUP BY candidate.candidate_id` with non-aggregated joined columns: `lib/Candidates.php:546-549`.
- **Impact:** The same input is truncated with a warning on one server and rejected on another. On MySQL 5.7+ defaults (`STRICT_TRANS_TABLES`, `NO_ZERO_DATE`, `ONLY_FULL_GROUP_BY`) several migrations fail. MariaDB 10.2+ defaults (strict, without `NO_ZERO_DATE`) behave differently again.
- **Severity:** MEDIUM — correctness depends on an unmanaged server setting; the damage is mostly indirect (through DB-002 and DB-008).
- **Recommendation:** Set an explicit session `sql_mode` when connecting, so that every install behaves the same, and make the code respect column lengths before writing.
- **Unknown / needs further validation:** The `sql_mode` of the baseline MariaDB 10.7.8 was not recorded (`mariadb.log` shows only start-up notes), nor that of production installs. Needs `SELECT @@version, @@sql_mode` on real deployments.

---

## 2. Referential integrity and destructive operations

### DB-001 — Candidate merge re-points other entities' activities, attachments, events and list entries
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-004, DB-010, DB-012, DB-025*

- **Confirmed fact:** `Candidates::mergeDuplicates()` moves child rows of the duplicate ("new") candidate to the surviving ("old") candidate with `UPDATE … SET data_item_id = <old> WHERE data_item_id = <new> AND site_id = …`. The statements for `activity`, `attachment`, `calendar_event` and `saved_list_entry` do not filter on `data_item_type`. Every table has its own `AUTO_INCREMENT` starting at 1, so the same number is used by a candidate, a company, a contact and a job order. Rows that belong to company N, contact N or job order N (where N is the duplicate candidate's id) are re-pointed to record `<old>` of the same type, that is, to a different company, contact or job order. The final `DELETE FROM candidate` has no `site_id` predicate.
- **Evidence:**
  - `lib/Candidates.php:1314-1328` (`activity`), `:1330-1344` (`attachment`), `:1346-1360` (`calendar_event`) — `WHERE data_item_id = %s AND site_id = %s`, no type filter.
  - `lib/Candidates.php:1626-1643` (in `mergeLists()`, called at `:1431`) — `UPDATE saved_list_entry SET data_item_id = %s WHERE data_item_id = %s AND saved_list_id NOT IN(%s) AND site_id = %s`. The follow-up `DELETE` at `:1648-1660` does filter on `data_item_type`, which shows the omission above is not intended.
  - `lib/Candidates.php:1578-1584` — `DELETE FROM candidate WHERE candidate_id = %s` (no `site_id`), and it bypasses `Candidates::delete()`, so the duplicate's extra fields and questionnaire history are not removed.
  - Reached from `modules/candidates/CandidatesUI.php:334-340` (`a=mergeInfo`, requires `ACCESS_LEVEL_SA` on `candidates.duplicates`) → `mergeDuplicatesInfo()` (`:3531-3556`), with both ids taken from `$_POST`.
  - Runtime: merges were not exercised in the baseline (`SMOKE_TEST.md` §4 "Not covered: … merges of duplicate records").
- **Impact:** Silent cross-entity corruption on a shipped feature. One merge can attach company N's contracts, contact N's call notes and job order N's interview events to different records, with no error and no audit entry (merges are not written to `history`, DB-016). The corruption cannot be undone from the data alone, because the original owner is overwritten.
- **Severity:** CRITICAL — silent corruption of core recruiting data by a normal administrative action.
- **Recommendation:** Restrict the four re-pointing statements to `data_item_type = DATA_ITEM_CANDIDATE`, scope the final delete to the site, and route the delete through the normal candidate-delete path. Add a test that merges candidate N while a company, contact and job order N exist.
- **Unknown / needs further validation:** Whether real databases already contain merge damage. Needs a data check on a production copy: activities, attachments and events whose `date_created` is earlier than their current owner's `date_created`, cross-checked with `candidate_duplicates` history. This is a heuristic, not proof.

### DB-004 — No referential integrity; hand-written cascades leave orphan rows
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-001, DB-003, DB-011, DB-013*

- **Confirmed fact:** With no foreign keys, every cascade is PHP code, and each is partial:

| Delete of | Removed by the code | Left behind | Evidence |
|---|---|---|---|
| candidate | `candidate`, `candidate_joborder`, `candidate_joborder_status_history`, `saved_list_entry`, `candidate_duplicates`, attachments (+ files), extra fields; adds a `history` "(DELETED)" row | `activity`, `calendar_event` (type 100), `candidate_tag`, `career_portal_questionnaire_history`, earlier `history` rows with values, other users' `mru` rows | `lib/Candidates.php:363-449`; `modules/candidates/CandidatesUI.php:1420-1426`; `lib/MRU.php:171-193` (MRU delete scoped to the current `user_id`) |
| job order | `joborder`, pipelines, status history, attachments, list entries, extra fields | `activity.joborder_id` and `calendar_event.joborder_id` ("regarding"), activities/events of type 400 | `lib/JobOrders.php:272-345` |
| contact | `contact`, list entries, extra fields; resets `reports_to` | `joborder.contact_id`, `company.billing_contact`, activities, events, attachments of the contact | `lib/Contacts.php:347-399` |
| company | contacts and job orders (recursively, non-atomic), attachments, list entries, extra fields | activities/events of type 200, `company_department` rows | `lib/Companies.php:214-307` |
| tag | the tag and its direct children | `candidate_tag` rows; grandchildren | `lib/Tags.php:88-107` |
| extra-field definition | the `extra_field_settings` row | every `extra_field` value with that name | `lib/ExtraFields.php:134-150` |
| user (setup wizard; tester-only settings action) | the `user` row only | `owner`, `entered_by`, `recruiter`, `added_by` references on all entity tables; `user_login`, `mru`, `saved_search` rows | `lib/Users.php:256-270`; `modules/settings/SettingsUI.php:1466` (tester), `:3077` (`wizard_deleteUser`) |
| candidate merge | the duplicate `candidate` row (direct SQL) | its `extra_field`, `history`, questionnaire history | `lib/Candidates.php:1578-1584` |

- **Evidence:** as cited in the table. Past orphan clean-ups in migrations confirm that orphans occurred in the field: revision 348 deletes `saved_list_entry` rows whose candidate is gone (`modules/install/Schema.php:1245-1249`), and revisions 270/349 recompute drifted `saved_list.number_entries`.
- **Impact:** Orphan rows accumulate. Orphaned activities and events show up in lists and calendars without a name. Personal data of "deleted" candidates survives in activity notes, event text and history (DB-011). Record ownership points at users that no longer exist.
- **Severity:** HIGH — persistent integrity defects in core recruiting data, and the basis for DB-011's erasure gap.
- **Recommendation:** Define, per entity, the complete set of dependent rows and delete or detach them in one atomic unit; enforce the relationships in the schema where the model allows it (the polymorphic tables need a design decision first).
- **Unknown / needs further validation:** Orphan counts in real data. Needs `LEFT JOIN … IS NULL` counts per relationship on a production copy.

### DB-018 — Pipeline table has no unique `(candidate_id, joborder_id)`; check-then-insert race
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-003, DB-013*

- **Confirmed fact:** `Pipelines::add()` runs `SELECT COUNT(candidate_id)` and then `INSERT INTO candidate_joborder`. The table has only a surrogate primary key and non-unique indexes. `add()` does not check that the candidate and job order exist or belong to the site. A status change writes `candidate_joborder`, `candidate_joborder_status_history` (keyed by the id pair) and `history` (keyed by `candidate_joborder_id`) in separate statements. `add()` also runs an `eval`'d hook that can alter the SQL (`PIPELINES_ADD_SQL`).
- **Evidence:** `lib/Pipelines.php:60-126` (`add`, COUNT at `:64`, hook at `:94`, INSERT at `:97`); `lib/Pipelines.php:294-360` (`setStatus`); `lib/Pipelines.php:427-445` (`addStatusHistory`); `db/cats_schema.sql:240-248` (keys of `candidate_joborder`).
- **Impact:** A double submit or two recruiters acting at once can create two pipeline rows for the same pair. Reports then double-count, and the two history tables can disagree.
- **Severity:** MEDIUM — integrity defect with a narrow trigger (concurrent or repeated submit).
- **Recommendation:** Make the pair unique per site in the schema and let the insert rely on that constraint instead of a prior count.
- **Unknown / needs further validation:** Whether duplicates exist in real data. Needs `GROUP BY site_id, candidate_id, joborder_id HAVING COUNT(*) > 1` on a production copy.

### DB-025 — Pipeline list joins attachments without `data_item_type`
*Confirmation: **Static** · New in this edition · Related: DB-001*

- **Confirmed fact:** The job-order pipeline query computes `IF(attachment_id, 1, 0) AS attachmentPresent` from `LEFT JOIN attachment ON candidate.candidate_id = attachment.data_item_id`, with no `data_item_type` condition. A scan of all `lib/`, `modules/` and `ajax/` SQL for polymorphic joins without a type filter found this join and two others; the other two (`lib/Candidates.php:894`, `lib/Search.php:2006`) start from `attachment` with a type or `resume = 1` filter and are not affected.
- **Evidence:** `lib/Pipelines.php:537`, `:544` (select), `:618-619` (join), `:630` (`GROUP BY`); the `awk` join scan described under Scope and method.
- **Impact:** The pipeline shows an "attachment present" flag for a candidate whose id matches a company, contact or job order that has an attachment. The join also multiplies rows before the `GROUP BY`. Display-only; no data is changed.
- **Severity:** LOW — misleading indicator, no data change.
- **Recommendation:** Add the candidate type condition to the join.
- **Unknown / needs further validation:** None.

---

## 3. Migrations, installer paths and schema drift

### DB-006 — Migrations are `eval`'d strings run inside web requests; old revisions fatal on PHP 7
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-01, RT-02, DB-002, DB-007, DB-027, PERF-006*

- **Confirmed fact:** In-app migrations live in one PHP array, `CATSSchema::get()` in `modules/install/Schema.php` (revision number → SQL text, or `PHP:` code). `ModuleUtility::_refreshModuleList()` runs whenever a PHP session has no cached module list, that is, on the first request of every session. It takes `GET_LOCK('CATSUpdateLock', 120)`, compares `module_schema.version` with the highest revision for each module, and then `eval()`s `PHP:` revisions or splits SQL revisions on `;` and runs each piece. It records the new version after each revision whether or not the statements succeeded. Revisions 225, 253 and 341 call `mysql_*` functions, which do not exist since PHP 7.0. The seed schema is stamped `install = 363`, so a fresh install runs only revision 364; any older database runs the whole chain.
- **Evidence:**
  - `lib/ModuleUtility.php:147-156` (per-session trigger), `:243` (`GET_LOCK`), `:282` (`processModuleSchema`), `:443-573` (runner; `eval($PHPCode)` at `:542`; `explode(';', $sql)` at `:546`; version update at `:556-569`, not conditional on success).
  - `modules/install/Schema.php:725` (revision 225, starts `:702`) — `mysql_real_escape_string`; `:854` (253) — `mysql_fetch_row`; `:1236` (341, starts `:1232`) — `mysql_real_escape_string`.
  - `modules/install/Schema.php:1026` and `:1029` — key `'283'` defined twice; the first value (`DROP TABLE IF EXISTS dashboard_module`) is lost.
  - `grep -c "ALTER IGNORE" modules/install/Schema.php` → 133 (syntax removed in MySQL 5.7.4). Zero-date defaults at `:465,845,1217`; `TEXT … DEFAULT ''` at `:869,1118,1226`; unquoted `UPDATE system` at `:44,849` (`SYSTEM` is reserved from MySQL 8.0.3).
  - `db/cats_schema.sql:862` — `('install', 363)`; `modules/install/Schema.php:1328-1330` — revision 364 `UPDATE user SET password = md5(password) WHERE can_change_password=1;` (not idempotent: re-running it double-hashes).
  - **Runtime (RT-01):** on the demo-data path, the first page request ran revisions up to 224 and then died in 225 with `Call to undefined function mysql_real_escape_string() in lib/ModuleUtility.php(542) : eval()'d code:24`. The stack trace shows the runner inside a normal page request: `index.php(215) → ModuleUtility::loadModule('login') → getModules() → _refreshModuleList() → processModuleSchema('install', …)`. The version was not saved, so every later request (login page and `/careers/index.php`) died the same way (`evidence/demo-data-path/migration-request.html`, `demo-second-request.html`, `php_errors.log`: 3 fatals).
  - **Runtime (INSTALLATION.md §1 step 5b):** on the empty-install path, the first `GET /index.php` applied revision 364 (MD5 of the seeded admin password).
- **Impact:** Any database older than revision 225 (the demo dataset, and by inference any old production database) cannot be upgraded on the PHP version the repository targets: the application stops serving every page until the database is restored. Migrations run under a web request's time and memory limits, while holding a global lock, with no record of which statements failed. There is no down-migration and no checksum.
- **Severity:** HIGH — the upgrade workflow is broken on the supported runtime and leaves the application unusable.
- **Recommendation:** Run schema changes from an explicit install/upgrade step, not from page requests; stop marking a revision applied when its statements fail; and remove or replace the revisions that call removed PHP functions or removed SQL syntax.
- **Unknown / needs further validation:** Behaviour of the full chain on MySQL 8 and on PHP 8 (not run). Needs an upgrade test from an old dump on each target server.

### DB-007 — Fresh and upgraded installs end with different schemas
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-01, DB-006, DB-027*

- **Confirmed fact:** A fresh install loads `db/cats_schema.sql`. An upgraded install (the 0.5.5 demo dump, or an older database) goes through `db/upgrade-*.sql` and then the in-app revisions. The two paths produce different schemas. The installer runs the file-based upgrades **before** the in-app revisions, so `upgrade-0.9.4-0.9.5.sql` references `joborder.questionnaire_id`, a column that only revision 357 creates later; that statement always fails on the upgrade path and `joborder.import_id` is never added.

| Object | Fresh install (`db/cats_schema.sql`) | Upgrade path or `test/data/test.sql` | Evidence |
|---|---|---|---|
| `joborder.import_id` | present (`:821`) | **missing**: `ALTER … ADD COLUMN import_id … AFTER questionnaire_id` fails | `db/upgrade-0.9.4-0.9.5.sql:3-4`; `modules/install/Schema.php:1290-1291` (revision 357 adds `questionnaire_id`); `modules/install/ajax/ui.php:920-924` (0.9.5 file run in `upgradeCats`); RT-01 seed log |
| `tag`, `candidate_tag`, `extension_statistics` | present (`:1048`, `:327`, `:641`) | never created by any upgrade file or revision | `grep` of `db/upgrade-*.sql` and `Schema.php` |
| `joborder.status` | `varchar(64)` (`:808`) | `varchar(16)` (revision 286, `Schema.php:1039`; `test.sql:1196`) | DDL comparison |
| `candidate.web_site` | `varchar(128)` (`:185`) | `varchar(352)` (`db/upgrade-0.9.4-0.9.5.sql:15`) | |
| `attachment.content_type` | `varchar(255)` (`:91`) | `varchar(64)` in `test.sql:126`; no revision changes it | |
| `user.session_cookie` | `varchar(256)` (`:1083`) | `varchar(48)` (`db/upgrade-0.6.x-0.7.0.sql:53`; `test.sql:1588`) | |
| "no date" defaults | `'1000-01-01 00:00:00'` (26 occurrences) | `'0000-00-00 00:00:00'` (26 in `test.sql`, and revisions 165/250/330) | `grep -c` on both files |
| `zipcodes` | `zipcode mediumint(9)`, no `lat`/`lng` (`:1178-1184`) | `zipcode varchar(9)`, `lat`, `lng` (`db/upgrade-zipcodes.sql:2-9`), loaded only by `upgradeCats` or the optional component | `modules/install/ajax/ui.php:928`; `modules/install/OptionalComponents.php:33` |
| `contact` title index name | `IDX_title` | `` ` IDX_title` `` (leading space) in databases created before commit 19f1fcd; fixed only in the dump files | `git show 19f1fcd` |
| `access_level` rows | 0–500 | constants also use −100, 350, 450; `securityTests.sql` inserts users at 350/450 | `constants.php:74-82`; `test/data/securityTests.sql:5-12` |

- **Evidence:**
  - As in the table. The integration tests load only `db/cats_schema.sql` (`src/OpenCATS/Tests/IntegrationTests/DatabaseTestCase.php:48`), so the upgrade path is never tested.
  - **Runtime (RT-01):** `evidence/demo-data-path/seed-demo.log` — `[upgrade-0.9.4-0.9.5.sql] ERROR 1054 Unknown column 'questionnaire_id' in 'joborder'`, summary `ok=2 errors=1`, detected revision 94; the installer continued without reporting it.
- **Impact:** Upgraded installs lack the tag tables (tag features fail silently, DB-002) and `joborder.import_id` (no current PHP code reads that column, so this item is latent). The same input can be stored on one install and truncated or rejected on another. Reports and sorts see two different "no date" values. Any future data migration has to handle several schema variants that nobody has listed.
- **Severity:** HIGH — unknown schema state on upgraded installs, invisible to tests.
- **Recommendation:** Establish one reference schema, detect the known variants listed above on existing databases, and bring them to that reference; add a test that upgrades an old dump and compares it with a fresh install.
- **Unknown / needs further validation:** How many field installs were upgraded rather than freshly installed. Needs `SHOW TABLES LIKE 'tag'` and `SHOW COLUMNS FROM joborder LIKE 'import_id'` on real deployments.

### DB-027 — Starting the app against an unseeded database builds a partial schema
*Confirmation: **Runtime** · New in this edition · Related: RT-02, DB-002, DB-006*

- **Confirmed fact:** When `INSTALL_BLOCK` exists but the database is empty, the first request runs the migration runner. `SELECT version FROM module_schema` fails (no table), the failure is not detected (DB-002), the `INSERT INTO module_schema` also fails, and the runner assumes version 0 for every module. It then replays the `install` revisions from the start: statements that create tables succeed, statements that alter missing tables fail silently, and no version is recorded.
- **Evidence:**
  - `lib/ModuleUtility.php:459-490` — `getAssoc()` on `module_schema`; on an empty result it inserts a row and sets `$currentVersion = 0`.
  - **Runtime (RT-02):** `evidence/empty-db-before-seed/first-request.html` — 24 × `mysqli_fetch_assoc() expects parameter 1 to be mysqli_result, boolean given` (23 at `lib/DatabaseConnection.php:321`, one per module, and 1 at `modules/install/scripts/150.php:56`); the runner then created 16 tables in the empty schema (`KNOWN_RUNTIME_ERRORS.md` RT-02).
  - The 16 tables without an explicit collation in `db/cats_schema.sql` (DB-008) are the tables whose DDL comes from revisions; that they are the same 16 tables RT-02 saw is an inference (the baseline did not list the created tables).
- **Impact:** A container stack that starts the web tier before the database is seeded (a common start-up order) leaves a half-built schema behind. If the installer's schema load is then run, its `CREATE TABLE` statements for those 16 tables fail and are ignored (DB-002), so they keep the revision-created shape and may reject seed rows. The operator gets no error.
- **Severity:** MEDIUM — silent schema damage on a realistic operator path; recoverable by dropping and recreating the database.
- **Recommendation:** Make the runner stop when it cannot read `module_schema` instead of assuming version 0, and make the installer refuse to load the schema into a non-empty database.
- **Unknown / needs further validation:** The exact table list and whether the later schema load then works. Needs a repeat of the RT-02 sequence followed by a schema comparison.

---

## 4. Data-access layer

### DB-002 — SQL errors are never detected by the access layer; the installer ignores failed statements
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-01, RT-02, DB-006, DB-027, ARCH-009*

- **Confirmed fact:** `DatabaseConnection::query()` checks for failure with `isset($this->_queryResult->connect_errno)`. The result of `mysqli_query()` is `false` or a `mysqli_result`; neither has that property, so both error branches are dead code and a failed query simply returns `false`. Most callers ignore the return value. `getError()` returns the *connection* error, not the query error. The installer's `MySQLQuery()` checks the connection handle instead of the query result, so failed statements in `db/cats_schema.sql` and the upgrade files are ignored. No `mysqli_report()` call exists, so on PHP ≥ 8.1 (where mysqli throws by default) every SQL error would instead become an uncaught exception.
- **Evidence:**
  - `lib/DatabaseConnection.php:181` (`mysqli_query`), `:184` and `:198` (`isset($this->_queryResult->connect_errno)`), `:583-588` (`getError()` uses `mysqli_connect_errno/_error`).
  - `lib/Users.php:708` and `:762` — `// FIXME: Did the above query succeed? If not, fail.`
  - `modules/install/ajax/ui.php:1111-1128` — `$queryResult = mysqli_query(…); if (!$mySQLConnection) { … die … }`.
  - **Runtime (RT-02):** on an unseeded database the login page printed 23 × `mysqli_fetch_assoc() expects parameter 1 to be mysqli_result, boolean given in lib/DatabaseConnection.php:321` — each is a failed query that `query()` passed on as `false` without any error (`evidence/empty-db-before-seed/first-request.html`).
  - **Runtime (RT-01):** `upgrade-0.9.4-0.9.5.sql` failed with `ERROR 1054` and the installer carried on (`evidence/demo-data-path/seed-demo.log`).
  - Runtime, negative: no SQL error appeared in pages or logs during the final smoke run (`KNOWN_RUNTIME_ERRORS.md` §By category). With this code that proves little, because failures are not logged.
- **Impact:** Writes can fail with no message and no log line: rejected characters (DB-008), strict-mode rejections (DB-017), missing tables (DB-007, DB-027). The user sees a success page. Migrations are marked applied after failing (DB-006). The behaviour changes completely between PHP 8.0 and 8.1.
- **Severity:** HIGH — silent data loss on any failed write, and no diagnostic trail.
- **Recommendation:** Make the access layer detect every failed query, log the database error with the statement identity, and stop the operation; make the installer stop on the first failed statement.
- **Unknown / needs further validation:** How many writes fail silently in production. Needs the database server's error log or a temporary logging wrapper on a production copy.

### DB-010 — SQL built by string interpolation; several unescaped values reach the database
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-001, SEC-016*

- **Confirmed fact:** All SQL is built with `sprintf()`. Safety depends on each caller wrapping values in `makeQueryString()` (quote + `mysqli_real_escape_string`), `makeQueryInteger()` (integer cast) or `makeQueryStringOrNULL()`. There are no prepared statements (`grep mysqli_prepare|bind_param|PDO` over `lib modules src` → nothing). The model classes mostly use the helpers, but these paths do not:
  - DataGrid `ORDER BY`: `sortBy` is checked against the column list, `sortDirection` is not validated anywhere (`lib/DataGrid.php:382-385` take the parameter array from `$_GET`; `:1330` builds `ORDER BY sortBy sortDirection`; the only other assignment is the default at `:427`).
  - Candidate tag filter: `implode(",", $arguments)` inside `IN (…)` (`lib/Candidates.php:2250`).
  - Candidate merge: stored values concatenated into the `SET` clause (`lib/Candidates.php:1438-1553`, for example `"first_name = '" . $rs['firstName'] . "'"`), and the e-mail values taken straight from `$_POST['email']` (`:1510`, `:1519-1520`; source `modules/candidates/CandidatesUI.php:3538-3540`).
  - Installer: `UPDATE settings SET value = "%s"` with the request's `mailFromAddress` (`modules/install/ajax/ui.php:198`, `:242`, `:983-994`).
  - `SystemInfo::updateUID()` and the version-check update interpolate `'%s'` unescaped (`lib/SystemInfo.php:75-84`, `:120-130`).
  - Defence-in-depth gaps: `Companies::delete` interpolates `$companyID` raw (`lib/Companies.php:224`, `:242`, `:257`); `SavedLists` `implode`s id arrays (`lib/SavedLists.php:406`, `:459`). Callers validate these today.
  - `lib/DatabaseConnection.php:480-486` — the maintainers' own note: `// FIXME: Security issue, this function is not enough for sanitizing user input.`
- **Evidence:** as cited above.
- **Impact:** Authenticated users can reach SQL injection through the listed request parameters (detail and reachability in `SECURITY_AUDIT.md`). Data-dependent failures: a merge of a candidate whose note or address contains `'` breaks the `UPDATE` (silently, DB-002). Correctness of escaping cannot be checked by reading one layer.
- **Severity:** HIGH — injection reachable by authenticated users; unreliable writes on ordinary data.
- **Recommendation:** Pass values to the database as bound parameters rather than text, starting with the paths listed; restrict `sortDirection` to `ASC`/`DESC`.
- **Unknown / needs further validation:** Exploitability of each path. Needs authorized security testing on an isolated instance.

### DB-020 — Time zones handled by rewriting SQL text around a fixed `OFFSET_GMT`
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-017*

- **Confirmed fact:** Timestamps are written with `NOW()` in the database server's zone. The code assumes that zone is `OFFSET_GMT` hours from GMT (`config.php:180`, committed value `2`). A logged-in user's offset is `site.time_zone − OFFSET_GMT` (`site.time_zone` is an `int(5)` whole-hour offset). Requests without a login session (careers portal, XML feed, queue) use `−OFFSET_GMT`. On every query whose text starts exactly with `SELECT`, `_localizationFilter()` rewrites each simple `DATE_FORMAT(x, …)` into `DATE_FORMAT(DATE_ADD(x, INTERVAL n HOUR), …)` and swaps `%m-%d` to `%d-%m` for DMY sites. `DATE_FORMAT` calls whose first argument contains a parenthesis are skipped. Date conditions in `WHERE` clauses (calendar ranges, "today" statistics) are not shifted.
- **Evidence:** `lib/DatabaseConnection.php:53-72` (offset source; `OFFSET_GMT * -1` without session at `:70`), `:648-711` (`_localizationFilter`; `strpos($query, 'SELECT') !== 0` at `:651`; parenthesis check at `:680`); `lib/Session.php:607`, `:811`; `db/cats_schema.sql:999`; `modules/install/Schema.php:136-137` (revision 24 sets every site to `OFFSET_GMT`); `modules/install/ajax/ui.php:524` (installer writes the chosen zone into `config.php`).
- **Runtime context:** the baseline set the site time zone to 2 (= `OFFSET_GMT`), so the rewrite added no offset (`INSTALLATION.md` §1 step 5c). The database container's own clock zone was not recorded.
- **Impact:** No daylight-saving support and no half-hour zones. Displayed times are correct only if the database server really runs at `OFFSET_GMT`; in a container that runs in UTC with the committed value 2, times are shown two hours off (inference). Anonymous pages show different times from recruiter pages. Queries that start with whitespace or use nested `DATE_FORMAT` get no adjustment. Stored values carry no zone, so they cannot be converted reliably later.
- **Severity:** MEDIUM — wrong displayed times and date-based report boundaries; no data is lost, but stored times are ambiguous.
- **Recommendation:** Store timestamps in one declared zone (UTC), set that zone on each connection, and convert for display in the application instead of rewriting SQL text.
- **Unknown / needs further validation:** The server time zone of real installs and whether `OFFSET_GMT` matches it. Needs `SELECT @@global.time_zone, @@system_time_zone, NOW(), UTC_TIMESTAMP()` next to each install's `config.php`.

### DB-023 — Access-layer hygiene: `set_time_limit(0)` per query, wrong error accessor, no TLS, no logging
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-002, PERF-004*

- **Confirmed fact:**
  - `set_time_limit(0)` runs before every query, which removes PHP's execution-time limit for the rest of the request (`lib/DatabaseConnection.php:172-179`; the migration runner does the same at `lib/ModuleUtility.php:445-453`).
  - One connection per request, opened with host, user and password only: no port, socket, TLS or timeout options (`lib/DatabaseConnection.php:109-128`).
  - The `CATS_SLAVE` read-only guard blocks only statements that start with `UPDATE`, `INSERT` or `DELETE`; `REPLACE`, DDL and locks pass (`:635-643`).
  - No query logging, timing or counters anywhere in the class.
  - `getColumn($query = null, $row, $column)` puts an optional parameter before required ones (`:262`), deprecated in PHP 8.
  - `makeQueryStringOrNULL()` returns `NULL` for any value that PHP's `empty()` treats as empty after `trim()`, which includes the string `"0"` (`lib/DatabaseConnection.php:508-516`; `php -r 'var_dump(empty(trim("0")));'` → `true`). A field whose value is exactly `0` is stored as NULL on the 57 call sites that use this helper.
  - DataGrid calls `implode($array, $glue)` with the legacy argument order (`lib/DataGrid.php:1292`, `:1299`, `:1328`, `:1329`); that order is a TypeError on PHP 8 (Phase 0 verified with PHP 8.4), so list queries would fail before reaching the database there.
- **Evidence:** as cited.
- **Impact:** Runaway queries are not bounded by PHP; the database connection cannot be encrypted or tuned; database problems leave no trace in application logs.
- **Severity:** LOW — hygiene issues; the serious consequences are counted under DB-002 and PERF-004.
- **Recommendation:** Bound query time on the server or per statement rather than disabling PHP's limit, allow TLS and port settings, and log failed and slow statements.
- **Unknown / needs further validation:** None.

---

## 5. Data model quality

### DB-012 — Tenant column `site_id` is vestigial and inconsistently enforced
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-001, DB-010*

- **Confirmed fact:** 36 of 55 tables carry `site_id`, with no foreign key and no composite key. Isolation depends on every query adding `site_id = <current site>`. The product has no code path that creates a site (`grep -rn "INTO site" lib modules` → nothing); the schema seeds site 1 (`testdomain.com`) and site 180 (`CATS_ADMIN`), and the careers portal serves the lowest site id that is not the admin site (`lib/Site.php:161-181`, `modules/careers/CareersUI.php:79`). Confirmed gaps:
  1. Duplicate detection selects matching names from **all** sites (`lib/Candidates.php:1136-1156`, `WHERE candidate.first_name = %s AND candidate.last_name = %s`) and records the matches as duplicates of the current site's candidate (`modules/candidates/CandidatesUI.php:2663`, `:2704`; `lib/Candidates.php:1263-1300`).
  2. Statements on `candidate_duplicates` without `site_id` (`lib/Candidates.php:423-433`, `:1243-1250`, `:1363-1368`, `:1388-1395`) and the unscoped `DELETE FROM candidate` in the merge (`:1578-1584`).
  3. The candidate Tags filter hard-codes `WHERE t2.site_id = 1` (`lib/Candidates.php:2250`), so it returns nothing on any install whose site id is not 1 — including the shipped demo data, whose site is 201 (`INSTALLATION.md` §5).
  4. The Tags column sub-select has no site condition (`lib/Candidates.php:2231-2236`); harmless while ids are globally unique.
  5. `Calendar::updateEventDisableReminder()` updates by event id only (`lib/Calendar.php:450-462`).
- **Evidence:** as cited; the 36/19 split comes from the `awk` pass over the schema. Runtime: the baseline used site 1 only, and duplicate detection worked for the single site (#24).
- **Impact:** In the single-tenant reality, tag filtering is broken on any site other than 1, and duplicate detection can match records of other sites if more than one site exists. In any multi-tenant use, candidate data leaks across sites through duplicate links, and the merge can delete another site's candidate.
- **Severity:** MEDIUM — a functional defect today (tags); it would be HIGH in a deployment that really hosts several tenants in one database.
- **Recommendation:** Decide whether multi-tenancy is a product requirement. Either way, fix the three concrete gaps (duplicate matching scope, `candidate_duplicates` statements, the literal `1`).
- **Unknown / needs further validation:** Whether any deployment holds more than one real site. Needs `SELECT site_id, name FROM site` on field installs.

### DB-014 — Weak data typing (money as text, free-text status, sentinels, swapped lat/lng)
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-007, DB-020*

- **Confirmed fact:**
  - **Money and durations as free text:** `candidate.desired_pay`/`current_pay varchar(64)` (`db/cats_schema.sql:192-193`); `joborder.duration varchar(64)`, `rate_max varchar(255)`, `salary varchar(64)` (`:805-807`). No currency, no period.
  - **Job-order status as free text:** `joborder.status varchar(64)` (`:808`) holds labels defined in `config.php:297-298` and `lib/JobOrderStatuses.php`; the `joborder_status` lookup table was dropped (`modules/install/Schema.php:1150-1152`). Pipeline statuses are integers duplicated in a lookup table (`db/cats_schema.sql:255-277`) and in constants (`constants.php:120-130`).
  - **Booleans as `int(1)`**, nullable on some tables and not others: `company.is_hot`, `contact.is_hot` nullable (`:476`, `:527`), `candidate.is_hot` NOT NULL (`:187`).
  - **"None" has three spellings:** `NULL`, `0` and `-1` (`calendar_event.data_item_id/data_item_type/joborder_id DEFAULT -1`, `:119-125`; `contact.reports_to DEFAULT '-1'`, `:536`; `activity.joborder_id` stored as `-1` for "general", `lib/ActivityEntries.php:87`, `:114`). Dates use `'1000-01-01'` or `'0000-00-00'` depending on the install path (DB-007).
  - **EEO:** gender and disability are free `varchar(5)` values (`:190-191`), read as `'m'`/`'f'` (`lib/Candidates.php:524-531`).
  - **Extra-field values** are `TEXT` for every type; date fields are stored as `MM-DD-YY` strings (`lib/ExtraFields.php:680`, `:870`).
  - **Zip codes and radius search:** `candidate.zip varchar(16)` (`:172`) is joined to `zipcodes.zipcode`, which is `mediumint(9)` in the base schema (`:1179`; leading zeros lost) and `varchar(9)` after the optional component. The shipped zip data puts longitude into `lat` and latitude into `lng`: the column list is `(zipcode, city, state, areacode, lat, lng)` and the first row is `(501, 'Holtsville', 'NY', 631, '-072.637078', '+40.922326')` (`db/upgrade-zipcodes.sql:2-9`, `:20`). `lib/ZipLookup.php:77` multiplies by 3958 (Earth radius in miles) and names the result `distance_km`. Radius search is off by default (`config.php:262`, `US_ZIPS_ENABLED false`).
  - **Serialized PHP in columns:** `user.column_preferences` (`unserialize` at `lib/Session.php:850`), `settings.value` (`lib/Mailer.php:435`), url-encoded CSV in `extra_field_settings.extra_field_options`.
  - **Id width mismatch:** `tag` and `candidate_tag` use `int(10) unsigned` (`:328-331`, `:1049-1054`); every other id is `int(11)` signed.
- **Evidence:** as cited.
- **Impact:** Pay and rates cannot be sorted, filtered or reported numerically. Renaming a job-order status in `config.php` orphans existing rows. Date-type custom fields cannot be range-filtered or sorted by date. Radius search, when enabled, returns wrong distances. `unserialize()` of database content is an object-injection risk for anyone who can write those columns.
- **Severity:** MEDIUM — limits reporting and correctness of several features; no silent loss of core data.
- **Recommendation:** Give money, dates, booleans and statuses real types and one "none" value, fix the zip data column order and the distance unit, and store structured settings in a non-executable format.
- **Unknown / needs further validation:** How pay and rate values are actually written by users (formats, currencies). Needs a value-pattern profile of those columns on a production copy.

### DB-015 — Extra-field values keyed by field name, with no uniqueness and weak indexes
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-004, PERF-003*

- **Confirmed fact:** `extra_field` rows link to their definition in `extra_field_settings` by the **string** `field_name` plus `site_id` and `data_item_type`; there is no definition id. Renaming a field runs a bulk `UPDATE extra_field SET field_name = …` (`lib/ExtraFields.php:368-400`). Removing a definition leaves all its values (`:134-150`). `setValue()` deletes then inserts, with no unique key (`:448-500`), so concurrent edits can leave two values for one field. `extra_field` has only `assoc_id(data_item_id)` and `IDX_site_id`; `extra_field_settings` has no secondary index (`db/cats_schema.sql:663-664`, `:671-682`). Each extra field shown as a list column adds one `LEFT JOIN extra_field AS extra_fieldN ON … field_name = '<name>'` (`lib/ExtraFields.php:733-737`, `:746-750`, `:789-793`).
- **Evidence:** as cited.
- **Impact:** Data integrity depends on field names never colliding or changing. Duplicate value rows multiply list rows. List queries grow with the number of custom-field columns.
- **Severity:** MEDIUM — integrity and performance cost limited to custom fields.
- **Recommendation:** Link values to definitions by id, make one value per record and field unique, and delete values together with their definition.
- **Unknown / needs further validation:** Whether duplicate values exist in real data. Needs `GROUP BY data_item_type, data_item_id, field_name HAVING COUNT(*) > 1`.

### DB-019 — `settings` key/value store: no unique key and a malformed `DELETE`
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-014*

- **Confirmed fact:** `settings` has no index and no unique `(site_id, settings_type, setting)` (`db/cats_schema.sql:968-975`). `MailerSettings::set()` deletes the old row with `WHERE settings.setting = %s AND site_id = %s AND settings_type` — the comparison is missing and the `SETTINGS_MAILER` argument is never used (`lib/Mailer.php:478-492`). The condition is true for every row with a non-zero type, so the call deletes the same-named setting in every settings category of the site. The follow-up `INSERT` is a separate statement. `value varchar(255)` holds `serialize()`d arrays (`lib/Mailer.php:435`) that are later `unserialize()`d (`modules/settings/SettingsUI.php:2010`, `:2040`; `modules/joborders/JobOrdersUI.php:1462`).
- **Evidence:** as cited. `php -r` on a status map with all 11 pipeline statuses gives a 115-byte serialized string, so the current map fits in 255 characters; Phase 0's statement that "longer maps truncate" is a future risk, not a present defect.
- **Impact:** Saving a mailer setting can delete a same-named setting of another category (career portal, calendar, EEO). Without a unique key, duplicate setting rows can appear and which one is read is undefined.
- **Severity:** MEDIUM — configuration can be lost or become inconsistent.
- **Recommendation:** Fix the `settings_type` comparison, make the key unique, and write settings in one statement.
- **Unknown / needs further validation:** Whether any setting names are shared between categories today (the defect only bites then). Needs `SELECT setting, COUNT(DISTINCT settings_type) FROM settings GROUP BY setting HAVING COUNT(DISTINCT settings_type) > 1` on real data.

### DB-022 — Dead tables and code that queries tables that do not exist
*Confirmation: **Static** · Phase 0 severity: unchanged*

- **Confirmed fact:** `candidate_jobordrer_status_type` (misspelled), `extension_statistics`, `feedback` and `xml_feed_submits` have no references in core PHP outside migrations; `sph_counter` is used only by the optional Sphinx add-on; `installtest` is installer scratch. `lib/Profile.php` queries `profile`, `profile_page`, `profile_page_field` and `profile_title`, which exist in no schema file, and nothing instantiates the class. The Sphinx add-on references `geoip_*` tables that do not exist.
- **Evidence:** `grep -rn` over `lib` and `modules` (only `modules/install/Schema.php:441`, `:738`, `:782`, `:818` mention `feedback`/`xml_feed_submits`); `grep -rn "new Profile"` → nothing.
- **Impact:** Schema noise that every future migration has to carry or decide on.
- **Severity:** LOW — no functional effect.
- **Recommendation:** Record these as removable and drop them together with `lib/Profile.php` when the schema is next changed.
- **Unknown / needs further validation:** Whether third-party add-ons use any of these tables.

### DB-026 — Stored text is a mix of raw and HTML-encoded values, depending on the write path
*Confirmation: **Static** · New in this edition · Related: UX-003, ARCH-008, DB-012*

- **Confirmed fact:** Some write paths HTML-encode input before storing it, others store it raw, and templates encode again on output. `getSanitisedInput()` returns `htmlspecialchars($value, ENT_QUOTES, FALSE)` with double-encoding left on (`lib/UserInterface.php:388-395`); it is used 162 times in `modules/`, including candidate **edit** (`modules/candidates/CandidatesUI.php:1313-1318`) and careers applications (`modules/careers/CareersUI.php:1210-1232`), while candidate **add** stores raw input (`CandidatesUI.php:2623`). Revision 362 bulk-encoded every stored job-order `description` and `notes` once with `nl2br(htmlspecialchars(…))` (`modules/install/Schema.php:1296-1323`). No column records which encoding a value has.
- **Evidence:**
  - As cited. Each edit of a value that contains `'`, `&`, `<` or `>` adds one more encoding layer (`O'Brien` → `O&#039;Brien` → `O&amp;#039;Brien`), because the edit form shows the stored entity text and the next save encodes it again.
  - Runtime: `grep -r '&amp;amp;' docs/baseline` → no match. The baseline test data contained no such characters (`INSTALLATION.md` §4), so the run could neither confirm nor refute the effect. The only `&amp;` strings in the evidence are HTML-escaped URLs (for example a careers-template preview request logged as `GET /index.php?m=careers&amp;templateName=…` in `evidence/final-run/nginx.log` line 165), which is an output-escaping issue, not stored text.
- **Impact:** Names, companies and notes degrade with each edit; exact-match duplicate detection (`lib/Candidates.php:1152-1154`) and search stop matching records that contain these characters; exports and XML feeds carry entity text. Any data migration must first decide, per column and per row, whether a value is encoded — which the data alone cannot tell reliably.
- **Severity:** MEDIUM — progressive corruption of user text and a hard precondition for any data migration.
- **Recommendation:** Store raw text on every write path and encode only on output; before that, profile the affected columns to estimate how many values carry entity text.
- **Unknown / needs further validation:** How much stored text is already encoded, and how many layers deep. Needs a pattern scan (`&amp;`, `&#039;`, `&quot;`, `&lt;`) of text columns on a production copy.

---

## 6. Passwords, privacy, audit history and retention

### DB-009 — Unsalted MD5 passwords hashed inside SQL; seeded `admin`/`admin` is never forced to change
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: SEC-001, SEC-003, DB-006, DB-024*

- **Confirmed fact:** Passwords are stored as unsalted `md5()` in `user.password varchar(128)` and compared with `!==`. Password changes put the plaintext inside the SQL text (`password = md5(%s)`), so it can reach server query logs. The seed inserts `admin` with plaintext password `admin`; revision 364 hashes it on the first request. The forced first-login password change triggers only when the password equals `DEFAULT_ADMIN_PASSWORD = 'cats'`, so `admin`/`admin` is never forced to change. LDAP users are marked by the literal password `_LDAPUSER_`.
- **Evidence:**
  - `lib/Users.php:56`, `:93` (MD5 or LDAP marker), `:679`, `:840` (`!==` comparison), `:701`, `:755` (`password = md5(%s)`).
  - `db/cats_schema.sql:1108` (seed `admin`); `modules/install/Schema.php:1328-1330` (revision 364); `modules/login/LoginUI.php:332` and `constants.php:178` (`'cats'` check); `modules/install/ajax/ui.php:1048` (installer still looks for plaintext `'cats'`).
  - `test/data/test.sql:1618` stores `21232f297a57a5a743894a0e4a801fc3` (MD5 of `admin`).
  - **Runtime:** after the empty install, `admin`/`admin` logged straight into the dashboard with no password-change prompt (#05); `INSTALLATION.md` §1 step 5b and §4 record revision 364 hashing the seeded password on the first request.
- **Impact:** A leaked database or backup exposes every password to trivial cracking. Fresh installs run with a publicly known administrator password until someone changes it by hand.
- **Severity:** HIGH — account compromise with a precondition (database access, or an install whose default password was left in place).
- **Recommendation:** Hash passwords in PHP with a salted, slow algorithm and upgrade hashes on login; never place plaintext in SQL; generate or force-change the initial administrator password; mark LDAP accounts in a separate column.
- **Unknown / needs further validation:** How many field installs still use the default credentials. Not measurable from the repository.

### DB-011 — PII and EEO data in plaintext, copied into many tables, with no erasure path
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-004, DB-013, DB-016, RT-04, RT-17, SEC-008, SEC-022, SEC-029*

- **Confirmed fact:**
  - **Candidate PII** on `candidate`: names, three phones, address, two e-mails, web site, employer, current and desired pay, notes (`db/cats_schema.sql:160-199`), plus the full extracted resume text in `attachment.text` (`:93`).
  - **EEO special-category data** (ethnicity, veteran status, disability, gender) on the candidate row (`:188-191`); the only protection is the application flag `user.can_see_eeo_info` (`:1098`).
  - **Copies of PII:** `history.previous_value/new_value` (the candidate `get()` used for change tracking includes EEO fields, `lib/Candidates.php:522-531`, `:327-333`); `email_history` stores the full body of every sent e-mail (`lib/Mailer.php:363-392`); `mru.data_item_text` and `saved_search.data_item_text`; `career_portal_questionnaire_history`; `activity.notes`; `calendar_event.title/description`; `user_login.ip/user_agent/host`.
  - **Secrets in the database or config:** MD5 passwords (DB-009); `user.session_cookie` holds the live session id (`lib/Session.php:1010-1022`); SMTP and LDAP passwords in plaintext in `config.php` (`:223`, `:273`).
  - No column-level or at-rest encryption, and no TLS to the database (DB-023). The schema has no SSN or date-of-birth column; extra fields can hold anything.
  - **Erasure:** `Candidates::delete()` leaves activities, events, history, e-mail log, questionnaire history, tags and other users' MRU rows (DB-004). There is no anonymise or export-my-data function.
- **Evidence:** as cited. Runtime context: a careers application stores the candidate, pipeline row and activity even when the request then fails on e-mail (RT-04, #85/#86); resume files on disk were reachable without a session under nginx (RT-17), outside the database's protection.
- **Impact:** Right-to-erasure and access requests cannot be served without hand-written SQL across at least nine tables. A database or backup leak exposes EEO data, resume text and live session ids.
- **Severity:** HIGH — special-category personal data with no erasure path and wide copying.
- **Recommendation:** Build a complete erasure/anonymisation path that covers every table listed, isolate EEO data with its own access control, and stop storing live session ids.
- **Unknown / needs further validation:** Which privacy regimes apply to each deployment, and whether extra fields hold further sensitive data. Needs a data-inventory review with the owner.

### DB-013 — No retention policy; deletes remove pipeline status history and change past reports
*Confirmation: **Static** · Phase 0 severity: MEDIUM → now HIGH (silent, retroactive change of historical placement and submission figures is a data-integrity defect under this edition's scale) · Related: DB-004, DB-016, PERF-012*

- **Confirmed fact:**
  - Hard deletes for candidates, companies, contacts, job orders, attachments, pipelines, tags and users. Visibility flags exist (`is_admin_hidden`, `is_active`, `site.account_deleted`), but `ACCESS_LEVEL_DELETED` (`constants.php:74`) is never used.
  - `Pipelines::remove()`, `Candidates::delete()` and `JobOrders::delete()` each **delete** the related `candidate_joborder_status_history` rows (`lib/Pipelines.php:155-167`, `lib/Candidates.php:393-404`, `lib/JobOrders.php:304-315`). `lib/Statistics.php` builds submission and placement figures from that table (43 references), as does the dashboard graph (`lib/Dashboard.php:155-167`).
  - No purge job for `history`, `user_login`, `email_history`, `http_log` or `career_portal_questionnaire_history`: the only `DELETE FROM` on those tables is the old migration at `modules/install/Schema.php:269-270`. The only housekeeping is the queue clean-up (`lib/QueueProcessor.php:452`) and per-user MRU and saved-search trimming.
- **Evidence:** as cited.
- **Impact:** Removing a candidate from a pipeline, or deleting a candidate or job order, silently lowers past months' submission and placement counts; reports are not reproducible. Log tables and personal data grow without limit.
- **Severity:** HIGH — silent, retroactive change of business-critical historical figures, plus indefinite retention of personal data.
- **Recommendation:** Keep status history when a pipeline, candidate or job order is removed (mark the parent removed instead), and define a retention period per log table.
- **Unknown / needs further validation:** Real growth of the log tables and how often pipelines are removed after placement. Needs row counts over time and a comparison of report output before and after test deletions on a production copy.

### DB-016 — `history` audit table is incomplete, mutable and excluded from backups
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-001, DB-005, DB-011*

- **Confirmed fact:** Model methods read a record before and after an update, and `History::storeHistoryChanges()` writes one row per changed field with old and new values as text (`lib/History.php:64-118`). Create, delete and pipeline events use `storeHistoryNew/Deleted/Data` (`:129-229`). The acting user always comes from the session (`:49`). Only `Candidates`, `Companies`, `Contacts`, `JobOrders`, `Pipelines`, `ActivityEntries` and one call in `modules/settings/SettingsUI.php:2993` write history. Not recorded: user administration (create, access-level change, password change), attachment upload/download/delete, saved lists, calendar, settings, EEO data views, exports, extra-field definitions, tags, and candidate merges. `storeHistoryDeleted` stores only `(DELETED)`, no snapshot (`:143-158`). The table is ordinary mutable MyISAM; migrations have bulk-deleted and rewritten rows (`modules/install/Schema.php:268-271`, `:1120-1136`). The built-in backup skips it (`modules/install/backupDB.php:129-130`). Type and id are interpolated without the integer helper (`lib/History.php:104-105`, `:149-150`).
- **Evidence:** as cited.
- **Impact:** Not usable as a compliance audit trail: no read auditing of sensitive data, no user-administration trail, no tamper evidence, no record of merges. At the same time it retains personal data after deletion (DB-011).
- **Severity:** MEDIUM — missing accountability, not direct data loss.
- **Recommendation:** Decide what must be audited (including reads of EEO data and administrative actions), write audit entries in the same unit of work as the change, and protect them from update and deletion.
- **Unknown / needs further validation:** Whether any deployment relies on `history` for compliance today.

---

## 7. Backups and seed data

### DB-005 — Built-in backup cannot dump data on PHP 7/8 and skips `history`
*Confirmation: **Partial** · Phase 0 severity: unchanged · Related: DB-016*

- **Confirmed fact (verified):** `dumpDB()`, used by *Settings → Administration → Backup* (`modules/settings/ajax/backup.php:167-174`) and `scripts/makeBackup.php:127`, calls `mysqli_query($sql, $connection)` with the arguments reversed when it reads table data (`modules/install/backupDB.php:152`; the other calls at `:82`, `:110`, `:134` are correct). It installs an error handler with five required parameters (`:37`) that calls `die()` (`:63`). It never dumps `history` (`:129-130`, `// We do not need history records.`), and skips `user_login` and `zipcodes` rows (`:187-190`) and one vendor user (`:179-183`). On PHP 8 the reversed call is a `TypeError` (verified by Phase 0 with PHP 8.4).
- **Inferred:** on PHP 7.2 the reversed call emits a warning and returns `NULL`; the handler receives five arguments on 7.x, prints its message and dies, so the backup stops at the first table that has data.
- **Evidence:** as cited. Runtime: backup was deliberately not executed in the baseline (`SMOKE_TEST.md` #11 notes, §4).
- **Impact:** Administrators who rely on the built-in backup have no data backup, and the restore path (`modules/install/ajax/ui.php:691-749`) cannot be validated. Even a working dump would lose all audit history.
- **Severity:** HIGH — the only built-in protection against data loss does not work.
- **Recommendation:** Fix or retire the PHP dumper and document a supported database-level backup that includes all tables and the `attachments/` directory; test backup and restore end to end.
- **Unknown / needs further validation:** Actual PHP 7.2 behaviour. Needs one backup run on an isolated copy of the baseline.

### DB-024 — Seed and fixture hygiene: fixed license key and UID, test sites, legacy demo dump
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: DB-006, DB-009, DB-012*

- **Confirmed fact:**
  - `db/cats_schema.sql` seeds site 1 `testdomain.com` and site 180 `CATS_ADMIN` (`:1017-1018`); user 1 `admin`/`admin` and user 1250 `cats@rootadmin` (`:1108-1109`); `fromAddress = admin@testdomain.com` (`:979-982`); a `user_login` row from 2009 (`:1134`); `system.uid = 2618174` with version check disabled (`:1044`); seven `tag` rows (`:1060-1066`) and four `candidate_tag` rows for a candidate 1 that does not exist (`:337-340`).
  - `config.php:31` hard-codes a `LICENSE_KEY`.
  - The demo archive `db/cats_testdata.bak` is a CATS 0.5.5-era dump (site 201, plaintext users) that must go through the whole upgrade chain.
  - The login page's JavaScript still contains `defaultLogin()` (admin/cats) and `demoLogin()` helpers for accounts that do not exist after an empty install (`INSTALLATION.md` §4).
- **Evidence:** as cited. **Runtime:** the demo dump loaded (144/144 statements) and then broke every request (RT-01, `evidence/demo-data-path/seed-demo.log`); the empty install produced the seeded rows and the `admin`/`admin` login (#05).
- **Impact:** Test identifiers and orphan seed rows ship to production; the only demo dataset exercises the most fragile migrations and currently makes the application unusable.
- **Severity:** LOW — hygiene; the credential aspect is counted under DB-009 and the demo breakage under DB-006.
- **Recommendation:** Separate schema, minimal lookup seed and demo data; make the demo dataset match the current schema.
- **Unknown / needs further validation:** None.

---

## 8. Search-related schema and resume text

### DB-021 — Schema-level search gaps: no FULLTEXT, `REGEXP '[[:<:]]'`, function-wrapped predicates
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: PERF-001, PERF-002, PERF-010, DB-028*

- **Confirmed fact:**
  - No FULLTEXT index exists (`grep -c FULLTEXT db/cats_schema.sql` → 0). `attachment.IDX_text` was created in `db/upgrade-0.5.2-0.5.5.sql:200` and dropped by revision 179 (`modules/install/Schema.php:606-609`).
  - Without the optional Sphinx add-on (`config.php:97`, `ENABLE_SPHINX false`), keyword search turns each word into `field REGEXP '[[:<:]]word[[:>:]]'` and each wildcard into `LIKE '%word%'` (`lib/DatabaseSearch.php:359-373`). It is used for resume text (`lib/Search.php:1939`), key skills (`:491`), city (`:667-670`), company key technologies (`:796`) and job title (`:876`).
  - Name search wraps columns in `CONCAT()` (`lib/Search.php:462-464`, `:1358`); phone search wraps them in nested `REPLACE()` (`:628-641`, `:1363-1372`, `:1505-1514`); the careers lookup uses `LCASE(email1)` (`modules/careers/CareersUI.php:1707`); DataGrid "contains" filters use `LIKE '%…%'` (`lib/DataGrid.php:1163`, `:1168`).
  - `attachment.text` is `TEXT` (64 KB limit, `db/cats_schema.sql:93`).
  - Pagination uses `SQL_CALC_FOUND_ROWS` in 8 list queries and `SELECT FOUND_ROWS()` (`lib/DataGrid.php:1337`); Phase 0 counted 10, which included two comment lines.
  - Tables that are filtered or joined but have no secondary index include `candidate_tag`, `settings`, `saved_search`, `queue`, `company_department` and all `career_portal_*` tables (29 tables in total have none).
- **Evidence:**
  - As cited; per-query index analysis is in `PERFORMANCE_AUDIT.md` PERF-010.
  - **Runtime:** on MariaDB 10.7.8 the `[[:<:]]` REGEXP form runs and matches: resume keyword search found the TXT and DOCX fixtures and the negative control found nothing (#42, #44, #45); key-skills and city search worked (#40, #41).
- **Impact:** Every keyword search reads the text of every candidate row or resume of the site. Resume text longer than 64 KB is truncated or rejected. MySQL 8.0 replaced its regex library, and whether it accepts the `[[:<:]]` word-boundary syntax is **unknown** for this edition: the baseline only proves MariaDB. If it does not, keyword, key-skills, city, title and resume search fail on MySQL 8 — silently, because of DB-002.
- **Severity:** MEDIUM — search works today on MariaDB; the cost grows with data, and portability to MySQL 8 is unproven.
- **Recommendation:** Use a text index for resume and key-skill search, store normalised phone and name values so they can be indexed, and remove the dependency on the non-standard word-boundary syntax.
- **Unknown / needs further validation:** MySQL 8 behaviour of `REGEXP '[[:<:]]word[[:>:]]'`. Needs one query on a MySQL 8.0 instance. Search cost at realistic volume: see `PERFORMANCE_AUDIT.md` PERF-001.

### DB-028 — Failed text extraction stores `attachment.text = NULL` with no retry; resumes become unsearchable
*Confirmation: **Runtime** · New in this edition · Related: RT-08, DB-021, PERF-004, PERF-014*

- **Confirmed fact:** Resume search reads only `attachment.text`, which is filled once, at upload, by external converters. `config.php` ships placeholder converter paths (`\path\to\pdftotext` and similar), so PDF, DOC and RTF extraction fails. The attachment row is then stored with `text = NULL`. Nothing retries later; the only repair is the administrator's "reindex" action, whose selection condition has an operator-precedence error: `WHERE text = "" OR isnull(text) AND resume = 1` (`modules/install/ajax/attachmentsReindex.php:59`) also selects every non-resume attachment with empty text.
- **Evidence:**
  - `lib/Attachments.php:1099` (conversion at upload); `lib/DocumentToText.php:378` (`@exec`).
  - **Runtime (RT-08):** uploading `portfolio_alex.pdf` (#27) gave "unable to index the resume keywords"; FPM stderr `sh: \path\to\pdftotext: not found`; the attachment row had `text = NULL`; searching for the PDF's unique keyword found nothing (#43). TXT (#42) and DOCX (#44, #87) were indexed and found.
- **Impact:** With the committed configuration, PDF resumes — the most common resume format — are stored but never searchable, and fixing the configuration later does not index the resumes already uploaded unless someone runs the reindex action. The recruiter gets a one-time notice at upload only.
- **Severity:** MEDIUM — a core search feature silently misses a large share of resumes; the files themselves are kept.
- **Recommendation:** Record extraction status per attachment and retry failed extractions when converters become available; fix the reindex selection condition.
- **Unknown / needs further validation:** Share of attachments with `text` NULL in real installs. Needs `SELECT content_type, COUNT(*), SUM(text IS NULL) FROM attachment GROUP BY content_type` on a production copy.

---

## 9. Reference — platform and connection facts

| Aspect | Value | Evidence |
|---|---|---|
| Server targeted | Dump origin MySQL 5.1.31; installer accepts MySQL ≥ 4.1.0 with no upper bound; Docker and CI use MariaDB (`mariadb:10.7` pinned in the test compose file, unpinned in the dev compose file) | `db/cats_schema.sql:3`; `lib/InstallationTests.php:780`; `docker/docker-compose*.yml` |
| Server observed | MariaDB 10.7.8, reached through the Unix socket because `DATABASE_HOST` is `localhost` (baseline deviation E3) | `ENVIRONMENT.md` §2–3; `evidence/final-run/mariadb.log` |
| Driver | procedural `mysqli_*`; no PDO; no prepared statements | `lib/DatabaseConnection.php:111`, `:181` |
| Connection options | host, user, password only; charset `utf8`; no port, TLS, timeout, `sql_mode` or `time_zone` | `lib/DatabaseConnection.php:109-128`; `config.php:40-43`, `:136` |
| Engine / charset | MyISAM on 55/55 tables; `utf8` (utf8mb3); 39 tables `utf8_unicode_ci`, 16 with server-default collation | DB-003, DB-008 |
| Keys | 0 foreign keys; 0 FULLTEXT; 29 tables with no secondary index | `grep -c`; `awk` pass over the schema |
| Credentials | plaintext constants in the tracked `config.php` (`cats`/`password`) | `config.php:40-43` |
| Value helpers | `makeQueryString()` = quote + `mysqli_real_escape_string`; `makeQueryStringOrNULL()` = `NULL` when `empty(trim(v))` (also for `"0"`); `makeQueryInteger()` = `(integer)` cast; `makeQueryIntegerOrNULL()` = `NULL` for `-1`; `makeQueryDouble()` is unused | `lib/DatabaseConnection.php:480-575` |
| Statement splitting | `queryMultiple()` and the installer split scripts on a delimiter string (`";\n"`, `;` or `((ENDOFQUERY))`), so a literal delimiter inside a value breaks the statement | `lib/DatabaseConnection.php:234-236`; `modules/install/ajax/ui.php:1134-1136` |
| Locks | advisory `GET_LOCK`/`RELEASE_LOCK` used only around module scanning and migrations | `lib/DatabaseConnection.php:422-470`; `lib/ModuleUtility.php:243`, `:288` |
| Transactions | none effective (MyISAM; `BEGIN` errors ignored) | DB-003 |
| Schema version marker | `module_schema` row `install = 363` in the dump; 364 after the first request | `db/cats_schema.sql:862`; `INSTALLATION.md` §1 |

## 10. Reference — table-by-table inventory (55 tables)

*Line* = start line in `db/cats_schema.sql`; *Cols* = columns; *Idx* = secondary indexes; *Site* = has `site_id`. All tables are MyISAM, `utf8`. "gen." marks the 16 tables with server-default collation.

**Core recruiting**

| Table (line) | Purpose | Cols | Idx | Site | Notes |
|---|---|---|---|---|---|
| `candidate` (160) | Applicant master record: names, 3 phones, address, 2 e-mails, key skills, pay, EEO fields, flags | 36 | 12 | ✔ | PII and EEO (DB-011); pay as text (DB-014); `IDX_key_skills(key_skills(255))`, `(site_id, email1(8), email2(8))` |
| `company` (458) | Client company; `default_company` marks the built-in "Internal Postings" | 21 | 8 | ✔ | `is_hot` nullable; `billing_contact` → contact |
| `company_department` (497) | Departments of a company | 6 | 0 | ✔ | Not removed on company delete (DB-004) |
| `contact` (511) | Client contact; `company_id`, `company_department_id`, `reports_to` (−1 = none) | 25 | 8 | ✔ | Index name with leading space on old installs (DB-007) |
| `joborder` (792) | Requisition: title, company/contact, recruiter/owner, type, duration, rate, salary, status, openings, questionnaire | 29 | 12 | ✔ | `status varchar(64)` free text; 16 on upgraded installs (DB-007, DB-014) |
| `candidate_joborder` (229) | **Pipeline**: candidate ↔ job order with status, rating, submitted date | 10 | 8 | ✔ | No unique pair (DB-018) |
| `candidate_joborder_status` (255) | Lookup of pipeline statuses 0–800; `triggers_email`, `can_be_scheduled` | 5 | 1 | – | Duplicated in `constants.php:120-130` |
| `candidate_joborder_status_history` (281) | Status transitions (from, to, date); source for reports | 7 | 6 | ✔ | Keyed by `(candidate_id, joborder_id)`; deleted with pipelines (DB-013) |
| `candidate_jobordrer_status_type` (302) | Misspelled legacy lookup | 3 | 1 | – | Unused (DB-022) |
| `candidate_duplicates` (216) | Pairs flagged as possible duplicates (old, new) | 3 | 2 | ✔ | Several statements lack `site_id` (DB-012) |
| `candidate_source` (314) | Per-site list of candidate sources | 4 | 1 | ✔ (nullable) | Matched to `candidate.source` by name |
| `activity` (35) | Polymorphic activity log (call, e-mail, meeting) with notes and "regarding" job order | 10 | 11 | ✔ | Several redundant index prefixes |
| `activity_type` (64) | Lookup 100–700 | 2 | 1 | – | |
| `attachment` (83) | Polymorphic file metadata, extracted `text` (TEXT, 64 KB), MD5s, storage directory | 17 | 5 | ✔ | No FULLTEXT (DB-021); `text` NULL on failed extraction (DB-028) |
| `calendar_event` (113) | Polymorphic events with reminders; `data_item_*` and `joborder_id` default −1 | 18 | 2 | ✔ | Reminder scan has no index (PERF-010) |
| `calendar_event_type` (141) | Lookup | 3 | 1 | – | |

**Lists, custom fields, tags, audit, navigation**

| Table (line) | Purpose | Cols | Idx | Site | Notes |
|---|---|---|---|---|---|
| `saved_list` (912) | Static and dynamic lists; denormalised `number_entries`; `parameters` TEXT | 11 | 3 | ✔ | Counter drift repaired by migrations (DB-004) |
| `saved_list_entry` (934) | Polymorphic list membership | 6 | 4 | ✔ | No unique `(list, type, id)`; merge bug (DB-001) |
| `saved_search` (952) | Recent and saved searches (URL text) | 8 | 0 | ✔ (nullable) | |
| `extra_field` (654) | Custom-field values `(type, id, field_name) → value TEXT` | 7 | 2 | ✔ (nullable) | gen.; keyed by name (DB-015) |
| `extra_field_settings` (671) | Custom-field definitions: name, type, options, position | 9 | 0 | ✔ | |
| `tag` (1048) | Hierarchical tags (`tag_parent_id`) | 6 | 0 | ✔ (nullable) | `int unsigned` ids; missing on upgraded installs (DB-007) |
| `candidate_tag` (327) | Candidate ↔ tag | 4 | 0 | ✔ (nullable) | No index on either id; seed rows reference a missing candidate (DB-024) |
| `history` (710) | Field-level change log (old and new values as text) | 10 | 2 | ✔ | Incomplete, mutable, not backed up (DB-016) |
| `mru` (877) | Per-user recently used items (text + URL) | 7 | 1 | ✔ | No entity id; survives deletes |
| `data_item_type` (552) | Lookup 100/200/300/400 | 2 | 1 | – | Constants also define 500–900 (`constants.php:57-65`) |

**EEO, users, configuration, versioning**

| Table (line) | Purpose | Cols | Idx | Site | Notes |
|---|---|---|---|---|---|
| `eeo_ethnic_type` (568) | Ethnicity lookup | 2 | 0 | – | gen. |
| `eeo_veteran_type` (584) | Veteran-status lookup | 2 | 0 | – | gen.; gender and disability are free text on `candidate` |
| `site` (986) | Tenant; `time_zone` hour offset, date format, hosted-era counters (`page_views`, `file_size_kb`) | 24 | 1 | PK | Seeds 1 and 180 (DB-024); `page_views` written per page (PERF-007) |
| `user` (1070) | Users: MD5 `password`, `access_level`, `session_cookie`, serialized `column_preferences`, `can_see_eeo_info` | 28 | 4 | ✔ | No unique user name; DB-009, DB-011 |
| `user_login` (1113) | Login log (IP, user agent, host, success, refresh time) | 9 | 6 | ✔ | Never purged (DB-013) |
| `access_level` (16) | Lookup 0–500 | 3 | 1 | – | Constants also use −100, 350, 450 |
| `settings` (968) | Key/value per site and type (1 mailer, 2 calendar, 3 EEO, 4 careers) | 5 | 0 | ✔ | No unique key; malformed delete (DB-019) |
| `system` (1032) | Singleton: install UID, version-check data | 6 | 0 | – | Reserved word in MySQL 8 |
| `module_schema` (841) | Migration version per module (`install` = 363 in the dump) | 3 | 0 | – | No unique name |

**Career portal and questionnaires**

| Table (line) | Purpose | Cols | Idx | Site | Notes |
|---|---|---|---|---|---|
| `career_portal_template` (410) | Stock portal templates | 4 | 0 | – | gen. |
| `career_portal_template_site` (445) | Per-site customised templates | 5 | 0 | ✔ | gen. |
| `career_portal_questionnaire` (344) | Questionnaire header | 5 | 0 | ✔ | gen.; referenced by `joborder.questionnaire_id` |
| `career_portal_questionnaire_question` (393) | Questions | 9 | 0 | ✔ | gen. |
| `career_portal_questionnaire_answer` (357) | Answers and the candidate-field "actions" they trigger | 12 | 0 | ✔ | gen. |
| `career_portal_questionnaire_history` (377) | Copied question and answer text per candidate | 8 | 0 | ✔ | gen.; no candidate index; not removed on delete |

**E-mail, infrastructure, miscellaneous**

| Table (line) | Purpose | Cols | Idx | Site | Notes |
|---|---|---|---|---|---|
| `email_template` (617) | Per-site e-mail templates keyed by `tag` | 8 | 0 | ✔ | |
| `email_history` (599) | Log of sent e-mail including the full body | 7 | 3 | ✔ | PII copy, no purge (DB-011, DB-013) |
| `queue` (893) | Background task queue | 11 | 0 | ✔ | gen.; polled without an index (PERF-010) |
| `http_log` (735) / `http_log_types` (754) | XML-feed request log / its types | 11 / 4 | 0 / 0 | ✔ / – | gen.; one row per feed hit, no purge |
| `xml_feeds` (1160) / `xml_feed_submits` (1148) | Job-board feed definitions / unused | 7 / 4 | 0 / 0 | – | gen. |
| `import` (768) | Import batches (for revert via `import_id`) | 7 | 0 | ✔ | |
| `zipcodes` (1178) | US zip lookup; `mediumint` zip, no coordinates in the base schema | 4 | 0 | – | Replaced by the optional component (DB-007, DB-014) |
| `word_verification` (1138) | CAPTCHA word list | 2 | 0 | – | |
| `installtest` (783) | Installer scratch | 1 | 0 | – | |
| `extension_statistics` (641), `feedback` (693), `sph_counter` (1022) | Unreferenced by core code (Sphinx add-on only for `sph_counter`) | 5 / 9 / 2 | 0 | – / ✔ / – | DB-022 |

## 11. Reference — entity model and relationships

All arrows are logical only; no foreign key exists. Cardinalities come from the code.

```
 site (1 real tenant; 180 = CATS_ADMIN) ── site_id on 36 tables, enforced only by WHERE clauses (DB-012)

 user ──< user_login, mru, saved_search, email_history;  user.id is stored as owner / entered_by /
           recruiter / added_by on candidate, company, contact, joborder, candidate_joborder (no FK)

 company 1──< contact            (contact.company_id; contact.reports_to → contact, −1 = none)
 company 1──< company_department (contact / joborder .company_department_id, −1 = none)
 company 0..1── billing_contact → contact
 company 1──< joborder           (joborder.contact_id → contact; joborder.questionnaire_id → career_portal_questionnaire)

 candidate 1──< candidate_joborder >──1 joborder        ← the PIPELINE (status → candidate_joborder_status)
 candidate_joborder_status_history  keyed by (candidate_id, joborder_id), NOT by candidate_joborder_id
 history rows of type 800 (pipeline) keyed by candidate_joborder_id  → the two pipeline histories use different keys
 candidate ──< candidate_tag >── tag (tag_parent_id → tag)
 candidate ──< candidate_duplicates (old_candidate_id, new_candidate_id)
 candidate ──< career_portal_questionnaire_history (copied Q/A text)
 candidate.source ~~name match~~> candidate_source.name
 candidate.eeo_ethnic_type_id → eeo_ethnic_type ; eeo_veteran_type_id → eeo_veteran_type

 career_portal_questionnaire 1──< _question 1──< _answer

 POLYMORPHIC (data_item_type, data_item_id): 100 candidate · 200 company · 300 contact · 400 joborder
   activity          (+ joborder_id "regarding"; −1 or NULL = general)
   attachment        (+ file at attachments/site_N/<directory_name>/<stored_filename>)
   calendar_event    (+ joborder_id; −1 sentinel)
   saved_list_entry  (+ saved_list_id → saved_list)
   extra_field       (+ field_name ~~name match~~> extra_field_settings)
   history           (also 600 user, 700 list, 800 pipeline)
   mru, saved_search (type + URL text, no id)
```

- **Type codes** are PHP constants 100–900 (`constants.php:57-65`); the `data_item_type` table holds only 100–400.
- **Ids are per table.** Each entity table has its own `AUTO_INCREMENT` from 1, so `data_item_id` alone does not identify a row; every query on a polymorphic table must also filter on `data_item_type`. Most do; the exceptions are DB-001 (merge, four statements) and DB-025 (pipeline attachment flag).
- **Name-based links:** `extra_field` → `extra_field_settings` by `field_name` (`lib/ExtraFields.php:733-737`); `candidate.source` → `candidate_source.name` (`modules/install/Schema.php:372-398`).
- **Tables without `site_id` (19):** the lookups (`access_level`, `activity_type`, `calendar_event_type`, `candidate_joborder_status`, `candidate_jobordrer_status_type`, `data_item_type`, `eeo_*`, `http_log_types`), portal stock templates, and infrastructure (`career_portal_template`, `extension_statistics`, `installtest`, `module_schema`, `sph_counter`, `system`, `word_verification`, `xml_feed_submits`, `xml_feeds`, `zipcodes`). Nullable `site_id`: `candidate_source`, `candidate_tag`, `tag`, `saved_search`, `extra_field`.

## 12. Reference — install and migration paths

| Path | What runs | Result in the baseline |
|---|---|---|
| Empty database (`doInstallEmptyDatabase`) | `db/cats_schema.sql` split on `";\n"` (`modules/install/ajax/ui.php:755-761`); `upgrade-0.6.x-0.7.0.sql` only if `history` is missing (`:771-776`); then revision 364 on the first page request | Works: 188 statements, 0 errors; 363 → 364 (`INSTALLATION.md` §1) |
| Demo data (`onLoadDemoData`) | unzip `db/cats_testdata.bak`, replay the 0.5.5 dump split on `((ENDOFQUERY))` (`:781-843`), then `upgradeCats` | Dump loads 144/144; upgrade file error ignored; revision 225 fatal on every request (RT-01) |
| Upgrade (`upgradeCats`) | guess the version from tables and columns (`:856-893`), replay `db/upgrade-0.5.0-0.5.1.sql` … `upgrade-0.9.4-0.9.5.sql` (`:896-924`), always `upgrade-zipcodes.sql` (`:928`); then all in-app revisions on the next request | As demo path |
| App started before seeding | migration runner against an empty schema | 24 warnings; 16 tables created; no version recorded (RT-02, DB-027) |
| In-app revisions | `CATSSchema::get()` (`modules/install/Schema.php`, 1,336 lines; key 283 duplicated); run by `ModuleUtility::processModuleSchema()` on the first request of each session, under `GET_LOCK('CATSUpdateLock', 120)` | See DB-006 |
| Restore | `restoreFromBackup` replays `catsbackup.sql.*` files from a zip (`:691-749`) | Not exercised |

Only the `install` module ships revisions (`modules/install/CATSUI.php:39`). The dump seeds 24 `module_schema` rows (23 module directories plus `extension-statistics`); all except `install` (363) and `extension-statistics` (1) are at 0.

## 13. Reference — personal-data columns and what removes them

| Table | Personal data held | Removed when the candidate is deleted? | Purged over time? |
|---|---|---|---|
| `candidate` | names, 3 phones, address, city, state, zip, 2 e-mails, web site, employer, current and desired pay, notes, key skills, EEO ethnicity/veteran/disability/gender | yes (row deleted) | no |
| `attachment` + files under `attachments/site_N/` | resume and document files; extracted full text in `text` | yes (rows and files via `Attachments::delete`) | no |
| `extra_field` | any custom value | yes | no |
| `activity` | call and meeting notes about the person | **no** | no |
| `calendar_event` | event titles and descriptions | **no** | no |
| `history` | old and new field values, including EEO fields | **no** (a "(DELETED)" row is added) | no |
| `email_history` | sender, recipients, full message `text` | **no** | no |
| `career_portal_questionnaire_history` | applicant's questionnaire answers (`question`, `answer`) | **no** | no |
| `candidate_tag`, `mru`, `saved_search` | tag links; name text in recent items and searches | **no** (only the deleting user's MRU entry) | MRU and saved searches are trimmed per user |
| `contact` | names, phones, e-mail, address, notes of client contacts | contact delete only | no |
| `user`, `user_login` | user names, e-mail, MD5 password, live `session_cookie`; login IP, user agent, host | user delete removes `user` only | no |

Sources: `db/cats_schema.sql` column lists; delete paths in DB-004; purge search in DB-013.

---

## Area-level unknowns

1. **Server settings of real installs.** Version (MySQL vs MariaDB), `sql_mode`, default collation, server time zone. They decide the behaviour behind DB-008, DB-017, DB-020 and DB-021. Validate with `SELECT @@version, @@sql_mode, @@collation_server, @@global.time_zone, @@system_time_zone` on each deployment; the baseline did not record them.
2. **MySQL 8 compatibility.** `REGEXP '[[:<:]]…[[:>:]]'`, `ONLY_FULL_GROUP_BY` on the `GROUP BY <primary key>` list queries, the reserved word `system`, `ALTER IGNORE` and zero dates in revisions. Only MariaDB 10.7.8 was run. Validate by installing and smoke-testing on a MySQL 8.0 instance.
3. **Existing damage in production data.** Merge corruption (DB-001), orphans (DB-004), duplicate pipelines (DB-018), duplicate extra-field values (DB-015), entity-encoded text (DB-026), truncated 4-byte text (DB-008), resumes with `text` NULL (DB-028). Validate with read-only profiling queries on a production copy.
4. **Schema variants in the field.** How many installs were upgraded (missing `tag`/`candidate_tag`, `joborder.import_id`, different column widths, old index names). Validate with `information_schema` exports from real installs compared with a fresh install.
5. **Data volumes and growth.** Row counts and growth of `history`, `email_history`, `user_login`, `activity`, `attachment` and `http_log`, needed to size retention and any engine or charset conversion. Validate from production statistics.
6. **Backup and restore.** Actual behaviour of the built-in backup and restore on PHP 7.2 (DB-005). Validate with one backup/restore cycle on an isolated copy.
7. **PHP 8.1+ behaviour.** mysqli throws on error from 8.1, which would turn today's silent failures (DB-002) into fatal pages. Validate by running the smoke suite on PHP 8.1+ once the code parses there.
8. **Hooks and add-ons.** `eval`'d hooks such as `PIPELINES_ADD_SQL` (`lib/Pipelines.php:94`) can change SQL; third-party modules and the optional Sphinx search add-on (`optional-updates/latest-sphinx-search`) were not audited.

## Changes from the Phase 0 edition

- **Re-rated:** DB-013 MEDIUM → HIGH (deleting pipelines, candidates or job orders deletes status history that reports are built from; silent retroactive change of historical figures is a data-integrity defect under this edition's scale).
- **New findings:** DB-025 (pipeline attachment flag join without type), DB-026 (mixed raw and HTML-encoded stored text), DB-027 (partial schema when the app starts against an unseeded database, RT-02), DB-028 (failed extraction leaves `attachment.text` NULL, RT-08).
- **Withdrawn / merged:** none.
- **Confirmation upgraded to Runtime:** DB-002 (RT-02 warnings at `lib/DatabaseConnection.php:321`; RT-01 ignored upgrade error), DB-006 (RT-01 fatal in revision 225 inside a page request), DB-007 (RT-01 seed log: `upgrade-0.9.4-0.9.5.sql` fails), DB-009 (#05 `admin`/`admin` with no forced change), DB-021 (#40–#45: the `[[:<:]]` form works on MariaDB 10.7.8), DB-024 (RT-01 demo dump; seeded login).
- **Confirmation set to Partial:** DB-005 (PHP 8 failure verified; PHP 7.2 failure inferred; backup not run).
- **Corrected or extended claims:**
  - DB-001: line ranges updated (`lib/Candidates.php:1314-1360`, `:1626-1643`, delete at `:1578-1584`); noted that the list-entry delete in the same method does filter on type.
  - DB-004: added hard delete of users (setup wizard and tester action) and the references it leaves.
  - DB-007: added the `joborder.import_id` drift and its cause (file-based upgrade runs before the revision that creates `questionnaire_id`).
  - DB-010: added the merge's first-order use of `$_POST['email']` in the `SET` clause.
  - DB-014: radius search is disabled by default (`US_ZIPS_ENABLED false`).
  - DB-019: the serialized status map is about 115 bytes today, so it does not currently exceed `varchar(255)`; the truncation claim is now a future risk.
  - DB-020: documented how `OFFSET_GMT` drives the offset (logged-in vs anonymous requests) and that the baseline used a zero effective offset.
  - DB-021: `SQL_CALC_FOUND_ROWS` occurs in 8 queries, not 10 (two hits were comments); MySQL 8 support of the word-boundary syntax is now stated as unknown instead of as an inference.
  - Module count: 23 module directories (Phase 0 said "the other 23 modules"); the dump seeds 24 `module_schema` rows.
  - Line numbers re-checked: e.g. `lib/History.php` functions (`:64`, `:129`, `:143`), `modules/candidates/CandidatesUI.php:1420-1426`, `modules/install/ajax/ui.php:1111-1128`, `lib/DataGrid.php:1163`/`:1168`, `lib/Pipelines.php:618-619`.
- **Removed as out of scope:** Phase 0 §18 "Target data model and recommendations" (order of operations, table-by-table target, PostgreSQL vs MySQL notes) and the per-finding migration steps; recommendations are now limited to what should change and why. The "Facts vs Assumptions" section is replaced by the confirmation level on each finding.

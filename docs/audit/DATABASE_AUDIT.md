# OpenCATS Database Audit

**Scope.** This document audits the persistence layer of OpenCATS (CATS 0.9.x lineage): the 55-table MySQL/MariaDB schema in `db/cats_schema.sql`, the legacy upgrade scripts (`db/upgrade-*.sql`), the in-app migration mechanism (`modules/install/Schema.php` + `lib/ModuleUtility.php`), the installer DB paths (`installwizard.php` → `modules/install/ajax/ui.php`), seed/demo/test data, the DB access layer (`lib/DatabaseConnection.php`), and the SQL issued by the `lib/` model classes. It covers the data model, integrity, typing, multi-tenancy, migrations, query construction, privacy, retention, seed data and schema-level performance points. It ends with a target data model tied to the actual tables. Security exploitation, PHP-version compatibility and query performance each get a deeper treatment in the sibling audit documents. They are touched on here only where the database is the cause.

---

## Method

Files inspected (read in full or in the relevant ranges):

- `db/cats_schema.sql` (1188 lines, all 55 `CREATE TABLE` blocks and their seed `INSERT`s), `db/upgrade-0.5.0-0.5.1.sql`, `db/upgrade-0.5.1-0.5.2.sql`, `db/upgrade-0.5.2-0.5.5.sql`, `db/upgrade-0.5.5-0.6.x.sql`, `db/upgrade-0.6.x-0.7.0.sql`, `db/upgrade-0.9.4-0.9.5.sql`, `db/upgrade-zipcodes.sql`, `db/cats_testdata.bak`. The last is a zip file: I extracted `db/catsbackup.sql.0` into the scratchpad and inspected it there.
- `test/data/test.sql`, `test/data/securityTests.sql`, `docker/docker-compose*.yml`, `.github/workflows/ci.yml`, `.travis.yml`, `src/OpenCATS/Tests/IntegrationTests/DatabaseTestCase.php`.
- `modules/install/Schema.php` (all revisions), `modules/install/scripts/{114.php,150.php,359.sql}`, `modules/install/ajax/ui.php`, `modules/install/backupDB.php`, `modules/install/OptionalComponents.php`, `installwizard.php`, `lib/ModuleUtility.php`, `lib/InstallationTests.php`.
- `lib/DatabaseConnection.php` (entire file), plus these model/SQL classes: `Candidates.php`, `JobOrders.php`, `Pipelines.php`, `Companies.php`, `Contacts.php`, `ActivityEntries.php`, `Attachments.php`, `SavedLists.php`, `ExtraFields.php`, `History.php`, `Users.php`, `Tags.php`, `Calendar.php`, `Statistics.php`, `Search.php`, `DatabaseSearch.php`, `DataGrid.php`, `Questionnaire.php`, `CareerPortal.php`, `EmailTemplates.php`, `Mailer.php` (MailerSettings), `MRU.php`, `Session.php`, `Site.php`, `SystemInfo.php`, `ZipLookup.php`, `QueueProcessor.php`, `Profile.php`, and `src/OpenCATS/Entity/*Repository.php`.

Commands and techniques used (all read-only against the repo; scratch files went to the session scratchpad):

- `grep -n "CREATE TABLE"` plus an `awk` pass over `db/cats_schema.sql` to list, per table: start line, column count, `site_id` presence, index count, FULLTEXT presence and ENGINE/CHARSET.
- A normalised DDL diff between `db/cats_schema.sql` and `test/data/test.sql`: `CREATE TABLE` blocks extracted, `AUTO_INCREMENT=` stripped, then `diff`.
- A Perl scan of every single- or double-quoted SQL literal in `lib/*.php` and `modules/**.php`. The scan flagged literals that touch tenant tables but never mention `site_id`, and polymorphic queries that use `data_item_id` without `data_item_type`. Every hit was then reviewed by hand.
- Loading the `CATSSchema::get()` array under PHP 8.4 CLI (from a scratchpad copy) to confirm the effective revision count and the duplicate key.
- PHP 8.4 CLI checks of the language semantics that the findings depend on: `mysqli_query(string, …)` raises a TypeError; a 5-argument error handler raises ArgumentCountError; `implode(array, string)` raises a TypeError.
- `md5sum` to identify the seeded password hashes.

Nothing was executed against a live database. Runtime DB behaviour (sql_mode, strictness, charset errors) is inferred from code and documented MySQL/MariaDB semantics, and each such claim is labelled INFERENCE.

---

## Summary of findings

| ID | Title | Severity |
|---|---|---|
| DB-001 | Candidate merge re-parents polymorphic rows without `data_item_type`, silently moving other entities' activities, attachments, events and list entries | CRITICAL |
| DB-002 | SQL errors are never detected by `DatabaseConnection::query()` (dead error branch); installer ignores all DDL errors | HIGH |
| DB-003 | All 55 tables are MyISAM: no transactions, no foreign keys, table-level locks, no crash-safe recovery; the transaction API is a no-op | HIGH |
| DB-004 | No referential integrity; manual cascades are incomplete, which leaves orphan rows | HIGH |
| DB-005 | The built-in DB backup cannot dump data on PHP 7/8 and deliberately skips `history` | HIGH |
| DB-006 | Migration mechanism: `eval`'d PHP and `;`-split SQL keyed by integers, run at session start; incompatible with MySQL ≥5.7 and PHP 8 | HIGH |
| DB-007 | Schema drift between `cats_schema.sql`, the migration path and test fixtures (tag tables never migrated, column widths, zipcodes) | HIGH |
| DB-008 | `utf8` (= utf8mb3) everywhere, plus mixed `utf8_unicode_ci`/`utf8_general_ci` collations; 4-byte characters (emoji etc.) cannot be stored | HIGH |
| DB-009 | Passwords stored as unsalted MD5, hashed inside SQL text; seeded `admin`/`admin` bypasses the forced password change | HIGH |
| DB-010 | SQL is built by string interpolation, with no prepared statements; several unescaped paths reach the DB | HIGH |
| DB-011 | PII and EEO special-category data stored in plaintext and copied into history, email log, MRU, etc.; no erasure path | HIGH |
| DB-012 | Tenant isolation (`site_id`) is vestigial and inconsistently enforced (cross-site duplicate matching, unscoped deletes, hard-coded `site_id = 1`) | MEDIUM |
| DB-013 | No retention policy; hard deletes of pipeline status history silently rewrite historical KPIs | MEDIUM |
| DB-014 | Weak data typing: money and durations as varchar, extra-field dates as text, free-text statuses, sentinel values, zipcode type mismatch and swapped lat/lng | MEDIUM |
| DB-015 | Extra-fields EAV keyed by field **name**, with no uniqueness, one LEFT JOIN per field and weak indexes | MEDIUM |
| DB-016 | `history` audit table is incomplete, mutable, session-coupled and excluded from backups | MEDIUM |
| DB-017 | The application never sets `sql_mode`; correctness depends on server defaults | MEDIUM |
| DB-018 | Pipeline table has no unique `(candidate_id, joborder_id)`; check-then-insert race | MEDIUM |
| DB-019 | `settings` key/value store: no unique key, a malformed `DELETE` in `MailerSettings::set`, serialized PHP in `varchar(255)` | MEDIUM |
| DB-020 | Time zones handled by rewriting SQL text; DATETIMEs stored in server local time | MEDIUM |
| DB-021 | Schema-level search/performance gaps: no FULLTEXT, `REGEXP '[[:<:]]'` (breaks on MySQL 8), function-wrapped predicates, unindexed link tables | MEDIUM |
| DB-022 | Dead or vestigial tables, and code that queries tables which do not exist | LOW |
| DB-023 | DB access layer hygiene: `set_time_limit(0)` per query, wrong error accessor, no TLS/port, partial read-only filter, no query logging | LOW |
| DB-024 | Seed and fixture hygiene: hard-coded license key and UID, test sites, plaintext demo passwords, lookup tables out of sync with constants | LOW |

---

## 1. Platform and connection facts

| Aspect | Value | Evidence |
|---|---|---|
| DB server targeted | MySQL 5.1 dump origin; installer accepts MySQL ≥ 4.1.0 (no upper bound); Docker/CI use MariaDB (`mariadb` latest, `mariadb:10.7`) | `db/cats_schema.sql:3` (`MySQL - 5.1.31-community`), `lib/InstallationTests.php:780` (`version_compare($version, '4.1.0', '>=')`), `docker/docker-compose.yml:27`, `docker/docker-compose-test.yml:27` |
| Driver | procedural `mysqli_*`, no PDO, no prepared statements | `lib/DatabaseConnection.php:111,181`; `grep mysqli_prepare\|bind_param\|PDO` over `lib modules src` returns nothing |
| Connection charset | `mysqli_set_charset($conn, SQL_CHARACTER_SET)` with `SQL_CHARACTER_SET = 'utf8'` | `lib/DatabaseConnection.php:128`, `config.php:136` |
| sql_mode | never set at runtime; set only as a session variable while the schema dump loads (`SQL_MODE=''`, then `'NO_AUTO_VALUE_ON_ZERO'`) | `db/cats_schema.sql:10,12,1188`; no `sql_mode` string anywhere in `lib/` or `modules/` |
| Storage engine | `ENGINE=MyISAM` on 55/55 tables | awk pass over `db/cats_schema.sql` (every block ends `) ENGINE=MyISAM …`) |
| Charset/collation | `DEFAULT CHARSET=utf8`; 39 tables `COLLATE=utf8_unicode_ci`, 16 tables with no collation (→ `utf8_general_ci`) | e.g. `db/cats_schema.sql:351,371,387,404,416,452,572,588,648,665,748,760,906,1026,1154,1169` |
| TLS / port / socket | none; `mysqli_connect(DATABASE_HOST, DATABASE_USER, DATABASE_PASS)` | `lib/DatabaseConnection.php:111-113` |
| Credentials | plaintext constants in `config.php` (`DATABASE_PASS 'password'`) | `config.php:40-43` |

---

## 2. Table inventory (55 tables)

Legend: *line* = start line in `db/cats_schema.sql`; *cols* = column count; *site_id*: ✔ = present (N = nullable); *engine* = MyISAM for all rows; *coll* is `u` for `utf8_unicode_ci` and `g` for implicit `utf8_general_ci`.

### 2.1 Core recruiting

| Table (line) | Purpose | Cols | PK | Notable indexes | site_id | coll |
|---|---|---|---|---|---|---|
| `candidate` (160) | Applicant master: names, 3 phones, address, email1/2, key_skills, pay, EEO, flags `is_hot`, `is_active`, `is_admin_hidden` | 36 | `candidate_id` | `IDX_key_skills(key_skills(255))`, 3 phone idx, `IDX_site_first_last_modified(site_id,first_name,last_name,date_modified)`, `IDX_site_id_email_1_2(site_id,email1(8),email2(8))` | ✔ | u |
| `joborder` (792) | Requisition: title, company/contact/department, recruiter/owner, `type`, `duration`, `rate_max`, `salary`, `status` (free text), openings, `questionnaire_id` | 29 | `joborder_id` | 12 single-column idx incl. low-selectivity `IDX_is_hot`, `IDX_jopenings`; `IDX_site_id_status(site_id,status(8))` | ✔ | u |
| `candidate_joborder` (229) | **Pipeline**: candidate↔job order, `status`, `rating_value`, `date_submitted`, `added_by` | 10 | surrogate `candidate_joborder_id` | `IDX_candidate_id`, `IDX_joborder_id`, `(site_id,status)`, `(site_id,joborder_id)`; **no UNIQUE(candidate_id,joborder_id)** | ✔ | u |
| `candidate_joborder_status` (255) | Lookup of pipeline statuses 0–800 plus `triggers_email`, `can_be_scheduled` | 5 | id | `short_description` | – | u |
| `candidate_joborder_status_history` (281) | Status transitions (from/to/date); source for reports | 7 | surrogate | 6 idx incl. `(candidate_id,joborder_id,status_to,site_id)` | ✔ | u |
| `candidate_jobordrer_status_type` (302) | Misspelled, unused legacy lookup | 3 | id | – | – | u |
| `candidate_duplicates` (216) | Duplicate-detection links (old,new) | 3 | `(old_candidate_id,new_candidate_id)` | old, new | ✔ (NOT NULL, no default) | u |
| `candidate_source` (314) | Per-site list of "source" values (matched to `candidate.source` **by name**) | 4 | `source_id` | `siteID` | ✔N | u |
| `company` (458) | Client company; `billing_contact`, `default_company` ("Internal Postings") | 21 | `company_id` | 8 idx incl. `key_technologies(255)` | ✔ | u |
| `company_department` (497) | Departments of a company | 6 | id | **none** | ✔ | u |
| `contact` (511) | Client contact; `company_id` NOT NULL, `company_department_id` NOT NULL, `reports_to` (−1 = none), `left_company` | 25 | `contact_id` | 8 idx | ✔ | u |
| `activity` (35) | Polymorphic activity log (call/email/meeting) with `notes`, "regarding" `joborder_id` | 10 | `activity_id` | **11** idx (several redundant prefixes) | ✔ | u |
| `activity_type` (64) | Lookup 100–700 | 2 | id | short_description | – | u |
| `attachment` (83) | Polymorphic file metadata plus extracted **resume `text` (TEXT, 64 KB max)**, md5s, `directory_name` | 17 | id | `(data_item_type,data_item_id)`, `md5_sum`, `(site_id,file_size_kb[,date_created])`; **no FULLTEXT** | ✔ | u |
| `calendar_event` (113) | Polymorphic events; `data_item_*`/`joborder_id` default **−1**; reminders | 18 | id | `(site_id,date)`, `(site_id,data_item_type,data_item_id)` | ✔ | u |
| `calendar_event_type` (141) | Lookup | 3 | id | short_description | – | u |

### 2.2 Lists, EAV, tags, history, MRU

| Table (line) | Purpose | Cols | PK | Notable indexes | site_id | coll |
|---|---|---|---|---|---|---|
| `saved_list` (912) | Static/dynamic lists; denormalised `number_entries`; `parameters` TEXT | 11 | id | data_item_type, description, site_id | ✔ | u |
| `saved_list_entry` (934) | Polymorphic list membership | 6 | id | `(data_item_type,data_item_id)`, `saved_list_id`; **no UNIQUE(saved_list_id,data_item_type,data_item_id)**, no site idx | ✔ | u |
| `saved_search` (952) | Recent/saved searches (URL text) | 8 | id | **none** | ✔N | u |
| `extra_field` (654) | EAV values: `(data_item_type,data_item_id,field_name) → value TEXT` | 7 | id | `assoc_id(data_item_id)`, `site_id` only | ✔N | **g** |
| `extra_field_settings` (671) | EAV definitions: name, type, options (url-encoded CSV), position | 9 | id | **none** | ✔ | u |
| `tag` (1048) | Hierarchical tags (`tag_parent_id`), `int unsigned` ids | 6 | id | **none** | ✔N | u |
| `candidate_tag` (327) | candidate↔tag | 4 | `id` | **none** (no `(candidate_id)`, no `(tag_id)`) | ✔N | u |
| `history` (710) | Field-level audit (`the_field`, `previous_value`, `new_value`) | 10 | id | `entered_by`, `(data_item_id,data_item_type,site_id)` | ✔ | u |
| `mru` (877) | Per-user recently-used list (text + URL, **no data_item_id**) | 7 | id | `(user_id,site_id)` | ✔ | u |
| `data_item_type` (552) | Lookup 100/200/300/400 (constants define 100–900) | 2 | id | – | – | u |

### 2.3 EEO

| Table | Purpose | Cols | PK | site_id | coll |
|---|---|---|---|---|---|
| `eeo_ethnic_type` (568) | Race/ethnicity lookup (5 rows) | 2 | id | – | g |
| `eeo_veteran_type` (584) | Veteran status lookup (4 rows) | 2 | id | – | g |

(Gender and disability status are free `varchar(5)` columns on `candidate`, `db/cats_schema.sql:190-191`.)

### 2.4 Users, tenancy, configuration, versioning

| Table (line) | Purpose | Cols | PK | Notable | site_id | coll |
|---|---|---|---|---|---|---|
| `site` (986) | Tenant (seed rows 1 `testdomain.com` and 180 `CATS_ADMIN`); flags `account_deleted`, `time_zone`, counters | 24 | `site_id` | `IDX_account_deleted` | (PK) | u |
| `user` (1070) | Users: `password varchar(128)` (MD5), `access_level`, `session_cookie`, `column_preferences` (serialized PHP, longtext), `can_see_eeo_info` | 28 | `user_id` | site_id, names, access_level; **no UNIQUE(user_name)** | ✔ | u |
| `user_login` (1113) | Login audit (IP, UA, host, success) | 9 | id | 6 idx | ✔ | u |
| `access_level` (16) | Lookup 0–500 (constants also use −100, 350, 450) | 3 | id | – | – | u |
| `settings` (968) | Key/value per site and `settings_type` (1 mailer, 2 calendar, 3 EEO, 4 career portal); `value varchar(255)` | 5 | id | **none, no UNIQUE(site_id,settings_type,setting)** | ✔ | u |
| `system` (1032) | Singleton: `uid`, version-check data | 6 | `system_id` | – | – | u |
| `module_schema` (841) | **Migration version per module** (`install` = 363 in seed) | 3 | id | **no UNIQUE(name)** | – | u |

### 2.5 Career portal and questionnaires

| Table (line) | Purpose | Cols | PK | Indexes | site_id | coll |
|---|---|---|---|---|---|---|
| `career_portal_template` (410) | Global stock templates (seeded ids 56–77) | 4 | id | none | – | g |
| `career_portal_template_site` (445) | Per-site customised templates | 5 | id | none | ✔ | g |
| `career_portal_questionnaire` (344) | Questionnaire header | 5 | id | none | ✔ | g |
| `career_portal_questionnaire_question` (393) | Questions | 9 | id | none | ✔ | g |
| `career_portal_questionnaire_answer` (357) | Answers + "actions" that mutate the candidate (source, notes, is_hot, key_skills) | 12 | id | none | ✔ | g |
| `career_portal_questionnaire_history` (377) | Denormalised Q/A text copied per candidate | 8 | id | none (no `candidate_id` idx) | ✔ | g |

### 2.6 E-mail

| Table (line) | Purpose | Cols | PK | Indexes | site_id | coll |
|---|---|---|---|---|---|---|
| `email_template` (617) | Per-site templates keyed by `tag` | 8 | id | none | ✔ | u |
| `email_history` (599) | Log of every sent e-mail **including full body** | 7 | id | site, date, user | ✔ | u |

### 2.7 Infrastructure and miscellaneous

| Table (line) | Purpose | Cols | site_id | Notes |
|---|---|---|---|---|
| `queue` (893) | Async task queue (`QueueProcessor`) | 11 | ✔ | no indexes; polled with `WHERE locked=0 AND error=0 AND ISNULL(date_completed) ORDER BY priority` (`lib/QueueProcessor.php:171`) |
| `http_log` (735) / `http_log_types` (754) | XML-feed request log | 11 / 4 | ✔ / – | no indexes, no purge |
| `xml_feeds` (1160) / `xml_feed_submits` (1148) | Job-board feed definitions (Indeed, SimplyHired) / unused | 7 / 4 | – | `xml_feed_submits` unreferenced |
| `import` (768) | Import batches (for revert via `import_id` columns) | 7 | ✔ | |
| `installtest` (783) | Installer scratch | 1 | – | |
| `word_verification` (1138) | CAPTCHA words (`lib/Graphs.php`) | 2 | – | |
| `extension_statistics` (641), `feedback` (693), `sph_counter` (1022) | Unreferenced by core code (`sph_counter` only for the optional Sphinx add-on) | | | |
| `zipcodes` (1178) | US zip lookup; **`zipcode mediumint`, no lat/lng** in the base schema | 4 | – | see DB-007/DB-014 |

**Tables without `site_id` (19):** `access_level`, `activity_type`, `calendar_event_type`, `candidate_joborder_status`, `candidate_jobordrer_status_type`, `career_portal_template`, `data_item_type`, `eeo_ethnic_type`, `eeo_veteran_type`, `extension_statistics`, `http_log_types`, `installtest`, `module_schema`, `sph_counter`, `system`, `word_verification`, `xml_feed_submits`, `xml_feeds`, `zipcodes`. All are global lookups or infrastructure. Global business config lives in them too, e.g. which pipeline status triggers e-mail. A per-site override of that is stored as a serialized array in `settings` (`lib/Mailer.php:431-435`).

**Other tables with nullable `site_id` (5):** `candidate_source`, `candidate_tag`, `tag`, `saved_search`, `extra_field`. `tag` and `candidate_tag` also use `int(10) unsigned` ids, while every other table uses `int(11)` signed.

---

## 3. Entity-relationship model

### 3.1 ASCII ERD (core recruiting)

Arrows are *logical* references only. **No foreign key exists anywhere in the schema** (`grep -c "FOREIGN KEY" db/cats_schema.sql` returns 0). Cardinalities come from the code.

```
                                 +------------------+
                                 |      site        |  site_id on 36 tables (no FK)
                                 +------------------+  1 = default tenant, 180 = CATS_ADMIN
                                          |
    +-------------------+   owner / entered_by / recruiter / added_by / created_by
    |       user        |<------------------------------------------------------------+
    +-------------------+                                                             |
      | 1                                                                             |
      | *  user_login, email_history, mru, saved_search                               |
                                                                                      |
 +------------------+ 1        * +------------------+ *       0..1 +------------------+
 |     company      |------------|     contact      |--------------| contact          |
 | billing_contact -+--0..1----->|  company_id      | reports_to   | (self, -1 = none)|
 | default_company  |            |  company_dept_id |------+       +------------------+
 +------------------+            +------------------+      |
   | 1        | 1                          | 0..1          |
   |          |  *                         |               v
   |   +--------------------+              |      +--------------------+
   |   | company_department |<-------------+------| (joborder.company_ |
   |   +--------------------+   0..1 (-1)         |  department_id)    |
   | *                                             +--------------------+
 +------------------+ *            1 +--------------------------------+
 |    joborder      |--------------->| career_portal_questionnaire    | 1-* question 1-* answer
 | company_id       |  questionnaire_id                               |
 | contact_id  -----+--> contact     +--------------------------------+
 | status (text!)   |
 +------------------+
          | 1
          | *
 +--------------------------+ *      1 +------------------+ 1   * +---------------------------------+
 |   candidate_joborder     |--------->|    candidate     |------>| career_portal_questionnaire_    |
 |   (PIPELINE)             |          | source ~~text~~> |       | history (denormalised Q/A text) |
 |   status -> candidate_   |          | candidate_source |       +---------------------------------+
 |   joborder_status        |          | eeo_ethnic_type_id  -> eeo_ethnic_type
 +--------------------------+          | eeo_veteran_type_id -> eeo_veteran_type
          .                            +------------------+
          . (candidate_id, joborder_id; NOT candidate_joborder_id)   | *        | *
 +------------------------------------+                    | candidate_tag * -> tag (tag_parent_id -> tag)
 | candidate_joborder_status_history  |                    | candidate_duplicates (old_id, new_id) -> candidate
 +------------------------------------+

 POLYMORPHIC  (data_item_type, data_item_id)  -> 100 candidate | 200 company | 300 contact | 400 joborder
 ---------------------------------------------------------------------------------------------------
   activity            (+ joborder_id "regarding", -1/NULL = general)
   attachment          (+ files at attachments/<directory_name>/<stored_filename>)
   calendar_event      (+ joborder_id, -1 sentinel)
   extra_field         (+ field_name  ~~text join~~>  extra_field_settings(site_id, data_item_type, field_name))
   saved_list_entry    (+ saved_list_id -> saved_list; saved_list.data_item_type)
   history             (also 800 = PIPELINE -> candidate_joborder_id, 600 user, 700 list ...)
   mru / saved_search  (data_item_type + URL string, no id)
```

### 3.2 How polymorphism works

- **Type codes** are PHP constants: `DATA_ITEM_CANDIDATE 100`, `COMPANY 200`, `CONTACT 300`, `JOBORDER 400`, `BULKRESUME 500`, `USER 600`, `LIST 700`, `PIPELINE 800`, `DUPLICATE 900` (`constants.php:57-65`). The `data_item_type` lookup table holds only 100–400 (`db/cats_schema.sql:561-564`), so the table and the constants disagree.
- **Every polymorphic row is identified by the pair** `(data_item_type, data_item_id)`. Each entity table has its own `AUTO_INCREMENT` starting at 1, so the numeric id alone is **not** unique across types (FACT: separate `AUTO_INCREMENT` per table in `db/cats_schema.sql`). Any query that filters on `data_item_id` without `data_item_type` therefore hits other entity types (see DB-001).
- The model enforces the type filter by convention. Most model methods include it, for example `ExtraFields::deleteValueByDataItemID` (`lib/ExtraFields.php:508-524`), `Candidates::delete` → `saved_list_entry` (`lib/Candidates.php:408-420`) and `ExtraFields::getDataGridDefinition` joins (`lib/ExtraFields.php:734-737`). The exceptions are listed in DB-001.
- `extra_field` → `extra_field_settings` is joined by **name** (`field_name`), not by id (`lib/ExtraFields.php:943-959`, `734-737`).
- `candidate.source` → `candidate_source.name` is also a name match (`modules/install/Schema.php:372-398` backfill).
- `candidate_joborder_status_history` is keyed by `(candidate_id, joborder_id)`, not by `candidate_joborder_id`. `history` rows of type 800 are keyed by `candidate_joborder_id` (`lib/Pipelines.php:357-365`). The two pipeline histories use different keys.

---

## 4. Engine, charset, SQL mode, dates

### DB-003 — All 55 tables are MyISAM: no transactions, no FKs, table locks, no crash-safe recovery
- **Severity:** HIGH
- **Finding:** Every table is `ENGINE=MyISAM`. The upgrade scripts create MyISAM too, and even convert the few legacy InnoDB tables to MyISAM. `DatabaseConnection` exposes `beginTransaction/commit/rollback`, but they send `BEGIN`/`COMMIT` with errors ignored, which does nothing on MyISAM. Only the dead `lib/Profile.php` calls them, against tables that do not exist (DB-022). Multi-statement business operations are therefore non-atomic. Examples: candidate delete (7 statements), company delete (recursive), candidate merge (≥10 statements), pipeline status change (UPDATE + status-history INSERT + history INSERT).
- **Evidence:**
  - `db/cats_schema.sql` — 55/55 blocks end `) ENGINE=MyISAM` (awk inventory in Method).
  - `db/upgrade-0.6.x-0.7.0.sql:80,84,88` — `ALTER TABLE \`candidate_foreign\` TYPE = MYISAM;` (converting InnoDB tables created in `db/upgrade-0.5.5-0.6.x.sql` back to MyISAM).
  - `lib/DatabaseConnection.php:718-729`: `// Ignore errors (if called for MyISAM, for example)` / `$this->query('BEGIN', true);`
  - `lib/InstallationTests.php:425` — the installer's permission test itself creates `ENGINE=MyISAM`.
  - `lib/Profile.php:390-391`: `// Begin transaction (if one delete fails, roll everything back, I <3 InnoDB)`.
- **Impact:** A PHP fatal or timeout mid-operation leaves half-applied changes, e.g. a candidate row deleted but its pipelines and attachments left behind. Each write takes a table-level lock, so concurrent recruiters serialise on `candidate`/`activity`. After an unclean shutdown, tables can be marked crashed and need `REPAIR TABLE`, with possible row loss. INFERENCE: managed platforms and clusters that require InnoDB (Aurora MySQL, Galera/MariaDB Cluster replication) cannot host this schema as-is.
- **Recommendation:** Convert all tables to InnoDB (`ALTER TABLE … ENGINE=InnoDB`) as the first migration of a new migration tool (DB-006). Then wrap `Candidates::delete`, `Companies::delete`, `JobOrders::delete`, `Candidates::mergeDuplicates` and `Pipelines::setStatus` in real transactions. Also make `beginTransaction()` stop ignoring errors.

### DB-008 — `utf8` (utf8mb3) everywhere and mixed collations; 4-byte characters cannot be stored
- **Severity:** HIGH
- **Finding:** Tables and connection use `utf8` (3-byte utf8mb3). Nothing references `utf8mb4` anywhere in the repo (`grep -ri mb4` finds only unrelated simpletest code). 16 tables have no explicit collation and fall back to `utf8_general_ci`; the other 39 use `utf8_unicode_ci`, as do some individual columns (e.g. `site.unix_name varchar(128) CHARACTER SET utf8` in a `utf8_unicode_ci` table).
- **Evidence:** `config.php:136` `define('SQL_CHARACTER_SET', 'utf8');`, `lib/DatabaseConnection.php:128`. `db/cats_schema.sql:8` `SET NAMES utf8`. Mixed collation: `extra_field` `DEFAULT CHARSET=utf8;` (`db/cats_schema.sql:665`) vs `extra_field_settings` `COLLATE=utf8_unicode_ci` (`:682`); all six `career_portal_*` tables (`:351,371,387,404,416,452`).
- **Impact:** INFERENCE, based on MySQL/MariaDB semantics. Characters outside the BMP (emoji, some CJK extension characters, mathematical symbols) cannot be stored. Under `STRICT_TRANS_TABLES`, the MariaDB ≥10.2.4 default used by the Docker setup, a single-row INSERT into MyISAM with such characters fails with error 1366. Resume text from `attachment.text`, candidate notes and names would be rejected, and because of DB-002 the failure goes unnoticed. In non-strict mode the value is silently truncated at the first 4-byte character. Mixed collations cause "Illegal mix of collations" errors whenever columns from `extra_field`/`career_portal_*` are compared with `utf8_unicode_ci` columns. MySQL 8 deprecates the `utf8` alias.
- **Recommendation:** Convert every table to `utf8mb4` / `utf8mb4_unicode_ci` (or `utf8mb4_0900_ai_ci` on MySQL 8) and set `SQL_CHARACTER_SET` to `utf8mb4`. Prefix indexes such as `candidate.IDX_key_skills(key_skills(255))` and `IDX_site_id_email_1_2` must be re-checked against the index byte limit. That is not an issue on InnoDB DYNAMIC rows (3072 bytes), but needs verifying on the target engine.

### DB-017 — The application never sets `sql_mode`; behaviour depends on server defaults
- **Severity:** MEDIUM
- **Finding:** The schema dump sets `SQL_MODE=''` and then `NO_AUTO_VALUE_ON_ZERO` for its own load session only. The runtime connection never sets a mode. The code base mixes patterns whose outcome depends on the mode:
  - zero-date literals in migrations;
  - `TEXT … DEFAULT ''` in migrations;
  - over-length strings with no server-side validation, e.g. `joborder.title varchar(64)`, `saved_list.description varchar(64)`, `settings.value varchar(255)` holding serialized arrays;
  - `GROUP BY candidate.candidate_id` with non-aggregated joined columns (`lib/Candidates.php:548-549`).
- **Evidence:** `db/cats_schema.sql:10,12,1188`. Zero dates: `modules/install/Schema.php:178,465,845,1217`. `TEXT default ''`: `modules/install/Schema.php:869,1118,1226`. No `sql_mode` in `lib/DatabaseConnection.php`.
- **Impact:** The same code truncates silently on one server and errors on another. MySQL 5.7+/8 defaults (`STRICT_TRANS_TABLES, NO_ZERO_DATE, NO_ZERO_IN_DATE, ONLY_FULL_GROUP_BY`) make the listed migrations fail. MariaDB defaults (`STRICT_TRANS_TABLES`, no `NO_ZERO_DATE`) behave differently again. UNKNOWN: which mode production installs actually run with.
- **Recommendation:** Pin a mode on connect, e.g. `SET SESSION sql_mode='STRICT_ALL_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'`, right after `mysqli_set_charset` (`lib/DatabaseConnection.php:128`). Fix the offending code paths first, and add length validation in the model classes.

### Dates and sentinels (supporting facts for DB-014)
- `cats_schema.sql` uses the sentinel `'1000-01-01 00:00:00'` as the default for NOT NULL datetimes (e.g. `activity.date_created`, `db/cats_schema.sql:42`). `test/data/test.sql` and the migrations use `'0000-00-00 00:00:00'` for the same columns (see the diff in DB-007). Reports and sorts therefore see two different "no date" values depending on install path.
- Integer sentinels: `calendar_event.data_item_id/data_item_type/joborder_id DEFAULT -1` (`db/cats_schema.sql:119-120,125`); `contact.reports_to DEFAULT -1` (`:536`); `company_department_id = -1` backfilled (`modules/install/Schema.php:338,344`); `activity.joborder_id` stored as `-1` ("general", `lib/ActivityEntries.php:87,114`) although the column is nullable. `NULL`, `0` and `-1` all mean "none" in different tables.

---

## 5. Referential integrity, cascades, orphans

### DB-004 — No referential integrity; manual cascades are incomplete, which leaves orphan rows
- **Severity:** HIGH
- **Finding:** There are no foreign keys, so every cascade is hand-written PHP. The cascades that exist are partial:

| Delete of | What the code removes | What it leaves behind (orphans) | Evidence |
|---|---|---|---|
| candidate | `candidate`, `candidate_joborder`, `candidate_joborder_status_history`, `saved_list_entry`, `candidate_duplicates`, attachments, extra fields; writes a `history` "(DELETED)" row | `activity`, `calendar_event` (data_item 100), `candidate_tag`, `career_portal_questionnaire_history`, all prior `history` rows (with values), other users' `mru` rows (only the deleting user's MRU entry is removed) | `lib/Candidates.php:363-449`; `modules/candidates/CandidatesUI.php:1419-1426`; `lib/MRU.php:171-193` (MRU delete scoped to `user_id`) |
| job order | `joborder`, pipelines, status history, attachments, list entries, extra fields | `activity.joborder_id`, `calendar_event.joborder_id` ("regarding"), `activity`/`calendar_event` with data_item 400 | `lib/JobOrders.php:272-345` |
| contact | `contact`, list entries, extra fields; resets `reports_to` | `joborder.contact_id`, `company.billing_contact`, activities, events, attachments of the contact | `lib/Contacts.php:347-399` |
| company | recursively deletes contacts and job orders (non-atomic), attachments, list entries, extra fields | activities/events of type 200, `company_department` rows | `lib/Companies.php:214-307` |
| tag | the tag and its **direct** children | `candidate_tag` rows; grandchildren tags | `lib/Tags.php:88-107` |
| extra-field definition | `extra_field_settings` row | all `extra_field` values with that name | `lib/ExtraFields.php:134-150` |
| candidate merge (DB-001) | deletes the "new" candidate directly via SQL | its `extra_field`, `history`, questionnaire history | `lib/Candidates.php:1576-1584` |

- **Impact:** Orphans accumulate. Evidence that this already happened in the field: migration 348 is a one-off clean-up of orphaned `saved_list_entry` rows (`modules/install/Schema.php:1245-1261`), and migrations 270/349 recompute drifted `saved_list.number_entries` counters. Orphaned activities and events show in activity lists and calendars with missing names. PII of "deleted" candidates survives in activity notes, calendar text and history (DB-011).
- **Recommendation:** After the InnoDB conversion (DB-003), clean up orphans with one-off SQL per row above, then add FKs:
  - `contact.company_id → company ON DELETE RESTRICT`, `joborder.company_id/contact_id`, `candidate_joborder.(candidate_id, joborder_id) ON DELETE CASCADE`, `candidate_tag.(candidate_id, tag_id) ON DELETE CASCADE`, `saved_list_entry.saved_list_id ON DELETE CASCADE`, `extra_field.extra_field_settings_id` (after DB-015).
  - Polymorphic tables cannot carry FKs. Either split them into per-type link tables (`candidate_activity`, …) or keep a single `data_item` supertable. See §17.

### DB-001 — Candidate merge re-parents polymorphic rows without `data_item_type`, silently moving other entities' activities, attachments, events and list entries
- **Severity:** CRITICAL
- **Finding:** `Candidates::mergeDuplicates()` merges the duplicate ("new") candidate into the surviving ("old") one. It moves child rows with statements that filter only on `data_item_id` and `site_id`. Every `activity`, `attachment`, `calendar_event` and `saved_list_entry` row whose `data_item_id` equals the new candidate's id is re-pointed at the old candidate's id, **whatever its `data_item_type`**. Company/contact/job order rows that share the numeric id stay typed as company/contact/job order but now point at a different company/contact/job order (`id = oldCandidateID`). The merge then deletes the new candidate with no `site_id` predicate.
- **Evidence:**
  ```php
  // lib/Candidates.php:1314-1327  (same shape at 1330-1343 attachment, 1346-1359 calendar_event)
  "UPDATE activity SET data_item_id = %s WHERE data_item_id = %s AND site_id = %s"
  // lib/Candidates.php:1626-1640
  "UPDATE saved_list_entry SET data_item_id = %s WHERE data_item_id = %s AND saved_list_id NOT IN(%s) AND site_id = %s"
  // lib/Candidates.php:1576-1584
  "DELETE FROM candidate WHERE candidate_id = %s"      // no site_id
  ```
  Reached from `modules/candidates/CandidatesUI.php:334-340` (`mergeInfo`, SA level) → `mergeDuplicatesInfo()` (`:3531-3555`), with `oldCandidateID`/`newCandidateID` taken from `$_POST`.
- **Impact:** Silent cross-entity data corruption on a shipped feature. Each entity table has its own `AUTO_INCREMENT` from 1, so in any real database candidate N and company/contact/job order N almost certainly coexist. INFERENCE: one merge re-attaches company N's attachments (e.g. contracts), contact N's activities and job order N's calendar events to different records, with no error and no audit trail. The same method also builds its `UPDATE candidate SET …` by concatenating stored values without escaping (`lib/Candidates.php:1483-1553`, see DB-010), so any merge involving a note or address with an apostrophe fails, or injects SQL.
- **Recommendation:** Immediately add `AND data_item_type = DATA_ITEM_CANDIDATE` to the four statements at `lib/Candidates.php:1315,1331,1347,1627` and `AND site_id = %s` to the delete at `:1579`. Route the final delete through `Candidates::delete()` so the cascades run. Rebuild the `SET` clause with `makeQueryString()`. Add an integration test that merges candidate N while company N exists. To detect past damage, inspect `activity`/`attachment`/`calendar_event` rows whose `date_created` precedes their owning record's `date_created`. Treat that as a heuristic only.

---

## 6. Data types

### DB-014 — Weak data typing
- **Severity:** MEDIUM
- **Finding and evidence:**
  - **Money as free text:** `candidate.desired_pay varchar(64)` / `current_pay varchar(64)` (`db/cats_schema.sql:192-193`); `joborder.rate_max varchar(255)`, `salary varchar(64)`, `duration varchar(64)` (`:805-807`). No currency, no numeric type, so salary ranges cannot be sorted or filtered numerically.
  - **Booleans as `int(1)`** with no CHECK: `is_hot`, `is_active`, `is_admin_hidden`, `can_relocate`, `public`, `all_day`, `left_company`, `default_company` (e.g. `:187,195,809,818`). `company.is_hot` and `contact.is_hot` are **nullable** (`:476,527`) while `candidate.is_hot` is `NOT NULL` (`:187`).
  - **Status as free text:** `joborder.status varchar(64)` (`:808`) holds labels defined in `config.php:297-298` / `lib/JobOrderStatuses.php:14-15`. The `joborder_status` lookup was dropped (`modules/install/Schema.php:1150-1152`). Renaming a status in config orphans existing rows.
  - **Pipeline status as int, duplicated** in the lookup table (`db/cats_schema.sql:267-277`) and in constants (`constants.php:120-130`).
  - **EEO:** `eeo_gender varchar(5)` and `eeo_disability_status varchar(5)` free text (`:190-191`, interpreted as `'m'`/`'f'` in `lib/Candidates.php:526-531`); race and veteran status are ints with no FK.
  - **Phones** `varchar(40)` unnormalised. Search strips `- . ( )` at query time with four nested `REPLACE()` calls (`lib/Search.php:628-641`).
  - **Extra-field values** are `TEXT` for all types. Dates are stored as `MM-DD-YY` strings (`lib/ExtraFields.php:680,870`, date picker format `'MM-DD-YY'`) and swapped in PHP for DMY display (`:751-762`), so they cannot be range-filtered or sorted chronologically.
  - **Zip codes:** `candidate.zip varchar(16)` (`:172`) is joined to `zipcodes.zipcode`, which is `mediumint(9)` in the base schema (`:1179`, which also drops leading zeros, e.g. `00210` → `210`) but `varchar(9)` after the optional component installs (`db/upgrade-zipcodes.sql:3`).
  - **Lat/lng swapped in the shipped data:** the column order is `(zipcode, city, state, areacode, lat, lng)` (`db/upgrade-zipcodes.sql:2-8`) but rows insert longitude first: `(501, 'Holtsville', 'NY', 631, '-072.637078', '+40.922326')` (`db/upgrade-zipcodes.sql:20`). `lib/ZipLookup.php:77` computes `cos(lat/57.29578)` on what is actually longitude, and multiplies by 3958 (Earth radius in **miles**) while aliasing the result `distance_km`.
  - **Serialized/encoded blobs:** `user.column_preferences` (serialized PHP, `lib/Session.php:850` `unserialize`), `settings.value` holding `serialize()` output (`lib/Mailer.php:435`), `extra_field_settings.extra_field_options` as url-encoded CSV (`lib/ExtraFields.php:181-192`), `system.available_version_description` url-encoded (`lib/SystemInfo.php:128`).
  - **Integer width mismatch:** `tag.tag_id` and `candidate_tag.*` are `int(10) unsigned` (`db/cats_schema.sql:328-331,1049-1054`) while `candidate.candidate_id` is `int(11)` signed.
- **Impact:** No numeric compensation reporting. Radius search results are wrong. Date-typed custom fields cannot be filtered by range. Status semantics depend on config files. `unserialize()` of DB content is an object-injection vector for anyone who can write those columns.
- **Recommendation:** In the target model use `numeric(12,2)` + `currency char(3)` + `period` (hour/year) for pay and rate; real `boolean`; a per-site `joborder_status` table referenced by FK; `date` columns for date custom fields (typed EAV, DB-015); E.164-normalised phone columns; `char(5)` zip plus a lat/lng-correct geo table (re-import with columns swapped back and the unit fixed); JSON columns instead of `serialize()`.

---

## 7. Extra fields (EAV)

### DB-015 — Extra-fields EAV keyed by field name, with no uniqueness, a per-field join and weak indexes
- **Severity:** MEDIUM
- **Finding:**
  - Values (`extra_field`) link to definitions (`extra_field_settings`) through the **string** `field_name` plus `site_id` and `data_item_type`. There is no `extra_field_settings_id` column in `extra_field`.
  - Renaming a field runs a bulk `UPDATE extra_field SET field_name = …` (`lib/ExtraFields.php:368-395`).
  - Removing a definition leaves every value row behind (`lib/ExtraFields.php:134-150`).
  - `setValue()` is delete-then-insert with no uniqueness constraint (`:448-500`). Concurrent edits can create duplicate `(data_item, field_name)` rows, and the datagrid join then multiplies result rows.
  - Indexes: `extra_field` has only `assoc_id(data_item_id)` and `IDX_site_id` (`db/cats_schema.sql:663-664`); `extra_field_settings` has none.
  - Each extra field that is shown as a datagrid column adds one `LEFT JOIN extra_field AS extra_fieldN ON <entity>.id = extra_fieldN.data_item_id AND extra_fieldN.field_name = '<name>' AND extra_fieldN.data_item_type = <t>` (`lib/ExtraFields.php:733-737`, used from `lib/Candidates.php:2265-2272`).
- **Evidence:** as cited above.
- **Impact:** List queries cost O(extra-field columns × candidate rows) index lookups on a single-column index that must then filter by name and type. Sorting or filtering on an extra field scans the `TEXT` values. Data integrity depends on names never colliding or changing.
- **Recommendation:**
  - Short term: add `KEY (data_item_type, data_item_id, field_name(64))` and `UNIQUE (site_id, data_item_type, data_item_id, field_name(…))` on `extra_field`; add `UNIQUE (site_id, data_item_type, field_name)` on `extra_field_settings`; make `remove()` also delete the values.
  - Target: replace `field_name` with `extra_field_settings_id` (FK). Either use typed value columns (`value_text`, `value_date`, `value_num`, `value_bool`), or a single JSONB/JSON `custom_fields` column per entity with generated/indexed paths for the few fields that are filtered on.

---

## 8. History / audit

### DB-016 — `history` audit table is incomplete, mutable, session-coupled and excluded from backups
- **Severity:** MEDIUM
- **Finding:**
  - **How it works:** model methods load a row with `get()` before and after an UPDATE, and `History::storeHistoryChanges()` writes one row per changed array key, storing previous and new values as text (`lib/History.php:63-118`). Creates, deletes, pipeline events and activities use `storeHistoryNew/Deleted/Data` (`:127-229`). The acting user always comes from the session (`lib/History.php:49`, `$this->_userID = $_SESSION['CATS']->getUserID();`), so CLI/queue contexts cannot write history without a fake session.
  - **Coverage (FACT, grep of `new History` / `storeHistory`):** only `Candidates`, `Companies`, `Contacts`, `JobOrders`, `Pipelines`, `ActivityEntries` and one call in `modules/settings/SettingsUI.php:2993`. **Not audited:** users (create, password change, access-level change; `lib/Users.php` has no History), attachments (upload, download, delete), saved lists, calendar, settings, EEO data **views**, exports, extra-field definitions, tag changes, and candidate merges (DB-001).
  - `storeHistoryDeleted` records only `(DELETED)`, with no snapshot of the deleted row (`lib/History.php:137-158`).
  - The table is ordinary, mutable MyISAM, and migrations have deleted history rows in bulk (`modules/install/Schema.php:268-271`) or rewritten them (`:1120-1136`).
  - The built-in backup explicitly skips it: `// We do not need history records.` (`modules/install/backupDB.php:129-130`).
  - `data_item_type` and `data_item_id` are interpolated with `%s` without `makeQueryInteger` (`lib/History.php:104-105,149-150`). Callers such as `Companies::delete` pass a raw `$companyID` (`lib/Companies.php:224,230`).
- **Impact:** Incomplete as a compliance audit trail: no access logging of sensitive data, no user-admin trail, no tamper evidence. It also retains PII after deletion (DB-011).
- **Recommendation:** Replace it with an append-only `audit_log` (actor, tenant, entity_type, entity_id, action, `jsonb` diff, request id, ip, timestamp), written in the same transaction as the change, with DB privileges denying UPDATE/DELETE for the app user. Add read-audit events for EEO fields and attachment downloads. Decide retention explicitly (DB-013) and include the log in backups.

---

## 9. Multi-tenancy

### DB-012 — Tenant isolation (`site_id`) is vestigial and inconsistently enforced
- **Severity:** MEDIUM. It would be HIGH for any deployment that actually hosts several tenants in one DB.
- **Finding:**
  - 36/55 tables carry `site_id` with no FK, no composite PKs and no row-level security. Isolation relies on every query adding `site_id = $this->_siteID`.
  - Heuristic scan: 350 of 430 SQL literals in `lib/*.php` mention `site_id`. The remaining 80 are mostly global tables or updates by primary keys obtained from site-filtered reads (manually reviewed; list in the scratchpad notes).
  - The product has **no code path that creates a site**: `grep "INTO site"` finds nothing. The career portal simply uses the lowest non-admin site id (`lib/Site.php:161-181`, `modules/careers/CareersUI.php:79`). Multi-tenancy is a remnant of the hosted CATS product.
  - Confirmed gaps:
    1. **Cross-site duplicate matching:** `Candidates::checkDuplicity()` selects candidates of **all** sites by first and last name (`lib/Candidates.php:1138-1156`, `WHERE candidate.first_name = %s AND candidate.last_name = %s`). The matching ids are then stored as duplicates of the current site's candidate (`CandidatesUI.php:2663,2704`; `lib/Candidates.php:1263-1300`).
    2. **Unscoped deletes on `candidate_duplicates`** (`lib/Candidates.php:425-433,1243-1250,1363-1368,1388-1395`) and the unscoped `DELETE FROM candidate` during merge (`:1579-1583`).
    3. **Hard-coded tenant:** the candidate Tags filter emits `WHERE t2.site_id = 1 AND t2.tag_id IN (…)` (`lib/Candidates.php:2250`). Tag filtering therefore returns nothing on any install whose site id is not 1. That includes installs made from the shipped demo data, whose site is 201 (`db/cats_testdata.bak` → `catsbackup.sql.0`, `INSERT INTO site VALUES ('201','Custom Search, Inc.',…)`).
    4. The tags datagrid sub-select `SELECT … FROM candidate_tag t1 LEFT JOIN tag t2 … WHERE t1.candidate_id = candidate.candidate_id` has no site predicate (`lib/Candidates.php:2231-2236`). This is harmless only because ids are globally unique.
    5. `Calendar::updateEventDisableReminder` updates by event id alone (`lib/Calendar.php:451-462`, called from the reminder job). Low risk.
- **Impact:** For the single-tenant reality, tag filtering is broken on non-1 sites and duplicate detection behaves unexpectedly. For any multi-tenant use, candidate PII leaks through duplicate links, and a site admin can delete another tenant's candidate by posting its id to `mergeInfo`.
- **Recommendation:** Decide explicitly. Either (a) **drop multi-tenancy**: single-tenant schema, `site_id` removed after migration, `site` becomes an `organisation_settings` row; or (b) make it real: composite keys `(site_id, id)`, FKs including `site_id`, PostgreSQL RLS policies (`USING (site_id = current_setting('app.site_id')::int)`), and a query-builder/repository layer that injects the tenant. Either way, fix items 1–3 now: add `AND candidate.site_id = %s` to `checkDuplicity`, add `site_id` to the `candidate_duplicates` statements, and replace the literal `1` with `$this->_siteID`.

---

## 10. Migration strategy

### Mechanism (FACT)
1. **Fresh install:** `installwizard.php` → AJAX `modules/install/ajax/ui.php` `doInstallEmptyDatabase`. This loads `db/cats_schema.sql` by `explode(";\n")` (`ui.php:760-761`); if `history` is missing it also runs `upgrade-0.6.x-0.7.0.sql` (`:771-776`). The installer never creates the database or sets its default charset; it expects a pre-created DB. The demo path (`onLoadDemoData`) unzips `db/cats_testdata.bak` and replays a **CATS 0.5.5** dump (`version` row `'0.5.5'`) split on `((ENDOFQUERY))` (`ui.php:781-843`), then runs `upgradeCats`.
2. **Legacy upgrades (pre-0.9.5):** `upgradeCats` guesses the version from the presence of tables and columns (`ui.php:856-894`), then replays `db/upgrade-0.5.0-0.5.1.sql` … `upgrade-0.9.4-0.9.5.sql` and **always** `upgrade-zipcodes.sql` (`:896-929`).
3. **In-app migrations:** `CATSSchema::get()` returns `revision => SQL-or-'PHP:'code` (`modules/install/Schema.php:31-1333`). `ModuleUtility::_refreshModuleList()` runs whenever a PHP session has no cached module list (`lib/ModuleUtility.php:147-156`), i.e. on the first request of **every new session**. It takes `GET_LOCK('CATSUpdateLock',120)` (`:243`) and, per module, compares `module_schema.version` with `max(array_keys($schema))`. It then `eval()`s `PHP:` entries or `explode(';', …)`s the SQL and runs each statement, and updates `module_schema.version` after each revision (`lib/ModuleUtility.php:443-570`, `eval` at `:542`, `explode` at `:546`). Only the `install` module ships revisions (`modules/install/CATSUI.php:39`); the other 23 modules sit at version 0 (`db/cats_schema.sql:850-873`).
4. The seed schema is stamped `install = 363` (`db/cats_schema.sql:862`), so a fresh install runs exactly one revision on first use: `364` `UPDATE user SET password = md5(password) WHERE can_change_password=1;` (`modules/install/Schema.php:1328-1330`). `test/data/test.sql` is stamped 364 (`test/data/test.sql:1256`).

### DB-006 — Migration mechanism is fragile and incompatible with modern MySQL and PHP
- **Severity:** HIGH
- **Finding:**
  - Migrations are inline strings, **up-only**, with no checksum, no "dirty" flag and no transactional DDL. Errors are not detected (DB-002), so a failing statement is skipped and the revision is still marked applied (`lib/ModuleUtility.php:555-566`).
  - `explode(';')` breaks any statement containing a literal `;`.
  - They run lazily in a web request under a 120 s advisory lock, with `set_time_limit(0)`.
  - Array key `'283'` is defined twice (`modules/install/Schema.php:1026,1029`). PHP keeps the second, so `DROP TABLE IF EXISTS dashboard_module` at 283 never runs; 193 effective revisions were confirmed by loading the array under PHP 8.4.
  - Revisions depend on APIs and syntax that no longer exist:
    - `mysql_real_escape_string` / `mysql_fetch_row` (removed in PHP 7) at `Schema.php:725,854,1236` (revisions 225, 253, 341);
    - `ALTER IGNORE TABLE` (removed in MySQL 5.7.4) — **133 occurrences**;
    - zero-date defaults (`:465,845,1217`) and `TEXT DEFAULT ''` (`:869,1118,1226`), both rejected under MySQL 5.7+/8 defaults;
    - `ALTER TABLE … TYPE = MYISAM` in `db/upgrade-0.6.x-0.7.0.sql:80,84,88` (`TYPE=` removed in MySQL 5.5 / MariaDB 5.5);
    - unquoted `UPDATE system …` (`Schema.php:44,849`); `SYSTEM` is a reserved word in MySQL 8.0.3+ (runtime code in `lib/SystemInfo.php:59-129` does back-quote it).
  - `PHP:` revisions `eval()` arbitrary code and touch the filesystem (e.g. renaming attachment directories, `Schema.php:47-60`; `scripts/150.php`).
  - Revision 364 is non-idempotent: it re-hashes whatever is in `password`. A DB restored with an older `module_schema` would double-hash already-hashed passwords.
- **Impact:** Upgrading an old install on a current MySQL or PHP either fails mid-way or silently skips steps, and leaves the schema in an undefined state (see DB-007). There is no way to reason about which DDL actually ran.
- **Recommendation:**
  - Freeze `CATSSchema` at 364.
  - Generate a **baseline** from a real fresh install (`mysqldump --no-data` after revision 364), reconcile it with the DB-007 drift list, and adopt a migration tool (Doctrine Migrations or Phinx for PHP; Flyway/Liquibase if the stack changes) with numbered, checksummed, reviewed files.
  - Run migrations from a CLI/deploy step, never on session start.
  - Add a pre-migration "detect and normalise" script for known legacy variants (e.g. `joborder.status` width, zipcode shape, missing tag tables).

### DB-007 — Schema drift between `cats_schema.sql`, the migration path and test fixtures
- **Severity:** HIGH
- **Finding:** A fresh install (from `cats_schema.sql`) and an upgraded install (0.5.5 demo or an older production DB taken through `upgrade-*.sql` + `Schema.php`) end up with different schemas. Differences found:

| Object | `db/cats_schema.sql` (fresh) | Upgrade path / `test/data/test.sql` | Evidence |
|---|---|---|---|
| `tag`, `candidate_tag`, `extension_statistics` tables | present (`:1048`, `:327`, `:641`) | **never created** by any upgrade file or `Schema.php` revision (grep = 0) | `grep -c tag modules/install/Schema.php db/upgrade-*.sql` |
| `joborder.status` | `varchar(64)` (`:808`) | `VARCHAR(16)` (revision 286, `Schema.php:1039`); test.sql `varchar(16)` | DDL diff |
| `candidate.web_site` | `varchar(128)` (`:185`) | `varchar(352)` (`db/upgrade-0.9.4-0.9.5.sql:15`) | |
| `attachment.content_type` | `varchar(255)` (`:91`) | test.sql `varchar(64)`; no migration touches it | DDL diff |
| `user.session_cookie` | `varchar(256)` (`:1083`) | `varchar(48)` (`db/upgrade-0.6.x-0.7.0.sql:53`), test.sql 48 | DDL diff |
| datetime defaults | `'1000-01-01 00:00:00'` (≈25 columns) | `'0000-00-00 00:00:00'` in test.sql and revisions 165/250/330 | DDL diff |
| `zipcodes` | `zipcode mediumint(9)`, no `lat/lng` (`:1178-1184`) | `zipcode varchar(9)`, `lat`, `lng` (`db/upgrade-zipcodes.sql:2-9`), which `lib/ZipLookup.php:77` requires | |
| `contact` title index | `IDX_title` | ``` ` IDX_title` ``` (leading space) in DBs created before commit 19f1fcd; the fix was made only to the dump files, with no migration | `git show 19f1fcd -- db/cats_schema.sql` |
| `extension_statistics` collation | table `utf8`, columns plain | test.sql `CHARACTER SET utf8` columns, table `utf8_unicode_ci` | DDL diff |
| lookups | `access_level` rows 0–500 | constants use −100, 350, 450 (`constants.php:74-82`); `securityTests.sql` inserts users at 350/450 with no matching `access_level` row | `test/data/securityTests.sql:5-12` |

- **Impact:** Upgraded installs lack the tag tables, so every tag query fails (silently, DB-002). Radius search works only if the optional zipcode component was installed. Column-width differences mean the same input truncates or fails on one install and not the other. Integration tests (`DatabaseTestCase.php:48` loads `cats_schema.sql`) never exercise the upgrade path, so the drift is invisible to CI.
- **Recommendation:**
  - Produce a canonical baseline (DB-006).
  - Write a one-time "reconcile" migration that adds `tag`/`candidate_tag` if missing, normalises `joborder.status`, `web_site`, `content_type` and `session_cookie` to the chosen widths, renames ``` ` IDX_title` ```, and converts `'0000-00-00'` values to NULL.
  - Regenerate `test/data/test.sql` from the baseline.
  - Add a CI job that installs 0.9.x and upgrades it, then diffs `information_schema` against a fresh install.

---

## 11. Query construction and error handling

### DB-002 — SQL errors are never detected; installer ignores all DDL errors
- **Severity:** HIGH
- **Finding:** `DatabaseConnection::query()` guards against failure with `isset($this->_queryResult->connect_errno)`. `_queryResult` is `false` or a `mysqli_result`, neither of which has that property, so **both** error branches are dead code. On PHP < 8.1, `mysqli_query` returns `false` quietly and callers mostly ignore the return value. Examples: `Candidates::delete` ignores all 7 results, and `Users::changePassword` has `// FIXME: Did the above query succeed? If not, fail.` (`lib/Users.php:708`). On PHP ≥ 8.1 the default `mysqli` report mode is `MYSQLI_REPORT_ERROR|MYSQLI_REPORT_STRICT`. No `mysqli_report()` call exists in the repo, so every SQL error becomes an uncaught `mysqli_sql_exception`, i.e. a fatal error page. `getError()` returns `mysqli_connect_error()`, not the query error (`lib/DatabaseConnection.php:583-588`). The installer's `MySQLQuery()` checks `!$mySQLConnection` instead of the query result (`modules/install/ajax/ui.php:1115-1128`), so **every failed statement in `cats_schema.sql` or the upgrade files is ignored**.
- **Evidence:**
  ```php
  // lib/DatabaseConnection.php:181-198
  $this->_queryResult = mysqli_query($this->_connection, $query);
  if (isset($this->_queryResult->connect_errno)) { … die … }
  if (!$this->_queryResult && isset($this->_queryResult->connect_errno) && !$ignoreErrors) { … die … }
  ```
- **Impact:** Writes can silently fail: truncated or utf8 errors (DB-008), missing tables (DB-007), strict-mode rejections (DB-017). The UI still reports success, with no log. Behaviour changes fundamentally between PHP 8.0 and 8.1+.
- **Recommendation:** Call `mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT)` explicitly in `connect()`. Catch `mysqli_sql_exception` in `query()`, log it (query fingerprint, `mysqli_errno`, `mysqli_error`), and rethrow a domain exception. Fix `getError()` to use `mysqli_error($this->_connection)`. In the installer, check `$queryResult === false` and stop on error.

### DB-010 — SQL is built by string interpolation; no prepared statements; several unescaped paths reach the DB
- **Severity:** HIGH (security exploitation is detailed in the security audit)
- **Finding:** All SQL is built with `sprintf()`. Every value relies on the caller choosing `makeQueryString()` (`"'" . mysqli_real_escape_string(...) . "'"`), `makeQueryInteger()` (`(integer)` cast) or `makeQueryStringOrNULL()` (`lib/DatabaseConnection.php:480-548`). The maintainers flag this themselves: `// FIXME: Security issue, this function is not enough for sanitizing user input.` (`:482`). Escaping is used consistently in the model classes, but these DB-reaching paths bypass it:
  - `DataGrid` builds `ORDER BY sortBy sortDirection` (`lib/DataGrid.php:1330`). `sortBy` is whitelisted (`:430-441`), but `sortDirection` comes from the `parameters…` JSON in `$_GET` (`:383-386`) with **no validation anywhere in `DataGrid.php`** (FACT from `grep -n sortDirection`).
  - Candidate tag filter: `"… t2.tag_id IN (". implode(",",$arguments).")"` (`lib/Candidates.php:2250`).
  - `mergeDuplicates` concatenates **stored** DB values into SQL (second-order): `"phone_home = '" . $rs['phoneHome']."'"`, `"notes = IFNULL(CONCAT(notes, ', ".$rs['notes']."'), …"` (`lib/Candidates.php:1483,1553` and neighbours).
  - Installer: `sprintf('UPDATE settings SET value = "%s" WHERE setting = "fromAddress"', $fromAddress)` (`modules/install/ajax/ui.php:986`), with `$fromAddress` taken from request input (`:242`).
  - `SystemInfo::updateRemoteVersion` / `updateUID` interpolate `'%s'` unescaped (`lib/SystemInfo.php:81,123-128`). Values come from the version-check server.
  - Defence-in-depth gaps: `Companies::delete` interpolates `$companyID` raw (`lib/Companies.php:224,242,257`; the caller validates at `modules/companies/CompaniesUI.php:872`); `SavedLists::addEntryMany/removeEntryMany` `implode` id arrays (`lib/SavedLists.php:406,459`) and rely on caller validation.
- **Impact:** SQL injection by authenticated users (ORDER BY / IN-list), plus data-dependent failures: a candidate note containing `'` breaks the merge. The escaping model cannot be verified by reading one layer.
- **Recommendation:** Add `DatabaseConnection::execute($sql, array $params)` built on `mysqli_prepare`/`bind_param`, or move to PDO with native prepares. Migrate the listed hot spots first. Whitelist `sortDirection` to `ASC|DESC` at `lib/DataGrid.php:423-441`. Intval-map `$arguments` in the tag filter. Replace the merge `SET` builder with parameters.

### Other access-layer facts (supporting DB-023)
- A connection per request singleton, with no persistent connections, port, socket or TLS options (`lib/DatabaseConnection.php:111-113`).
- `set_time_limit(0)` is called before **every** query (`:172-179`), so PHP time limits are effectively disabled for any request that touches the DB.
- Queries starting exactly with `SELECT` are **rewritten** for time zones (`_localizationFilter`, `:648-711`, see DB-020).
- The `CATS_SLAVE` read-only guard only blocks `UPDATE|INSERT|DELETE` (`:635-643`); `REPLACE`, DDL and `LOCK` pass.
- No query logging, slow-query instrumentation or metrics exist in the layer (grep found none).
- `getColumn($query = null, $row, $column)` declares an optional parameter before required ones (`:262`). PHP 8 treats it as required and emits a deprecation.

---

## 12. Data privacy

### DB-011 — PII and EEO special-category data in plaintext, copied widely; no erasure path
- **Severity:** HIGH
- **Finding:**
  - **Candidate PII:** names, home/cell/work phones, full address, two e-mails, web site, current employer, current and desired pay, notes (`db/cats_schema.sql:160-199`), and the **full extracted resume text** (`attachment.text`, `:93`).
  - **Special-category EEO data** (race/ethnicity, veteran status, disability status, gender) sits on the candidate row (`:188-191`). The only protection is the application flag `user.can_see_eeo_info` (`:1098`).
  - The schema has no SSN or date-of-birth column (FACT: none in `cats_schema.sql`). Extra fields (DB-015) can hold anything.
  - **Copies of PII:**
    - `history.previous_value/new_value`: `Candidates::get()` returns EEO text fields (`lib/Candidates.php:522-531`), so EEO changes are recorded in `history` by `storeHistoryChanges` (`lib/Candidates.php:327-333`);
    - `email_history.text` holds the **full body** of every sent e-mail, plus recipients (`lib/Mailer.php:363-392`);
    - `mru.data_item_text` and `saved_search.data_item_text` (names);
    - `career_portal_questionnaire_history` (Q&A text);
    - `activity.notes` and `calendar_event.title/description`;
    - `user_login.ip/user_agent/host`.
  - **Secrets:**
    - `user.password` is MD5 (DB-009);
    - `user.session_cookie` stores the live session id (`lib/Session.php:1010-1022`), so a DB read equals session hijack;
    - SMTP and LDAP bind passwords are plaintext in `config.php` (`config.php:223,273`), written there by the installer (`modules/install/ajax/ui.php:237`);
    - DB credentials are in `config.php:40-43`.
  - **Encryption:** there is no column-level or at-rest encryption, and no DB TLS (§1).
  - **Erasure:** `Candidates::delete` does not remove history, activities, calendar events, e-mail log, questionnaire history, tags or other users' MRU entries (DB-004). No anonymise or export-my-data function exists.
- **Impact:** Right-to-erasure (GDPR Art. 17) and data-subject-access requests cannot be served without hand-written SQL across ≥9 tables. A DB or backup leak exposes EEO data (special-category data under GDPR Art. 9), resume text and live sessions.
- **Recommendation:**
  - Add a `CandidateErasureService` that, in one transaction, deletes or anonymises the candidate across `activity`, `calendar_event`, `attachment` (+ files), `extra_field`, `candidate_tag`, `candidate_joborder*`, `career_portal_questionnaire_history`, `saved_list_entry`, `mru`, `saved_search`, and redacts `history.previous_value/new_value` and the relevant `email_history` rows.
  - Move EEO fields to a separate `candidate_eeo` table with restricted grants and read auditing.
  - Stop persisting session ids (store a hash if needed).
  - Enable InnoDB tablespace encryption or disk encryption, and use TLS to the DB.

### DB-009 — Unsalted MD5 passwords hashed inside SQL; seeded `admin`/`admin` bypasses forced change
- **Severity:** HIGH
- **Finding:**
  - Passwords are `md5()` with no salt, stored in `user.password varchar(128)`: `lib/Users.php:93`, verified with `!==` (not constant-time) at `:679,840`.
  - Password changes send the **plaintext** inside SQL text, `password = md5(%s)` (`lib/Users.php:701,755`). Plaintext therefore reaches the MySQL general/slow log and any SQL error page.
  - The seed inserts `admin` with plaintext password `'admin'` (`db/cats_schema.sql:1108`), later hashed by revision 364. The first-login password-change wizard triggers only when the password equals `DEFAULT_ADMIN_PASSWORD = 'cats'` (`modules/login/LoginUI.php:332`, `constants.php:178`), so a fresh install runs with `admin`/`admin` and is never forced to change it.
  - The installer's "default login" check still looks for plaintext `'cats'` (`modules/install/ajax/ui.php:1048`).
  - `test/data/test.sql:1618` ships hash `21232f297a57a5a743894a0e4a801fc3` (= MD5 `admin`, verified with `md5sum`). `test/data/securityTests.sql:5-12` ships 8 users with hash `f5d1278e…` (= MD5 `tester`).
  - LDAP users are marked by the literal password value `'_LDAPUSER_'` (`lib/Users.php:56,93`).
- **Impact:** MD5 hashes of a leaked DB can be cracked instantly. Default credentials persist on fresh installs.
- **Recommendation:** Widen `user.password` to `varchar(255)`. Use `password_hash(PASSWORD_DEFAULT)` / `password_verify`, and rehash on login. Hash in PHP, never in SQL. Change the seed to a random one-time password, or force a change when `password = md5('admin')`. Store the LDAP flag in its own `auth_source` column.

---

## 13. Data retention and deletion

### DB-013 — No retention policy; hard deletes of pipeline history rewrite historical KPIs
- **Severity:** MEDIUM
- **Finding:**
  - **Hard deletes everywhere:** candidate, company, contact, job order, attachment, pipeline, tag, user (`lib/Users.php:256-268`, "only here for … Testing").
  - **Soft-delete-like flags** exist only for visibility: `candidate.is_admin_hidden`, `joborder.is_admin_hidden` (filtered in `lib/Search.php:467` etc. and `lib/Candidates.php:764`), `candidate.is_active`, `site.account_deleted` (`lib/Site.php:119`). `ACCESS_LEVEL_DELETED -100` is defined (`constants.php:74`) but never used.
  - **No purge job** for `history`, `user_login`, `email_history`, `http_log` or `career_portal_questionnaire_history`: `grep "DELETE FROM (user_login|email_history|history|http_log)"` matches only the historical migration at `Schema.php:269-270`. The only housekeeping is `queue` (`lib/QueueProcessor.php:452`) and the per-user MRU/saved-search trimming.
  - **Retroactive KPI changes:** `Pipelines::remove`, `Candidates::delete` and `JobOrders::delete` all **delete `candidate_joborder_status_history`** (`lib/Pipelines.php:155-167`, `lib/Candidates.php:393-404`, `lib/JobOrders.php:304-315`), and `lib/Statistics.php` builds submission and placement reports from that table (43 references). Removing a candidate from a pipeline silently changes past months' placement counts.
- **Impact:** Unbounded growth of log tables; indefinite retention of PII; reports that are not reproducible.
- **Recommendation:** Define retention per table (e.g. `user_login` 1 year, `email_history` bodies 90 days, `http_log` 30 days) and implement it as a scheduled job. Make pipeline status history **immutable**: soft-delete `candidate_joborder` via `removed_at` and keep history for reporting. Add a `deleted_at` soft delete for candidates, with a scheduled hard erase that runs the DB-011 service.

---

## 14. Seed data

### DB-024 — Seed and fixture hygiene
- **Severity:** LOW (the admin-credential aspect is rated HIGH under DB-009)
- **Finding (FACT):**
  - `cats_schema.sql` seeds two sites: `1 'testdomain.com'` and `180 'CATS_ADMIN'` (`:1017-1018`). It also seeds `user` 1 `admin`/`admin` (access 500) and `user` 1250 `cats@rootadmin` with password `'cantlogin'` (access 0, `:1108-1109`); `settings.fromAddress = 'admin@testdomain.com'` for both sites (`:979-982`); a `user_login` row from 2009 (`:1134`); `mru AUTO_INCREMENT=112`, `user AUTO_INCREMENT=1251`; `system.uid = 2618174` with `disable_version_check = 1` (`:1044`); four `candidate_tag` rows referencing a candidate 1 that does not exist (`:337-340`); and seven `tag` rows (`:1060-1066`).
  - `config.php:31` hard-codes `LICENSE_KEY`.
  - The demo archive `db/cats_testdata.bak` is a zip holding a CATS **0.5.5** dump (51 MyISAM tables including legacy `client`, `dashboard_*`, `version`). It has plaintext users `admin`/`cats` and `john@customsearch.com`/`john99` (site 201), plus two sample files under `attachments/`. The whole upgrade chain must run on it.
  - Backups skip the user row `brian@catsone.com` (`modules/install/backupDB.php:179-183`), an artefact of the original vendor.
- **Impact:** Test data and fixed identifiers ship to production. Orphan tag seed rows. The demo path exercises the most fragile migrations (DB-006).
- **Recommendation:** Split `db/cats_schema.sql` into DDL and a minimal seed that contains only lookups and one site. Generate the admin credential at install time. Rebuild the demo dataset against the current baseline.

---

## 15. Backups

### DB-005 — Built-in DB backup cannot dump data on PHP 7/8 and skips `history`
- **Severity:** HIGH
- **Finding:** `dumpDB()` (used by *Settings → Administration → Backup* via `modules/settings/ajax/backup.php:167-174` and by `scripts/makeBackup.php:127`) calls `mysqli_query($sql, $connection)` with the arguments reversed (`modules/install/backupDB.php:152`). It installs an error handler with five required parameters (`:37`), and that handler `die()`s (`:63`).
  - PHP 8: `mysqli_query()` throws `TypeError: Argument #1 ($mysql) must be of type mysqli, string given` (verified with PHP 8.4 CLI). Any warning raised through the handler throws `ArgumentCountError` (4 passed, 5 expected), also verified.
  - PHP 7.x (INFERENCE from PHP semantics): the reversed call emits a warning and returns `NULL`, so the handler prints "An error has occoured." and dies on the first table with data.
  - Separately, `history` data is never dumped (`:129-130`), and `user_login`/`zipcodes` rows are skipped (`:187-190`).
- **Impact:** Admins who rely on the built-in backup have no data backup. The restore path (`restoreFromBackup`, `ui.php:691-749`) cannot be validated.
- **Recommendation:** Fix the argument order and the handler signature (`$errcontext = null`), or better, retire the PHP dumper and document `mysqldump --single-transaction` (which requires InnoDB, DB-003) plus a copy of `attachments/`. Add a CI test that backs up and restores a fixture DB.

---

## 16. Performance-relevant schema points (brief; see the performance audit)

### DB-021 — Search and performance gaps at the schema level
- **Severity:** MEDIUM
- **Finding:**
  - **No FULLTEXT index anywhere.** `attachment.IDX_text` was created in `db/upgrade-0.5.2-0.5.5.sql:200` and dropped by revision 179 (`modules/install/Schema.php:606-609`). Resume search without the optional Sphinx add-on runs `attachment.text REGEXP '[[:<:]]word[[:>:]]'` (`lib/DatabaseSearch.php:360-363`, used from `lib/Search.php:1938-1943`), which is a full scan of every resume's text on each search. **MySQL 8.0's ICU regex engine does not support `[[:<:]]`/`[[:>:]]`**, so this search errors on MySQL 8 (INFERENCE from the MySQL 8.0 docs; MariaDB's PCRE still accepts it).
  - **Function-wrapped predicates defeat indexes:** name search uses `CONCAT(first_name,' ',last_name) LIKE 'x%'` (`lib/Search.php:462-464`); phone search uses nested `REPLACE()` (`:628-641`); career-portal lookup uses `LCASE(email1) = …` (`modules/careers/CareersUI.php:1707`). DataGrid "contains" filters use `LIKE '%x%'` (`lib/DataGrid.php:1163`).
  - **Unindexed link or filter tables:** `candidate_tag` (none, yet queried per row by a correlated sub-select, `lib/Candidates.php:2231-2236`), `extra_field` (DB-015), `settings`, `email_template`, `queue`, `saved_search`, `company_department`, the `career_portal_questionnaire_*` tables, and `career_portal_questionnaire_history.candidate_id`.
  - **Over-indexing on MyISAM:** `activity` has 11 indexes, several of them redundant prefixes (`IDX_site_id` ⊂ `IDX_site_created`; `IDX_data_item_type` ⊂ `IDX_type_id`); `joborder` has low-selectivity `IDX_is_hot`, `IDX_jopenings`.
  - **Pagination** uses `SQL_CALC_FOUND_ROWS` / `FOUND_ROWS()` (`lib/DataGrid.php:1337`, 10 occurrences), deprecated since MySQL 8.0.17.
  - **Default list sort** on `date_modified` is served by single-column `IDX_date_modified`, while the filter is `site_id` + `is_admin_hidden`. There is no `(site_id, is_admin_hidden, date_modified)` composite.
- **Recommendation:** Use InnoDB FULLTEXT on `attachment.text` (or a `tsvector` + GIN index in PostgreSQL), replacing the REGEXP builder. Add a normalised `phone_digits` generated column with an index, and store lower-cased email (or use a case-insensitive collation, which `_ci` already provides, so drop the `LCASE()`). Add `candidate_tag (candidate_id, tag_id)` UNIQUE plus `(tag_id)`. Replace `SQL_CALC_FOUND_ROWS` with a separate `COUNT(*)` or keyset pagination.

---

## 17. Other findings

### DB-018 — Pipeline table has no unique key; check-then-insert race
- **Severity:** MEDIUM
- **Finding:** `Pipelines::add` runs `SELECT COUNT(...)` and then `INSERT` (`lib/Pipelines.php:60-126`). No `UNIQUE(candidate_id, joborder_id)` exists (`db/cats_schema.sql:240-248`), so a double submit or two recruiters acting at once can create duplicate pipeline rows. `add()` does not verify that the candidate and job order exist or belong to the site; it takes both ids as given. Status is written to `candidate_joborder` and `candidate_joborder_status_history` (keyed by the pair) and to `history` (keyed by `candidate_joborder_id`) in separate non-atomic statements (`:293-360`).
- **Impact:** Duplicate pipelines double-count in reports. Histories can diverge.
- **Recommendation:** De-duplicate, then add `UNIQUE(site_id, candidate_id, joborder_id)` and use `INSERT … ON DUPLICATE KEY` / `ON CONFLICT DO NOTHING`. Key status history by `candidate_joborder_id` with an FK.

### DB-019 — `settings` key/value store problems
- **Severity:** MEDIUM
- **Finding:** `settings` has no unique `(site_id, settings_type, setting)` and no index (`db/cats_schema.sql:968-975`). `MailerSettings::set()` deletes with `WHERE settings.setting = %s AND site_id = %s AND settings_type`. The comparison is missing and the `SETTINGS_MAILER` argument is never consumed (`lib/Mailer.php:478-491`, line 487), so it deletes the same-named setting in **every** non-zero settings category. The follow-up INSERT is not atomic with the delete. `value varchar(255)` stores `serialize()`d status maps (`lib/Mailer.php:435`) that are later `unserialize()`d (`modules/settings/SettingsUI.php:2010,2040`, `modules/joborders/JobOrdersUI.php:1462`), so longer maps truncate.
- **Recommendation:** Add a UNIQUE key and use upserts. Fix the predicate to `AND settings_type = %s`. Store structured values as JSON in a `TEXT`/`JSON` column.

### DB-020 — Time zones handled by rewriting SQL text
- **Severity:** MEDIUM
- **Finding:** Timestamps are written with `NOW()` in the DB server's zone. `site.time_zone` is an `int(5)` hour offset (`db/cats_schema.sql:999`). On read, `_localizationFilter()` string-rewrites every `DATE_FORMAT(` into `DATE_FORMAT(DATE_ADD(…, INTERVAL n HOUR)` and swaps `%m-%d` to `%d-%m` for DMY sites. It does this only for queries whose text **starts** with `SELECT` at offset 0 (`lib/DatabaseConnection.php:648-711`).
- **Impact:** No DST, no half-hour zones, fragile parsing (nested parentheses are skipped). Queries with leading whitespace get no offset at all. Date arithmetic in WHERE clauses (e.g. calendar ranges) is not adjusted.
- **Recommendation:** Store `TIMESTAMP`/`timestamptz` in UTC (`SET time_zone = '+00:00'` on connect). Keep an IANA zone name per user or site, and format in PHP with `DateTimeZone`.

### DB-022 — Dead or vestigial tables; code that queries non-existent tables
- **Severity:** LOW
- **Finding:** Tables with zero references in core PHP: `candidate_jobordrer_status_type` (misspelled), `extension_statistics`, `feedback`, `xml_feed_submits`; `sph_counter` is used only by `optional-updates/latest-sphinx-search`. `lib/Profile.php` queries `profile`, `profile_page`, `profile_page_field`, `profile_title`, none of which exist in any schema file, and nothing instantiates the class (FACT: grep). `optional-updates/latest-sphinx-search/Search.php` references `geoip_*` tables that do not exist. `installtest` is scratch.
- **Recommendation:** Drop the dead tables and `lib/Profile.php` in the baseline migration.

### DB-023 — DB access layer hygiene
- **Severity:** LOW
- **Finding / evidence:** see "Other access-layer facts" in §11: `set_time_limit(0)` per query (`lib/DatabaseConnection.php:178`), `getError()` using connect errors (`:583-588`), no TLS/port (`:111`), partial `CATS_SLAVE` filter (`:635-643`), no instrumentation. Separately, `DataGrid` calls `implode($array, $glue)` with the legacy argument order (`lib/DataGrid.php:1292,1299,1328`). That order was removed in PHP 8.0 (a TypeError, verified on PHP 8.4), so every datagrid query fails before reaching the DB on PHP 8 (cross-reference for the dependency audit).
- **Recommendation:** Fold these fixes into the new `execute()` API (DB-010): structured logging with a query fingerprint, duration and row count; TLS options; a removed global `set_time_limit`.

---

## 18. Target data model and recommendations

The recommendations below map the current tables to a target. The target works for **MySQL 8.0 InnoDB utf8mb4** (least-change) and for **PostgreSQL 15+** (preferred if a rewrite is planned, because of RLS, `jsonb`, `tsvector`, `timestamptz` and transactional DDL).

### 18.1 Order of operations (least risk)
1. **Stabilise before migrating:**
   - fix DB-002 error handling;
   - fix DB-001 merge statements;
   - fix DB-005 backup;
   - whitelist `sortDirection` (DB-010);
   - fix `MailerSettings::set` (DB-019);
   - fix the hard-coded `site_id = 1` (DB-012).
2. **Baseline:** freeze `CATSSchema` at 364. Dump a fresh install as `V001__baseline.sql`. Write `V002__reconcile_legacy.sql` for the DB-007 drift. Adopt Doctrine Migrations or Phinx, run from CLI and CI (DB-006).
3. **Engine and charset:** `V003`: `ENGINE=InnoDB`, `CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci` for all tables. Set `SQL_CHARACTER_SET=utf8mb4`, a pinned `sql_mode` and `time_zone='+00:00'` on connect (DB-003/008/017/020).
4. **Integrity:** orphan clean-up scripts, then FKs and UNIQUE keys (DB-004/015/018/019).
5. **Security and privacy:** `password_hash` (DB-009), EEO split plus erasure service (DB-011), retention jobs (DB-013), append-only audit log (DB-016).
6. **Search:** FULLTEXT or `tsvector` on resume text, generated normalised phone/email columns (DB-021).

### 18.2 Table-by-table target

| Current | Target | Key changes |
|---|---|---|
| `site` | `organisation` (or keep `site`) | Decide single- vs multi-tenant (DB-012). If multi: every tenant table gets `site_id NOT NULL REFERENCES site`, composite unique `(site_id, id)`, PostgreSQL RLS policy. Drop hosted-era counters (`page_views`, `file_size_kb`, `user_licenses`, `is_free`, `limit_warning`). |
| `user`, `access_level`, `user_login` | `app_user`, `role` (or enum), `login_event` | `email` UNIQUE per site, `user_name` UNIQUE; `password_hash varchar(255)`; `auth_source enum('local','ldap')`; drop `session_cookie`; `column_preferences jsonb`; `login_event` with retention. |
| `candidate` | `candidate` + `candidate_eeo` + `candidate_contact_point` | Pay → `numeric` + `currency` + `period`; booleans; `phone_e164` / `email_normalised` generated and indexed; `deleted_at`; EEO moved to a restricted table with FK and audit-on-read. |
| `company`, `company_department`, `contact` | same | FKs: `contact.company_id`, `contact.department_id`, `contact.reports_to` (self, NULL not −1), `company.billing_contact_id` (NULL on delete). |
| `joborder` | `job_order` + `job_order_status` (per site) | `status_id` FK instead of free text; `salary_min/max numeric`, `rate_max numeric`, `duration_months int` or keep a text label; `questionnaire_id` FK. |
| `candidate_joborder`, `candidate_joborder_status`, `candidate_joborder_status_history` | `pipeline`, `pipeline_status`, `pipeline_status_event` | `UNIQUE(candidate_id, job_order_id)`; FKs with `ON DELETE CASCADE` on the pipeline row but **not** on status events (soft-remove the pipeline via `removed_at` to keep KPIs, DB-013); events keyed by `pipeline_id`. |
| `activity`, `attachment`, `calendar_event`, `saved_list_entry`, `extra_field`, `history` (polymorphic) | Option A: per-type nullable FKs (`candidate_id`, `company_id`, `contact_id`, `job_order_id`) + `CHECK (num_nonnulls(...) = 1)`. Option B: a `data_item` supertable (`id`, `type`) that every entity references 1:1, with FKs to `data_item(id)` | Either option makes cascades and orphan detection enforceable and removes the DB-001 class of bugs. `activity.regarding_job_order_id` FK NULL (no −1). |
| `extra_field_settings`, `extra_field` | `custom_field_definition`, `custom_field_value` (typed) **or** `jsonb custom_fields` per entity | FK by definition id, UNIQUE `(definition_id, entity_id)`, typed value columns; GIN index on `jsonb` if used (DB-015). |
| `tag`, `candidate_tag` | same | Signed int or bigint ids consistent with others; FKs; `UNIQUE(candidate_id, tag_id)`; `tag_parent_id` FK with `ON DELETE CASCADE` or a closure table for deep hierarchies. |
| `saved_list`, `saved_search`, `mru` | same | Drop the denormalised `number_entries` (count on read or maintain in a transaction); `mru` keyed by `(entity_type, entity_id)` with cascade, not URL. |
| `settings`, `system`, `module_schema` | `setting (site_id, namespace, key) UNIQUE, value jsonb`; drop `module_schema` in favour of the migration tool's table | Fixes DB-019; removes `serialize()`. |
| `email_template`, `email_history` | same + retention | Store the body for N days, then keep metadata only (DB-013). |
| `career_portal_*` | same, `utf8mb4` | FKs question→questionnaire, answer→question; `questionnaire_response` referencing the candidate FK instead of copied text (or keep the copy deliberately as an immutable snapshot with retention). |
| `attachment.text` | `attachment_text (attachment_id PK/FK, body LONGTEXT/text, tsv tsvector)` | FULLTEXT or GIN; `LONGTEXT` removes the 64 KB truncation. |
| `zipcodes` | `postal_code (country, code char(10), lat numeric(9,6), lng numeric(9,6))` | Re-import with lat/lng in the right columns; compute distance in km or miles correctly (DB-014). |
| `history` | `audit_log` (append-only, `jsonb` diff, actor, request id) | DB-016. |
| Dead tables | drop | DB-022. |

### 18.3 PostgreSQL vs MySQL 8 notes specific to this code base
- The SQL is heavily MySQL-dialect: `DATE_FORMAT`, `IF()`, `IFNULL`, `CONCAT`, `GROUP_CONCAT`, `SQL_CALC_FOUND_ROWS`, `GET_LOCK`, `REGEXP '[[:<:]]'`, backtick quoting, `LIMIT a, b`. Across `lib/`, 350+ SQL literals would need porting (§9 scan counts). **MySQL 8 InnoDB utf8mb4 is the pragmatic first target.** PostgreSQL only makes sense together with a repository/ORM rewrite, which is when RLS (multi-tenant), `jsonb` (custom fields) and `tsvector` (resume search) pay off.
- On MySQL 8, expect these breakages unless fixed first:
  - `REGEXP '[[:<:]]'` (DB-021);
  - `ALTER IGNORE` and zero-date migrations (DB-006) — irrelevant once the baseline replaces them;
  - `SQL_CALC_FOUND_ROWS` deprecation;
  - `utf8` alias deprecation;
  - `ONLY_FULL_GROUP_BY` on `GROUP BY candidate.candidate_id` queries (`lib/Candidates.php:548-549`). UNKNOWN: whether MySQL's functional-dependency detection accepts every such query.

---

## Facts vs Assumptions

**FACT (verified in code or files):**
- 55 tables, all MyISAM, `utf8` charset, 16 with implicit general collation; no FOREIGN KEY; no FULLTEXT in `cats_schema.sql`; 19 tables without `site_id` (awk inventory over `db/cats_schema.sql`).
- `DatabaseConnection::query()` error branches test `->connect_errno` on a query result, and no `mysqli_report()` call exists; the installer's `MySQLQuery()` checks the connection, not the result.
- No prepared statements anywhere in `lib/`, `modules/`, `src/`.
- `mergeDuplicates` UPDATE/DELETE statements lack `data_item_type` and `site_id` as quoted; `checkDuplicity` lacks `site_id`; the tag filter hard-codes `site_id = 1`.
- `backupDB.php:152` argument order and the 5-parameter handler. PHP 8.4 CLI confirmed the TypeError and ArgumentCountError semantics.
- `Schema.php` has a duplicate key `'283'` (193 effective revisions, confirmed by loading under PHP 8.4), 133 `ALTER IGNORE`, and `mysql_*` calls in revisions 225/253/341.
- Drift items in DB-007, from the DDL diff and greps.
- Seeded `admin`/`admin`; forced change only for `'cats'`; `test.sql` admin hash = MD5(`admin`); security-test users = MD5(`tester`).
- The `upgrade-zipcodes.sql` row order puts longitude values into `lat`.
- No code path inserts into `site`.

**ASSUMPTION / INFERENCE:**
- Runtime effects of strict mode, utf8mb3 and 4-byte characters (error 1366 vs truncation) depend on the server's `sql_mode`, which the app does not set (DB-008/017).
- MySQL 8's ICU regex rejects `[[:<:]]` (per MySQL 8.0 documentation; not executed here).
- PHP 7.x behaviour of the backup (warning → handler → die) is inferred from PHP semantics. PHP 8 behaviour was verified.
- DB-001: that id collisions between candidates and other entities are "almost certain" in real data follows from per-table `AUTO_INCREMENT`, not from observed data.
- Managed-service and cluster incompatibility with MyISAM (Aurora, Galera) is based on vendor documentation, not tested.

## Unknowns / Needs Further Investigation
- The actual `sql_mode`, server version (MySQL vs MariaDB) and charset of production installs. Run `SELECT @@version, @@sql_mode, @@character_set_server` on a real deployment.
- How many existing installs were upgraded rather than freshly installed, and therefore lack `tag`/`candidate_tag` (DB-007). Check `SHOW TABLES LIKE 'tag'` on field installs.
- Whether DB-001 corruption has already happened in production data. It needs a data-level heuristic check (activities/attachments whose owning entity was created after the child row, or which reference ids of merged-away candidates found in `history` rows with the merge description).
- Whether MySQL 8 `ONLY_FULL_GROUP_BY` accepts every `GROUP BY <pk>` query in `lib/` with joined columns. This needs execution against MySQL 8.
- The row counts and growth rates of `history`, `email_history`, `user_login`, `activity` and `attachment` in real deployments, to size the retention and the InnoDB conversion windows.
- Whether any third-party module or hook (`Hooks::get('PIPELINES_ADD_SQL')`, `lib/Pipelines.php:94`) injects SQL fragments. The hooks are `eval`'d and were not enumerated here.
- The behaviour of the optional Sphinx search path (`optional-updates/latest-sphinx-search`), which was not audited; it references `geoip_*` tables that do not exist.

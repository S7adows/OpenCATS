# OpenCATS — Performance Assessment
Complete edition · 2026-09-26 · code at d607279 (OpenCATS 0.9.7.4)

## Scope and method

- **Inspected:** the request path (`index.php`, `ajax.php`, `careers/`, `xml/`, `rss/`), `lib/ModuleUtility.php`, `lib/Session.php`, `lib/DatabaseConnection.php`, `lib/DataGrid.php` and the list definitions in `lib/Candidates.php`, `lib/JobOrders.php`, `lib/Companies.php`, `lib/Contacts.php`, `modules/*/dataGrids.php`; `lib/Search.php`, `lib/DatabaseSearch.php`, `lib/Pipelines.php`, `lib/Statistics.php`, `lib/Dashboard.php`, `modules/graphs/GraphsUI.php`, `modules/reports/ReportsUI.php`, `lib/Mailer.php`, `lib/DocumentToText.php`, `lib/Attachments.php`, `modules/import/ImportUI.php`, `lib/QueueProcessor.php`, `QueueCLI.php`, `lib/TemplateUtility.php`, `lib/Template.php`, and the index definitions in `db/cats_schema.sql`.
- **Commands (read-only):** `grep -n`/`grep -c` for query patterns (`SQL_CALC_FOUND_ROWS`, `REGEXP`, `LIKE`, `set_time_limit`, `session_write_close`, `eval(Hooks::get`, cache libraries); `awk` over `db/cats_schema.sql` for indexes per table; `wc -c` on JS assets; `awk` over `docs/baseline/evidence/final-run/nginx.log` for per-request `request_time` (206 requests) and a `python3` summary of the navigation timings in `evidence/final-run/results.json` (94 steps). Phase 0's loop scanner results were re-checked by hand for the rows kept in §8.
- **Runtime evidence used:** `KNOWN_RUNTIME_ERRORS.md` §Performance and RT-01, RT-02, RT-04, RT-08, RT-09, RT-17; `ENVIRONMENT.md` (runtime image, PHP settings); `INSTALLATION.md` (what browsing wrote to the database); `SMOKE_TEST.md` steps; `evidence/final-run/nginx.log`, `results.json`.
- **What the runtime evidence can and cannot show.** The baseline ran on a near-empty database (4 candidates, 1 job order, 2 companies, a few attachments of at most a few KB) with one browser session. **No measurement at realistic data volume or under concurrency exists.** Every volume- or concurrency-dependent statement below is Static or Partial, and its "Unknown" line names the measurement that would settle it. A finding is marked **Partial** when the baseline executed the code path (so the query shape is confirmed to run) but its cost at volume is inferred; **Static** when the path was not exercised.
- **Not done:** no load test, no profiling, no `EXPLAIN`, no database was started. Query counts are static counts from reading code.

## Summary

| ID | Title | Severity | Confirmation |
|---|---|---|---|
| PERF-001 | Resume and keyword search is a REGEXP full scan with no text index | HIGH | Partial |
| PERF-002 | Candidate and quick searches are unbounded, non-sargable, and run one extra query per result | HIGH | Partial |
| PERF-003 | List (DataGrid) queries materialise the whole filtered set: `SQL_CALC_FOUND_ROWS`, fan-out joins, correlated subqueries, client-set page size | HIGH | Partial |
| PERF-004 | Blocking external work in requests with no timeout; `set_time_limit(0)` before every query | HIGH | Partial |
| PERF-005 | E-mail is sent synchronously inside the request, one SMTP session per recipient | MEDIUM | Runtime |
| PERF-006 | Every new session rescans all modules and checks migrations under a global lock | MEDIUM | Runtime |
| PERF-007 | Read-only page views perform database writes | MEDIUM | Runtime |
| PERF-008 | Large serialized session, file lock held for the whole request | MEDIUM | Static |
| PERF-009 | MyISAM table locks: long reads block writers | HIGH | Static |
| PERF-010 | Index gaps and non-sargable predicates on frequent queries | MEDIUM | Static |
| PERF-011 | Pipeline AJAX refetches and sorts the whole pipeline in PHP on each click | MEDIUM | Partial |
| PERF-012 | Reports and dashboard aggregates are recomputed on every view (54 COUNT queries per Reports tab) | MEDIUM | Partial |
| PERF-013 | Graph images are rendered per request with client-set size and no caching; five graph actions need no login | MEDIUM | Runtime |
| PERF-014 | Mass import and attachment reindex run inline; resume text kept in the session | MEDIUM | Static |
| PERF-015 | No application cache; public careers and XML pages load all public jobs on every hit | MEDIUM | Static |
| PERF-016 | `memory_limit` forced down to 64M; fully buffered results and exports | MEDIUM | Static |
| PERF-017 | The queue exists but nothing uses it for heavy work | MEDIUM | Static |
| PERF-018 | Horizontal-scaling blockers: local files, file sessions, one database, self-requests | HIGH | Runtime |
| PERF-019 | Front end: unbundled, mostly unminified scripts in `<head>`, CSS `@import` | LOW | Static |
| PERF-020 | CPU overheads: `eval`'d hooks and cell renderers, SQL rewriting, whole-page regex | LOW | Static |
| PERF-021 | Job-order PDF report fetches its own graph over HTTP | MEDIUM | Runtime |
| PERF-022 | Shipped PHP runtime has no opcode cache | LOW | Runtime |
| PERF-023 | No performance instrumentation and no load baseline | LOW | Static |

23 findings — 0 CRITICAL / 6 HIGH / 13 MEDIUM / 4 LOW · Runtime 7 / Static 10 / Partial 6 / Unverified 0 (no withdrawn or merged stubs).

---

## 1. Search and list queries

### PERF-001 — Resume and keyword search is a REGEXP full scan with no text index
*Confirmation: **Partial** · Phase 0 severity: unchanged · Related: DB-021, DB-028, PERF-009*

- **Confirmed fact:** With Sphinx off (default, `config.php:97`), "search by resume" turns each word into `attachment.text REGEXP '[[:<:]]word[[:>:]]'` and each wildcard into `LIKE '%word%'`. No code uses `MATCH … AGAINST`, and the schema has no FULLTEXT index. The page query also selects the whole `attachment.text` of each hit so PHP can build an excerpt, and a separate `COUNT(*)` query repeats the same predicate. The same REGEXP builder serves key-skills, city, company key-technology and job-title search.
- **Evidence:**
  - `lib/DatabaseSearch.php:359-373` (REGEXP and LIKE forms); `lib/Search.php:1939` (builder on `attachment.text`), `:1980-2024` (page query; `attachment.text AS text` at `:1987`; `LIMIT %s, %s` at `:2024`); excerpt built per row in `modules/candidates/CandidatesUI.php:2080`.
  - `db/cats_schema.sql:83-106` — `attachment` indexes are `(data_item_type, data_item_id)`, `data_item_id`, `md5_sum`, and two on `(site_id, file_size_kb…)`; `text` is `TEXT`.
  - Other users of the builder: `lib/Search.php:491`, `:667`, `:670`, `:796`, `:876`.
  - Sphinx path, when enabled: at most 1000 matches (`lib/Search.php:1877`) and `sleep(1)` retries inside the request (`:1897`).
  - **Runtime (functional only):** resume search found the TXT and DOCX fixtures and the negative control found nothing (#42, #44, #45); the request took 27 ms on three tiny attachments (`nginx.log`). This proves the REGEXP form runs on MariaDB 10.7.8, not its cost.
- **Impact:** Each search reads and regex-matches the text of every resume of the site, twice, and transfers full resume text for each hit. Cost grows linearly with the number and size of resumes. Under MyISAM the scan holds a read lock on `attachment` that delays uploads (PERF-009). Portability of the `[[:<:]]` syntax to MySQL 8 is unknown (DB-021).
- **Severity:** HIGH — the core recruiter search degrades with data volume and has no index to fall back on.
- **Recommendation:** Back keyword and resume search with a text index, stop returning full text for excerpts, and count matches with the same indexed predicate.
- **Unknown / needs further validation:** Latency at realistic volume. Needs a timed resume search (single and multi-word, with and without wildcards) on a copy with production-scale attachment text (for example tens of thousands of resumes), plus a check of lock waits on `attachment` while uploads run.

### PERF-002 — Candidate and quick searches are unbounded, non-sargable, and run one extra query per result
*Confirmation: **Partial** · Phase 0 severity: unchanged · Related: PERF-016, DB-021*

- **Confirmed fact:** `SearchCandidates::all/byFullName/byKeySkills/byEmail/byPhone/byCity` and `QuickSearch::candidates/companies/contacts/jobOrders` have no `LIMIT`; paging happens in PHP after all rows are fetched. Name predicates wrap columns in `CONCAT()`; phone predicates wrap them in three nested `REPLACE()` calls; both defeat indexes. For each result row, the candidate search UI calls `Candidates::getResumes()`, one extra query that also selects `attachment.text`. Quick search runs four such unbounded queries per submit, and `*` is translated to `%`, so it matches everything.
- **Evidence:**
  - `lib/Search.php:385-720` (no `LIMIT`; the only `LIMIT`s in the file are at `:1079`, `:1817`, `:2024`); `:462-464` (`CONCAT(...) LIKE`); `:628-641` (nested `REPLACE`); `:1329-1396` (quick search candidates, 7 OR'ed predicates at `:1356-1377`).
  - `modules/home/HomeUI.php:204-208` (four quick-search queries).
  - N+1: `modules/candidates/CandidatesUI.php:2000`, `:2031`, `:2130`, `:2161` (`getResumes()` inside `foreach`); `lib/Candidates.php:848-872` (selects `attachment.text AS text`).
  - **Runtime (functional only):** quick search (#38), name, key-skills and city search (#39–#41), and job-order, company and contact search (#46–#48) all worked; quick search took 23 ms with 4 candidates (`nginx.log`).
- **Impact:** A broad term (one letter, `*`, a common surname) returns every matching row to PHP and then runs one query per row that can transfer up to 64 KB of text each, inside a 64 MB memory limit (PERF-016). The likely symptom at volume is a slow or blank page (memory exhaustion); that is an inference.
- **Severity:** HIGH — cost and memory are unbounded on the most used search paths.
- **Recommendation:** Page in SQL, fetch attachment presence for all rows in one query without the text column, and search against stored normalised name and phone values that can be indexed.
- **Unknown / needs further validation:** Query count, rows returned and peak memory for broad terms at volume. Needs timed searches for `a`, `*` and a common surname on a copy with a realistic candidate count, with `memory_get_peak_usage()` logged.

### PERF-003 — List (DataGrid) queries materialise the whole filtered set: `SQL_CALC_FOUND_ROWS`, fan-out joins, correlated subqueries, client-set page size
*Confirmation: **Partial** · Phase 0 severity: unchanged · Related: PERF-009, PERF-010, DB-015, DB-023*

- **Confirmed fact:** The main lists use `SELECT SQL_CALC_FOUND_ROWS … GROUP BY <primary key> ORDER BY … LIMIT` followed by `SELECT FOUND_ROWS()`. `SQL_CALC_FOUND_ROWS` makes the server build the full filtered and grouped result before applying `LIMIT`. The candidate list's default "Attachments" column adds three one-to-many `LEFT JOIN`s, and `saved_list_entry` is joined on every candidate list view even outside list mode; rows multiply and are collapsed by `GROUP BY`. Default job-order columns "Submitted" and "Pipeline" are correlated `COUNT(*)` subqueries. `candidate.key_skills` (TEXT) is a default column. Filters produce `LIKE '%…%'`, `HAVING` on computed strings and `CONCAT` predicates. Each visible extra field adds one more `LEFT JOIN`. Page size comes from a client-supplied parameter with no upper bound, and `-1` removes `LIMIT`. When the requested page is out of range — including every empty result — the whole query runs a second time.
- **Evidence:**
  - `SQL_CALC_FOUND_ROWS` in 8 queries: `lib/Candidates.php:2320`, `lib/JobOrders.php:1251`, `lib/Companies.php:948`, `lib/Contacts.php:1010`, `modules/activity/dataGrids.php:158`, `modules/lists/dataGrids.php:138`, `modules/home/dataGrids.php:131`, `:284`; `FOUND_ROWS()` at `lib/DataGrid.php:1337`.
  - Fan-out joins: `lib/Candidates.php:1972-1981` (attachment, submitted pipelines, duplicates), `:2313` (`saved_list_entry`), `GROUP BY` at `:2335`; default columns `modules/candidates/dataGrids.php:21-30`.
  - Correlated subqueries: `lib/Candidates.php:2074`, `:2110`, `:2231-2236`; `lib/JobOrders.php:982`, `:999`, `:1018`, `:1037`, `:1054` (defaults at `modules/joborders/dataGrids.php:63-64`); `lib/Companies.php:786`.
  - Filters: `lib/DataGrid.php:1163`, `:1168` (`LIKE '%…%'`); `:1315-1318` (alpha filter `HAVING ORD(UPPER(…))`); extra fields `lib/ExtraFields.php:733-737`.
  - Page size: parameters from `$_GET` (`lib/DataGrid.php:382-385`) or `$_REQUEST['p']` (`:293-303`); `maxResults` only cast to int (`:460`); `-1` drops `LIMIT` (`:1300-1312`); re-query on out-of-range page (`:536-556`); export runs the query again with all columns (`:1381-1396`).
  - **Runtime (functional only):** candidate, job-order, company and contact lists rendered in 27–32 ms with a handful of rows (#09, #13, #17, #21, #25; `nginx.log`).
- **Impact:** Each list view costs in proportion to all matching rows of the site times the join fan-out, not to the 15 rows shown. Correlated subqueries may run for every matching row, depending on the optimizer (inference). A client can request an unlimited page. `SQL_CALC_FOUND_ROWS` is deprecated in MySQL 8.0.17+.
- **Severity:** HIGH — the most frequent page type scales with total data, and page size is client-controlled.
- **Recommendation:** Bound page size on the server, count with a cheap separate query, compute per-row flags only for the rows on the page, join list membership only in list mode, and skip the repeat query for empty results.
- **Unknown / needs further validation:** Latency, rows examined and temporary-table use at volume. Needs timed list views (default sort, a deep page, a "contains" filter, an extra-field column) with the slow-query log and `Created_tmp_disk_tables` on a copy with a realistic candidate count.

### PERF-010 — Index gaps and non-sargable predicates on frequent queries
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-021, PERF-003, PERF-012*

- **Confirmed fact:** Cross-check of frequent predicates against `db/cats_schema.sql`:

| Query (code) | Predicate / order | Index available | Verdict |
|---|---|---|---|
| Candidate list default (`lib/Candidates.php:2320-2345`; default sort `dateModifiedSort`, `modules/candidates/dataGrids.php:21`) | `site_id = ? AND is_admin_hidden = 0 … ORDER BY date_modified DESC` | `(site_id, first_name, last_name, date_modified)`, `(date_modified)` | no `(site_id, date_modified)`: sort of the whole site |
| Tags column and filter (`lib/Candidates.php:2231-2250`), candidate page tags (`lib/Tags.php`) | `candidate_tag.candidate_id = ?`, `tag_id IN (…)` | primary key only | full scan of `candidate_tag` per candidate row |
| Pipeline (`lib/Pipelines.php:537-640`) | `joborder_id = ? AND site_id = ?`; last-activity subquery ordered by `date_created` | `IDX_site_joborder`; `activity (data_item_type, data_item_id)` | acceptable; sort per row; attachment join lacks type (DB-025) |
| Activity list (`modules/activity/dataGrids.php:155-270`) | `data_item_type = ? AND site_id = ? AND date_created >= …` | `(site_id, data_item_type, date_created, …)` | indexed; `UNION` and "All" period read the whole history |
| Statistics counts (`lib/Statistics.php:957-1054`) | `DATE(col) = CURDATE()`, `YEARWEEK(col)`, `EXTRACT(YEAR_MONTH FROM col)`, `YEAR(col)` | `(date_created)` alone on the entity tables | functions on the column: no range use |
| Calendar month (`lib/Calendar.php:85-146`) | `DATE_FORMAT(date,'%c') = ? AND DATE_FORMAT(date,'%Y') = ?` | `(site_id, date)` | non-sargable; the code says so (`// FIXME: Rewrite this query to use date ranges`, `:85-86`) |
| Upcoming events (`lib/Calendar.php:696`, `:746-748`) | `TO_DAYS(NOW()) = TO_DAYS(date)`, `DATE(date) > CURDATE()` | `(site_id, date)` | non-sargable; runs on every Home view |
| Reminders (every minute, `modules/calendar/tasks/Reminders.php:47`; `lib/Calendar.php:243`) | `reminder_enabled = 1 AND DATE_ADD(NOW(), …) >= date` | none on `reminder_enabled` | full scan of all sites' events each minute (when the queue runs) |
| Queue polling (`lib/QueueProcessor.php:166-198`) | `locked = 0 AND error = 0 AND ISNULL(date_completed) ORDER BY priority` | none | small table today |
| Saved searches (`lib/Search.php:1749-1840`) | `site_id, user_id, data_item_type` | none | small per user |
| Import de-duplication (`modules/import/ImportUI.php:1711-1719`) | `(email1 = ? OR email2 = ?) AND site_id = ?` | `(site_id, email1(8), email2(8))` | site prefix only for the `OR` |
| Single-session check (`lib/Users.php:278-333`, when `ENABLE_SINGLE_SESSION`) | `LEFT JOIN user_login … GROUP BY user_id` with `MAX(IF(…))` | `user_login (user_id)` | grows with a user's login history, never purged |

- **Evidence:** as in the table; 29 tables have no secondary index (`awk` count over the schema), including `candidate_tag`, `saved_search`, `queue`, `settings`, `module_schema`, `http_log` and all `career_portal_*` tables.
- **Impact:** Scans that grow with site data on list, tag, dashboard, report and calendar views, and a scan of all events every minute when the reminder task runs.
- **Severity:** MEDIUM — notable cost that grows with data; each item is fixable in isolation.
- **Recommendation:** Add indexes that match the frequent filters and sorts (tags by candidate and by tag, site plus date on entity tables, reminders, queue, saved searches) and rewrite date conditions as ranges on the raw column.
- **Unknown / needs further validation:** Which of these queries actually dominate. Needs `EXPLAIN` and the slow-query log on a production-size copy.

### PERF-011 — Pipeline AJAX refetches and sorts the whole pipeline in PHP on each click
*Confirmation: **Partial** · Phase 0 severity: unchanged · Related: PERF-007, PERF-010, DB-025*

- **Confirmed fact:** The job-order pipeline table is paged and sorted in PHP. Each "next page" or "sort" AJAX call writes the user's page-size preference, re-runs `getJobOrderPipeline()` for the whole pipeline (no `LIMIT`, two correlated subqueries per row, an attachment join that fans out, `GROUP BY`), sorts it with `array_multisort` and slices it. "All entries" is offered as `99999`. Bulk "add to pipeline" runs a check, an insert, a history write and an activity write per candidate.
- **Evidence:** `ajax/getPipelineJobOrder.php:59` (preference write), `:66` (full fetch), `:126`, `:130` (`array_multisort`); `lib/Pipelines.php:537-640` (query; subqueries at `:562-603`; join at `:618-619`; `GROUP BY` at `:630`); `modules/joborders/Show.tpl:379` (`99999`); bulk add `modules/candidates/CandidatesUI.php:1616-1645` → `lib/Pipelines.php:60-137`. **Runtime (functional only):** the job-order page with its one-row pipeline loaded in 27–30 ms (#20, `nginx.log`).
- **Impact:** For large pipelines, every click costs work proportional to the whole pipeline plus one write, while holding the user's session lock (PERF-008).
- **Severity:** MEDIUM — limited to job orders with large pipelines.
- **Recommendation:** Sort and page in SQL, compute per-row extras only for the page, and write the preference only when it changes.
- **Unknown / needs further validation:** Pipeline sizes in real use. Needs pipeline row counts per job order and a timed paging test on the largest one.

---

## 2. Per-request overhead

### PERF-006 — Every new session rescans all modules and checks migrations under a global lock
*Confirmation: **Runtime** · Phase 0 severity: HIGH → now MEDIUM (runtime shows a modest cost, about 40–50 ms per new session on the baseline host; the lock contention that justified HIGH is not measured) · Related: RT-01, RT-02, DB-006, PERF-018*

- **Confirmed fact:** The module list is cached per PHP session (`$_SESSION['modules']`), not per server. Any request without a usable session — first visit, first request after logout, cookieless careers and XML-feed clients and crawlers (the RSS entry point currently fails before this point, RT-05), each `QueueCLI.php` run — rebuilds it: it reads the modules directory, `include_once`s every `*UI.php` file (23 modules, 21,316 lines) and instantiates each class, runs one `module_schema` query per module (and any pending migrations), all under `GET_LOCK('CATSUpdateLock', 120)`. Including `modules/tests/TestsUI.php` also pulls the SimpleTest framework and runs its file-level `set_time_limit(300)` and `error_reporting(E_ALL)`. The file cache (`CACHE_MODULES`) is off by default and its write path uses an undefined variable (`$modulesCache`), a fatal error on PHP 8.
- **Evidence:**
  - `lib/ModuleUtility.php:147-156` (per-session cache), `:221-237` (directory scan), `:243` (lock), `:262-282` (include, instantiate, `processModuleSchema`), `:288` (release), `:305-309` (broken cache write); `config.php:256` (`CACHE_MODULES false`); `modules/tests/TestsUI.php:28-46`.
  - `wc -l modules/*/*UI.php` → 21,316 lines in 23 files.
  - **Runtime (mechanism):** the RT-01 stack trace shows the migration runner inside an ordinary login-page request (`index.php(215) → loadModule('login') → getModules() → _refreshModuleList() → processModuleSchema('install', …)`); RT-02 shows 23 `module_schema` reads (one per module) on a first request.
  - **Runtime (cost):** the two slowest requests of the final run are the two new-session requests: the first `GET /index.php` (73 ms) and `GET /index.php?m=login` after logout (68 ms), against 15–18 ms for the same login page within a session and a 25 ms median for all 206 requests (`nginx.log`); browser TTFB 74 ms (#01) and 69 ms (#94) against a 28 ms median (`results.json`). Attributing the ~45 ms difference to the module scan is an inference from the code path; no profiler was run.
- **Impact:** Every cookieless request pays the full bootstrap and creates a session file. Concurrent cookieless requests serialise on one database lock, across all web nodes. A failing migration takes down every page (RT-01, DB-006).
- **Severity:** MEDIUM — measurable but modest per-request cost; the serialisation risk under crawler or feed traffic is real but unmeasured.
- **Recommendation:** Build the module registry once per deployment, remove migrations and the global lock from the request path, and exclude the test module from production scanning.
- **Unknown / needs further validation:** Behaviour under concurrent cookieless traffic. Needs a load test of `/careers/` and `/xml/` without cookies (for example 20 requests per second) while measuring lock waits and FPM queue length.

### PERF-007 — Read-only page views perform database writes
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: PERF-009, DB-014*

- **Confirmed fact:** Every logged-in page view runs a force-logout `SELECT` and two writes: `UPDATE user_login SET date_refreshed = NOW()` and `UPDATE site SET page_views = page_views + 1` (one hot row per site). Every detail view adds an MRU chain (DELETE, INSERT, COUNT, then SELECT + DELETE per excess row). Every search adds a similar chain on `saved_search`. Every pipeline AJAX call writes the page-size preference. The first view of each list per session writes `user.column_preferences`, and does so every session, because saved preferences are never restored: `lib/Session.php:850` assigns the unserialized value to `$this->_` instead of `$this->_dataGridColumnPreferences`.
- **Evidence:** `index.php:141-145` (`// FIXME: This is slow!`), `:207`, `:271` (`logPageView`); `lib/Session.php:618-631` → `lib/Users.php:1014-1044` (`// FIXME: Don't hit "site" on each request`); `lib/MRU.php:62-106`, `:201-262`; `lib/Search.php:1712-1840`; `ajax/getPipelineJobOrder.php:59` → `lib/Session.php:1078-1096`; `lib/DataGrid.php:919-923` → `lib/Session.php:1200-1218`; `lib/Session.php:850`, `:1251-1254`. **Runtime:** `INSTALLATION.md` §1 — comparing two independently built baseline databases, the only differences were "login-history rows, saved grid-column preferences and the `site.page_views` counter — all written by browsing"; `SMOKE_TEST.md` §3 — the post-install snapshot already held user_login rows and saved column preferences from two exploratory logins.
- **Impact:** At least two writes per page and four to six on detail views. On MyISAM each write takes a table lock (PERF-009), so all users' page views serialise on `site` and `user_login`. Users also lose saved list layouts between sessions (functional defect).
- **Severity:** MEDIUM — constant write load that turns into lock contention with more users.
- **Recommendation:** Stop writing on read-only views (or throttle the activity update), move the page counter off the site row, write preferences only on change, and fix the preference-restore assignment.
- **Unknown / needs further validation:** Lock waits caused by these writes under concurrent use. Needs `Table_locks_waited` sampling during a multi-user load test.

### PERF-008 — Large serialized session, file lock held for the whole request
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: PERF-004, PERF-014, PERF-018*

- **Confirmed fact:** Each request unserializes and re-serializes the whole session: the `CATSSession` object (about 45 properties including MRU, list preferences and stored data), the module and hook arrays, and during mass import `$_SESSION['CATS_PARSE_TEMP']` with the full text of every uploaded resume. `storeData()` grows without limit and de-duplicates by comparing every stored blob. Sessions use PHP's default file handler, which locks the session file for the whole request; `session_write_close()` is called only before redirects.
- **Evidence:** `lib/Session.php:42-87` (properties), `:1116-1131` (`storeData`); `modules/import/ImportUI.php:1410`, `:1421`; `grep -rn session_write_close` → only `lib/CATSUtility.php:273`; sessions started at `index.php:75`, `lib/AJAXInterface.php:207`, `QueueCLI.php:56`. Parallel same-user requests exist by design: the job-order page loads the pipeline by AJAX and a graph image (`modules/joborders/Show.tpl:414`, `modules/joborders/JobOrdersUI.php:478`), the Home page loads a graph image (`modules/home/Home.tpl:66`). Attachment downloads stream the file while holding the session (`modules/attachments/AttachmentsUI.php:136-138`).
- **Impact:** A user's parallel requests run one after another: the graph and pipeline wait for the page, and other tabs wait behind a long search, download, import or mass mail. Session size, and its per-request cost, grows during imports.
- **Severity:** MEDIUM — user-visible serialisation that grows with slow operations.
- **Recommendation:** Release the session as soon as a request no longer needs to write it, and keep bulky data (import text, stored blobs) out of the session.
- **Unknown / needs further validation:** Real session sizes and wait times. Needs `strlen(session_encode())` and request start/end times logged on a production-like workload.

### PERF-020 — CPU overheads: `eval`'d hooks and cell renderers, SQL rewriting, whole-page regex
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: PERF-022*

- **Confirmed fact:** `Hooks::get()` returns code strings that are `eval`'d at 271 call sites, including once per tab in `printTabs()`. The DataGrid `eval`s a render string for every displayed cell and every exported cell. `DatabaseConnection::_localizationFilter()` scans every `SELECT` string to rewrite `DATE_FORMAT(`. The finished page is run through `preg_replace('/^\s+/m', '', …)` before output (also in `ajax.php`). Each module class is constructed twice per request.
- **Evidence:** `grep -rn "eval(Hooks::get"` → 271; `lib/TemplateUtility.php:616`; `lib/DataGrid.php:1530`, `:1912` (`pagerRender`), `:1441` (`exportRender`); `lib/DatabaseConnection.php:648-711`; `lib/Template.php:120`; `ajax.php:122`; `lib/ModuleUtility.php:78`, `:129`.
- **Impact:** Small fixed CPU cost per request (single-digit milliseconds, inference) that grows with rows × columns in lists and exports; `eval`'d code cannot be cached by an opcode cache.
- **Severity:** LOW — minor at current page sizes.
- **Recommendation:** Replace `eval`'d strings with callables, and remove the whole-page regex and SQL text rewriting.
- **Unknown / needs further validation:** Actual share of CPU time. Needs a sampling profiler on list and export requests.

### PERF-022 — Shipped PHP runtime has no opcode cache
*Confirmation: **Runtime** · New in this edition · Related: PERF-006, PERF-020*

- **Confirmed fact:** Both compose files use `opencats/php-base:7.2-fpm-alpine`. In the baseline that image loaded no opcode cache: the recorded module list has no `Zend OPcache` (`ENVIRONMENT.md` §2). The repository configures none (`grep -rn opcache docker/ config.php .github/workflows/ci.yml` → nothing). Every request therefore compiles every included PHP file from source; large files are included on most requests (`lib/Candidates.php` 2,473 lines, `lib/DataGrid.php` 2,649, `lib/TemplateUtility.php` 1,245).
- **Evidence:** `docker/docker-compose.yml:14`, `docker/docker-compose-test.yml:14`; `ENVIRONMENT.md` §2 "PHP modules loaded".
- **Impact:** All baseline timings (median 25 ms per request) include compile time, so they overstate steady-state cost with a cache and understate how much the bootstrap work (PERF-006) weighs without one. Deployments copied from the repository's Docker setup run without a cache.
- **Severity:** LOW — a deployment default, cheap to change, with a modest effect at current request times.
- **Recommendation:** Document an opcode cache as a runtime requirement and enable it in the shipped container configuration.
- **Unknown / needs further validation:** The gain on this code base. Needs the same page timings repeated with the cache enabled.

---

## 3. Reports, dashboard and graphs

### PERF-012 — Reports and dashboard aggregates are recomputed on every view (54 COUNT queries per Reports tab)
*Confirmation: **Partial** · Phase 0 severity: unchanged · Related: PERF-010, PERF-013, DB-013*

- **Confirmed fact:** The Reports tab runs 6 entity types × 9 periods = 54 separate `COUNT` queries per view, each with non-sargable date functions. The Home page's "Hiring Overview" graph aggregates the site's whole `candidate_joborder_status_history` by a computed period and applies `LIMIT 20` only after grouping. The submission and placement reports run one query per job order; the code's own comment says so.
- **Evidence:** `modules/reports/ReportsUI.php:99-162` (54 `$statistics->get…Count(...)` calls); `lib/Statistics.php:957-1054` (period criteria); `lib/Dashboard.php:155-167` (`GROUP BY unixdate ORDER BY unixdate DESC LIMIT 20`); `modules/reports/ReportsUI.php:255`, `:335` (`/* Querys inside loops are bad, but I don't think there is any avoiding this. */`). **Runtime (functional only):** the Reports tab took 26 ms and the submission and placement reports 17 ms each on the empty data set (#49–#51, `nginx.log`).
- **Impact:** Report and dashboard cost grows with history and is paid again on every view; long reads also block pipeline writes on MyISAM (PERF-009).
- **Severity:** MEDIUM — cost grows with history; no correctness impact.
- **Recommendation:** Compute the period counts in a few range-bounded queries, bound the dashboard aggregate by date, and reuse results for a short period.
- **Unknown / needs further validation:** Latency with years of history. Needs timed Reports and Home views on a copy with a realistic status-history table.

### PERF-013 — Graph images are rendered per request with client-set size and no caching; five graph actions need no login
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: PERF-008, PERF-021, SEC-010, API-014*

- **Confirmed fact:** Graphs are PNG/JPEG images drawn with Artichow/GD by `index.php?m=graphs`. Each is a full application request: session, force-logout query, module load, statistics query, image rendering. The graph module turns off module-level authentication; the statistics graphs (`miniPlacementStatistics`, `miniJobOrderPipeline`, `activity`, `new*`) check the login themselves, while `testGraph`, `wordVerify`, `jobOrderReportGraph`, `generic` and `genericPie` draw from query-string data with no login — the PDF report's self-request depends on that (PERF-021). Width and height come from `$_GET` for every action and are limited only by `< 2000` and `< 1200` comparisons. The global `Expires: 1997` header prevents browser caching.
- **Evidence:** `modules/graphs/GraphsUI.php:48` (module-level authentication off), `:53-64` (size from `$_GET`), `:80-98` (public actions), `:101-130` (login check for statistics graphs), `:357-400` (`generic`, `genericPie`); embedded on Home (`modules/home/Home.tpl:66`) and job-order pages (`modules/joborders/JobOrdersUI.php:478`); `index.php:78-79` (headers). **Runtime:** the 10 graph requests of the final run averaged 44 ms against 25 ms for the other 196 requests, and four of the ten slowest requests were graphs (37–60 ms; `nginx.log`); graphs rendered on the dashboard and job-order pages (#06, #20, #55, #90).
- **Impact:** Every Home and job-order view costs at least one extra full request whose rendering is about twice as expensive as a normal page even with no data. Anyone can request large renders from the public actions: a 1999 × 1199 true-colour canvas is about 9.6 MB of pixel memory (inference) against the 64 MB limit, with no rate limit (API-014).
- **Severity:** MEDIUM — repeated rendering cost and an unauthenticated amplification point.
- **Recommendation:** Clamp sizes to the values the UI uses, limit the public actions to what the product needs (the PDF report can render in-process, PERF-021), and cache rendered images for a short period.
- **Unknown / needs further validation:** Rendering cost with real data and at maximum size. Needs timed graph requests at default and maximum size on a production-size copy.

### PERF-021 — Job-order PDF report fetches its own graph over HTTP
*Confirmation: **Runtime** · New in this edition · Related: RT-09, PERF-006, PERF-013, PERF-018*

- **Confirmed fact:** To embed the pipeline graph, the PDF report builds an absolute URL from the incoming request's host (`http://<Host>/index.php?m=graphs&a=jobOrderReportGraph…`) and FPDF opens it with `getimagesize()`/`fopen()`, that is, the PHP worker makes an HTTP request to the application itself and waits for it. The self-request carries no session cookie, so it takes a second PHP worker and goes through the new-session bootstrap (PERF-006). There is no timeout beyond PHP's `default_socket_timeout`.
- **Evidence:** `modules/reports/ReportsUI.php:486-499` (comments `// FIXME: Pass session cookie in URL? … There has to be a way.`, `CATSUtility::getAbsoluteURI(...)`, `$pdf->Image($URI, …)`); `lib/fpdf/fpdf.php:1505-1532`. **Runtime (RT-09, #54):** in the repository's two-container topology the self-request was refused and the report returned `FPDF error: Missing or incorrect image file` (21 ms, because the connection was refused at once); the same request with `Host: web` produced a valid PDF (`evidence/final-run/joborder-report-with-internal-host.pdf`).
- **Impact:** Each PDF report needs two workers at the same time; with a small worker pool, concurrent reports can wait on each other. If the public host name resolves to an address that drops rather than refuses connections (proxies, NAT, firewalls), the worker blocks until the socket timeout. The feature depends on the server reaching its own public URL.
- **Severity:** MEDIUM — worker doubling and a blocking network wait on a report path; broken in the shipped container setup.
- **Recommendation:** Render the graph in-process for the PDF instead of fetching it over HTTP.
- **Unknown / needs further validation:** Behaviour behind a reverse proxy or load balancer and with a dropping firewall. Needs one test per topology with timing.

---

## 4. Blocking work inside requests

### PERF-004 — Blocking external work in requests with no timeout; `set_time_limit(0)` before every query
*Confirmation: **Partial** · Phase 0 severity: unchanged · Related: RT-08, DB-023, DB-028, PERF-005, PERF-017*

- **Confirmed fact:** `DatabaseConnection::query()` calls `set_time_limit(0)` before every query, which removes PHP's `max_execution_time` for the rest of the request (and cancels the explicit `set_time_limit(500)` in CSV import). Several paths wait on external processes or hosts with no deadline:
  - text extraction runs converters with `@exec($command, …)` during upload, careers apply and mass import;
  - resume parsing opens a SOAP client to `http://soap.resfly.com/parse.php` with no `connection_timeout`; `LicenseUtility::isParsingEnabled()` returns `true` on every branch, so the `PARSING_ENABLED` setting is ignored (the call only happens when a user asks for parsing);
  - the version check opens a socket to `www.catsone.com:80` with 5-second timeouts, triggered from Home at most once a day, on login and in settings, with no lock.
- **Evidence:** `lib/DatabaseConnection.php:172-179`; `modules/import/ImportUI.php:423`; `lib/DocumentToText.php:378`; `lib/Attachments.php:1099`; `modules/careers/CareersUI.php:504-506`, `:521-529`; `lib/License.php:687-706`; `lib/ParseUtility.php:58-60`, `:85`; `wsdl/parse.wsdl:78`; `lib/NewVersionCheck.php:165-178`, `:200`, `:206`; `modules/home/HomeUI.php:95`; `modules/login/LoginUI.php:409`. **Runtime (RT-08):** the PDF upload (#27) ran the converter command inside the upload request (FPM stderr `sh: \path\to\pdftotext: not found`); it failed at once because the path is a placeholder. The containers had no outbound internet, and no parsing or version-check call was triggered in the run.
- **Impact:** A hung converter or an unreachable host holds a PHP worker and the user's session lock (PERF-008) with nothing to stop it, because the only guard was disabled. The careers apply path is public, so slow uploads from outside can tie up workers (inference).
- **Severity:** HIGH — unbounded worker hold on public and core paths.
- **Recommendation:** Keep a request time limit, give every external call a deadline, move extraction and parsing out of the request, and make the parsing switch honour its setting.
- **Unknown / needs further validation:** Converter run times on large or malformed files, and behaviour when outbound hosts are blackholed. Needs timed uploads of large PDFs/DOCs with real converter paths, and a test with the SOAP and version-check hosts unreachable.

### PERF-005 — E-mail is sent synchronously inside the request, one SMTP session per recipient
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-04, PERF-017*

- **Confirmed fact:** `Mailer::send()` loops over recipients and calls PHPMailer `Send()` once each, without SMTP keep-alive, then inserts an `email_history` row. The SMTP timeout is 10 seconds. Mass e-mail from the candidate list also loads each candidate separately. Pipeline status changes and careers applications send mail inside the request. PHPMailer is created with exceptions enabled, and nothing catches them.
- **Evidence:** `lib/Mailer.php:76`, `:232-259` (`Send()` at `:241`, log at `:252`), `:344` (`Timeout = 10`); `grep SMTPKeepAlive` → nothing; `modules/candidates/CandidatesUI.php:3345-3372`; `lib/Pipelines.php:369-377`; `modules/careers/CareersUI.php:1518`, `:1585`, `:1595`. **Runtime (RT-04):** test e-mail (#77), candidate e-mail (#79) and careers applications (#85, #86) all tried to send inside the request and ended in an uncaught exception shown as a fatal page. The careers POSTs took 27–36 ms only because the SMTP connection was refused at once (`nginx.log`); a slow or unreachable relay was not tested.
- **Impact:** Response time of status changes, applications and mass mail includes SMTP time for every recipient (at up to 10 s timeout each), while the session lock is held. Any SMTP failure aborts the request after the data was already saved.
- **Severity:** MEDIUM — user-visible latency and failure coupling to an external service.
- **Recommendation:** Hand e-mail to a background worker that reuses the SMTP connection, and handle send failures without failing the user's action.
- **Unknown / needs further validation:** Per-message cost with a real relay. Needs a timed mass-mail test (for example 100 recipients) against a test SMTP server.

### PERF-014 — Mass import and attachment reindex run inline; resume text kept in the session
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: PERF-004, PERF-008, DB-028*

- **Confirmed fact:** Mass import step 2 extracts each document in its own AJAX call but keeps every document's full text and parse result in `$_SESSION['CATS_PARSE_TEMP']`. Step 4 imports all documents in one request; per document it runs up to three de-duplication counts, a candidate insert and update, and `createFromFile(..., extractText = true, ...)`, which extracts the text a second time and recomputes `SUM(file_size_kb)` over all of the site's attachments. The administrator's reindex re-extracts every attachment with empty text across all sites in one request (`set_time_limit(0)`, `memory_limit 256M`), reads each file with `file_get_contents()`, and has an `AND`/`OR` precedence error in its selection.
- **Evidence:** `modules/import/ImportUI.php:1340-1424` (step 2; session at `:1410`, `:1421`), `:1656-1830` (step 4; de-dup SQL `:1711-1719`; `createFromFile(..., '', true, true)` at `:1812-1813`); `lib/Attachments.php:162`, `:234` (`updateSiteSize()`), `:244-265` (SUM update); `modules/install/ajax/attachmentsReindex.php:44-46`, `:59`, `:71`. Runtime: mass import was not exercised (`SMOKE_TEST.md` §4).
- **Impact:** Importing a few hundred resumes makes a multi-MB session and a step-4 request that can run for minutes; reindex on a large install can run for hours in one web request (inference).
- **Severity:** MEDIUM — heavy but occasional administrative operations.
- **Recommendation:** Keep import state outside the session, reuse the text extracted in step 2, and run import and reindex as batched background jobs.
- **Unknown / needs further validation:** Real durations and memory. Needs a timed import of a few hundred mixed documents on an isolated copy.

### PERF-017 — The queue exists but nothing uses it for heavy work
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: PERF-004, PERF-005, PERF-014*

- **Confirmed fact:** `QueueProcessor::addAsynchronousTask()` exists, but its only caller is `registerRecurringTask()`. The two recurring tasks are exception clean-up and calendar reminders; reminders are scheduled every minute. Execution depends on an external cron calling `QueueCLI.php`, which the repository does not configure; each run starts a new PHP session (full module scan, PERF-006) and executes at most one queued task. Task classes are loaded with `eval`.
- **Evidence:** `lib/QueueProcessor.php:126-159`, `:156`, `:278-300`, `:201-215`; `modules/calendar/tasks/Reminders.php:47` (`'* * * * *'`); `QueueCLI.php:28` ("should be called by cron"), `:56` (`session_start()`), `:83` (`startNextTask()`). Runtime: the queue was not run in the baseline.
- **Impact:** All heavy work stays inside web requests (PERF-004, -005, -014). If cron is not configured, reminders never send.
- **Severity:** MEDIUM — no place to move slow work to without new infrastructure.
- **Recommendation:** Run the queue as a long-lived worker that drains several tasks per cycle, and route mail, extraction, import and reindex through it.
- **Unknown / needs further validation:** Whether real deployments run `QueueCLI.php` from cron. Needs operator input.

---

## 5. Storage engine, memory, caching and scaling

### PERF-009 — MyISAM table locks: long reads block writers
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: DB-003, PERF-001, PERF-003, PERF-007, PERF-012*

- **Confirmed fact:** All 55 tables are MyISAM. MyISAM locks whole tables: a `SELECT` holds a read lock for its duration and any `UPDATE` or `DELETE` needs an exclusive table lock (documented engine behaviour). The long reads in PERF-001, -002, -003, -011 and -012 run on the same tables as frequent small writes: candidate edits, pipeline status changes, attachment inserts and their follow-up updates, careers applications and the per-page writes of PERF-007.
- **Evidence:** `db/cats_schema.sql` (55 × `ENGINE=MyISAM`). Example pair: the resume scan reads `attachment` (`lib/Search.php:1939-2024`) while an upload inserts into and then updates `attachment` and recomputes the site's total size from it (`lib/Attachments.php:214-265`). Runtime: single-user smoke run only; no contention could appear.
- **Impact:** One slow list or search blocks all writers on its tables; new readers queue behind the waiting writer, which looks like a site-wide stall (inference). No crash-safe multi-statement writes (DB-003).
- **Severity:** HIGH — concurrency limit built into the storage layer, and a precondition for most other scaling work.
- **Recommendation:** Move to a row-locking, transactional engine (coordinated with DB-003 and DB-008).
- **Unknown / needs further validation:** Real lock contention. Needs `Table_locks_waited` versus `Table_locks_immediate` sampled on a production server, or a mixed read/write load test (for example 30 browsing users plus 5 writers) on a production-size copy.

### PERF-015 — No application cache; public careers and XML pages load all public jobs on every hit
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: PERF-006, PERF-013*

- **Confirmed fact:** No cache library is used (no APCu, Memcache, Redis or opcache calls outside `vendor/`). Every dynamic response sends `Expires: Mon, 26 Jul 1997` and `Last-Modified: <now>`. Settings rows are re-read whenever an object needs them (for example every `new Mailer()`). The careers controller runs `JobOrders::getAll(JOBORDERS_STATUS_SHARE, …)` — all public jobs with descriptions, joins and aggregates — on every careers request, including job detail and apply. The XML feed rebuilds all jobs and writes an `http_log` row (two queries) per hit.
- **Evidence:** `index.php:78-79`, `ajax.php:46-47`; `lib/Mailer.php:79-80`; `modules/careers/CareersUI.php:118`; `lib/JobOrders.php:548-720`; `modules/xml/XmlUI.php:112`, `:117-118` → `lib/HttpLogger.php:53-58`, `:103-111`. Runtime: careers pages and the XML feed answered in 22–36 ms with one public job (#80–#84, #89; `nginx.log`).
- **Impact:** Public traffic (job boards, crawlers) costs in proportion to jobs × hits, and adds to PERF-006 for cookieless clients.
- **Severity:** MEDIUM — cost on the public, unauthenticated surface.
- **Recommendation:** Load job lists only where needed, and cache public listings and feeds for a short time with cache headers that allow it.
- **Unknown / needs further validation:** Public request rates and job counts in real deployments. Needs web-server logs from a production site.

### PERF-016 — `memory_limit` forced down to 64M; fully buffered results and exports
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: PERF-002, PERF-003*

- **Confirmed fact:** `index.php:51` sets `memory_limit` to 64M, below the image default of 128M (`ENVIRONMENT.md` §2). All queries are buffered, and `getAllAssoc()` copies each result into a PHP array. "Export all" builds the whole CSV in one string; DataGrid export runs the list query a second time with every column.
- **Evidence:** `index.php:51` (`// FIXME: Config file setting.`); `lib/DatabaseConnection.php:181`, `:356-376`; `lib/Export.php:130-170`; `modules/export/ExportUI.php:117-126`; `lib/DataGrid.php:1381-1396`. Runtime: export was not exercised.
- **Impact:** "Allowed memory size exhausted" on large exports and broad searches at volumes that the default limit would absorb (inference).
- **Severity:** MEDIUM — failure mode on large data sets.
- **Recommendation:** Make the limit a configuration setting and stream exports row by row.
- **Unknown / needs further validation:** Peak memory of export and broad search at volume. Needs `memory_get_peak_usage()` on those requests on a production-size copy.

### PERF-018 — Horizontal-scaling blockers: local files, file sessions, one database, self-requests
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-09, RT-17, PERF-006, PERF-008, PERF-021*

- **Confirmed fact:**
  - Attachments are stored on local disk under `./attachments/site_N/…`; uploads use `upload/`, temp files `./temp`, and the module cache `modules.cache`; queue heartbeat files live in the web root; the installer rewrites `config.php`.
  - Sessions use PHP's file handler; import state in the session points at files in the local `upload/` directory.
  - One `DATABASE_HOST` and one connection per request; no read/write split. `CATS_SLAVE` only drops writes and restricts login to root — it is a read-only mirror mode, not replica routing.
  - The global `GET_LOCK` in module scanning serialises all nodes through the one database (PERF-006).
  - The PDF report assumes the server can reach its own public URL (PERF-021).
- **Evidence:** `lib/Attachments.php:1293`; `lib/FileUtility.php:468-493`; `config.php:87`, `:243-248`; `lib/ModuleUtility.php:208-215`, `:309`; `lib/DatabaseConnection.php:109-128`, `:635-643`; `lib/Users.php:859-863`. **Runtime:** stored attachments were served straight from the local `attachments/site_1/…` path by nginx (RT-17); the self-request failed in the two-container topology and worked only when the host resolved inside the PHP container (RT-09).
- **Impact:** A second web node needs shared storage for attachments, uploads and sessions (or sticky sessions), plus a working self-URL. The database is a single scaling and availability point, and MyISAM limits vertical scaling too (PERF-009).
- **Severity:** HIGH — a structural barrier to running more than one application node.
- **Recommendation:** Put file storage and sessions behind shared services, keep configuration out of the web root's writable files, and remove self-requests.
- **Unknown / needs further validation:** Whether any deployment runs more than one node today, and how. Needs operator input.

---

## 6. Front end and observability

### PERF-019 — Front end: unbundled, mostly unminified scripts in `<head>`, CSS `@import`
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: UX-016, DEP-003*

- **Confirmed fact:** Every page loads five core scripts synchronously in `<head>` — `lib.js` 28,221 B, `quickAction.js` 3,592 B, `calendarDateInput.js` 40,867 B, `subModal.js` 9,481 B, `jquery-1.3.2.min.js` 57,254 B (139,415 B together) — plus page-specific scripts (9 on the candidate list, 12–13 on the candidate page, which includes `lib.js` twice). Only jQuery is minified. CSS is loaded with `<style>@import …</style>`. Asset URLs carry a `?v=<version>` suffix, but the repository sets no long-lived cache headers for static files. `lib/JavaScriptCompressor.php` is unused. Full-page output buffering (PERF-020) prevents an early flush of `<head>`.
- **Evidence:** `wc -c` on the files; `lib/TemplateUtility.php:1175` (`?v=`), `:1190-1194` (core scripts), `:1207-1211` (page scripts and `@import`); `modules/candidates/Show.tpl:7`, `:9`; `modules/candidates/Candidates.tpl:2`. Runtime: browser `load` times were 12–150 ms (median 58 ms) on localhost (`results.json`), which says nothing about slow networks.
- **Impact:** About 140–200 KB of script in 9–13 blocking requests on first load; revalidation round trips on repeat views unless the web server adds caching (inference). Minor on a LAN, noticeable on slow links.
- **Severity:** LOW — modest cost; the web server can mitigate it.
- **Recommendation:** Bundle and minify the shared scripts, load them without blocking rendering, replace `@import`, and serve versioned assets with long cache lifetimes.
- **Unknown / needs further validation:** Real-network load times. Needs a browser measurement over a throttled connection.

### PERF-023 — No performance instrumentation and no load baseline
*Confirmation: **Static** · New in this edition (replaces Phase 0 §4 "Prioritized measurable improvements" and §5 "Benchmarking and observability plan") · Related: DB-023*

- **Confirmed fact:** The only built-in timing is the footer's "Server Response Time", which stops before output is sent (`index.php:131`, `lib/TemplateUtility.php:804-805`). The database layer has no query counter, timer or slow-query log (`lib/DatabaseConnection.php:159-221`). No performance test, benchmark data set or load script exists in the repository. The Phase 0.5 baseline recorded timings only on a near-empty database.
- **Evidence:** as cited; `KNOWN_RUNTIME_ERRORS.md` §Performance ("these numbers only show that nothing is pathologically slow on an almost empty database").
- **Impact:** None of the volume-dependent findings above can be ranked by real cost, and regressions cannot be detected.
- **Severity:** LOW — no direct user impact; it limits every other performance decision.
- **Recommendation:** Record per-request duration, query count, database time and peak memory, and establish a baseline on a production-size data set before acting on the volume-dependent findings.
- **Unknown / needs further validation:** The measurements listed in "Area-level unknowns".

---

## 7. Reference — observed baseline timings (near-empty database)

| Measure | Value | Source |
|---|---|---|
| Stack | PHP 7.2.16 FPM (no opcode cache), nginx 1.17.3, MariaDB 10.7.8; `memory_limit` 128M in the image, forced to 64M by the app; `max_execution_time` 30 | `ENVIRONMENT.md` §2 |
| Data | 4 candidates, 1 job order, 2 companies, a few attachments of at most a few KB | `ENVIRONMENT.md` §4; `SMOKE_TEST.md` row 14 |
| Requests in final run | 206 (195 × 200, 11 × 302); no 4xx/5xx from PHP routes | `evidence/final-run/nginx.log` |
| nginx `request_time` | median 25 ms, 90th percentile 32 ms, max 73 ms | `nginx.log` (awk) |
| New-session requests | 73 ms (first `/index.php`), 68 ms (login page after logout) vs 15–18 ms for the login page within a session | `nginx.log`; PERF-006 |
| Graph images (`m=graphs`, n = 10) | mean 44 ms (37–60 ms) vs 25 ms mean for other requests | `nginx.log`; PERF-013 |
| Browser navigation (94 steps) | TTFB median 28 ms, max 74 ms (#01), 69 ms (#94); `load` median 58 ms, max 150 ms (#05) | `results.json` |
| curl TTFB, 14 main pages × 3 samples | 24–46 ms | `KNOWN_RUNTIME_ERRORS.md` §Performance |
| Careers apply POST | 27–36 ms (SMTP refused immediately, RT-04) | `nginx.log` |
| Job-order PDF | 21 ms (self-request refused immediately, RT-09) | `nginx.log` |
| Resume keyword search | 27 ms over 3 small attachments | `nginx.log` |
| Pages > 1 s | none | `SMOKE_TEST.md` §2 |

**nginx `request_time` by module (final run, all requests to that module; mean / max in ms):** candidates 28 / 35 (44 requests incl. POSTs 26 / 30), job orders 27 / 32 (11), companies 25 / 27 (7), contacts 25 / 26 (7), home 29 / 33 (5), activity 30 / 32 (2), calendar 26 / 26 (3), reports 20 / 26 (7), settings 28 / 40 (23), `ajax.php` 18 / 46 (42), graphs 44 / 60 (10), attachment downloads 16 / 16 (3), careers pages 22–32 (11), careers apply POST 32 / 36 (3), XML feed 22 (1), RSS 1 (1, fatal before any work, RT-05). Derived with `awk` from `evidence/final-run/nginx.log`; one browser session, no concurrency.

## 8. Reference — request bootstrap and query budget

**Bootstrap sequence of `index.php` (every request, including `careers/` and `xml/`, which include it; `rss/` would too but fails first, RT-05):**

1. `@ini_set('memory_limit', '64M')` (`index.php:51`).
2. `session_start()` with the default file handler (`:75`); the session holds the `CATSSession` object and the module and hook arrays.
3. Anti-cache headers `Last-Modified: now`, `Expires: 1997` (`:78-79`).
4. `checkForcedUpdate()` → a `file_exists('.svn/entries')` check (`:136`; `lib/CATSUtility.php:98-105`).
5. Force-logout `SELECT` for logged-in users (`:141-145`, `// FIXME: This is slow!`).
6. `moduleRequiresAuthentication()` instantiates the module class, then `loadModule()` instantiates it again (`:195`; `lib/ModuleUtility.php:78`, `:129`); on a new session `getModules()` first rescans all modules (PERF-006).
7. `logPageView()` → two `UPDATE`s (`:207`, `:271`; PERF-007).
8. The module renders; the header adds a `system` and an MRU query; the page is buffered, regex-stripped and sent in one piece (`lib/Template.php:120`), so time to first byte equals total server time.

**Per logged-in page (static count, not measured):** connect; force-logout `SELECT` (`index.php:141-145`); `UPDATE user_login` and `UPDATE site` (`logPageView`, `lib/Users.php:1014-1044`); `SELECT * FROM system` for the header (`lib/TemplateUtility.php:172`); MRU `SELECT` (`:258`) — about 5 statements, 2 of them writes, before the module's own work. Add on the first request of a session: one `module_schema` query per module (23) under `GET_LOCK`, plus the include of every module UI file (PERF-006).

| Page | Statements (static count) | Writes |
|---|---|---|
| Any logged-in page | ≈ 5 + connect | 2 |
| Candidate list | ≈ 10–13 (baseline + tags, extra-field definitions, main query, `FOUND_ROWS()`, count; plus preference write on first view; main query again on an empty or out-of-range page) | 2–3 |
| Candidate detail | ≈ 20+ (baseline + about 14 reads + MRU chain) | 4–6 |
| Home | ≈ 17 + a separate graph request of ≈ 4 | 2 (+ graph request's 2) |

**Query-in-loop inventory (confirmed by reading):**

| Location | Pattern | Loop driven by | Finding |
|---|---|---|---|
| `modules/candidates/CandidatesUI.php:2000`, `:2031`, `:2130`, `:2161` | `getResumes()` (selects `text`) per search result | unbounded search results | PERF-002 |
| `modules/reports/ReportsUI.php:251-258`, `:331-336` | one query per job order | job orders in the period | PERF-012 |
| `modules/candidates/CandidatesUI.php:3345-3372` | `Candidates::get()` + SMTP send + insert per recipient | selected candidates | PERF-005 |
| `modules/candidates/CandidatesUI.php:1616-1645` | pipeline add (check + insert + history) + activity per candidate | selected candidates | PERF-011 |
| `modules/import/ImportUI.php:1682-1830` | up to 3 counts + insert + update + extraction + site-size `SUM` per document | imported documents | PERF-014 |
| `modules/install/ajax/attachmentsReindex.php:61-95` | file read + converter + update per attachment, all sites | attachments with empty text | PERF-014 |
| `lib/MRU.php:226-262`, `lib/Search.php:1801-1836` | select + delete per excess row | usually 1 | PERF-007 |
| `lib/LoginActivity.php:160-175` | `gethostbyaddr()` + update per row when `ENABLE_HOSTNAME_LOOKUP` (off by default); stores the unresolved value, so lookups repeat on every view | 15 per page | PERF-020 |
| `modules/calendar/tasks/Reminders.php:66-103` | send + update per due reminder | due reminders | PERF-017 |
| Counter-example | `modules/lists/ajax/addToLists.php:124-140` adds list entries in batches of 200 | — | — |

---

## Area-level unknowns

1. **Cost at realistic volume.** Nothing has been measured beyond a near-empty database. Needed: a production-size copy (or a synthetic set of comparable shape: tens of thousands of candidates and resumes, job orders with pipelines in the hundreds, years of activity and status history, a realistic number of custom fields and tags) and timed runs of list views, searches, pipeline paging, Reports, Home and export, with the slow-query log and `EXPLAIN` on the top statements.
2. **Behaviour under concurrency.** Lock waits (PERF-009), session serialisation (PERF-008) and bootstrap contention (PERF-006) were not exercised. Needed: a multi-user load test mixing readers, writers and cookieless public traffic, with `Table_locks_waited`, FPM queue length and per-request timings recorded.
3. **Production runtime settings.** Opcode cache, FPM pool size, `session.save_handler`, `default_socket_timeout`, web-server caching and compression for static files (the nginx image configuration is not in the repository). Needed: configuration from real deployments.
4. **Database server and version.** MySQL 8 support of `REGEXP '[[:<:]]'`, `ONLY_FULL_GROUP_BY` on the list queries, and temporary-table behaviour with TEXT columns differ by server; only MariaDB 10.7.8 was run (the dev compose file uses an unpinned `mariadb` image, `docker/docker-compose.yml:27`). Needed: the same smoke run on MySQL 8.0.
5. **External dependencies.** Reachability of `soap.resfly.com` and `www.catsone.com` from typical deployments, SMTP relay latency, converter run times on large files. Needed: timed tests with each dependency slow, refused and blackholed.
6. **Queue operation.** Whether deployments run `QueueCLI.php` from cron at all. Needed: operator input.
7. **Sphinx add-on.** Whether any deployment uses it, and its index freshness (`optional-updates/latest-sphinx-search`). Not audited.
8. **PHP 8 timings.** The code does not run on PHP 8 (for example `implode()` argument order in `lib/DataGrid.php:1292`, `:1299`, `:1328-1329`; curly-brace string offsets in `lib/CATSUtility.php:108`), so any PHP 8 benchmark must wait for those fixes (cross-reference DEP-001).

## Changes from the Phase 0 edition

- **Re-rated:** PERF-006 HIGH → MEDIUM (runtime shows about 40–50 ms extra per new session on the baseline host; the global-lock contention that justified HIGH is unmeasured and stays an open question).
- **New findings:** PERF-021 (PDF report self-HTTP fetch, RT-09), PERF-022 (no opcode cache in the shipped runtime), PERF-023 (no instrumentation or load baseline; replaces Phase 0 §4 and §5).
- **Withdrawn / merged:** none.
- **Confirmation from runtime evidence:** Runtime — PERF-005 (RT-04), PERF-006 (RT-01/RT-02 stack traces and new-session timings), PERF-007 (`INSTALLATION.md`: browsing wrote `user_login`, column preferences and `site.page_views`), PERF-013 (graph timings), PERF-018 (RT-09, RT-17). Partial — PERF-001, -002, -003, -004, -011, -012 (paths executed in the baseline; cost at volume inferred).
- **Corrected claims and citations:**
  - PERF-013: only five graph actions are public; the statistics graphs check the login (aligned with the SEC-010 correction). Title adjusted.
  - PERF-001: excerpt call at `modules/candidates/CandidatesUI.php:2080`; Sphinx `sleep(1)` at `lib/Search.php:1897`; MySQL 8 `[[:<:]]` support is now an explicit unknown (MariaDB 10.7.8 accepts it at runtime).
  - PERF-004: SOAP client created at `lib/ParseUtility.php:60` (not `:85-95`); parsing runs only when the user asks for it, not on every careers application.
  - PERF-006: 23 module UI files total 21,316 lines (Phase 0 cited "about 21k lines" and elsewhere "~37k LOC"); the test module's file-level `set_time_limit(300)` and `error_reporting(E_ALL)` are now noted.
  - PERF-012: the 54 calls are at `modules/reports/ReportsUI.php:99-162`.
  - PERF-020: 271 `eval(Hooks::get(...))` sites (Phase 0: 278).
  - Docker image line numbers: `docker/docker-compose.yml:14` (PHP) and `:27` (MariaDB, unpinned tag).
- **Removed as out of scope:** Phase 0 §4 (prioritised improvement list with effort and targets) and §5 (benchmarking and observability plan). The measurements they described are kept only as open questions under "Area-level unknowns". The "Facts vs Assumptions" section is replaced by the confirmation level on each finding.

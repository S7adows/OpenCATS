# OpenCATS Performance Audit (Static Analysis)

**Scope.** This is a static performance review of the OpenCATS 0.9.x code in this repository. It covers the cost of every request in `index.php`/`ajax.php`, session and module bootstrap, how list (DataGrid) SQL is built, search, N+1 query patterns, pipelines, reports and graphs, attachment/text-extraction/import paths, e-mail and other outbound calls, caching and HTTP headers, the MyISAM engine and index coverage, the queue, what blocks horizontal scaling, and front-end asset delivery. Nothing was run against a populated database. **Every runtime number or latency figure below is an ASSUMPTION or an INFERENCE unless it is marked FACT.** Query counts marked "static count" come from reading the code path. They are not measurements.

## Method

- Read in full or in the relevant parts: `index.php`, `ajax.php`, `config.php`, `QueueCLI.php`, `lib/Session.php`, `lib/ModuleUtility.php`, `lib/Hooks.php`, `lib/MRU.php`, `lib/Users.php`, `lib/TemplateUtility.php`, `lib/Template.php`, `lib/DatabaseConnection.php`, `lib/DataGrid.php`, `lib/Candidates.php` (CandidatesDataGrid), `lib/JobOrders.php` (JobOrdersDataGrid), `lib/Pipelines.php`, `lib/Search.php`, `lib/DatabaseSearch.php`, `lib/Statistics.php`, `lib/Dashboard.php`, `lib/Graphs.php`, `lib/Calendar.php`, `lib/Attachments.php`, `lib/DocumentToText.php`, `lib/ParseUtility.php`, `lib/License.php`, `lib/Mailer.php`, `lib/NewVersionCheck.php`, `lib/QueueProcessor.php`, `lib/Export.php`, `lib/JavaScriptCompressor.php`, `lib/SavedLists.php`, `lib/LoginActivity.php`, `lib/AJAXInterface.php`, the `modules/*` UIs involved (candidates, joborders, home, reports, graphs, careers, import, export, activity, attachments, xml, queue, calendar/tasks, tests, settings hooks), `ajax/getPipelineJobOrder.php`, `modules/install/ajax/attachmentsReindex.php`, `db/cats_schema.sql`, `db/upgrade-0.5.2-0.5.5.sql`, `robots.txt`, `docker/docker-compose.yml`, `.travis.yml`, `composer.json`.
- Commands: `grep -rn` for `SQL_CALC_FOUND_ROWS`, `REGEXP`, `LIKE`, `MATCH/AGAINST`, `FULLTEXT`, `session_write_close`, `Cache-Control|Expires`, `apcu_|Memcache|Redis`, `addAsynchronousTask`, `set_time_limit`, `exec(`, `SoapClient`, `fsockopen`, `CACHE_MODULES|CATS_SLAVE`. `awk` over `db/cats_schema.sql` to list the engine and the secondary indexes of each table. `wc -c` on the JS/CSS assets.
- A token-based PHP scanner I wrote (`scratchpad/notes/loopscan.php`, `loopscan2.php`). It flags DB calls, and calls to lib methods that issue DB queries, when they sit lexically inside `foreach`/`while`/`for` bodies across `lib/*.php` and `modules/**/*.php`. It found 46 direct and 92 indirect hits. I triaged them by hand, and only the confirmed ones appear below.
- `php -l` (PHP 8.4 CLI) on copies of the key files in the scratchpad, plus two one-line PHP 8.4 checks of language behaviour (see PERF-006 and the cross-cutting notes). No repository file was changed.

## Summary of Findings

| ID | Title | Severity |
|---|---|---|
| PERF-001 | Resume/keyword search is a REGEXP full scan of `attachment.text`, with no FULLTEXT index, and runs twice | HIGH |
| PERF-002 | Candidate searches return unbounded result sets, use non-sargable CONCAT/REPLACE `LIKE`, and trigger an N+1 `getResumes()` per row | HIGH |
| PERF-003 | DataGrid list SQL: `SQL_CALC_FOUND_ROWS` + fan-out LEFT JOINs + `GROUP BY` + correlated subqueries + user-controlled `maxResults` | HIGH |
| PERF-004 | Blocking external work in the request path with no timeouts; `set_time_limit(0)` on every query | HIGH |
| PERF-005 | E-mail is sent synchronously, per recipient, over a new SMTP session each time | MEDIUM |
| PERF-006 | Each new session rescans all modules (with SimpleTest) under a global `GET_LOCK`; `CACHE_MODULES` is off, and its write path fatals on PHP 8 | HIGH |
| PERF-007 | Per-request write amplification (force-logout read, `user_login` + `site` updates, MRU chain, preference writes) | MEDIUM |
| PERF-008 | Session design: large serialized object graph, unbounded stored data, lock held for the whole request | MEDIUM |
| PERF-009 | All 55 tables are MyISAM: table-level locks let long reads starve writers | HIGH |
| PERF-010 | Index gaps and non-sargable predicates on hot paths (tags, default sorts, statistics, calendar, queue) | MEDIUM |
| PERF-011 | Pipeline AJAX refetches the whole pipeline (2 correlated subqueries per row) for every page or sort click | MEDIUM |
| PERF-012 | Reports and dashboard aggregates computed on every view with no cache (54 COUNTs per Reports tab load) | MEDIUM |
| PERF-013 | Graph images are rendered per request, without authentication, up to ~2000×1200 px, with anti-cache headers | MEDIUM |
| PERF-014 | Mass resume import and attachment reindex run inline; full resume text is stored in the session | MEDIUM |
| PERF-015 | No application cache anywhere; the careers portal loads every public job order on every hit | MEDIUM |
| PERF-016 | Memory: `memory_limit` forced to 64M; fully buffered result sets and exports; the export query runs twice | MEDIUM |
| PERF-017 | The queue exists but nothing offloads to it; it is cron-only and runs one task per invocation | MEDIUM |
| PERF-018 | Horizontal-scaling blockers: local filesystem state, file sessions, one DB host, `CATS_SLAVE` is not a replica router | HIGH |
| PERF-019 | Front end: 9–13 unbundled, mostly unminified JS files in `<head>`, CSS `@import`, jQuery 1.3.2 on every page, no sprites | LOW |
| PERF-020 | CPU micro-overheads: `eval()` hooks and cell renderers, regex over the whole page, query rewriting, modules instantiated twice | LOW |

---

## 1. Request Lifecycle and Per-Request Overhead

### 1.1 Bootstrap sequence (FACT)

`index.php` runs these steps for every request, including careers, RSS and XML via `careers/index.php`, `rss/index.php` and `xml/index.php`, which `include` `index.php`:

1. `@ini_set('memory_limit', '64M');` at `index.php:51`, marked `// FIXME: Config file setting.` (see PERF-016).
2. `session_start()` at `index.php:74-75`. The session is file-based by default (no `session_set_save_handler` anywhere) and holds the `CATSSession` object, `$_SESSION['modules']` and `$_SESSION['hooks']` (see PERF-008).
3. Anti-cache headers are sent on everything: `Last-Modified: now` and `Expires: Mon, 26 Jul 1997` (`index.php:78-79`).
4. `$_SESSION['CATS']->checkForcedUpdate()` (`index.php:136`) calls `CATSUtility::getBuild()`, which does a `file_exists('.svn/entries')` stat on each request (`lib/CATSUtility.php:98-105`).
5. A **force-logout DB read on every logged-in request** (`index.php:141-145`):
   ```php
   // FIXME: This is slow!
   if ($_SESSION['CATS']->isLoggedIn())
   {
       $users = new Users($_SESSION['CATS']->getSiteID());
       $forceLogoutData = $users->getForceLogoutData($_SESSION['CATS']->getUserID());
   ```
   (`SELECT access_level, force_logout FROM user WHERE site_id=? AND user_id=?`, `lib/Users.php:450-466`. This is a PK lookup and cheap by itself, but it is one round-trip per request, including graph images and downloads.)
6. If `ENABLE_SINGLE_SESSION` is on (default `false`, `config.php:183`), `checkForceLogout()` also calls `Users::get()` (`lib/Session.php:218`). That query LEFT JOINs `user_login`, aggregates `MAX(IF(successful…))` over **all** of the user's login rows, and groups by user (`lib/Users.php:278-333`). Its cost grows with the user's login history, which is never pruned.
7. `moduleRequiresAuthentication($_GET['m'])` (`index.php:195`, `lib/ModuleUtility.php:109-133`) **instantiates the module class**. `loadModule()` then instantiates it **again** (`lib/ModuleUtility.php:78`).
8. `logPageView()` (`index.php:207`, `index.php:271`) makes **two writes on every logged-in page** (`lib/Session.php:618-631` → `lib/Users.php:1014-1044`):
   ```php
   "UPDATE user_login SET date_refreshed = NOW() WHERE user_login_id = %s AND site_id = %s"
   // FIXME: Don't hit "site" on each request. Lets make a new table.
   "UPDATE site SET page_views = page_views + 1 WHERE site_id = %s"
   ```
   The `site` update targets **one hot row per tenant** and takes a MyISAM table write lock (see PERF-007 and PERF-009).
9. Rendering the page header adds these queries:
   - `printHeaderBlock()` → `SystemInfo::getSystemInfo()`, `SELECT * FROM system` (`lib/TemplateUtility.php:171-172`, `lib/SystemInfo.php:54-66`).
   - `printQuickSearch()` → `MRU::getFormatted()`, a `SELECT` on `mru` (`lib/TemplateUtility.php:258`, `lib/MRU.php:115-137`).
   - `printTabs()` runs extra queries only for the subtabs `internalPostings` (`Companies::getDefaultCompany`, `lib/TemplateUtility.php:750-751`) and `customizeEEOReport` (`EEOSettings::getAll`, `lib/TemplateUtility.php:768-769`).
   - **FACT:** the header has no "upcoming events" query. `grep -c "Upcoming\|Calendar" lib/TemplateUtility.php` returns `0`. Upcoming events are queried only by the Home and Calendar modules.
10. `printFooter()` computes "Server Response Time" from `startTimer()` (`index.php:131`, `lib/TemplateUtility.php:804-805`). This is the only built-in timing, and it stops **before** the final output is flushed.
11. `Template::display()` buffers the whole page, then runs `preg_replace('/^\s+/m', '', $html)` over it before a single echo (`lib/Template.php:114-127`). `ajax.php:114-122` does the same for AJAX responses. Nothing is sent until the request finishes, so time-to-first-byte equals the total server time.

### 1.2 Static query budget per page (static count, not measured)

| Page | DB statements (by reading code) | Of which writes |
|---|---|---|
| Any logged-in page baseline | connect + force-logout SELECT + 2 UPDATE (logPageView) + `system` SELECT + `mru` SELECT = **5 + connect** | 2 |
| Candidates list (`m=candidates`) | baseline + Tags SELECT (`CandidatesUI.php:435`) + `extra_field_settings` SELECT (`Candidates.php` DataGrid ctor) + main `SQL_CALC_FOUND_ROWS` query + `SELECT FOUND_ROWS()` + `COUNT(*)` (`CandidatesUI.php:441`) + (first view per session) `UPDATE user SET column_preferences` (`DataGrid.php:923`) + (empty or out-of-range page) main query and FOUND_ROWS again (`DataGrid.php:541-551`) ≈ **10–13** | 2–3 |
| Candidate show | baseline + ~14 reads (candidate, attachments, pipelines, activities, upcoming events, extra fields, EEO, tags ×3, questionnaires, lists, `CandidatesUI.php:458-735`) + the MRU chain (DELETE, INSERT, SELECT COUNT, then SELECT+DELETE per excess row, `MRU.php:43-106,201-262`) ≈ **20+** | 4–6 |
| Home | baseline + `system` SELECT again (`NewVersionCheck::getNews`, `HomeUI.php:95`) + placements + 2×2 calendar queries + 2 DataGrids × 2 statements + **a separate `index.php` request for the graph image** (force-logout SELECT + calendar settings + full-history aggregate, see PERF-012) ≈ **17 + 4** | 2 |

---

## 2. Findings

### PERF-001 — Resume/keyword search is a REGEXP full scan of `attachment.text`, with no FULLTEXT index, and runs twice
- **Severity:** HIGH
- **Finding:** When Sphinx is off (default, `config.php:97` `ENABLE_SPHINX false`), "Search by resume" turns the boolean query into per-word `REGEXP '[[:<:]]word[[:>:]]'` predicates (and `LIKE '%word%'` for wildcards) against `attachment.text`. No current code uses `MATCH … AGAINST`: `grep -rn "AGAINST"` over `lib` and `modules` finds nothing. The shipped schema has **no FULLTEXT index** on `attachment`. One existed historically (`db/upgrade-0.5.2-0.5.5.sql:200` `ADD FULLTEXT KEY IDX_text (text)`), but `db/cats_schema.sql:83-106` does not define it. MySQL therefore has to read and regex-match every resume attachment of the site, twice: once for `COUNT(*)` and once for the page. The page query also returns the full `attachment.text` so PHP can build excerpts.
- **Evidence:**
  - `lib/DatabaseSearch.php:360-373`:
    ```php
    '(' . $tableField . ' REGEXP \'[[:<:]]\\1[[:>:]]\')'
    ...
    $search, '(' . $tableField . ' LIKE \'%\\1%\')', $string
    ```
  - `lib/Search.php:1939-1943` (`makeBooleanSQLWhere(..., 'attachment.text')`), `lib/Search.php:1945-1975` (COUNT query), `lib/Search.php:1980-2030` (page query selecting `attachment.text AS text` at `:1987`, `LIMIT %s, %s` at `:2024`).
  - The excerpt is built per row in PHP (`modules/candidates/CandidatesUI.php:2080-2082`, `SearchUtility::searchExcerpt`).
  - Available index: `attachment` has only `IDX_type_id(data_item_type,data_item_id)`, `IDX_data_item_id`, `IDX_CANDIDATE_MD5_SUM`, and `IDX_site_file_size*` (`db/cats_schema.sql:101-105`).
  - `attachment.text` is `TEXT` (64 KB max, `db/cats_schema.sql:93`). Longer resumes are truncated, or rejected in strict SQL mode.
  - The same `makeBooleanSQLWhere` REGEXP path is used for key skills, city/address, company key technologies and job title (`lib/Search.php:491, 667, 670, 796, 876`).
  - Sphinx path: `SetLimits(0, 1000)` caps matches at 1000 (`lib/Search.php:1877`). "Server maxed out" errors are retried with `sleep(1)` up to 5 times inside the web request (`lib/Search.php:1892-1907`).
- **Impact:** Latency grows linearly with the number and size of resumes per site. Every search reads all resume text from disk (INFERENCE: once text volume exceeds the MyISAM data cache, which is the OS page cache, this becomes seconds per search). While the scan runs it holds MyISAM read locks on `attachment` and `candidate`, which blocks uploads and edits (see PERF-009). Portability: `[[:<:]]`/`[[:>:]]` are not supported by the ICU regex engine in MySQL ≥ 8.0.4 (documented), so this search errors on MySQL 8. MariaDB's PCRE still accepts them.
- **Recommendation:** (1) Short term: add a FULLTEXT index on `attachment(text)` (MyISAM, or InnoDB on MySQL ≥ 5.6/MariaDB ≥ 10.0.5) and switch `SearchByResumePager` to `MATCH(text) AGAINST(? IN BOOLEAN MODE)`. The existing `DatabaseSearch::fulltextEncode()` (`lib/DatabaseSearch.php:426-442`) was designed for exactly that. Stop selecting `attachment.text` in the page query; use `LEFT(text, N)` or a stored excerpt. Compute the count with the same FULLTEXT predicate, or cap it ("1000+"). (2) Medium term: move to an external index (Manticore/Sphinx, which already exists as an option, or OpenSearch), fed by the queue (see PERF-017), and remove the `sleep(1)` retries from the request path. (3) Change `attachment.text` to `MEDIUMTEXT`.

### PERF-002 — Candidate searches return unbounded result sets, use non-sargable CONCAT/REPLACE `LIKE`, and trigger an N+1 `getResumes()` per row
- **Severity:** HIGH
- **Finding:** `SearchCandidates::byFullName/byKeySkills/byEmail/byPhone/byCity/all` and `QuickSearch::*` have **no LIMIT**. They return every match to PHP, and paging happens later in PHP. Their predicates wrap columns in `CONCAT()` or four nested `REPLACE()` calls, so no index can be used. For each returned candidate, the search UI then calls `Candidates::getResumes()`, which issues one extra query per row and pulls the full resume `TEXT` only to read the first `attachmentID`.
- **Evidence:**
  - Name: `lib/Search.php:462-464`:
    ```sql
    CONCAT(candidate.first_name, ' ', candidate.last_name) LIKE %s
    OR CONCAT(candidate.last_name, ' ', candidate.first_name) LIKE %s
    OR CONCAT(candidate.last_name, ', ', candidate.first_name) LIKE %s
    ```
  - Phone: `lib/Search.php:626-641` (four nested `REPLACE(...) LIKE`).
  - Quick search runs **four** unbounded queries per keystroke-submit (`modules/home/HomeUI.php:204-208`). The candidate query has 7 OR'ed non-sargable predicates (`lib/Search.php:1356-1377`). The wildcard `*` is translated to `%` (`lib/Search.php:1331`), so `*` matches everything.
  - N+1: `modules/candidates/CandidatesUI.php:2000`, `:2031`, `:2130`, `:2161`, each `$rsResume = $candidates->getResumes($row['candidateID']);` inside `foreach ($rs …)`. `lib/Candidates.php:848-872` selects `attachment.text AS text`.
  - Job-order "consider candidate" search does a similar full-pipeline membership check (`modules/joborders/JobOrdersUI.php:1234-1247`).
- **Impact:** A broad query (a single letter, `*`, or a common surname) on a large site returns every row, then runs one extra query per row that each transfers up to 64 KB of text. That is thousands of round trips and potentially hundreds of MB inside a **64 MB** memory limit (PERF-016). INFERENCE: this is the most likely source of "search hangs / white page" reports.
- **Recommendation:** Add `LIMIT`/paging in SQL (reuse `Pager`, as `SearchByResumePager` already does). Replace the per-row `getResumes()` with one aggregate in the main query, for example `(SELECT MIN(a.attachment_id) FROM attachment a WHERE a.data_item_type=100 AND a.data_item_id=candidate.candidate_id AND a.resume=1)`, or a single `WHERE data_item_id IN (…)` batch. Never select `text` for this purpose. Store normalized columns (`phone_*_digits`, `full_name`) or generated columns with indexes, and search with prefix `LIKE 'x%'` against them. Require a minimum input length for quick search.

### PERF-003 — DataGrid list SQL: `SQL_CALC_FOUND_ROWS` + fan-out LEFT JOINs + `GROUP BY` + correlated subqueries + user-controlled `maxResults`
- **Severity:** HIGH
- **Finding:** All main lists (candidates, job orders, companies, contacts, lists, activity, both home grids) use `SELECT SQL_CALC_FOUND_ROWS … GROUP BY <pk> ORDER BY … LIMIT`. `SQL_CALC_FOUND_ROWS` forces the server to produce the **entire** filtered, grouped result before applying `LIMIT`. The candidate grid's default "Attachments" column LEFT JOINs three one-to-many tables, and `saved_list_entry` is joined on every list view even outside list mode. Rows multiply per candidate and are then collapsed with `GROUP BY`. Default job-order columns add correlated `COUNT(*)` subqueries. Filters produce `LIKE '%x%'`, `HAVING` on computed strings, and `CONCAT` predicates. Page size (`maxResults`) comes from the client with no upper bound, and `-1` disables `LIMIT` entirely.
- **Evidence:**
  - 8 occurrences of `SQL_CALC_FOUND_ROWS`: `lib/Candidates.php:2320`, `lib/JobOrders.php:1251`, `lib/Companies.php:948`, `lib/Contacts.php:1010`, `modules/activity/dataGrids.php:158`, `modules/lists/dataGrids.php:138`, `modules/home/dataGrids.php:131`, `:284`. The count is read with `SELECT FOUND_ROWS()` at `lib/DataGrid.php:1337`.
  - `GROUP BY` on the PK: `lib/Candidates.php:2335`, `lib/JobOrders.php:1273`, `lib/Companies.php:973`, `lib/Contacts.php:1031`, `modules/lists/dataGrids.php:155`.
  - Candidate fan-out joins (default column "Attachments", `modules/candidates/dataGrids.php:25`): `lib/Candidates.php:1972-1981` (`LEFT JOIN attachment`, `LEFT JOIN candidate_joborder AS candidate_joborder_submitted … status >= 400`, `LEFT JOIN candidate_duplicates`), plus the unconditional `LEFT JOIN saved_list_entry` at `lib/Candidates.php:2313-2316`. Per candidate that is A×S×D×L intermediate rows.
  - `candidate.key_skills` (TEXT) is a default column (`modules/candidates/dataGrids.php:30`). On MySQL < 8.0.13 and MariaDB, TEXT columns in the implicit GROUP BY/ORDER BY temp table force an **on-disk** temporary table (documented engine behaviour).
  - Correlated subqueries in list columns: candidates "Recent Status", "Recent Status (Extended)" and "Tags" (`lib/Candidates.php:2074`, `:2110`, `:2230`); job orders "In Pipeline", "Not Contacted", "Submitted", "Pipeline", "Interviews" (`lib/JobOrders.php:982, 999, 1018, 1037, 1054`), of which **Submitted** and **Pipeline** are defaults (`modules/joborders/dataGrids.php:63-64`); companies "Jobs" (`lib/Companies.php:786`). INFERENCE: because the whole grouped set is materialized before `ORDER BY … LIMIT`, these subqueries run for **every** matching row, not just the 15 shown. This depends on the optimizer version.
  - Filter SQL generation: `=~` → `col LIKE '%arg%'` (`lib/DataGrid.php:1161-1169`). Owner filter on `CONCAT(owner_user.first_name, owner_user.last_name)` (`lib/Candidates.php:2191`). Date filters as `HAVING DATE_FORMAT(...)` string compares (`lib/Candidates.php:2197`, `:2204`). "Recent Status" filter as `HAVING lastStatus LIKE` (`lib/Candidates.php:2107`). Alpha navigation as `HAVING ORD(UPPER(sortBy)) = …` (`lib/DataGrid.php:1315-1318`).
  - Extra fields become one `LEFT JOIN extra_field AS extra_fieldN` per visible custom field, joined on `(data_item_id, field_name, data_item_type)` (`lib/ExtraFields.php:733-737`, `:746-750`).
  - Client-controlled parameters: `$_GET['parameters'.$instance]` fully replaces the parameter array (`lib/DataGrid.php:382-385`). `maxResults` is only cast to int (`:460`), and `-1` removes `LIMIT` (`:1300-1312`). `ajax.php`'s `getFromRequest()` decodes it from `$_REQUEST['p']` (`lib/DataGrid.php:293-303`).
  - Double execution: when the computed page is out of range, including every **empty** result (`_totalPages = 0`), the whole query runs again (`lib/DataGrid.php:541-551`).
  - Export runs the query in the constructor, then again with **all** columns, including every correlated subquery (`lib/DataGrid.php:1381-1396`).
  - Deep pages use `LIMIT offset, n` (`lib/DataGrid.php:1307`).
- **Impact:** Every list page view costs O(rows in tenant × join fan-out), not O(page size). INFERENCE: on sites with 100k+ candidates, each list click takes seconds and holds MyISAM read locks on `candidate`, `attachment`, `candidate_joborder` and `saved_list_entry` (see PERF-009). `maxResults=-1` or `99999` is an easy self-inflicted or malicious DoS. `SQL_CALC_FOUND_ROWS` is deprecated since MySQL 8.0.17.
- **Recommendation:** (1) Enforce `1 ≤ maxResults ≤ 500` in `DataGrid::__construct` (`lib/DataGrid.php:453-466`), and route "export all" through a dedicated streaming path. (2) Split each list into a cheap `SELECT COUNT(*) FROM candidate WHERE site_id=? [+filters]` with no joins or subqueries, plus a two-phase page query: first select the 15 PKs ordered by an indexed column, then join or compute attachment, submitted, duplicate and status flags for those 15 IDs only, using `EXISTS(...)` instead of fan-out joins. (3) Join `saved_list_entry` only when `getMiscArgument() != 0` (`lib/Candidates.php:2300-2317`). (4) Drop the TEXT `key_skills` from the grouped set, or use `LEFT(key_skills,255)`. (5) Skip the second `_getData()` when `_totalEntries == 0`. (6) Add the supporting indexes from PERF-010.

### PERF-004 — Blocking external work in the request path with no timeouts; `set_time_limit(0)` on every query
- **Severity:** HIGH
- **Finding:** Several request paths block on external processes or remote services, and nothing enforces a time budget. On top of that, `DatabaseConnection::query()` calls `set_time_limit(0)` before **every** query, which cancels PHP's `max_execution_time` for the rest of the request.
- **Evidence:**
  - `lib/DatabaseConnection.php:171-179`:
    ```php
    else
    {
        /* Don't limit the execution time of queries. */
        set_time_limit(0);
    }
    $this->_queryResult = mysqli_query($this->_connection, $query);
    ```
    This also silently cancels the explicit `set_time_limit(500)` in CSV import (`modules/import/ImportUI.php:423`).
  - Text extraction shells out synchronously with no timeout: `@exec($command, $output, $returnCode);` (`lib/DocumentToText.php:378`), using antiword, pdftotext or html2text (`:114`, `:127`, `:146`). It is called during upload (`lib/Attachments.php:1099`), on the careers apply form (`modules/careers/CareersUI.php:504-506`) and in mass import (`modules/import/ImportUI.php:1383`). RTF is parsed character by character in PHP (`lib/DocumentToText.php:433+`).
  - Resume parsing over SOAP to a third-party host: `LicenseUtility::isParsingEnabled()` returns `true` on **every** branch (`lib/License.php:687-706`), so `ParseUtility::documentParse()` (`lib/ParseUtility.php:85-95`) opens `new SoapClient('wsdl/parse.wsdl')`. The endpoint is `http://soap.resfly.com/parse.php` (`wsdl/parse.wsdl:78`). It is called from careers apply (`modules/careers/CareersUI.php:524-528`), each mass-import document (`modules/import/ImportUI.php:1414`) and candidate-add parse (`modules/candidates/CandidatesUI.php:1008`). No explicit `connection_timeout` is set, so INFERENCE: PHP's `default_socket_timeout` (60 s by default) applies. If the SOAP extension is missing, `new SoapClient` is a fatal error.
  - Version check: `NewVersionCheck::getNews()` runs on every Home view (`modules/home/HomeUI.php:95`). Once per day it calls `checkForUpdate()` (`lib/NewVersionCheck.php:165-178`), which does a blocking `fsockopen('www.catsone.com', 80, …, 5)` plus `stream_set_timeout(5)` and a `while(!feof)` read loop (`lib/NewVersionCheck.php:197-218`). The same call runs on login (`modules/login/LoginUI.php:409`) and in settings (`modules/settings/SettingsUI.php:2229, 2631, 2642`). There is no lock, so concurrent Home requests after midnight can all perform the check.
- **Impact:** A malformed PDF, a hung converter or an unreachable SOAP or HTTP host holds a PHP-FPM worker and its **session lock** (PERF-008) indefinitely, because `set_time_limit(0)` disables the only guard. The careers apply path is public and unauthenticated. INFERENCE: a handful of slow uploads can exhaust a small FPM pool.
- **Recommendation:** Remove `set_time_limit(0)` from `DatabaseConnection::query()`, and use the DB's own `max_execution_time`/`max_statement_time` for runaway SELECTs. Wrap converters in `proc_open` with a deadline, or prefix them with `timeout 20s`. Move extraction and parsing to the queue (PERF-017) and show "processing…" states. Fix `isParsingEnabled()` to honour `PARSING_ENABLED` (`config.php:51`) and set `SoapClient(['connection_timeout'=>5])`. Move the version check to the cron/queue task.

### PERF-005 — E-mail is sent synchronously, per recipient, over a new SMTP session each time
- **Severity:** MEDIUM
- **Finding:** `Mailer::send()` loops over recipients and calls `PHPMailer::Send()` once per recipient, without `SMTPKeepAlive`. Each call is a new SMTP connection and TLS handshake (INFERENCE from PHPMailer defaults), followed by an `INSERT INTO email_history`. Mass e-mail from the candidates grid also issues `Candidates::get()` per recipient. Status changes and careers applications send mail inline.
- **Evidence:** `lib/Mailer.php:232-259` (loop, `->Send()` at `:241`, `logMessage` INSERT at `:252`, `:363-390`). `->Timeout = 10` at `:344`. `grep SMTPKeepAlive` finds nothing. Mass mail: `modules/candidates/CandidatesUI.php:3345-3372` (`$candidates->get($ID)` then `sendToOne` per candidate). Pipeline status change: `lib/Pipelines.php:369-377`. Careers apply sends up to 3 mails via `CareerPortalSettings::sendEmail` (`modules/careers/CareersUI.php:1518`, `:1585`, `:1595` → `lib/CareerPortal.php:461-468`). `new PHPMailer(true)` enables exceptions (`lib/Mailer.php:76`), so an SMTP failure throws inside the request.
- **Impact:** INFERENCE: e-mailing 200 candidates means 200 sequential SMTP sessions at roughly 0.2–1 s each, which is minutes inside one HTTP request, with the session lock held. SMTP slowness shows up directly as UI latency on status changes and public applications.
- **Recommendation:** Enqueue mail (`QueueProcessor::addAsynchronousTask`, `lib/QueueProcessor.php:278`) and send it from a worker with `SMTPKeepAlive = true`. Batch the `email_history` inserts, and prefetch candidates with one `IN (…)` query.

### PERF-006 — Each new session rescans all modules (with SimpleTest) under a global `GET_LOCK`; `CACHE_MODULES` is off, and its write path fatals on PHP 8
- **Severity:** HIGH
- **Finding:** Module discovery is cached **per session** in `$_SESSION['modules']` and `$_SESSION['hooks']`, not per server. Every request that arrives without a session cookie rebuilds the list: anonymous careers, RSS and XML feed hits, crawlers (`robots.txt` allows `/careers/`), API clients, `QueueCLI.php` cron runs, and first hits after a new login. The rebuild (a) opens the modules directory and every subdirectory, (b) `include_once`s every `*UI.php` (23 modules, about 21k lines) and **instantiates** each class, (c) runs one `SELECT … FROM module_schema WHERE name = ?` per module, possibly with migrations, (d) all under a **server-global** advisory lock `GET_LOCK('CATSUpdateLock', 120)`. `TestsUI.php` pulls the SimpleTest framework into this production path. The file cache that would avoid this (`CACHE_MODULES`) is disabled by default, and its write branch uses an undefined variable, which is a fatal error on PHP 8.
- **Evidence:**
  - Per-session cache: `lib/ModuleUtility.php:147-165` (`if (!isset($_SESSION['modules']) …) $modules = self::_refreshModuleList();`).
  - Scan: `lib/ModuleUtility.php:222-237` (opendir/readdir), `:242-243` (`$db->getAdvisoryLock('CATSUpdateLock', 120);`), `:260-282` (`include_once($fullFilePath); … $module = new $moduleClass(); … self::processModuleSchema(...)`), `:288` (release). `processModuleSchema()` SELECTs `module_schema` at `lib/ModuleUtility.php:443-470`. `module_schema` has no secondary index (`db/cats_schema.sql:841`).
  - SimpleTest in production: `modules/tests/TestsUI.php:43-46` (`require_once('lib/simpletest/web_tester.php')` …). Measured with the PHP 8.4 CLI in the scratchpad, those four requires pull in about 30 files / ~16.5k lines (approximate, because PHP 8.4 may stop early on legacy code).
  - Config: `config.php:251-256` (`define('CACHE_MODULES', false);`). The broken write path is at `lib/ModuleUtility.php:305-309`:
    ```php
    if (CACHE_MODULES)
    {
        $modulesCache->modules = $modules;   // $modulesCache never initialised
    ```
    Verified on PHP 8.4: `php -r '$m->a = 1;'` → `Error: Attempt to assign property "a" on null`. On PHP 7.2 (Docker image `opencats/php-base:7.2-fpm-alpine`, `docker/docker-compose.yml:15`) it is only a warning.
  - Entry points: `careers/index.php`, `rss/index.php` and `xml/index.php` all `include` `index.php` → `ModuleUtility::loadModule()` (`index.php:176-191`). `QueueCLI.php:55-78` starts a fresh session on every cron run.
- **Impact:** Anonymous traffic pays the full module bootstrap on every request, and concurrent cookieless requests **serialize on one DB lock**, even across web nodes. INFERENCE: a crawler or job-board aggregator polling `/careers/` or `/xml/` can queue behind itself and pile up FPM workers. Each such request also creates a session file.
- **Recommendation:** Build the module registry once per deploy: a static PHP array, or APCu/opcache-backed. Fix `$modulesCache = new stdClass;` if the file cache is kept. Move `processModuleSchema()` out of the request path into an explicit migrate step (installer/CLI) and drop the `GET_LOCK` from normal requests. Remove the `tests` module from production scanning. Skip `session_start()` for careers, RSS and XML unless a session cookie is present.

### PERF-007 — Per-request write amplification (force-logout read, `user_login` + `site` updates, MRU chain, preference writes)
- **Severity:** MEDIUM
- **Finding:** Read-only page views and AJAX reads perform writes, on MyISAM where every UPDATE takes a table write lock (PERF-009).
- **Evidence:**
  - Every page: force-logout SELECT (`index.php:141-145`, `// FIXME: This is slow!`), then `UPDATE user_login` and `UPDATE site SET page_views = page_views + 1` (`lib/Users.php:1016-1043`, `// FIXME: Don't hit "site" on each request`).
  - Every detail view (9 call sites of `getMRU()->addEntry`): DELETE, INSERT, `SELECT COUNT(*)`, then a SELECT+DELETE loop per excess row (`lib/MRU.php:43-106`, `:201-262`, `// FIXME: Remove multiple entries at once`).
  - Every pipeline AJAX page or sort: `$_SESSION['CATS']->setPipelineEntriesPerPage($entriesPerPage);` → `UPDATE user` (`ajax/getPipelineJobOrder.php:59` → `lib/Session.php:1078-1096`), even when the value is unchanged.
  - Every search: `SavedSearches::add()` does DELETE, INSERT, COUNT, then a SELECT+DELETE loop (`lib/Search.php:1712-1840`). `saved_search` has no secondary index (`db/cats_schema.sql:952-963`).
  - First view of each grid per session: `saveColumns()` → `UPDATE user SET column_preferences = <serialized LONGTEXT>` (`lib/DataGrid.php:919-923`, `lib/Session.php:1200-1218`). This happens every session because saved preferences are **never restored**: `lib/Session.php:850` assigns `$this->_ = unserialize($rs['columnPreferences']);` instead of `$this->_dataGridColumnPreferences`. The serialized blob also contains DataGrid parameters (filters, `exportIDs` arrays), because `setDataGridParameters()` stores them in the same array under `md5()` keys (`lib/Session.php:1251-1254`).
- **Impact:** At least 2 writes per page and 4–6 on detail views. All updates to `site` and `user_login` from all users serialize on table locks. The `site` row is a single hot counter per tenant. The preference bug also loses users' saved layouts (functional regression) and doubles the serialized preferences in the session (PERF-008).
- **Recommendation:** Throttle `logPageView` (update `date_refreshed` at most every N minutes, tracked in the session). Move `page_views` to an append-only or aggregated table, or to logs. Replace the MRU chain with one `INSERT … ON DUPLICATE KEY` plus a bounded `DELETE … ORDER BY mru_id LIMIT` (add `UNIQUE(user_id, site_id, url)`). Write `pipeline_entries_per_page` only when it changes. Fix `lib/Session.php:850`.

### PERF-008 — Session design: large serialized object graph, unbounded stored data, lock held for the whole request
- **Severity:** MEDIUM
- **Finding:** Every request unserializes and re-serializes the whole PHP session. It contains the `CATSSession` object (`lib/Session.php:42-87`, about 45 properties including `_MRU`, `_dataGridColumnPreferences`, `_storedData`, `_storedValues`, and the stray `_` property from PERF-007), plus `$_SESSION['modules']` (23 entries with subtab and settings arrays), `$_SESSION['hooks']` (PHP code strings), and during mass import `$_SESSION['CATS_PARSE_TEMP']`, which holds the **full extracted text of every uploaded resume** (PERF-014). `storeData()` grows without bound and deduplicates by linear `===` comparison of every stored blob. The toolbar stores parsed resume text there (`modules/toolbar/ToolbarUI.php:275`), and "consider for job" stores candidate ID arrays (`modules/candidates/CandidatesUI.php:1553`). The default `files` handler locks the session file for the whole request. `session_write_close()` is called **only** on redirects (`lib/CATSUtility.php:273`).
- **Evidence:** `lib/Session.php:1116-1131` (storeData loop), `modules/import/ImportUI.php:1410`, `:1421` (`$mp['contents'] = $contents; … $_SESSION['CATS_PARSE_TEMP'][] = $mp;`). `grep session_write_close` returns one hit. The session is started at `index.php:74-75`, `lib/AJAXInterface.php:206-207` and `QueueCLI.php:55-56`. The job-order page loads the page itself, the AJAX pipeline (`modules/joborders/Show.tpl:414`) and a graph image via `index.php?m=graphs` (`modules/joborders/JobOrdersUI.php:478`). The Home page embeds a graph image (`modules/home/Home.tpl:66`). Attachment downloads stream the file while still holding the session (`modules/attachments/AttachmentsUI.php:115-141`).
- **Impact:** Requests from the same user serialize. The pipeline AJAX call and the graph image wait for the page request to finish, and the user's other tabs wait behind long searches, downloads or mass mails. Session size grows during imports and toolbar use, which adds unserialize CPU and memory to every request (64 MB limit). The file-based store blocks multi-node deployment (PERF-018).
- **Recommendation:** Call `session_write_close()` right after authentication for read-only actions: in `index.php` after the force-logout check, for `m=graphs`, attachment downloads, and in `ajax.php` read endpoints. Store only IDs in the session. Keep mass-import state in a DB table or on disk keyed by an import ID. Cap `storeData`. Move sessions to Redis or DB with non-blocking reads if multi-node is a goal.

### PERF-009 — All 55 tables are MyISAM: table-level locks let long reads starve writers
- **Severity:** HIGH
- **Finding:** FACT: `grep -o "ENGINE=[A-Za-z]*" db/cats_schema.sql | sort | uniq -c` gives `55 ENGINE=MyISAM` and no InnoDB. MyISAM locks whole tables: a SELECT holds a table read lock for its duration, and any UPDATE or DELETE needs an exclusive table lock. Concurrent INSERTs are allowed only at the end of a table with no deleted-row holes (documented `concurrent_insert=AUTO`). The long reads in PERF-001, -002, -003, -011 and -012 run on the same tables as frequent small writes: candidate edits, `candidate_joborder` status changes, `attachment` inserts plus `setSizeMD5`/`setDirectoryName` UPDATEs, careers-apply inserts, and the per-request writes in PERF-007. `DatabaseConnection::beginTransaction()` exists (`lib/DatabaseConnection.php:718-760`), but on MyISAM `BEGIN`/`COMMIT` are no-ops.
- **Evidence:** `db/cats_schema.sql` (all `CREATE TABLE` blocks). Example conflicting pair: a resume REGEXP scan reads `attachment` (`lib/Search.php:1945-2024`) while an upload does `INSERT` then `UPDATE attachment … file_size_kb`/`directory_name` (`lib/Attachments.php:214-235`, `:486-510`) and `UPDATE site SET file_size_kb = (SELECT SUM(file_size_kb) FROM attachment …)` (`lib/Attachments.php:244-265`).
- **Impact:** INFERENCE: a single multi-second list or search query blocks all writers on that table, and new readers queue behind the waiting writer, producing a lock convoy that looks like a site-wide stall. There is no crash-safe atomicity for multi-statement operations (a data-integrity overlap for the DB audit).
- **Recommendation:** Convert to InnoDB (row locks, MVCC, crash safety, buffer-pool caching of data and not only indexes, FULLTEXT support). Watch `Table_locks_waited` against `Table_locks_immediate` before and after (see §4). Coordinate with the DB audit on FULLTEXT and charset during conversion.

### PERF-010 — Index gaps and non-sargable predicates on hot paths (tags, default sorts, statistics, calendar, queue)
- **Severity:** MEDIUM
- **Finding and evidence:** Cross-check of the hottest predicates against `db/cats_schema.sql`:

| Query (code) | Predicate / order | Available index | Verdict |
|---|---|---|---|
| Candidate list default (`lib/Candidates.php:2320-2345`, default sort `dateModifiedSort DESC`, `modules/candidates/dataGrids.php:21-22`) | `WHERE site_id=? AND is_admin_hidden=0 … GROUP BY candidate_id ORDER BY date_modified DESC LIMIT` | `IDX_site_first_last_modified(site_id,first_name,last_name,date_modified)`, `IDX_date_modified(date_modified)` (`db/cats_schema.sql:198-210`) | ✗ no `(site_id, date_modified)`; filesort of the whole tenant (and GROUP BY temp table) |
| Candidate joins (`lib/Candidates.php:1972-1981`, `:2313`) | attachment `(data_item_type,data_item_id)`; candidate_joborder `candidate_id`; duplicates `new_candidate_id`; saved_list_entry `(data_item_type,data_item_id)` | `IDX_type_id`, `IDX_candidate_id`, `IDX_new_candidate_id`, `IDX_type_id` | ✓ indexed, but the fan-out problem remains (PERF-003) |
| Tags column/filter (`lib/Candidates.php:2230-2251`), Show page tags (`lib/Tags.php:175-215`) | `candidate_tag.candidate_id = ?`, `tag_id IN (…)` | **none**, PK only (`db/cats_schema.sql:327-333`) | ✗ full scan of `candidate_tag` per candidate row / per show. Also hard-codes `t2.site_id = 1` (`lib/Candidates.php:2250`) |
| Job-order list (`lib/JobOrders.php:1251-1280`) + count subqueries | `joborder.site_id=? AND status IN(…)`; `candidate_joborder(site_id,joborder_id)`; `status_history(site_id,joborder_id,status_to)` | `IDX_site_id_status(site_id,status(8))`, `IDX_site_joborder`, `IDX_site_joborder_status_to` | ✓ (per-row subquery cost remains) |
| Pipeline (`lib/Pipelines.php:537-640`) | `candidate_joborder.joborder_id=? AND site_id=?`; activity subquery `(data_item_id,data_item_type,joborder_id) ORDER BY date_created DESC LIMIT 1` | `IDX_site_joborder`; activity `IDX_type_id(data_item_type,data_item_id)` | ~ acceptable; no `(data_item_type,data_item_id,joborder_id,date_created)` so a filesort per row. `LEFT JOIN attachment ON candidate_id = attachment.data_item_id` **omits `data_item_type`** (`lib/Pipelines.php:618-619`) → joins other entity types' attachments (wrong and fan-out) |
| Activity list (`modules/activity/dataGrids.php:155-270`) | `data_item_type=? AND site_id=? AND date_created >= …` | `IDX_activity_site_type_created_job(site_id,data_item_type,date_created,…)` | ✓, but `UNION` (dedup sort incl. `notes` TEXT) + `SQL_CALC_FOUND_ROWS`; "All" period = whole history |
| Statistics counts (`lib/Statistics.php:64-220`, criteria `:957-1054`) | `site_id=? AND DATE(col)=CURDATE()` / `YEARWEEK(col)` / `EXTRACT(YEAR_MONTH FROM col)` / `YEAR(col)` (+ `DATE_ADD(col,…)` if TZ offset) | candidate/company/contact/joborder have `(date_created)` alone, not `(site_id,date_created)` | ✗ non-sargable; the code's own "bogus `> '1900-01-01'`" trick (`:959-962`) at best gives a full index range scan |
| Calendar month (`lib/Calendar.php:85-146`) | `DATE_FORMAT(date,'%c')=? AND DATE_FORMAT(date,'%Y')=?` | `IDX_site_id_date(site_id,date)` | ✗ non-sargable; the code admits it: `// FIXME: Rewrite this query to use date ranges in WHERE, so that indexes can be used.` (`:85-86`) |
| Upcoming events (`lib/Calendar.php:696`, `:746`) | `TO_DAYS(NOW()) = TO_DAYS(date)`, `DATE(date) > CURDATE()` | same | ✗ non-sargable (runs 2× per Home view) |
| Reminders (every minute, `modules/calendar/tasks/Reminders.php:47`) | `reminder_enabled = 1 AND DATE_ADD(NOW(), INTERVAL reminder_time MINUTE) >= date` (`lib/Calendar.php:242-245`) | none on `reminder_enabled` | ✗ full `calendar_event` scan, all tenants, every minute |
| Queue (`lib/QueueProcessor.php:166-198`, `:126-159`) | `locked=0 AND error=0 AND ISNULL(date_completed) ORDER BY priority`; `task=? AND locked=1` | none (`db/cats_schema.sql:893-907`) | ✗ (small table today; unbounded if tasks are added) |
| Saved searches (`lib/Search.php:1749-1840`) | `site_id, user_id, data_item_type[, is_custom]` | none | ✗ (small) |
| Mass-import dedupe (`modules/import/ImportUI.php:1711-1719`) | `(email1 = ? OR email2 = ?) AND site_id = ?` | `IDX_site_id_email_1_2(site_id,email1(8),email2(8))` | ~ site-prefix only for the OR → scans the tenant per document |
| `Users::get` for single-session (`lib/Users.php:278-333`) | `LEFT JOIN user_login ON user_id … GROUP BY user_id` | `IDX_user_id` | ~ grows with login history (never pruned) |

- 29 tables have no secondary index at all (awk over the schema), including `candidate_tag`, `saved_search`, `queue`, `settings`, `module_schema`, `http_log` and `career_portal_*`.
- **Impact:** Table scans that grow with tenant data on list, detail, tag-filter, dashboard, reports and calendar views, plus a global scan every minute from the reminder task.
- **Recommendation:** Add, in order of value: `candidate_tag(candidate_id)`, `candidate_tag(site_id, tag_id)`; `candidate(site_id, date_modified)`, `candidate(site_id, date_created)`, and the same pair on `company`, `contact`, `joborder`; `calendar_event(reminder_enabled, date)`; `activity(data_item_type, data_item_id, joborder_id, date_created)`; `saved_search(site_id, user_id, data_item_type)`; `queue(locked, error, date_completed, priority)`, `queue(task, locked)`. Rewrite date predicates as ranges (`col >= ? AND col < ?`, computed in PHP with the timezone offset). Fix the pipeline attachment join. Verify each with `EXPLAIN` on a seeded dataset (§4).

### PERF-011 — Pipeline AJAX refetches the whole pipeline (2 correlated subqueries per row) for every page or sort click
- **Severity:** MEDIUM
- **Finding:** The job-order pipeline table is paginated and sorted **in PHP**. Each "next page" or "sort" AJAX call re-runs `getJobOrderPipeline()` for the whole pipeline. That query has no `LIMIT`, runs 2 correlated subqueries per row (last activity, submitted flag), uses a fan-out attachment join, and `GROUP BY`. PHP then `array_multisort`s and slices the result. The UI offers "All entries" as `99999` (`modules/joborders/Show.tpl:379`). Each row renders a ~1.5 KB inline rating widget (`lib/TemplateUtility.php:891-950`). Bulk "add to pipeline" also fetches the whole pipeline just to de-duplicate IDs, then runs SELECT + INSERT + history + activity per candidate.
- **Evidence:** `ajax/getPipelineJobOrder.php:59` (UPDATE user each call), `:66` (`getJobOrderPipeline`), `:117-132` (PHP sort), `:134-140` (slice). `lib/Pipelines.php:562-603` (subqueries), `:618-619` (attachment join without type), `:630` (GROUP BY). Bulk add: `modules/candidates/CandidatesUI.php:1616-1645`, and `lib/Pipelines.php:60-137` (`add`: SELECT + INSERT + history).
- **Impact:** For large pipelines (hundreds of candidates on popular requisitions), every click costs O(pipeline) queries in subqueries plus a write, and holds the session lock.
- **Recommendation:** Push `ORDER BY`/`LIMIT` into SQL with whitelisted sort columns. Compute `lastActivity` for the page's rows only (a second query with `IN (…)`). Replace the `COUNT(*) >= 1` subquery with `EXISTS`. Fix the attachment join. Cap "All entries". Batch the bulk add with a multi-row `INSERT … SELECT` that excludes existing members.

### PERF-012 — Reports and dashboard aggregates computed on every view with no cache (54 COUNTs per Reports tab load)
- **Severity:** MEDIUM
- **Finding:** The Reports tab runs 6 entities × 9 periods = **54 separate COUNT queries** per view. All of them use the non-sargable period criteria from PERF-010. The Home page's "Hiring Overview" image aggregates the tenant's **entire** `candidate_joborder_status_history` grouped by a computed week/month expression on each Home view. The Submission and Placement reports run one query per job order, and the code's own comment acknowledges it.
- **Evidence:** `modules/reports/ReportsUI.php:93-162` (54 calls, e.g. `$statistics->getCandidateCount(TIME_PERIOD_TODAY)` …). `lib/Statistics.php:957-1054` (criteria). `lib/Dashboard.php:155-176` (`FROM candidate_joborder_status_history WHERE site_id = %s GROUP BY unixdate ORDER BY unixdate DESC LIMIT 20`; `LIMIT` applies after the full aggregation), requested by `modules/home/Home.tpl:66` → `modules/graphs/GraphsUI.php:405-460`. N+1: `modules/reports/ReportsUI.php:253-258` and `:333-336` (`/* Querys inside loops are bad, but I don't think there is any avoiding this. */`). EEO report: `TO_DAYS(candidate.date_modified) >= …` (`lib/Statistics.php:699-703`).
- **Impact:** Report and dashboard latency grows linearly with history, and each view re-reads the same data. Combined with PERF-009, these long reads block pipeline status writes.
- **Recommendation:** Replace the 54 queries with one or a few conditional-aggregate queries (`SUM(date_created >= ?)` per period over a range-bounded scan). Bound the dashboard aggregate with `date >= NOW() - INTERVAL 20 WEEK` and add `(site_id, date)` on `candidate_joborder_status_history`. Cache the results per tenant in APCu/Redis for 5–15 minutes, or keep daily rollup tables maintained by the queue. Batch the per-job-order report query with `IN (…)`.

### PERF-013 — Graph images are rendered per request, without authentication, up to ~2000×1200 px, with anti-cache headers
- **Severity:** MEDIUM
- **Finding:** Graphs are PNG/JPEG images generated by Artichow/GD, served by `index.php?m=graphs`. Each one is a full bootstrap: session lock, force-logout SELECT, module load, statistics query and GD rendering. The module disables authentication, and the image size comes from GET parameters, capped only by `< 2000` and `< 1200` string comparisons. `generic` and `genericPie` render arbitrary labels and data from the query string. The `Expires: 1997` header from `index.php:78-79` stops browsers from caching the images, so they are regenerated on every Home or job-order view.
- **Evidence:** `modules/graphs/GraphsUI.php:48` (`$this->_authenticationRequired = false;`), `:53-68` (width/height from `$_GET`), `:357-400` (generic from GET). Embedded on job-order Show (`modules/joborders/JobOrdersUI.php:478`) and Home (`modules/home/Home.tpl:66`).
- **Impact:** Unauthenticated CPU and memory amplification: a 1999×1199 truecolor GD canvas is about 9.6 MB of raw pixels by INFERENCE, against a 64 MB limit. Graphs also take an extra FPM worker per page view.
- **Recommendation:** Require authentication, except where a public graph is explicitly needed. Clamp `width`/`height` as integers to the sizes actually used. Cache rendered images by `(site, graph, params, day)` in the filesystem or object store, and send `Cache-Control: private, max-age=300` plus an `ETag`. Longer term, render charts client-side from JSON.

### PERF-014 — Mass resume import and attachment reindex run inline; full resume text is stored in the session
- **Severity:** MEDIUM
- **Finding:** Mass import step 2 extracts each document through a per-file AJAX call, which is reasonable chunking. It then keeps the **full text and parse result of every document in `$_SESSION['CATS_PARSE_TEMP']`**. Step 4 imports **all** documents in one HTTP request. For each document it runs up to three dedupe `COUNT(*)` queries (one of them non-sargable, see PERF-010), a candidate insert and update, and `createFromFile(..., extractText = true, ...)`, which **runs text extraction a second time** and recomputes `SUM(file_size_kb)` over all of the tenant's attachments (`updateSiteSize`, called from both `add()` and `setSizeMD5()`). The maintenance "attachments reindex" re-extracts every empty-text attachment across **all tenants** in one request. It has an `AND`/`OR` precedence bug and `file_get_contents()`s every file, including binaries, only to test its type.
- **Evidence:** `modules/import/ImportUI.php:1340-1424` (step 2; `:1410`, `:1421` session storage), `:1656-1830` (step 4; dedupe SQL `:1711-1719`; `createFromFile(..., '', true, true)` at `:1812-1813`). `lib/Attachments.php:993-1000` (signature), `:1099` (convert), `:162` and `:234` (`updateSiteSize()`), `:244-265` (SUM subquery UPDATE on `site`). `modules/install/ajax/attachmentsReindex.php:44-46` (`set_time_limit(0)`, `memory_limit 256M`), `:59` (`WHERE text = "" OR isnull(text) AND resume = 1`), `:71` (`@file_get_contents($storedFilename)`).
- **Impact:** INFERENCE: importing a few hundred resumes gives a multi-MB session that is re-serialized on every request of that user, a step-4 request lasting minutes (O(docs × extraction) plus O(docs × tenant candidates) scans), and memory-limit failures. Reindex on a large install can run for hours inside one web request.
- **Recommendation:** Persist import state in a table keyed by import ID, with text on disk. Reuse the text extracted in step 2 by passing `$extractText = false` with the pre-extracted content. Run step 4 and reindex as queue jobs in batches of N. Update `site.file_size_kb` incrementally (`+= size`) instead of `SUM()`. Fix the SQL precedence.

### PERF-015 — No application cache anywhere; the careers portal loads every public job order on every hit
- **Severity:** MEDIUM
- **Finding:** There is no APCu, memcache, Redis or file cache: `grep -rln "apcu_\|Memcache\|Redis\|opcache_"` returns nothing outside vendor. Every dynamic response carries `Expires: 1997` and `Last-Modified: now` (`index.php:78-79`, `ajax.php:46-47`). PHP's default `session.cache_limiter=nocache` adds `Cache-Control: no-store` wherever a session is started (documented PHP default). Configuration rows (`settings` table: mailer, career portal, calendar, EEO) are re-queried on every object instantiation, for example in every `new Mailer()` (`lib/Mailer.php:79-80`). The public careers controller runs `JobOrders::getAll(JOBORDERS_STATUS_SHARE, …)` for **every** careers request, including apply and job detail. That query returns all public jobs with full `description`, joins and aggregates (`modules/careers/CareersUI.php:117-118`, `lib/JobOrders.php:548-720`). The XML feed rebuilds all jobs and inserts an `http_log` row per hit (`modules/xml/XmlUI.php:112`, `:117`; `http_log` has no index and no retention).
- **Impact:** Anonymous and public load (job boards, crawlers) scales linearly with job count × hits, on top of PERF-006.
- **Recommendation:** Add APCu (single node) or Redis (multi node). Cache per tenant: the settings arrays, the public job list, and the rendered careers listing and XML feed (invalidate on job-order save), all with `Cache-Control: public, max-age=60` for anonymous pages. Load job lists only on the pages that need them.

### PERF-016 — Memory: `memory_limit` forced to 64M; fully buffered result sets and exports; the export query runs twice
- **Severity:** MEDIUM
- **Finding:** `index.php:51` sets `memory_limit` to 64M, **lowering** PHP's shipped default of 128M. All queries use buffered `mysqli_query` (`lib/DatabaseConnection.php:181`), and `getAllAssoc()` copies each result into a PHP array (`:356-376`), so peak memory is about 2× the result size. "Export All Records" builds the whole CSV in one PHP string (`lib/Export.php:130-170`, `modules/export/ExportUI.php:117-126`). DataGrid CSV export runs the query twice, the second time with every column (`lib/DataGrid.php:1381-1396`). The unbounded searches from PERF-002 load full result sets, some with 64 KB text per row.
- **Impact:** "Allowed memory size exhausted" white pages on large tenants during export and broad search, at data volumes that 128M+ would absorb.
- **Recommendation:** Make the memory limit configurable, or remove the override. Stream exports with `MYSQLI_USE_RESULT` and `fputcsv(php://output)` row by row. Run a single query for DataGrid export.

### PERF-017 — The queue exists but nothing offloads to it; it is cron-only and runs one task per invocation
- **Severity:** MEDIUM
- **Finding:** `QueueProcessor` provides `addAsynchronousTask()` (`lib/QueueProcessor.php:278-300`), but **no request-path code enqueues anything**. Its only caller is `registerRecurringTask()` itself (`:126-159`; `grep addAsynchronousTask` shows only that and sample comments). The registered recurring tasks are `CleanExceptions` and calendar `Reminders` (`modules/queue/tasks/tasks.php:39`, `modules/calendar/tasks/tasks.php:39`). Reminders runs **every minute** (`modules/calendar/tasks/Reminders.php:47`), inserts a queue row, scans all calendar events (PERF-010), and sends e-mails serially. Execution depends on an external cron invoking `QueueCLI.php` ("file should be called by cron", `QueueCLI.php:28`). The repo ships no crontab or docs for this. Each run registers tasks (running due recurring tasks inline), executes **at most one** queued task (`QueueCLI.php:78-83`), and starts a fresh PHP session with a full module scan (PERF-006). Task files are included and instantiated through `eval` (`lib/QueueProcessor.php:201-215`).
- **Impact:** All heavy work (mail, extraction, parsing, import, reindex, index updates) stays synchronous in web requests (PERF-004, -005, -014), and the queue cannot absorb bursts.
- **Recommendation:** Build a long-running worker (`QueueCLI.php --loop` or supervisor) that drains N tasks per tick. Enqueue mail, extraction/parsing, import batches, reindex and Sphinx delta updates. Add the queue indexes from PERF-010 and an atomic claim (`UPDATE queue SET locked=1 WHERE queue_id=? AND locked=0`).

### PERF-018 — Horizontal-scaling blockers: local filesystem state, file sessions, one DB host, `CATS_SLAVE` is not a replica router
- **Severity:** HIGH
- **Finding:** Scaling beyond one web node is blocked by node-local state and a single-DB design:
  - Attachments on local disk under `./attachments/site_N/…` (`lib/Attachments.php:1282-1360`, `:1293`). Uploads go to `upload/<subdir>` (`lib/FileUtility.php:468-493`). Temp files go to `CATS_TEMP_DIR = './temp'` (`config.php:87`, used by `lib/DocumentToText.php:357-360`). The module cache is `modules.cache` (`lib/ModuleUtility.php:208-215`, `:309`). Queue heartbeat files are `queue.time`/`cleanup.time` in the web root (`modules/queue/constants.php`, `QueueCLI.php:86-99`). The installer rewrites `config.php` (`lib/CATSUtility.php:142-175`, `modules/install/ajax/ui.php:120-230`).
  - PHP file sessions (no save handler). `$_SESSION['CATS_PARSE_TEMP']` references files in the local `upload/` directory, which requires sticky sessions.
  - One `DATABASE_HOST` (`config.php:42`), one mysqli connection per request (`lib/DatabaseConnection.php:109-156`), and no read/write split. `CATS_SLAVE` (`config.php:243-248`) only **drops** `UPDATE|INSERT|DELETE` statements (`lib/DatabaseConnection.php:635-643`; `REPLACE`, DDL and `SELECT GET_LOCK` still pass) and restricts login to root (`lib/Users.php:859-863`). It is a read-only mirror mode, not replica routing, so ordinary users cannot use a replica.
  - A global `GET_LOCK` in module bootstrap (PERF-006) serializes nodes through the one DB.
- **Impact:** Adding web nodes requires shared storage (NFS) plus sticky sessions. The DB is a single scaling and availability point, and MyISAM limits vertical scaling as well (PERF-009).
- **Recommendation:** Put attachments behind a storage interface (local/NFS/S3-compatible), keep temp node-local but ephemeral, and store sessions in Redis or DB. Make `config.php` immutable and inject secrets through the environment. Replace `CATS_SLAVE` with a `DatabaseConnection` read pool used by the list, search and report paths once InnoDB is in place.

### PERF-019 — Front end: 9–13 unbundled, mostly unminified JS files in `<head>`, CSS `@import`, jQuery 1.3.2 on every page, no sprites
- **Severity:** LOW
- **Finding:** `_printCommonHeader()` emits 5 core `<script src>` tags on every page: `lib.js` 28,221 B, `quickAction.js` 3,592 B, `calendarDateInput.js` 40,867 B, `subModal.js` 9,481 B, `jquery-1.3.2.min.js` 57,254 B (139,415 B total, `wc -c`). Page-specific includes follow, all synchronous in `<head>`. `main.css` is loaded through `<style>@import …</style>`, plus `ie.css`/`not-ie.css` (`lib/TemplateUtility.php:1190-1216`). The candidate list loads 9 JS files (`modules/candidates/Candidates.tpl:2`). Candidate Show loads 12–13 JS files and includes `js/lib.js` a second time (`modules/candidates/Show.tpl:7`, `:9`). Only jQuery is minified. `lib.js` has 212 comment lines. `lib/JavaScriptCompressor.php` (a regex whitespace and comment stripper) is **dead code**: nothing references it. jQuery 1.3.2 is loaded everywhere, yet `grep` finds it used only in `js/emailHandler.js` and 13 template lines. There are 187 GIF, 92 JPG and 20 PNG images with no sprites. Rating widgets emit image maps and inline handlers per pipeline row. The versioned query string `?v=<version>` exists (`lib/TemplateUtility.php:1168-1176`), but the repo configures no far-future `Expires` for static files (the only `.htaccess` sets `Options -Indexes`). Full-page output buffering (§1.1, step 11) prevents an early flush of `<head>`.
- **Impact:** INFERENCE: on first load, about 180–200 KB of uncompressed JS across 9–13 blocking requests. On repeat views, revalidation round trips (304s) unless the web server adds caching. The effect is minor on a LAN and noticeable on high-latency links.
- **Recommendation:** Bundle and minify the core JS into one versioned file loaded with `defer`. Replace CSS `@import` with `<link>`. Serve `/js`, `/images` and `*.css` with `Cache-Control: public, max-age=31536000, immutable` (keyed by `?v=`). Drop or upgrade jQuery 1.3.2 (also a security item). Remove the duplicate `lib.js` include and the dead compressor.

### PERF-020 — CPU micro-overheads: `eval()` hooks and cell renderers, regex over the whole page, query rewriting, modules instantiated twice
- **Severity:** LOW
- **Finding:** `Hooks::get()` returns a code string that is `eval`'d at 278 call sites. Each `eval` compiles fresh (opcache does not cache `eval`), including one per tab inside `printTabs()` (`lib/TemplateUtility.php:616`). The DataGrid `eval`s a `pagerRender` string **per cell** (`lib/DataGrid.php:1912`) and an `exportRender` per exported cell (`:1441`). `DatabaseConnection::_localizationFilter()` walks every SELECT string with repeated `strpos`/`substr` to wrap each `DATE_FORMAT(` in `DATE_ADD` (`lib/DatabaseConnection.php:648-712`), including in WHERE clauses, which keeps them non-sargable. The page is regex-stripped of leading whitespace (`lib/Template.php:118-121`, `ajax.php:120-123`). Each module is constructed twice per request (`lib/ModuleUtility.php:129` and `:78`).
- **Impact:** Small per-request CPU overhead (INFERENCE: single-digit ms). It grows with rows × columns in exports.
- **Recommendation:** Convert hooks and renderers to callables (closures registered at load time). Do timezone conversion in PHP or with `CONVERT_TZ` on selected values only. Drop the whitespace regex, or apply it at build time. Cache `requiresAuthentication` in the module registry.

---

## 3. N+1 and Query-in-Loop Inventory (confirmed)

| Location | Pattern | Rows driving the loop | Severity context |
|---|---|---|---|
| `modules/candidates/CandidatesUI.php:2000, 2031, 2130, 2161` | `getResumes()` per search result (selects `text`) | unbounded search results | PERF-002 (HIGH) |
| `modules/reports/ReportsUI.php:253-258`, `:333-336` | `getSubmissionsByJobOrder` / `getPlacementsByJobOrder` per job order | job orders in period | PERF-012 |
| `modules/candidates/CandidatesUI.php:3345-3372` | `Candidates::get()` + SMTP send + INSERT per recipient | selected candidates | PERF-005 |
| `modules/candidates/CandidatesUI.php:1627-1645` | `Pipelines::add` (SELECT+INSERT+history) + `ActivityEntries::add` per candidate | selected candidates | PERF-011 |
| `modules/import/ImportUI.php:1682-1830` | up to 3 COUNTs + add + UPDATE + extraction + `updateSiteSize` per document | imported documents | PERF-014 |
| `modules/install/ajax/attachmentsReindex.php:61-95` | `file_get_contents` + exec + UPDATE per attachment (all tenants) | all empty-text attachments | PERF-014 |
| `lib/MRU.php:226-262`, `lib/Search.php:1801-1836` | SELECT+DELETE per excess row | usually 1 | PERF-007 (LOW individually) |
| `lib/LoginActivity.php:160-175` | `gethostbyaddr()` + UPDATE per row when `ENABLE_HOSTNAME_LOOKUP`. It stores `$row['hostname']` (the empty original) instead of the resolved value, so DNS lookups **repeat on every view** | 15 per page | LOW (off by default, `config.php:92`) |
| `lib/Mailer.php:232-259` | SMTP `Send()` + `email_history` INSERT per recipient | recipients | PERF-005 |
| `modules/calendar/tasks/Reminders.php:66-103` | `sendEmail` + UPDATE per due reminder | due reminders | PERF-017 |
| Counter-example (good) | `modules/lists/ajax/addToLists.php:124-140` batches `addEntryMany` in chunks of 200 | — | — |

Correlated subqueries that behave like server-side N+1: see PERF-003 (list columns) and PERF-011 (pipeline).

---

## 4. Prioritized Measurable Improvements

The metric column says what to measure before and after each change. Targets are proposals (ASSUMPTION) to be calibrated against the §5 baseline.

| # | Change (code anchor) | Effort | Metric to move | Proposed target |
|---|---|---|---|---|
| 0 | Instrumentation first (§5): query counter and timer in `DatabaseConnection::query()` (`lib/DatabaseConnection.php:159-221`), per-request log on shutdown, MySQL slow log | S | visibility | — |
| 1 | Cap `maxResults` (≤500) in `DataGrid::__construct` (`lib/DataGrid.php:453-466`); skip the re-query on empty results (`:541-551`) | S | max rows/query; queries per empty list | no unbounded grids; 2 fewer statements |
| 2 | Remove `set_time_limit(0)` from `query()` (`lib/DatabaseConnection.php:178`); wrap `exec` with `timeout` (`lib/DocumentToText.php:378`); `SoapClient` `connection_timeout`; fix `isParsingEnabled()` (`lib/License.php:687-706`) | S | FPM workers stuck > 60 s (FPM slowlog) | 0 |
| 3 | `session_write_close()` after auth for read-only actions, graphs, downloads, AJAX reads (`index.php` ~`:173`, `lib/AJAXInterface.php:207`) | S | wait time of concurrent same-session requests | ~0 |
| 4 | Throttle `logPageView`; move the `site.page_views` counter off the hot row (`lib/Users.php:1014-1044`); write `pipeline_entries_per_page` only on change; fix `Session.php:850` | S | writes per page view; `Table_locks_waited` | ≤0.1 writes/view avg |
| 5 | Fix search N+1 and add SQL paging (`CandidatesUI.php:1978-2170`, `lib/Search.php:385-720, 1329-1396`) | M | queries per search; peak memory | ≤3 queries; <16 MB |
| 6 | Indexes from PERF-010 (`candidate_tag`, `(site_id,date_*)`, `calendar_event`, `queue`, `saved_search`, `activity`) | S | `Rows_examined` in slow log for the listed queries | ≥10× reduction |
| 7 | Module registry built once (fix `$modulesCache`, APCu, or a generated PHP file); drop `GET_LOCK` and `processModuleSchema` from requests; remove `tests` from scanning (`lib/ModuleUtility.php:193-313`) | M | TTFB of cookieless `/careers/`; lock waits | −(23 SELECT + GET_LOCK + ~37k LOC include) per new session |
| 8 | Resume search on FULLTEXT or an external index; stop selecting `text` (`lib/Search.php:1843-2040`) | M | p95 resume-search latency at 50k resumes | <1 s |
| 9 | Two-phase DataGrid queries (IDs first, then flags for the page) and a separate COUNT; conditional `saved_list_entry` join (`lib/Candidates.php:2296-2350`, `lib/JobOrders.php:1230-1280`) | M | p95 list latency; `Created_tmp_disk_tables` | <300 ms at 100k candidates |
| 10 | Pipeline AJAX: SQL `ORDER BY`/`LIMIT`, per-page lastActivity, attachment-join fix (`ajax/getPipelineJobOrder.php`, `lib/Pipelines.php:537-640`) | M | queries and rows per pipeline click | O(page) not O(pipeline) |
| 11 | Reports: one conditional-aggregate query plus a 5–15 min cache; bound the dashboard aggregate; graph image cache and auth/size clamp (`modules/reports/ReportsUI.php:93-162`, `lib/Dashboard.php:155-176`, `modules/graphs/GraphsUI.php:48-68`) | M | statements per Reports view; graph renders/hour | 54→≤6; cache hit ≥90% |
| 12 | Queue worker loop; enqueue mail, extraction, parsing, import, reindex (`lib/QueueProcessor.php`, `QueueCLI.php`) | M/L | request p95 for status change, careers apply, mass mail | independent of SMTP/extraction time |
| 13 | Stream exports; configurable memory limit (`index.php:51`, `lib/Export.php:130-170`, `lib/DataGrid.php:1381-1396`) | S/M | peak memory on "export all" | flat w.r.t. rows |
| 14 | MyISAM → InnoDB (with the DB audit) | L | `Table_locks_waited`; write p95 under concurrent reads | ~0 lock waits |
| 15 | Externalize state (sessions → Redis/DB, attachments → storage abstraction, read-replica routing) | L | ability to run N>1 web nodes without sticky/NFS | — |
| 16 | Front-end bundle, minify, `defer`, long-lived caching of versioned assets; drop jQuery 1.3.2 | S/M | requests and bytes per first view; repeat-view 304s | 1–2 JS requests; 0 revalidations |

## 5. Benchmarking and Observability Plan

**Measure first (week 1, low risk):**
1. **DB slow log and digest.** Enable `slow_query_log=ON`, `long_query_time=0.2`, `log_queries_not_using_indexes=ON` (MariaDB: add `log_slow_verbosity=query_plan,explain`), then analyse with `pt-query-digest`. Also enable `performance_schema.events_statements_summary_by_digest`. Expected top offenders from this audit (INFERENCE): the candidate list `SQL_CALC_FOUND_ROWS` query, `SearchByResumePager` COUNT and page, `QuickSearch::candidates`, `getJobOrderPipeline`, `Dashboard::getPipelineData`, and the Statistics counts.
2. **Engine counters.** Sample `SHOW GLOBAL STATUS` every minute: `Table_locks_waited` vs `Table_locks_immediate` (MyISAM contention, PERF-009), `Created_tmp_disk_tables` (PERF-003 TEXT columns in GROUP BY), `Select_full_join`, `Select_scan`, `Handler_read_rnd_next` (scans, PERF-010), `Sort_merge_passes`, `Key_reads/Key_read_requests` (MyISAM key cache), `Threads_running`.
3. **Application timing.** Add a request log line in a `register_shutdown_function` from `index.php`/`ajax.php`: module, action, wall time, query count, total DB time, peak memory (`memory_get_peak_usage`), and session size (`strlen(session_encode())`). Fill it from a counter in `DatabaseConnection::query()`, the single choke point (`lib/DatabaseConnection.php:159-221`). This extends the existing "Server Response Time" footer (`lib/TemplateUtility.php:804-825`).
4. **PHP-FPM.** Set `request_slowlog_timeout=2s` and `slowlog`, which captures stacks for `exec` (DocumentToText), SOAP, `fsockopen` (NewVersionCheck) and SMTP waits. Watch `pm.status` for `listen queue` and `max children reached`.
5. **APM (optional).** Use a sampling profiler (Excimer/SPX/XHProf/Tideways) or OpenTelemetry PHP auto-instrumentation for mysqli and curl, to attribute time to `eval`, DataGrid rendering and regexes (PERF-020).

**Controlled benchmark (week 2):**
- **Dataset (proposal):** 1 tenant with 100k candidates; 50k resume attachments averaging 20 KB of text; 2k job orders, 50 of which have 300+ pipeline entries; 1M activity rows; 200k `candidate_joborder_status_history` rows; 20 custom extra fields; 10k `candidate_tag` rows. Plus 20 small tenants to exercise `site_id` selectivity.
- **Scenarios (k6/Locust/JMeter, with cookies):** (a) login → home (including the graph image) → candidates list pages 1, 2, 100 → sort by Modified/Owner → filter "Key Skills =~ java"; (b) candidate show; (c) job-order show plus pipeline AJAX paging and sort; (d) quick search ("a", "smith", "555"); (e) resume search ("java AND sql"); (f) Reports tab; (g) cookieless `/careers/` and `/xml/` at 20 rps; (h) careers apply with a 1 MB PDF; (i) export all candidates; (j) mixed load: 30 users browsing plus 5 writers (status changes and uploads) to surface MyISAM convoys.
- **Report per scenario:** p50/p95/p99 latency, statements per request, rows examined, lock waits, peak memory, session size, and FPM saturation. Re-run after each item in §4 and keep the results as regression baselines. CI hook: a performance smoke test on the seeded dataset that fails if the statements-per-request of key pages regresses.

---

## Facts vs Assumptions

**FACT (verified in code or by local command):**
- The per-request force-logout SELECT (`index.php:141-145`) and the two `logPageView` UPDATEs (`lib/Users.php:1016-1043`) run on every logged-in page. `memory_limit` is forced to 64M (`index.php:51`).
- Module scanning is cached per session, not per request. It runs under `GET_LOCK('CATSUpdateLock',120)` and runs one `module_schema` SELECT per module. `CACHE_MODULES=false`. The cache write path uses an undefined object (a PHP 8 fatal, verified with `php -r`).
- `session_write_close()` is called only in `CATSUtility::transferURL`. There is no custom session handler.
- The saved column preferences restore bug is `$this->_ = unserialize(...)` (`lib/Session.php:850`).
- 8 `SQL_CALC_FOUND_ROWS` grids. The fan-out joins, unconditional `saved_list_entry` join, correlated subqueries, and client-controlled `maxResults` (including `-1`) are exactly as quoted.
- Resume search uses REGEXP/LIKE on `attachment.text`. The shipped schema has no FULLTEXT index, and the code contains no `MATCH…AGAINST`.
- The search N+1 `getResumes()` selects `text`. Search functions have no `LIMIT`.
- `set_time_limit(0)` runs on every query. `exec()` has no timeout. `isParsingEnabled()` returns `true` on every branch. The SOAP endpoint is `soap.resfly.com`. NewVersionCheck uses `fsockopen` with 5 s timeouts.
- `Mailer` sends per recipient with no keepalive.
- The queue has no request-path producers. The only recurring tasks are CleanExceptions and Reminders (every minute).
- All 55 tables are MyISAM. 29 tables have no secondary index. `candidate_tag` has only a PK.
- There is no caching library. Anti-cache headers are set on `index.php` and `ajax.php`. `JavaScriptCompressor` is unused. The asset sizes are as listed.
- The graph module has `_authenticationRequired = false` and GET-controlled sizes.

**ASSUMPTION / INFERENCE (not measured):**
- Latency figures (seconds per list or search on large tenants), lock-convoy behaviour, and FPM exhaustion scenarios.
- That the MySQL/MariaDB optimizer evaluates select-list correlated subqueries for all grouped rows before `LIMIT`.
- On-disk temporary tables caused by TEXT columns (documented for MySQL < 8.0.13 and MariaDB; depends on the server version in use).
- SMTP per-message cost, SOAP default timeout (PHP `default_socket_timeout`), and GD memory estimates.
- Session sizes. Structure is known; byte sizes depend on usage.
- That deployments use the default PHP `files` session handler and no opcache tuning.
- Every target in §4.

## Unknowns / Needs Further Investigation

1. The production MySQL/MariaDB version and `sql_mode`. This decides `[[:<:]]` support (MySQL 8 breaks resume, key-skill and title search), `ONLY_FULL_GROUP_BY` compatibility of the `GROUP BY pk` grids, and temp-table engine behaviour. The Docker setup uses `mariadb:latest` (`docker/docker-compose.yml:28`) and the schema sets `SQL_MODE=''` only during import.
2. Real data volumes per tenant (candidates, attachments, text size, pipeline sizes, activity rows, login history), needed to rank PERF-001, -003 and -012 by actual cost.
3. Web server configuration for static assets (the `prooph/nginx:www` image config is not in the repo): gzip or brotli, `Expires`, HTTP/2.
4. PHP runtime settings: opcache enabled and sized, `session.save_handler`/`save_path`, `default_socket_timeout`, FPM pool size.
5. Whether operators actually run `QueueCLI.php` from cron. If not, calendar reminders never send and the queue is inert.
6. Whether `soap.resfly.com` and `www.catsone.com` are reachable or blackholed in typical deployments. A blackhole produces the worst-case connect timeouts.
7. Whether Sphinx is used in any deployment, and the freshness of its delta index (`optional-updates/latest-sphinx-search/sphinx.conf`).
8. Runtime profiling to confirm the actual statements per request (§1.2 counts are static) and the true cost of the `eval`-heavy DataGrid rendering.
9. **PHP 8 readiness blocks any PHP 8 benchmark (cross-cutting).** `lib/CATSUtility.php:108` and `:122` use `$data{0}` string offsets, which are a parse error on PHP 8 (verified with `php -l` on PHP 8.4). `lib/DataGrid.php:1292, 1299, 1328, 1329` and `lib/MRU.php:159-160` use `implode($array, $glue)`, which is a TypeError on PHP 8 (verified). `index.php:93-98` calls `get_magic_quotes_*`, which PHP 8 removed. Benchmarks must run on PHP 7.x, which the Docker image uses, until these are fixed.

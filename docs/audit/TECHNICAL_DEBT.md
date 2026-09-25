# OpenCATS: Technical Debt and Code Quality Assessment

**Scope.** This document measures the technical debt in the OpenCATS repository (`/home/user/OpenCATS`, HEAD `d607279`, CATS 0.9.x lineage, `CATS_VERSION` `0.9.7.4` at `constants.php:45`). It covers code size and structure, complexity, coupling, duplication, debt markers, compatibility with PHP 8.x, architecture debt, documentation debt, and build and tooling debt. It ends with a hotspot analysis and a debt register. Every number comes from read-only commands over the tracked files, and the commands are listed below. Security, database, performance and API behaviour appear here only where they are also code-quality debt. Other documents in `docs/audit/` cover those topics in depth, and this document cross-references their IDs (SEC-, DB-, PERF-, ARCH-, API-).

---

## Method

### Scope definitions used for all counts

| Term | Definition | Files | Physical LOC |
|---|---|---:|---:|
| **All tracked PHP** | `git ls-files '*.php'` | 355 | 137,356 |
| **Vendored PHP** | `lib/artichow/`, `lib/fpdf/`, `lib/simpletest/`, `lib/sphinx/` (third-party code copied into `lib/`) | 142 | 47,400 |
| **First-party PHP** | All tracked PHP minus vendored | 213 | 89,956 |
| **Production first-party** | First-party minus `src/OpenCATS/Tests/`, `modules/tests/`, `test/` | 186 | 82,914 |
| **Test code** | `src/OpenCATS/Tests/`, `modules/tests/`, `test/` | 27 | 7,042 |
| **Templates** | `git ls-files '*.tpl'` (these are PHP templates) | 136 | 16,914 |

`vendor/` is not present in the checkout (it is git-ignored, `.gitignore:9,13`), and no `composer install` was run.

### Commands run (all read-only)

The scratch scripts live in `/tmp/claude-0/-home-user-OpenCATS/18820312-57c3-5ade-9509-856f5b6098cd/scratchpad/notes/`. They read repository files and write output only to that scratch directory.

```bash
# Inventory / LOC
git ls-files | sed 's/.*\.//' | sort | uniq -c | sort -rn
for ext in php tpl js css sql sh html; do git ls-files "*.$ext" | xargs cat | wc -l; done
git ls-files '*.php' | awk -F/ '{print (NF>1)?$1:"(root)"}' ...        # LOC per top-level dir
for d in modules/*/; do find $d -name '*.php' | xargs cat | wc -l; ... # LOC per module per language

# Token-level metrics (PHP tokenizer, no execution of repo code)
php notes/tokscan.php notes/fp_php.txt   notes/fp     # first-party
php notes/tokscan.php notes/prod_php.txt notes/prod   # production only
php notes/tokscan.php notes/all_php.txt  notes/all    # everything
#  -> per-file LOC, classes, methods, global functions, `global`, `@`, exit/die, eval,
#     include/require, static calls, echo/print/inline-HTML inside class methods,
#     function length (declaration line to closing brace), PHP4 ctors, `var` props, `${`, `&` refs
php notes/ccscan.php  notes/fp_php.txt    # approx. cyclomatic complexity (1 + if/elseif/for/foreach/while/case/catch/&&/||/?:/??)
php notes/dynprops.php notes/fp_php.txt   # $this->x assignments with no declaration in class or first-party ancestors
php notes/doccov.php  notes/fp_php.txt    # docblock coverage of named functions
python3 notes/dupscan.py notes/fp_php.txt 8   # identical 8-line normalized windows (clone detection)
python3 notes/dupscan.py notes/tpl.txt 8

# PHP 8.4 syntax and compile checks, file by file, nothing excluded
while read f; do php -d display_errors=stderr -l "$f"; done < notes/all_php.txt
for f in $(git ls-files '*.tpl' '*.xtpl'); do php -l "$f"; done
php -d opcache.enable_cli=1 -d error_reporting=-1 -r 'opcache_compile_file($argv[1]);' <file>  # compiles, does not execute
php -r 'try { implode(["a","b"], ","); } catch (\Throwable $e) { echo $e->getMessage(); }'
php -r 'try { get_magic_quotes_gpc(); } catch (\Throwable $e) { echo $e->getMessage(); }'
php -r 'var_dump(preg_replace("[^A-Za-z0-9]", "", "../../x;Foo"));'

# Pattern scans (grep/rg) for removed or deprecated APIs, debt markers, legacy headers, formatting
grep -nE '\b(get_magic_quotes_gpc|get_magic_quotes_runtime|set_magic_quotes_runtime)\s*\(' ...
grep -nE '\$[a-zA-Z_]+\{[^}$]*\}' ...          # curly-brace string offsets
grep -nEf notes/implode.pat ...                # implode($array, $glue)
grep -cwE 'TODO|FIXME|HACK|XXX' ...; grep -l '\$Id:' ...; grep -l Cognizo ...
git ls-files ... | xargs md5sum | sort         # byte-identical files
diff -w modules/candidates/Error.tpl modules/*/Error.tpl

# Churn (history is read-only; the clone is shallow)
git rev-parse --is-shallow-repository          # -> true (boundary commit 8ad6c59, 2022-07-07)
git log --format= --name-only | sort | uniq -c | sort -rn | head -40
git log --format= --name-only 8ad6c59..HEAD | grep . | sort | uniq -c | sort -rn   # excludes the grafted root
```

### Limitations

- **Shallow history.** The repository has 57 commits, from 2022-07-07 (grafted boundary `8ad6c59`) to 2026-01-26. Churn therefore covers only about 3.5 years. The boundary commit lists every file once in `git log --name-only`, so the hotspot analysis excludes it. `--name-only` does not list files for merge commits.
- **Heuristic metrics.** Function length is measured from the `function` token to the matching closing brace. Complexity is a token count. The dynamic-property detector cannot see properties declared in non-first-party parents. Clone detection finds only exact normalized 8-line windows, so it misses near-miss clones. Treat these numbers as lower bounds unless stated otherwise.
- **No code was executed**, except the PHP one-liners above that demonstrate PHP 8.4 behaviour.

---

## Summary of findings

| ID | Title | Severity |
|---|---|---|
| DEBT-001 | The application cannot parse or boot on any PHP 8.x runtime, so it runs only on EOL PHP 7.x | CRITICAL |
| DEBT-002 | CI, Docker and the installer are pinned to or unaware of PHP versions, and CI lint covers only `src/` (24 of 355 PHP files) | HIGH |
| DEBT-003 | Dynamic properties are a core mechanism: 878 `Template::assign()` sites plus 178 undeclared properties in 28 classes, along with other PHP 8.x deprecations | HIGH |
| DEBT-004 | Extension model based on `eval()`: 278 hook call sites, 251 hook names, only 10 implemented, and authorization delivered through them | HIGH |
| DEBT-005 | Code-as-data elsewhere: DataGrid render/filter strings (238 lines), 25 `PHP:` migrations, and wizard and installer code, all run through `eval()` | HIGH |
| DEBT-006 | God classes and god methods: 17 functions over 300 lines, 13 with CC above 50, and `SettingsUI::handleRequest` at CC≈169 | HIGH |
| DEBT-007 | Business logic sits in controllers and is duplicated and divergent (status-change e-mail, ownership e-mails ×8, placed→openings rule) | HIGH |
| DEBT-008 | Global state: `$_SESSION['CATS']` (386 accesses), `DatabaseConnection::getInstance()` (110), 1,505 cross-class static calls, 0 interfaces, and no dependency injection (DI) | HIGH |
| DEBT-009 | The PSR-4 `src/OpenCATS` layer is stalled at about 1% of runtime code and contains a broken exception class and a dead `catch` | MEDIUM |
| DEBT-010 | Latent defects found during the scan: `$this->_` in `Session.php:850`, `=` used in a condition, a no-op regex sanitiser, and dead DB error handling | HIGH |
| DEBT-011 | Configuration is PHP source: tracked `config.php` holds credentials and a licence key, and the installer writes raw request values into PHP code | HIGH |
| DEBT-012 | Domain enumerations are hard-coded and duplicated (pipeline statuses in code and DB, literal `400`/`800` in SQL, magic site IDs) | MEDIUM |
| DEBT-013 | Duplicated code: 13.7% of first-party PHP lines and 20.8% of template lines sit in exact 8-line clones, plus forked files | MEDIUM |
| DEBT-014 | Error handling and output mixing: 153 `exit`/`die`, 178 `@`, and 445 `echo` statements inside `lib/` class methods | MEDIUM |
| DEBT-015 | Dead code and commercial CATS remnants: 4,181 LOC never loaded, `License.php` neutered, phone-home and SOAP parser endpoints, a broken toolbar route | MEDIUM |
| DEBT-016 | 47,400 LOC of unmaintained vendored libraries in `lib/` (3 files fail on PHP 8), jQuery 1.3.2, and IE-era code | MEDIUM |
| DEBT-017 | Module discovery at runtime loads every controller (including SimpleTest) and runs migrations, and there are three separate migration mechanisms | MEDIUM |
| DEBT-018 | Build and tooling: no static-analysis or format config, dead Travis setup, workflows in `.github/workflow/` that never run, a release zip without `vendor/`, and a manual version bump process | MEDIUM |
| DEBT-019 | Documentation: stale CHANGELOG (last entry 2016), no architecture, API or ADR docs, 141 "Document me" FIXMEs, and docblock coverage of 8% in `modules/` | MEDIUM |
| DEBT-020 | No type information: 7 typed parameters, 0 return types, 0 `strict_types`, and 96% of `@param` tags unnamed | MEDIUM |
| DEBT-021 | Controllers and `lib/` emit HTML strings, and templates carry logic (5,285 `<?php` blocks) | MEDIUM |
| DEBT-022 | SVN-era and Cognizo legacy headers (322 `$Id:` keywords, 214 files mention Cognizo), and a build number read from `.svn/entries` | LOW |
| DEBT-023 | Formatting hygiene: mixed indentation, trailing whitespace, CRLF files, and output after a closing `?>` | LOW |

---

## 1. Metrics

### 1.1 LOC per language (tracked files, physical lines)

| Language | Files | LOC | Notes |
|---|---:|---:|---|
| PHP (all) | 355 | 137,356 | First-party 89,956 / vendored 47,400 |
| PHP templates `.tpl` (+3 `.xtpl`) | 136 | 16,914 | Plain PHP includes rendered by `lib/Template.php:98-129` |
| JavaScript | 57 | 16,296 | `js/` 39 files / 11,564; `modules/**` 18 files / 4,732; includes `js/jquery-1.3.2.min.js` |
| SQL | 11 | 47,081 | 42,847 of these are `db/upgrade-zipcodes.sql` (data) |
| HTML | 29 | 11,885 | 11,868 are SimpleTest documentation under `lib/simpletest/docs/` |
| CSS | 14 | 2,863 | `main.css` 1,379 |
| Shell | 13 | 481 | `scripts/*.sh`, `ci/package-code.sh`, `test/runAllTests.sh` |

### 1.2 PHP LOC per directory and module

| Directory | PHP files | PHP LOC |
|---|---:|---:|
| `lib/` first-party (81 top-level files) | 81 | 46,703 |
| `lib/simpletest/` (vendored) | 95 | 31,112 |
| `lib/artichow/` (vendored) | 33 | 13,377 |
| `lib/fpdf/` (vendored, FPDF 1.53: `lib/fpdf/fpdf.php:16`) | 13 | 2,232 |
| `lib/sphinx/sphinxapi.php` (vendored) | 1 | 679 |
| `modules/` | 66 | 31,118 |
| `src/` (runtime 9 files / 859; tests 15 files / 3,044) | 24 | 3,903 |
| `optional-updates/` (fork of `lib/Search.php` + `config.php`) | 2 | 2,736 |
| root (`index.php`, `ajax.php`, `config.php`, `constants.php`, `installwizard.php`, …) | 8 | 2,138 |
| `ajax/` | 21 | 1,862 |
| `test/` (Behat contexts) | 3 | 979 |
| `scripts/` | 3 | 395 |
| `careers/`, `rss/`, `xml/` shims | 3 | 122 |

| Module | PHP | TPL | JS | Module | PHP | TPL | JS |
|---|---:|---:|---:|---|---:|---:|---:|
| settings | 4,149 | 4,406 | 488 | home | 793 | 362 | 0 |
| candidates | 3,717 | 3,396 | 430 | queue | 729 | 0 | 0 |
| install | 3,346 | 0 | 0 | reports | 725 | 1,246 | 0 |
| tests (SimpleTest) | 3,019 | 86 | 50 | graphs | 632 | 0 | 0 |
| import | 2,680 | 1,521 | 277 | activity | 616 | 158 | 64 |
| joborders | 2,128 | 1,565 | 341 | login | 511 | 494 | 84 |
| careers | 1,794 | 140 | 0 | xml | 331 | 0 | 0 |
| contacts | 1,708 | 1,336 | 196 | toolbar | 288 | 86 | 278 |
| companies | 1,375 | 1,106 | 163 | wizard | 188 | 93 | 299 |
| lists | 978 | 237 | 0 | rss / export / attachments | 159 / 155 / 149 | 0 | 0 |
| calendar | 948 | 644 | 2,062 | | | | |

### 1.3 The 20 largest first-party PHP files

"Longest fn" is the longest function in the file, in lines. "eval" counts `T_EVAL` tokens. "echo in methods" counts `echo` inside class methods. "FIXME/TODO" counts marker words. "churn" counts commits since `8ad6c59`.

| File | LOC | Methods | Longest fn | eval | echo in methods | `@` | FIXME/TODO | churn |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| `modules/settings/SettingsUI.php` | 3842 | 72 | 670 | 10 | 58 | 0 | 22 | 1 |
| `modules/candidates/CandidatesUI.php` | 3582 | 38 | 401 | 37 | 2 | 2 | 9 | 2 |
| `lib/DataGrid.php` | 2649 | 41 | 373 | 5 | 120 | 1 | 5 | 0 |
| `optional-updates/latest-sphinx-search/Search.php` | 2487 | 46 | 209 | 7 | 0 | 0 | 18 | 0 |
| `lib/Candidates.php` | 2473 | 34 | 353 | 0 | 0 | 0 | 6 | 1 |
| `modules/import/ImportUI.php` | 2104 | 27 | 302 | 31 | 9 | 12 | 2 | 2 |
| `lib/Search.php` | 2096 | 37 | 209 | 7 | 0 | 0 | 14 | 0 |
| `modules/joborders/JobOrdersUI.php` | 1972 | 25 | 219 | 30 | 0 | 0 | 5 | 2 |
| `modules/careers/CareersUI.php` | 1794 | 12 | 900 | 5 | 6 | 3 | 10 | 2 |
| `lib/WebForm.php` | 1619 | 23 | 408 | 0 | 36 | 0 | 0 | 0 |
| `lib/FileCompressor.php` | 1577 | 18 | 326 | 0 | 0 | 13 | 4 | 0 |
| `lib/ControlPanel.php` (never included, see DEBT-015) | 1573 | 34 | 404 | 0 | 5 | 0 | 1 | 0 |
| `modules/contacts/ContactsUI.php` | 1563 | 17 | 246 | 19 | 0 | 0 | 3 | 1 |
| `lib/Attachments.php` | 1386 | 35 | 226 | 5 | 0 | 22 | 7 | 0 |
| `modules/install/Schema.php` | 1336 | 1 | 1303 | 0 | 0 | 0 | 0 | 0 |
| `lib/JobOrders.php` | 1294 | 15 | 344 | 5 | 0 | 0 | 6 | 0 |
| `lib/Session.php` | 1257 | 61 | 286 | 1 | 0 | 0 | 18 | 4 |
| `lib/Users.php` | 1257 | 27 | 85 | 1 | 0 | 1 | 7 | 0 |
| `lib/TemplateUtility.php` | 1245 | 25 | 226 | 10 | 158 | 0 | 7 | 1 |
| `modules/companies/CompaniesUI.php` | 1224 | 16 | 224 | 19 | 0 | 0 | 0 | 2 |

The largest vendored files are `lib/simpletest/test/acceptance_test.php` (1,729), `lib/fpdf/fpdf.php` (1,657) and `lib/simpletest/mock_objects.php` (1,641).

### 1.4 Largest functions and complexity distribution

The first-party code has 1,845 named functions and methods. The length and complexity distribution is:

| Metric | Count |
|---|---:|
| Functions > 100 lines | 137 (production 128) |
| Functions > 200 lines | 45 (production 43) |
| Functions > 300 lines | 17 |
| Approx. CC > 10 | 143 |
| Approx. CC > 20 | 61 |
| Approx. CC > 50 | 13 |
| Approx. CC > 100 | 3 |

| # | Function | Location | Lines | ≈CC |
|---:|---|---|---:|---:|
| 1 | `CATSSchema::get` (one array literal of 195 migrations) | `modules/install/Schema.php:31` | 1303 | 1 |
| 2 | `CareersUI::careersPage` | `modules/careers/CareersUI.php:71` | 900 | 168 |
| 3 | `SettingsUI::handleRequest` | `modules/settings/SettingsUI.php:224` | 670 | 169 |
| 4 | `SettingsUI::onCareerPortalQuestionnaire` | `modules/settings/SettingsUI.php:3370` | 426 | 88 |
| 5 | `BrowserDetection::detect` | `lib/BrowserDetection.php:57` | 424 | 64 |
| 6 | `CareersUI::onApplyToJobOrder` | `modules/careers/CareersUI.php:1190` | 414 | 38 |
| 7 | `WebForm::getJavaScript` | `lib/WebForm.php:1209` | 408 | 23 |
| 8 | `ControlPanel::getListView` (dead code) | `lib/ControlPanel.php:755` | 404 | 108 |
| 9 | `CandidatesUI::_addActivityChangeStatus` | `modules/candidates/CandidatesUI.php:2900` | 401 | 49 |
| 10 | `DataGrid::draw` | `lib/DataGrid.php:1559` | 373 | 57 |
| 11 | `ControlPanel::getWebForm` (dead code) | `lib/ControlPanel.php:184` | 359 | 83 |
| 12 | `CandidatesDataGrid::__construct` (column config with eval strings) | `lib/Candidates.php:1931` | 353 | 5 |
| 13 | `CandidatesUI::_addCandidate` | `modules/candidates/CandidatesUI.php:2543` | 346 | 40 |
| 14 | `JobOrdersDataGrid::__construct` | `lib/JobOrders.php:869` | 344 | 5 |
| 15 | `ZipFileCreator::addFileFromDisk` | `lib/FileCompressor.php:431` | 326 | 12 |
| 16 | `ImportUI::onImportFieldsDelimited` | `modules/import/ImportUI.php:740` | 302 | 51 |
| 17 | `ImportUI::getMassImportCandidates` | `modules/import/ImportUI.php:1656` | 302 | 41 |
| 18 | `DataGrid::_getData` | `lib/DataGrid.php:1040` | 300 | 56 |
| 19 | `CandidatesUI::onSearch` | `modules/candidates/CandidatesUI.php:1915` | 297 | 26 |
| 20 | `CandidatesUI::handleRequest` | `modules/candidates/CandidatesUI.php:81` | 289 | 56 |

### 1.5 Structural and coupling counts

These counts come from the tokenizer unless noted otherwise. "Production" excludes test code.

| Metric | First-party | Production | Notes |
|---|---:|---:|---|
| Classes | 211 | 168 | 1 abstract class; 0 traits |
| Interfaces | **0** | **0** | The only 2 `implements` are Behat contexts (`test/features/bootstrap/*.php`) |
| Methods | 1,828 | 1,594 | |
| Global function definitions | 18 | 18 | e.g. `index.php:83` `stripslashes_deep`, `modules/install/ajax/ui.php:1065,1111,1134,1151`, `rebuild_old_docs.php:16` |
| `global $…` statements | 27 | 25 | e.g. `lib/DocumentToText.php:435-437,522-524,548-550`, `modules/careers/CareersUI.php:73` |
| `$_SESSION['CATS']` accesses | 373 (+13 in `.tpl`) | — | 53 PHP files; `lib/` 99 in 22 files; `modules/` 215; `ajax/` 22; root 25 |
| `$_SESSION[` accesses (any key) | 500 | — | 26 of 81 first-party `lib/*.php` files read the session |
| Static calls `X::m()` | 1,857 | 1,697 | 1,653 / 1,505 target another class (not `self`/`parent`/`static`) |
| Top static targets | | | `CommonErrors` 367, `CATSUtility` 281, `Hooks` 267, `StringUtility` 165, `DatabaseConnection` 110, `DateUtility` 104 |
| `DatabaseConnection::getInstance()` | 110 | — | in 53 files (`lib/DatabaseConnection.php:53-75`) |
| `new X($this->_siteID \| $siteID)` | 413 | — | 324 of them in `modules/`; `Candidates` 43, `Companies` 32, `Users` 28 |
| include/require statements | 547 | 506 | 491 use `LEGACY_ROOT`; 35 use CWD-relative paths; 7 use variable paths; 509 distinct include edges |
| Autoloading | — | — | Composer PSR-4 covers only `OpenCATS\` → `src/OpenCATS/` (`composer.json:10-14`); 14 namespaced files |
| `eval(` tokens | 279 | 279 | 267 are `eval(Hooks::get(...))`; +11 hook `eval`s in `.tpl` |
| `@` error suppression | 182 | 178 | `lib/Attachments.php` 22, `lib/FileUtility.php` 16, `lib/FileCompressor.php` 13, `lib/LDAP.php` 12 |
| `exit`/`die` | 158 | 153 | `lib/` 29, `modules/` 69, `ajax/` 44, root 7, `scripts/` 7 |
| `echo` inside class methods | 598 | 539 | `lib/` 445 (`TemplateUtility` 158, `DataGrid` 120, `InstallationTests` 71, `WebForm` 36) |
| Controller actions (`case '…':` in `modules/*/*UI.php`) | 291 | — | across 23 `*UI.php` controllers; `SettingsUI` 60 |

The SQL layering is better than expected. Lines with SQL keywords (`SELECT|INSERT|UPDATE|DELETE`) number 479 in first-party `lib/*.php`, 200 in `modules/install/**`, 14 in `modules/import/Import.php`, 8 in `modules/*/*UI.php`, 6 in `modules/*/dataGrids.php`, 3 in `src/OpenCATS/Entity`, and 0 in `ajax/*.php` and `*.tpl`. So the main layering problem is not SQL in controllers. It is `lib/` "models" that also render HTML and read the session, and controllers that own business rules (DEBT-007, DEBT-021). The few raw SQL statements in controllers are at `modules/candidates/CandidatesUI.php:3399-3403`, `modules/careers/CareersUI.php:1685-1698` and `modules/import/ImportUI.php:1711-1748`. One comment admits the problem: `modules/settings/ajax/backup.php:227` says "FIXME: SQL shouldn't be trickling up to this layer."

### 1.6 PHP 8.4 lint (`php -l`) and compile results, file by file over all 355 PHP files

**`php -l` failures: 6 of 355 (5 unintended).** All 139 `.tpl`/`.xtpl` files lint and compile cleanly.

| File | Error | Reachability |
|---|---|---|
| `lib/CATSUtility.php:108` (also `:122`) | `syntax error, unexpected token "{"`, from `$data{0}`, a curly-brace string offset removed in PHP 8.0 | Included by `index.php:61`, `ajax.php:43`, `careers/index.php:38`, `rss/index.php:37`, `xml/index.php:38`, `QueueCLI.php:40`, `lib/Wizard.php:34`, `lib/License.php:33`, `modules/install/ajax/ui.php:32`. **This breaks every entry point.** |
| `lib/artichow/AntiSpam.class.php:63` | `$letters{mt_rand(...)}` | Included unconditionally by `lib/GraphGenerator.php:43`, so every graph fails |
| `lib/fpdf/fpdf.php:434` | `$cw[$s{$i}]` (also `each()` at `:1285`) | Included by `modules/reports/ReportsUI.php:414` (PDF report) |
| `lib/fpdf/font/makefont/makefont.php:18` | `$l{0}` | Stand-alone font utility, not included |
| `src/OpenCATS/Entity/JobOrderRepositoryException.php:2` | `namespace \OpenCATS\Entity;`, where a leading `\` is illegal | Autoloaded when `JobOrderRepository::persist()` throws (`src/OpenCATS/Entity/JobOrderRepository.php:117`) |
| `lib/simpletest/test/test_with_parse_error.php:5` | intentional fixture | not applicable |

**Compile-time deprecations (via `opcache_compile_file`, which `php -l` does not report): 12, of which 6 are first-party.** All are "optional parameter declared before required parameter":

- `lib/ActivityEntries.php:162` (`$jobOrderID = false, $date = false, $timezoneOffset`)
- `lib/DatabaseConnection.php:262` (`getColumn($query = null, $row, $column)`)
- `lib/Tags.php:112` (`add($parent_tag_id=null, $title, $description)`)
- `lib/Profile.php:448,488` (dead file)
- vendored: `lib/artichow/BarPlotDashboard.class.php`, `BarPlotPipeline.class.php`, `inc/Label.class.php`, and `lib/simpletest/mock_objects.php:704` (`${var}` interpolation)

**`php -l` does not catch removed functions or runtime TypeErrors.** The next section covers them.

### 1.7 Removed and deprecated API scan (first-party unless stated)

| Pattern | PHP status | Count | Locations |
|---|---|---:|---|
| `get_magic_quotes_gpc/_runtime()` | **removed 8.0**, fatal "Call to undefined function" (verified on 8.4) | 9 unguarded calls | `index.php:93,99`; `ajax.php:50,56`; `QueueCLI.php:59,65`; `lib/Attachments.php:944`; `lib/InstallationTests.php:185`; `modules/import/ImportUI.php:495` (`set_magic_quotes_runtime` ×3 is guarded by `function_exists`) |
| `implode($array, $glue)` | **removed 8.0**, TypeError (verified) | 4 | `lib/DataGrid.php:1292,1299,1328,1329` (in `DataGrid::_getData()`, which every list view uses) |
| `$str{n}` string offsets | **removed 8.0**, parse error | 2 (+4 vendored) | `lib/CATSUtility.php:108,122` |
| `create_function()` | **removed 8.0** | 4 | `optional-updates/latest-sphinx-search/Search.php:228,240,301,313` |
| `each()` | **removed 8.0** | 0 (+1 vendored) | `lib/fpdf/fpdf.php:1285` |
| `mcrypt_*` | **removed 7.2** | 9 lines | `lib/Encryption.php:52-110` (the file is never included, see DEBT-015) |
| `mysql_*` | **removed 7.0** | 3 | inside migration strings `modules/install/Schema.php:725,854,1236` (executed via `eval`) |
| `ereg*`, `split()`, `var $prop`, PHP4-style constructors | removed | **0** | (0 PHP4 constructors anywhere; the 72 `var` properties are all in vendored `lib/fpdf`) |
| `${var}` string interpolation | deprecated 8.2 | 0 (+1 vendored) | `lib/simpletest/mock_objects.php:704` |
| Dynamic property creation | deprecated 8.2; PHP 9 is expected to make it an Error | 878 `Template::assign()` sites + 178 undeclared properties in 28 classes | see DEBT-003 |
| `strftime()` | deprecated 8.1 | 5 | `lib/Calendar.php:575`; `lib/DateUtility.php:148,472,476,480` |
| `utf8_encode()` | deprecated 8.2 | 2 | `lib/DocumentToText.php:424,515` |
| `libxml_disable_entity_loader()` | deprecated 8.0 | 1 | `lib/DocumentToText.php:415` |
| `ini_get('safe_mode'/'register_globals')` | ini settings removed (always false) | 9 | e.g. `lib/DatabaseConnection.php:171`, `lib/ModuleUtility.php:445`, `lib/InstallationTests.php:199` |
| Optional-before-required parameters | deprecated 8.0 | 6 | see §1.6 |
| `&` by-reference | — | 1 by-ref parameter (`lib/Template.php:77`, `assignByReference`, 0 callers); 1 `foreach (… as &$v)` (test code); 1 `=&` | negligible |
| mysqli default error mode | changed in 8.1: throws `mysqli_sql_exception` | no `mysqli_report()` call anywhere | see DEBT-010 |

### 1.8 Duplication

- **Byte-identical files (md5sum over all non-binary tracked files):** only empty files (9). No non-empty file is an exact copy.
- **Exact 8-line clone windows (normalized whitespace, trivial lines dropped):**
  - First-party PHP: 12,286 of 89,986 lines (**13.7%**) sit inside at least one duplicated window.
  - Templates: 3,520 of 16,919 lines (**20.8%**).
- **Top PHP clone pairs:**
  - `lib/Search.php` ↔ `optional-updates/latest-sphinx-search/Search.php` share 835 windows. The files differ by 575 lines under `diff -w --strip-trailing-cr`.
  - `config.php` ↔ `test/config.php` share 104.
  - `modules/candidates/CandidatesUI.php` ↔ `modules/contacts/ContactsUI.php` share 67.
  - `modules/activity/dataGrids.php` ↔ `modules/home/dataGrids.php` share 35.
  - `modules/companies/CompaniesUI.php` ↔ `ContactsUI.php` share 29.
  - `modules/queue/lib/Task.php` ↔ `modules/queue/tasks/lib/Task.php` differ only in the `$Id` line and brace style. The second file is never included; the only includers are `modules/queue/tasks/*.php:29-34` and `modules/calendar/tasks/Reminders.php:28`, which include the first.
- **Top template clone pairs:**
  - `modules/reports/NewDataItems.tpl` ↔ `Reports.tpl` share 212 windows.
  - `candidates/Candidates.tpl` ↔ `Duplicates.tpl` share 56.
  - `candidates/AddActivityChangeStatusModal.tpl` ↔ `contacts/AddActivityScheduleEventModal.tpl` share 42.
- **Per-module boilerplate copies:**
  - There are 12 `Error.tpl` files. Nine of them (25–26 lines each) differ from `modules/candidates/Error.tpl` by only 6–9 lines under `diff -w`: the `$Id`, the header title and the icon. For example, `diff modules/candidates/Error.tpl modules/companies/Error.tpl` shows only lines 1–2, 12 and 14–15. `modules/toolbar/Error.tpl` is empty.
  - There are 5 near-identical `ErrorModal.tpl` files (6–9 differing lines) and 3 `CreateAttachmentModal.tpl` files.
  - There are 9 `validator.js` files. Function names repeat across them: `checkAddForm`/`checkEditForm` 5×, and `checkFirstName`, `checkLastName`, `checkTitle`, `checkCompany`, `checkOwner`, `checkFilename` 2× each.
  - There are 7 `dataGrids.php` files with the same 9-property preamble; compare `modules/candidates/dataGrids.php:13-22` and `:79-88`.
- **Add and Edit templates are *not* near-duplicates.** For example, `modules/joborders/Add.tpl` (322 lines) and `Edit.tpl` (345) share only 80 identical unique lines, and the 8-line clone detector finds only 11–15 shared windows among the Add/Edit forms. The duplication there is structural (hand-built forms), not copy-paste.

### 1.9 Debt markers

| Marker | PHP | TPL | JS | Total |
|---|---:|---:|---:|---:|
| `FIXME` | 376 | 9 | 23 | **408** |
| `TODO` | 34 | 16 | 1 | 51 |
| `HACK` / `XXX` (upper-case) | 0 | 0 | 0 | 0 (the lower-case word "hack" appears 8×, e.g. `index.php:53`, `lib/Pipelines.php:539`) |

**FIXME themes**, from grouping the marker texts:

1. **"Document me"**: 141 (37% of FIXMEs). `lib/License.php` alone has 32.
2. **Library code coupled to the session**: at least 21, from "Library code Session dependencies suck" ×13, "Factor out Session dependency" ×5 and "Remove session dependancy" ×3. Examples: `lib/Search.php:375,735,852,1110,1317,1631`, `lib/Candidates.php:2292,2370`, `lib/Calendar.php:65,984`, `lib/JobOrders.php:1221`, `lib/NewVersionCheck.php:99`, `lib/Mailer.php:88`, `lib/DatabaseConnection.php:62`.
3. **Missing validation**: `modules/careers/CareersUI.php:548`, `modules/settings/SettingsUI.php:1951,1957,2563,2595`, `modules/install/ajax/ui.php:522`, `ajax/testEmailSettings.php:61,72`, `lib/ExtraFields.php:273,362`.
4. **Security acknowledged in code**: `lib/DatabaseConnection.php:482` says "FIXME: Security issue, this function is not enough for sanitizing user input" (on `escapeString`, the basis of all SQL building).
5. **Unchecked results and error handling**:
   - `lib/Users.php:708,762` says "Did the above query succeed? If not, fail."
   - `modules/install/ajax/ui.php:773,898-927` has "File exists?!" ×7.
   - `modules/careers/CareersUI.php:102,554,719,755` says "Generate valid XHTML error pages".
6. **Duplication acknowledged**: `modules/settings/SettingsUI.php:1271,2665` says "Put this in a private method. It is duplicated twice so far."
7. **Formatting**: "Fix ugly indenting - ~400 character lines = bad" ×8, at `lib/Candidates.php:1930`, `lib/Companies.php:748`, `lib/Contacts.php:809`, `lib/JobOrders.php:868`, `modules/activity/dataGrids.php:44`, `modules/home/dataGrids.php:45,206` and `modules/lists/dataGrids.php:40`.
8. **Dead routes**: `modules/home/HomeUI.php:75` says "FIXME: undefined function getAttachment()" and `modules/lists/ListsUI.php:71` says "FIXME: function show() undefined". Both are block-commented `case` branches.
9. **Hosted-CATS leftovers**: `lib/Session.php:208-214` ("Don't force logout for site 200. TODO: Remove me.") and `modules/import/ImportUI.php:1643` (`getSiteID() == 201`).

### 1.10 Commented-out code

- 73 single-line comments (`//` or `#`) contain code-shaped statements. `optional-updates/latest-sphinx-search/Search.php` has 31 of them and `modules/candidates/CandidatesUI.php` has 6.
- Only 4 runs of 3 or more consecutive commented code lines exist: `lib/DataGrid.php:500`, `constants.php:256`, and 2 in `optional-updates/`.
- Block-commented code:
  - routes at `modules/home/HomeUI.php:75-80` and `modules/lists/ListsUI.php:71-74`
  - wizard page definitions at `modules/wizard/WizardUI.php:52-…`, which leave `addPage()`, `addJsInclude()` and `setFinishURL()` referenced only in comments
  - 5 commented-out hook calls, e.g. `lib/License.php:715` `//if (!eval(Hooks::get('PARSER_ENABLE_CHECK'))) return;`
  - `config.php:295-325`, which holds commented-out `const JOB_ORDER_STATUS_*` alternatives
- Commented-out code is a minor issue here compared with **dead but uncommented code** (DEBT-015).

### 1.11 Legacy headers and SVN-era artefacts

These counts cover 429 first-party `.php/.tpl/.js/.css/.sh` files.

- 322 files carry an SVN `$Id: <file> <rev> <date> <author> $` keyword. Their dates are 2005 (2), 2006 (11) and 2007 (310). Example: `lib/Candidates.php:30` `$Id: Candidates.php 3813 2007-12-05 23:16:22Z brian $`.
- 214 files mention "Cognizo" (668 lines). 190 files carry the "CATS Public License Version 1.1a" header, which points to `http://www.catsone.com/` (e.g. `lib/Candidates.php:1-30`). `LICENSE.md` declares a dual licence: MPL 2.0 for OpenCATS code and CPL 1.1a for 2007 code.
- 11 entry files carry a hand-maintained `* CATS Version: 0.9.7.4` header: `index.php:6`, `ajax.php:6`, `careers/index.php:6`, `rss/index.php:6`, `xml/index.php:6`, and `modules/{activity,companies,contacts,home,joborders,lists}/dataGrids.php:6`.
- `lib/CATSUtility.php:98-131` `getBuild()` reads `.svn/entries`, so it always returns 0 in a git checkout. This is also the line that fails to parse on PHP 8. `lib/Session.php:115,131` uses the result for update detection.
- `scripts/svnkeywords.sh` (runs `svn propset svn:keywords`), `scripts/newversion.sh`, `scripts/killwhitespace.sh` and `scripts/countcode.sh` are SVN-era maintenance scripts. `svnkeywords.sh:20` references a `doc/DEVELOPMENT-GUIDELINES` that does not exist.

### 1.12 Formatting hygiene (first-party PHP)

| Metric | Value |
|---|---:|
| Files indented with spaces | 198 |
| Files containing tab-indented lines | 26 (575 lines) |
| Files mixing both | 25 |
| Lines mixing tab and space inside the indentation | 85 |
| Lines with trailing whitespace | 1,197 |
| CRLF files | 8 (`ajax/getPipelineDetails.php`, `ajax/getPipelineJobOrder.php`, `lib/License.php`, `lib/Tags.php`, `modules/candidates/CandidatesUI.php`, `modules/lists/ListsUI.php`, both `optional-updates/*`) |
| Files ending with a closing `?>` | 175 of 213 |
| Files with bytes after the final `?>` | 2: `ajax/getCandidateIdByPhone.php` (`"\n\n\n"`, so a stray newline is emitted into the AJAX XML response) and `lib/FileCompressor.php` (`"\n\n"`, which emits output when included and risks "headers already sent") |
| Files not starting with `<?php` | 7. Of these, 4 are empty and 3 are HTML-first pages (`installwizard.php`, `modules/install/notinstalled.php`, `modules/install/phpVersion.php`) |

---

## 2. PHP runtime compatibility debt

### DEBT-001: The application cannot parse or boot on any PHP 8.x runtime, so it runs only on EOL PHP 7.x
- **Severity:** CRITICAL
- **Finding:** The core bootstrap has a PHP 8 parse error, and the request path calls functions removed in PHP 8.0. Any PHP ≥ 8.0 therefore stops every entry point before it serves a page. As of the audit date, every supported PHP branch is 8.2 or later, so OpenCATS runs only on end-of-life PHP 7.x (external fact: PHP 7.4 reached EOL in Nov 2022 and 8.1 in Dec 2025). These are layered blockers: fixing one exposes the next.
- **Evidence:**
  1. **Parse error in a file every entry point includes.** `lib/CATSUtility.php:108` `if ($data{0} === '<')` and `:122` `if ((int) $data{0} > 6 && (int) $data{0} < 9)` → `php -l`: "syntax error, unexpected token "{" … line 108". The file is included at `index.php:61`, `ajax.php:43`, `careers/index.php:38`, `rss/index.php:37`, `xml/index.php:38` and `QueueCLI.php:40`.
  2. **Removed functions in the bootstrap.** `index.php:93` `if (get_magic_quotes_runtime())` and `:99` `if (get_magic_quotes_gpc())`, with the same calls at `ajax.php:50,56` and `QueueCLI.php:59,65`. On PHP 8.4 this raises "Error: Call to undefined function get_magic_quotes_gpc()" (verified).
  3. **List views break.** `lib/DataGrid.php:1292` `implode($selectSQL, ','."\n")`, plus `:1299`, `:1328` and `:1329`. On PHP 8.4 this raises "TypeError: implode(): Argument #1 ($separator) must be of type string, array given" (verified). `_getData()` is called for every DataGrid.
  4. **Uploads and import break.** `lib/Attachments.php:944` and `modules/import/ImportUI.php:495` call `get_magic_quotes_gpc()`.
  5. **Graphs and PDF reports break.** `lib/GraphGenerator.php:43` includes `lib/artichow/AntiSpam.class.php`, which fails to parse at `:63`. `modules/reports/ReportsUI.php:414` includes `lib/fpdf/fpdf.php`, which fails to parse at `:434`.
  6. **Failure path when a job order cannot be saved.** `src/OpenCATS/Entity/JobOrderRepositoryException.php:2` fails to parse (see DEBT-009).
- **Impact:** Operators must keep a PHP 7.x runtime that no longer receives security fixes. Any hosting upgrade takes the application down completely. The CI pipeline (DEBT-002) hides all of this. The PHP 8 blockers overlap with ARCH-001 and PERF (§9 of PERFORMANCE_AUDIT.md).
- **Recommendation:** Treat PHP 8 compatibility as a tracked work item with a mechanical first pass:
  1. Replace `$data{0}` with `$data[0]` at `lib/CATSUtility.php:108,122`. Better, delete `getBuild()`'s `.svn/entries` logic entirely (DEBT-022).
  2. Delete the magic-quotes blocks at `index.php:92-107`, `ajax.php:49-60` and `QueueCLI.php:58-70`, and the checks at `lib/Attachments.php:944`, `modules/import/ImportUI.php:495` and `lib/InstallationTests.php:185`. Magic quotes has not existed since PHP 5.4.
  3. Swap the `implode` arguments at `lib/DataGrid.php:1292-1329`.
  4. Fix or replace the vendored libraries (DEBT-016): patch the `{}` offsets or move to maintained FPDF and graph libraries.
  5. Then run the whole tree under PHP 8.2/8.3/8.4 with `error_reporting=-1` and address the runtime deprecations listed in DEBT-003.

### DEBT-002: CI, Docker and the installer are pinned to or unaware of PHP versions, and CI lint covers only `src/`
- **Severity:** HIGH
- **Finding:** Nothing in the build detects DEBT-001:
  - The only CI that runs (GitHub Actions) uses a single-entry PHP matrix of 7.2.
  - Its lint step checks only the 24 files under `src/`.
  - Both Docker images are PHP 7.2.
  - The dead Travis file claims 8.0 and 8.2.
  - `composer.json` declares no `php` platform constraint.
  - The installer checks only for PHP ≥ 5.
- **Evidence:**
  - `.github/workflows/ci.yml:21` `php-version: ['7.2']`
  - `.github/workflows/ci.yml:44` `run: find src -name "*.php" -print0 | xargs -0 -n1 php -l`
  - `.github/workflows/ci.yml:48` `composer audit || true`
  - `.github/workflows/ci.yml:92` `fail_on_failure: false`
  - `docker/docker-compose.yml:14` and `docker/docker-compose-test.yml:14` `image: opencats/php-base:7.2-fpm-alpine`
  - `.travis.yml:17-20` `php: - 7.2 - 8.0 - 8.2`. Travis does not run (see DEBT-018), and the code cannot pass on 8.x.
  - `composer.json` has no `"php"` key under `require`. `composer.json:5` pins `"phpunit/phpunit": "^7.5.7"`, a line that supports PHP 7.1–7.3 (external fact).
  - `installwizard.php:12-17` checks `if ($phpVersionParts[0] >= 5)`. `lib/InstallationTests.php:164` checks `version_compare(PHP_VERSION, '5.0.0', '>=')`, and `modules/install/phpVersion.php:20` says "OpenCATS Requires PHP 5 or better."
  - The CI lint also cannot catch `src/OpenCATS/Entity/JobOrderRepositoryException.php`. Under PHP 7.2 the statement `namespace \OpenCATS\Entity;` is likely parsed as an expression statement (a relative constant fetch). **INFERENCE**: not verified on 7.2 in this environment.
- **Impact:** PHP 8 regressions can merge silently. Operators receive no warning at install time. The test suite cannot move forward because the PHPUnit 7 pin blocks PHP 8.
- **Recommendation:**
  - Add a matrix with `['7.4','8.2','8.3','8.4']`, allowing failures on 8.x until DEBT-001 is fixed.
  - Change the lint step to `git ls-files '*.php' '*.tpl' | grep -v '^lib/simpletest/test/test_with_parse_error.php' | xargs -n1 php -l`.
  - Add `"php": ">=7.4"`, and later `">=8.2"`, to `composer.json`, and make `lib/InstallationTests.php:164` enforce the same range.
  - Upgrade PHPUnit to a PHP 8-capable major version.

### DEBT-003: Dynamic properties are a core mechanism, and other PHP 8.x deprecations remain
- **Severity:** HIGH
- **Finding:** The template layer passes data by creating properties on the `Template` object at runtime. The DataGrid family, the graph classes and several controllers also assign properties they never declare. PHP 8.2 emits a deprecation for each such assignment (verified on 8.4), and PHP 9 is expected to turn it into an Error.
- **Evidence:**
  - `lib/Template.php:64-67`:
    ```php
    public function assign($propertyName, $propertyValue)
    {
        $this->$propertyName = $propertyValue;
    }
    ```
    There are **878** `->assign(` call sites in first-party PHP. `lib/Template.php:77-80` `assignByReference` does the same by reference.
  - `notes/dynprops.php` found **178 undeclared assigned properties in 28 classes**. The base `DataGrid` declares only `$_rs`, `$_parameters`, `$_instanceName`, `$_currentColumns` and `$_defaultColumns` (`lib/DataGrid.php:227-232`), but assigns among others:
    - `$this->_classColumns` (49 sites, first at `lib/DataGrid.php:877`)
    - `_currentPage` (`:533`), `_totalPages` (`:534`), `globalStyle` (`:568`), `_totalEntries` (`:1338`)
  - Every DataGrid subclass also assigns undeclared properties: `lib/Candidates.php:1933-1938`, `lib/Companies.php:751-756`, `lib/Contacts.php:812-817`, `lib/JobOrders.php:871-876` and `modules/*/dataGrids.php`, e.g. `modules/candidates/dataGrids.php:13-22`.
  - `lib/GraphGenerator.php:65-66,137-138,204-207,287-289,379-382` (`$this->width`, `$this->height`, `$this->colorArray`).
  - Controllers: `modules/import/ImportUI.php:230,249,263,280`, `modules/settings/SettingsUI.php:65` (`_realAccessLevel`), `modules/toolbar/ToolbarUI.php:214-215` and `src/OpenCATS/UI/QuickActionMenu.php:13`.
  - Other deprecations:
    - `strftime` ×5 (`lib/DateUtility.php:148,472,476,480`, `lib/Calendar.php:575`)
    - `utf8_encode` ×2 (`lib/DocumentToText.php:424,515`)
    - `libxml_disable_entity_loader` (`lib/DocumentToText.php:415`)
    - optional-before-required parameters ×6 (§1.6)
- **Impact:** After DEBT-001 is fixed, logs will flood with deprecations on every page. Every template and grid breaks on the next major PHP release. The template contract (which variables a template uses) is implicit and cannot be checked by tools.
- **Recommendation:**
  - Change `Template` to hold an `array $_vars` with `__get`/`__isset`, so templates keep working unchanged as `$this->foo`. That is one class and one change.
  - Declare the DataGrid properties (`_classColumns`, `_db`, `_assignedCriterion`, `_dataItemIDColumn`, `_tableWidth`, `_defaultAlphabeticalSortBy`, `ajaxMode`, `showExportCheckboxes`, `showActionArea`, `showChooseColumnsBox`, `allowResizing`, `defaultSortBy`, `defaultSortDirection`, `dateCriterion`, `_currentPage`, `_totalPages`, `_totalEntries`, `_totalColumnWidths`, `globalStyle`) as `protected` on `lib/DataGrid.php`.
  - Use `#[\AllowDynamicProperties]` only as a stop-gap.
  - Replace `strftime` with `date()`/`IntlDateFormatter`, and `utf8_encode` with `mb_convert_encoding(..., 'UTF-8', 'ISO-8859-1')`.

---

## 3. Architecture debt

### DEBT-004: Extension model based on `eval()`, with authorization delivered through it
- **Severity:** HIGH
- **Finding:** Almost every controller action, and many library methods, begin with `if (!eval(Hooks::get('NAME'))) return;`. `Hooks::get()` concatenates PHP code strings stored in `$_SESSION['hooks']` and returns them to be `eval`ed. There are 251 distinct hook names, but only 10 are implemented, all in one module. Those 10 are how the "careerportal" user category is kept out of modules, so part of authorization lives in PHP strings copied into the session.
- **Evidence:**
  - `lib/Hooks.php:52-72`:
    ```php
    $hooks = @$_SESSION['hooks'];
    ...
    return $hookCommands . ' return true;';
    ```
  - Hook sites: 267 `eval(Hooks::get(...))` in PHP plus 11 in `.tpl`, for 278 in total. There are **251** distinct hook names across PHP and `.tpl`.
  - Hooks are populated from each module's `getHooks()` during module discovery (`lib/ModuleUtility.php:276-280,296`), or from an unserialized cache file (`lib/ModuleUtility.php:207-212`, `unserialize(file_get_contents('modules.cache'))`).
  - Only `modules/settings/SettingsUI.php:84-127` defines hooks, and it defines 10:
    - `TEMPLATE_UTILITY_EVALUATE_TAB_VISIBLE`, `HOME` and `SETTINGS_DISPLAY_PROFILE_SETTINGS`
    - 7 `*_HANDLE_REQUEST` hooks, e.g. `:120` `'CLIENTS_HANDLE_REQUEST' => 'if ($_SESSION[\'CATS\']->hasUserCategory(\'careerportal\')) $this->fatal("' . ERROR_NO_PERMISSION . '");'`
  - These guard only companies, contacts, calendar, joborders, candidates, activity and reports (`CompaniesUI.php:71`, `ContactsUI.php:81`, `CalendarUI.php:57`, `JobOrdersUI.php:96`, `CandidatesUI.php:83`, `ActivityUI.php:61`, `ReportsUI.php:53`). `LISTS_HANDLE_REQUEST` (`modules/lists/ListsUI.php:67`) is evaluated but never defined.
  - `ajax.php:118` also runs `eval(Hooks::get('AJAX_HOOK'))`.
- **Impact:**
  - **Cost:** about 278 `eval` calls on hot paths, and every one compiles a string on each request. PHP's opcache does not cache `eval`ed code.
  - **Maintainability:** 241 hook names are dead indirection. Static analysis cannot see through `eval`, and IDE navigation breaks.
  - **Security:** access control for careerportal users depends on per-session code strings, and anything that can write `modules.cache` gets code execution. See SEC-011 and ARCH-004.
- **Recommendation:**
  - Replace the careerportal hooks with an explicit check in `UserInterface` (e.g. `if ($_SESSION['CATS']->hasUserCategory('careerportal') && !in_array($this->_moduleName, ['settings'])) $this->fatal(...)`) plus the tab filter in `TemplateUtility.php:612-620`.
  - Then delete `lib/Hooks.php`, the `_hooks` plumbing in `lib/UserInterface.php:51,94-97` and `lib/ModuleUtility.php:276-296`, and all 278 `eval(Hooks::get(...))` lines. A mechanical `sed` works because every site has the same shape.
  - If extension points are needed later, use a typed event dispatcher.

### DEBT-005: Code-as-data elsewhere, with DataGrid render and filter strings, migrations, and wizard and installer code run through `eval()`
- **Severity:** HIGH
- **Finding:** Besides hooks, the application stores executable PHP as strings in arrays, the database schema list and the session, and runs them with `eval`.
- **Evidence:**
  - **DataGrid column definitions.** 238 lines across first-party PHP define `pagerRender`, `exportRender`, `filterRender`, `filterHavingRender` or `sortableColumn` strings, including 82 `pagerRender` definitions in 9 files. They are evaluated at `lib/DataGrid.php:1206,1211` (building WHERE/HAVING), `:1441` (export), `:1530` and `:1912` (cell rendering). One example (`lib/Candidates.php:1943`) mixes an authorization check, session access and HTML in one string:
    ```php
    'pagerRender' => 'if ($rsData[\'duplicatePresent\'] == 1 && $_SESSION[\'CATS\']->getAccessLevel(\'candidates.duplicates\') >= ACCESS_LEVEL_SA)
    ```
  - **Migrations.** `modules/install/Schema.php` holds 195 migrations in one 1,303-line array (`CATSSchema::get`, `:31`). 25 of them are `'PHP:…'` strings executed by `lib/ModuleUtility.php:538-542` (`$PHPCode = substr($sql, 4); eval($PHPCode);`), and some still call the removed `mysql_real_escape_string` (`Schema.php:725,1236`).
  - **Wizard.** `modules/wizard/WizardUI.php:179-182` runs `eval($_SESSION['CATS_WIZARD']['pages'][$requestPage]['php'])`.
  - **Installer.** `modules/install/ajax/ui.php:544,551,1162` evaluate `installCode`/`removeCode`/`detectCode`.
  - **Pointless `eval` in place of variable variables:**
    - `modules/careers/CareersUI.php:280,285` `eval('$'.$field.' = trim($_POST[\''.$field.'\']);');` and `:1272`
    - `lib/ArrayUtility.php:101` `eval('return ' . $function . '($index);')`
    - `lib/QueueProcessor.php:210` `eval (sprintf('$curTask = new %s();', $taskName));`
  - **Unused `eval` hooks.** `lib/Template.php:85-88,123-126` supports `addFilter()`, which has 0 callers. `ajax.php:108,125-128` `$filters` is always empty.
- **Impact:** This logic is invisible to linters, static analysis, refactoring tools and coverage. SQL fragments built inside strings cannot be parameterized, and every `eval` is a latent code-injection sink (SEC-011, ARCH-004). It also blocks any move to a template engine or query builder.
- **Recommendation:**
  - Convert DataGrid render strings to closures, e.g. `'pagerRender' => fn(array $rsData) => ...`, and call them directly. PHP ≥ 7.4 supports this, and the change is mechanical per column.
  - Replace the variable-variable `eval`s with arrays (`$fieldValues[$field]`) and `new $taskName()`.
  - Freeze `Schema.php`: new migrations should be versioned SQL or PHP classes run by a CLI (see DEBT-017).
  - Delete `Template::addFilter()` and the `$filters` loop in `ajax.php`.

### DEBT-006: God classes and god methods
- **Severity:** HIGH
- **Finding:** A few very large classes each own many responsibilities: routing, validation, authorization, orchestration, HTML generation and sometimes SQL. Complexity is concentrated in their request dispatchers.
- **Evidence:** A per-file responsibility matrix (`grep -c` of SQL keywords, HTML tags, `echo`, superglobals, `$_SESSION`, hooks):

  | File | LOC | methods | SQL lines | HTML-tag lines | `echo` | `$_GET/POST/REQUEST/…` | `$_SESSION` | hooks |
  |---|---:|---:|---:|---:|---:|---:|---:|---:|
  | `modules/settings/SettingsUI.php` | 3842 | 72 | 0 | 19 | 58 | 170 | 118 | 11 |
  | `modules/candidates/CandidatesUI.php` | 3582 | 38 | 3 | 15 | 2 | 127 | 18 | 37 |
  | `lib/DataGrid.php` | 2649 | 41 | 11 | 67 | 121 | 13 | 10 | 0 |
  | `lib/Candidates.php` (3 classes: `Candidates`, `CandidatesDataGrid`, `EEOSettings`) | 2473 | 34 | 148 | 13 | 0 | 0 | 5 | 0 |
  | `modules/careers/CareersUI.php` | 1794 | 12 | 1 | 152 | 6 | 115 | 0 | 2 |
  | `lib/TemplateUtility.php` | 1245 | 25 | 0 | 98 | 158 | 6 | 31 | 10 |
  | `lib/Search.php` (9 classes) | 2096 | 37 | 96 | 4 | 0 | 0 | 6 | 7 |

  - `SettingsUI::handleRequest` (`modules/settings/SettingsUI.php:224-893`, 670 lines, ≈CC 169) is a 51-case `switch` with 56 inline access-level checks.
  - `CareersUI::careersPage` (`modules/careers/CareersUI.php:71`, 900 lines, ≈CC 168) builds the public portal by `str_replace`ing custom tags with HTML strings. At `:225-232`, for example, `'<input name="firstName" … value="' . $candidate['firstName'] . '" />'` is spliced in without escaping (see SEC-005).
  - `DataGrid` in one class:
    - reads request parameters (`lib/DataGrid.php:246-256,295-301,382-398,2353-2359`)
    - reads and writes session state (`:282,324,562,912,1031`)
    - builds SQL (`:1040-1339`)
    - `eval`s render strings (§DEBT-005)
    - echoes HTML and JavaScript directly (120 `echo`s, e.g. `:709-869`, `:1588-1650`)
    - `die()`s on configuration errors (`:407,420,440,483,1490,2223`)
  - Across the codebase: 17 functions exceed 300 lines, 13 have CC above 50, and 143 have CC above 10 (§1.4).
- **Impact:** These files are where most changes land (see §8 Hotspots). They cannot be unit-tested without a database, a session and output buffering. Merge conflicts and regressions cluster in them, and extracting an API or a new UI means untangling them first. This matches ARCH-011.
- **Recommendation:**
  - Split by responsibility, starting where change is frequent:
    1. **`SettingsUI`**: split into per-area controllers (administration, users, career portal, e-mail, EEO, extra fields). Its `case` groups already map onto the templates.
    2. **`DataGrid`**: separate a query builder (`_getData`), a renderer (`draw`, `drawHTML…`) and a state store (session and request parameters).
    3. **`CareersUI::careersPage`**: extract the tag-substitution engine into a class with escaping by default.
  - Put a complexity budget (e.g. PHPMD or `phpstan` with a cognitive-complexity rule) on new code only.

### DEBT-007: Business logic in controllers, duplicated and divergent
- **Severity:** HIGH
- **Finding:** Domain rules live in UI controllers and are copy-pasted across modules. The copies have already drifted, so behaviour depends on the entry point.
- **Evidence:**
  - **Status-change rule in a controller.** Placing a candidate decrements the job order's openings in `modules/candidates/CandidatesUI.php:3088-3100`, not in `Pipelines::setStatus()` (`lib/Pipelines.php:294`):
    ```php
    if ($statusID == PIPELINE_STATUS_PLACED && is_numeric($data['openingsAvailable']) && $data['openingsAvailable'] > 0)
    { $jobOrders = new JobOrders($this->_siteID); $jobOrders->updateOpeningsAvailable($regardingID, $data['openingsAvailable'] - 1); }
    ```
    Any other caller of `setStatus()` (a future API, import or queue task) would skip it.
  - **A controller instantiating another controller.** `modules/joborders/JobOrdersUI.php:1406,1550` `include_once(LEGACY_ROOT . '/modules/candidates/CandidatesUI.php'); $candidatesUI = new CandidatesUI(); $candidatesUI->publicAddActivityChangeStatus(...)`.
  - **Divergent duplicate of the status-change dialog preparation.**
    - `JobOrdersUI::addActivityChangeStatus` (`modules/joborders/JobOrdersUI.php:1419-1537`) applies the site's "status change sends e-mail" settings (`:1459-1467`, `new MailerSettings(...)`, `unserialize($mailerSettingsRS['candidateJoborderStatusSendsMessage'])`).
    - The equivalent `CandidatesUI::addActivityChangeStatus` (`modules/candidates/CandidatesUI.php:1658-1840`) does not. `MailerSettings` appears nowhere in `CandidatesUI.php`.
    - `diff -w` of the two blocks shows 122 differing lines out of about 300.
    - So the e-mail checkbox default for the same pipeline status differs between the Job Order screen and the Candidate screen. The setting is configured in `modules/settings/EmailSettings.tpl:65-71`.
  - **Ownership-assignment e-mail block copied 8×.** It appears at `CompaniesUI.php:635,768`, `JobOrdersUI.php:840,1054`, `CandidatesUI.php:1128,1266` and `ContactsUI.php:629,761`. `diff -w` of `JobOrdersUI.php:1040-1095` against `CompaniesUI.php:755-805` differs only in entity names and placeholder tokens (`%JBOD…%` vs `%CLNT…%`).
  - **URLs built from `Host` with a hard-coded scheme, 8×.** `'http://' . $_SERVER['HTTP_HOST'] . substr($_SERVER['REQUEST_URI'], …)` appears at `lib/CATSUtility.php:295`, `CompaniesUI.php:790`, `JobOrdersUI.php:1081`, `CandidatesUI.php:1290`, `ContactsUI.php:787` and `CareersUI.php:1506,1570,1573`. This breaks under HTTPS and allows Host-header injection into e-mails.
  - **HTML in controllers.** `CandidatesUI.php:3242-3259` builds `$eventHTML`/`$notificationHTML` strings.
- **Impact:** Duplication leads to inconsistent behaviour, as the e-mail default shows. Adding an API or background job would mean re-implementing controller-only rules, and each fix must be applied up to 8 times.
- **Recommendation:**
  - Create a small service for "change pipeline status", owning `setStatus`, the openings adjustment, activity creation, event scheduling and the status e-mail, and call it from both controllers. Delete `CandidatesUI::publicAddActivityChangeStatus` as a cross-controller entry point.
  - Extract `OwnershipNotifier::notify($entityType, $id, $newOwnerId)` to replace the 8 blocks.
  - Build absolute URLs from a configured base URL, not from `HTTP_HOST`.

### DEBT-008: Global state (session god object, DB singleton, statics), no DI and no interfaces
- **Severity:** HIGH
- **Finding:** Library code reaches into `$_SESSION['CATS']` (a serialized `CATSSession` object) and the `DatabaseConnection` singleton instead of receiving dependencies. The singleton itself reads the session. Production code declares no interfaces. Collaborators are created with `new` or reached through static utility classes.
- **Evidence:**
  - **The singleton reads the session.** `lib/DatabaseConnection.php:53-75`:
    ```php
    public static function getInstance()
    { if (self::$_instance == null) { self::$_instance = new DatabaseConnection(); ... }
      // FIXME: Remove Session tight-coupling here.
      if (isset($_SESSION['CATS']) && $_SESSION['CATS']->isLoggedIn()) { self::$_instance->_timeZone = $_SESSION['CATS']->getTimeZoneOffset(); ...
    ```
  - **Counts.**
    - `DatabaseConnection::getInstance()`: 110 calls in 53 files.
    - `$_SESSION['CATS']`: 373 PHP and 13 template accesses.
    - 26 of 81 `lib/*.php` files read `$_SESSION`.
    - Cross-class static calls: 1,505 in production.
    - 21 classes use the static-only utility pattern (`private function __construct() {}`).
    - 413 `new X($siteID)` instantiations.
    - 0 interfaces, and 1 abstract class.
  - The code acknowledges the coupling in at least 21 FIXMEs (§1.9).
  - `index.php:61-69` must include `Session.php` and its dependencies before `session_start()` (`:74`) so that the session object can unserialize. The comments encode include-order dependencies (`/* Depends: MRU, Users, DatabaseConnection. */`).
- **Impact:**
  - Classes cannot be unit-tested in isolation. The existing unit tests cover only pure utilities (`src/OpenCATS/Tests/UnitTests/*`).
  - The design blocks CLI and queue reuse, because library methods assume a logged-in web session.
  - The design blocks horizontal scaling: session state carries behaviour.
  - Refactoring is risky because dependencies are invisible (ARCH-003, PERF-008).
- **Recommendation:**
  - Start by passing `DatabaseConnection` and a small `UserContext` (siteID, userID, timezone, date format) into constructors, with defaults that call the singleton or session, so callers do not have to change at once.
  - Remove the session read from `DatabaseConnection::getInstance()` first, because it affects every query.
  - Introduce interfaces only at the seams you need to fake in tests: DB, mailer, clock, session.

### DEBT-009: The PSR-4 `src/OpenCATS` layer is stalled at about 1% of runtime code and contains a broken exception class and a dead `catch`
- **Severity:** MEDIUM
- **Finding:** A second paradigm (namespaced entities, repositories and UI classes under Composer PSR-4) was started and then stopped. It is used in two write paths and four templates. Its "repositories" are the same `sprintf` SQL built on the global `DatabaseConnection`. Its exception handling is broken in both entities.
- **Evidence:**
  - Runtime `src/OpenCATS/{Entity,UI}` is 9 files and 859 LOC, about 1.0% of the 82,914 production LOC.
  - Usage outside `src/`:
    - `lib/Companies.php:3-4,106-109`: `Companies::add` only; `Companies::update` at `:134` still builds raw SQL.
    - `lib/JobOrders.php:4-6,130-133`: `JobOrders::add` only.
    - `lib/TemplateUtility.php:43` and `modules/{companies,joborders,candidates,contacts}/Show.tpl:3-4` use `QuickActionMenu` classes.
  - The autoloader is included through a CWD-relative path in four files: `lib/Companies.php:2`, `lib/JobOrders.php:2` and `lib/TemplateUtility.php:38` (`include_once('./vendor/autoload.php')`), and `lib/Mailer.php:43` (`require './vendor/autoload.php'`).
  - `src/OpenCATS/Entity/CompanyRepository.php:11-16` has the signature `__construct(\DatabaseConnection $databaseConnection)` / `persist(Company $company, \History $history)` and builds `sprintf("INSERT INTO company (...` at `:18`.
  - `src/OpenCATS/Entity/JobOrderRepositoryException.php:2` `namespace \OpenCATS\Entity;` fails to parse on PHP 8 (§1.6). On PHP 7 it would likely declare a global `JobOrderRepositoryException extends Exception` (**INFERENCE**). Either way, `new JobOrderRepositoryException(...)` at `src/OpenCATS/Entity/JobOrderRepository.php:117` cannot produce the class that `lib/JobOrders.php:133` catches.
  - `lib/Companies.php:109` `} catch(CompanyRepositoryException $e) {` has no `use OpenCATS\Entity\CompanyRepositoryException;`; the file imports only `Company` and `CompanyRepository` at `:3-4`. So it catches `\CompanyRepositoryException`, which does not exist, and the `return -1` fallback is dead.
  - `src/OpenCATS/Entity/JobOrderRepository.php:8,21,107` and `CompanyRepository.php:75,89` carry FIXMEs such as "It's way too…", "Is the OrNULL usage below correct?" and "History should be split in HistoryService…".
- **Impact:** Two ways of doing the same thing, with no migration path. Persistence failures on company or job-order creation escape as uncaught exceptions (or fatals on PHP 8) instead of the designed `-1` return. The layer adds cognitive load without buying testability. This matches ARCH-012.
- **Recommendation:**
  - Fix the two exception bugs now: correct the namespace line in `JobOrderRepositoryException.php`, extend `\Exception`, and add the `use` import in `lib/Companies.php`.
  - Then decide explicitly between two options:
    - (a) grow `src/` as the target architecture: PDO with prepared statements, repositories for all writes, autoloading for `lib/` through a Composer `classmap`
    - (b) retire it
  - If (a), add `"classmap": ["lib/", "modules/"]` to `composer.json` so `lib/` stops relying on 491 `include_once(LEGACY_ROOT …)` lines, and include `vendor/autoload.php` once, via `LEGACY_ROOT`, in the front controllers.

### DEBT-010: Latent defects found during the debt scan
- **Severity:** HIGH
- **Finding:** Several small but real defects sit in core classes. Static inspection confirms each one. Runtime impact is noted as inference where it applies.
- **Evidence:**
  1. **Saved column preferences are never restored.** `lib/Session.php:848-851`:
     ```php
     if (strlen($rs['columnPreferences']) > 0 && $this->_isDemo == false)
     {
         $this->_ = unserialize($rs['columnPreferences']);
     }
     ```
     It should assign `$this->_dataGridColumnPreferences` (declared at `:80` and read at `:1185,1234`). `setColumnPreferences()` (`:1200-1204`) then serializes the in-memory array, which is empty after login, back to the DB. **INFERENCE:** a user's preferences for other grids are overwritten on the first column change after each login. PERF-007 and PERFORMANCE_AUDIT also cite this.
  2. **Assignment instead of comparison.** `lib/DataGrid.php:257` `if ($index = 'exportIDs')` is always true, so any `<dynamic>` parameter is overwritten with `json_decode(urldecode(...))` of the request value.
  3. **No-op sanitiser on request-derived class and module names.** `lib/DataGrid.php:267-268` `preg_replace("[^A-Za-z0-9]", "", $indentifierParts[0])`. Here `[` and `]` act as regex delimiters, so the pattern matches only the literal prefix `A-Za-z0-9`. Verified: `preg_replace("[^A-Za-z0-9]", "", "../../x;Foo")` returns `"../../x;Foo"`. The values then flow into `include_once (sprintf('modules/%s/dataGrids.php', $module))` (`:280`) and `new $class(...)` (`:282`). `ajax.php:78,87-88` uses the correct `/[^A-Za-z0-9]/`, so this is copy-then-drift. Security impact is in API-007 and SEC.
  4. **DB error handling is dead code.** `lib/DatabaseConnection.php:183` and `:197` test `$this->_queryResult->connect_errno`, but `mysqli_query()` returns `mysqli_result|bool`, so both branches never fire and failed queries return `false` silently. No `mysqli_report()` call exists anywhere. On PHP ≥ 8.1 mysqli throws `mysqli_sql_exception` by default (external fact), so the whole "return false" contract changes to uncaught exceptions. See ARCH-009 and DB-002.
  5. **Undefined route.** `modules/toolbar/ToolbarUI.php:59-60` `case 'attemptLogin': $this->attemptLogin();` has no `attemptLogin` method in `ToolbarUI` or `UserInterface`, so the call is fatal.
  6. **Dead `catch` in `lib/Companies.php:109`** (DEBT-009).
- **Impact:** User-visible data loss (grid preferences), a request-controlled include and instantiation path, and silent DB failures that will become fatal on PHP 8.1+.
- **Recommendation:**
  1. Fix the one-line bugs: `Session.php:850` should assign `$this->_dataGridColumnPreferences`; `DataGrid.php:257` should use `===`; `DataGrid.php:267-268` should use `'/[^A-Za-z0-9]/'` plus an allow-list of grid classes.
  2. Rewrite the `DatabaseConnection::query()` error path to check `mysqli_errno($this->_connection)`, and set `mysqli_report(MYSQLI_REPORT_OFF)` explicitly until callers handle exceptions.
  3. Delete the toolbar route (DEBT-015).
  4. Add regression tests for each fix.

### DEBT-011: Configuration is PHP source, and the installer writes raw request values into PHP code
- **Severity:** HIGH
- **Finding:** All configuration is `define()` calls in a git-tracked `config.php`: 67 constants, including DB credentials, SMTP credentials and a licence key. Domain constants sit in `constants.php` (100 constants). The installer changes configuration by rewriting `config.php` line by line, splicing unescaped request values into PHP source. Environment variables are not supported (0 `getenv`/`$_ENV` uses).
- **Evidence:**
  - `config.php:31` `define('LICENSE_KEY','3163GQ-54ISGW-14E4SHD-ES9ICL-X02DTG-GYRSQ6');`
  - `config.php:40-43` DB credentials; `:221-223` SMTP credentials; `:188-197` tester and demo credentials; `:256` `define('CACHE_MODULES', false);`
  - `lib/CATSUtility.php:142-178` `changeConfigSetting()` writes `sprintf("define('%s', %s);", $name, $value)` into `config.php`.
  - `modules/install/ajax/ui.php:120,125,130,135` `CATSUtility::changeConfigSetting('DATABASE_USER', "'" . $_REQUEST['user'] . "'");` (the same pattern for the password, host and name).
  - `config.php` is included 21 times, partly through CWD-relative paths: `lib/CATSUtility.php:34` `include_once('./config.php')`, `lib/ACL.php:10`, `index.php:42`, `ajax.php:38`.
  - `test/config.php` is a near-copy of `config.php` (104 shared 8-line windows).
  - `optional-updates/latest-sphinx-search/config.php` is a fork that differs by 311 lines. The README tells operators to copy it over their configuration (`optional-updates/latest-sphinx-search/README.MD`).
- **Impact:**
  - Secrets live in version control and in every deployment.
  - Configuration drift is guaranteed across forks.
  - The installer is a code-injection vector: a `'` in a DB password breaks `config.php`, and a crafted value runs code (SEC and ARCH-014 cover this in depth).
  - Container deployment and 12-factor configuration are impossible without editing PHP.
- **Recommendation:**
  - Ship `config.php.dist`, and git-ignore `config.php`.
  - Have `config.php` read from `getenv()` with defaults. Add a `config.local.php` override if needed.
  - Change `changeConfigSetting` to `var_export($value, true)`, or better, write a data file (`.env`/JSON) instead of PHP.
  - Delete the optional-updates `config.php` fork.

### DEBT-012: Domain enumerations are hard-coded and duplicated
- **Severity:** MEDIUM
- **Finding:** Pipeline statuses, data-item types and access levels are PHP constants referenced across the code, while the same statuses also exist as rows in `candidate_joborder_status`. Some SQL bypasses even the constants and uses literal numbers. Site IDs from the hosted CATS service are hard-coded.
- **Evidence:**
  - `constants.php:120-130` defines 11 `PIPELINE_STATUS_*` constants (e.g. `define('PIPELINE_STATUS_PLACED', 800);`). The same statuses are seeded as data at `db/cats_schema.sql:267-…` (`insert into candidate_joborder_status … values (100,'No Contact',…)`). The constants are referenced 65× in 9 files.
  - Literal statuses in SQL:
    - `lib/Statistics.php:102,133,241,312,351,422,559,591` (`status_to = 400` / `= 800`)
    - `lib/Dashboard.php:85` (`status_to = 800`)
    - the same file also uses `PIPELINE_STATUS_PLACED` at `lib/Statistics.php:682,717,930`
  - `modules/settings/EmailSettings.tpl:65-71` hard-codes one checkbox per status.
  - `constants.php:57-65` defines `DATA_ITEM_*` constants, referenced 221× in 42 files. `ACCESS_LEVEL_*` (`constants.php:74-82`) is referenced 312×.
  - Magic site IDs:
    - `constants.php:187` `define('CATS_ADMIN_SITE', 180);`
    - `lib/Session.php:211` `if ($this->getSiteID() == 200)` ("TODO: Remove me.")
    - `modules/import/ImportUI.php:1643` `getSiteID() == 201`
    - `modules/install/Schema.php:109,126,205` `site_id != 180`
  - Job-order statuses can come from either config constants or class defaults (`lib/JobOrderStatuses.php:63-67` `if(defined('JOB_ORDER_STATUS_GROUP'))`, with commented-out alternatives at `config.php:295-325`).
- **Impact:**
  - Adding or renaming a pipeline status needs coordinated edits in PHP constants, DB seed data, templates and literal SQL. Statistics silently diverge if only the constants change.
  - Tenant-specific branches remain for a service that no longer exists.
- **Recommendation:**
  - Make `candidate_joborder_status` the single source of truth, load it once per request, and keep the constants only as named IDs.
  - Replace the literal `400`/`800` in `Statistics.php`/`Dashboard.php` with the constants now; this is a small change.
  - Delete the site-200 and site-201 special cases.

### DEBT-013: Duplicated code (13.7% of PHP and 20.8% of templates in exact clones), plus forked files
- **Severity:** MEDIUM
- **Finding:** Beyond the domain duplication in DEBT-007, there is measurable copy-paste. It is mostly per-module boilerplate, plus whole-file forks that are meant to be copied over the originals.
- **Evidence:** §1.8. Key items:
  - `optional-updates/latest-sphinx-search/Search.php` (2,487 LOC) is a fork of `lib/Search.php` (2,096 LOC). They share 835 clone windows and differ by 575 lines. The fork adds `byMultiple`, `byState`, `get_zip_codes` and more, uses the removed `create_function` (`:228,240,301,313`), and holds 18 FIXMEs.
  - The duplicate `modules/queue/tasks/lib/Task.php` is unused. If it were ever included next to `modules/queue/lib/Task.php`, the duplicate `class Task` would be fatal.
  - The Error.tpl, ErrorModal.tpl, validator.js and dataGrids.php preamble copies are in §1.8.
  - `modules/reports/NewDataItems.tpl` ↔ `Reports.tpl` share 212 clone windows.
- **Impact:** Fixes must be repeated (e.g. XSS escaping in each `Error.tpl`), and forks rot: the Sphinx fork is already PHP 8-incompatible independently of the main file.
- **Recommendation:**
  - Merge the Sphinx fork's additions into `lib/Search.php` behind `ENABLE_SPHINX`, then delete `optional-updates/`.
  - Delete `modules/queue/tasks/lib/Task.php`.
  - Replace the per-module `Error.tpl`/`ErrorModal.tpl` with one parameterized template in a shared directory.
  - Generate the `validator.js` per-field checks from one helper (`js/lib.js`).

### DEBT-014: Error handling and output mixing
- **Severity:** MEDIUM
- **Finding:** Errors are handled by printing HTML and calling `die()`, including inside library classes. Warnings are suppressed with `@`. Library classes `echo` markup directly. There is no exception model and no logging abstraction.
- **Evidence:**
  - Production first-party code has 153 `exit`/`die`. 31 are in `lib/*.php`:
    - `lib/DatabaseConnection.php:120,135,188,219`
    - `lib/DataGrid.php:407,420,440,483,1490,2223`, e.g. `die ('defaultSortBy not set.');`
    - `lib/GraphGenerator.php:75,147,217,260,304,356,392,426`
    - `lib/ModuleUtility.php:65,293,365,534`
    - `lib/UserInterface.php:271,305`
    - `lib/CommonErrors.php:279`
    - `lib/EmailTemplates.php:303`
  - `lib/DatabaseConnection.php:188-193` prints the failing SQL into the page: `'…MySQL Query Failed: ' . $error . "\n\n" . $query . "</pre>"` (SEC-012).
  - 178 `@` operators in production, concentrated in file I/O: `lib/Attachments.php` 22, `lib/FileUtility.php` 16, `lib/FileCompressor.php` 13. `lib/Hooks.php:59` has `$hooks = @$_SESSION['hooks'];`.
  - `lib/` class methods contain 445 `echo` statements (§1.5). `lib/InstallationTests.php` emits HTML through 71 of them.
  - `CommonErrors::*` accounts for 367 static calls. These are fatal-and-render helpers, not exceptions.
- **Impact:** Library code cannot be reused from CLI, queue or tests without side effects. Errors are lost when suppressed and leak details when printed. A consistent error page or API error format is impossible (ARCH-020).
- **Recommendation:**
  - Introduce domain exceptions thrown from `lib/`, with one top-level handler per front controller (`index.php`, `ajax.php`, `careers/index.php`) that renders or logs.
  - Replace the `die()` calls in `DataGrid`/`DatabaseConnection` first.
  - Ban new `@` and `echo` in `lib/` through a PHPCS rule (DEBT-018).

### DEBT-015: Dead code and commercial CATS remnants
- **Severity:** MEDIUM
- **Finding:** A significant amount of shipped code belongs to the defunct commercial CATS product (licensing, a hosted resume parser, a version-check phone-home, a browser toolbar, upsell links) or is never loaded.
- **Evidence:**
  - **Never included:** 7 `lib/` files, 4,181 LOC. No `include`, `new` or `::` references exist outside the files themselves (verified with `grep -lE "\b<Class>\b"` and `grep "new (Display|Profile)\b|(Display|Profile)::"`).
    - `lib/ControlPanel.php` (1,573 LOC). It references an undefined `EncryptionUtility` at `:563`.
    - `lib/Profile.php` (1,219), whose only includer is the dead `lib/Display.php:33`.
    - `lib/CBFUtility.php` (715)
    - `lib/Display.php` (233)
    - `lib/DefaultQuestionnaires.php` (206)
    - `lib/JavaScriptCompressor.php` (121)
    - `lib/Encryption.php` (114, uses the removed `mcrypt_*`)
  - **Neutered licensing.** `lib/License.php` (730 LOC, 32 FIXMEs): every validation path returns `true`, e.g. `:580-590` `isLicenseValid()` returns `true` in both branches, `:658-660` `validateProfessionalKey()` returns `true`, and `:687-705` `isParsingEnabled()` returns `true` on all 4 paths. `LicenseUtility::` is still called 55×.
  - **Hosted resume parser.** `lib/ParseUtility.php:53,60,135` is a SOAP client for `wsdl/parse.wsdl:78` `http://soap.resfly.com/parse.php`, `wsdl/status.wsdl:69` and `wsdl/keyCheck.wsdl:66` `http://catsone.com/keyCheck.php`, all over plain HTTP. It is gated by `config.php:51` `PARSING_ENABLED false`.
  - **Phone-home.** `lib/NewVersionCheck.php:109-122` POSTs `CatsVersion`, `CatsUID`, `PHPVersion`, `ServerSoftware`, `UserAgent`, `SiteName`, `activeUsers` and `licenseKey` to `www.catsone.com:80/catsnewversion.php`. It is called from `modules/home/HomeUI.php:95` and `modules/settings/SettingsUI.php:2399`, and disabled in the seeded schema (`db/cats_schema.sql:1044`, `disable_version_check` = 1).
  - **Browser toolbar module.** `modules/toolbar/ToolbarUI.php` (Monster resume capture, `storeMonsterResumeText` `:186`) has an undefined `attemptLogin` route (`:59-60`) and `_authenticationRequired = false` (`:46`).
  - **Upsell links to catsone.com.** They appear in `modules/settings/Professional.tpl` (8 links), `modules/candidates/Add.tpl:125`, `modules/import/MassImportStep1.tpl:95`, `modules/login/wizard/Reregister.tpl:20`, `modules/settings/SettingsUI.php:2721,3108,3116-3117,3151,3155-3156`, and `index.php:249` (`CATSUtility::transferURL('http://www.catsone.com')`).
  - **Maintenance script in the web root.** `rebuild_old_docs.php` builds SQL with `addslashes` (`:37`).
  - **In-app SimpleTest runner.** `modules/tests/` (3,019 LOC) plus `lib/simpletest` (31,112 LOC). It is superseded by PHPUnit and Behat according to `CHANGELOG.MD` ("Replace deprecated simpletest with phpunit and behat #123"), yet still ships and is loaded by module discovery (DEBT-017).
- **Impact:** About 40k LOC (including SimpleTest) to maintain, scan, and port to PHP 8 for no value. The remnants cause confusing UI, plain-HTTP outbound calls to third-party hosts if features are enabled, and extra attack surface (unauthenticated toolbar module, web-root script).
- **Recommendation:**
  - Retire, in one PR each:
    - the 7 dead `lib/` files
    - `License.php`/`LicenseUtility`: replace the 55 call sites with constants or removal
    - `ParseUtility` and `wsdl/`
    - `NewVersionCheck`: replace with a GitHub-releases check, or remove
    - `modules/toolbar/`
    - `modules/tests/` and `lib/simpletest/`
    - the catsone links and `Professional.tpl`
  - Move `rebuild_old_docs.php` to `scripts/` behind a CLI check (`PHP_SAPI === 'cli'`).

### DEBT-016: Unmaintained vendored libraries in `lib/`, a legacy front-end stack and IE-era code
- **Severity:** MEDIUM
- **Finding:** 142 third-party PHP files (47,400 LOC) are copied into `lib/` instead of being managed by Composer. Three of them fail on PHP 8. The front end ships jQuery 1.3.2 and IE-specific code.
- **Evidence:**
  - `lib/fpdf/fpdf.php:16` `define('FPDF_VERSION','1.53');` fails to parse at `:434` and uses `each()` at `:1285`.
  - `lib/artichow/AntiSpam.class.php:63` fails to parse, and `lib/artichow/*` has 3 compile-time deprecations.
  - `lib/simpletest/VERSION` is `1.1.0`, and the directory includes 11,868 lines of HTML documentation in English and French.
  - `lib/sphinx/sphinxapi.php` targets an old Sphinx protocol, with `lib/sphinx/conf/old/*`.
  - `js/jquery-1.3.2.min.js` (from 2009) is referenced once in templates.
  - `lib/BrowserDetection.php` (483 LOC; `detect()` is 424 lines, CC≈64), `ie.css`/`not-ie.css`, and 15 `document.all`/`attachEvent`/`ActiveXObject`/`navigator.appName` uses in `js/*.js` and `modules/*/*.js`.
  - Composer manages only `phpmailer/phpmailer` v6.8.0 and `ckeditor/ckeditor` 4.25.1 (`composer.lock`).
- **Impact:** These libraries cannot be updated or audited with `composer audit`, and they block PHP 8 (DEBT-001). An old jQuery carries known XSS CVEs (see SEC-019 and PERF-019).
- **Recommendation:**
  - Replace FPDF 1.53 with `setasign/fpdf` (1.8.x) through Composer. Only `ReportsUI.php:414` uses it.
  - Replace Artichow with a maintained chart approach, e.g. client-side charts or `jpgraph`. Only `lib/GraphGenerator.php` uses it.
  - Delete SimpleTest (DEBT-015).
  - Upgrade or remove jQuery 1.3.2, and remove `BrowserDetection`/`ie.css`.

### DEBT-017: Runtime module discovery, three migration mechanisms, and SimpleTest loaded in production
- **Severity:** MEDIUM
- **Finding:** On each new session, `ModuleUtility::getModules()` scans `modules/` and does four things:
  - includes every `*UI.php`, including `modules/tests/TestsUI.php`, which `require_once`s SimpleTest
  - instantiates every module
  - collects hooks into the session
  - applies pending schema migrations under a global DB advisory lock

  Separately, `db/upgrade-*.sql` files and `modules/install/scripts/*` form two more migration paths.
- **Evidence:**
  - `lib/ModuleUtility.php:152-156`: `if (!isset($_SESSION['modules']) …) { $modules = self::_refreshModuleList(); … }`
  - `:242-243` `$db->getAdvisoryLock('CATSUpdateLock', 120);`
  - `:255-262` includes each `*UI.php` (with the comment "FIXME: There has to be a better way to locate the UI filename", `:245`)
  - `:282` `self::processModuleSchema($moduleName, $module->getSchema());`
  - `modules/tests/TestsUI.php:43-46` `require_once('lib/simpletest/web_tester.php'); …`
  - `config.php:256` `define('CACHE_MODULES', false);`
  - The migration sources:
    - `modules/install/Schema.php` (195 entries, 25 of them PHP)
    - `db/upgrade-0.5.0-0.5.1.sql` … `db/upgrade-0.9.4-0.9.5.sql` (7 files)
    - `modules/install/scripts/114.php`, `150.php` and `359.sql`
- **Impact:** A slow first request per session (PERF-006). Schema changes can happen during an ordinary page view. The test framework is always loaded, and three migration systems drift apart (DB-006, DB-007, ARCH-005).
- **Recommendation:**
  - Replace discovery with a static module registry (a PHP array in `constants.php`, or a Composer `classmap`).
  - Move `processModuleSchema` into a CLI command (`php scripts/migrate.php`) that the installer and upgrades call.
  - Freeze `Schema.php` and `db/upgrade-*.sql`, and keep one migration directory from now on.

---

## 4. Documentation debt

### DEBT-019: Documentation is stale, external or missing
- **Severity:** MEDIUM
- **Finding:** Before this audit the repository had no `docs/` directory. It has no architecture description, ADRs, contributor guide or API reference. The changelog stopped in 2016. Inline documentation is patchy, and much of it is placeholder text.
- **Evidence:**
  - Top-level docs are `README.md` (965 bytes: links to the external site, forum, YouTube and issues), `README-testing.md` (CI notes), `Security.MD`, `issue_template.md`, `LICENSE.md` and `CHANGELOG.MD`.
  - `CHANGELOG.MD`'s newest entry is `**0.9.3-3 (2016-11-22)**`, while `constants.php:45` is `0.9.7.4`. The last change to `CHANGELOG.MD` in the history window is none (the last touch is before `8ad6c59`). Releases 0.9.4–0.9.7.4 are undocumented in-repo.
  - No ADRs, no `CONTRIBUTING`, and no coding standard. `scripts/svnkeywords.sh:20` references a `doc/DEVELOPMENT-GUIDELINES` that does not exist.
  - No API documentation for 32 AJAX endpoints (`ajax/*.php` 21 + `modules/*/ajax/*.php` 11, dispatched by `ajax.php:76-91`), the XML job feed (`xml/index.php`, `modules/xml/`), RSS or the careers portal. See API_AUDIT.md.
  - Docblock coverage of named functions (`notes/doccov.php`) is 41.4% overall: `lib/` 61%, `modules/` 8%, `src/` 1%. 141 of the docblocks and FIXMEs are "Document me" placeholders.
  - 1,076 of 1,124 `@param` tags (96%) have no parameter name (e.g. `@param string Name of setting to modify.` at `lib/CATSUtility.php:138`), so phpDocumentor and static analysers cannot use them.
  - `Security.MD` states "OpenCATS uses MD5 hashing to store passwords. This will be replaced in future versions". A known high-severity issue is documented, not tracked (SEC-001).
- **Impact:** Onboarding depends on tribal knowledge and an external wiki. No record explains the design choices (hooks, DataGrid strings, the `src/` layer), so the stalled paradigm shift (DEBT-009) has no stated target. Operators cannot tell what changed between 0.9.3 and 0.9.7.4.
- **Recommendation:**
  - Regenerate `CHANGELOG.MD` from tags and PR titles (e.g. `gh release list` / `git log v0.9.3..`).
  - Add `docs/ARCHITECTURE.md`, which exists now from this audit, and an `docs/adr/` directory with a first ADR stating the target architecture (DEBT-009 decision).
  - Document the AJAX and XML endpoints from API_AUDIT.md.
  - Replace "Document me" FIXMEs with real docblocks only when touching the method, not as a bulk exercise.

### DEBT-020: No type information, so static analysis has nothing to work with
- **Severity:** MEDIUM
- **Finding:** Production code declares almost no types, and the docblocks cannot substitute because parameter names are missing.
- **Evidence:** In production first-party code:
  - 7 native typed parameters
  - 0 return types
  - 0 `declare(strict_types=1)`
  - 96% of `@param` tags unnamed (DEBT-019)
  - 0 interfaces (DEBT-008)
  - template variables are dynamic properties (DEBT-003)
  - data moves as associative arrays from `getAllAssoc()`/`getAssoc()`
- **Impact:** Tools such as PHPStan/Psalm/Rector start at level 0 with thousands of findings. Refactors (DEBT-006/007) are unsafe without tests. The PHP 8 migration's type-juggling changes (string-to-number comparison, `count()` on non-countables) cannot be found statically. See Unknowns.
- **Recommendation:**
  - Add `phpstan.neon` at level 0 with a baseline, and raise the level on new and changed files only.
  - Add return and parameter types when touching a method.
  - Run Rector's `Php80`/`Php81` sets in dry-run mode to enumerate mechanical fixes.

### DEBT-021: Controllers and `lib/` emit HTML strings, and templates carry logic
- **Severity:** MEDIUM
- **Finding:** Presentation is spread across three layers: PHP templates with inline logic, controllers that build HTML strings, and `lib/` classes that `echo` markup. Escaping is opt-in.
- **Evidence:**
  - The 136 templates contain 5,285 `<?php` blocks.
  - Direct `<?php echo($this->x) ?>` appears 352× versus 857 uses of the escaping helper `$this->_()`. This is an approximate pattern count; see SEC-005 for XSS impact.
  - `modules/calendar/Calendar.tpl:590-593` builds a JS array from DB values inside the template.
  - Controllers: `modules/careers/CareersUI.php` has 152 lines with HTML tags, e.g. `:225-232`. `CandidatesUI.php:3252-3259` builds `sprintf('<p>An event of type <span class="bold">%s</span>…')`.
  - `lib/`: `TemplateUtility` has 158 `echo`s and `DataGrid` has 120. `lib/WebForm.php:1209` `getJavaScript()` is a 408-line PHP function that emits JavaScript.
  - DataGrid render strings (DEBT-005) emit HTML from `lib/Candidates.php` and `lib/JobOrders.php`, etc.
- **Impact:** Output escaping cannot be enforced in one place, a redesign or API needs output logic extracted from three layers, and front-end changes require PHP changes (ARCH-008).
- **Recommendation:**
  - Make `Template` escape by default. Adopting a small engine such as Twig or Plates with autoescape on newly touched screens is feasible, because templates are already isolated files.
  - Move HTML out of `CareersUI` into `.tpl` files.
  - Keep `lib/` free of output (the PHPCS rule in DEBT-014).

---

## 5. Build and tooling debt

### DEBT-018: Build and tooling (no quality gates, dead CI, misplaced workflows, incomplete release artefact, manual versioning)
- **Severity:** MEDIUM
- **Finding:** The repository has no static analysis, style or editor configuration and no JS tooling. It keeps a dead Travis pipeline, and two GitHub workflows live in a directory GitHub does not read. The active release job zips the repository without dependencies. Versioning is manual and has already broken once.
- **Evidence:**
  - **No tooling config.** `ls -a` and `git ls-files` find no `phpcs.xml`, `phpstan.neon`, `psalm.xml`, `rector.php`, `.php-cs-fixer*`, `.editorconfig`, `package.json`, ESLint or Prettier config, `phpunit.xml` or `.gitattributes`. Yet `.github/workflows/ci.yml:119` excludes a non-existent `phpunit.xml`.
  - **Dead Travis.**
    - `.travis.yml` (PHP 7.2/8.0/8.2 at `:17-20`) targets travis-ci.org, which shut down in 2021 (external fact), and deploys with an encrypted `api_key` (`:30`).
    - The active GitHub Actions `.github/workflows/ci.yml` replaced it.
    - `ci/package-code.sh:4-10` still depends on `$TRAVIS_TAG`.
    - `.travis.yml` was changed in 8 of the last 56 non-root commits, making it the most-churned file (§8). That is effort spent on a dead pipeline.
  - **Workflows that never run.** `.github/workflow/needs-reply.yml` and `.github/workflow/needs-reply-remove.yml` sit in `.github/workflow/` (singular). GitHub Actions only loads workflow files from `.github/workflows/` (external fact per GitHub documentation), so these have never run since they were added in `69de98e` and `e4e6004` (2022-09-02). `.github/no-response.yml` configures the Probot "no-response" app with a different label (`more-information-required`) than the needs-reply workflows (`needs-reply`).
  - **Release artefact without dependencies.** The `release` job (`.github/workflows/ci.yml:106-129`) runs `zip -r opencats-$tag.zip . -x "*.git*" "docker/*" "test/*" …` without `composer install --no-dev`. `vendor/` is git-ignored (`.gitignore:9,13`), yet runtime code hard-requires it (`lib/Mailer.php:43`, `lib/Companies.php:2`, `lib/JobOrders.php:2`, `lib/TemplateUtility.php:38`, and templates load `vendor/ckeditor/ckeditor/ckeditor.js`). **INFERENCE:** tag releases produced by this job lack PHPMailer, CKEditor and the autoloader (ARCH-002). `Security.MD` states releases since 0.9.7.2 are built with dev dependencies removed. That was true of the Travis `ci/package-code.sh:3` (`composer install --no-dev`), which no longer runs.
  - **Manual version bumps.**
    - Commits `1ba02b1` and `5781f41` (2024-04-23) edit the version in 12 files each.
    - `1ba02b1` set `define('CATS_VERSION', '-s');` (the output of `git show 1ba02b1 -- constants.php`), most likely a mis-invocation of `scripts/newversion.sh -s` (**INFERENCE**). The next commit fixed it.
    - Two commits are empty "Triggering CI/CD" commits (`d607279`, `0386702`).
  - **Weak gates.** `composer audit || true` (`ci.yml:48`) and `fail_on_failure: false` (`ci.yml:92`) mean vulnerable dependencies and failing tests do not fail the build.
  - **Unstable dev dependency.** `composer.json:7` `"behat/mink-extension": "dev-master"`.
  - **SVN-era scripts.** `scripts/svnkeywords.sh`, `newversion.sh`, `killwhitespace.sh`, `countcode.sh`/`countfilecode.awk`, and `scripts/index.php` (empty).
- **Impact:** No automated guard exists for style, types, complexity or PHP-version compatibility. Issue-triage automation silently does nothing. Release zips may be non-functional. Human error in versioning ships.
- **Recommendation:**
  1. `git mv .github/workflow/*.yml .github/workflows/` and delete `.github/no-response.yml`, or unify the labels.
  2. Delete `.travis.yml` and `ci/package-code.sh`, and add `composer install --no-dev --optimize-autoloader` before the `zip` in the release job.
  3. Add `.editorconfig`, a `phpcs.xml` (PSR-12, applied to changed files only), and `phpstan.neon` (level 0 plus baseline) as CI steps.
  4. Keep the version only in `constants.php:45`, remove the 11 duplicated `CATS Version:` headers, and derive the release version from the git tag.
  5. Make `composer audit` blocking for production dependencies.

---

## 6. Low-severity hygiene

### DEBT-022: SVN-era and Cognizo legacy headers, and a build number read from `.svn/entries`
- **Severity:** LOW
- **Finding:** File headers from SVN and CATS 2005–2007 dominate the codebase. They are noise, and they can mislead readers about ownership and licence.
- **Evidence:** §1.11:
  - 322 files with `$Id:` (310 dated 2007)
  - 214 files mention Cognizo
  - 190 CPL 1.1a headers pointing at catsone.com
  - 11 manual `CATS Version:` headers
  - `lib/CATSUtility.php:98-131` reads `.svn/entries`
- **Impact:** Header churn on every version bump (DEBT-018). The frozen `$Id` keywords are misleading, and a PHP 8 parse error sits inside SVN-only code.
- **Recommendation:**
  - Delete the `$Id` lines and the `CATS Version:` header lines in one mechanical commit.
  - Keep the licence headers but check the wording against `LICENSE.md`, which is a legal decision.
  - Replace `getBuild()` with the git tag or commit, or remove it.

### DEBT-023: Formatting hygiene
- **Severity:** LOW
- **Finding:** Formatting is inconsistent, and 2 files emit stray output after their closing tag.
- **Evidence:** §1.12:
  - 25 files mix indentation styles
  - 1,197 lines have trailing whitespace
  - 8 CRLF files
  - 175 files end with `?>`
  - `ajax/getCandidateIdByPhone.php` ends in `?>\n\n\n`, and `lib/FileCompressor.php` ends in `?>\n\n`
- **Impact:** Noisy diffs and a risk of "headers already sent" errors.
- **Recommendation:**
  - Add `.editorconfig` and `.gitattributes` (`* text=auto eol=lf`).
  - Remove closing `?>` from pure-PHP files with php-cs-fixer's `no_closing_tag`, in one formatting-only commit with its hash listed in `.git-blame-ignore-revs`.

---

## 7. Other small debt items (register only)

| ID | Item | Evidence |
|---|---|---|
| DEBT-024 | CWD-relative includes (35) make entry points depend on the working directory | `lib/CATSUtility.php:34` `include_once('./config.php')`; `lib/ACL.php:10`; `lib/Companies.php:2`; `modules/tests/TestsUI.php:43-46`; `lib/DataGrid.php:280` `include_once (sprintf('modules/%s/dataGrids.php', $module))` |
| DEBT-025 | Absolute URLs built as `'http://' . $_SERVER['HTTP_HOST']` (8×) | §DEBT-007 |
| DEBT-026 | Unused or dead extension points: `Template::addFilter()` (0 callers), `ajax.php` `$filters` (always empty), `assignByReference` (0 callers) | `lib/Template.php:77-88,123-126`; `ajax.php:108,125-128` |
| DEBT-027 | Optional-before-required parameters (6 first-party) | `lib/ActivityEntries.php:162`, `lib/DatabaseConnection.php:262`, `lib/Tags.php:112`, `lib/Profile.php:448,488` |
| DEBT-028 | Output after `?>` corrupts the AJAX response | `ajax/getCandidateIdByPhone.php` (trailing `\n\n\n`) |

---

## 8. Hotspots (size × churn × debt markers)

**Churn method.** Command: `git log --format= --name-only 8ad6c59..HEAD | grep . | sort | uniq -c | sort -rn`. The raw command requested (`git log --format= --name-only | sort | uniq -c | sort -rn | head -40`) gives the same ranking plus 1 for every file, because it counts the grafted root `8ad6c59`, which lists all 1,009 files. The history window is 2022-07-07 to 2026-01-26 and holds 56 non-root commits.

**Most-churned files (excluding the root):**
- `.travis.yml` 8
- `constants.php` 6
- `xml/index.php`, `composer.lock` 5 each
- 4 each: `rss/index.php`, `lib/Session.php`, `index.php`, `careers/index.php`, `ajax.php`, `modules/{lists,joborders,home,contacts,companies,activity}/dataGrids.php`
- 3 each: `lib/FileUtility.php`, `docker/docker-compose-test.yml`, `composer.json`, `Security.MD`
- 2 each: `modules/{joborders/JobOrdersUI,import/ImportUI,companies/CompaniesUI,careers/CareersUI,candidates/CandidatesUI}.php`, `lib/UserInterface.php`, `lib/Tags.php`, `ajax/getDataGridPager.php`

The 4-count on the `dataGrids.php` and entry files is mostly version-header bumps (e.g. `5781f41` touched 12 files, changing only `* CATS Version:`). That is itself debt (DEBT-018, DEBT-022), not feature work.

**Score.** `(LOC/100) × (1 + churn) × (1 + FIXME_TODO/10)`, over first-party PHP and templates:

| Rank | File | LOC | Churn | FIXME/TODO | eval | Score | Why it is a hotspot | Recent changes |
|---:|---|---:|---:|---:|---:|---:|---|---|
| 1 | `modules/settings/SettingsUI.php` | 3842 | 1 | 22 | 11 | 245.9 | Largest file; `handleRequest` 670 lines, CC≈169; 118 `$_SESSION`, 170 superglobal reads | 1 security-related commit |
| 2 | `modules/candidates/CandidatesUI.php` | 3582 | 2 | 9 | 37 | 204.2 | Owns the pipeline status rule (DEBT-007); 4 functions > 280 lines | `e7a8eeb` XSS restrictions; `e33fbde` city search fix |
| 3 | `lib/Session.php` | 1257 | 4 | 18 | 1 | 176.0 | Session god object, `$this->_` bug (`:850`), site-200 special case (`:211`), SVN build check | `1eb9a6f`, `f8b37c9`, `d6042a5`, `cf77174`, all cookie and session security fixes |
| 4 | `modules/careers/CareersUI.php` | 1794 | 2 | 10 | 5 | 107.6 | Public attack surface; 900-line `careersPage`, CC≈168; HTML in the controller; `eval` for variable variables | `b275bb1`, `1eb9a6f`, both XSS and security fixes |
| 5 | `modules/joborders/JobOrdersUI.php` | 1972 | 2 | 5 | 30 | 88.7 | Divergent status-dialog copy; instantiates `CandidatesUI` | |
| 6 | `lib/Candidates.php` | 2473 | 1 | 6 | 0 | 79.1 | 3 classes; 353-line grid definition with eval strings | |
| 7 | `modules/import/ImportUI.php` | 2104 | 2 | 2 | 32 | 75.7 | Raw SQL in the controller (`:1711-1748`), 12 `@`, magic quotes (`:495`) | |
| 8 | `optional-updates/latest-sphinx-search/Search.php` | 2487 | 0 | 18 | 7 | 69.6 | Stale fork with `create_function`; retire | |
| 9 | `lib/Search.php` | 2096 | 0 | 14 | 7 | 50.3 | 9 classes; 6 "Session dependencies suck" FIXMEs | |
| 10 | `lib/TemplateUtility.php` | 1245 | 1 | 7 | 11 | 42.3 | 158 `echo`s, 31 `$_SESSION` uses; loads the Composer autoloader via a relative path | |
| 11 | `modules/contacts/ContactsUI.php` | 1563 | 1 | 3 | 20 | 40.6 | Ownership-email copy; 67 clone windows shared with `CandidatesUI` | |
| 12 | `lib/DataGrid.php` | 2649 | 0 | 5 | 5 | 39.7 | PHP 8 `implode` blockers, dynamic properties, sanitiser bug; every list view depends on it | |

**Reading the hotspots.**
- The recent churn is almost entirely **security patching** (cookie and session, XSS escaping, upload allow-list) and **version bumps**. No refactoring commits appear in the window.
- The files attracting security fixes (`lib/Session.php`, `CareersUI.php`, `CandidatesUI.php`) are also the most complex and debt-dense. Each fix lands in a 1,200–3,600-line file without unit tests.
- `lib/DataGrid.php` and `constants.php` rank low on churn but high on blast radius: every list view and every module depends on them.

**Recommended first targets:**
1. `lib/DataGrid.php`, because it blocks PHP 8 and holds the sanitiser bug.
2. `lib/Session.php`, where security fixes concentrate and the `:850` bug sits.
3. `modules/candidates/CandidatesUI.php` together with `modules/joborders/JobOrdersUI.php`, to extract the status-change service (DEBT-007).
4. `modules/settings/SettingsUI.php`, to split the controller (DEBT-006).

---

## 9. Debt register

Effort is a **rough estimate** for one experienced PHP developer: **S** ≤ 3 days, **M** ≤ 3 weeks, **L** ≤ 3 months, **XL** > 3 months. Treatment: **fix** (targeted change), **refactor** (restructure while keeping behaviour), **rewrite** (replace the implementation), **retire** (delete).

| ID | Area | Description | Evidence | Severity | Effort (est.) | Treatment |
|---|---|---|---|---|---|---|
| DEBT-001 | Runtime | App cannot parse or boot on PHP 8.x: `{}` offsets, magic quotes, reversed `implode`, vendored parse errors | `lib/CATSUtility.php:108,122`; `index.php:93,99`; `lib/DataGrid.php:1292-1329`; `lib/GraphGenerator.php:43`; `modules/reports/ReportsUI.php:414` | CRITICAL | M (bootstrap S; full 8.x cleanup M) | fix |
| DEBT-002 | CI/Runtime | CI only on PHP 7.2; lint only on `src/`; no `php` constraint; installer checks ≥5 | `.github/workflows/ci.yml:21,44`; `docker/docker-compose*.yml:14`; `installwizard.php:12-17` | HIGH | S | fix |
| DEBT-003 | Runtime | Dynamic properties (878 `assign` sites; 178 properties in 28 classes); `strftime`/`utf8_encode` | `lib/Template.php:64-67`; `lib/DataGrid.php:227-232,877`; `lib/DateUtility.php:148` | HIGH | M | refactor |
| DEBT-004 | Architecture | `eval`-based hooks: 278 sites, 251 names, 10 implemented; careerportal authorization through hooks | `lib/Hooks.php:52-72`; `modules/settings/SettingsUI.php:84-127` | HIGH | M | retire (replace with explicit checks) |
| DEBT-005 | Architecture | Code-as-strings: DataGrid renderers (238 lines), 25 PHP migrations, wizard, installer, careers `eval` | `lib/DataGrid.php:1206,1211,1441,1530,1912`; `lib/ModuleUtility.php:542`; `modules/wizard/WizardUI.php:181` | HIGH | L | refactor (closures) |
| DEBT-006 | Architecture | God classes and methods (SettingsUI, CandidatesUI, DataGrid, CareersUI) | §1.3–1.4; `modules/settings/SettingsUI.php:224` | HIGH | XL | refactor (incremental) |
| DEBT-007 | Architecture | Domain rules in controllers; divergent duplicate status dialog; ownership e-mail ×8 | `modules/candidates/CandidatesUI.php:3088-3100`; `modules/joborders/JobOrdersUI.php:1459-1467,1550`; §DEBT-007 | HIGH | M | refactor (service extraction) |
| DEBT-008 | Architecture | Global state: session (386), singleton (110), statics (1,505); no DI or interfaces | `lib/DatabaseConnection.php:53-75`; §1.5 | HIGH | XL | refactor |
| DEBT-009 | Architecture | Stalled `src/` layer (~1%); broken exception namespace; dead `catch` | `src/OpenCATS/Entity/JobOrderRepositoryException.php:2`; `lib/Companies.php:109` | MEDIUM | S (bugs) / L (decision + expansion) | fix, then decide (refactor or retire) |
| DEBT-010 | Quality | Latent defects: `Session.php:850`, `DataGrid.php:257`, `DataGrid.php:267-268`, dead DB error path, toolbar route | as listed | HIGH | S | fix |
| DEBT-011 | Config | Config as tracked PHP with secrets; installer writes request data into PHP | `config.php:31,40-43`; `lib/CATSUtility.php:142-178`; `modules/install/ajax/ui.php:120-135` | HIGH | M | rewrite (env-based config) |
| DEBT-012 | Domain | Hard-coded pipeline statuses duplicated in DB and literal SQL; magic site IDs | `constants.php:120-130`; `lib/Statistics.php:102…591`; `lib/Session.php:211` | MEDIUM | S (literals) / M (data-driven) | fix → refactor |
| DEBT-013 | Duplication | 13.7% of PHP and 20.8% of templates in clones; Sphinx fork; duplicate `Task.php`; Error.tpl ×12 | §1.8 | MEDIUM | M | refactor / retire forks |
| DEBT-014 | Quality | `die` ×153, `@` ×178, `echo` in `lib` ×445; SQL echoed on error | `lib/DatabaseConnection.php:188-193`; §1.5 | MEDIUM | L | refactor |
| DEBT-015 | Dead code | 4,181 LOC never loaded; `License.php`; ParseUtility/resfly; NewVersionCheck; toolbar; SimpleTest runner; catsone links | §DEBT-015 | MEDIUM | M | retire |
| DEBT-016 | Dependencies | 47,400 LOC vendored (FPDF 1.53, Artichow, SimpleTest, sphinxapi); jQuery 1.3.2; IE code | `lib/fpdf/fpdf.php:16`; `js/jquery-1.3.2.min.js` | MEDIUM | M | rewrite (Composer and maintained libs) / retire |
| DEBT-017 | Architecture | Per-session module discovery with migrations under lock; 3 migration systems; SimpleTest loaded | `lib/ModuleUtility.php:152-156,242-282`; `modules/tests/TestsUI.php:43-46` | MEDIUM | M | refactor |
| DEBT-018 | Tooling | No linters or analysers; dead Travis; `.github/workflow/` never runs; release zip without `vendor/`; manual versioning | `.github/workflow/*.yml`; `.github/workflows/ci.yml:119`; commit `1ba02b1` | MEDIUM | S | fix |
| DEBT-019 | Docs | CHANGELOG stale since 2016; no ADRs, architecture or API docs; 141 "Document me"; 96% unnamed `@param` | `CHANGELOG.MD:5`; §DEBT-019 | MEDIUM | M | fix (write docs) |
| DEBT-020 | Quality | No types (7 typed params, 0 return types, 0 `strict_types`) | §DEBT-020 | MEDIUM | L (incremental) | refactor |
| DEBT-021 | Presentation | HTML in controllers and `lib/`; logic in templates; opt-in escaping | `modules/careers/CareersUI.php:225-232`; `lib/WebForm.php:1209` | MEDIUM | L | refactor / rewrite views |
| DEBT-022 | Hygiene | SVN `$Id` ×322, Cognizo ×214 files, manual version headers ×11, `.svn/entries` build check | §1.11 | LOW | S | retire |
| DEBT-023 | Hygiene | Mixed indentation, trailing whitespace, CRLF, output after `?>` | §1.12 | LOW | S | fix (automated) |
| DEBT-024 | Hygiene | 35 CWD-relative includes | `lib/CATSUtility.php:34`; `lib/ACL.php:10` | LOW | S | fix |
| DEBT-025 | Quality | `http://` + `HTTP_HOST` URL building ×8 | `lib/CATSUtility.php:295`; `modules/careers/CareersUI.php:1506,1570,1573` | MEDIUM | S | fix |
| DEBT-026 | Dead code | Unused `eval` extension points (`Template::addFilter`, `ajax.php` `$filters`) | `lib/Template.php:85-88,123-126`; `ajax.php:125-128` | LOW | S | retire |
| DEBT-027 | Runtime | Optional-before-required parameters ×6 | `lib/ActivityEntries.php:162`; `lib/Tags.php:112` | LOW | S | fix |
| DEBT-028 | Hygiene | Stray output after `?>` in an AJAX endpoint | `ajax/getCandidateIdByPhone.php` | LOW | S | fix |

**Suggested sequencing** (tied to the items above; each step unblocks the next):
1. **Stop the bleeding (S each):** DEBT-010 bug fixes, DEBT-002 CI matrix and full-tree lint, DEBT-018 workflow move and release `composer install`, DEBT-009 exception fixes.
2. **PHP 8 floor (M):** DEBT-001, then DEBT-003 (`Template` magic getter and DataGrid property declarations), DEBT-027, and DEBT-016 for FPDF and Artichow.
3. **Shrink the surface (M):** DEBT-015 and DEBT-013 retirements. These remove about 40k LOC including SimpleTest, plus `License.php` and the Sphinx fork, before any refactor.
4. **Remove eval (M–L):** DEBT-004 (hooks → explicit careerportal guard), then DEBT-005 (DataGrid closures).
5. **Structural (L–XL, incremental):** DEBT-007 status-change service, DEBT-011 env config, DEBT-008 constructor injection at DB and session seams, DEBT-006 splitting the hotspot controllers, all guarded by DEBT-020 static analysis on changed files.

---

## Facts vs Assumptions

**FACT (verified in code or by running PHP 8.4 in this environment):**
- `php -l` fails on `lib/CATSUtility.php:108`, `lib/artichow/AntiSpam.class.php:63`, `lib/fpdf/fpdf.php:434`, `lib/fpdf/font/makefont/makefont.php:18`, `src/OpenCATS/Entity/JobOrderRepositoryException.php:2` and `lib/simpletest/test/test_with_parse_error.php:5`. All 139 templates pass.
- On 8.4, `implode(array, string)` throws a TypeError and `get_magic_quotes_gpc()` is undefined (both executed as one-liners). `preg_replace("[^A-Za-z0-9]", …)` does not strip `../`, and dynamic property creation emits a deprecation.
- All counts in §1 (LOC, tokens, clones, markers, headers, formatting) come from the listed commands over tracked files at HEAD `d607279`.
- `Session.php:850` assigns `$this->_`; `DataGrid.php:257` uses `=`; `Companies.php:109` catches an unimported class. The `.github/workflow/` directory exists alongside `.github/workflows/`, and the release job has no `composer install` step.
- The 7 `lib/` files in DEBT-015 have no include or class references anywhere in tracked PHP or templates.

**External facts (platform documentation, not verifiable from the repo):**
- GitHub Actions reads workflows only from `.github/workflows/`.
- PHP EOL dates.
- The PHP 8.1 mysqli default error mode.
- travis-ci.org shutdown.
- PHPUnit 7's supported PHP range.

**INFERENCE or ASSUMPTION (labelled where used):**
- On PHP 7.2, `JobOrderRepositoryException.php` parses as an expression statement and declares a global class. Not run on 7.2.
- A user's saved grid column preferences are overwritten after login (DEBT-010.1). Derived from the code path, not reproduced.
- The release job produces zips without `vendor/`. The workflow was read, not executed.
- The botched `-s` version came from `scripts/newversion.sh -s`.
- The needs-reply workflows have never run. This follows from the directory rule. The Actions run history was not inspected.
- Effort estimates in §9 are judgement, not measurement.
- Clone percentages are lower bounds, because the detector finds only exact 8-line normalized windows.

---

## Unknowns / Needs Further Investigation

1. **Full PHP 8 runtime breakage beyond parse and removed-function errors.** Type juggling changes, such as string-to-number comparison, `count()` on `false`/`null` from failed queries, and passing `null` to string functions (deprecated 8.1), cannot be enumerated statically in untyped code. This needs the test suite run under PHP 8.x once DEBT-001 is fixed, plus a PHPStan level-0/1 run (the environment had no network-installed analysers).
2. **Whether CI is currently green.** Run history was not accessible. `fail_on_failure: false` and `composer audit || true` may mask failures.
3. **Which `optional-updates/` or `modules.cache` states exist in real deployments.** Operators who copied the Sphinx fork over `lib/Search.php` run a different, PHP 8-incompatible search.
4. **Careerportal user access to modules without the `*_HANDLE_REQUEST` hook implemented** (lists, attachments, import, export, graphs, xml, queue, wizard). This depends on the access level assigned to such users. It needs a runtime check (cross-ref SEC and ARCH-007).
5. **Actual usage of the hook points by third-party modules.** The analysis assumes no out-of-tree modules define hooks. If any exist, removing `Hooks` (DEBT-004) needs a deprecation period.
6. **Churn before 2022-07-07.** The clone is shallow. A full-history churn analysis (`git fetch --unshallow`) could change the hotspot ranking for the files that were stable in this window (`lib/DataGrid.php`, `lib/Search.php`).
7. **Whether `rebuild_old_docs.php` and `scripts/` are reachable over HTTP in typical deployments.** This depends on web-server config; the repo root `.htaccess` only disables indexes.

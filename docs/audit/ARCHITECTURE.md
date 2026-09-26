# OpenCATS — As-Built Architecture

**Scope.** This document describes how the OpenCATS code base at commit `d607279` actually works: its entry points, request lifecycle, module/hook/template machinery, data access, the newer `src/OpenCATS` layer, multi-tenancy, configuration, background processing, search, file storage, a short frontend overview, deployment, and PHP-version compatibility. It ends with architectural findings (ARCH-xxx). Security, database design, UX, performance, tests and dependencies are covered in depth by other audit documents; where this document touches those topics it does so only as far as the architecture needs, and says so.

## Method

- I read the bootstrap and core framework files line by line: `index.php`, `ajax.php`, `config.php`, `constants.php`, `careers/index.php`, `rss/index.php`, `xml/index.php`, `QueueCLI.php`, `installwizard.php`, `installtest.php`, `rebuild_old_docs.php`, `lib/ModuleUtility.php`, `lib/UserInterface.php`, `lib/Template.php`, `lib/Hooks.php`, `lib/Session.php`, `lib/ACL.php`, `lib/DatabaseConnection.php`, `lib/AJAXInterface.php`, `lib/QueueProcessor.php`, `lib/CATSUtility.php`, `lib/License.php`, `lib/NewVersionCheck.php`, and the relevant parts of `lib/TemplateUtility.php`, `lib/DataGrid.php`, `lib/Attachments.php`, `lib/DocumentToText.php`, `lib/Search.php`, `lib/DatabaseSearch.php`, `lib/Site.php`, `modules/*/…UI.php`, `modules/install/Schema.php`, `src/OpenCATS/**`, `docker/*.yml`, `.github/workflows/ci.yml`, `ci/package-code.sh`, `.travis.yml` and `composer.json`/`composer.lock`.
- I verified every line reference with `grep -n` or `sed -n`.
- **PHP lint:** `php -l` (PHP 8.4.19) run one file at a time over all 491 `*.php` and `*.tpl` files, and a second pass with `-d error_reporting=-1` to collect compile-time deprecations. Results are in the scratchpad notes (`lint.txt`, `lintwarn.txt`).
- **Pattern scans:** grep for functions and constructs that PHP 8 removed or deprecated (`get_magic_quotes_*`, `each(`, `create_function`, `mysql_*`, `$str{0}`, legacy `implode($array, $glue)`, `strftime`, `utf8_encode`, `mcrypt_*`, `libxml_disable_entity_loader`).
- **Behaviour checks:** small PHP 8.4 snippets in the scratchpad confirmed four behaviours: an undefined constant is an `Error`; property assignment on `null` is an `Error`; legacy `implode()` argument order throws `TypeError`; and `@mysqli_connect` throws `mysqli_sql_exception`.
- **Metrics:** LOC with `wc -l`; include graph by a static transitive include walk (Python, read-only); counts of hook call sites, `$_SESSION` references, `DatabaseConnection::getInstance` calls and ACL checks per module.
- Nothing in the repository was modified or executed, apart from `php -l`.

## Summary of Findings

| ID | Title | Severity |
|---|---|---|
| ARCH-001 | Application cannot boot on any supported PHP version (≥ 8.0); stack pinned to EOL PHP 7.2 | CRITICAL |
| ARCH-002 | Release/CI pipeline produces an artifact without `vendor/` although runtime hard-requires `./vendor/autoload.php`; CI lints only `src/` | HIGH |
| ARCH-003 | Pervasive global state: serialized `CATSSession` god-object + DB singleton used as service locators; no DI | HIGH |
| ARCH-004 | Executable PHP stored as strings (hooks, wizard pages, DataGrid renderers, `PHP:` migrations) and run via `eval()`, partly from `$_SESSION` | HIGH |
| ARCH-005 | Schema migrations run implicitly during request handling (any new session, including anonymous), with `eval` and removed `mysql_*` calls | HIGH |
| ARCH-006 | No single front controller: 8+ independent bootstraps; several web-reachable maintenance scripts with no auth/CLI guard | HIGH |
| ARCH-007 | Authorization is opt-in per action inside each module's `switch`; no central policy; AJAX endpoints only check "logged in" | HIGH |
| ARCH-008 | Template engine is raw PHP `include` with opt-in escaping; mixed "escape-on-input" vs "escape-on-output" data | HIGH |
| ARCH-009 | DB error handling is dead code on PHP 7.2 (errors silently swallowed) and bypassed on PHP ≥ 8.1 (uncaught exceptions) | HIGH |
| ARCH-010 | Data layer = hand-built SQL strings in table-gateway classes that also emit HTML and read `$_SESSION` | MEDIUM |
| ARCH-011 | God classes and god methods (SettingsUI 3,842 LOC, CandidatesUI 3,582, DataGrid 2,649, 30-parameter `Candidates::add`) | MEDIUM |
| ARCH-012 | `src/OpenCATS` PSR-4 layer is a thin, partially broken veneer (2 call sites; broken exception classes) | MEDIUM |
| ARCH-013 | Multi-tenancy is vestigial: `site_id` everywhere, but public portals hard-wired to the first site and attachment download bypasses the tenant filter | MEDIUM |
| ARCH-014 | Configuration is mutable PHP source with hard-coded defaults/secrets, rewritten at runtime from request data; no env support; config drift | HIGH |
| ARCH-015 | Module discovery (dir scan + include + instantiate 23 modules + DB lock + 23 `module_schema` SELECTs) runs on every new session; update detection depends on `.svn/entries` | MEDIUM |
| ARCH-016 | Background processing depends on an unprovisioned cron that calls a web-reachable `QueueCLI.php`; duplicated/inconsistent task framework | MEDIUM |
| ARCH-017 | Search is REGEXP/LIKE table scans (no FULLTEXT index); optional Sphinx is a 2007-era API plus a forked `Search.php` | MEDIUM |
| ARCH-018 | File storage inside the web root with 0777 dirs, Apache-only protection, `exec()`-based converters; ODT extraction broken | MEDIUM |
| ARCH-019 | Large amount of dead/legacy hosted-CATS code (license, toolbar, phone-home, 222 unused hooks, ~4.5k LOC unused lib files) | MEDIUM |
| ARCH-020 | Error handling by `die()`/HTML error pages; no exceptions, no logging facility | MEDIUM |
| ARCH-021 | Time-zone model: integer GMT offsets, no DST, SQL rewriting of `DATE_FORMAT()` | MEDIUM |
| ARCH-022 | Portal shims `include` a file chosen from `PHP_SELF`; `rss/index.php` is broken on every PHP version | MEDIUM |
| ARCH-023 | Include-order coupling, include cycles, and eager loading (~47 files / ~29k LOC reachable from `index.php` before a module loads) | MEDIUM |
| ARCH-024 | Frontend: global jQuery 1.3.2 + custom JS + submodal, CKEditor 4 from `vendor/`, IE conditional CSS | LOW |
| ARCH-025 | Docker setup is dev-only: third-party images not built from repo, PHP 7.2, unpinned MariaDB, phpMyAdmin auto-login published on 8080 | MEDIUM |

---

## 1. System Overview

OpenCATS is a server-rendered PHP monolith from about 2007 (CATS 0.9.x; `constants.php:45` has `define('CATS_VERSION', '0.9.7.4')`).

- It has no framework, router, container or ORM.
- All HTTP traffic enters through a handful of root scripts (mainly `index.php` and `ajax.php`).
- Pages are PHP classes named `*UI` inside `modules/<name>/`, discovered by scanning the directory.
- Persistence goes through a mysqli wrapper singleton (`lib/DatabaseConnection.php`) and about 80 procedural "library" classes in `lib/`.
- Output comes from `.tpl` files, which are plain PHP included by `lib/Template.php`.

```
                         +---------------------------------------------------------------+
 Browser / feed readers  |                        Web root (repo root)                    |
 -----------------------> index.php  ajax.php  careers/  rss/  xml/  installwizard.php     |
                         |   |          |         \      |     /       installtest.php     |
                         |   |          |          '-- include index.php (shims)           |
 cron (expected) ------->|  QueueCLI.php    rebuild_old_docs.php   scripts/makeBackup.php  |
                         +---|----------|-----------------------------------------------------+
                             v          v
     +-----------------------------------------------------------------------------------+
     |  Bootstrap: config.php (constants, secrets) + constants.php + lib/* eager includes  |
     |  session_start() -> $_SESSION['CATS'] (CATSSession, serialized)                     |
     |  $_SESSION['modules'] / $_SESSION['hooks'] (module registry + hook PHP code)        |
     +-----------------------------------------------------------------------------------+
                             |                                    |
                 ModuleUtility::loadModule($_GET['m'])     ajax/<f>.php | modules/<m>/ajax/<f>.php
                             v                                    v
     +-----------------------------+      +-----------------------------------------------+
     | modules/<m>/<M>UI.php       |      | AJAXInterface / SecureAJAXInterface (login    |
     |  extends UserInterface      |      | check only), echo XML/HTML fragments           |
     |  handleRequest(): switch(a) |      +-----------------------------------------------+
     |  eval(Hooks::get(...))      |
     +-------------+---------------+
                   | new Candidates($siteID), new JobOrders(...), Search*, DataGrid ...
                   v
     +--------------------------------------+    +-------------------------------------+
     | lib/*.php  "table gateways" + utils  |--->| DatabaseConnection::getInstance()    |
     | (SQL via sprintf, some HTML, $_SESSION)|  | mysqli, makeQueryString/Integer      |
     +------------------+-------------------+    | _localizationFilter (TZ rewrite)     |
                        |                        +------------------+------------------+
                        |                                           v
                        |                                  MySQL/MariaDB (55 MyISAM tables)
                        v
     +--------------------------------------+   +-----------------------------------------+
     | Template::display('modules/x/Y.tpl') |   | Filesystem: attachments/site_N/…,       |
     | = ob_start + include (raw PHP)       |   | upload/, temp/, modules.cache, *.time   |
     | TemplateUtility::printHeader/Tabs…   |   | exec(): antiword, pdftotext, html2text  |
     +--------------------------------------+   +-----------------------------------------+
            ^ src/OpenCATS (PSR-4, composer): Entity/Company|JobOrder + Repositories,
            | UI/QuickActionMenu — used by lib/Companies.php, lib/JobOrders.php and 4 Show.tpl
```

---

## 2. Entry Points

"Auth" below means what the entry point itself enforces. Module-level authentication is described in §4.

| Entry point | What it bootstraps (evidence) | Auth enforced | Notes |
|---|---|---|---|
| `index.php` | `config.php` (`:42`); `INSTALL_BLOCK` gate (`:44-48`); `constants.php` and 11 lib files (`:59-70`); `session_start()` (`:74-75`); magic-quotes shims (`:93-109`); `CATSSession` creation (`:125-128`); forced-logout DB check (`:142-173`); dispatch (`:176-274`) | Per module: `ModuleUtility::moduleRequiresAuthentication($_GET['m'])` (`:256`, `:261-267`) | The main front controller. `m=logout` is handled inline (`:220-255`). `performMaintenence` POST bypasses the install gate (`:44`). |
| `ajax.php` | `config.php`, `constants.php`, `DatabaseConnection`, `Session`, `AJAXInterface`, `CATSUtility` (`:38-43`); magic quotes (`:50-61`); resolves `f=name` → `ajax/name.php` or `f=mod:name` → `modules/mod/ajax/name.php` (`:77-92`); `include` with output buffering, `AJAX_HOOK` eval and `$filters` eval (`:110-135`) | **Delegated to each included file.** `SecureAJAXInterface::__construct` starts the session and dies if not logged in (`lib/AJAXInterface.php:202-222`). | 32 AJAX handlers: 27 use `SecureAJAXInterface`, 2 use the public `AJAXInterface` (`ajax/getParsedAddress.php`, `ajax/zipLookup.php`), 3 use neither (`ajax/getReportHTML.php`, which is 0 bytes; `modules/install/ajax/ui.php`, which has its own `INSTALL_BLOCK` guard at `:55`; `modules/install/ajax/maint.php`, which has no guard, deletes `modules.cache` and includes `index.php`, `:30-37`). |
| `careers/index.php` | Sets `$careerPage = true`, `chdir('..')`, includes `config.php`, `lib/CATSUtility.php`, then `include_once(CATSUtility::getIndexName())` (`:34-39`), i.e. the root `index.php` | None (careers module is public: `modules/careers/CareersUI.php:53`) | The file to include is derived from `$_SERVER['PHP_SELF']` (see ARCH-022). |
| `rss/index.php` | `$rssPage = true; chdir('..'); include_once(LEGACY_ROOT . '/lib/CATSUtility.php')` **before** `config.php` defines `LEGACY_ROOT` (`:34-38`) | None | **Broken on every PHP version** (ARCH-022). RSS still works via `index.php?m=rss` (`RssUI`, public, `modules/rss/RssUI.php:49`). |
| `xml/index.php` | `$xmlPage = true`, `chdir('..')`, `config.php`, `CATSUtility`, include `index.php` (`:34-39`) | None (`modules/xml/XmlUI.php:54`) | Public XML job feed (Indeed/SimplyHired templates in `modules/xml/xml_templates/`). |
| `attachments/index.php` | 0-byte file | n/a | Only a directory-listing guard. Downloads go through `index.php?m=attachments&a=getAttachment` (auth required, `modules/attachments/AttachmentsUI.php:43`). Stored files are also directly addressable under `attachments/site_N/...` if the web server serves them (§14). |
| `installwizard.php` | `constants.php`, `config.php`, `lib/TemplateUtility.php` (`:4-17`); the UI drives `ajax.php?f=install:ui` | None in the page itself; `modules/install/ajax/ui.php:55` refuses when `INSTALL_BLOCK` exists | Installer writes `config.php` via `CATSUtility::changeConfigSetting` (ARCH-014). |
| `installtest.php` | `config.php`, `constants.php`, `lib/InstallationTests.php` (`:30-32`); runs core, MySQL, attachments-dir and antiword tests (`:156-161`) | **None, and no `INSTALL_BLOCK` check** | Discloses environment/DB connectivity details to anonymous users (cross-ref security audit). |
| `QueueCLI.php` | `chdir(dirname(__FILE__))`, `config.php`, `constants.php`, 12 lib files and `modules/queue/constants.php` (`:34-52`); `session_start()` (`:56`); `registerModuleTasks()` (`:78`); `startNextTask()` (`:83`); touches `queue.time` (`:86`) | **None; no `php_sapi_name()` check** | Intended for cron (header comment `:28`) but reachable over HTTP from the web root. |
| `scripts/*` | `makeBackup.php` (CLI/web dual: `:37-47`, runs a backup when `$_SERVER['argv'][1]` is set, `:53-62`); `sphinxtest.php` (CLI check `:18`); shell scripts (`sphinx_*.sh`, `storeDeletedAttachments.sh`, `mysql_get_prod_db.sh`, `svnkeywords.sh`, `newversion.sh`, `countcode.sh`, `killwhitespace.sh`) | `scripts/index.php` is 0 bytes; no `.htaccess` in `scripts/` | Shell scripts hard-code hosted-CATS paths such as `/usr/local/www/catsone.com/data` (`scripts/sphinx_reindex.sh:14`) and credentials (`scripts/mysql_get_prod_db.sh:8-10`). |
| `modules/toolbar` (via `index.php?m=toolbar`) | `ToolbarUI` (`modules/toolbar/ToolbarUI.php:51-86`) | Module is public (`:46`). Actions log in with `CATSUser`/`CATSPassword` **from `$_GET`** (`:95-96`) and are gated on `LicenseUtility::isProfessional()` (`:114`), which always returns `true` (ARCH-019) | Legacy Firefox-toolbar API. |
| `wsdl/` | Static WSDL files: `parse.wsdl`/`status.wsdl` → `http://soap.resfly.com/...` (`wsdl/parse.wsdl:78`, `wsdl/status.wsdl:69`); `keyCheck.wsdl` → `http://catsone.com/keyCheck.php` (`:66`) | n/a | Consumed by `lib/ParseUtility.php:53,135` via `SoapClient` when `PARSING_ENABLED` is true (default `false`, `config.php:51`). `keyCheck.wsdl` has no consumer. |
| `js/index.php` | 0 bytes | n/a | Listing guard only. |
| `rebuild_old_docs.php` | `config.php`, raw `mysqli_connect` (`:14`, `:56-63`); re-extracts text for every attachment with `text IS NULL` (`:16-52`) | **None; no CLI guard** | Uses `addslashes()` to build SQL (`:38`). Anonymous HTTP request → full attachment re-index (ARCH-006). |
| `optional-updates/latest-sphinx-search/` | Drop-in replacement `Search.php` (2,487 LOC, CRLF) and `config.php` (249 lines) | n/a | Manual "copy over core files" upgrade. The shipped `config.php` lacks `LEGACY_ROOT`, `AUTH_MODE` and the LDAP constants (checked with grep), so copying it would break the app. |

---

## 3. Request Lifecycle (authenticated page, e.g. `index.php?m=candidates&a=show&candidateID=5`)

```
Browser        index.php             CATSSession      ModuleUtility           CandidatesUI           Candidates/DB           Template/.tpl
   | GET ...      |                       |                 |                       |                       |                        |
   |------------->| include config.php (:42), INSTALL_BLOCK? (:44)                   |                       |                        |
   |              | include constants + 11 lib files (:59-70)                        |                       |                        |
   |              | session_start() (:75) -- unserialize $_SESSION['CATS'] (class loaded at :67)             |                        |
   |              | magic quotes (:93-109)  [PHP 8: fatal here]                      |                       |                        |
   |              |--startTimer/checkForcedUpdate (:131,:136)->|                    |                       |                        |
   |              |--isLoggedIn -> Users::getForceLogoutData (SELECT) (:142-173)    |                       |                        |
   |              |--moduleRequiresAuthentication('candidates') (:195,:256)-------->| getModules() (:147)   |                        |
   |              |                       |   ($_SESSION['modules'] or _refreshModuleList: scan+lock+schema)|                        |
   |              |--logPageView() (UPDATE user_login) (:271)  |                    |                       |                        |
   |              |--loadModule('candidates') (:272)--------------------------------->| include modules/candidates/CandidatesUI.php (:71-74)
   |              |                       |                 | eval(Hooks::get('LOAD_MODULE')) (:76)     |                        |
   |              |                       |                 | new CandidatesUI() (:78) -> UserInterface::__construct: new Template, siteID/userID from session (UserInterface.php:54-67)
   |              |                       |                 | ->handleRequest() (:79)                    |                        |
   |              |                       |                 |                       | eval(Hooks::get('CANDIDATES_HANDLE_REQUEST')) (CandidatesUI.php:83)
   |              |                       |                 |                       | $action = $_GET['a'] (UserInterface.php:193-201)
   |              |                       |<-- getAccessLevel('candidates.show') (CandidatesUI.php:89 -> UserInterface.php:429-432 -> Session.php:403-406 -> ACL.php:52-84)
   |              |                       |                 |                       | show() (:458) -> new Candidates($siteID) (:476)
   |              |                       |                 |                       |---------------------->| DatabaseConnection::getInstance() (DatabaseConnection.php:53-75)
   |              |                       |                 |                       |                       | sprintf SQL + makeQueryString -> query() (:159-223)
   |              |                       |                 |                       |                       | _localizationFilter rewrites DATE_FORMAT (:648-712)
   |              |                       |                 |                       | $this->_template->assign('data',...) (:719-736)
   |              |                       |                 |                       | ->display('./modules/candidates/Show.tpl') (:738) --------------------->|
   |              |                       |                 |                       |                       | Template::display (Template.php:98-129): ob_start; include .tpl;
   |              |                       |                 |                       |                       | strip leading whitespace; eval filters; echo
   |              |                       |                 |                       |                       | Show.tpl:2 include ./vendor/autoload.php; :9 TemplateUtility::printHeader
   |              |                       |                 |                       |                       | :12 printTabs -> ModuleUtility::getModules (TemplateUtility.php:570-596)
   |<-------------------------------------------------------------------------------- HTML --------------------------------------------------------|
```

Step detail (FACT, verified):

1. **Config and install gate.** `index.php:42` includes `./config.php`, which defines 82 constants: DB credentials, paths, mailer, LDAP, `LEGACY_ROOT='.'` (`config.php:34-37`). Without `INSTALL_BLOCK` the request goes to `modules/install/notinstalled.php` (`index.php:44-48`). `INSTALL_BLOCK` is created by the installer (`modules/install/ajax/ui.php:973-975`).
2. **Eager includes** at `index.php:59-70`. Note that `TemplateUtility.php:38` does `include_once('./vendor/autoload.php')` (a path relative to the current directory) and pulls in `Candidates.php` at file scope (`:39`), plus `Companies.php` conditionally inside `printTabs` (`:748`). As a result, most of the candidate/job-order domain graph loads on every request (ARCH-023).
3. **Session.** `@session_name(CATS_SESSION_NAME); session_start();` (`index.php:74-75`). `$_SESSION['CATS']` holds a serialized `CATSSession` object (`lib/Session.php:40-87`: 46 private fields including `_password` (the stored hash, `:788`), `_MRU`, data-grid preferences, `_storedData`). The class must be loaded before `session_start()` so it can be unserialized, which is why `lib/Session.php` is included at `index.php:67` first. There is no `session_regenerate_id()` anywhere in the code base (grep), so the session ID is not rotated on login (cross-ref security audit).
4. **Per-request DB work before dispatch:** `Users::getForceLogoutData()` SELECT (`index.php:144-145`) and `logPageView()`, which calls `Users::updateLastRefresh` (an UPDATE on every page view, `lib/Session.php:618-630`, called at `index.php:207,271`).
5. **Dispatch.** A nested `if/else if` on `$careerPage`/`$rssPage`/`$xmlPage`, the forced logout, and `$_GET['m']` (`index.php:176-274`). The module name is whitelisted against the discovered module registry (`lib/ModuleUtility.php:53-67`), so `m` cannot be used for path traversal.
6. **Module execution.** `loadModule` includes the UI file, evaluates the `LOAD_MODULE` hook, instantiates the class and calls `handleRequest()` (`lib/ModuleUtility.php:51-80`). Each module implements its own `switch ($action)` with inline access-level checks (§5).
7. **Rendering.** `Template::display` includes the `.tpl` inside output buffering, strips leading whitespace on every line unless the output contains `<!-- NOSPACEFILTER -->` or `textarea`, evaluates any registered filters, and echoes the result (`lib/Template.php:98-129`). Templates call static `TemplateUtility::print*` helpers, which read `$_SESSION['CATS']` directly (e.g. `TemplateUtility.php:1166`).
8. **Termination.** Errors end the request with `die()` via `CommonErrors::fatal` (`lib/CommonErrors.php:68+`) or `UserInterface::fatal` (`lib/UserInterface.php:242-272`). The footer prints server response time and version (`TemplateUtility.php:829-833`) and, randomly on about 1 in 11 requests, may rewrite `config.php` (`:842-848`; dead in practice because `validateProfessionalKey` always returns `true`).

---

## 4. Module System (`lib/ModuleUtility.php`, `lib/UserInterface.php`)

- **Discovery** (`_refreshModuleList`, `:193-313`) runs when `$_SESSION['modules']` is empty (`:152-156`), i.e. on the **first request of every session**:
  1. It lists `MODULES_PATH` (`./modules/`, `config.php:147`) (`:221-239`).
  2. It takes a DB advisory lock, `GET_LOCK('CATSUpdateLock', 120)` (`:242-243`; `DatabaseConnection.php:426`).
  3. For every file ending in `UI.php` in each module directory, it `include_once`s the file, **instantiates the class**, and records `[class, tabText, subTabsExternal, settingsEntries, settingsUserCategories]` (`:246-274`).
  4. It merges `getHooks()` into `$hooks` (`:276-280`) and runs `processModuleSchema()` (`:282`).
  5. It stores `$_SESSION['hooks']` (`:296`), sorts modules by the `$coreModules` order in `constants.php:30-41` using `uksort($modules, array('self','_sortModules'))` (`:299`, a `'self'` callable that PHP 8.2 deprecates), and verifies the core modules are present (`:302`, `:321-344`).
- **Caching.** With `CACHE_MODULES` (default `false`, `config.php:256`) the registry is read from `modules.cache` in the **web root** with `unserialize` (`:208-215`). Writing the cache assigns properties to an undefined `$modulesCache` (`:307-309`); on PHP 8 that throws `Error: Attempt to assign property on null` (verified).
- **Per-module schema.** `UserInterface::$_schema` is an array of `version => SQL | 'PHP:<code>'`. `processModuleSchema` compares it with the `module_schema` table and applies pending entries. SQL is split on `;`, and `PHP:` entries are **`eval`'d** (`:443-573`, eval at `:538-543`). Only the `install` module (`CATSUI`) declares a schema, `CATSSchema::get()` (`modules/install/CATSUI.php:39`): 364 versions in `modules/install/Schema.php`, 25 of them `PHP:` blocks.
- **Authentication flag.** `moduleRequiresAuthentication()` includes and **instantiates** the module (so constructor side effects run before auth) and returns `$_authenticationRequired` (`:109-140`). Public modules: `careers`, `graphs`, `install`, `login`, `rss`, `toolbar`, `wizard`, `xml` (grep of `_authenticationRequired = false`). `graphs` exposes 5 actions without login (`modules/graphs/GraphsUI.php:80-99`).
- **Base class.** `UserInterface` (`lib/UserInterface.php:38-433`) provides the template instance, `_siteID`/`_userID` from the session (`:54-67`), `getAction()` (the raw `$_GET['a']`, `:193-201`), `isPostBack()` (`$_POST['postback']`, `:209-217`), input helpers (`isRequiredIDValid`, `getTrimmedInput`, `getSanitisedInput` (which HTML-encodes), `:318-395`), `fatal()`/`fatalModal()` (`:242-306`) and `getUserAccessLevel()` (`:429-432`).
- **Action dispatch.** There is no routing table. Every module hand-writes `switch ($action)` in `handleRequest()`, e.g. `modules/candidates/CandidatesUI.php:81-370` (32 `case` labels; the default case is `listByView`, `:360-368`).
- **Sub-tabs and access-levelled menu items** are encoded in strings such as `'...&a=add*al=200@candidates.add'` (`CandidatesUI.php:75`) and parsed at render time by `TemplateUtility::printTabs` (`lib/TemplateUtility.php:570-800`). Tabs are always shown to demo users (`:651-652`).
- **Tasks.** `registerModuleTasks()` includes `modules/*/tasks/tasks.php` (`:86-101`); see §12.

## 5. Authorization Model

- Access levels are integer constants: `DISABLED 0`, `READ 100`, `EDIT 200`, `DELETE 300`, `DEMO 350`, `SA 400`, `MULTI_SA 450`, `ROOT 500` (`constants.php:74-82`). A user has one level (`user.access_level`) plus comma-separated `categories` (`lib/Session.php:796-798`).
- `CATSSession::getAccessLevel($securedObject)` → `ACL::getAccessLevel()` (`lib/ACL.php:52-84`) walks dotted names (`candidates.show` → `candidates` → root) in `ACL_SETUP::$ACCESS_LEVEL_MAP`. That class exists **only as a commented-out example** in `config.php:343-368`, so `class_exists('ACL_SETUP')` is false and the user's global level is always returned (`ACL.php:54-57`). The fine-grained ACL is inert by default.
- Checks are written inline per action, e.g. `if ($this->getUserAccessLevel('candidates.show') < ACCESS_LEVEL_READ) CommonErrors::fatal(...)` (`CandidatesUI.php:89-92`). Counts of access checks inside `handleRequest()`: Settings 56, Candidates 32, JobOrders 16, Contacts 9, Companies 9; Import, Calendar, Reports, Lists, Activity, Home, Export and Attachments have **0** there (some check inside methods: Import 7 references, Calendar 8, Lists 2; Reports, Export, Activity and Home have none at all).
- The AJAX layer checks only that a session exists (`SecureAJAXInterface`, `lib/AJAXInterface.php:251-260`). Only 5 AJAX files reference access levels (`ajax/getPipelineJobOrder.php`, `ajax/setCandidateJobOrderRating.php`, `modules/install/ajax/attachmentsReindex.php`, `modules/install/ajax/attachmentsToThreeDirectory.php`, `modules/settings/ajax/backup.php`).
- The "career portal" user category is restricted **only through eval'd hooks** defined in `modules/settings/SettingsUI.php:87-128` (see §6).

## 6. Hooks System (`lib/Hooks.php`)

- `Hooks::get($name)` concatenates the PHP code strings registered under `$name` in `$_SESSION['hooks']` and appends `' return true;'` (`lib/Hooks.php:52-72`). Call sites use the idiom `if (!eval(Hooks::get('X'))) return;`, so a hook can abort the caller by returning `false`, or read and modify the caller's local variables.
- **Reach:** 278 call sites in 50 files and 232 distinct hook names (grep). The largest users are `CandidatesUI.php` (37), `ImportUI.php` (32), `JobOrdersUI.php` (30), `ContactsUI.php` (20), `CompaniesUI.php` (19), `LoginUI.php` (14), `TemplateUtility.php` (10); hooks also appear inside `.tpl` files (e.g. `modules/joborders/Show.tpl`, `modules/candidates/Add.tpl`).
- **Implementations:** exactly one module defines hooks. `SettingsUI::defineHooks()` (`modules/settings/SettingsUI.php:87-128`) registers 10 hooks that confine `careerportal` users to Settings. The other **222 hook points are no-ops** that remain from hosted CATS (e.g. `CAREERS_SITEID`, `CareersUI.php:81`; `TOOLBAR_AUTHENTICATE_PRE`, `ToolbarUI.php:98`).
- Similar "code as string" mechanisms: `Template::addFilter()` plus `eval($filter)` (`lib/Template.php:85-88,123-126`; `addFilter` has no callers); `$filters` in `ajax.php:108,125-128`; Wizard pages (`lib/Wizard.php:75-80` stores `phpEval` in `$_SESSION['CATS_WIZARD']`, `modules/wizard/WizardUI.php:179-182` evals it); DataGrid column renderers (§8).

## 7. Template Engine (`lib/Template.php`, `lib/TemplateUtility.php`)

- **Mechanism.** Yes, templates are raw PHP includes. `assign()` creates dynamic public properties on the `Template` object (`$this->$propertyName = $propertyValue`, `lib/Template.php:64-67`; a deprecation on PHP 8.2+), and the `.tpl` is `include`d inside `display()` (`:114-116`), so `$this` inside a template is the `Template` instance. Templates have full PHP power: they use `$_SESSION`, call static services and `include_once('./vendor/autoload.php')` with `use` statements (`modules/candidates/Show.tpl:2-4`), and instantiate `OpenCATS\UI\*` objects (`Show.tpl:29`).
- **Escaping model: opt-in.** `$this->_($s)` echoes `htmlspecialchars($s)` (`Template.php:51-54`, default flags, no explicit charset). Across 136 templates there are 892 `$this->_(` calls versus 427 `echo($this->…)` and 15 `<?= $this->…` raw outputs (grep counts; not every raw output is unsafe). Example raw sink: `TemplateUtility::_printCommonHeader` echoes `$pageTitle` unescaped (`TemplateUtility.php:1182`), and `Show.tpl:7,9` passes the candidate's first and last name into it.
- **Escaping is inconsistent at the storage level too.** The career portal HTML-encodes on input (`getSanitisedInput`, `CareersUI.php:1211-1230` → `UserInterface.php:388-395`); migration 362 rewrote every job order's `description`/`notes` with `nl2br(htmlspecialchars())` (`modules/install/Schema.php:1296-1322`); internal UI paths store raw input and escape (or not) on output. The DB therefore holds a mix of encoded and raw text (ARCH-008).
- **Layout helpers** (`TemplateUtility`, 1,245 LOC) are static functions that emit HTML via `echo`: header (loads `lib.js`, `quickAction.js`, `calendarDateInput.js`, `subModal.js`, `jquery-1.3.2.min.js` on every page, `:1190-1194`), tabs (`:570`), quick search, footer, rating widgets.

## 8. Data Access Layer

- **Connection.** `DatabaseConnection` is a lazily-connected singleton (`lib/DatabaseConnection.php:53-75`) wrapping procedural `mysqli_*` calls (`connect` `:109-145`). `getInstance()` also copies the time-zone offset and date format **from `$_SESSION['CATS']`** on every call (`:62-72`, marked `// FIXME: Remove Session tight-coupling here.`). There are 110 `DatabaseConnection::getInstance()` call sites.
- **Query building.** SQL is written as `sprintf` templates with values passed through `makeQueryString()` (quote + `mysqli_real_escape_string`, `:495-498`), `makeQueryInteger()` (`(integer)` cast, `:546-549`), `makeQueryStringOrNULL`/`IntegerOrNULL`/`Double`. The code itself flags this: `// FIXME: Security issue, this function is not enough for sanitizing` (`:482-485`). No prepared statements are used anywhere (grep for `prepare(`/`bind_param` in `lib/` and `modules/` returns nothing). `lib/*.php` has 639 `sprintf(` calls whose format string opens on the next line or with a double quote, which is the SQL-building idiom (approximate count by grep).
- **Query rewriting.** Every query starting with `SELECT` is rewritten: `DATE_FORMAT(` gets wrapped in `DATE_ADD/DATE_SUB(... INTERVAL n HOUR)` and `%m-%d-%y` is swapped for DMY users (`_localizationFilter`, `:648-712`). Writes are blocked when `CATS_SLAVE` (`:635-644`).
- **Error handling.** `query()` tests `isset($this->_queryResult->connect_errno)` (`:184`, `:198`). `mysqli_query` returns `false` or `mysqli_result`, neither of which has that property, so **both error branches are unreachable**: on PHP 7.2 failed queries return `false` silently, and the `$ignoreErrors` flag (10 callers) is meaningless. On PHP ≥ 8.1 mysqli defaults to exception mode (verified: `@mysqli_connect` throws `mysqli_sql_exception` on 8.4), so every SQL error becomes an uncaught exception and the friendly connect error page (`:115-127`) is bypassed (ARCH-009).
- **Domain classes** (`lib/Candidates.php`, `JobOrders.php`, `Companies.php`, `Contacts.php`, `Pipelines.php`, `ActivityEntries.php`, `Calendar.php`, `SavedLists.php`, `Users.php`, …) follow a **Table Data Gateway** pattern rather than Active Record: the constructor takes `$siteID` and grabs the DB singleton (`Candidates.php:54-59`); methods return associative arrays (`get`, `getAll`, `add` with positional arguments, e.g. `Candidates::add` with 30 parameters, `:94-99`). They **mix SQL, presentation and session state**. For example, `CandidatesDataGrid` column definitions contain HTML inside PHP strings that are `eval`'d per cell (`'pagerRender' => 'if ($rsData[...]) ... return \'<a href="...">\'...'`, `lib/Candidates.php:1943,1992,2001`, evaluated in `lib/DataGrid.php:1530,1912`; also `filterRender` `:1206,1211` and `exportRender` `:1441`). Counts of HTML fragments / SQL statements / superglobal references: `Candidates.php` 13/67/4, `Calendar.php` 17/13/2.
- **Cross-dependencies** between gateways are wired with `include_once` and `new` inside methods: `JobOrders` creates `Contacts`, `History`, `Mailer`, `Attachments` (`lib/JobOrders.php:103,240,254,318`); `Pipelines` uses `Mailer` without including it (`lib/Pipelines.php:371`) while `Mailer` includes `Pipelines` (`lib/Mailer.php:46`).
- **Direct SQL outside lib/:** `modules/install/Schema.php` (124 statements), `modules/import/Import.php` (14), several `dataGrids.php` and a few UI classes (`CandidatesUI`, `SettingsUI`, `CareersUI`, `ImportUI`, `JobOrdersUI`).

## 9. The `src/OpenCATS` PSR-4 Layer

- `composer.json` maps `OpenCATS\\` → `src/OpenCATS/`. There are 24 files / 3,903 LOC: 6 `Entity` files (`Company`, `CompanyRepository`, `CompanyRepositoryException`, `JobOrder`, `JobOrderRepository`, `JobOrderRepositoryException`), 3 `UI` files (`QuickActionMenu`, `CandidateQuickActionMenu`, `CandidateDuplicateQuickActionMenu`), and 15 test files (12 unit, 3 integration).
- **Usage from legacy code is minimal:**
  - `lib/Companies.php:89-112`: only `Companies::add()` uses `Company::create()` + `CompanyRepository::persist()`.
  - `lib/JobOrders.php:106-136`: only `JobOrders::add()` uses `JobOrder::create()` + `JobOrderRepository::persist()`.
  - `QuickActionMenu` objects are created in 4 `Show.tpl` files and in `TemplateUtility::printSingleQuickActionMenu` (`:1140`).
- **Coexistence.** The autoloader is not bootstrapped centrally. It is `include_once('./vendor/autoload.php')` (cwd-relative) at file scope in `lib/TemplateUtility.php:38`, `lib/Companies.php:2`, `lib/JobOrders.php:2`, `modules/*/Show.tpl:2`, and `require './vendor/autoload.php'` in `lib/Mailer.php:43`. Repositories take the legacy `\DatabaseConnection` and `\History` (`CompanyRepository.php:11,16`) and build SQL the same way as `lib/`, i.e. they are relocated legacy code, not a new data layer.
- **Defects:**
  - `src/OpenCATS/Entity/JobOrderRepositoryException.php:2` reads `namespace \OpenCATS\Entity;`, a parse error on PHP 8 (verified with `php -l`). INFERENCE: on PHP 7 it parses as a constant-fetch expression statement, so the file throws "undefined constant" when autoloaded, and it declares a global-namespace class extending a namespace-relative `Exception`.
  - `lib/Companies.php:109` catches `CompanyRepositoryException` without importing `OpenCATS\Entity\CompanyRepositoryException` (only `Company` and `CompanyRepository` are imported, `:3-4`). The exception thrown at `CompanyRepository.php:85` is therefore never caught.
  - `QuickActionMenu` assigns the undeclared property `$this->accessLevel` (`QuickActionMenu.php:13`, dynamic property), reads `$_SESSION` (`:28-30`) and `echo`es HTML (`:22`).

## 10. Multi-Tenancy

- **Schema.** 36 of 55 tables have `site_id` (awk over `db/cats_schema.sql`). Tables without it are lookup/system tables (`access_level`, `system`, `module_schema`, `zipcodes`, …) plus `career_portal_template`, `xml_feeds`, `word_verification`, `installtest`.
- **Queries.** 342 `site_id = %s`-style predicates in `lib/` and `modules/`, and 900 `_siteID` references. Every gateway is constructed with a site ID taken from `$_SESSION['CATS']->getSiteID()` (`UserInterface.php:64`).
- **Site model** (`lib/Site.php`): `site.unix_name` identifies a tenant. Login accepts `&s=<unixName>` (`modules/login/LoginUI.php:112-115`), and logout redirects back with `&s=` except for `'demo'` (`index.php:229-234`). `CATS_ADMIN_SITE = 180` (`constants.php:187`) is a special site used for system data (`site` seed row 180 `CATS_ADMIN`, `db/cats_schema.sql:1018`; queue tasks run under it, `QueueProcessor.php:156`).
- **Public portals are single-tenant in practice.** `careers`, `rss` and `xml` all call `Site::getFirstSiteID()` (the lowest `site_id` other than 180, `lib/Site.php:161-182`; call sites `CareersUI.php:79`, `RssUI.php:103`, `XmlUI.php:107`). Per-site portals relied on the unimplemented `CAREERS_SITEID` hook (`CareersUI.php:81`).
- **Tenant-filter bypass.** Attachment download uses `new Attachments(-1)` and `get($id, false)` (`modules/attachments/AttachmentsUI.php:83-84`), which makes the WHERE clause `(site_id = -1 || content_type = 'catsbackup' || true)` (`lib/Attachments.php:601-604`). The only guard is `md5(directoryName)` passed in the URL (`AttachmentsUI.php:86`).
- **Hosted/ASP remnants.**
  - `CATSSession::_isASP` is derived from `site.company_id != 0` (`Session.php:799`).
  - `transparentLogin()` (site switching as root, `Session.php:939`) has no callers.
  - Special cases for `unixName == 'cognizo'` and hard-coded `site 200` (`Session.php:200-212`, "TODO: Remove me").
  - `ACCESS_LEVEL_MULTI_SA`/`ROOT`.
  - `index.php:246-250` redirects `demo.catsone.com` to `www.catsone.com` on logout.
  - `module_schema` seeds a non-existent `extension-statistics` module (`db/cats_schema.sql:858`).

## 11. Configuration Management

- **`config.php`** is PHP source defining constants. It holds the license key (`:31`), DB credentials `cats/password@localhost/cats_dev` (`:40-43`), placeholder converter paths (`:62-81`), SMTP `user/password` (`:219-225`), LDAP bind password (`:273`), tester/demo credentials (`:188-197`), `OFFSET_GMT` (`:180`), feature flags (`ENABLE_SPHINX`, `CACHE_MODULES`, `US_ZIPS_ENABLED`, `CATS_SLAVE`, `ENABLE_DEMO_MODE`), and an optional ACL/job-status config left as **commented-out code** (`:287-368`). There is no environment-variable support (`getenv`/`$_ENV`: 0 hits) and no per-environment files. CI copies `test/config.php` over `config.php` (`.github/workflows/ci.yml:59`).
- **Runtime mutation.** `CATSUtility::changeConfigSetting($name, $value)` rewrites `config.php` by line prefix match and writes the **raw `$value` as PHP code** (`lib/CATSUtility.php:142-181`). The installer passes request data straight in: `changeConfigSetting('DATABASE_USER', "'" . $_REQUEST['user'] . "'")` (`modules/install/ajax/ui.php:120-135`, also the mail settings `:224-237` and converter paths `:410-422`). Settings (`SettingsUI.php:2727,3124`), `OFFSET_GMT` (`ui.php:524`) and demo mode (`:696,758,782`) are written the same way. The web server therefore needs write access to executable PHP (cross-ref security audit).
- **`constants.php`**: core module order (`:30-41`), version, access levels, data item types, pipeline statuses, `CATS_ADMIN_SITE`, a hard-coded `$timeZones` list with fractional zones commented out (`:196-283`, "FIXME: Support fractional GMT offsets"), and `$badFileExtensions` (`:286-295`).
- **DB-stored settings.** Table `settings(setting, value, site_id, settings_type)` (`db/cats_schema.sql:968-975`) with types `MAILER`/`CALENDAR`/`EEO`/`CAREER_PORTAL` (`constants.php:68-71`). Each type has its own near-duplicate settings class: `MailerSettings` (`lib/Mailer.php`), `CalendarSettings` (`lib/Calendar.php`), `EEOSettings` (`lib/Candidates.php:2360`), `CareerPortalSettings` (`lib/CareerPortal.php`). Some values are PHP-`serialize`d (`candidateJoborderStatusSendsMessage`, unserialized at `JobOrdersUI.php:1462`, `SettingsUI.php:2010,2040`). The `system` table holds version-check state (`db/cats_schema.sql:1038-1044`).
- **Drift and secrets.**
  - `test/config.php` lacks `LDAP_ATTRIBUTE_*`/`LDAP_SITEID`/`LDAP_ACCOUNT` and adds `LDAP_UID` (diff).
  - `optional-updates/latest-sphinx-search/config.php` lacks `LEGACY_ROOT`/`AUTH_MODE`/LDAP.
  - Real-looking credentials are committed: `lib/sphinx/conf/sphinx.conf:14-18` (`sql_host = 192.168.48.4`, `sql_user = dit_db_user`, `sql_pass = '_dit_db_user_P@$$w0r8123.'`) and `scripts/mysql_get_prod_db.sh:8-10` (`10.0.0.66`, `sae`/`sae99`).

## 12. Background Processing

- **Framework.** `lib/QueueProcessor.php` (static class) backed by table `queue`. `addAsynchronousTask()` inserts rows (`:278-301`). `startNextTask()` picks the highest-priority unlocked row (`:166-199`), includes the task file and instantiates the class via `eval(sprintf('$curTask = new %s();', $taskName))` (`:201-217`). Recurring tasks declare a crontab-like `getSchedule()` evaluated by `isTaskReady()` (`:528+`).
- **Runner.** `QueueCLI.php` is meant to be run by cron (`:28`). It includes every `modules/*/tasks/tasks.php`, which *immediately runs* due recurring tasks via `registerRecurringTask()` (`QueueProcessor.php:126-158`). Registered tasks are `modules/calendar/tasks/Reminders.php` (event e-mail reminders, `modules/calendar/tasks/tasks.php:39`) and `modules/queue/tasks/CleanExceptions.php` (`modules/queue/tasks/tasks.php:39`). It writes marker files `queue.time`/`cleanup.time` into the web root (`modules/queue/constants.php:41-42`, `QueueCLI.php:86,98`).
- **Provisioning.** No cron is set up in `docker/*.yml`, CI, or docs in the repo, so calendar reminders only work if an operator adds one (UNKNOWN whether the external `opencats/php-base` image ships cron).
- **Inconsistencies.**
  - Duplicate, diverging copies exist: `modules/queue/tasks.php` vs `modules/queue/tasks/tasks.php` (the former is never loaded; `registerModuleTasks` loads only `tasks/tasks.php`), and `modules/queue/lib/Task.php` vs `modules/queue/tasks/lib/Task.php` (only the former is included).
  - `registerRecurringTask` stores the task *name* (`:156`), but `startNextTask` treats the `task` column as a *path* (`getTaskNameFromPath` needs `/Name.php`, `:219-226`). A recurring row left unfinished can never be reloaded by `startNextTask` (INFERENCE from code).
  - `print_r($taskedModules)` prints the return value of a void method (`QueueCLI.php:78-80`).
  - The `QueueUI` module is an empty stub (`modules/queue/QueueUI.php:49-56`).

## 13. Search Architecture

- **Quick/list search** (`lib/Search.php`, 2,096 LOC, 9 classes): `LIKE '%…%'` over `CONCAT(first_name, ' ', last_name)`, emails and phones with `REPLACE()` chains (e.g. `Search.php:1358-1376`). None of these can use an index.
- **Boolean resume/key-skill search.** `DatabaseSearch::makeBooleanSQLWhere()` (`lib/DatabaseSearch.php:214-425`) translates `AND/OR/NOT/*/()` into nested `field REGEXP '[[:<:]]word[[:>:]]'` predicates (`:360-363`) over `attachment.text` / `candidate.key_skills` (callers `Search.php:491,667-670,796,876,1939`). Text is stored "fulltext-encoded" (`fulltextEncode`/`Decode`, `:427-460`).
- **No FULLTEXT index** exists: `grep -ci fulltext db/cats_schema.sql` returns 0, and all 55 tables are MyISAM.
- **Sphinx (optional).** When `ENABLE_SPHINX` (`config.php:97-101`), `SearchByResumePager` uses the bundled 2007 `lib/sphinx/sphinxapi.php` (`Search.php:37-40,1868-1920`). The index is maintained by `scripts/sphinx_*.sh`, which default to hosted-CATS paths. `optional-updates/latest-sphinx-search/` ships a forked `Search.php` using `create_function` (`:228,240,301,313`, removed in PHP 8) and a stale `config.php`.
- ASSUMPTION (external knowledge, not verifiable in repo): MySQL ≥ 8.0.4 (ICU regex) rejects `[[:<:]]`/`[[:>:]]`, while MariaDB (PCRE, used in `docker/`) accepts them. Resume boolean search would therefore fail on MySQL 8.

## 14. File Storage and Document Conversion

- **Layout.** `attachments/site_<siteID>/<floor(id/1000)>xxx/<md5(rand.time.name)>/<safe original filename>` (`lib/Attachments.php:1282-1344`). Directories are created with `0777` and chmod'ed `0777` (`:1288,1299,1313,1349,1364,1382`). An `index.php` is dropped in each level to prevent listing (`:1330-1337`). The DB stores `directory_name` + `stored_filename` (`db/cats_schema.sql:83-107`).
- **Other writable directories inside the web root:** `upload/` (`FileUtility::getUploadPath`, `mkdir 0777`, `lib/FileUtility.php:468-495`), `temp/` (`CATS_TEMP_DIR`, `config.php:87`), `scripts/backup/` (`makeBackup.php`), `modules.cache`, `queue.time`, and `config.php` itself.
- **Protection** relies on Apache `.htaccess` in `attachments/` and `upload/` (`AddHandler cgi-script …`, `Options -ExecCGI -Indexes`, extension allow-list); the root `.htaccess` only disables indexes. There is no `.htaccess` in `lib/`, `db/`, `test/`, `scripts/`, `docker/`. INFERENCE: the shipped Docker stack uses nginx (`docker/docker-compose.yml:5`), which ignores `.htaccess`, so these protections do not apply there (the nginx config is inside a third-party image; UNKNOWN).
- **Text extraction** (`lib/DocumentToText.php`) runs `exec()` of external binaries configured in `config.php` (`ANTIWORD_PATH`, `PDFTOTEXT_PATH`, `HTML2TEXT_PATH`; defaults are Windows-style placeholders such as `"\\path\\to\\antiword"`, `config.php:62-81`) with `escapeshellarg(realpath($fileName))` (`:101-146`, exec at `:378`; the Windows branch uses a `COM('WScript.Shell')` object, `:349-375`). RTF, DOCX and ODT are parsed in PHP: DOCX/ODT via `ZipArchive` + `DOMDocument::loadXML(..., LIBXML_NOENT | LIBXML_XINCLUDE ...)` (`:401-424`; entity expansion is a security concern, cross-ref security audit).
- **Bugs.** The ODT branch passes the undefined `$filename` instead of `$fileName` (`DocumentToText.php:166`), so ODT extraction always returns empty and fails. `UNRTF_PATH` is defined but unused (RTF is parsed in PHP).
- **Upload filtering** is extension-based (`$badFileExtensions` → `.txt` appended, `constants.php:286-295`).

## 15. Frontend Architecture (brief; UX document covers depth)

- Server-rendered XHTML 1.0 Transitional pages (`TemplateUtility.php:1178`), 136 `.tpl` files, table layouts, `main.css` (1,379 lines) plus IE-conditional `ie.css`/`not-ie.css` (`:1215-1216`).
- JavaScript: 40 files in `js/` (11.5k LOC) plus per-module `validator.js` files. Every page loads `jquery-1.3.2.min.js` (2009), a custom `lib.js` and `js/submodal/subModal.js` (popup iframes) (`TemplateUtility.php:1190-1194`). The CKEditor 4 editor is loaded from `vendor/ckeditor/ckeditor/ckeditor.js` (`modules/joborders/Add.tpl:2`), so `vendor/` must be web-served. `composer.lock` pins `ckeditor/ckeditor 4.25.1` and `phpmailer/phpmailer v6.8.0`.
- AJAX uses custom XML responses (`AJAXInterface::outputXMLPage`, `lib/AJAXInterface.php:47-90`) and HTML fragments. DataGrid state is passed as JSON in GET (`parameters<instance>`, `lib/DataGrid.php:382-399`).
- One referenced asset is missing: `modules/candidates/activityvalidator.js` and `modules/contacts/activityvalidator.js` do not exist but are loaded (`modules/candidates/AddActivityChangeStatusModal.tpl:3-7`, `modules/contacts/AddActivityScheduleEventModal.tpl:4-6`).

## 16. Deployment Architecture

```
docker/docker-compose.yml (dev)                    docker/docker-compose-test.yml (CI)
+------------------+   volumes_from   +--------------------+       same web/php images,
| prooph/nginx:www |<---------------->| opencatsdata       |       mariadb:10.7 x2 (cats_test,
| :80, :443        |                  | busybox, ..:/var/  |       cats_integrationtest),
+--------+---------+                  | www/public (repo)  |       selenium standalone-chrome
         | fastcgi (image config: UNKNOWN)+---------+----------+       2.53.1
+--------v--------------------------+       |
| opencats/php-base:7.2-fpm-alpine  |<------+
+--------+--------------------------+
         | DATABASE_HOST from config.php (default 'localhost'; installer rewrites)
+--------v---------+     +----------------------------------+
| mariadb (latest) |<----| phpmyadmin :8080, PMA_USER=dev,  |
| :3306 published  |     | PMA_PASSWORD=dev (auto-login)    |
+------------------+     +----------------------------------+
```

- **Compose.**
  - The repo contains no Dockerfile. Both runtime images are third-party or externally built (`docker/docker-compose.yml:5,14`); PHP is pinned to **7.2** (EOL November 2020, external fact).
  - The DB image is unpinned (`mariadb`, `:27`), publishes 3306 (`:29`), and mounts `../test/data` as init scripts (`:36`), so the dev DB is seeded with test data.
  - phpMyAdmin is published on 8080 with credentials in env (`:39-49`).
  - The repo is bind-mounted as the docroot (`:22`), so everything in the repo (`db/*.sql`, `test/`, `composer.lock`, `.git` if present) is under the web root. Whether nginx blocks these is UNKNOWN.
- **Install flow.** Browsing to `index.php` without `INSTALL_BLOCK` shows `notinstalled.php` → `installwizard.php` → `ajax.php?f=install:ui` steps: system check, DB connectivity (writes `config.php`), load schema/demo data, resume indexing paths, mail, optional components (via `eval` of `installCode`, `ui.php:544-551,1162`), then `maint` (module schema processing via `modules/install/ajax/maint.php` → `index.php` with `$maintPage`, `ModuleUtility.php:517-536`), and finally creates `INSTALL_BLOCK` (`ui.php:970-975`). `INSTALL_BLOCK` is git-ignored (`.gitignore:1`) and excluded from Travis packages (`ci/package-code.sh:6-7`).
- **Release packaging.**
  - GitHub Actions: `release` job (`.github/workflows/ci.yml:106-128`) runs only on `v*` tags after `tests`, and zips the checkout **without running `composer install`** (`:117-119`). `vendor/` is git-ignored (`.gitignore:7,13`). Also, `-x "*.git*"` excludes every path containing `.git`, including `.gitignore`.
  - Legacy Travis: `ci/package-code.sh:3` runs `composer install --no-dev` before tar/zip (`:6-7`); `.travis.yml` tests PHP 7.2/8.0/8.2 (`:17-20`) and deploys with an encrypted key (`:28-38`). Its presence alongside GitHub Actions means two release paths exist (INFERENCE: Travis is no longer active).
- **CI.** Matrix `php-version: ['7.2']` (`ci.yml:21`); lint only `src/` (`:44`); `composer audit || true` (`:48`); PHPUnit unit tests, then Docker-based integration and Behat (`:53-81`); the test report does not fail the build (`fail_on_failure: false`, `:92`).

## 17. PHP Version Compatibility

`php -l` with PHP 8.4.19 on 491 `.php`/`.tpl` files reports 6 parse failures (one is intentional in the simpletest suite):

| File | Error | Reached from | Effect on PHP ≥ 8.0 |
|---|---|---|---|
| `lib/CATSUtility.php:108,122` | `$data{0}` curly-brace string offset (removed in 8.0) | `index.php:61`, `ajax.php:43`, `QueueCLI.php:40`, `modules/install/ajax/ui.php:32`, `careers|xml/index.php` | **Every web request and the installer die at include time.** |
| `lib/fpdf/fpdf.php:434` (also `:1189,1456`, `each()` at `:1285`) | `$s{$i}` | `modules/reports/ReportsUI.php:414` (job order PDF report) | PDF report fatal. |
| `lib/fpdf/font/makefont/makefont.php:18,368` | `$l{0}` | not referenced by the app | none (vendored tool) |
| `lib/artichow/AntiSpam.class.php:63` | `$letters{...}` | `lib/GraphGenerator.php:43` (when GD is present) | Every graph (`m=graphs`, dashboard/report images, captcha) fatal. |
| `src/OpenCATS/Entity/JobOrderRepositoryException.php:2` | `namespace \OpenCATS\Entity;` | autoload on job-order insert failure | Fatal on the error path (on PHP 7 too, see §9). |
| `lib/simpletest/test/test_with_parse_error.php:5` | intentional fixture | — | none |

Runtime incompatibilities found by grep (FACT: code present; effect per PHP changelog):

| Construct | Locations | PHP status | Effect |
|---|---|---|---|
| `get_magic_quotes_runtime()` | `index.php:93`, `ajax.php:50`, `QueueCLI.php:59`, `lib/InstallationTests.php:185`, `lib/fpdf/fpdf.php:911,1170` | removed in 8.0 (verified `function_exists` → false on 8.4) | Fatal `Call to undefined function` right after bootstrap, even if CATSUtility were fixed. The installer's core test (`InstallationTests::checkMagicQuotes`) is fatal too. |
| `get_magic_quotes_gpc()` | `index.php:99`, `ajax.php:56`, `QueueCLI.php:65`, `lib/Attachments.php:944`, `modules/import/ImportUI.php:495` | removed in 8.0 | Fatal |
| `implode($array, $glue)` legacy order | `lib/DataGrid.php:1292,1299,1328,1329` (in `_getData()`, called from the constructor `:529`) | removed in 8.0 (verified TypeError on 8.4) | **Every DataGrid list page** (candidates, job orders, companies, contacts, home, activity, lists) fatal. |
| `$modulesCache->x = …` on undefined var | `lib/ModuleUtility.php:307-308` | Error in 8.0 | Fatal when `CACHE_MODULES=true`. |
| `mysql_real_escape_string`, `mysql_fetch_row` | `modules/install/Schema.php:725,854,1236` (inside `PHP:` migrations) | removed in 7.0 | Fatal when upgrading from old schema versions (already broken on 7.2). |
| `mcrypt_*` | `lib/Encryption.php:52-110` | removed in 7.2 | Already broken; file unused. |
| `create_function` | `optional-updates/latest-sphinx-search/Search.php:228,240,301,313` | removed in 8.0 | Fatal if the optional update is applied. |
| mysqli exception mode default | `lib/DatabaseConnection.php` (all) | default changed in 8.1 (verified behaviour on 8.4) | Silent-failure semantics become uncaught `mysqli_sql_exception`. |
| Dynamic properties | `lib/Template.php:66,79` (every `assign()`), `src/OpenCATS/UI/QuickActionMenu.php:13`, `lib/Session.php:850` (`$this->_ = unserialize(...)`, which also means column preferences are never loaded) | deprecated 8.2 | Deprecation notices on every page; will be errors in PHP 9. |
| `array('self', '_sortModules')` callable | `lib/ModuleUtility.php:299` | deprecated 8.2 | notice |
| `strftime()` | `lib/DateUtility.php:148,472,476,480`, `lib/Calendar.php:575` | deprecated 8.1 | notice |
| `utf8_encode()` | `lib/DocumentToText.php:424,515` | deprecated 8.2 | notice |
| `libxml_disable_entity_loader()` | `lib/DocumentToText.php:415` | deprecated 8.0 (no-op) | notice |
| Optional-before-required parameters | `lib/DatabaseConnection.php:262`, `lib/ActivityEntries.php:162`, `lib/Tags.php:112`, `lib/Profile.php` (11 methods), artichow (3) | deprecated 8.0 (from `php -l` with E_ALL) | notice |

**Assessment.** `index.php` calls `get_magic_quotes_runtime()` at line 93, a function removed in PHP 8.0, but the application already dies earlier, at `index.php:61`, when `lib/CATSUtility.php` fails to compile. Fixing both still leaves the DataGrid `implode` TypeError (all list views), the fpdf/artichow parse errors (reports and graphs), and the mysqli error-mode change. OpenCATS at this commit therefore **supports only PHP 7.x**, and CI, Docker and PHPUnit 7.5 (`composer.json` `"phpunit/phpunit": "^7.5.7"`, locked `7.5.7`, which requires PHP 7.x) all pin it there. The installer's version check only requires PHP ≥ 5.0.0 (`lib/InstallationTests.php:164`), so it does not warn users on PHP 8. The number of hard blockers is small (listed above), but there is no automated coverage outside `src/` to find further runtime breakages (INFERENCE).

---

## 18. Architectural Findings

### ARCH-001 — Application cannot boot on any supported PHP version; stack pinned to EOL PHP 7.2
- **Severity:** CRITICAL
- **Finding:** Two independent fatal errors on the main bootstrap path, plus further fatal errors in core features, prevent OpenCATS from running on PHP ≥ 8.0. CI and Docker are pinned to PHP 7.2, and the test tool (PHPUnit 7.5) cannot run on PHP 8.
- **Evidence:**
  - `lib/CATSUtility.php:108` `if ($data{0} === '<')` → `php -l`: "syntax error, unexpected token "{"". It is included at `index.php:61` and `ajax.php:43`.
  - `index.php:93` `if (get_magic_quotes_runtime())`; `ajax.php:50`; `QueueCLI.php:59`.
  - `lib/DataGrid.php:1292` `implode($selectSQL, ','."\n")`, confirmed TypeError on 8.4.
  - `lib/artichow/AntiSpam.class.php:63`, `lib/fpdf/fpdf.php:434` parse errors.
  - `.github/workflows/ci.yml:21` `php-version: ['7.2']`; `docker/docker-compose.yml:14` `opencats/php-base:7.2-fpm-alpine`; `composer.json` `"phpunit/phpunit": "^7.5.7"`.
- **Impact:** Operators must run an end-of-life PHP runtime (no security fixes since 2020) to use the product. Hosting providers and distributions that ship only PHP 8.x cannot run it at all.
- **Recommendation:**
  1. Replace `$x{n}` with `$x[n]` in `lib/CATSUtility.php`, or delete `getBuild()`, since SVN is gone (see ARCH-015).
  2. Delete the magic-quotes blocks in `index.php:92-109`, `ajax.php:49-61`, `QueueCLI.php:58-70`, `lib/Attachments.php:944`, `modules/import/ImportUI.php:495` and `InstallationTests::checkMagicQuotes`.
  3. Swap the `implode` argument order in `lib/DataGrid.php:1292-1329`.
  4. Replace vendored fpdf 1.53 and artichow with maintained packages.
  5. Add PHP 8.2/8.3 to the CI matrix with `php -l` over *all* PHP/TPL files, upgrade PHPUnit, then fix the deprecations in §17.

### ARCH-002 — Release artifact omits `vendor/` although runtime hard-requires it; CI lints only `src/`
- **Severity:** HIGH
- **Finding:** The GitHub release job zips the checkout without running `composer install`, but five runtime files unconditionally include `./vendor/autoload.php`, and CKEditor is served from `vendor/`. CI lint covers 24 of 491 PHP/TPL files.
- **Evidence:**
  - `.github/workflows/ci.yml:117-119` (`zip -r opencats-${{ github.ref_name }}.zip . -x ...`, with no composer step in the `release` job) and `.gitignore:7,13` (`vendor/*`, `/vendor/`).
  - Consumers: `lib/TemplateUtility.php:38`, `lib/Companies.php:2`, `lib/JobOrders.php:2`, `lib/Mailer.php:43` (`require`, fatal if missing), `modules/candidates/Show.tpl:2`; `modules/joborders/Add.tpl:2` loads `vendor/ckeditor/...`.
  - Lint step: `ci.yml:44` `find src -name "*.php" ... php -l`.
- **Impact:** INFERENCE: a user installing from a GitHub release zip gets a fatal `require` error in `Mailer.php` / missing classes unless they run Composer themselves, which the product does not document in-repo. PHP-version regressions in `lib/` and `modules/` pass CI.
- **Recommendation:** Add `composer install --no-dev --optimize-autoloader` to the `release` job (as `ci/package-code.sh:3` did for Travis), bootstrap the autoloader once in a shared bootstrap file using `__DIR__` instead of a cwd-relative path, and lint all `*.php`/`*.tpl` in CI.

### ARCH-003 — Pervasive global state; session god-object and DB singleton as service locators
- **Severity:** HIGH
- **Finding:** All request context (user, site, time zone, access level, MRU, grid state, stored values, the password hash) lives in one serialized `CATSSession` object in `$_SESSION['CATS']`. Library, UI, template and even DB-layer code read it directly. The DB is a static singleton. There is no dependency injection, container or request object.
- **Evidence:**
  - `lib/Session.php:40-87` (46 private fields); `$_SESSION` referenced 108 times in 26 `lib/*.php` files and 297 times in `modules/`.
  - `lib/DatabaseConnection.php:62-72` pulls the time zone from the session inside `getInstance()`; 110 `DatabaseConnection::getInstance()` call sites; 21 static-only utility classes (`private function __construct() {}`).
  - `$GLOBALS`/`global` used 43 times outside vendored code (e.g. `$GLOBALS['coreModules']`, `ModuleUtility.php:325`; `global $careerPage`, `CareersUI.php:73`).
- **Impact:** Code cannot be unit-tested without a live session and DB (the 12 unit tests target pure utilities only). Changing the session class shape invalidates live sessions. Horizontal scaling requires sticky or shared PHP session storage. The implicit coupling makes refactoring error-prone.
- **Recommendation:** Introduce a `RequestContext` value object (userID, siteID, access level, tz) built once in bootstrap and passed to gateway constructors. Make `DatabaseConnection` injectable (constructor parameter with a default of `getInstance()` during migration). Stop storing the password hash and derived state in the session (`Session.php:788`).

### ARCH-004 — Executable code as strings evaluated at runtime (hooks, wizard, grid renderers, migrations)
- **Severity:** HIGH
- **Finding:** Extension and rendering logic is stored as PHP strings and executed with `eval()`. Hook bodies and wizard page code are stored in `$_SESSION` and eval'd on later requests.
- **Evidence:**
  - `lib/Hooks.php:52-72` (+278 `eval(Hooks::get(...))` sites); `lib/ModuleUtility.php:296` `$_SESSION['hooks'] = $hooks;`.
  - `lib/Wizard.php:77-80` → `modules/wizard/WizardUI.php:179-182` `eval($php)`.
  - `lib/DataGrid.php:1206,1211,1441,1530,1912` (82 `pagerRender` definitions, e.g. `lib/Candidates.php:1943`).
  - `lib/ModuleUtility.php:538-543` (`PHP:` migrations); `lib/QueueProcessor.php:210`; `modules/install/ajax/ui.php:544,551,1162`; `modules/careers/CareersUI.php:280,285,1272`; `lib/Template.php:125`; `ajax.php:127`.
- **Impact:**
  - Any ability to write session data (shared `/tmp` session dirs, session-injection bugs) or `modules.cache` becomes code execution.
  - Static analysis, IDE navigation, opcache and type checking cannot see this code.
  - Syntax errors in string code surface only at runtime.
  - Only 10 of 232 hook points are implemented, so the cost buys almost nothing.
- **Recommendation:**
  - Replace the 10 real hooks (`SettingsUI.php:87-128`) with an explicit check in each module's `handleRequest` (or a single middleware check on `hasUserCategory('careerportal')`), then delete the `eval(Hooks::get())` lines.
  - Convert DataGrid renderers to closures/callables in the column definition.
  - Store wizard steps as method names, not code.

### ARCH-005 — Schema migrations executed implicitly during request handling
- **Severity:** HIGH
- **Finding:** DB schema upgrades are applied by `ModuleUtility::_refreshModuleList()` → `processModuleSchema()` whenever a session has no module registry. That happens on the first request of *any* session, including anonymous, cookie-less requests and `POST performMaintenence` (which also bypasses the install gate). Migrations include `eval`'d PHP, some using functions removed in PHP 7. A fresh install from `db/cats_schema.sql` (install module at version 363) runs migration 364 (`UPDATE user SET password = md5(password) WHERE can_change_password=1`) on the first page hit.
- **Evidence:**
  - `lib/ModuleUtility.php:152-156`, `:241-243` (GET_LOCK 120 s), `:282`, `:443-573`; `index.php:44` (`!isset($_POST['performMaintenence'])`); `ModuleUtility.php:208,291-294`.
  - `db/cats_schema.sql:862` (`'install',363`) vs `modules/install/Schema.php:1328-1330` (`'364' => UPDATE user SET password = md5(password)`).
  - `Schema.php:854` (`mysql_fetch_row`).
- **Impact:**
  - Non-deterministic upgrade timing: whichever user or bot arrives first runs long DDL under a 120 s lock while other new sessions block.
  - A migration failure is silent on PHP 7.2 (see ARCH-009) but still bumps `module_schema.version` (`:559-569`), so a failed step is recorded as applied.
  - No rollback, no audit trail.
- **Recommendation:** Move migrations to an explicit CLI command (e.g. `php bin/migrate.php`) run by the installer/upgrade process, record per-step success only after the statement succeeds, drop `performMaintenence` handling from `index.php`, and convert `PHP:` steps into versioned PHP migration classes.

### ARCH-006 — No single front controller; web-reachable maintenance scripts without guards
- **Severity:** HIGH
- **Finding:**
  - Bootstrap logic is copy-pasted across `index.php`, `ajax.php`, `QueueCLI.php`, `installwizard.php`, `installtest.php`, `rebuild_old_docs.php`, `scripts/makeBackup.php` and `modules/install/ajax/ui.php`, each with its own include list and magic-quotes shim (3 copies).
  - The portal shims (`careers/`, `xml/`) re-enter `index.php` via `include`.
  - Maintenance scripts live in the web root with no authentication and no `php_sapi_name()` check.
- **Evidence:**
  - Magic-quotes copies: `index.php:92-109`, `ajax.php:49-61`, `QueueCLI.php:58-70`.
  - No guard in `rebuild_old_docs.php:14-65`, `QueueCLI.php:34-124`, `installtest.php:30-161`, `modules/install/ajax/maint.php:30-37`.
  - `scripts/makeBackup.php:37-62` runs when `$_SERVER['argv'][1]` is set. INFERENCE: via HTTP this depends on `register_argc_argv`.
  - Only `scripts/sphinxtest.php:18` and `scripts/makeBackup.php:37` call `php_sapi_name()`.
- **Impact:** Anonymous users can trigger attachment re-indexing (CPU/IO), queue execution, installation tests (information disclosure) and module-schema processing. Each entry point drifts independently (e.g. `rss/index.php` is broken, ARCH-022).
- **Recommendation:**
  - Create one `bootstrap.php` (config, autoload, error handling, session) used by all entry points.
  - Move `QueueCLI.php`, `rebuild_old_docs.php` and `scripts/*.php` into a non-web directory (e.g. `bin/`) with `if (PHP_SAPI !== 'cli') exit(1);`.
  - Require `INSTALL_BLOCK` absence *and* an installer token for `installtest.php` and `install:maint`.

### ARCH-007 — Authorization is opt-in per action with no central policy
- **Severity:** HIGH
- **Finding:**
  - Authentication is decided per module (`requiresAuthentication()`), but authorization is hand-coded inside each `switch` case, inconsistently.
  - AJAX handlers only verify that a session is logged in.
  - The fine-grained ACL map is inactive by default.
  - The career-portal role restriction is implemented only as eval'd hooks.
- **Evidence:**
  - `modules/candidates/CandidatesUI.php:89-92` (typical inline check).
  - Zero access-level references in `modules/reports/ReportsUI.php`, `modules/export/ExportUI.php`, `modules/activity/ActivityUI.php`, `modules/home/HomeUI.php` (grep count 0).
  - `lib/AJAXInterface.php:202-222,251-260`; `lib/ACL.php:54-57` with `ACL_SETUP` only commented in `config.php:343-368`; `modules/settings/SettingsUI.php:120-126`.
- **Impact:** Every new action is a potential privilege-escalation bug (e.g. read-only users calling write AJAX endpoints such as `ajax/deleteActivity.php`; details for the security audit). Reviewing the permission model requires reading about 10k lines of switch statements.
- **Recommendation:** Build a declarative action map per module (`'show' => ['candidates.show', ACCESS_LEVEL_READ], ...`) enforced in `ModuleUtility::loadModule` before `handleRequest()`, give AJAX handlers the same `[secured object, level]` metadata, and default to deny for unmapped actions.

### ARCH-008 — Template engine with opt-in escaping and mixed storage encoding
- **Severity:** HIGH
- **Finding:** Templates are raw PHP includes. HTML escaping requires an explicit `$this->_()` call, and helper functions (`TemplateUtility::*`, DataGrid renderers, `QuickActionMenu`) echo HTML built by concatenation. Some data is HTML-encoded before storage (career portal input, job order description/notes), other data is stored raw, so no single output rule is correct.
- **Evidence:**
  - `lib/Template.php:51-54,98-129`: 892 escaped vs 442 raw `$this->` outputs in 136 `.tpl` files.
  - `lib/TemplateUtility.php:1182` (`echo '<title>OpenCATS - ', $pageTitle` with the candidate name from `modules/candidates/Show.tpl:7-9`).
  - `modules/careers/CareersUI.php:1211-1230` (`getSanitisedInput` stores entities); `modules/install/Schema.php:1296-1322` (migration 362 HTML-encodes stored descriptions).
- **Impact:** Systemic XSS risk (cross-ref security audit) and double-encoded text in the UI, exports and XML feeds. Migrating to any auto-escaping engine requires first normalizing stored data.
- **Recommendation:** Define "store raw, escape on output" as the rule. Write a one-off data normalization for the fields known to be pre-encoded (joborder description/notes, career-portal-created candidates). Add an `e()` helper and migrate templates module by module, or adopt Twig/Plates with autoescape for new or rewritten views.

### ARCH-009 — Database error handling is dead code (PHP 7.2) or bypassed (PHP ≥ 8.1)
- **Severity:** HIGH
- **Finding:** `DatabaseConnection::query()` detects errors by testing `connect_errno` on the query result, which never exists. On PHP 7.2, failed queries return `false` without any log or die. Callers mostly ignore return values, and `$ignoreErrors` has no effect. On PHP ≥ 8.1, mysqli throws exceptions by default and nothing catches them.
- **Evidence:** `lib/DatabaseConnection.php:184` `if (isset($this->_queryResult->connect_errno))` and `:198` (same test). No `mysqli_report()` call in the repo (grep 0). `ModuleUtility.php:554-569` bumps the schema version regardless of the result. Verified on 8.4: `@mysqli_connect(...)` throws `mysqli_sql_exception`.
- **Impact:** Data-loss risk: writes that fail (constraint, lock, syntax) look successful to users. Migrations get marked as applied after failing. Behaviour changes completely across PHP versions.
- **Recommendation:**
  - Call `mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT)` in `connect()`.
  - Wrap `query()` in try/catch that logs the query hash and message, then rethrows a domain exception.
  - Remove the `connect_errno` checks.
  - Fix `processModuleSchema` to update the version only on success.

### ARCH-010 — Data layer: hand-built SQL in table gateways that also render HTML and read the session
- **Severity:** MEDIUM
- **Finding:** Persistence is procedural string-built SQL (`sprintf` + escape helpers) with no prepared statements. Gateways mix query logic with presentation (HTML in DataGrid column definitions and Calendar) and read superglobals. Gateways instantiate one another directly, forming include cycles.
- **Evidence:**
  - `lib/DatabaseConnection.php:480-498` (FIXME security note); about 639 SQL-style `sprintf(` calls in `lib/*.php` (grep approximation); 0 uses of `prepare(`.
  - `lib/Candidates.php:1943-2001` (HTML `pagerRender`); `lib/Calendar.php` (17 HTML fragments).
  - `lib/JobOrders.php:103,254`; `lib/Pipelines.php:371` (`new Mailer` without include) ↔ `lib/Mailer.php:46`.
- **Impact:** SQL-injection safety depends on every developer remembering the right `makeQuery*` helper on every value. Business rules can't be reused outside the web UI, and gateway logic can't be unit-tested.
- **Recommendation:** Add a `DatabaseConnection::execute($sql, array $params)` using mysqli prepared statements, migrate gateways incrementally (starting with `Candidates`, `JobOrders`, `Pipelines`, `Users`), and move `pagerRender` HTML into per-module view helpers.

### ARCH-011 — God classes and god methods
- **Severity:** MEDIUM
- **Finding:** A few files concentrate most of the logic, with very large dispatchers and long parameter lists.
- **Evidence:**

  | File | LOC | Methods | `case` actions |
  |---|---|---|---|
  | `modules/settings/SettingsUI.php` | 3,842 | 72 | 51 |
  | `modules/candidates/CandidatesUI.php` | 3,582 | 38 | 32 |
  | `modules/import/ImportUI.php` | 2,104 | 25 | 13 |
  | `modules/joborders/JobOrdersUI.php` | 1,972 | 25 | 16 |
  | `lib/DataGrid.php` | 2,649 | — | — |
  | `lib/Candidates.php` | 2,473 | 3 classes | — |
  | `lib/Search.php` | 2,096 | 9 classes | — |

  `Candidates::add()` takes 30 positional parameters (`lib/Candidates.php:94-99`).
- **Impact:** High change risk and merge conflicts; hard to test or review; slow onboarding.
- **Recommendation:** Split `SettingsUI` by sub-area (users, career portal, email templates, administration, backups) into separate controller classes behind the same `m=settings`. Replace positional-parameter gateway methods with DTOs or arrays validated in one place.

### ARCH-012 — `src/OpenCATS` layer is a thin, partially broken veneer
- **Severity:** MEDIUM
- **Finding:** The PSR-4 layer contains two entities with repositories, used only by `Companies::add` and `JobOrders::add`, and three UI menu classes. Both repository-exception paths are broken. The rest of the app (~43k LOC outside `lib/`, ~47k first-party LOC in `lib/`) does not use it.
- **Evidence:** `lib/Companies.php:89-112` and `:109` (catch of the unimported `CompanyRepositoryException`); `lib/JobOrders.php:106-136`; `src/OpenCATS/Entity/JobOrderRepositoryException.php:2` (parse error on 8.x); `src/OpenCATS/UI/QuickActionMenu.php:13,22,28`.
- **Impact:** Two parallel conventions exist without a migration path. Errors on company or job-order insert become fatal instead of returning -1.
- **Recommendation:** Fix the namespace and `use` statements now. Then decide whether `src/` is the target architecture; if so, document the pattern (entity + repository + service using prepared statements) and migrate one aggregate at a time, starting with the one already present (JobOrder).

### ARCH-013 — Multi-tenancy is vestigial
- **Severity:** MEDIUM
- **Finding:** The schema and queries are tenant-scoped by `site_id`, but the public portals only serve the first site, attachment download deliberately bypasses the tenant filter, and a lot of hosted-CATS (ASP) tenancy logic is dead or hard-coded.
- **Evidence:** 36/55 tables with `site_id`; 342 `site_id` predicates. `lib/Site.php:161-182` + `CareersUI.php:79`/`RssUI.php:103`/`XmlUI.php:107`. `modules/attachments/AttachmentsUI.php:83-86` + `lib/Attachments.php:601-604`. `lib/Session.php:200-212` ('cognizo', site 200); `Session.php:939` (`transparentLogin`, no callers); `constants.php:187` (`CATS_ADMIN_SITE` 180).
- **Impact:** The code base carries the complexity and risk of multi-tenancy without supporting it end-to-end. Deployments that do create several sites (`&s=unixName` login) get a careers page for only one of them, and attachment access relies on an unguessable hash rather than on tenancy.
- **Recommendation:** Decide explicitly between single-tenant and multi-tenant.
  - If single-tenant: remove `unixName`/ASP/root branches and treat `site_id` as a constant.
  - If multi-tenant: resolve the site from host/path in bootstrap, pass it to the portals, and enforce `site_id` in `Attachments::get` (drop the `$verifySiteID=false` path).

### ARCH-014 — Configuration as mutable PHP source with hard-coded secrets; no environment support
- **Severity:** HIGH
- **Finding:** All configuration is PHP constants in a tracked `config.php` with default credentials and a license key. The application rewrites this PHP file at runtime, including values taken directly from HTTP requests during installation. Nothing reads environment variables. There are three drifting copies of the config, and real-looking credentials are committed in auxiliary files.
- **Evidence:**
  - `config.php:31,40-43,188-197,219-223,273`; `lib/CATSUtility.php:142-181`; `modules/install/ajax/ui.php:120-135` (`"'" . $_REQUEST['user'] . "'"`).
  - `getenv`/`$_ENV`: 0 occurrences.
  - `test/config.php` vs `config.php` diff; `optional-updates/latest-sphinx-search/config.php`.
  - `lib/sphinx/conf/sphinx.conf:14-18`; `scripts/mysql_get_prod_db.sh:8-10`.
- **Impact:**
  - The web server needs write permission on executable code.
  - Any quote character in installer input corrupts (or injects into) `config.php` (cross-ref security audit).
  - Twelve-factor/container deployment is impossible without editing code.
  - Committed credentials must be treated as leaked.
- **Recommendation:**
  - Ship `config.php.dist` and git-ignore `config.php`.
  - Make `config.php` read `getenv()` with defaults.
  - Have the installer write a separate `config.local.php` using `var_export()`.
  - Remove `changeConfigSetting` from runtime paths (license, demo mode, `TemplateUtility.php:842-848`).
  - Delete or redact `lib/sphinx/conf/sphinx.conf` and `scripts/mysql_get_prod_db.sh`, and rotate the credentials if they were ever real.

### ARCH-015 — Per-session module discovery; update detection tied to SVN
- **Severity:** MEDIUM
- **Finding:** Every new session triggers a directory scan, includes and instantiates all 23 module classes (including `TestsUI`, which loads SimpleTest and sets `error_reporting(E_ALL)`), takes a DB advisory lock and issues one `module_schema` SELECT per module. `CACHE_MODULES` is off by default and crashes on PHP 8 when on. Code-change detection reads `.svn/entries`, which never exists in a git checkout, so the session module registry and hooks never refresh after a deployment.
- **Evidence:**
  - `lib/ModuleUtility.php:152-156,242-243,262-274,459-468,307`; `modules/tests/TestsUI.php:42-46` (file-scope `error_reporting(E_ALL)` and `require_once` of simpletest).
  - `lib/CATSUtility.php:98-132` (`.svn/entries`); `lib/Session.php:111-160` (`getCachedBuild`/`checkForcedUpdate`).
  - `config.php:256`.
- **Impact:**
  - Cookie-less clients (bots, feed readers hitting `index.php`) each cause the full scan plus DB lock plus session file.
  - After an upgrade, logged-in users keep stale module and hook definitions, and pending migrations run only when a new session appears.
  - Test-harness code is loaded into production requests.
- **Recommendation:**
  - Replace discovery with a static PHP array registry (generated at deploy time or hand-maintained, like `$coreModules`).
  - Remove `modules/tests` from production packages.
  - Replace `getBuild()` with a version constant or deploy timestamp.
  - Keep migrations out of discovery (ARCH-005).

### ARCH-016 — Background processing relies on an unprovisioned, web-reachable cron script
- **Severity:** MEDIUM
- **Finding:** Calendar reminders and queue cleanup run only if something executes `QueueCLI.php` periodically. Nothing in the repo provisions this, the script has no CLI guard, and the task framework has duplicate files and a name/path inconsistency.
- **Evidence:** `QueueCLI.php:28,34-124`; `modules/calendar/tasks/tasks.php:39`; `lib/QueueProcessor.php:126-158,166-226`; duplicates `modules/queue/tasks.php` vs `modules/queue/tasks/tasks.php`, `modules/queue/lib/Task.php` vs `modules/queue/tasks/lib/Task.php`; no cron in `docker/*.yml`.
- **Impact:** Event reminder e-mails silently never go out on default deployments (INFERENCE). Anyone can trigger task runs over HTTP.
- **Recommendation:** Move the runner to `bin/queue-worker.php` with a CLI guard, add a cron (or supervisor loop) service to the Docker compose file, delete the dead duplicate task files, and store task paths consistently.

### ARCH-017 — Search implemented as REGEXP/LIKE scans; Sphinx integration obsolete
- **Severity:** MEDIUM
- **Finding:** There is no FULLTEXT index. Boolean resume search compiles to nested `REGEXP '[[:<:]]word[[:>:]]'` over `attachment.text`, and quick search uses leading-wildcard `LIKE` on `CONCAT`/`REPLACE` expressions. The optional Sphinx path uses a 2007 client API and a forked `Search.php` that cannot run on PHP 8.
- **Evidence:** `lib/DatabaseSearch.php:214-425` (`:360-363`); `lib/Search.php:1358-1376,1868-1920`; `grep -ci fulltext db/cats_schema.sql` → 0; `lib/sphinx/sphinxapi.php` (`$Id ... 2007-04-27`); `optional-updates/latest-sphinx-search/Search.php:228`.
- **Impact:** Search cost grows linearly with resume volume on MyISAM (table locks). ASSUMPTION: boolean search breaks on MySQL ≥ 8.0.4 (word-boundary syntax).
- **Recommendation:** Add `FULLTEXT(text)` on `attachment` (InnoDB supports it) and translate the boolean grammar to `MATCH … AGAINST (… IN BOOLEAN MODE)`. Replace `[[:<:]]` with `\\b` for MySQL 8 if REGEXP is kept. Drop the bundled Sphinx API, or replace it with Manticore/OpenSearch behind an interface.

### ARCH-018 — File storage inside the web root with weak isolation; converter integration fragile
- **Severity:** MEDIUM
- **Finding:** Attachments, uploads, temp files, backups and cache files are written under the document root with 0777 permissions. Access control relies on Apache `.htaccess` (not applicable to the nginx-based Docker setup) and on hard-to-guess directory names. Text extraction shells out to binaries whose default paths are placeholders. ODT extraction is broken.
- **Evidence:** `lib/Attachments.php:1282-1363`; `lib/FileUtility.php:468-495`; `attachments/.htaccess`, `upload/.htaccess`; `config.php:62-87`; `lib/DocumentToText.php:101-146,166,378,416-417`.
- **Impact:** Candidate PII (resumes) may be directly downloadable if the web server serves static files from `attachments/` (INFERENCE for nginx). Resume indexing fails silently when converters are missing. ODT resumes are never searchable.
- **Recommendation:** Move `attachments/`, `upload/`, `temp/` and backups outside the web root (a configurable `STORAGE_PATH`) and stream files only through `AttachmentsUI` with a tenant check. Use 0750/0640 permissions. Fix `$filename` → `$fileName` at `DocumentToText.php:166`. Default converter paths to `/usr/bin/...` and report missing binaries in the admin UI.

### ARCH-019 — Dead and legacy hosted-CATS code in production paths
- **Severity:** MEDIUM
- **Finding:** A large amount of code serves CATS Professional/hosted features that no longer exist. It is still loaded or reachable, and some of it performs network calls.
- **Evidence:**
  - License checks all return `true` (`lib/License.php:580-591,658-669`).
  - `TemplateUtility::printFooter` may rewrite `LICENSE_KEY` (`:842-848`).
  - Firefox toolbar API (`modules/toolbar/ToolbarUI.php`).
  - Phone-home to `www.catsone.com:80` sending site name, license key, user agent and active user count (`lib/NewVersionCheck.php:109-122,198-224`; disabled by the seeded `system` row `disable_version_check=1` in both `db/cats_schema.sql:1044` and `test/data/test.sql:1537`; the column default is `0` (`db/cats_schema.sql:1038`), so it is enabled wherever that row is missing).
  - SOAP parsing via resfly.com (`wsdl/*.wsdl`, `lib/ParseUtility.php`).
  - 222 unimplemented hook points.
  - Unused lib files: `ControlPanel.php` (1,573), `Profile.php` (1,219), `CBFUtility.php` (715), `Display.php` (233), `DefaultQuestionnaires.php` (206), `JavaScriptCompressor.php` (121), `Encryption.php` (114, mcrypt).
  - SimpleTest harness module `modules/tests` (3,019 PHP LOC) plus `lib/simpletest` (31k LOC).
  - `ajax/getReportHTML.php` (0 bytes).
  - Details are in `CODEBASE_MAP.md`.
- **Impact:** Larger attack surface and audit scope, misleading UX ("Upgrade to Professional", `lib/CommonErrors.php:74-87`), and PHP-8 migration cost spent on dead code (fpdf/artichow/mcrypt).
- **Recommendation:** Delete the listed dead files and modules after confirming with grep that nothing references them. Remove the hook call sites (ARCH-004), `License`/`LicenseUtility`, the toolbar module, `NewVersionCheck` (or point it at a GitHub releases API over HTTPS), and `wsdl/`.

### ARCH-020 — Error handling by `die()`; no exception model or logging
- **Severity:** MEDIUM
- **Finding:** Failures terminate the request with `die()` after rendering an HTML error template, echoing internals in HTML comments (the full `$_REQUEST` for `UserInterface::fatal`). There is no logger, exception hierarchy or central error handler.
- **Evidence:** 89 `die`/`exit` calls in `lib/*.php` + `modules/`; `lib/UserInterface.php:242-272` (echoes the full request in an HTML comment at `:259-269`); `lib/ModuleUtility.php:352-366`; `lib/DatabaseConnection.php:120-126` (prints the DB error to the browser).
- **Impact:** Operational problems are invisible (no logs) or leak details to the client. Partial writes are left behind when `die()` fires mid-operation (no transactions on MyISAM).
- **Recommendation:** Register `set_exception_handler`/`set_error_handler` in the shared bootstrap and log to a PSR-3 logger (Monolog is a small dependency). Replace `die()` in lib code with exceptions caught at the front controller, and remove request echoing from `UserInterface::fatal`.

### ARCH-021 — Integer-offset time-zone model with SQL rewriting
- **Severity:** MEDIUM
- **Finding:** Time zones are integer hour offsets from a server `OFFSET_GMT` constant: no DST, no half-hour zones (commented out), and localization done by rewriting `DATE_FORMAT(` in every SELECT string.
- **Evidence:** `config.php:180`; `constants.php:196-283`; `lib/Session.php:811` (`_timeZoneOffset = $rs['timeZone'] - OFFSET_GMT`); `lib/DatabaseConnection.php:648-712`; `index.php:54-57` (`date_default_timezone_set(date_default_timezone_get())`).
- **Impact:** Calendar/event times are wrong by 1 hour for half of the year in DST regions and wrong for India/Iran/Australia-central zones. The query rewriter can corrupt SQL that contains `DATE_FORMAT(` with nested parentheses or commas (it splits on the first `,`).
- **Recommendation:** Store UTC `DATETIME` values, keep an IANA zone name per site/user, convert in PHP with `DateTimeImmutable`, and delete `_localizationFilter`.

### ARCH-022 — Portal shims include a file chosen from `PHP_SELF`; RSS shim is broken
- **Severity:** MEDIUM
- **Finding:** `careers/index.php` and `xml/index.php` include the file named by the last path segment of `$_SERVER['PHP_SELF']` after `chdir('..')`. `rss/index.php` uses `LEGACY_ROOT` before any config is loaded, so it fatals on PHP 8 (verified `Error: Undefined constant "LEGACY_ROOT"`) and on PHP 7 (warning, then the class is not found). The same `getIndexName()` value is printed unescaped into JavaScript on every page.
- **Evidence:** `careers/index.php:36-39`; `xml/index.php:36-39`; `rss/index.php:36-38`; `lib/CATSUtility.php:304-329`; `lib/TemplateUtility.php:1195` (`CATSIndexName = "'.CATSUtility::getIndexName().'"`).
- **Impact:** INFERENCE: with PATH_INFO enabled (Apache default for PHP handlers), `/careers/index.php/<file>.php` can make the shim include another root-level PHP file, and `/index.php/<payload>` influences the `CATSIndexName` JS string (cross-ref security audit). The advertised RSS URL `rss/` does not work.
- **Recommendation:** In the shims, `require __DIR__ . '/../index.php';` directly. Make `getIndexName()` return a constant (`'index.php'`) or `basename($_SERVER['SCRIPT_NAME'])`, and JSON-encode it when printed into JS. Fix `rss/index.php` to include `config.php` first (or merge it with the shim pattern above).

### ARCH-023 — Include-order coupling, include cycles and eager loading
- **Severity:** MEDIUM
- **Finding:** There is no autoloading for `lib/`. Files `include_once` their dependencies with paths that depend on the current directory, rely on others having loaded classes they use, and form include cycles. A static walk from `index.php` reaches 49 files / 29,276 LOC (upper bound; includes conditional includes) before any module-specific code.
- **Evidence:**
  - `index.php:59-70` (comments such as `/* Depends: MRU, Users, DatabaseConnection. */`).
  - `lib/TemplateUtility.php:39` pulls in `Candidates.php` at file scope (`Companies.php` conditionally at `:748`).
  - Cycles: `lib/Calendar.php` ↔ `lib/JobOrders.php` (JobOrders includes Calendar `:44`; Calendar includes JobOrders); `lib/Contacts.php` ↔ `lib/Calendar.php`; `lib/Mailer.php:46` → `Pipelines` → uses `Mailer` (`Pipelines.php:371`). Evidence for the Calendar cycles: `lib/Calendar.php:44-48` includes Companies/Candidates/JobOrders/Contacts/Mailer; `lib/Companies.php:42-43`, `lib/Contacts.php:35`.
  - `lib/ACL.php:10` `include_once("./config.php")`; `lib/Session.php:33` uses `include` (not `_once`).
  - Most-included files: `StringUtility` (25 includers), `DateUtility` (19), `Candidates` (18).
- **Impact:** Moving or renaming a file breaks unrelated pages. Scripts run from another working directory fail. Every request pays the parse cost of the domain layer (mitigated only if opcache is enabled; UNKNOWN in the external image).
- **Recommendation:** Add a Composer `classmap` autoload entry for `lib/` (no code changes needed, since the classes are global), then delete the `include_once` lines incrementally. Break cycles by moving shared constants/types out of `Calendar`/`JobOrders`.

### ARCH-024 — Legacy frontend stack loaded globally
- **Severity:** LOW
- **Finding:** Every page loads jQuery 1.3.2 (2009), a custom `lib.js` and `subModal.js`, and uses XHTML Transitional table layouts with IE-specific CSS. CKEditor 4 is served from `vendor/`. One referenced validator script does not exist.
- **Evidence:** `lib/TemplateUtility.php:1178-1216`; `js/jquery-1.3.2.min.js`; `modules/joborders/Add.tpl:2`; `composer.lock` (`ckeditor/ckeditor 4.25.1`); `modules/candidates/AddActivityChangeStatusModal.tpl:3-7`.
- **Impact:** Known client-side vulnerabilities in old jQuery (cross-ref dependency audit), no responsive UI, and `vendor/` must be public.
- **Recommendation:** See the UX and dependency audits. Architecturally, first introduce a per-page asset manifest so jQuery can be upgraded or removed module by module, and copy CKEditor assets to `public/assets` at build time instead of serving `vendor/`.

### ARCH-025 — Docker setup is development-only and not reproducible
- **Severity:** MEDIUM
- **Finding:**
  - The compose stack depends on externally built images (no Dockerfile in the repo) pinned to PHP 7.2.
  - The DB image is unpinned; the DB and phpMyAdmin (auto-login) are published.
  - The whole repo is mounted as the docroot, the DB is seeded with test data, and there is no cron, healthcheck or TLS configuration.
- **Evidence:** `docker/docker-compose.yml:5,14,22,27-37,39-49`; `docker/docker-compose-test.yml:5,14,27`.
- **Impact:** No supported production deployment recipe exists. Following the compose file exposes the database through phpMyAdmin without a login. Builds are not reproducible (the image contents are UNKNOWN and could change upstream).
- **Recommendation:**
  - Add an in-repo `Dockerfile` (PHP 8.x-fpm + mysqli, gd, zip, soap, ldap + antiword/poppler-utils) and a production compose file without phpMyAdmin.
  - Pin `mariadb:<version>`, mount only `public/` as docroot, and add a cron/queue service and healthchecks.

---

## Facts vs Assumptions

**FACTS (verified in code or by running `php -l` / PHP 8.4 snippets):**
- Everything cited with file:line above.
- The 6 `php -l` parse failures on PHP 8.4.
- The removed-function call sites.
- `implode` TypeError, undefined-constant `Error`, property-on-null `Error` and mysqli exception behaviour on PHP 8.4.
- The hook, `$_SESSION`, `getInstance` and access-check counts.
- The absence of FULLTEXT indexes, `getenv`, `session_regenerate_id`, `mysqli_report` and prepared statements.
- The release job not running Composer.
- LOC and include-graph numbers (static analysis).

**ASSUMPTIONS / INFERENCES (not verifiable statically here):**
- PHP 7.x parses `namespace \OpenCATS\Entity;` as an expression statement (based on the PHP 7 grammar; not executed on 7.x).
- The nginx image ignores `.htaccess`, so attachment/upload protections are ineffective in Docker.
- PATH_INFO-based include/JS injection via `getIndexName()` depends on web-server configuration.
- `scripts/makeBackup.php` HTTP execution depends on `register_argc_argv`.
- MySQL ≥ 8.0.4 rejects `[[:<:]]`; MariaDB accepts it.
- The release zip is unusable without a manual `composer install` (depends on user docs outside the repo).
- Calendar reminders don't fire on default deployments (depends on operator cron).
- Travis CI is inactive.
- Committed sphinx/prod credentials were real at some point.

## Unknowns / Needs Further Investigation

1. Contents of `opencats/php-base:7.2-fpm-alpine` and `prooph/nginx:www` (enabled extensions, opcache, nginx location rules for `attachments/`, `upload/`, `db/`, `test/`, `vendor/`, PATH_INFO handling, cron).
2. Whether the GitHub Actions `tests` job currently passes (the Behat/integration steps and `fail_on_failure: false` hide failures); CI run history was not inspected.
3. Runtime behaviour on PHP 8.x beyond the listed blockers (null-to-string deprecations, `count()` on non-arrays, arithmetic on non-numeric strings). This needs a PHP 8 test environment with a database; static grep cannot enumerate these exhaustively.
4. Whether any production deployments set `CACHE_MODULES=true` (crash on PHP 8) or `ENABLE_SPHINX=true`.
5. Real-world effect of the `_localizationFilter` rewriting on complex queries with nested `DATE_FORMAT(`.
6. Whether `ckeditor/ckeditor 4.25.1` (locked) is an LTS build requiring a commercial license key; the dependency audit should confirm.
7. Whether the `lib/sphinx/conf/sphinx.conf` and `scripts/mysql_get_prod_db.sh` credentials were ever valid (git history not examined).
8. Frequency and impact of per-session module discovery under real traffic (requires profiling).

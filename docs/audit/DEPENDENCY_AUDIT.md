# OpenCATS — Dependency & Supply-Chain Audit

**Scope.** This audit covers every third-party dependency the application or its tooling relies on:
- Composer runtime and dev packages (`composer.json`, `composer.lock`)
- third-party code vendored into the tree without a package manager (`lib/artichow`, `lib/fpdf`, `lib/simpletest`, `lib/sphinx`, `js/*`, fonts)
- system binaries, PHP extensions, and PHP/MySQL version expectations
- external network services called at runtime
- container images (`docker/*.yml`), GitHub Actions, and dependency-update automation (`.github/dependabot.yml`)

For each dependency it records the version, where the code uses it, known-vulnerability and licence status, and a keep/upgrade/replace/remove decision.

---

## Method

Everything was read-only against the repository. Commands that execute code ran in a scratch copy (`$SCRATCH/oc-copy`, repo copied without `.git`). The toolchain was PHP 8.4.19 CLI and Composer 2.8.12, with network access through the sandbox proxy.

| Step | Command | Result / evidence file |
|---|---|---|
| Lock inventory | `php -r 'json_decode(file_get_contents("composer.lock"))…'` | 2 runtime + 64 dev packages (§1, §2) |
| Runtime install | `composer install --no-dev` (scratch) | OK: ckeditor/ckeditor 4.25.1, phpmailer/phpmailer v6.8.0 (`notes/composer-install-nodev.txt`) |
| Full install | `composer install` (scratch) | **fails on PHP 8.4**: 27 locked packages require PHP 5/7 (`notes/composer-install-plain.txt`) |
| Advisory scan | `composer audit --locked --format=json` (scratch) | **22 advisories in 8 packages, all dev** (`notes/composer-audit.json`) |
| Abandonment | `composer show -a <pkg>` against Packagist | 6 abandoned packages (`notes/packagist-status.txt`) |
| Installed package inspection | `LICENSE.md`, `CHANGES.md`, `package.json`, `ckeditor.js` header in `vendor/ckeditor/ckeditor` (scratch) | CKEditor is "4.25.1-lts", commercial licence (§1.1) |
| Vendored code | `head`/`grep` of file headers for version and licence strings; `grep -rn` for usage sites | §3, §4 |
| PHP 8 compatibility | `php -d error_reporting=-1 -l` over 355 `.php` + 136 `.tpl` files outside `vendor/` | 6 parse errors, incl. `lib/artichow/AntiSpam.class.php:63` and `lib/fpdf/fpdf.php:434` (`notes/lint-php84-mine.txt`) |
| SimpleTest include on PHP 8.4 | `php -r 'require "lib/simpletest/web_tester.php"; …'` (scratch) | loads without error |
| Extension usage | `grep -rnE` for `mysqli_`, `mysql_`, `image*`, `ldap_`, `mb_`, `ZipArchive`, `DOMDocument`/`simplexml_*`, `SoapClient`, `iconv`, `mcrypt_`, `gz*`, `utf8_encode` | §5 |
| Git history (shallow clone, 57 commits) | `git show e1c2c9b -- composer.lock` | CKEditor bump 4.20.2 → 4.25.1 happened on 2026-01-09 (§1.1) |
| Docker | `docker info` | daemon unreachable (`/var/run/docker.sock` missing); images were **not** pulled or scanned |

The CVE IDs attached to jQuery, PHP, MariaDB and Selenium versions come from external knowledge and are labelled as such. They should be re-verified against NVD or GHSA before being quoted externally. The Composer advisories come from the live `composer audit` run and are facts at the audit date (2026-09-25).

---

## Summary of Findings

| ID | Title | Severity |
|---|---|---|
| DEP-001 | Runtime is pinned to EOL PHP 7.2; code does not parse on PHP ≥ 8.0; no PHP constraint declared anywhere | CRITICAL |
| DEP-002 | CKEditor is locked to 4.25.1-**lts**, a commercial-licence build, with no licence key configured; the last open-source 4.x (4.22.1) is EOL and flagged insecure by its vendor | HIGH |
| DEP-003 | jQuery 1.3.2 (2009) loads on every back-office page; many public XSS CVEs; not tracked by any tool | HIGH |
| DEP-004 | GitHub release artifact omits `vendor/` although the app hard-requires it | HIGH |
| DEP-005 | Dev/test toolchain is unresolvable on PHP 8, contains 6 abandoned packages and a `dev-master` pin, and carries 22 advisories (1 critical) | HIGH |
| DEP-006 | Bundled PHP libraries (Artichow, FPDF 1.53, Sphinx API 2007, SimpleTest 1.1.0, mcrypt wrapper) are unmaintained and partly PHP-8-fatal | HIGH |
| DEP-007 | Vendored JavaScript (subModal, sweetTitles, sorttable, calendarDateInput, EventCache) has no version/licence tracking; some licences are unclear or share-alike | MEDIUM |
| DEP-008 | Container images are EOL, unpinned or of unknown provenance; the dev stack exposes DB and phpMyAdmin with default credentials and seeds known ROOT accounts | MEDIUM |
| DEP-009 | System-binary and PHP-extension requirements are undeclared and only partially checked; removed APIs remain | MEDIUM |
| DEP-010 | Hard-coded third-party services over plaintext HTTP (catsone.com, resfly.com, Google geocode) | MEDIUM |
| DEP-011 | Licence-compatibility risks (GPL Sphinx API, CC BY-SA sweetTitles, commercial CKEditor, no licence in `composer.json`) | MEDIUM |
| DEP-012 | Dependabot covers only Composer and carries stale ignores; Actions are tag-pinned; some workflows are inactive | LOW |
| DEP-013 | PHPMailer v6.8.0 lags current releases (no known advisories) | LOW |
| DEP-014 | `composer.json` constraints are loose where they should be tight (CKEditor) and tight where they should move (Behat), and include unused and `dev-master` entries | LOW |

---

## 1. Composer runtime dependencies (`composer.json` "require")

| Package | Constraint (`composer.json`) | Locked | Released | Declared licence (lock) | Usage sites | Advisories (`composer audit`) |
|---|---|---|---|---|---|---|
| `phpmailer/phpmailer` | `^6.5.0` (`composer.json:18`) | **v6.8.0** | 2023-03-06 | LGPL-2.1-only | `lib/Mailer.php:39-43` (`use PHPMailer\PHPMailer\PHPMailer; … require './vendor/autoload.php';`), `:76` `new PHPMailer(true)`. `lib/Mailer.php` is included by `modules/login/LoginUI.php`, `modules/settings/SettingsUI.php`, `lib/EmailTemplates.php`, `lib/Calendar.php`, `lib/CareerPortal.php`, `ajax/testEmailSettings.php` | none |
| `ckeditor/ckeditor` | `^4.16.0` (`composer.json:19`) | **4.25.1** ("4.25.1-lts (Standard)") | 2025-02-05 | GPL-2.0+/LGPL-2.1+/MPL-1.1+ in the lock, **contradicted** by the package's own `LICENSE.md` (see §1.1) | `modules/joborders/Add.tpl:2,311`, `modules/joborders/Edit.tpl:2,337`, `modules/candidates/SendEmail.tpl:2,137` (script `vendor/ckeditor/ckeditor/ckeditor.js`); `js/ckeditor-manager.js:4` `CKEDITOR.replace(nodeId, { extraPlugins: 'font' })`; `js/emailHandler.js:158,162,187,199` | none (the database does not cover the LTS/OSS split) |

The PSR-4 autoloader (`composer.json:12-16`) is also a runtime dependency. `lib/TemplateUtility.php:38`, `lib/Companies.php:2` and `lib/JobOrders.php:2` load it with `include_once('./vendor/autoload.php')` to reach `OpenCATS\Entity\*`.

### 1.1 CKEditor facts (verified in the installed package, scratch copy)
- `vendor/ckeditor/ckeditor/LICENSE.md` line 1: *"Software License Agreement for CKEditor 4 LTS (4.23.0 and above)… CKEditor 4 LTS ("Long Term Support") is available under exclusive terms of the Extended Support Model. Contact us to obtain a commercial license."*
- `CHANGES.md`, 4.22.0/4.22.1 entry: *"This is the last open source release of CKEditor 4… CKEditor 4 has reached its End of Life in June 2023."*
- `CHANGES.md`, 4.25.0-lts entry: *"All editor versions below 4.25.0-lts can no longer be considered as secure!"* It lists XSS fixes GHSA-7r32-vfj5-c2jv and GHSA-6v96-m24v-f58j. The 4.24.0-lts entry lists GHSA-fq6h-4g8v-qqvm, GHSA-wh5w-82f3-wrxh and GHSA-mw2c-vx6j-mg76.
- `ckeditor.js` embeds the strings `"[CKEDITOR]: The license key is missing or invalid."` and `"This version of the editor is under commercial terms and requires acquiring an …"`. OpenCATS never sets `licenseKey` (`grep -rn licenseKey js modules --include=*.js --include=*.tpl` returns nothing CKEditor-related).
- The package's `README.md:88` still says "Licensed under the GPL, LGPL, and MPL licenses", which contradicts its `LICENSE.md`.
- Git: commit `e1c2c9b` (2026-01-09, "Feature/migrate ci to GitHub actions (#695)") changed the lock from `"version": "4.20.2"` to `"4.25.1"` alongside unrelated CI work.
- The package ships `samples/` and a `codesnippetgeshi` plugin. Because templates reference `vendor/ckeditor/...` directly, `vendor/` must be served by the web server (FACT from the template paths), which also exposes those extra files.

---

## 2. Composer dev dependencies (`composer.json` "require-dev", 64 locked packages)

Direct dev requirements (`composer.json:3-11`): `behat/behat ~3.0.4`, `phpunit/phpunit ^7.5.7`, `behat/mink ^1.7.1`, `behat/mink-extension dev-master`, `behat/mink-goutte-driver ^1.2.1`, `behat/mink-selenium2-driver ^1.3.1`, `codacy/coverage ^1.4.2`.

The "PHP-8 blocker" rows are the packages `composer install` rejects on PHP 8.4. "Abandoned" was verified with `composer show -a` on 2026-09-25. Advisories come from `composer audit --locked`.

| Package | Locked | PHP constraint | Licence | Released | Notes |
|---|---|---|---|---|---|
| `behat/behat` | v3.0.15 | `>=5.3.3` | MIT | 2015-02-22 | direct |
| `behat/gherkin` | v4.6.0 | `>=5.3.1` | MIT | 2019-01-16 |  |
| `behat/mink` | v1.7.1 | `>=5.3.1` | MIT | 2016-03-05 | direct |
| `behat/mink-browserkit-driver` | 1.3.3 | `>=5.3.6` | MIT | 2018-05-02 |  |
| `behat/mink-extension` | dev-master | `>=5.3.2` | MIT | 2018-02-06 | direct; abandoned → friends-of-behat/mink-extension |
| `behat/mink-goutte-driver` | v1.2.1 | `>=5.3.1` | MIT | 2016-03-05 | direct; abandoned → behat/mink-browserkit-driver |
| `behat/mink-selenium2-driver` | v1.3.1 | `>=5.3.1` | MIT | 2016-03-05 | direct |
| `behat/transliterator` | v1.2.0 | `>=5.3.3` | Artistic-1.0 | 2017-04-04 |  |
| `codacy/coverage` | 1.4.2 | `>=5.3.3` | MIT | 2018-03-22 | direct; abandoned; unused (no coverage step anywhere) |
| `doctrine/instantiator` | 1.1.0 | `^7.1` | MIT | 2017-07-22 | PHP-8 blocker |
| `fabpot/goutte` | v3.2.3 | `>=5.5.0` | MIT | 2018-06-29 | abandoned → symfony/browser-kit |
| `gitonomy/gitlib` | v1.0.4 | `^5.3 \|\| ^7.0` | MIT | 2018-04-22 | PHP-8 blocker |
| `guzzlehttp/guzzle` | 6.5.8 | `>=5.5` | MIT | 2022-06-20 | advisories: 9 (1 high) |
| `guzzlehttp/promises` | 1.5.3 | `>=5.5` | MIT | 2023-05-21 |  |
| `guzzlehttp/psr7` | 1.9.1 | `>=5.4.0` | MIT | 2023-04-17 | advisories: 4 (medium) |
| `instaclick/php-webdriver` | 1.4.5 | `>=5.3.2` | Apache-2.0 | 2017-06-30 |  |
| `myclabs/deep-copy` | 1.8.1 | `^7.1` | MIT | 2018-06-11 | PHP-8 blocker |
| `phar-io/manifest` | 1.0.3 | `^5.6 \|\| ^7.0` | BSD-3-Clause | 2018-07-08 | PHP-8 blocker |
| `phar-io/version` | 2.0.1 | `^5.6 \|\| ^7.0` | BSD-3-Clause | 2018-07-08 | PHP-8 blocker |
| `phpdocumentor/reflection-common` | 1.0.1 | `>=5.5` | MIT | 2017-09-11 |  |
| `phpdocumentor/reflection-docblock` | 4.3.0 | `^7.0` | MIT | 2017-11-30 | PHP-8 blocker |
| `phpdocumentor/type-resolver` | 0.4.0 | `^5.5 \|\| ^7.0` | MIT | 2017-07-14 | PHP-8 blocker |
| `phpspec/prophecy` | 1.8.0 | `^5.3\|^7.0` | MIT | 2018-08-05 | PHP-8 blocker |
| `phpunit/php-code-coverage` | 6.1.4 | `^7.1` | BSD-3-Clause | 2018-10-31 | PHP-8 blocker |
| `phpunit/php-file-iterator` | 2.0.2 | `^7.1` | BSD-3-Clause | 2018-09-13 | PHP-8 blocker |
| `phpunit/php-text-template` | 1.2.1 | `>=5.3.3` | BSD-3-Clause | 2015-06-21 |  |
| `phpunit/php-timer` | 2.1.1 | `^7.1` | BSD-3-Clause | 2019-02-20 | PHP-8 blocker |
| `phpunit/php-token-stream` | 3.0.1 | `^7.1` | BSD-3-Clause | 2018-10-30 | PHP-8 blocker |
| `phpunit/phpunit` | 7.5.7 | `^7.1` | BSD-3-Clause | 2019-03-16 | direct; PHP-8 blocker; advisories: 1 high (CVE-2026-24765) |
| `psr/http-message` | 1.1 | `^7.2 \|\| ^8.0` | MIT | 2023-04-04 |  |
| `psr/log` | 1.1.0 | `>=5.3.0` | MIT | 2018-11-20 |  |
| `ralouphie/getallheaders` | 3.0.3 | `>=5.6` | MIT | 2019-03-08 |  |
| `sebastian/code-unit-reverse-lookup` | 1.0.1 | `^5.6 \|\| ^7.0` | BSD-3-Clause | 2017-03-04 | PHP-8 blocker |
| `sebastian/comparator` | 3.0.2 | `^7.1` | BSD-3-Clause | 2018-07-12 | PHP-8 blocker |
| `sebastian/diff` | 3.0.2 | `^7.1` | BSD-3-Clause | 2019-02-04 | PHP-8 blocker |
| `sebastian/environment` | 4.1.0 | `^7.1` | BSD-3-Clause | 2019-02-01 | PHP-8 blocker |
| `sebastian/exporter` | 3.1.0 | `^7.0` | BSD-3-Clause | 2017-04-03 | PHP-8 blocker |
| `sebastian/global-state` | 2.0.0 | `^7.0` | BSD-3-Clause | 2017-04-27 | PHP-8 blocker |
| `sebastian/object-enumerator` | 3.0.3 | `^7.0` | BSD-3-Clause | 2017-08-03 | PHP-8 blocker |
| `sebastian/object-reflector` | 1.1.1 | `^7.0` | BSD-3-Clause | 2017-03-29 | PHP-8 blocker |
| `sebastian/recursion-context` | 3.0.0 | `^7.0` | BSD-3-Clause | 2017-03-03 | PHP-8 blocker |
| `sebastian/resource-operations` | 2.0.1 | `^7.1` | BSD-3-Clause | 2018-10-04 | PHP-8 blocker |
| `sebastian/version` | 2.0.1 | `>=5.6` | BSD-3-Clause | 2016-10-03 |  |
| `symfony/browser-kit` | v4.2.4 | `^7.1.3` | MIT | 2019-02-23 | PHP-8 blocker |
| `symfony/class-loader` | v2.8.49 | `>=5.3.9` | MIT | 2018-11-11 | abandoned |
| `symfony/config` | v2.8.49 | `>=5.3.9` | MIT | 2018-11-26 |  |
| `symfony/console` | v2.8.49 | `>=5.3.9` | MIT | 2018-11-20 |  |
| `symfony/css-selector` | v3.4.23 | `^5.5.9\|>=7.0.8` | MIT | 2019-01-16 |  |
| `symfony/debug` | v3.0.9 | `>=5.5.9` | MIT | 2016-07-30 | abandoned → symfony/error-handler |
| `symfony/dependency-injection` | v2.8.49 | `>=5.3.9` | MIT | 2018-11-11 | advisories: 1 **critical** (CVE-2019-10910, fixed in 2.8.50) |
| `symfony/dom-crawler` | v4.2.4 | `^7.1.3` | MIT | 2019-02-23 | PHP-8 blocker; advisories: 1 low |
| `symfony/event-dispatcher` | v2.8.49 | `>=5.3.9` | MIT | 2018-11-21 |  |
| `symfony/filesystem` | v3.0.9 | `>=5.5.9` | MIT | 2016-07-20 |  |
| `symfony/polyfill-apcu` | v1.10.0 | `>=5.3.3` | MIT | 2018-08-06 |  |
| `symfony/polyfill-ctype` | v1.10.0 | `>=5.3.3` | MIT | 2018-08-06 |  |
| `symfony/polyfill-intl-idn` | v1.33.0 | `>=7.2` | MIT | 2024-09-10 | advisories: 1 low |
| `symfony/polyfill-intl-normalizer` | v1.33.0 | `>=7.2` | MIT | 2024-09-09 |  |
| `symfony/polyfill-mbstring` | v1.33.0 | `>=7.2` | MIT | 2024-12-23 |  |
| `symfony/polyfill-php80` | v1.33.0 | `>=7.2` | MIT | 2025-01-02 |  |
| `symfony/process` | v4.4.44 | `>=7.1.3` | MIT | 2022-06-27 | advisories: 2 (1 high, CVE-2024-51736) |
| `symfony/translation` | v2.8.49 | `>=5.3.9` | MIT | 2018-11-24 |  |
| `symfony/yaml` | v2.8.49 | `>=5.3.9` | MIT | 2018-11-11 | advisories: 3 low |
| `theseer/tokenizer` | 1.1.0 | `^7.0` | BSD-3-Clause | 2017-04-07 | PHP-8 blocker |
| `webmozart/assert` | 1.4.0 | `^5.3.3 \|\| ^7.0` | MIT | 2018-12-25 | PHP-8 blocker |

### 2.1 `composer audit --locked` (2026-09-25) — 22 advisories, 8 packages, all dev-only
| Package (locked) | Advisories |
|---|---|
| guzzlehttp/guzzle 6.5.8 | CVE-2026-69246 (high, host-check bypass), CVE-2026-69245, CVE-2026-67354, CVE-2026-67355, CVE-2026-67353, CVE-2026-59883, CVE-2026-67339, CVE-2026-55767, CVE-2026-55568 (medium) |
| guzzlehttp/psr7 1.9.1 | CVE-2026-59882, CVE-2026-55766, CVE-2026-49214, CVE-2026-48998 (medium) |
| phpunit/phpunit 7.5.7 | CVE-2026-24765 (high, unsafe deserialization in PHPT coverage; fixed in 8.5.52/9.6.33/10.5.62/11.5.50/12.5.8) |
| symfony/dependency-injection v2.8.49 | CVE-2019-10910 (**critical**) |
| symfony/process v4.4.44 | CVE-2024-51736 (high, Windows), CVE-2026-24739 (medium) |
| symfony/yaml v2.8.49 | CVE-2026-45304, CVE-2026-45305, CVE-2026-45133 (low) |
| symfony/dom-crawler v4.2.4 | CVE-2026-45071 (low, XXE) |
| symfony/polyfill-intl-idn v1.33.0 | CVE-2026-46644 (low) |

CI runs `composer audit || true` (`.github/workflows/ci.yml:48`), so none of these block a merge.

---

## 3. Vendored third-party PHP (not managed by Composer)

| Component | Location / size | Version evidence | Licence evidence | Usage sites | PHP 8.4 status |
|---|---|---|---|---|---|
| **Artichow** (charts) | `lib/artichow/`, 40 files, 420 KB, with Tuffy TTF fonts in `lib/artichow/font/` | no version constant; header comment says "For PHP 4+5 version" (`lib/artichow/Graph.class.php:12`) | Public Domain dedication (`lib/artichow/Artichow.cfg.php:2-6`) | `lib/GraphGenerator.php:38-44` (includes `LinePlot`, `BarPlot`, `Label`, `BarPlotPipeline`, `BarPlotDashboard`, `AntiSpam`, `Pie`); consumers are `modules/graphs/GraphsUI.php`, `lib/Graphs.php`, `modules/joborders/JobOrdersUI.php`, `modules/settings/SettingsUI.php`, `lib/WebForm.php` | **Parse error** `lib/artichow/AntiSpam.class.php:63` (`$letters{…}`); deprecations in `BarPlotDashboard.class.php:104`, `BarPlotPipeline.class.php:102`, `inc/Label.class.php:568` |
| **FPDF** | `lib/fpdf/`, 34 files, 276 KB | `define('FPDF_VERSION','1.53')` (`lib/fpdf/fpdf.php:16`) | "License: Freeware" (header) | `modules/reports/ReportsUI.php:414` `include_once(LEGACY_ROOT . '/lib/fpdf/fpdf.php')` | **Parse error** `lib/fpdf/fpdf.php:434` (`$cw[$s{$i}]`) and `lib/fpdf/font/makefont/makefont.php:18` |
| **Sphinx PHP client API** | `lib/sphinx/sphinxapi.php` + `conf/`, `index/`, `var/`, `STOPWORDS` | `$Id: sphinxapi.php 2394 2007-04-27` (`:4`); protocol `VER_COMMAND_SEARCH 0x107` (`:26`) | "GNU General Public License" with no version stated (`:8-13`) | `lib/Search.php:37-40` (`if (ENABLE_SPHINX) include_once(SPHINX_API);`); config `config.php:97-101` (`ENABLE_SPHINX false`, port 3312). `optional-updates/latest-sphinx-search/config.php:90` points to `/var/www/cats/lib/sphinx_latest/sphinxapi.php`, **which is not in the repo** | lints clean; protocol compatibility with current Sphinx/Manticore UNKNOWN |
| **SimpleTest** | `lib/simpletest/`, 131 files, 1.9 MB (incl. `docs/`, 48 scripts in `test/`) | `lib/simpletest/VERSION` = `1.1.0` | LGPL-2.1 (`lib/simpletest/LICENSE`) | `modules/tests/TestsUI.php:43-46` `require_once('lib/simpletest/…')`. `TestsUI.php` is included for every session by module discovery (`lib/ModuleUtility.php:152-155,262`) | loads on 8.4; `${var}` deprecation at `mock_objects.php:704`; `test/test_with_parse_error.php` is an intentional parse error |
| **mcrypt wrapper** (first-party, depends on a removed extension) | `lib/Encryption.php` | — | CPL | `mcrypt_module_open` etc. (`:52,73-86`); **no includes anywhere** (`grep -rn "Encryption.php"` finds nothing) | ext/mcrypt was removed from PHP core in 7.2 (external knowledge); dead code |
| **DataGrid filter template** | `lib/datagrid/FilterArea.tpl` (1 file) | — | first-party CATS code, not third-party | `lib/DataGrid.php` | clean |

Fonts: `lib/artichow/font/Tuffy*.ttf` (4 files). The Tuffy family is public domain (external knowledge, attributed to Thatcher Ulrich). `lib/fpdf/font/*.php` hold core-font metrics and `makefont/*.map` hold codepage maps (FPDF freeware). No web fonts ship.

---

## 4. Vendored third-party JavaScript

No `package.json` exists, and no tool (Dependabot, npm audit, retire.js) tracks any of these files.

| File | Version / author (header) | Licence (header) | Loaded from | Notes |
|---|---|---|---|---|
| `js/jquery-1.3.2.min.js` | "jQuery JavaScript Library v1.3.2 … Date: 2009-02-19" | "Dual licensed under the MIT and GPL licenses" | `lib/TemplateUtility.php:1194`, i.e. the common header on **every back-office page** | direct `$`/`jQuery` usage in only 3 files: `modules/settings/tags.tpl:41-79` (`$.ajax`, `.serialize()`, `.prepend(data)`, `.html(...)`), `modules/settings/EmailTemplates.tpl:21-22`, `js/emailHandler.js:183,198` |
| `js/submodal/subModal.js` (+ `close.gif`, `loading.html`) | "POPUP WINDOW CODE v1.1 … By Seth Banks" | "free for you to use anywhere, just keep this comment block" | `lib/TemplateUtility.php:1193`, `:548-554`; `installwizard.php:28` | powers all modal dialogs (pipelines, activities) |
| `js/sweetTitles.js` | "Sweet Titles (c) Creative Commons 2005 … Dustin Diaz"; `$Id … 2006-09-05` | **CC BY-SA 2.5** (share-alike, not a software licence) | about 20 templates via `printHeader(..., 'js/sweetTitles.js')` | tooltip helper |
| `js/sorttable.js` | "Originally by Stuart Langridge. Modifications by Cognizo" | **none stated** | 17 templates, incl. **public** careers templates `modules/careers/Blank.tpl:10,14`, `Blank2.tpl`, `BlankNoMargin.tpl` | table sorting |
| `js/calendarDateInput.js` | "Fool-Proof Date Input Script with DHTML Calendar by Jason Moon" | **none stated** | `lib/TemplateUtility.php:1192` (every page) + careers `Blank.tpl:11,15` | uses `document.writeln` at load |
| `js/lib.js` (embedded) | "EventCache Copyright (C) 2005 Mark Wubben … addEvent() Copyright (C) 2001 Scott Andrew LePera" (`js/lib.js:7-11`) | EventCache: **CC-GNU LGPL 2.1** inside a CPL-licensed file | every page, incl. careers | mixed-licence file |
| `vendor/ckeditor/ckeditor/**` | 4.25.1-lts | commercial (see §1.1) | job orders, send email | Composer-managed but served publicly from `vendor/` |

The other 32 `js/*.js` files and 18 `modules/**/*.js` files carry the CATS Public License header (first-party).

**Known vulnerabilities in jQuery 1.3.2 (EXTERNAL KNOWLEDGE, verify before citing):** CVE-2011-4969 (selector/`location.hash` XSS, fixed 1.6.3), CVE-2012-6708 (strings starting with non-`<` parsed as HTML, fixed 1.9.0), CVE-2020-7656 (`load()` script execution, fixed 1.9.0), CVE-2015-9251 (cross-domain AJAX script execution, fixed 3.0.0), CVE-2019-11358 (`$.extend` prototype pollution, fixed 3.4.0), CVE-2020-11022 / CVE-2020-11023 (`htmlPrefilter` XSS in `.html()`/`.append()`, fixed 3.5.0). `modules/settings/tags.tpl:50` (`$(ul).prepend(data)`) and `:79` (building HTML from `.html()` output) are the kind of sinks CVE-2020-11022/11023 affect.

---

## 5. Platform, system binaries and PHP extensions

### 5.1 PHP version constraints (FACT)
| Where | What it enforces |
|---|---|
| `composer.json` | **no `"php"` requirement and no `config.platform`** |
| `lib/InstallationTests.php:164` | `version_compare(PHP_VERSION, '5.0.0', '>=')`, a minimum of PHP 5.0.0 and **no maximum** |
| `installwizard.php:12-20` | `if ($phpVersionParts[0] >= 5)`; the message says "PHP 5.0.0 or greater is required" (`:105`) |
| `modules/install/phpVersion.php:20` | "OpenCATS Requires PHP 5 or better." The file is **not referenced anywhere** (orphan) |
| Docker / CI | `opencats/php-base:7.2-fpm-alpine` (`docker/docker-compose.yml:14`, `docker-compose-test.yml:14`); CI matrix `['7.2']` (`.github/workflows/ci.yml:21`) |
| Code reality on PHP ≥ 8.0 | parse error `lib/CATSUtility.php:108` (included by `index.php:61`, `ajax.php:43`, `careers/index.php:38`, `rss/index.php:37`, `xml/index.php:38`, `QueueCLI.php:40`, via `lib/License.php:33` and `lib/Wizard.php:34`); `get_magic_quotes_runtime()`/`_gpc()` (removed in 8.0) at `index.php:93,99`, `ajax.php:50,56`, `QueueCLI.php:59,65`, `lib/InstallationTests.php:185`, `lib/Attachments.php:944`, `modules/import/ImportUI.php:495`; `strftime()` (deprecated in 8.1) at `lib/DateUtility.php:148,472,476,480`, `lib/Calendar.php:575`; `utf8_encode()` (deprecated in 8.2) at `lib/DocumentToText.php:424,515`; **no `mysqli_report()` call anywhere**, although PHP 8.1 made mysqli throw exceptions by default (external knowledge) while the code checks `if (!$queryResult)` (e.g. `lib/DatabaseConnection.php`) |

### 5.2 PHP extensions
| Extension | Code usage (evidence) | Checked by installer (`lib/InstallationTests.php`)? |
|---|---|---|
| mysqli | 99 call sites in 16 files, e.g. `lib/DatabaseConnection.php:111,128` | yes (`:229`), required |
| session | `session_start` in 6 files | yes (`:247`) |
| ctype | 15 call sites in 8 files, e.g. `lib/AJAXInterface.php:148` | yes (`:265`) |
| pcre | pervasive | yes (`:284`) |
| gd | `lib/artichow/Image.class.php:213,379`, `BarPlotDashboard.class.php:416-434` | yes, optional (`:303`) |
| ldap | `lib/LDAP.php:40…` | yes, optional (`:325`) |
| soap | `lib/ParseUtility.php:60,135` (`new SoapClient`) | yes, optional (`:346`) |
| zip | `lib/DocumentToText.php:401` (`new ZipArchive`) | yes, optional (`:371`) |
| **mbstring** | `lib/StringUtility.php:502,507,514`, `lib/Candidates.php:2069`, `modules/import/ImportUI.php:780,784` | **no** |
| **iconv** | `modules/import/ImportUI.php:871`, `lib/DocumentToText.php:212` | **no** |
| **dom / simplexml / xml** | `lib/DocumentToText.php:416` (`DOMDocument`), `lib/CATSUtility.php:110`, `lib/ZipLookup.php:26` | **no** |
| **zlib** | `lib/FileCompressor.php:668` (`gzopen`), `lib/fpdf/fpdf.php:239,1140` | **no** |
| **json** | `lib/DataGrid.php` (22 sites), `ajax/getDataGridPager.php` | **no** (always present in PHP ≥ 8.0) |
| mcrypt (removed) | `lib/Encryption.php` (dead) | no |
| ext/mysql (removed in PHP 7.0) | `modules/install/Schema.php:725,854,1236` (`mysql_real_escape_string`, `mysql_fetch_row`) inside `'PHP:'` migration strings, executed by `eval($PHPCode)` at `lib/ModuleUtility.php:538-542` during upgrades from old schema versions | no. Upgrading from those versions would fatal |

The installer also checks that `magic_quotes_runtime` is off by calling `get_magic_quotes_runtime()` (`lib/InstallationTests.php:185`). On PHP 8, that call makes the installer's own environment test fatal.

### 5.3 System binaries and servers (`config.php`)
| Binary / service | Config | Default value | Usage |
|---|---|---|---|
| antiword (DOC→text) | `config.php:62-63` | `"\\path\\to\\antiword"` (Windows-style placeholder) | `lib/DocumentToText.php` via `@exec($command…)` (`:378`, arguments passed through `escapeshellarg` at `:101`) |
| pdftotext | `config.php:69` | `"\\path\\to\\pdftotext"` | same |
| html2text | `config.php:75` | `"\\path\\to\\html2text"` | same |
| unrtf | `config.php:81` | `"\\path\\to\unrtf"` (note the missing escape) | same |
| sendmail / SMTP | `config.php:208-226` | `MAIL_MAILER 3`, sendmail `/usr/sbin/sendmail` | PHPMailer |
| Sphinx searchd | `config.php:97-101` | disabled, port 3312 | `lib/Search.php:37` |
| MySQL / MariaDB | `lib/InstallationTests.php:780` requires `>= 4.1.0`; schema is MyISAM with `CHARSET=utf8` (utf8mb3) on 16 tables and `SET SQL_MODE=''` at `db/cats_schema.sql:10`; `SQL_CHARACTER_SET 'utf8'` (`config.php:136`) | — | Docker uses `mariadb` (unpinned) and `mariadb:10.7` |

Resume text extraction is therefore **silently disabled** on a default install (the paths are not executable), and neither the PHP base image nor any documentation in the repo installs these binaries. Whether `opencats/php-base:7.2-fpm-alpine` contains them is UNKNOWN because no Dockerfile is in the repo.

---

## 6. External network services called by the application

| Service | Evidence | Transport | Default state |
|---|---|---|---|
| CATS new-version check → `www.catsone.com:80/catsnewversion.php` | `lib/NewVersionCheck.php:106-122`: sends `CatsUID`, `PHPVersion`, `ServerSoftware`, `SiteName`, `activeUsers`, `licenseKey`; raw `fsockopen` at `:200` | plaintext HTTP | disabled on fresh installs: `db/cats_schema.sql:1044` seeds `disable_version_check = 1` |
| Resume-parsing SOAP → `http://soap.resfly.com/parse.php`, `status.php` | `wsdl/parse.wsdl:78`, `wsdl/status.wsdl:69`; `lib/ParseUtility.php:60,135`; callers `modules/candidates/CandidatesUI.php:1007`, `modules/careers/CareersUI.php:526` | plaintext HTTP; would send resume content | `PARSING_ENABLED false` (`config.php:51`) |
| Licence key check SOAP → `http://catsone.com/keyCheck.php` | `wsdl/keyCheck.wsdl:66` | plaintext HTTP | UNKNOWN whether it is still invoked |
| Google Geocoding → `http://maps.googleapis.com/maps/api/geocode/xml?sensor=false&address=` | `lib/ZipLookup.php:23-26` (`simplexml_load_file`) | plaintext HTTP, **no API key** | used by `ajax/zipLookup.php`. External knowledge: Google has required API keys since 2018, so the lookup is very likely broken |
| CKEditor version-check / CDN domain `cke4.ckeditor.com` | CKEditor 4.22+ `config.versionCheck` (`CHANGES.md` 4.22.0 entry; 4.25.0 advisory GHSA-6v96-m24v-f58j) | HTTPS, from users' browsers | enabled (OpenCATS does not set `versionCheck: false`, `js/ckeditor-manager.js:4`) — behaviour of the LTS build is an INFERENCE |
| `wsend.net` (tests only) | `test/features/bootstrap/FeatureContext.php:168,176` | HTTPS | used on Behat failures (see TESTING_AUDIT TEST-008) |

`config.php:31` also hard-codes a shared `LICENSE_KEY` (`'3163GQ-…'`) that every install ships with.

---

## 7. Container images and CI actions

| Image | Where | Issue |
|---|---|---|
| `opencats/php-base:7.2-fpm-alpine` | `docker/docker-compose.yml:14`, `docker-compose-test.yml:14` | PHP 7.2 went EOL on 2020-11-30 (external knowledge). No Dockerfile in the repo, so provenance and extension set are UNKNOWN. `test/runAllTests.sh:27` assumes it contains `dockerize` |
| `prooph/nginx:www` | `docker-compose.yml:5`, `docker-compose-test.yml:5` | third-party tag, not a digest; nginx config is not in the repo (so it is unknown whether `lib/`, `vendor/`, `modules/*/*.php` or `test/` are blocked). Publishes ports 80 and 443 |
| `busybox` | `docker-compose.yml:20`, `docker-compose-test.yml:20` | unpinned `latest` |
| `mariadb` (unpinned) | `docker-compose.yml:27` | floating major version; publishes `3306:3306` with `MYSQL_ROOT_PASSWORD=root` (`:29-31`); seeds **`test/data`** via `docker-entrypoint-initdb.d` (`:36`), which creates `admin/admin` (`test/data/test.sql:1618`, MD5 `21232f29…` = `md5('admin')`, access level 500) and 8 `tester*` users incl. `testerRoot`, all with password `tester` (`test/data/securityTests.sql`) |
| `mariadb:10.7` | `docker-compose-test.yml:27,42` | short-term release, EOL February 2023 (external knowledge) |
| `phpmyadmin/phpmyadmin` (unpinned) | `docker-compose.yml:41-49` | published on `8080:80` with auto-login `PMA_USER=dev`/`PMA_PASSWORD=dev` |
| `mlespiau/standalone-chrome:2.53.1-cd2.23` | `docker-compose-test.yml:53` | Selenium 2.53.1 / chromedriver 2.23, from 2016 (external knowledge); personal-namespace image |
| Compose `version: '2'` with `volumes_from` | both compose files, line 1 | legacy format (Compose v2 ignores `version:`) |

| GitHub Action | Where | Pin |
|---|---|---|
| `actions/checkout@v4` | `ci.yml:25,115` | tag |
| `shivammathur/setup-php@v2` | `ci.yml:28` | tag |
| `actions/cache@v4` | `ci.yml:34` | tag |
| `mikepenz/action-junit-report@v4` | `ci.yml:85` | tag (third-party, `checks: write`) |
| `actions/upload-artifact@v4` | `ci.yml:96` | tag |
| `octokit/request-action@v2.x`, `dwieeb/needs-reply@v2` | `.github/workflow/needs-reply-remove.yml:16`, `.github/workflow/needs-reply.yml:12` | **inactive**: directory `workflow/` (singular) is never read by GitHub (external knowledge) |

`.github/dependabot.yml` has a single `package-ecosystem: composer` entry (`:3`), a daily schedule, and ignores `phpunit/phpunit` 9.5.1–9.5.3 (`:9-13`) and `ckeditor/ckeditor` 4.15.1 (`:14-16`). It has **no** `github-actions`, `docker` or `npm` ecosystems.

---

## 8. Findings

### DEP-001 — Runtime is pinned to EOL PHP 7.2; code does not parse on PHP ≥ 8.0; no PHP constraint declared anywhere
- **Severity:** CRITICAL
- **Finding:** The only runtime the project builds, tests and ships on is PHP 7.2, which went EOL on 2020-11-30 (external knowledge). On any supported PHP version (8.1+), the front controller fails with a parse error before handling a request. The installer's version gate still accepts PHP 5.0+ with no upper bound, and `composer.json` declares no `php` constraint, so nothing warns an operator.
- **Evidence:** `docker/docker-compose.yml:14` `image: opencats/php-base:7.2-fpm-alpine`; `.github/workflows/ci.yml:21` `php-version: ['7.2']`; `lib/CATSUtility.php:108` `if ($data{0} === '<')` → `PHP Parse error: syntax error, unexpected token "{"` (lint on 8.4), included at `index.php:61`; `lib/InstallationTests.php:164` `version_compare(PHP_VERSION, '5.0.0', '>=')`; removed functions listed in §5.1. The measured Behat boot on 8.4 dies on the same parse error (TESTING_AUDIT §2.4).
- **Impact:** Operators must run an interpreter that no longer gets security fixes, or the application does not start. Any modernization is blocked until the platform floor moves.
- **Recommendation:** (1) Add `"require": {"php": ">=7.2 <8.0"}` now so the constraint is explicit, then raise it as the port lands. Add `"config": {"platform": {"php": "7.2.34"}}` so Dependabot and `composer update` resolve against the real runtime. (2) Fix the parse errors (`lib/CATSUtility.php:108`, `lib/artichow/AntiSpam.class.php:63`, `lib/fpdf/fpdf.php:434`, `src/OpenCATS/Entity/JobOrderRepositoryException.php:2`). Guard or remove `get_magic_quotes_*` calls (8 sites). Replace `strftime` with `date()`/`IntlDateFormatter` (5 sites). Call `mysqli_report(MYSQLI_REPORT_OFF)` in `lib/DatabaseConnection.php` until error handling is refactored. (3) Change `lib/InstallationTests.php:164` to enforce the supported range and delete the orphan `modules/install/phpVersion.php`. (4) Build a maintained PHP 8.x base image from a Dockerfile committed to the repo.

### DEP-002 — CKEditor is locked to the commercial 4.25.1-lts build with no licence key; open-source 4.x is EOL and vendor-declared insecure
- **Severity:** HIGH
- **Finding:** The lock pins `ckeditor/ckeditor` to 4.25.1, whose bundled licence says 4.23.0+ is available only under CKSource's commercial "Extended Support Model". OpenCATS configures no `licenseKey`, and the build contains an explicit "license key is missing or invalid" check. The Composer metadata and README still claim GPL/LGPL/MPL. The alternative, the last open-source release 4.22.1, is EOL (June 2023), and the vendor's changelog says versions below 4.25.0-lts "can no longer be considered as secure". The package is served from the public `vendor/` path together with `samples/`.
- **Evidence:** §1.1 quotes; lock change in commit `e1c2c9b` (4.20.2 → 4.25.1); constraint `composer.json:19` `"ckeditor/ckeditor": "^4.16.0"` allowed the jump; `js/ckeditor-manager.js:4` sets no key; usage `modules/joborders/Add.tpl:2,311`, `Edit.tpl:2,337`, `modules/candidates/SendEmail.tpl:2,137`, `js/emailHandler.js:158-199`.
- **Impact:** Licensing: redistributing or running the LTS build without a contract is a licence breach (ASSUMPTION, needs legal review). Functional: the job-order description and candidate e-mail editors may refuse to initialise or be destroyed at runtime (INFERENCE from the embedded strings; not browser-verified). Security: downgrading to 4.22.1 knowingly reintroduces the XSS issues fixed in 4.24.0-lts/4.25.0-lts (GHSA-fq6h-4g8v-qqvm, GHSA-wh5w-82f3-wrxh, GHSA-mw2c-vx6j-mg76, GHSA-7r32-vfj5-c2jv).
- **Recommendation:** **Replace** CKEditor 4. It is used in only 3 templates and 2 JS files. Use a permissively-licensed maintained editor (e.g. TipTap or Quill, both MIT). If the project accepts GPL-2.0+ for the combined work, CKEditor 5 is an option, but check DEP-011 first because the CPL 1.1a parts are likely GPL-incompatible. Sanitize the stored HTML server-side, since job descriptions are published on the public careers page. As an interim measure, pin `"ckeditor/ckeditor": "4.22.1"` only if the licence issue outweighs the known XSS, disable `versionCheck`, and stop serving `vendor/ckeditor/ckeditor/samples/`.

### DEP-003 — jQuery 1.3.2 (2009) on every back-office page
- **Severity:** HIGH
- **Finding:** A 2009 jQuery build is injected by the shared page header. Many publicly documented XSS and prototype-pollution CVEs affect this version (external knowledge, §4). The project's own direct use of jQuery is tiny: 3 files.
- **Evidence:** `js/jquery-1.3.2.min.js:2` "jQuery JavaScript Library v1.3.2"; `lib/TemplateUtility.php:1194` `echo '<script type="text/javascript" src="js/jquery-1.3.2.min.js'…`; usage `modules/settings/tags.tpl:41-79`, `modules/settings/EmailTemplates.tpl:21-22`, `js/emailHandler.js:183,198`. No `package.json` exists and `.github/dependabot.yml:3` covers only Composer.
- **Impact:** A library-level XSS vector sits on every authenticated page of an application holding candidate PII, and scanners (retire.js, ZAP) will flag it in any customer security review.
- **Recommendation:** Remove jQuery. Rewrite the 3 call sites with `fetch()` and `FormData`, and switch `tags.tpl:50,79` to `textContent`/DOM construction instead of HTML strings. If that is deferred, upgrade to jQuery 3.7.x with jQuery Migrate during a transition, and track it in `package.json` with Dependabot `npm`.

### DEP-004 — GitHub release artifact omits `vendor/` although the app hard-requires it
- **Severity:** HIGH
- **Finding:** The release job checks out the repo and zips it without running `composer install --no-dev`, so the archive contains neither PHPMailer, nor CKEditor, nor the Composer autoloader. Several core files `require`/`include` `./vendor/autoload.php`, including one loaded by the login module. The legacy Travis packager did bundle `vendor/`, which, with the current lock, would ship the commercial CKEditor LTS.
- **Evidence:** `.github/workflows/ci.yml:113-128` (only `actions/checkout@v4`, then `zip -r opencats-${{ github.ref_name }}.zip . -x "*.git*" "docker/*" "test/*" …`); `.gitignore` excludes `/vendor/`; `lib/Mailer.php:43` `require './vendor/autoload.php';`; `lib/Mailer.php` is included by `modules/login/LoginUI.php`; `lib/TemplateUtility.php:38`, `lib/Companies.php:2`, `lib/JobOrders.php:2` `include_once('./vendor/autoload.php')`; `ci/package-code.sh:3` `composer install --no-dev` (Travis only).
- **Impact:** A tagged GitHub release produces an archive that fatals at login (INFERENCE: `require` of a missing file is a fatal error). Whether any release has been cut since this workflow landed on 2026-01-09 is UNKNOWN.
- **Recommendation:** In the release job, run `setup-php` (runtime version) and `composer install --no-dev --classmap-authoritative`, verify `vendor/autoload.php` exists, and generate an SBOM (`composer CycloneDX` plugin) attached to the release. Resolve DEP-002 before bundling CKEditor.

### DEP-005 — Dev/test toolchain is unresolvable on PHP 8, abandoned, and carries 22 advisories
- **Severity:** HIGH
- **Finding:** 27 of 64 dev packages have PHP constraints that exclude PHP 8, so `composer install` fails on 8.x. Six are abandoned on Packagist, including the `dev-master`-pinned `behat/mink-extension` and the unused `codacy/coverage`. Behat is locked to the 2015 3.0.x line by `~3.0.4`. `composer audit` finds 22 advisories, including critical CVE-2019-10910 (symfony/dependency-injection 2.8.49) and high CVE-2026-24765 (phpunit 7.5.7). Everything is dev-only, but CI and the Docker dev stack install dev dependencies into the web-served tree, because `vendor/` must be public for CKEditor.
- **Evidence:** §2 table; `notes/composer-install-plain.txt` ("Your lock file does not contain a compatible set of packages", 28 problems); `composer.json:4-10`; §2.1; `modules/joborders/Add.tpl:2` references `vendor/ckeditor/...`.
- **Impact:** This blocks the PHP 8 migration of the test suite (see TESTING_AUDIT TEST-002). Vulnerable dev code could be reachable over HTTP on any host where the repo is served with dev dependencies installed (the Docker dev stack mounts the whole repo, `docker-compose.yml:22`).
- **Recommendation:** Replace the stack with `phpunit/phpunit ^8.5.52` (bridge for PHP 7.2 and 8.x), then `^10`/`^11`. Use a maintained `behat/behat ^3.x`, `friends-of-behat/mink-extension`, `behat/mink-browserkit-driver` with `symfony/http-client` (drop Goutte), and `behat/mink-selenium2-driver ^1.7`, or move to Playwright. Remove `codacy/coverage`. Never install dev dependencies in a web-served directory: move the web root to a `public/` folder and copy CKEditor's replacement assets there instead of serving `vendor/`.

### DEP-006 — Bundled PHP libraries are unmaintained and partly PHP-8-fatal
- **Severity:** HIGH
- **Finding:** Charting (Artichow, "PHP 4+5 version") and PDF generation (FPDF 1.53) contain PHP 8 parse errors, so graphs and PDF reports break on PHP 8 even after the core is fixed. The Sphinx client dates from 2007 (protocol 0x107, port 3312), and the repo's own "latest Sphinx" instructions point to a file that is not shipped. SimpleTest 1.1.0 (1.9 MB, including 48 runnable test scripts under `lib/simpletest/test/`) is loaded into production via the `tests` module. `lib/Encryption.php` wraps the removed mcrypt extension and is unused.
- **Evidence:** §3 table; lint `lib/artichow/AntiSpam.class.php:63`, `lib/fpdf/fpdf.php:434`; `lib/GraphGenerator.php:43`; `modules/reports/ReportsUI.php:414`; `lib/sphinx/sphinxapi.php:4,26`; `optional-updates/latest-sphinx-search/config.php:90`; `modules/tests/TestsUI.php:43-46`; `lib/Encryption.php:52`. Only `Options -Indexes` protects the tree (`.htaccess`), so for Apache deployments `lib/simpletest/test/*.php` is directly requestable (nginx config UNKNOWN).
- **Impact:** These are hidden PHP-8 blockers outside Composer's view. Unmaintained parsers (FPDF image and font handling, Artichow GD code) will never receive security fixes. Test scripts in the web root expand the attack surface.
- **Recommendation:**

  | Component | Decision | Replacement | Touch points |
  |---|---|---|---|
  | Artichow | **Replace** | render charts client-side (e.g. Chart.js, MIT) from JSON, or `jpgraph` if server-side PNG is needed | `lib/GraphGenerator.php`, `lib/Graphs.php`, `modules/graphs/GraphsUI.php`, dashboard templates |
  | FPDF 1.53 | **Upgrade/replace** | `setasign/fpdf ^1.8` via Composer (drop-in API) or `tecnickcom/tcpdf` | `modules/reports/ReportsUI.php:414-500` |
  | sphinxapi.php (2007) | **Replace or remove** | if full-text search is needed, use MySQL/MariaDB FULLTEXT on InnoDB or Manticore via SQL (`mysqli`), and drop `lib/sphinx/` | `lib/Search.php:37`, `lib/Attachments.php:160`, `lib/DatabaseSearch.php:55`, `config.php:97-101` |
  | SimpleTest | **Remove** | PHPUnit/Behat already exist | `modules/tests/`, `lib/simpletest/` |
  | `lib/Encryption.php` | **Remove** | `sodium_*` if ever needed | none (dead) |

### DEP-007 — Vendored JavaScript has no version/licence tracking; some licences are unclear or share-alike
- **Severity:** MEDIUM
- **Finding:** Five third-party JS components ship as hand-copied files. `sorttable.js` and `calendarDateInput.js` state no licence. `sweetTitles.js` is CC BY-SA 2.5. `js/lib.js` embeds LGPL 2.1 code in a CPL-headed file. Three of these files are loaded on the **public** careers portal.
- **Evidence:** §4 table; `modules/careers/Blank.tpl:9-16`; `js/lib.js:7-11`; `js/sweetTitles.js:2-3`.
- **Impact:** Licence ambiguity in redistributed releases. Old DOM code (`document.writeln` in `calendarDateInput.js`) blocks CSP adoption and modern browser compatibility.
- **Recommendation:** Create an inventory (SBOM, e.g. CycloneDX, generated in CI). Replace `calendarDateInput.js` with native `<input type="date">`, `sorttable.js` with a small MIT sorter or server-side sorting, `sweetTitles.js` with native `title` or a CSS tooltip, and `subModal.js` with native `<dialog>`. Extract the EventCache code from `js/lib.js` or drop it (modern browsers do not need it).

### DEP-008 — Container images are EOL, unpinned or of unknown provenance; the dev stack exposes default credentials
- **Severity:** MEDIUM
- **Finding:** See §7. The PHP image is 7.2 with no Dockerfile in the repo, MariaDB is either floating or EOL 10.7, Selenium dates from 2016, and every image is tag-pinned rather than digest-pinned. `docker/docker-compose.yml`, the file a newcomer will use, publishes MariaDB with `root/root`, publishes phpMyAdmin with auto-login, and seeds the test fixtures, which contain `admin/admin` and eight `tester*` accounts, including ROOT level, all with password `tester`.
- **Evidence:** `docker/docker-compose.yml:14,27-37,41-49`; `docker/docker-compose-test.yml:27,42,53`; `test/data/test.sql:1618`; `test/data/securityTests.sql` (users 2001–2008, hash `f5d1278e8109edd94e1e4197e04873b9` = `md5('tester')`).
- **Impact:** If this compose file is used beyond localhost (common for small agencies), it provides known administrator credentials and an internet-exposed DB admin UI. Test runs are not reproducible because base images float.
- **Recommendation:** Commit a Dockerfile (PHP 8.x-fpm, explicit extensions from §5.2, antiword/poppler-utils/unrtf if extraction is kept). Pin images by digest and add Dependabot `docker` updates. In `docker-compose.yml`, bind DB and phpMyAdmin to `127.0.0.1` or remove phpMyAdmin, load only `db/cats_schema.sql` (not `test/data`), and take passwords from `.env`. Pin MariaDB to a current LTS release (e.g. 10.11 or 11.4, external knowledge) in both files.

### DEP-009 — System-binary and PHP-extension requirements are undeclared and only partially checked; removed APIs remain
- **Severity:** MEDIUM
- **Finding:** Document extraction depends on four external binaries configured with placeholder Windows paths. The installer checks 8 extensions but not mbstring, iconv, dom/simplexml/xml or zlib, all of which the code uses. The installer's own magic-quotes check calls a function removed in PHP 8. Upgrade migrations call `mysql_*` functions that were removed in PHP 7.0.
- **Evidence:** §5.2 and §5.3 tables; `config.php:62,69,75,81`; `lib/InstallationTests.php:47-66` (`runCoreTests` list), `:185`; `modules/install/Schema.php:725,854,1236` evaluated through `lib/ModuleUtility.php:538-542`.
- **Impact:** A deployment can pass the installer and still fail at runtime (missing mbstring breaks `StringUtility::makeInitialName`, missing dom/zip breaks .docx extraction). Resume search silently indexes nothing. Upgrading very old databases fatals.
- **Recommendation:** Declare `ext-mysqli`, `ext-mbstring`, `ext-iconv`, `ext-dom`, `ext-simplexml`, `ext-zlib`, `ext-ctype`, `ext-session` in `composer.json` `require`, and `ext-gd`, `ext-zip`, `ext-ldap`, `ext-soap` under `suggest`. Make `InstallationTests` read the same list. Default the binary paths to empty strings and report "disabled" explicitly. Replace the `mysql_*` calls in the `Schema.php` migration strings with `$db->escapeString()` and `mysqli_fetch_row()`.

### DEP-010 — Hard-coded third-party services over plaintext HTTP
- **Severity:** MEDIUM
- **Finding:** The code calls CATS-era vendor endpoints (`catsone.com`, `soap.resfly.com`) and Google Geocoding over `http://`. The resume-parsing SOAP call would transmit candidate resumes in clear text. The Google call has no API key. The version check would send site name, user count and licence key. The two riskiest calls are off by default (`PARSING_ENABLED false`; `disable_version_check = 1`), but ZIP lookup is reachable through `ajax/zipLookup.php`.
- **Evidence:** §6 table (`lib/NewVersionCheck.php:106-122,200`, `wsdl/parse.wsdl:78`, `wsdl/status.wsdl:69`, `wsdl/keyCheck.wsdl:66`, `lib/ZipLookup.php:23-26`, `config.php:31,51`, `db/cats_schema.sql:1044`).
- **Impact:** Potential PII disclosure if parsing is enabled. Broken features (ZIP lookup) and dead code keep the attack surface and the maintenance cost.
- **Recommendation:** Remove `lib/NewVersionCheck.php`, `lib/ParseUtility.php`, `wsdl/*` and the SOAP extension requirement, unless a current vendor contract exists. Re-implement ZIP lookup against a keyed HTTPS geocoder configured via `config.php`, with a timeout, or drop it. Remove the shared `LICENSE_KEY` default.

### DEP-011 — Licence-compatibility risks
- **Severity:** MEDIUM
- **Finding:** `LICENSE.md:1-5` states the project is MPL-2.0 for OpenCATS code and **CATS Public License 1.1a** ("a modified Mozilla Public License", i.e. MPL-1.1-derived) for original CATS code. The distribution also bundles:
  - `lib/sphinx/sphinxapi.php` under "GNU General Public License", version unstated. ASSUMPTION: MPL-1.1-style licences are generally regarded as GPL-incompatible, so shipping GPL code inside the same program as CPL-1.1a code needs legal review.
  - `js/sweetTitles.js` under CC BY-SA 2.5, a share-alike licence not designed for software.
  - `js/sorttable.js` and `js/calendarDateInput.js` with no licence statement.
  - CKEditor 4.25.1-lts under commercial terms (DEP-002).

  `composer.json` has no `license` field (`composer validate` warns "No license specified").
- **Evidence:** `LICENSE.md:1-5`; `lib/sphinx/sphinxapi.php:8-13`; `js/sweetTitles.js:2-3`; §1.1; `composer validate` output.
- **Impact:** Redistributors (hosting providers, forks) inherit unclear obligations, and enterprise adopters' licence scanners will flag the release.
- **Recommendation:** Add `"license": ["MPL-2.0", "LicenseRef-CPL-1.1a"]` to `composer.json`. Remove or replace the GPL, CC-BY-SA, unlicensed and commercial components per DEP-002, DEP-006 and DEP-007. Add a `THIRD_PARTY_NOTICES.md` generated from the SBOM.

### DEP-012 — Dependabot covers only Composer and carries stale ignores; Actions are tag-pinned; some workflows are inactive
- **Severity:** LOW
- **Finding:** Dependabot watches only Composer, ignores specific stale versions (phpunit 9.5.1–9.5.3, ckeditor 4.15.1), and has no `github-actions` or `docker` ecosystems. It did not stop the drift into the commercial CKEditor, which arrived via a manual lock regeneration. All Actions are tag-pinned, not SHA-pinned. Two workflows live in the non-functional `.github/workflow/` directory.
- **Evidence:** `.github/dependabot.yml:1-16`; §7 Actions table.
- **Impact:** Vulnerable JS, Actions and images go unnoticed, and a compromised Action tag would run with `checks: write`/`pull-requests: write` (`ci.yml:15-17`).
- **Recommendation:** Add `github-actions`, `docker` (directory `/docker`) and, once `package.json` exists, `npm` ecosystems. Remove the stale ignores and add an ignore for `ckeditor/ckeditor >= 4.23`. Pin third-party Actions (`mikepenz/action-junit-report`, `shivammathur/setup-php`) by commit SHA. Move `.github/workflow/*.yml` to `.github/workflows/` or delete them.

### DEP-013 — PHPMailer v6.8.0 lags current releases
- **Severity:** LOW
- **Finding:** The locked PHPMailer is from March 2023. Packagist lists v6.12.0 and v7.1.1. `composer audit` reports no advisories for v6.8.0 at the audit date.
- **Evidence:** `composer.lock` (`phpmailer/phpmailer v6.8.0`, 2023-03-06); `notes/packagist-status.txt`; usage `lib/Mailer.php:39-43,76,307+`.
- **Impact:** Low today, but it lacks upstream hardening and PHP 8.x fixes released since 2023.
- **Recommendation:** **Keep and upgrade.** Move to `^6.10` now; it supports PHP 5.5–8.x (external knowledge), so it is safe on 7.2. Evaluate 7.x after the PHP 8 move. Cover `lib/Mailer.php` with a test that uses PHPMailer's `preSend()` and no transport.

### DEP-014 — `composer.json` constraints are loose where they should be tight and tight where they should move
- **Severity:** LOW
- **Finding:** `^4.16.0` for CKEditor permitted the licence change. `~3.0.4` for Behat freezes a 2015 release line. `dev-master` for mink-extension is non-reproducible across lock refreshes. `codacy/coverage` is required but unused. There is no `php` or `ext-*` requirement and no `config.platform`.
- **Evidence:** `composer.json:3-20`; `grep -rn codacy` shows only `composer.json:10` and the `README.md:2` badge.
- **Impact:** Lock refreshes can silently change licence or behaviour, and CI does not describe the runtime.
- **Recommendation:** Apply the constraint changes in the plan below and run `composer validate --strict` in CI.

---

## 9. Upgrade / replacement plan (per dependency)

| Dependency | Current | Decision | Target | Where used (touch points) | Order |
|---|---|---|---|---|---|
| PHP runtime | 7.2 | **Upgrade** | 8.2/8.3 (first 7.4 as a stepping stone if needed) | whole codebase; blockers in §5.1 and TESTING_AUDIT §2.5 | 1 |
| MariaDB/MySQL | `mariadb` latest / 10.7; min 4.1.0 check | **Pin + upgrade** | MariaDB LTS (10.11 or 11.4); update `_checkMySQLVersion` minimum | `docker/*.yml`, `lib/InstallationTests.php:780` | 1 |
| `opencats/php-base:7.2-fpm-alpine` | 7.2 | **Replace** | in-repo Dockerfile on `php:8.x-fpm` | `docker/*.yml:14` | 1 |
| phpunit/phpunit | 7.5.7 | **Upgrade** | ^8.5.52 → ^10/^11 | `src/OpenCATS/Tests/**` | 2 |
| behat stack (behat 3.0.15, mink 1.7.1, mink-extension dev-master, goutte driver, selenium2 driver 1.3.1) | 2015–2018 | **Upgrade/replace** | behat ^3.x current, friends-of-behat/mink-extension, mink-browserkit-driver + symfony/http-client, or Playwright | `test/behat.yml`, `test/features/bootstrap/*.php` | 2 |
| codacy/coverage | 1.4.2 (abandoned) | **Remove** | — | none | 2 |
| guzzle 6 / psr7 1 / symfony 2.8–4.4 (transitive) | vulnerable | **Upgrade via parents** | resolved by the Behat/PHPUnit upgrade | — | 2 |
| ckeditor/ckeditor | 4.25.1-lts (commercial) | **Replace** | MIT editor (TipTap/Quill) or CKEditor 5 subject to licence review | `modules/joborders/Add.tpl`, `Edit.tpl`, `modules/candidates/SendEmail.tpl`, `js/ckeditor-manager.js`, `js/emailHandler.js` | 2 |
| jQuery | 1.3.2 | **Remove** (or upgrade to 3.7.x as an interim) | vanilla JS | `lib/TemplateUtility.php:1194`, `modules/settings/tags.tpl`, `modules/settings/EmailTemplates.tpl`, `js/emailHandler.js` | 2 |
| phpmailer/phpmailer | 6.8.0 | **Keep + upgrade** | ^6.10, later 7.x | `lib/Mailer.php` | 3 |
| Artichow | PHP4/5-era | **Replace** | client-side charts (Chart.js) | `lib/GraphGenerator.php`, `modules/graphs/GraphsUI.php`, `lib/Graphs.php` | 3 |
| FPDF | 1.53 | **Upgrade** | `setasign/fpdf ^1.8` via Composer | `modules/reports/ReportsUI.php:414` | 3 |
| Sphinx client + `lib/sphinx/*` | 2007 | **Remove/replace** | DB FULLTEXT or Manticore over SQL | `lib/Search.php:37`, `lib/Attachments.php:160`, `config.php:97-101`, `optional-updates/` | 3 |
| SimpleTest + `modules/tests` | 1.1.0 | **Remove** | — (move `waitForDb.php` to `test/scripts/`) | `modules/tests/`, `lib/simpletest/`, `test/runAllTests.sh:28` | 2 |
| `lib/Encryption.php` (mcrypt) | dead | **Remove** | — | none | 2 |
| subModal / sweetTitles / sorttable / calendarDateInput / EventCache | 2005–2007 | **Replace** | `<dialog>`, native `title`/CSS, small MIT sorter, `<input type="date">` | `lib/TemplateUtility.php:1192-1193,548-554`, ~40 templates, `js/lib.js` | 4 |
| antiword / pdftotext / html2text / unrtf | placeholders | **Keep (optional), declare** | install `antiword`, `poppler-utils`, `unrtf`, `html2text` in the image, or replace .doc extraction with a PHP library | `config.php:62-82`, `lib/DocumentToText.php` | 3 |
| SOAP parsing, licence check, version check, Google geocode | defunct/plaintext | **Remove** (or reimplement over HTTPS with keys) | — | `lib/ParseUtility.php`, `lib/NewVersionCheck.php`, `wsdl/*`, `lib/ZipLookup.php` | 3 |
| Selenium image | 2.53.1 (2016) | **Replace** | `selenium/standalone-chrome` current, or Playwright | `docker/docker-compose-test.yml:53`, `test/behat.yml:19-21` | 2 |
| phpMyAdmin in dev compose | unpinned, auto-login | **Remove or bind to localhost** | — | `docker/docker-compose.yml:39-49` | 1 |
| GitHub Actions | tag-pinned | **Pin by SHA + Dependabot** | — | `.github/workflows/ci.yml` | 1 |

---

## Facts vs Assumptions

**FACT (verified by file inspection or command output):**
- Every locked version, constraint, release date and licence string in §1–§2 (from `composer.lock`).
- `composer install` fails on PHP 8.4 (27 blocking packages). `composer audit` reports 22 advisories in 8 dev packages. Six packages are abandoned per Packagist.
- The CKEditor package is 4.25.1-lts with a commercial `LICENSE.md`, contradictory README and lock metadata, an embedded licence-key check, and vendor changelog statements about EOL and insecurity. The lock bump happened in commit `e1c2c9b`.
- Vendored component versions and licence headers (§3, §4) and their usage sites.
- PHP 8.4 parse errors in `lib/CATSUtility.php`, `lib/artichow/AntiSpam.class.php`, `lib/fpdf/fpdf.php`, `lib/fpdf/font/makefont/makefont.php` and `src/OpenCATS/Entity/JobOrderRepositoryException.php`.
- The release job does not run Composer, and `lib/Mailer.php:43` `require`s the autoloader.
- Docker image tags, published ports, credentials and seeding; Dependabot configuration; Action versions.
- External service URLs and their default enablement (`config.php:51`, `db/cats_schema.sql:1044`).

**ASSUMPTION / INFERENCE / EXTERNAL KNOWLEDGE (labelled inline):**
- EOL dates: PHP 7.2 (2020-11-30), MariaDB 10.7 (Feb 2023). The CKEditor 4 EOL of June 2023 is stated by the vendor inside the package. Selenium 2.53.1 dates from 2016.
- jQuery 1.3.2 CVE list and fix versions.
- The CKEditor LTS build fails or self-destroys without a licence key (not browser-tested). Running or redistributing it without a contract breaches its licence (legal review needed).
- MPL-1.1-style licences such as CPL 1.1a are GPL-incompatible (legal review needed).
- A GitHub release zip without `vendor/` fatals at login (not executed).
- Google Geocoding without a key fails. The resfly.com and catsone.com endpoints are defunct.
- PHP 8.1 mysqli exception default. mcrypt was removed from PHP core in 7.2. PHPMailer 6.10 supports PHP 5.5–8.x.

## Unknowns / Needs Further Investigation
1. **Contents of `opencats/php-base:7.2-fpm-alpine` and `prooph/nginx:www`**: installed extensions, `dockerize`, antiword/pdftotext, and nginx rules for `lib/`, `vendor/`, `test/`, `modules/*/*.php`. The Docker daemon was unavailable, and no Dockerfile or nginx config is in the repo.
2. **Actual browser behaviour of CKEditor 4.25.1-lts without `licenseKey`** (warning only, read-only, or destroyed). Needs a manual browser test of `index.php?m=joborders&a=add`.
3. **Whether any GitHub release has been produced by the new release job** and what its archive contains (needs the GitHub Releases API).
4. **Protocol compatibility of `lib/sphinx/sphinxapi.php` (0x107)** with any currently packaged Sphinx or Manticore `searchd`.
5. **Reachability of the external endpoints** (catsone.com, soap.resfly.com, wsend.net) today. Network probing was out of scope.
6. **Legal assessment** of the CPL 1.1a / MPL-2.0 / GPL / CC-BY-SA / CKEditor-LTS combination.
7. **Vulnerabilities in the vendored PHP libraries** (Artichow, FPDF 1.53, SimpleTest 1.1.0): no advisory database covers them. A manual review or replacement is needed.

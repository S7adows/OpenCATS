# OpenCATS Licence and Distribution Inventory (for Legal Review)

> **THIS IS NOT LEGAL ADVICE.** This is an engineering inventory prepared so that qualified counsel can review it. It records what the code, file headers, licence texts and git history show. Where it discusses consequences, it frames them as **questions and considerations for counsel**, not conclusions. No statement here should be relied on as an interpretation of any licence. Before any decision about distribution, hosting or commercial offerings, a lawyer must review the licence texts and the facts below.

- **Scope:** our fork `/home/user/OpenCATS` (product code = `master` @ `d607279`, 2026-01-26; the working branch adds only `docs/`, see `git diff --stat d607279 HEAD` = 31 doc files), and upstream `opencats/OpenCATS` master @ `d5cf733` (2026-09-21), which is 176 commits ahead of `d607279`.
- **Tags:** [FACT] = verified in files or git; [INFERENCE] = reasoning from facts; [RECOMMENDATION] = engineering suggestion; [UNKNOWN] = not determinable here.
- **Baseline docs:** `docs/audit/DEPENDENCY_AUDIT.md` (§1.1 CKEditor, §3–§4 vendored code), `docs/product/OPEN_CATS_2_PRODUCT_DIRECTION.md` (decisions D1/D3/D4), `docs/product/DIFFERENTIATORS.md:20`.

---

## 0. Summary for counsel

1. [FACT] `LICENSE.md:1-5` says the application has two licences: "OpenCATS code" under **MPL 2.0** and "Original code from the 'CATS Project' circa 2007" under the **CATS Public License 1.1a** (CPL; MPL 1.1 plus Cognizo's Exhibit B). No file in either repo carries an MPL 2.0 per-file notice. The only place "Mozilla Public License" appears is `LICENSE.md`.
2. [FACT] Code that descends from the original CATS code is most of the first-party code. In our fork it is 390 of 454 first-party source files (163,712 of 174,272 LOC, **93.9%**). On the runtime request path it is **97.8%** of first-party LOC (§3.3). In upstream HEAD the figures are 91.4% and 96.4%.
3. [FACT] CPL Exhibit B (`LICENSE.md:850-864`) (I) bars use "in or as a time-sharing, outsourcing, service bureau, application service provider or managed service provider environment" without Cognizo's written permission. It (II) requires a Cognizo copyright notice and (III) a "Powered by CATS" link to catsone.com "on every rendered HTML document".
4. [FACT] The shipped code **does not render the Exhibit B II/III text as written.** `COPYRIGHT_HTML` is `''` (`constants.php:49`, emptied by upstream `2f04c49`, 2024-04-24, "remove copyright"). The main footer says "Powered by OpenCATS", linked to opencats.org (`lib/TemplateUtility.php:829-833`). The original 0.9.1 import rendered "© 2005 - 2007 Cognizo Technologies, Inc." and "Powered by CATS", linked to catsone.com (`26e291d:constants.php:47`, `26e291d:lib/TemplateUtility.php:817`).
5. [FACT] Upstream PR #864 (`be93937`, 2026-09-03) replaced the full CPL Exhibit A header in 181 files with a 5-line notice. The same change removed the third-party attributions for EventCache (CC-GNU LGPL 2.1) and `addEvent()` from `js/lib.js`. Upstream PR #802 (`e422abf`) removed **licence-key/"Professional" feature code**, not licence texts. `LICENSE.md` has not changed since 2016 (`e32c24d`). No relicensing statement from Cognizo exists in either repo [FACT for the repos; UNKNOWN whether one exists elsewhere].
6. [FACT] Third-party components with notable terms: the Sphinx PHP API (GPL, version unstated; loaded only when `ENABLE_SPHINX` is true), SimpleTest (LGPL-2.1), PHPMailer (LGPL-2.1-only), jQuery 1.3.2 (MIT/GPL), sweetTitles (CC BY-SA 2.5), `sorttable.js` and `calendarDateInput.js` (no licence stated), and **CKEditor 4.25.1**. Our fork locks CKEditor 4.25.1, and the Phase 0 audit found commercial "4.25.1-lts" terms in that package. Upstream pinned CKEditor back to 4.22.1 with #856, "pin CKEditor to open-source release".
7. [FACT] Three OpenCATS-era templates carry a **GPL-2** header (`modules/candidates/Duplicates.tpl:7-10`, `LinkDuplicity.tpl`, `Merge.tpl`; added in `a85053e`/#493, 2020). This conflicts with the MPL-2.0 statement in `LICENSE.md:3`.

---

## 1. Method

- [FACT] Header scans over `git ls-files` (excluding `docs/`) in the fork: `Cognizo` 218 files, `CATS Public License` 195, `Mozilla Public License` 1 (`LICENSE.md`), GPL 10, LGPL 4, BSD 3 (all incidental except jQuery and `composer.lock`), `Copyright` 247, `$Id:` 410, Apache 0, explicit MIT text 0.
- [FACT] Per-file classification script (scratch, not committed). It covers text sources (`.php .tpl .js .css .html .sql .xtpl .sh .awk .wsdl .xml .feature`, 630 files in the fork, 476 upstream) and classifies each file in this order:
  1. **3P**: path is in a known vendored third-party location (§4).
  2. **CPL**: the file contains "CATS Public Licen[sc]e".
  3. **COGNIZO_NOCPL**: the first 4 KB mention Cognizo but not the CPL.
  4. **GPL_HDR**: the header states GPL.
  5. **ORIG_NOHDR**: no licence header, but the path exists in upstream's first commit `26e291d` ("initial import from 0.9.1", 2011-02-21). That makes it CATS 0.9.1 code.
  6. **NEW_NOHDR**: no licence header and not present in `26e291d`, so presumed OpenCATS-authored.
- [FACT] History depth: our fork clone is **shallow**. Its earliest commit is `8ad6c59` (2022-07-07), 70 commits in total. The upstream clone is **complete**: 957 commits from `26e291d` (2011-02-21) to `d5cf733`, not shallow. Because `d607279` is an ancestor of upstream HEAD, the fork was classified against upstream's full history.
- [INFERENCE] Limits:
  - Path-based provenance misses renames and copy-pastes into new files.
  - A file first seen after 2011 can still contain CATS code. Six such files carry CPL headers (§3.2).
  - LOC counts are raw newline counts.

---

## 2. Licence terms (quoted, with file:line)

### 2.1 Dual-licence statement
- `LICENSE.md:1-5` [FACT]: "This application is available under two licenses. 1) OpenCATS code is under Mozilla Public License 2.0 … 2) Original code from the 'CATS Project' circa 2007 is under CATS Public License Version 1.1a (a modified Mozilla Public License)".
- [FACT] History of `LICENSE.md` (upstream):
  - `51f99c1` (2016-02-26) created it as **GPL v2** text.
  - `be124dd`, `6457c04` and `e32c24d` (all 2016-11-30) replaced that with the MPL 2.0 + CPL 1.1a text.
  - No changes since.

### 2.2 MPL 2.0 (applies to "OpenCATS code")
| Term | Location | Text (abridged) |
|---|---|---|
| Covered Software = files carrying Exhibit A | `LICENSE.md:23-27` | "Source Code Form to which the initial Contributor has attached the notice in Exhibit A…" |
| Modifications are per file | `LICENSE.md:55-63` | "(a) any file in Source Code Form that results from an addition to, deletion from, or modification of the contents of Covered Software; or (b) any new file … that contains any Covered Software." |
| Larger Work | `LICENSE.md:43-45` | "a work that combines Covered Software with other material, in a separate file or files, that is not Covered Software." |
| Source distribution | `LICENSE.md:166-174` (§3.1) | "All distribution of Covered Software in Source Code Form … must be under the terms of this License." |
| Executable distribution | `LICENSE.md:176-189` (§3.2) | source must be "made available"; may sublicense the Executable Form "under different terms" provided source-form rights are not limited. |
| Larger Work | `LICENSE.md:191-202` (§3.3) | "You may create and distribute a Larger Work under terms of Your choice, provided that You also comply with the requirements of this License for the Covered Software." |
| Notices | `LICENSE.md:204-210` (§3.4) | "You may not remove or alter the substance of any license notices (including copyright notices …)". |
| Support/warranty for a fee | `LICENSE.md:212-223` (§3.5) | "You may choose to offer, and to charge a fee for, warranty, support, indemnity or liability obligations … only on Your own behalf". |
| Notice placement | `LICENSE.md:361-371` (Exhibit A) | the per-file notice, or "in a location (such as a LICENSE file in a relevant directory)". |
| Secondary-licence (GPL) compatibility | `LICENSE.md:30-38`, `73-77`, `375-379` | Exhibit B "Incompatible With Secondary Licenses" is **not** attached to any file [FACT: no file contains it]. |

[FACT] MPL 2.0 has no clause triggered by network or hosted use; its obligations attach to *distribution*. [INFERENCE — for counsel to confirm.]

### 2.3 CATS Public License 1.1a (applies to "Original code … circa 2007")
| Term | Location | Text (abridged) |
|---|---|---|
| Base | `LICENSE.md:385-388` | "consists of the Mozilla Public License Version 1.1, modified to be specific to CATS, with the Additional Terms in Exhibit B." |
| "Commercial Use" | `LICENSE.md:394-395` | "means distribution or otherwise making the Covered Code available to a third party." |
| Modifications | `LICENSE.md:429-436` | "A. Any addition to or deletion from the contents of a file containing Original Code or previous Modifications. B. Any new file that contains any part of the Original Code or previous Modifications." |
| Grant | `LICENSE.md:470-480` (§2.1) | "world-wide, royalty-free, non-exclusive license … (other than patent or trademark) … to use, reproduce, modify, display, perform, sublicense and distribute the Original Code". |
| Source terms | `LICENSE.md:532-543` (§3.1) | "Source Code version … may be distributed only under the terms of this License" and a copy of the licence must accompany it. |
| Source availability | `LICENSE.md:545-555` (§3.2) | Modifications must be available in source to anyone who received an Executable, for 12 months / 6 months after a later version. |
| Change documentation | `LICENSE.md:557-564` (§3.3) | "a file documenting the changes You made … and the date of any change" plus a "prominent statement that the Modification is derived … from Original Code provided by the Initial Developer". |
| Per-file notice | `LICENSE.md:597-615` (§3.5) | "You must duplicate the notice in Exhibit A in each file of the Source Code." Paid support allowed "only on Your own behalf". |
| Executables | `LICENSE.md:617-638` (§3.6) | executables may be licensed differently if source-version rights are not limited. |
| Larger Works | `LICENSE.md:640-644` (§3.7) | combining is allowed; "requirements of this License [must be] fulfilled for the Covered Code." |
| Licence naming | `LICENSE.md:680-690` (§6.3) | derived licences must not use "CATS", "Cognizo", "CPL". |
| Exhibit A notice | `LICENSE.md:820-843` | "The Original Code is 'CATS Standard Edition'. The Initial Developer … is Cognizo Technologies, Inc. … Copyright (C) 2005 - 2007". |
| **Exhibit B I (hosted use)** | `LICENSE.md:850-853` | "You may not use the Licensed Software to operate in or as a time-sharing, outsourcing, service bureau, application service provider or managed service provider environment without express the written permission of Cognizo Technologies, Inc." |
| **Exhibit B II (copyright notice)** | `LICENSE.md:855-858` | "The following copyright notice must be retained and clearly legible at the bottom of every rendered HTML document unless express written permission … : Copyright (C) 2005 - 2007 Cognizo Technologies, Inc. All rights reserved." |
| **Exhibit B III (Powered by CATS)** | `LICENSE.md:860-864` | "The 'Powered by CATS' text or logo must be retained and clearly legible on every rendered HTML document … The logo, or the text 'CATS', must be a hyperlink to the CATS Project website, currently http://www.catsone.com/." |

[FACT] Exhibit B I restricts *use*, not only distribution. That makes it the main constraint for managed hosting and SaaS. [INFERENCE; for counsel.]

---

## 3. Code-level inventory

### 3.1 Totals by category (text source files, `docs/` excluded)

| Category | Fork @ `d607279` files / LOC | Upstream @ `d5cf733` files / LOC |
|---|---|---|
| (1a) Original CATS, **CPL header** | 194 / 92,734 | 181 / 84,900 (short header after #864) |
| (1b) Original CATS, Cognizo notice but no CPL text | 19 / 4,969 | 10 / 1,816 |
| (1c) Original CATS 0.9.1 file, **no header** (132 `.tpl`, `db/cats_schema.sql`, etc.) | 177 / 66,009 | 161 / 63,513 |
| (3) OpenCATS-authored, no header (MPL 2.0 per `LICENSE.md:3`) | 60 / 9,998 | 81 / 13,536 |
| (3') OpenCATS-authored with **GPL-2 header** | 4 / 562 | 4 / 593 |
| (4) Vendored third-party | 176 / 61,445 | 39 / 15,327 |
| **Total** | **630 / 235,717** | **476 / 179,685** |

Derived figures [FACT, arithmetic]:
- **Fork:** original-CATS-derived (1a+1b+1c) is 390 files / 163,712 LOC. That is 69.5% of all source LOC and **93.9% of first-party LOC**.
- **Upstream:** 352 files / 150,229 LOC, **91.4% of first-party LOC**.

[FACT] Binary assets: 299 of 301 files under `images/` already existed in `26e291d`, and 22 have changed since. They include `images/CATS-powered.gif`, `cats_logo.jpg` and `cognizo-logo.jpg`. Upstream `8166a56` (2011-08-31) says "Updated all 0.9.2 artwork to opencats". [UNKNOWN] Who owns the copyright and trademarks in the artwork.

### 3.2 Category (2): OpenCATS modifications of original files
- [FACT] Of the 188 CPL-headed fork files present in `26e291d`, **140 have changed** since the 2011 import and 48 are byte-identical to it. Of the 177 header-less 0.9.1 files, 118 have changed. In upstream HEAD, all 175 CPL files present in `26e291d` have changed, because #864 rewrote their headers.
- [FACT] Churn in fork CATS-origin files since `26e291d`: +7,360 / −6,081 lines, against 160,301 current LOC. That is about 4.6% of lines added (`git diff --numstat -M 26e291d d607279`). Upstream HEAD: +23,169 / −21,423.
- [FACT] Six files first added after 2011 carry the **CPL header** anyway:
  - `ajax/getCandidateIdByPhone.php` (`d59ec4a`, 2015, header copied from another file)
  - `lib/ImportUtility.php`
  - `optional-updates/latest-sphinx-search/{Search.php,config.php}`
  - `src/OpenCATS/Tests/UnitTests/DateUtilityTest.php` (`907e04c`, 2016, moved from an older test)
  - `test/config.php`

  [INFERENCE] CPL §1.9 B (`LICENSE.md:434-435`) treats new files that contain Original Code as Modifications, so these are plausibly CPL-covered.
- [FACT] Change documentation (CPL §3.3): there is no per-file change log. `CHANGELOG.MD` exists and git history exists, but the fork's history is shallow (§1). [UNKNOWN] Whether git history satisfies §3.3.

### 3.3 Share of the runtime request path that is CPL-derived
Runtime = PHP, templates, JS, CSS and HTML served or executed in production. This excludes `modules/tests`, `test/`, `src/OpenCATS/Tests`, `scripts/`, `db/`, `optional-updates/`, `ci/`, `docker/` and `wsdl/`.

| | Fork files / LOC | Upstream files / LOC |
|---|---|---|
| Original-CATS-derived | 352 / 110,922 (**97.8%** of first-party) | 332 / 104,608 (**96.4%**) |
| OpenCATS-new (MPL) | 28 / 2,032 | 36 / 3,356 |
| OpenCATS-new (GPL-2 header) | 3 / 489 | 3 / 520 |

[FACT] Every back-office request passes through CPL-headed files: `index.php`, `config.php`, `constants.php`, `lib/Session.php`, `lib/DatabaseConnection.php`, `lib/ModuleUtility.php`, `lib/Template.php`, `lib/TemplateUtility.php` and `lib/UserInterface.php`. The public careers portal goes through `careers/index.php` (CPL) and `modules/careers/CareersUI.php` (CPL). [INFERENCE] With the current code, no production feature can run without CPL-derived code.

### 3.4 Directory → licence map (fork @ `d607279`)

| Path | Files | Dominant provenance / licence evidence | Notes |
|---|---|---|---|
| `LICENSE.md` | 1 | Licence texts | unchanged upstream since 2016 |
| root `*.php` (`index.php`, `ajax.php`, `config.php`, `constants.php`, `installtest.php`, `QueueCLI.php`) | 9 CPL + 3 original no header (`installwizard.php`, `Error.tpl`, `careersPage.css`) + 1 new (`rebuild_old_docs.php`) | CPL 1.1a (Cognizo header) | entry points |
| `lib/*.php` | 70 CPL, 3 original no header, 9 new | CPL 1.1a; new = MPL 2.0 per `LICENSE.md:3`: `ACL.php`, `LDAP.php`, `*Import.php`, `ImportableEntity.php`, `JobOrderStatuses.php`, `JobOrderTypes.php`, `Width.php` | 46,044 LOC CATS-origin; largest: `DataGrid.php` 2,649, `Candidates.php` 2,473, `Search.php` 2,096 |
| `lib/datagrid/` | 1 | new (MPL 2.0) | `FilterArea.tpl` |
| `lib/artichow/`, `lib/fpdf/`, `lib/simpletest/`, `lib/sphinx/` | 33 / 14 / 122 / 1 | third-party (§4) | upstream moved FPDF and Sphinx to Composer (`f8ea1bc`, #755) and removed SimpleTest (`21e8484`, #754) |
| `modules/*/` | 65 CPL, 143 original no header (mostly `.tpl`), 15 Cognizo-no-CPL (`validator.js`, CSS, `modules/tests/*`), 3 GPL-2 headers, 4 new | CPL 1.1a / Original Code | 53,387 LOC CATS-origin; largest: settings 9,051, candidates 7,012, import 4,546, joborders 4,034 |
| `ajax/` | 17 CPL, 2 original, 2 new | CPL 1.1a | |
| `js/*.js` | 25 CPL, 8 original, 2 new (`ckeditor-manager.js`, `dataGridFilters.js`), 4 third-party | CPL; `js/lib.js` also embeds LGPL EventCache | |
| `js/submodal/` | 2 | third-party (subModal) | |
| `careers/`, `rss/`, `xml/` | 1 each | CPL | public endpoints |
| `src/OpenCATS/` | 23 new + 1 CPL (`DateUtilityTest.php`) | MPL 2.0 per `LICENSE.md:3` (no per-file notice) | PSR-4 namespace (`composer.json` autoload) |
| `db/` | 7 original + 1 new | Original Code (no header); `cats_schema.sql` 45k LOC incl. data | [UNKNOWN] copyright status of schema and seed data |
| `test/` | 14 new + 1 CPL | MPL 2.0 / CPL | Behat features |
| `scripts/` | 1 CPL, 4 Cognizo, 8 original, 1 GPL (`countfilecode.awk`, "GNU GPL, version 2 or later") | mixed | dev tooling |
| `images/` | 301 binaries | 299 from 0.9.1 import | CATS/Cognizo logos present |
| `wsdl/` | 3 original | no header | |
| `optional-updates/` | 2 CPL | CPL | |
| `vendor/` (not in git) | Composer | §4.2 | CKEditor is served from `vendor/` by templates |

---

## 4. Third-party components

### 4.1 Vendored (in git)

| Name | Version | Location | Licence (as stated) | Evidence | Usage sites | Upstream status |
|---|---|---|---|---|---|---|
| Sphinx PHP API | `$Id … 2394 2007-04-27`; protocol 0x107 | `lib/sphinx/sphinxapi.php` (679 LOC) | "GNU General Public License", **no version** | `lib/sphinx/sphinxapi.php:7-13` | `lib/Search.php:37-40` (`if (ENABLE_SPHINX) include_once(SPHINX_API)`), `:1866-1886`; `config.php:97` `ENABLE_SPHINX false` | Composer `neutron/sphinxsearch-api` 2.0.8.1, licence "GPL" (upstream `composer.lock`) |
| SimpleTest | 1.1.0 (`lib/simpletest/VERSION`) | `lib/simpletest/` (122 files) | LGPL-2.1 | `lib/simpletest/LICENSE:1-2` | `modules/tests/TestsUI.php:43-46`; loaded via module discovery (`DEPENDENCY_AUDIT.md` §3) | removed (#754) |
| FPDF | 1.53 | `lib/fpdf/` | "Freeware … You may use, modify and redistribute" | `lib/fpdf/fpdf.php:2-10,16` | `modules/reports/ReportsUI.php:414` | Composer `setasign/fpdf` 1.9.0 (MIT) |
| Artichow | n/a | `lib/artichow/` (33 text + Tuffy TTF fonts) | Public Domain dedication | `lib/artichow/Artichow.class.php:2-7` | `lib/GraphGenerator.php:38-44` | still vendored |
| jQuery | 1.3.2 | `js/jquery-1.3.2.min.js` | "Dual licensed under the MIT and GPL licenses" | file lines 1-10 | `lib/TemplateUtility.php` header, every back-office page | still vendored |
| subModal | 1.1 | `js/submodal/` | "free for you to use anywhere, just keep this comment block" | `js/submodal/subModal.js:1-12` | `lib/TemplateUtility.php`, `installwizard.php`, `modules/login/Login.tpl` | |
| sweetTitles | n/a | `js/sweetTitles.js` | "(c) Creative Commons 2005 … by-sa/2.5"; "Cognizo does not wish to hold a copyright on these modifications" | file header | ~20 templates | |
| sorttable | n/a | `js/sorttable.js` | **none stated** ("Originally by Stuart Langridge. Modifications by Cognizo") | `js/sorttable.js:1-3` | 17 templates incl. public careers | [UNKNOWN] licence of this version |
| calendarDateInput | n/a | `js/calendarDateInput.js` | **none stated** ("by Jason Moon") | `js/calendarDateInput.js:1-4` | every page (`TemplateUtility`), careers `Blank.tpl` | [UNKNOWN] |
| EventCache / `addEvent()` | n/a | embedded in `js/lib.js` (CPL file) | EventCache "CC-GNU LGPL 2.1"; `addEvent()` "No license was given" | `js/lib.js:5-14` | every page | **attribution removed upstream by #864** (`be93937`) |

### 4.2 Composer (`composer.lock`)

| Package | Fork locked | Upstream locked | Lock licence field | Notes | Usage |
|---|---|---|---|---|---|
| `ckeditor/ckeditor` | **4.25.1** (`composer.json:19` `^4.16.0`) | **4.22.1** pinned (`eaf2279`, #856 "pin CKEditor to open-source release", 2026-09-01) | GPL-2.0+/LGPL-2.1+/MPL-1.1+ (packagist metadata) | Phase 0 inspection of the installed package: `LICENSE.md` line 1, "Software License Agreement for CKEditor 4 LTS (4.23.0 and above) … Contact us to obtain a commercial license"; `ckeditor.js` contains "The license key is missing or invalid"; no `licenseKey` configured (`DEPENDENCY_AUDIT.md:67-72`). 4.22.1 is the last OSS release and is EOL, with vendor-listed XSS advisories fixed only in LTS (`DEPENDENCY_AUDIT.md:69-70`) | `modules/joborders/Add.tpl:2`, `Edit.tpl:2`, `modules/candidates/SendEmail.tpl:2`, `js/ckeditor-manager.js` |
| `phpmailer/phpmailer` | v6.8.0 | v7.1.1 | LGPL-2.1-only | used unmodified as a library | `lib/Mailer.php:39-40,76` |
| `gregwar/captcha` | — | v2.1.1 (MIT) | | | upstream `modules/careers/CareersUI.php:1158` |
| `setasign/fpdf`, `neutron/sphinxsearch-api`, `symfony/finder` | — | 1.9.0 MIT / 2.0.8.1 GPL / v8.1.5 MIT | | | |
| dev only (54 in fork: behat, mink, phpunit, symfony…) | | 61 upstream | MIT, BSD-3-Clause, Apache-2.0 (`instaclick/php-webdriver`), Artistic-1.0 (`behat/transliterator`) | not needed at runtime if installed with `--no-dev` [INFERENCE] | tests only |

[FACT] `composer.json` has no `license` field in the fork. Upstream `composer.json` has none either.

---

## 5. Attribution: what is rendered today

| Surface | Code | Rendered text | Matches Exhibit B II/III literally? |
|---|---|---|---|
| Back-office footer (all pages using `printFooter`) | `lib/TemplateUtility.php:802-837`; comment `:816-826` restates Exhibit B with "OpenCATS" substituted and "Copyright (C) 2007-2023 OpenCATs" | "OpenCATS Version … Powered by <a href=opencats.org>OpenCATS</a>" + `COPYRIGHT_HTML` | [FACT] **No.** `COPYRIGHT_HTML` is `''` (`constants.php:49`), so there is no Cognizo notice, and the link goes to opencats.org instead of catsone.com |
| Report footer | `lib/TemplateUtility.php:872-876` | "Powered by <a href=catsone.com>CATS</a>" + empty copyright | III yes; II no |
| Login page | `modules/login/Login.tpl:124-125` | "Based upon original work and Powered by OpenCATS" | No |
| Careers portal (default wrapper) | `modules/careers/Blank.tpl:38-40`; `Blank2.tpl:32-33` (links **opencats.com**); `BlankNoMargin.tpl:34-35` | "Powered by OpenCATS" logo/text | No |
| Graph view | `modules/reports/GraphView.tpl:48` | "Powered by OpenCATS" | No |
| AJAX/XML/RSS responses, PDFs, e-mails | various | none | n/a (non-HTML or fragments) [INFERENCE] |

History [FACT]:
- The 0.9.1 import rendered `&copy; 2005 - 2007 Cognizo Technologies, Inc.` (`26e291d:constants.php:47`) and "Powered by CATS" linked to catsone.com (`26e291d:lib/TemplateUtility.php:817`).
- By `a85053e` (#493, 2020-10-15), which squashes earlier develop history, the footer read "Powered by OpenCATS" and the notice was "© 2007-2023 OpenCATS".
- `2f04c49` (2024-04-24, "remove copyright") set `COPYRIGHT_HTML` to `''`.
- [UNKNOWN] Whether Cognizo (or a successor) gave written permission for these changes. Nothing in the repo records such permission.

---

## 6. What upstream changed (after `d607279`)

| Change | Commit / PR | Licence relevance |
|---|---|---|
| Removed licence-key validation, "Professional" gates, `lib/License.php` (730 LOC), `modules/settings/Professional.tpl`, `wsdl/keyCheck.wsdl`, wizard licence steps | `e422abf` / #802 (2026-06-10) | [FACT] Product-licensing (key) code only. Touches **no** licence text, footer attribution or `LICENSE.md`. It lowers the CPL-covered file count by deleting files. |
| "Modernise legacy licence headers and remove SVN cruft" | `be93937` / #864 (2026-09-03), 301 files, +990/−4,913 | [FACT] It replaces the full Exhibit A header (Original Code name, Initial Developer, "you may not use this file except in compliance", contributor line) with: "OpenCATS / Portions Copyright (C) 2005-2007 Cognizo Technologies, Inc. / Originally released as part of CATS Standard Edition under the CATS Public License 1.1a. / See LICENSE.md." Only 1 file still contains "Initial Developer of the Original Code" (181 before). It removes the EventCache/`addEvent()` attributions from `js/lib.js`. **Question for counsel:** does this satisfy CPL §3.5 ("duplicate the notice in Exhibit A in each file", `LICENSE.md:597-598`) and MPL 1.1/2.0 notice-preservation terms? It is not a relicensing: the new header still names CPL 1.1a. |
| CKEditor pinned to 4.22.1 | `eaf2279` / #856 | [INFERENCE] upstream judged ≥4.23 not open source |
| Vendored libs moved to Composer; SimpleTest removed | `f8ea1bc` / #755; `21e8484` / #754 | third-party footprint 176→39 files |
| `LICENSE.md` | none since `e32c24d` (2016-11-30) | no relicensing statement |

[UNKNOWN] PR descriptions or discussion threads for #802, #856 and #864. The GitHub API for `opencats/OpenCATS` was not reachable in this session, so only commit messages were read.

---

## 7. Implications by business model — considerations for counsel

Each row gives engineering facts and open questions. None is a conclusion.

| Model | Engineering facts | Considerations / questions |
|---|---|---|
| **Self-hosted deployment** (customer runs it) | 97.8% of runtime first-party LOC is CPL-derived (§3.3); attribution rendering differs from Exhibit B wording (§5) | Does a customer running it for its own recruiting fall outside Exhibit B I? Must the rendered footer be restored to the Exhibit B II/III wording (Cognizo notice, catsone.com link) for compliance? Is the catsone.com link requirement still meaningful given "currently http://www.catsone.com/"? |
| **Commercial distribution** (selling or bundling copies) | "Commercial Use" = distribution to a third party (`LICENSE.md:394-395`); CPL §3.1–3.6 need source availability, the licence copy, change docs and per-file notices; MPL 2.0 §3.1–3.3 allow a Larger Work under other terms | Can a paid distribution ship CPL + MPL files under their licences and add proprietary files? Are the #864-style short headers enough? Is our `CHANGELOG`/git history enough for §3.3 change documentation? |
| **Managed hosting** (we operate a single-tenant instance for a customer) | Exhibit B I names "outsourcing, service bureau, application service provider or managed service provider" (`LICENSE.md:850-853`) | Does single-tenant managed hosting of CPL code need Cognizo's written permission? Does the customer-as-licensee / us-as-contractor structure change the analysis? Who holds Cognizo's rights today? [UNKNOWN] |
| **SaaS** (multi-tenant) | Same Exhibit B I. Upstream removed multi-tenancy-related licence gates (#802), but CPL code remains | Same as above, more directly. Is any SaaS on this code base possible without permission or full replacement of CPL-derived code? |
| **Proprietary extensions** | MPL 2.0 and CPL copyleft attach per file (`LICENSE.md:55-63`, `429-436`); new files that contain no Covered Code are a Larger Work (`LICENSE.md:191-202`, `640-644`) | Is a separate-file module (e.g. under a new namespace, calling `lib/*` APIs) outside the copyleft of both licences? Does copying any code or template fragment into it pull it in (CPL §1.9 B)? How does Exhibit B I apply to hosted proprietary add-ons? |
| **Plugins** | Hooks: `eval(Hooks::get(...))` points exist (e.g. `lib/TemplateUtility.php:837`, `modules/careers/CareersUI.php:960`); modules are auto-discovered from `modules/` (`lib/ModuleUtility.php`) | Are third-party plugins in separate files a Larger Work? Is it a concern that plugin hooks can alter or remove attribution output? |
| **Paid support** | MPL 2.0 §3.5 (`LICENSE.md:212-223`) and CPL §3.5 (`LICENSE.md:606-615`) allow fee-based support and warranty "on Your own behalf" | Does paid support for self-hosted customers avoid Exhibit B I? Does remote administration of a customer server count as "outsourcing"? |

### 7.1 MPL 2.0 file-level copyleft: engineering implications
- [FACT] Copyleft follows files: changes inside a covered file stay under its licence, and new separate files can be under other terms (`LICENSE.md:55-63`, `191-202`).
- [FACT] OpenCATS files carry no Exhibit A notice. MPL coverage rests on `LICENSE.md:3` and Exhibit A's "LICENSE file" allowance (`LICENSE.md:368-371`).
- [INFERENCE] New code in **separate files**, e.g. a new `src/` namespace, is the engineering pattern that keeps licence boundaries clean. Editing a CPL file keeps the file CPL (§1.9 A).
- [RECOMMENDATION] Per-file SPDX headers for all new files, and an explicit statement of which licence applies to OpenCATS-authored files (§9 Q3).

### 7.2 GPL components
- [FACT] The Sphinx API (GPL, unversioned) is included only when `ENABLE_SPHINX` is true (default false; `config.php:97`, `lib/Search.php:37-40`), but it ships in the tree. The GPL-2 headers are in 3 templates and `scripts/countfilecode.awk`. jQuery is dual MIT/GPL. EventCache is LGPL.
- Questions for counsel:
  - Does shipping a GPL file that CPL code may include at runtime create a combination-licensing issue (MPL 1.1-based CPL vs GPL)?
  - Should the Sphinx client be removed, or kept as an optional separately-installed component?
  - Should the three GPL-2-headed templates be relicensed with their authors' consent, or rewritten?

### 7.3 CKEditor
- [FACT] The fork's lock (4.25.1) points to a build that the Phase 0 audit found under commercial LTS terms with no licence key, while upstream pinned to 4.22.1 (OSS, EOL, with known XSS advisories).
- [RECOMMENDATION] Engineering options: (a) buy an LTS licence; (b) pin 4.22.1 and accept EOL risk; (c) replace with an OSS editor, e.g. a CKEditor 5 GPL build or a permissively licensed editor. Counsel needed on (a) and on the licence of whatever build is currently deployed.

---

## 8. Engineering option matrix

| Option | What it means | Relief from Exhibit B I/II/III | Effort / notes |
|---|---|---|---|
| A. Keep CPL code; **self-host only** + paid support | Distribute source; no managed hosting or SaaS | none needed if counsel agrees self-hosting is outside Exhibit B I | Low. Restore literal Exhibit B II/III footer if counsel advises (about 3 files: `constants.php`, `lib/TemplateUtility.php`, careers/login templates) |
| B. **Seek written permission** from Cognizo / successor | Hosted-use and attribution permission | full, if granted | Legal/business effort. [UNKNOWN] current rights holder (Cognizo's CATS product is now at catsone.com, per `docs/competitive/PRICING_AND_PACKAGING.md:15`) |
| C. **Clean-room replacement** of CPL-derived modules as they are modernized (strangler) | New implementations written from specs by people who have not copied CPL code; old files deleted | only once **all** CPL-derived runtime code is gone | See estimate below |
| D. **New platform** from scratch, with data-migration importers from the old schema | New code base; old app runs self-host only until retired | full for the new platform | Highest effort; matches `OPEN_CATS_2_PRODUCT_DIRECTION.md:95` |
| E. Hybrid: C/D for hosted offer + A for community edition | Two editions | hosted edition relieved | Packaging complexity |

**Estimate: share of CPL-derived code retired by incremental modernization** [INFERENCE, engineering estimate]:
- **Editing** CPL files (security fixes, PHP 8 upgrades, refactors in place) retires **0%**. Under CPL §1.9 A (`LICENSE.md:431-432`), edited files remain Modifications. Upstream's +23k/−21k line churn since 2011 left every CATS-origin file CPL-derived.
- Only **deleting** CPL files and replacing them with independently written new files counts. The fork's CATS-origin code (163,712 LOC) splits by area as follows:

  | Area | CATS-origin LOC | Share |
  |---|---|---|
  | `lib/` domain + infrastructure | 46,044 | 28.1% |
  | `db/` schema + seed data | 45,143 | 27.6% |
  | `modules/` UI + templates | 53,387 | 32.6% |
  | `js/` | 9,342 | 5.7% |
  | root / `ajax/` / `careers` / `rss` / `xml` / `optional-updates` / `scripts` / other | 9,796 | 6.0% |

- Illustrative scenarios for a strangler programme:
  - Replacing the **candidates, job orders, companies and contacts** modules plus their `lib` classes (`Candidates.php`, `JobOrders.php`, `Companies.php`, `Contacts.php`, `Pipelines.php`, `DataGrid.php`, `Search.php`) retires roughly 16,930 module LOC + 11,297 lib LOC ≈ **17%** of CATS-origin LOC.
  - The bootstrap path (`index.php`, `Session`, `DatabaseConnection`, `ModuleUtility`, `Template*`, `UserInterface`) still stays CPL until the shell itself is replaced.
  - Dead or obsolete code (upstream #802 removed 1,745 lines; `lib/Encryption.php` is unused per `DEPENDENCY_AUDIT.md` §3; `modules/tests` 3,303 LOC; `optional-updates` 2,736 LOC) retires a further ~5–8% cheaply.
- [INFERENCE] Relief from Exhibit B I needs **100%** replacement of runtime CPL-derived code in the hosted product, or permission. Partial replacement shrinks the CPL surface but does not by itself change the hosted-use analysis.
- [UNKNOWN] Whether a new schema that is compatible with, or migrates from, `db/cats_schema.sql` raises derivation questions.

[RECOMMENDATION] If Option C/D is pursued, set up clean-room process controls: specs written from behaviour, separate authors, a provenance log per new file, and SPDX headers. Counsel should define these controls.

---

## 9. Questions for legal review

1. Who currently holds Cognizo Technologies' rights in CATS 0.9.x, and is there any recorded permission (Exhibit B I/II/III) granted to the OpenCATS project?
2. Does Exhibit B I apply to (a) a customer self-hosting for internal use, (b) single-tenant managed hosting by us, (c) multi-tenant SaaS, (d) remote administration under a support contract?
3. What licence governs OpenCATS-authored files that have no header? Is `LICENSE.md:3` plus the MPL Exhibit A "LICENSE file" allowance enough? What about the 3 templates with GPL-2 headers?
4. Are the current footers ("Powered by OpenCATS", empty copyright) compliant with Exhibit B II/III? Must we restore "Copyright (C) 2005 - 2007 Cognizo Technologies, Inc." and a "Powered by CATS" link to catsone.com on every rendered HTML page? Does "every rendered HTML document" include careers-portal pages customised by admins, AJAX fragments, e-mails and PDFs?
5. Is upstream #864's short header acceptable under CPL §3.5 and the notice-preservation terms? Was removing the EventCache (LGPL) and `addEvent()` attributions from `js/lib.js` permissible? Should our fork adopt or avoid that change when merging?
6. Do CPL §3.3 (change documentation) and §3.4 (a "LEGAL" file) impose obligations we currently do not meet?
7. Is a separate-file proprietary module or plugin a Larger Work under both MPL 2.0 and CPL? Do any rules apply to plugins calling CPL APIs or using hook points?
8. GPL interaction: is shipping the GPL Sphinx API (unversioned GPL) alongside CPL/MPL code acceptable, given that it is included only when enabled? Should it be removed?
9. CKEditor: what licence applies to the 4.25.1 package that our lock resolves to, given that packagist metadata says GPL/LGPL/MPL and the package's `LICENSE.md` says commercial LTS? Is there exposure for any existing deployment?
10. Unlicensed or unclear third-party files (`sorttable.js`, `calendarDateInput.js`, `addEvent()`), and sweetTitles under CC BY-SA 2.5: keep, replace or seek permission?
11. Trademarks: CPL grants exclude trademarks (`LICENSE.md:476`), and §6.3 restricts use of "CATS"/"Cognizo" in licence names. Can we use "OpenCATS", "CATS" (e.g. `CATS_VERSION`, "CATS Version" in the report footer) and the CATS/Cognizo logos in `images/`?
12. What clean-room controls would counsel require for Option C/D to count as independent works? Is a new database schema derived from `db/cats_schema.sql` a concern?
13. For new code (decision D4 in `OPEN_CATS_2_PRODUCT_DIRECTION.md:107`), which licence options (MPL-2.0, AGPL, Apache-2.0) are compatible with linking to or co-existing with CPL files during a transition?

---

## 10. Facts vs inferences vs unknowns

**Facts** (verified in files or git): the licence texts and line numbers (§2); file counts and LOC per category (§3, reproducible with the scan method in §1); third-party headers and versions (§4); footer code and its history (§5); upstream commits #802, #856, #864, #754, #755 and `2f04c49` (§6); `LICENSE.md` history (§2.1).

**Inferences:**
- that 0.9.1-import files without headers are Original Code;
- that the CPL-headed files added after 2011 contain Original Code;
- that MPL 2.0 has no network trigger;
- that editing a CPL file cannot remove CPL coverage;
- the replacement-share scenarios in §8;
- that dev dependencies are not distributed at runtime.

**Unknowns:**
- the current Cognizo rights holder and any permissions granted;
- the PR discussion for #802, #856 and #864 (GitHub API not reachable for `opencats/opencats` here);
- the licence of the CKEditor build actually deployed anywhere;
- the licences of `sorttable.js`, `calendarDateInput.js` and `addEvent()`;
- the artwork copyright;
- the full pre-2011 provenance: 0.9.1 was imported as a single commit, so which parts Cognizo authored versus earlier contributors is not visible;
- the fork's own pre-2022 history (the clone is shallow; it was analysed through upstream's full history instead).

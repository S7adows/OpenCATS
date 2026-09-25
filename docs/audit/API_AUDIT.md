# OpenCATS: API and Integrations Audit

**Scope.** This document lists and evaluates every machine-facing interface in the OpenCATS repository (CATS 0.9.x lineage). It covers:
- the `ajax.php` RPC dispatcher and all 32 handler files under `ajax/` and `modules/*/ajax/`;
- endpoints routed through `index.php` that return non-page responses (XML, CSV, vCard, PNG, text, or HTML fragments);
- the public, unauthenticated surfaces: the careers portal, RSS, XML job feeds, the Firefox toolbar module, the graphs module, and web-reachable scripts;
- the absence of a REST/JSON API;
- every outbound or third-party integration: e-mail, LDAP, Resfly SOAP parsing, Sphinx, Google geocoding, the CATS version check, vCard, CSV import/export, calendar, document converters, job boards, hooks, and the queue/cron.

Every claim below is tied to a file and line. Items that could not be verified in the code are labelled ASSUMPTION or INFERENCE.

---

## Method

These artefacts were inspected read-only. The only files written are this document and the `docs/audit/` directory.

- Read in full: `ajax.php`, `lib/AJAXInterface.php`, all 21 files in `ajax/`, all 11 files in `modules/*/ajax/` (only the dispatch head of `modules/install/ajax/ui.php`), `modules/careers/CareersUI.php` (dispatch, apply, and registration paths), `modules/rss/RssUI.php`, `modules/xml/XmlUI.php`, `lib/XmlJobExport.php`, `modules/xml/xml_templates/*.xtpl`, `wsdl/*.wsdl`, `modules/toolbar/ToolbarUI.php`, `lib/Mailer.php`, `lib/LDAP.php`, `lib/ParseUtility.php`, `lib/License.php` (LicenseUtility), `lib/ZipLookup.php`, `lib/NewVersionCheck.php`, `lib/Hooks.php`, `lib/QueueProcessor.php`, `QueueCLI.php`, `modules/queue/**`, `modules/calendar/tasks/*`, `lib/DocumentToText.php`, `lib/Export.php`, `modules/export/ExportUI.php`, the relevant parts of `lib/DataGrid.php`, `modules/graphs/GraphsUI.php`, `modules/settings/SettingsUI.php` (`ajax_*` actions), `index.php` (routing), `js/lib.js` (AJAX client), `.htaccess` files, `config.php`, `constants.php`, `db/cats_schema.sql` (the `xml_feeds`, `career_portal_template`, and `system` tables), `.github/workflows/ci.yml`, `test/runAllTests.sh`, and `test/features/*`.
- Commands used (all read-only): `grep -rn` for each endpoint name across `js/`, `modules/`, and `*.tpl` to find consumers; `grep -rn "json_encode|application/json|SoapServer|csrf|rate.?limit|oauth|saml|webhook|linkedin|ical|VCALENDAR"`; `sed -n`/`awk` with line numbers for every citation.
- Executed in the scratchpad (PHP 8.4 CLI, no repo writes):
  - `php -r 'var_dump(preg_replace("[^A-Za-z0-9]", "", "../../tmp/x"));'` returns `"../../tmp/x"`, which confirms the sanitiser in API-007 is ineffective.
  - `php -r 'var_dump(function_exists("get_magic_quotes_runtime"));'` returns `false` (see API-019).
  - `php -r 'include_once(LEGACY_ROOT . "/lib/CATSUtility.php");'` fails with `Error: Undefined constant "LEGACY_ROOT"` (see API-012).
- Liveness probes run from the sandbox through its egress proxy on 2026-09-25: `getent hosts soap.resfly.com` returned no record; `curl http://soap.resfly.com/parse.php` returned `Could not resolve host`; `curl "https://maps.googleapis.com/maps/api/geocode/xml?sensor=false&address=10001"` returned `<status>REQUEST_DENIED</status> ... You must use an API key`; `curl http://www.catsone.com/catsnewversion.php` returned HTTP 403, which is inconclusive because the proxy may have produced it.

---

## Summary of Findings

| ID | Title | Severity |
|---|---|---|
| API-001 | No REST/JSON API exists. The only machine interface is a session-cookie-bound XML/HTML RPC used by the UI | HIGH |
| API-002 | Careers "apply" trusts a client-supplied `candidateID`, so anyone can overwrite any candidate record without logging in | CRITICAL |
| API-003 | The careers returning-candidate path calls `Candidates::update()` with misaligned arguments: EEO data is corrupted, the owner is reassigned, and a bogus "ownership change" mail is sent | HIGH |
| API-004 | Careers "registered candidate" login is a forgeable cookie checked against e-mail, last name, and zip. It allows profile edits, and deletion of any attachment on the site by ID | HIGH |
| API-005 | State-changing AJAX endpoints and `ajax_tags_*` do not check access level, so a READ-level user can delete or modify data | HIGH |
| API-006 | No CSRF protection anywhere. `ajax.php` accepts GET through `$_REQUEST`, and the session cookie has no SameSite attribute | HIGH |
| API-007 | `getDataGridPager` / `DataGrid::get()`: an ineffective regex allows path-traversal `include` of any `dataGrids.php` and instantiation of any loaded class | HIGH |
| API-008 | Maintenance and operations scripts can be reached over the web without authentication: `install:maint`, `install:attachmentsReindex`, `QueueCLI.php`, `rebuild_old_docs.php` | MEDIUM |
| API-009 | Toolbar API: `getLicenseKey` is unauthenticated, credentials travel in the GET query string, `attemptLogin` calls an undefined method, and the target browser platform no longer exists | MEDIUM |
| API-010 | Resfly SOAP parsing is dead and not actually gated: `isParsingEnabled()` always returns true, and resume text plus the license key would be sent over plaintext HTTP. Hosts without ext-soap crash | HIGH |
| API-011 | Mailer: PHPMailer runs in exception mode with no try/catch, `MAIL_MAILER=0` does not disable the transport, and forgot-password calls a method that does not exist | HIGH |
| API-012 | Job syndication (RSS and XML): `rss/index.php` is fatally broken, output is not escaped as XML, the "portal disabled" setting is ignored, company and country are hard-coded, and there is no push submission | MEDIUM |
| API-013 | ZIP lookup: an unauthenticated endpoint makes an outbound call to the keyless Google Geocoding API, which now returns `REQUEST_DENIED` | MEDIUM |
| API-014 | No rate limiting or abuse controls on public endpoints: careers apply, graphs, zipLookup, toolbar login | MEDIUM |
| API-015 | The AJAX response contract is inconsistent and unsafe: XML, HTML, or plain text; unescaped XML values; no versioning; errors detected by sniffing for a PHP error string | MEDIUM |
| API-016 | No machine credentials (API keys or OAuth2) and no SSO (SAML or OIDC). The only external identity source is LDAP, with an unescaped filter and no TLS | MEDIUM |
| API-017 | No webhooks or outbound events. The only extension API is `Hooks`: PHP strings stored in the session and `eval`'d, 232 hook names, 3 implementations | MEDIUM |
| API-018 | The async queue depends on an undocumented cron job, registers the same task twice, and reports tasks by name only | LOW |
| API-019 | The whole machine-facing surface (`ajax.php`, `index.php`, `QueueCLI.php`) hits a fatal error on PHP ≥ 8.0 (`get_magic_quotes_runtime`) | HIGH |
| API-020 | Import/export: candidate CSV export has no access-level check and no protection against formula injection; import is CSV/TSV only with no API | MEDIUM |
| API-021 | Interface test coverage is close to zero: CI never calls `ajax.php`, careers, RSS, XML, or the toolbar, and the in-app AJAX tests are mostly empty stubs | MEDIUM |
| API-022 | The in-app test harness (`m=tests`) can be run by any logged-in user against the live database | MEDIUM |

---

## 1. Interface map

```
                     ┌──────────────────────── authenticated (PHP session cookie "CATS") ─────────────────────────┐
Browser UI ──XHR──►  ajax.php?f=<fn> | f=<module>:<fn>   → ajax/*.php, modules/*/ajax/*.php   (XML / HTML / text)
            ──GET──► index.php?m=<module>&a=<action>     → ~30 UI modules; some actions return CSV, vCard, PNG, text
                     └──────────────────────────────────────────────────────────────────────────────────────────┘
Public    ──GET/POST► careers/  (index.php?m=careers | ?showCareerPortal=1)   HTML portal, apply + upload
          ──GET────► rss/  (broken) | index.php?m=rss                         RSS 2.0
          ──GET────► xml/?t=indeed|simplyhired | index.php?m=xml               job-feed XML
          ──GET────► index.php?m=toolbar&a=…                                    Firefox toolbar text protocol
          ──GET────► index.php?m=graphs&a=generic|genericPie|jobOrderReportGraph|wordVerify  PNG
          ──GET────► QueueCLI.php, rebuild_old_docs.php, installwizard.php, installtest.php   (scripts)
Outbound ──────────► SMTP/sendmail/mail() (PHPMailer) · LDAP :389 · SOAP http://soap.resfly.com (dead)
                     · http://maps.googleapis.com geocode (no key) · http://www.catsone.com:80 version check
                     · Sphinx searchd :3312 · local binaries antiword/pdftotext/html2text/unrtf
```

---

## 2. The AJAX dispatcher (`ajax.php`)

### 2.1 Request contract (FACT)
- **Transport:** any HTTP method. Parameters are read from `$_REQUEST`, so GET and POST are both accepted (`ajax.php:63`, `:77`, `:110`, `:120`). The JS client always sends POST with `application/x-www-form-urlencoded` (`js/lib.js:308-315`, `:342-366`).
- **Routing:** the `f` parameter.
  - `f=<fn>` loads `ajax/<fn>.php` (`ajax.php:77-82`).
  - `f=<module>:<fn>` loads `modules/<module>/ajax/<fn>.php` (`ajax.php:83-92`).
  - Both parts are passed through `preg_replace("/[^A-Za-z0-9]/", "", …)` (`ajax.php:79,88,89`). This sanitiser is correct.
- **Missing or unknown `f`:** the response is `<data><errorcode>-1</errorcode><errormessage>No function specified.|Invalid function name.</errormessage></data>` as `text/xml` (`ajax.php:63-75`, `:94-106`).
- **`nobuffer`:** when present, the handler is included directly with no output buffering, no `AJAX_HOOK`, no whitespace filter, and no `$filters` (`ajax.php:110`, `:132-135`). The JS client sets it through `disableBuffering` (`js/lib.js:403-406`).
- **`nospacefilter`:** when present, the regex `preg_replace('/^\s+/m', '', $output)` is skipped (`ajax.php:120-123`).
- **`$filters`:** initialised as an empty array (`ajax.php:108`). Each element is `eval`'d against the buffered output (`ajax.php:125-128`). No handler in the repo populates it (`grep '\$filters\['` returns nothing). It is a dormant code-execution extension point that only hooks could fill, because `eval(Hooks::get('AJAX_HOOK'))` runs first (`ajax.php:118`).
- **Session ID in the request body:** the client appends `&CATS=<session_id>` to every call (`js/lib.js:332-335`, `:349-352`). The value comes from `CATSSession::getCookie()`, which returns `CATS_SESSION_NAME . '=' . session_id()` (`lib/Session.php:555-558`). It is printed into many templates, for example `ajax/getPipelineJobOrder.php:191`. PHP ignores a session ID sent in POST unless `session.use_only_cookies=0` (INFERENCE from PHP defaults). The effect is that raw session IDs end up in page HTML where any XSS can read them.
- **Anti-caching:** a random `rhash` parameter (`js/lib.js:322-325`) plus `Expires`/`Last-Modified` headers (`ajax.php:46-47`).
- **Client timeout:** 15 s plus a per-call extra (`js/lib.js:50`, `:413`).

### 2.2 Response contract (FACT)
- `AJAXInterface::outputXMLPage()` sends `Content-type: text/xml`, followed by `<?xml version="1.0" encoding="UTF-8"?>` and the handler's XML string (`lib/AJAXInterface.php:47-53`; `AJAX_ENCODING` is `'UTF-8'` at `config.php:133`).
- An error response is `<data><errorcode>N</errorcode><errormessage>msg</errormessage></data>`. The message is **not escaped** (`lib/AJAXInterface.php:61-69`). By convention `-1` means invalid input or not logged in and `-2` means no data or an operation error. Nothing defines this as constants.
- A success response is `<data><errorcode>0</errorcode><errormessage></errormessage><response>…</response></data>` (`lib/AJAXInterface.php:77-86`).
- Many handlers break this contract. They return plain text through `die()` (`ajax/editActivity.php:77`, `ajax/getCandidateIdByEmail.php:36`, `ajax/getCandidateIdByPhone.php:36`, which reuses the e-mail error text), HTML fragments (see the table), or CSV-like text (`modules/import/ajax/processMassImportItem.php:87`).
- The JS client detects server failure by searching the body for `'</b> on line <b>'`, the PHP HTML error format (`js/lib.js:443-446`).
- There is no version field or version negotiation, and no schema (XSD/DTD) for any response.

### 2.3 Authentication helpers (`lib/AJAXInterface.php`)
- `AJAXInterface` (`:38`) handles no authentication. It only provides output and validation helpers: `isRequiredIDValid` (`:97-135`), `isOptionalIDValid` (`:144-154`, which accepts `'NULL'`), `isChecked` (`:163-172`), and `getTrimmedInput` (`:180-188`).
- `SecureAJAXInterface` (`:196-261`) calls `session_name(CATS_SESSION_NAME)` and `session_start()`. It rejects the request unless `$_SESSION['CATS']->isLoggedIn()` returns true (`:251-260`), then caches the site ID and user ID. **It performs no access-level (ACL) check.** Each handler must call `$_SESSION['CATS']->getAccessLevel(...)` itself, and only 4 of 32 do.
- No class named `AJAXInterfaceStandard` exists. The two classes above are the whole abstraction.

### 2.4 Endpoint inventory (every file under `ajax/` and `modules/*/ajax/`)

"Auth" means `new SecureAJAXInterface()` is called at the cited line. "ACL" means an explicit `getAccessLevel` check. "State" means the call has a side effect.

| # | `f=` | Purpose | Parameters | Response | Auth | ACL | State | JS / template consumer |
|---|---|---|---|---|---|---|---|---|
| 1 | `deleteActivity` | Delete an activity entry | `activityID` | XML success | ✔ `ajax/deleteActivity.php:33` | **none** | **Yes**: delete (`:47`) | `js/activity.js:568` |
| 2 | `editActivity` | Update an activity and return the formatted row | `activityID`, `type`, `jobOrderID` (id or `NULL`), `notes`, `date` (MM-DD-YY), `hour`, `minute`, `ampm` | XML `type/typedescription/notes/regarding/date`; plain text on a bad date (`:77`) | ✔ `:36` | **none** | **Yes**: update (`:113`) | `js/activity.js:504` |
| 3 | `getAttachmentLocal` | Check that an attachment file exists before download | `id`, `directoryNameHash` (md5 of the directory name) | XML `success` | ✔ `:31` | none; uses `new Attachments(-1)`, which skips site scoping (`:46`); capability check is the md5 hash (`:52`) | No | `js/attachment.js:102` |
| 4 | `getCandidateIdByEmail` | Duplicate check by e-mail | `email` | XML `candidate/id,name`, name **not escaped** (`:63`) | ✔ `:30` | none | No | `js/candidate.js:81` |
| 5 | `getCandidateIdByPhone` | Duplicate check by phone | `phone` | XML, same shape; name not escaped | ✔ `:30` | none | No | `js/candidate.js:151` |
| 6 | `getCompanyContacts` | List a company's contacts | `companyID` | XML `contact/id,firstname,lastname`, not escaped (`:64-66`) | ✔ `:33` | none | No | `js/company.js:275` |
| 7 | `getCompanyLocation` | Company address | `companyID` | XML `address/city/state/zip`, not escaped (`:60-63`) | ✔ `:33` | none | No | `js/company.js:154` |
| 8 | `getCompanyLocationAndDepartments` | Address plus departments | `companyID` | XML; departments escaped, address not (`:66-70`) | ✔ `:33` | none | No | `js/joborder.js:113`, `js/contact.js:160` |
| 9 | `getCompanyNames` | Company-name autocomplete | `dataName`, `maxResults` | XML `totalelements`, `result/id,name` (name `rawurlencode`d, `:81`) | ✔ `:34` | none | No | `suggestListActivate('getCompanyNames', …)` in `modules/joborders/Add.tpl:61`, `Edit.tpl:55`, `modules/contacts/Add.tpl:50`, `Edit.tpl:53` |
| 10 | `getDataGridPager` | Re-render a DataGrid page | `i` (identifier `module:Class[:json]`), `p` (JSON params), `dynamicArgument` | **HTML** (`DataGrid::draw`) | ✔ `:34` | none (see API-007) | Session grid parameters | `js/dataGrid.js:574` |
| 11 | `getDataItemJobOrders` | Job orders linked to a candidate, company, or contact | `dataItemID`, `dataItemType` (100, 200, or 300) | XML `joborder/id,title,companyname,assigned` (escaped) | ✔ `:30` | none | No | `js/activity.js:402` |
| 12 | `getParsedAddress` | Parse a free-text address block | `mode` (`contact`, `company`, `person`), `addressBlock` | XML name, address, phones; input echoed **unescaped** (`:136-155`) | **✘ none**: `new AJAXInterface()` at `:35` | n/a | No (CPU only) | `js/addressParser.js:284` |
| 13 | `getPipelineDetails` | Activity history of one pipeline row | `candidateJobOrderID` | **HTML** table; `notes` echoed raw (`:79-81`) | ✔ `:33` | none | No | `js/pipeline.js:52` |
| 14 | `getPipelineJobOrder` | Paged, sorted pipeline for a job order | `joborderID`, `page`, `entriesPerPage`, `sortBy`, `sortDirection`, `indexFile`, `isPopup` | **HTML + inline JS** | ✔ `:37` | Row actions only (`:293`, `:303`, `:308`) | Session `setPipelineEntriesPerPage` (`:59`) | `js/pipeline.js:106` |
| 15 | `getReportHTML` | Empty file (0 bytes) | none | empty body | none | n/a | No | none (dead) |
| 16 | `replaceTemplateTags` | Fill e-mail template placeholders for a candidate | `candidateID`, `templateText` | XML `text` (escaped) | ✔ `:6` | none | No | `js/emailHandler.js:266` |
| 17 | `setCandidateJobOrderRating` | Set a pipeline rating from -6 to 5 | `candidateJobOrderID`, `rating` | XML `newrating` | ✔ `:33` | ✔ `pipelines.editRating ≥ EDIT` (`:35`) | **Yes** (`:60`) | `js/match.js:130` |
| 18 | `setColumnWidth` | Save a DataGrid column width | `instance`, `columnName`, `columnWidth`, all unvalidated | XML empty success | ✔ `:30` | none | **Yes**: saved to the database through `Session::setColumnPreferences` (`lib/Session.php:1209`) | `js/dataGrid.js:303` |
| 19 | `showTemplate` | Fetch an e-mail template body | `templateID` | XML `text` (escaped) | ✔ `:5` | none | No | `js/emailHandler.js:168` |
| 20 | `testEmailSettings` | Send a test e-mail | `testEmailAddress`, `fromAddress` (checked only for `@`, `:62`, `:73`) | XML success or error | ✔ `:33` | **none**: any user can send mail with any From address | **Yes**: sends e-mail (`:88`) | `modules/settings/Settings.js:140` |
| 21 | `zipLookup` | City and state from a ZIP code using Google | `zip` | XML `address/city/state` | **✘ none**: `new AJAXInterface()` at `:9` | n/a | Outbound HTTP | `js/lib.js:604`, called from `CityState_populate` in candidates, companies, and contacts `Add/Edit.tpl` |
| 22 | `import:processMassImportItem` | Import the next 50 files of a bulk-resume batch | none (reads `$_SESSION['CATS']->massImportFiles`) | **text** `dups,success,processed` or `done` (`:43`, `:87`) | ✔ `:33` | none; relies on the session state set by `ImportUI` | **Yes**: creates attachments (`:62-65`) | `modules/import/import.js:224` |
| 23 | `install:ui` | Installer wizard steps (`a=startInstall`, `installTest`, `databaseConnectivity`, `mailSettings`, `setMailSettings`, `resumeParsing`, `optionalComponents`, `detectRevision`, `resetDatabase`, `restoreFromBackup`, `upgradeCats`, `maint`, `reindexResumes`, `loginCATS`, …; `ui.php:67-1044`) | `a` plus step parameters | HTML and `<script>` | **✘ none**; locked only by the existence of `INSTALL_BLOCK` (`:55`) | n/a | **Yes**: rewrites `config.php` through `CATSUtility::changeConfigSetting` with raw input (e.g. `:120`) and resets the database | `js/install.js:92`, `:172` |
| 24 | `install:maint` | Runs `index.php` with `$maintPage=true` to step through pending schema upgrades | none | HTML/script | **✘ none** (`maint.php:30-37`) | n/a | **Yes**: deletes `modules.cache` and runs pending module-schema SQL or PHP (`lib/ModuleUtility.php:517-546`) | `js/install.js:134` |
| 25 | `install:attachmentsReindex` | Re-extract text from every attachment | none | text count | **Conditional**: only if `INSTALL_BLOCK` exists (`:32-35`, `:52`) | SA, only when `INSTALL_BLOCK` exists | **Yes**: bulk `UPDATE attachment` (`:95`) | Included by `install:ui` (`ui.php:962`) |
| 26 | `install:attachmentsToThreeDirectory` | One-off 0.x migration of the attachment directory layout | none | none | ✔ `:33` | ✔ ROOT (`:35`) | **Yes**: `ALTER TABLE` and file moves (`:57`, `:93`) | only in `CHANGELOG.MD:525` |
| 27 | `lists:addToLists` | Add items to saved lists | `listsToAdd` (CSV of IDs), `itemsToAdd` (CSV of IDs), `dataItemType` | XML `response=success` | ✔ `:63` | none | **Yes** | `js/lists.js:344` |
| 28 | `lists:deleteList` | Delete a saved list | `savedListID` | XML | ✔ `:36` | **none** | **Yes** | `js/lists.js:272` |
| 29 | `lists:editListName` | Rename a list | `savedListID`, `savedListName` | XML `success`, `collision`, or `badName` | ✔ `:36` | none | **Yes** | `js/lists.js:106` |
| 30 | `lists:newList` | Create a list | `dataItemType`, `description` | XML `success`, `collision`, or `badName` | ✔ `:36` | none | **Yes** | `js/lists.js:191` |
| 31 | `settings:backup` | Full or attachments-only backup (`a=start` then `a=backup`) | `a`, `attachmentsOnly`, `attachmentID` | HTML `<script>` plus `progress.txt` written under `attachments/…` (`:66`) | ✔ `:34` | ✔ SA (`:36`) | **Yes**: writes the zip of DB and files | `modules/settings/Backup.tpl:69-70`, `js/backup.js` (polls `progress.txt`, `:202`) |
| 32 | `tests:getCandidateJobOrderID` | Test helper | `candidateID`, `jobOrderID` | XML `id` | ✔ `:33` | none | No | only `modules/tests/testcases/AJAXTests.php:826` |

**Totals:**
- Auth: 26 of 32 handlers authenticate. `getParsedAddress`, `zipLookup`, `install:ui`, `install:maint`, and `install:attachmentsReindex` (when `INSTALL_BLOCK` is missing) do not, and `getReportHTML` is empty.
- ACL: only 4 handlers check access level: `setCandidateJobOrderRating`, `install:attachmentsToThreeDirectory`, `settings:backup`, and `install:attachmentsReindex` (conditionally).
- State: 15 handlers change persistent state, and 2 more (`getDataGridPager`, `getPipelineJobOrder`) change session state.
- Formats: 22 return XML, 6 HTML, 3 text or nothing, and 1 (`getReportHTML`) is an empty file.

### 2.5 Other machine-facing actions routed through `index.php` (not `ajax.php`)
| Route | Returns | Auth / ACL | Evidence |
|---|---|---|---|
| `m=settings&a=ajax_tags_add`, `ajax_tags_del`, `ajax_tags_upd` | HTML fragment. `tag_title` is echoed unescaped by `printf('%s')` in add | Login only. **No ACL**, while the `tags` page itself requires SA | `modules/settings/SettingsUI.php:675-700`, `:130-192` vs `:234`; consumer `modules/settings/tags.tpl:38-68` |
| `m=settings&a=ajax_wizard{AddUser,DeleteUser,CheckKey,Localization,FirstTimeSetup,License,Password,SiteName,Email,Import,Website}` | Text/HTML | SA, except `ajax_wizardEmail`, which requires only READ (`:820`) | `SettingsUI.php:702-855`; `js/wizardIntro.js:204` |
| `m=wizard&a=ajax_getPage` | HTML. `eval`s the PHP stored in `$_SESSION['CATS_WIZARD']` | Module does not require auth; data comes from the session | `modules/wizard/WizardUI.php:82`, `:181`; `modules/wizard/wizard.js:130` |
| `m=calendar&a=dynamicData&month&year` | Custom pipe/comma-delimited event string | Login | `modules/calendar/CalendarUI.php:75`, `:305-338`; `lib/Calendar.php:501-518`; `modules/calendar/Calendar.js:538` |
| `m=export&a=export` / `exportByDataGrid` | CSV (`text/x-csv`) | Login only, **no ACL** | `modules/export/ExportUI.php:60-66`, `:125`; `lib/DataGrid.php:1463` |
| `m=contacts&a=downloadVCard` | vCard 2.1 | `contacts.downloadVCard ≥ READ` | `modules/contacts/ContactsUI.php:175-182`; `lib/VCard.php:54`, `:368-375` |
| `m=attachments&a=getAttachment&id&directoryNameHash` | Binary stream | Login plus md5 capability; `Attachments(-1)` skips site scoping | `modules/attachments/AttachmentsUI.php:59`, `:83-85` |
| `m=import&a=massImport&step=99…` | Text | `import.massImport ≥ EDIT` | `js/massImport.js:70`, `:118`; `modules/import/ImportUI.php:1507` |
| `m=graphs&a=generic|genericPie|jobOrderReportGraph|wordVerify|testGraph` | PNG | **Public**; data comes from GET, up to 2000×1200 px | `modules/graphs/GraphsUI.php:48`, `:53-66`, `:78-99` |
| `m=graphs&a=activity|newCandidates|…` | PNG | Login | `GraphsUI.php:101-133` |

---

## 3. Public (unauthenticated) surfaces

The router decides which modules skip authentication by calling `ModuleUtility::moduleRequiresAuthentication()` (`index.php:195`, `:256-259`; `lib/ModuleUtility.php:109-135`). These modules set `_authenticationRequired = false`: `xml` (`XmlUI.php:54`), `wizard` (`:46`), `graphs` (`:48`), `toolbar` (`:46`), `rss` (`:49`), install `CATSUI` (`:36`), `careers` (`:53`), and `login` (`:43`). The careers, RSS, and XML modules are also forced on by the `$careerPage`, `$rssPage`, and `$xmlPage` globals, or by `?showCareerPortal=1` (`index.php:176-191`).

### 3.1 Careers portal (`careers/index.php` → `modules/careers/CareersUI.php`)
- **Entry points:** `careers/index.php:34-39` (`chdir('..')`, then includes `config.php` and `index.php`); `index.php?m=careers`; `index.php?showCareerPortal=1`.
- **Site selection:** single-tenant. `Site(-1)->getFirstSiteID()` is used unless a `CAREERS_SITEID` hook overrides it (`CareersUI.php:77-81`).
- **Enabled check:** if the portal is disabled, the response is `<!-- Job Board Disabled -->` (`:98-103`). The default is `enabled => '0'` (`lib/CareerPortal.php:77`).
- **Template override:** any visitor can switch templates with `?templateName=` (`:106-109`).
- **Job list source:** `JobOrders::getAll(JOBORDERS_STATUS_SHARE, …, onlyPublic=true)` (`:118`).

| `p=` / `pa=` | Method | Purpose | Notes |
|---|---|---|---|
| (none) | GET | Main page and registered-candidate login block | `:856-935`; postback `?postback=yes` runs `ProcessCandidateRegistration` |
| `showAll` | GET | Job list | `:151-179`; honours `allowBrowse` |
| `search`, `searchResults` | GET | Search | `:180-182` and `:856` are empty branches, so search is not implemented |
| `showJob&ID=` | GET | Job details | `:793-855`; checks `public`, not status |
| `candidateRegistration&ID=` | GET | "Have you applied before?" gate | `:359-411`; only when registration is enabled |
| `applyToJob&ID=` (+ `applyToJobSubAction=processLogin|resumeLoad|resumeParse`) | POST | Application form; loads or parses a résumé | `:412-714`; `resumeParse` calls Resfly (`:521-541`, see API-010) |
| `onApplyToJobOrder` (+ `questionnairePostBack=1`) | POST multipart | Create or update the candidate, attach the résumé, add to pipeline, add activity, run the questionnaire, send 2–3 e-mails | `:715-792`, `onApplyToJobOrder()` at `:1190-1600` |
| `registeredCandidateProfile` / `pa=updateProfile` | GET | Show own profile | `:183-258` |
| `onRegisteredCandidateProfile&attachmentID=` | POST | Update profile and replace the résumé | `:259-358` |
| `pa=logout` | POST | Clear the portal cookie | `:134-141` |

- **Questionnaire:** `Questionnaire::doActions($questionnaireID, $candidateID, $_POST)` (`:1339-1345`).
- **Uploads:** `AttachmentCreator::createFromUpload(…'file'…)` (`:1351-1373`), or a staged file named by `$_POST['file']` (`:1375-1402`).
- **E-mails sent:**
  - `EMAIL_TEMPLATE_CANDIDATEAPPLY` to the applicant-supplied address (`:1473-1523`);
  - `EMAIL_TEMPLATE_CANDIDATEPORTALNEW` to the job owner and the recruiter (`:1528-1600`).

### 3.2 RSS (`rss/index.php` → `modules/rss/RssUI.php`)
- **Actions:** only `jobOrders`, which is also the default (`RssUI.php:57-67`).
- **Output:** RSS 2.0 containing public, shareable job orders: `<title>`, type, "Located in city, state", and a link to `careers/?p=showJob&ID=` (`:99-156`).
- **Broken entry point:** `rss/index.php` does not include `config.php`, yet uses `LEGACY_ROOT` at `rss/index.php:37`. It fails fatally; see API-012. The module is still reachable through `index.php?m=rss`.
- The careers templates link to `../rss/` or `rss/` (`CareersUI.php:949`, `:953`).

### 3.3 XML job feeds (`xml/index.php` → `modules/xml/XmlUI.php`)
- **Template selection:** `?t=<name>` is matched against `xml_feeds.xml_template_name` in the database (`XmlUI.php:127-148`, `lib/XmlJobExport.php:51-70`). The default is the first row, `indeed`.
- **Seeded rows:** Indeed and SimplyHired (`db/cats_schema.sql:1173-1174`).
- **Template files:** `modules/xml/xml_templates/{indeed,simplyhired,rss}.xtpl`, in a custom `>>section … <<section` format with `$[tag]` placeholders (`lib/XmlJobExport.php:125-203`).
- **Placeholders:** `date`, `siteURL`, `jobTitle`, `jobPostDate`, `jobURL` (adds `&ref=<template>`), `jobOrderID`, `jobID`, `hiringCompany`, `jobCity`, `jobState`, `jobCountry`, `jobZipCode`, `jobDescription`, `notes`, `type` (`XmlUI.php:197-318`). Every value goes through `htmlspecialchars`, including values placed inside `CDATA` in `indeed.xtpl:14-23`, so they are double-encoded.
- **Access logging:** each request is logged to `http_log` (`XmlUI.php:117-120`).
- **Pull only:** `XmlTemplate::submitXMLFeeds()` is just a hook (`lib/XmlJobExport.php:108-111`) and is never called. `xml_feeds.post_url` and `success_string` are never read. The settings page only exposes a `CAREER_PORTAL_SUBMIT_XML_FEEDS` hook (`modules/settings/CareerPortalSettings.tpl:72`).

### 3.4 `wsdl/`
- **Contents:** three WSDL 1.1 RPC/SOAP **client** descriptors, served as static files:
  - `parse.wsdl`: `DocumentParse(key, name, size, mimeType, contents)` at `http://soap.resfly.com/parse.php` (`wsdl/parse.wsdl:78`);
  - `status.wsdl`: `Status(key)` at `http://soap.resfly.com/status.php` (`:69`);
  - `keyCheck.wsdl`: `KeyCheck(key)` at `http://catsone.com/keyCheck.php` (`:66`).
- **Users:** `lib/ParseUtility.php:53`, `:60`, and `:135` use the first two. Nothing references `keyCheck.wsdl`.
- **No SOAP server:** `grep SoapServer` finds nothing. **OpenCATS exposes no SOAP API.** The folder is outbound-client configuration for a dead service (see API-010).

### 3.5 Toolbar (`index.php?m=toolbar` → `modules/toolbar/ToolbarUI.php`)
- **Purpose:** the text/JS protocol for the legacy CATS Firefox toolbar. The version is `TOOLBAR_LIB_VERSION = 32` (`:37`).
- **Actions** (`:57-86`):

| Action | Behaviour |
|---|---|
| `authenticate` | Logs in from `CATSUser` and `CATSPassword` in **GET** (`:95-103`). Requires `LicenseUtility::isProfessional()` (`:114`). Prints `cats_connected = true EVAL=<callback>` (`:133-137`) |
| `getRemoteVersion` | Prints `99999`, meaning obsolete (`:140-145`) |
| `getJavaScriptLib` | Serves `toolbarlibForLegacy.js` (`:148-156`) |
| `checkEmailIsInSystem` | Prints `email:0` or `email:1` (`:158-184`) |
| `storeMonsterResumeText` | Converts posted Monster.com page HTML to text using `html2text`, stores it in the session, and returns an ID (`:186-280`) |
| `getLicenseKey` | Prints `LICENSE_KEY` **without authentication** (`:282-285`) |
| `attemptLogin` | Calls `$this->attemptLogin()`, which is not defined in `ToolbarUI` or `UserInterface` |

- **Authentication** is a normal session login. There are no tokens.

### 3.6 `js/index.php`, `attachments/index.php`
Both are 0-byte files (`wc -c`) that stop directory listing. They are not endpoints. The `attachments/.htaccess` allows direct download of files with document or image extensions (`Require all granted`), which bypasses `AttachmentsUI`. `.htaccess` only takes effect on Apache; the repo's Docker setup uses nginx (`docker/docker-compose.yml`, image `prooph/nginx:www`), so the rules do not apply there (INFERENCE; the nginx configuration is not in the repo).

### 3.7 Other web-reachable scripts
| Script | Behaviour over HTTP | Evidence |
|---|---|---|
| `QueueCLI.php` | Header says "should be called by cron … (not the website)", but there is no SAPI guard. It starts a session, registers tasks (`:78`), `print_r`s module data (`:80`), runs the next task (`:83`), and touches `queue.time` (`:86`) | `QueueCLI.php:27-29`, `:34-101` |
| `rebuild_old_docs.php` | No authentication. Connects to the database, reconverts every attachment with `text IS NULL`, and prints stored filenames | `rebuild_old_docs.php:14`, `:16-50`, `:65` |
| `scripts/makeBackup.php` | Runs `makeBackup()` when `$_SERVER['argv'][1]` is set. Over the web, argv exists only if `register_argc_argv` is on (INFERENCE) | `scripts/makeBackup.php:37-60` |
| `installwizard.php`, `installtest.php` | Installer pages, locked by `INSTALL_BLOCK` | `installwizard.php:85`, `index.php:44` |

---

## 4. Is there a REST / JSON API?

**No.**
- **JSON:** `grep -rn "json_encode|json_decode|application/json"` over non-vendor PHP finds only `lib/DataGrid.php` (serialising grid parameters into URLs, e.g. `:272`, `:301`, `:729`) and `ajax/getDataGridPager.php:44`. No response anywhere is sent as `application/json`.
- **Content types actually emitted:** `text/xml` (`ajax.php:65`, `:96`; `lib/AJAXInterface.php:49`; `RssUI.php:72`, `:111`; `XmlUI.php:77`, `:123`), `text/x-csv` (`ExportUI.php:125`, `DataGrid.php:1463`), `text/x-vCard` (`lib/VCard.php:375`), attachment MIME types (`AttachmentsUI.php:128`), PNG (artichow), and HTML.
- **No other API styles:** there is no `SoapServer`, XML-RPC, or GraphQL; no API keys, bearer tokens, or `Authorization` header handling; and no CORS headers (all greps empty).
- **What exists instead:**
  - **Private UI RPC:** `ajax.php`, bound to the session, with no ACL layer, no versioning, and no documentation.
  - **Public read-only syndication:** RSS and XML feeds of public job orders.
  - **A public HTML form flow:** the careers portal.
  - **File interchange:** CSV/TSV import, candidate CSV export, and vCard 2.1 export.
- **Consequence:** third parties cannot create or read candidates, job orders, pipelines, or activities, except by scraping the HTML UI with a logged-in session.
- **Nascent domain layer:** `src/OpenCATS/Entity/{Company,JobOrder}{,Repository}.php` is a small PSR-4 layer with repository classes. It could serve as the service layer for a future API (see §7).

---

## 5. Integrations

### 5.1 Evaluation matrix
| Integration | Direction / protocol | Format | Authentication | Error handling | Versioning | Rate limit | Docs | Tests | Status |
|---|---|---|---|---|---|---|---|---|---|
| E-mail (PHPMailer 6) | Out: SMTP (`tls` on 587 by default), sendmail, or PHP `mail()` (`config.php:208-225`, `lib/Mailer.php:314-351`) | HTML plus text alternative, UTF-8 | SMTP user and password in `config.php:221-223` | Exceptions enabled but never caught (API-011); successful sends logged to `email_history` (`lib/Mailer.php:363-391`) | composer `phpmailer/phpmailer ^6.5.0` | none | comments in `config.php` | none | Works, but fragile |
| LDAP | Out: `ldap://` on port 389, protocol v3, no StartTLS (`lib/LDAP.php:40-51`, `config.php:266-284`) | LDAP | Service bind DN/password, then user bind | `error_log` only | n/a | none | `config.php` comments | none | Optional (`AUTH_MODE='sql'` by default, `config.php:48`) |
| Resfly résumé parsing | Out: SOAP 1.1 over **HTTP** (`wsdl/parse.wsdl:78`) | SOAP RPC | `LICENSE_KEY` sent in the body (`lib/ParseUtility.php:92`; the key is hard-coded at `config.php:31`) | SoapFault swallowed, returns false (`:94-97`) | none | none | none | none | **Dead**: DNS lookup for `soap.resfly.com` fails (observed). Not gated (API-010) |
| Sphinx full-text search | Out: Sphinx binary protocol to `localhost:3312` (`config.php:97-101`) | Binary | none | Retries 5 times with a 1 s sleep (`lib/Search.php:1890-1900`) | Client command version `0x107` from 2007 (`lib/sphinx/sphinxapi.php:26`) | n/a | `optional-updates/latest-sphinx-search/README.MD` (links to the wiki) | none | Off by default (`ENABLE_SPHINX=false`) |
| ZIP → city/state | Out: HTTP GET to `http://maps.googleapis.com/maps/api/geocode/xml?sensor=false&address=` (`lib/ZipLookup.php:23`) | XML | **No API key** | Raw `simplexml_load_file`; undefined-variable notices on failure (`:55-60`) | none | none | none | Empty stub `ZipLookupTest` | **Non-functional**: Google returns `REQUEST_DENIED` (observed) |
| ZIP radius search | Local `zipcodes` table (`db/upgrade-zipcodes.sql`, 42,847 lines) | SQL | n/a | n/a | n/a | n/a | installer option | none | Optional (`US_ZIPS_ENABLED`, `config.php:262`) |
| New-version check and telemetry | Out: raw socket HTTP **GET** to `www.catsone.com:80/catsnewversion.php`, sending version, UID, PHP version, server software, user agent, **site name, active-user count, license key** (`lib/NewVersionCheck.php:106-123`, `:198-224`) | Custom `{<…>}` text | none | 5 s timeouts | none | once per day | none | none | Disabled by default (`system.disable_version_check=1`, `db/cats_schema.sql:1044`; `modules/install/Schema.php:44`). The response HTML is rendered in the UI (`TemplateUtility.php:176-180`) |
| vCard | Out: download | vCard **2.1** (`lib/VCard.php:54`) | session plus ACL | n/a | 2.1 only | n/a | none | `VCardTest.php` (unit) | Works |
| CSV export | Out: download | CSV with `"` escaping only (`lib/Export.php:161`, `lib/DataGrid.php:1451`); optional BOM (`DataGrid.php:1465-1480`) | session, **no ACL** | n/a | none | none | none | none | Works (API-020) |
| CSV/TSV import | In: upload through the UI | `fgetcsv` with `,` or `\t` (`modules/import/ImportUI.php:620-624`, `:699-703`); candidates, companies, contacts (`lib/*Import.php`) | session, `import.import ≥ EDIT` (`:742`) | Per-import revert (`ImportUI.php:69`) | none | none | in-app help | none | Works |
| Bulk résumé import | In: files dropped into `./upload/` on the server (`ImportUI.php:1300-1327`), then `import:processMassImportItem` | DOC, PDF, RTF, HTML, DOCX, ODT, TXT | session, `import.bulkResumes ≥ SA` (`:2027`) | per-file counts | none | 50 files per call | in-app help | none | Works; ODT extraction broken (5.2) |
| Document-to-text | Local `exec` of antiword, pdftotext, html2text (or unrtf) at paths from `config.php:62-81`, arguments escaped (`lib/DocumentToText.php:101-146`); on Windows through `WScript.Shell` COM (`:352-373`) | text | n/a | return code | none | none | `config.php` comments | none | Depends on the host; **ODT bug** (5.2) |
| Calendar | Internal only; reminder e-mails through the queue | Custom JS string (`Calendar::makeEventString`) | session | n/a | n/a | n/a | none | none | **No iCal, CalDAV, or Outlook/Google sync** (grep for `VCALENDAR` or `text/calendar` finds nothing) |
| Google Maps | Out: link only, `http://maps.google.com/maps?q=` on the company page | URL | none | n/a | n/a | n/a | n/a | n/a | Works (plain link) |
| Job boards (Indeed, SimplyHired) | Out: **pull** feed that the job boards poll (`xml/?t=`) | Custom XML | none | none | none | none | none | none | Indeed format from 2007; SimplyHired target likely obsolete (ASSUMPTION) |
| LinkedIn, Monster, Dice, HRIS | none, apart from toolbar scraping of Monster pages (`ToolbarUI.php:186`) | – | – | – | – | – | – | – | **Absent** |
| Careers portal embedding | Link to `careers/`, or iframe it yourself; there is no widget or JS SDK. `careerportal.js` is for settings and `careersPage.js` for button rollovers (`js/careersPage.js:1-40`) | HTML | none | – | – | – | – | – | No embed API. No `X-Frame-Options` anywhere (grep) |
| Webhooks | none | – | – | – | – | – | – | – | **Absent** |
| Hooks (internal extension API) | In-process `eval` | PHP source strings | – | – | – | – | none | none | 232 hook names across 278 call sites; only `SettingsUI::defineHooks()` implements any (3) (API-017) |
| Async queue | Cron → `php QueueCLI.php` | DB table `queue` | none | `queue.error` flag; cleanup job | none | – | Header comment only (`QueueCLI.php:27-29`) | none | Needs cron (API-018) |
| Sphinx maintenance scripts | `scripts/sphinx_{reindex,rotate,update_delta,restart}.sh`; hard-coded `/usr/local/www/catsone.com/...` defaults | shell | – | – | – | – | – | – | For the vendor's hosted environment (ASSUMPTION) |

### 5.2 Integration details (FACT unless labelled otherwise)

**E-mail: triggering events.** Every direct `Mailer` call site found by `grep "new Mailer|sendToOne|->send(|sendEmail("`:

| Event | Code path | Subject / template |
|---|---|---|
| Candidate, contact, company, or job-order ownership change | `lib/Candidates.php:341-351`, `lib/Contacts.php:279-290`, `lib/Companies.php:192-200`, `lib/JobOrders.php:250-258` | `'CATS Notification: … Ownership Change'`; templates `EMAIL_TEMPLATE_OWNERSHIPASSIGN{CANDIDATE,CONTACT,CLIENT,JOBORDER}` (`CandidatesUI.php:1128`, `ContactsUI.php:629`, `CompaniesUI.php:635`, `JobOrdersUI.php:840`) |
| Pipeline status change, e-mail to the candidate | `lib/Pipelines.php:367-377` | `CANDIDATE_STATUSCHANGE_SUBJECT` (`config.php:166`); `EMAIL_TEMPLATE_STATUSCHANGE` (`CandidatesUI.php:1704`, `JobOrdersUI.php:1472`). Per-status opt-in is stored as a PHP-`serialize`d setting (`lib/Mailer.php` MailerSettings; `SettingsUI.php:2010`) |
| Careers application: confirmation to the applicant, notification to owner and recruiter | `lib/CareerPortal.php:452-470` via `CareersUI.php:1518`, `:1585`, `:1595` | `EMAIL_TEMPLATE_CANDIDATEAPPLY`, `EMAIL_TEMPLATE_CANDIDATEPORTALNEW` |
| Calendar event reminders | `modules/calendar/tasks/Reminders.php:93` → `lib/Calendar.php:945-966` | `'CATS Event Reminder: '` plus `$GLOBALS['eventReminderEmail']` (`config.php:228-242`) |
| Mass e-mail to candidates | `modules/candidates/CandidatesUI.php:3305-3370` | user-written |
| Test e-mail | `ajax/testEmailSettings.php:88` | `'CATS Test E-Mail'` |
| Forgot password | `modules/login/LoginUI.php:448-461` | Calls `Users::getPassword()` and uses `PASSWORD_RESET_SUBJECT`/`_BODY`. **None of these are defined anywhere** (grep), so the flow cannot work (API-011) |

Template placeholders are `%DATETIME% %SITENAME% %USERFULLNAME% %USERMAIL%` (`lib/EmailTemplates.php`, `replaceVariables`), plus careers-specific `%CAND*%` and `%JBOD*%` placeholders (`CareersUI.php:1489-1512`).

**LDAP (`lib/LDAP.php`).**
- Enabled when `AUTH_MODE` is `ldap` or `sql+ldap` (`lib/Users.php:35`, `:823-835`).
- The filter is built as `LDAP_ATTRIBUTE_UID . '=' . $username` with no `ldap_escape` (`lib/LDAP.php:68`, `:111-112`, `:130`).
- The connection uses plain `ldap_connect(LDAP_HOST, LDAP_PORT)` with no `ldap_start_tls` (`:40-51`).
- The shipped defaults point at the public test server `ldap.forumsys.com` (`config.php:266`).
- Unknown LDAP users are auto-provisioned as disabled accounts (`lib/Users.php:846-850`).
- Empty passwords are rejected before bind (`lib/Users.php:792-795`), which prevents anonymous-bind bypass.

**Resfly (`lib/ParseUtility.php`, `lib/License.php:687-730`).** See API-010.
- Call sites: careers `resumeParse` (`CareersUI.php:524-528`); add-candidate `parseDocument` (`CandidatesUI.php:1005-1008`); mass import (`ImportUI.php:1373-1416`). UI toggles also depend on it (`MassImportStep*.tpl`, `candidates/Add.tpl`).
- ASSUMPTION (external knowledge, backed by the failed DNS lookup): Resfly was Cognizo/CATS's hosted parsing service and was shut down years ago.

**Sphinx.** The client is `lib/sphinx/sphinxapi.php` (2007, `$Id … 2394 2007-04-27`), used only by `lib/Search.php:1866-1900` for résumé keyword search and filtered by `site_id`.
- ASSUMPTION: current Sphinx 3.x or Manticore may still accept command version `0x107`, but this is untested. `optional-updates/latest-sphinx-search/` ships a newer `Search.php` and `sphinx.conf`.

**DocumentToText bug.** In the ODT branch, `convert($fileName, …)` calls `$this->odt2text($filename)`, a lower-case variable that is undefined (`lib/DocumentToText.php:72` vs `:166`). ODT text extraction therefore always fails. This affects résumé indexing, careers uploads, and mass import.

**Queue and cron.**
- `QueueCLI.php` calls `ModuleUtility::registerModuleTasks()`, which includes every `modules/*/tasks/tasks.php` (`lib/ModuleUtility.php:86-101`).
- Registered recurring tasks:
  - `CleanExceptions`: daily at 03:xx, deletes `exceptions` rows older than `EXCEPTIONS_TTL_DAYS` (`modules/queue/tasks/tasks.php:39`, `CleanExceptions.php:53`, `:56-76`);
  - `Reminders`: every minute (`modules/calendar/tasks/tasks.php:39`, `Reminders.php:47`).
- One-off tasks can be queued through `QueueProcessor::addAsynchronousTask()` (`lib/QueueProcessor.php:278`), but no production code calls it (only `SampleTask.php:43` does).
- `modules/queue/tasks.php:41` registers `'CleanExceptions'` without a path and is never included (dead duplicate).
- `SystemUtility::isSchedulerEnabled()` reports the scheduler as live only if `queue.time` is less than 5 minutes old (`lib/QueueProcessor.php:493-523`). The UI offers event reminders only in that case (`CandidatesUI.php:1747`, `ContactsUI.php:1110`, `JobOrdersUI.php:1508`).
- The cron line `* * * * * php /path/QueueCLI.php` is **not documented** in README or elsewhere (grep for `cron` finds only `CHANGELOG.MD:510` and code comments).

---

## 6. Detailed findings

### API-001: No REST/JSON API. The only machine interface is a session-bound XML/HTML RPC
- **Severity:** HIGH
- **Finding:** There is no documented, versioned, or authenticated-by-credential interface for any domain object: candidates, companies, contacts, job orders, pipelines (`candidate_joborder`), activities, attachments, saved lists, calendar events, or users. `ajax.php` is a private UI RPC. It returns XML or HTML fragments, uses the browser session, and has no ACL layer. The only server-to-server outputs are the RSS/XML job feeds.
- **Evidence:** §4 grep results. `lib/AJAXInterface.php:196-261` (session-only authentication). `ajax.php:77-92` (RPC routing by `f`). The table in §2.4 shows 6 handlers returning HTML fragments, for example `ajax/getPipelineJobOrder.php:184-330` and `ajax/getDataGridPager.php:60-61`.
- **Impact:** No integrations with HRIS, job boards, calendars, e-mail, or BI are possible without HTML scraping. Automation and mobile clients are blocked. Any change to the UI breaks the "API" because the two are the same thing.
- **Recommendation:** Build `/api/v1` as described in §7, on top of the existing `lib/*` business classes (`Candidates`, `JobOrders`, `Pipelines`, `ActivityEntries`, `Attachments`, `SavedLists`, `Calendar`) or the `src/OpenCATS/Entity/*Repository` layer. Do not reuse `ajax.php`.

### API-002: Careers "apply" trusts a client-supplied `candidateID`, allowing unauthenticated overwrite of any candidate
- **Severity:** CRITICAL
- **Finding:**
  - The public application form round-trips `candidateID` in a hidden field (`CareersUI.php:699`, `:710`).
  - On submit, the value is read directly from POST: `$candidateID = isset($_POST['candidateID']) ? intval($_POST['candidateID']) : -1;` (`:725`). It is passed to `onApplyToJobOrder($siteID, $candidateID)` (`:750`).
  - Inside, `if ($candidateID !== false)` runs `$candidates->update($candidateID, …)` with the attacker's name, e-mail, phones, address, key skills, source, and EEO fields, and sets the owner to the automated user (`:1279-1293`).
  - It then attaches the uploaded file, adds the candidate to the pipeline, and writes an activity (`:1349-1470`).
  - There is no check that the submitter is that candidate, and this path does not depend on `candidateRegistration` being enabled.
- **Evidence:** `modules/careers/CareersUI.php:725`, `:750`, `:1190`, `:1279-1293`. `lib/Candidates.php:249-254` (update signature; scoped only by `site_id`).
- **Impact:** Anyone on the internet can take a public job ID and iterate `candidateID=1..N`. Each request overwrites the PII of existing candidates, reassigns their ownership, and plants résumés. This destroys data integrity and is a GDPR-relevant integrity breach. It needs only an enabled portal and one public job order.
- **Recommendation:** Never accept a candidate identity from the client. Remove `candidateID` from `CareersUI.php:699`/`:710` and `:725`. Derive the identity only from a server-side verified session, set after e-mail verification (a magic link). Until a redesign, always create a new candidate or a `candidate_duplicates` link (the table exists) rather than updating an existing record. Add a Behat scenario that posts a foreign `candidateID` and checks that no update happens.

### API-003: The careers returning-candidate update passes misaligned arguments to `Candidates::update()`
- **Severity:** HIGH
- **Finding:** The signature is `update($candidateID, $isActive, $firstName, $middleName, $lastName, $email1, $email2, $phoneHome, $phoneCell, $phoneWork, $address, $city, $state, $zip, $source, $keySkills, $dateAvailable, $currentEmployer, $canRelocate, $currentPay, $desiredPay, $notes, $webSite, $bestTimeToCall, $owner, $isHot, $email, $emailAddress, $gender, $race, $veteran, $disability)` (`lib/Candidates.php:249-254`). `CareersUI.php:1284-1290` passes `…, $candidate['notes'], '', $bestTimeToCall, $automatedUser['userID'], $automatedUser['userID'], $gender, $race, $veteran, $disability`. As a result:
  - `isHot` receives a user ID (truthy), so the candidate is flagged hot;
  - the e-mail body (`$email`) receives the gender value;
  - `$emailAddress` receives the race value;
  - `gender` and `race` receive the veteran and disability values, and `veteran` and `disability` fall back to `''`.
  - Because `$emailAddress` is not empty, `Candidates::update` sends "CATS Notification: Candidate Ownership Change" to the address `<race value>` (`lib/Candidates.php:341-351`).
- The registered-profile path (`CareersUI.php:298-332`) passes `$email1, $email1` in the `$email`/`$emailAddress` slots. Every profile update therefore mails the candidate an "Ownership Change" notice whose body is their own address.
- **Evidence:** as cited. INFERENCE: with `new PHPMailer(true)` (`lib/Mailer.php:76`), `AddAddress('<race id>')` throws an uncaught exception, so the applicant sees a fatal error after the database was already modified.
- **Impact:** EEO compliance data is silently corrupted, owner and hot flags are wrong, spurious mail is sent, and applications fail part-way.
- **Recommendation:** Replace positional calls with a DTO or named array, or with PHP 8 named arguments. At minimum, fix `CareersUI.php:1284-1290` and `:298-332` to pass `''` for `$email`/`$emailAddress` and the EEO values in their correct positions. Add a unit test that asserts the SQL column mapping.

### API-004: Careers "registered candidate" login is a forgeable knowledge-based cookie that can edit profiles and delete arbitrary attachments
- **Severity:** HIGH
- **Finding:**
  - The portal identifies a returning candidate by matching the `<input-*>` fields of the registration template against `candidate` columns. For the default `CATS 2.0` template those are `email`, `lastName`, and `zip` (`db/cats_schema.sql:440`). The values come from POST, or from a client-side cookie `cats<siteID>cw` in the format `"field"="value"` (`CareersUI.php:1635-1735`, `:1737-1763`).
  - No secret is involved. Anyone who knows a candidate's e-mail, last name, and ZIP can forge the cookie.
  - `onRegisteredCandidateProfile` then updates the profile (`:259-332`) and deletes `$_GET['attachmentID']` (`:291`, `:340`). `Attachments::delete()` scopes only by `site_id`, not by candidate (`lib/Attachments.php:304-335`). The "candidate" can therefore delete **any** attachment on the site, including other candidates' résumés, company documents, and `catsbackup` records.
- **Evidence:** as cited. The feature is off by default (`candidateRegistration => '0'`, `lib/CareerPortal.php:79`).
- **Impact:** Account takeover of candidate profiles, and unauthenticated deletion of any file once registration is enabled.
- **Recommendation:** Replace the scheme with e-mail magic-link verification and a server-side session. Scope attachment replacement to `data_item_type=100 AND data_item_id=<verified candidate>`. Never accept `attachmentID` from the client.

### API-005: State-changing endpoints have no access-level checks
- **Severity:** HIGH
- **Finding:** `SecureAJAXInterface` only checks that the user is logged in (`lib/AJAXInterface.php:210-216`). The following handlers mutate data without checking any ACL:

| Endpoint | Operation | Evidence |
|---|---|---|
| `deleteActivity` | Delete | `ajax/deleteActivity.php:33-47` |
| `editActivity` | Update | `ajax/editActivity.php:113` |
| `lists:deleteList`, `lists:newList`, `lists:editListName`, `lists:addToLists` | Create, rename, delete, add items | `modules/lists/ajax/*.php` |
| `testEmailSettings` | Send mail with an arbitrary `From` | `ajax/testEmailSettings.php:86-93` |
| `setColumnWidth` | Persistent preference write | `ajax/setColumnWidth.php:46` |
| `import:processMassImportItem` | Create attachments | `modules/import/ajax/processMassImportItem.php:62-65` |

  In the page UI, the same operations are gated. For example, the delete-activity link is shown only when `contacts.deleteActivity ≥ EDIT` (`modules/contacts/Show.tpl:287`) or `candidates.delete ≥ DELETE` (`modules/candidates/Show.tpl:611`). `m=settings&a=ajax_tags_add/del/upd` likewise has no ACL (`SettingsUI.php:675-700`, `:130-192`), while the `tags` page requires SA (`:234`).
- **Evidence:** `lib/AJAXInterface.php:210-216`; `ajax/deleteActivity.php:33-47`; `ajax/editActivity.php:36`, `:113`; `modules/lists/ajax/deleteList.php:36-51`; `ajax/testEmailSettings.php:33`, `:86-93`; `modules/settings/SettingsUI.php:130-192` vs `:234`; UI gating at `modules/contacts/Show.tpl:287` and `modules/candidates/Show.tpl:611`.
- **Impact:** A READ-only or "sourcer" user can delete activity history, lists, and tags, and can send mail as anyone through the configured SMTP relay. The ACL model is enforced only in the presentation layer.
- **Recommendation:** Add a declarative `requireAccess('<secobj>', ACCESS_LEVEL_*)` to `SecureAJAXInterface`, mirroring `UserInterface::getUserAccessLevel()`. Map each handler to the secured object its page counterpart uses (e.g. `deleteActivity` → `activity.delete` at DELETE). In the future API, turn these mappings into scopes (§7).

### API-006: No CSRF protection; GET accepted for mutations; no SameSite session cookie
- **Severity:** HIGH
- **Finding:**
  - A grep for `csrf|xsrf|nonce|form_token` over PHP, JS, and templates returns nothing.
  - `ajax.php` dispatches on `$_REQUEST` (`:63`, `:77`), and handlers read `$_REQUEST`. `GET ajax.php?f=deleteActivity&activityID=123` therefore works from an `<img>` tag on another site.
  - The PHP session cookie `CATS` (`config.php:151`) is created by `session_start()` with default parameters. A grep for `session_set_cookie_params` finds nothing.
  - `lib/Session.php:893-902` defines `$samesite = 'Strict'` but never uses it, and sets a different cookie, `session_cookie`, with `setcookie(...)` without an options array.
- **Evidence:** `ajax.php:63`, `:77`; `grep -rni "csrf|xsrf|nonce|form_token"` returns nothing; `lib/Session.php:893-902` (`$samesite` defined, never passed to `setcookie`); `config.php:151`; `js/lib.js:332-335`.
- **Impact:** Any page a logged-in recruiter visits can delete data or send mail through the endpoints in API-005. The same applies to all `index.php` POST forms, which are outside this document's scope.
- **Recommendation:** Require POST for all state-changing `ajax.php` calls. Add a per-session CSRF token that `AJAX_callCATSFunction` sends (`js/lib.js:397-418`) and `SecureAJAXInterface` verifies. Call `session_set_cookie_params(['samesite'=>'Lax','httponly'=>true,'secure'=>SSL_ENABLED])` before every `session_start()` (`index.php:75`, `lib/AJAXInterface.php:207`, `QueueCLI.php:56`). Stop printing `session_id()` into pages (`getCookie()` usages).

### API-007: `getDataGridPager` / `DataGrid::get()` allows path-traversal include and arbitrary class instantiation
- **Severity:** HIGH (authenticated)
- **Finding:** `ajax/getDataGridPager.php:43-58` passes `$_REQUEST['i']` to `DataGrid::get()`. That method splits the value on `:` and "sanitises" each part with `preg_replace("[^A-Za-z0-9]", "", …)` (`lib/DataGrid.php:265-266`). Without delimiters PHP treats `[`…`]` as the delimiters, so the pattern `^A-Za-z0-9` only strips that literal prefix. The call to `preg_replace("[^A-Za-z0-9]", "", "../../tmp/x")` returned `"../../tmp/x"` when executed. The result reaches `include_once(sprintf('modules/%s/dataGrids.php', $module))` (`:275-280`) and `new $class($siteID, $parameters, $misc)` (`:282`). The same code backs `m=export&a=exportByDataGrid` (`modules/export/ExportUI.php:135-140`, `DataGrid::getFromRequest` `:295-303`).
- **Evidence:** `ajax/getDataGridPager.php:43-58`; `lib/DataGrid.php:265-266` (`preg_replace("[^A-Za-z0-9]", "", …)`), `:275-282`, `:295-303`; `modules/export/ExportUI.php:135-140`; PHP 8.4 execution returned `"../../tmp/x"` unchanged.
- **Impact:** Any logged-in user can include any file named `dataGrids.php` reachable by a relative path, and can instantiate any declared class with attacker-shaped constructor arguments. Whether this becomes remote code execution depends on being able to plant a file with that name, which is UNKNOWN.
- **Recommendation:** Fix the regex to `'/[^A-Za-z0-9]/'`. Better, keep a whitelist map of datagrid identifiers to classes, and check `is_subclass_of($class, 'DataGrid')` before instantiating.

### API-008: Unauthenticated maintenance and operations endpoints
- **Severity:** MEDIUM
- **Finding:**
  - `ajax.php?f=install:maint` has no authentication. It deletes `modules.cache` and runs `index.php` in maintenance mode, which executes pending module-schema SQL and `PHP:` blocks one step at a time (`modules/install/ajax/maint.php:30-37`; `lib/ModuleUtility.php:517-546`).
  - `install:attachmentsReindex` checks authentication only when `INSTALL_BLOCK` exists (`modules/install/ajax/attachmentsReindex.php:32-35`, `:52`).
  - `QueueCLI.php` has no SAPI guard (`:34-101`); a GET request runs queued tasks, including reminder e-mails, and prints module data.
  - `rebuild_old_docs.php` reconverts every unindexed attachment and prints stored filenames with no authentication (`:14-65`).
  - `install:ui` rewrites `config.php` from request data whenever `INSTALL_BLOCK` is absent (`modules/install/ajax/ui.php:55`, `:120`). This is by design, but it becomes remote code execution on any deployment where the file is missing (INFERENCE).
- **Evidence:** `modules/install/ajax/maint.php:30-37`; `lib/ModuleUtility.php:517-546`; `modules/install/ajax/attachmentsReindex.php:32-35`, `:52`, `:95`; `QueueCLI.php:27-29`, `:34-101`; `rebuild_old_docs.php:14-65`; `modules/install/ajax/ui.php:55`, `:120`.
- **Impact:** Anonymous users can trigger schema migrations and CPU-heavy conversion jobs, disclose internal filenames, and fire the task queue.
- **Recommendation:** Add a `PHP_SAPI !== 'cli'` guard to `QueueCLI.php`, `rebuild_old_docs.php`, and `scripts/*.php`, or move them out of the web root. Require a ROOT session for `install:maint` and `install:attachmentsReindex` once `INSTALL_BLOCK` exists. Ship web-server rules (Apache and nginx) that deny `/scripts/`, `/QueueCLI.php`, `/rebuild_old_docs.php`, and `/modules/*/ajax/` direct hits.

### API-009: Toolbar API: unauthenticated license disclosure, credentials in the URL, broken actions, dead client
- **Severity:** MEDIUM
- **Finding:**
  - `index.php?m=toolbar&a=getLicenseKey` prints `LICENSE_KEY` to anyone (`modules/toolbar/ToolbarUI.php:83-85`, `:282-285`). The module does not require authentication (`:46`), and the key is committed in `config.php:31`.
  - Toolbar login takes `CATSUser` and `CATSPassword` from **GET** (`:95-103`), so credentials end up in access logs and proxies. It also allows login CSRF.
  - `case 'attemptLogin'` calls a method that does not exist (`:59-61`).
  - `install.tpl` exists, but no `install` action is handled.
  - ASSUMPTION (external knowledge): the client is a legacy XUL Firefox extension, and those stopped working with Firefox 57 in 2017. `storeMonsterResumeText` (`:186-280`) scrapes Monster.com page markup from that era.
- **Evidence:** `modules/toolbar/ToolbarUI.php:46`, `:59-61`, `:83-85`, `:95-103`, `:114`, `:282-285`; `config.php:31`.
- **Impact:** Credential exposure and a dead attack surface.
- **Recommendation:** Remove `modules/toolbar/` entirely, or at least `getLicenseKey`, GET-based login, and `attemptLogin`. If a browser capture tool is needed, rebuild it on the §7 API with OAuth2 PKCE.

### API-010: Resfly SOAP parsing is dead yet effectively always "enabled"; plaintext PII transfer; crash without ext-soap
- **Severity:** HIGH
- **Finding:**
  - `LicenseUtility::isParsingEnabled()` returns `true` on every branch. If SOAP is missing it returns `true`, if the status is `true` it returns `true`, if the quota is exhausted it returns `true`, and it finally returns `true` (`lib/License.php:687-706`).
  - `PARSING_ENABLED=false` (`config.php:51`) only makes `getParsingStatus()` skip the status call (`:708-727`); it does not disable parsing.
  - Callers then run `new ParseUtility()` and `documentParse()`, which does `new SoapClient('wsdl/parse.wsdl')` (`lib/ParseUtility.php:53`, `:60`, `:87`) and sends `LICENSE_KEY` plus the full résumé text over **plain HTTP** to `soap.resfly.com` (`wsdl/parse.wsdl:78`, `ParseUtility.php:92`).
  - The public careers `resumeParse` sub-action reaches this path (`CareersUI.php:521-528`), as do add-candidate (`CandidatesUI.php:1005-1008`) and mass import (`ImportUI.php:1373-1416`).
  - Observed: `soap.resfly.com` does not resolve.
  - INFERENCE: with ext-soap loaded, the DNS failure raises a `SoapFault` that is caught (`ParseUtility.php:94-97`), and parsing silently returns false. Without ext-soap, `new SoapClient` is a fatal "Class not found", so careers résumé parse, add-candidate parse, and mass import all crash.
- **Evidence:** `lib/License.php:687-706`, `:708-727`; `config.php:51`; `lib/ParseUtility.php:53`, `:60`, `:87-97`; `wsdl/parse.wsdl:78`; `modules/careers/CareersUI.php:521-528`; `modules/candidates/CandidatesUI.php:1005-1008`; `modules/import/ImportUI.php:1373-1416`; DNS probe of `soap.resfly.com` failed.
- **Impact:** Broken features that the UI advertises as working (`MassImportStep3.tpl:9` shows "Parsed and Ready to Import"); an attempted leak of candidate PII and the license key over cleartext if the hostname is ever re-registered by a third party; crashes on hosts without SOAP.
- **Recommendation:** Make `isParsingEnabled()` return `PARSING_ENABLED && CATSUtility::isSOAPEnabled()`, which fixes it immediately. Delete `wsdl/`, `lib/ParseUtility.php`, and `LICENSE_KEY` usage. Put a `ResumeParser` interface behind the §7 design, with pluggable adapters (a local heuristic parser, or a modern HTTPS/JSON vendor configured with a secret, never a committed key).

### API-011: Mailer reliability defects and a non-existent forgot-password implementation
- **Severity:** HIGH
- **Finding:**
  1. `new PHPMailer(true)` enables exceptions (`lib/Mailer.php:76`), but `send()` wraps `AddAddress`/`Send` (`:234`, `:241`) in no `try/catch`. Any SMTP failure or invalid address throws an uncaught exception. This happens mid-request after database writes, for example in `Pipelines::setStatus` (`lib/Pipelines.php:340-377`) and in careers apply. The `if (!Send())` failure path (`:241-247`) is unreachable in exception mode (INFERENCE from PHPMailer 6 semantics).
  2. `MAILER_MODE_DISABLED` is a no-op `case` (`lib/Mailer.php:316-317`), so PHPMailer keeps its default `mail()` transport (INFERENCE from PHPMailer defaults). Only template-driven senders honour `MAIL_MAILER == 0` (`lib/EmailTemplates.php:352-356`). Calendar reminders (`Reminders.php:93`) and `testEmailSettings` still send.
  3. `SetLanguage('en', './lib/phpmailer/language/')` points at a directory that does not exist (`:85`; `ls lib/phpmailer` fails).
  4. `LoginUI::onForgotPassword()` calls `Users::getPassword()` and uses the constants `PASSWORD_RESET_SUBJECT`/`BODY` (`modules/login/LoginUI.php:455-461`). None of these is defined anywhere, so the flow cannot work. The design, e-mailing the stored password, would also be impossible with `md5` hashes (`lib/Users.php:840`).
  5. `Mailer::__construct` reads `$_SESSION['CATS']->getUserID()` when `$userID == -1` (`:96`). This couples library code to the web session. The CLI queue works around it by passing `0` (`lib/Calendar.php:952`).
- **Evidence:** `lib/Mailer.php:76`, `:85`, `:96`, `:234`, `:241-247`, `:316-317`; `lib/EmailTemplates.php:352-356`; `modules/calendar/tasks/Reminders.php:93`; `modules/login/LoginUI.php:455-461`; grep finds no `function getPassword` in `lib/Users.php` and no `PASSWORD_RESET_*` definition.
- **Impact:** User actions fail with 500 errors after partial writes; mail is sent even when the admin disabled it; there is no password recovery.
- **Recommendation:**
  - Catch `PHPMailer\PHPMailer\Exception` in `Mailer::send()` and turn it into `_errorMessage`.
  - Honour `MAIL_MAILER == 0` inside `Mailer::send()`.
  - Move sending to the queue (`QueueProcessor::addAsynchronousTask`) with retry.
  - Replace forgot-password with a time-limited, hashed reset token.
  - Log failures to `email_history` with a status column.

### API-012: Job syndication feeds are broken, leaky, and ignore portal settings
- **Severity:** MEDIUM
- **Finding:**
  - (a) `rss/index.php` never includes `config.php` but uses `LEGACY_ROOT` (`rss/index.php:36-38`). Compare `careers/index.php:37` and `xml/index.php:37`, which do include it. The documented feed URL `/rss/`, linked from careers templates (`CareersUI.php:949`, `:953`), therefore fails fatally: PHP 8 throws `Undefined constant`, as reproduced; PHP 7.2 warns and then hits a fatal "Class CATSUtility not found" (INFERENCE).
  - (b) RSS writes `title`, city, and state into XML unescaped (`modules/rss/RssUI.php:140-150`), so a job title containing `&` produces invalid XML.
  - (c) Neither RSS nor XML checks the career portal's `enabled` flag, although careers does (`CareersUI.php:98-103`). RSS also ignores `allowBrowse` (`XmlUI.php:190` checks it). Public jobs are therefore syndicated even when the admin disabled the portal, which is off by default.
  - (d) `hiringCompany` is hard-coded to `'CATS (www.catsone.com)'` (`XmlUI.php:255-261`), `jobCountry` to `"US"` (`:280-286`), and `jobZipCode` to `''` (`:288-294`). Job boards therefore receive the wrong employer name.
  - (e) The `notes` tag exposes internal job-order notes if an admin adds it to a template (`XmlUI.php:304-310`).
  - (f) `rss.xtpl` cannot be selected because `?t=` is matched only against database rows (`XmlUI.php:129-140`) and only `indeed` and `simplyhired` are seeded (`db/cats_schema.sql:1173-1174`).
  - (g) Push submission is an unimplemented stub (`lib/XmlJobExport.php:108-111`).
  - (h) Links are built from the client-controlled `Host` header (`lib/CATSUtility.php:233`), which allows cache poisoning of feed URLs.
  - (i) The feeds are single-site only (`getFirstSiteID()`, `XmlUI.php:105-107`, `RssUI.php:101-103`).
  - ASSUMPTION (external knowledge): SimplyHired's 2007-era XML intake (`post_url http://www.simplyhired.com/confirmation.php`) is obsolete, and Indeed's current XML feed specification requires fields this template lacks (e.g. `jobtype`, `salary`, `email`).
- **Evidence:** `rss/index.php:36-38` vs `careers/index.php:37` and `xml/index.php:37`; `modules/rss/RssUI.php:99-156`; `modules/xml/XmlUI.php:105-120`, `:129-148`, `:190`, `:255-310`; `modules/careers/CareersUI.php:98-103`, `:949-953`; `lib/XmlJobExport.php:108-111`; `lib/CATSUtility.php:233`; `db/cats_schema.sql:1173-1174`.
- **Impact:** Postings are missing or wrong on job boards, and feeds can leak data when the portal is "disabled".
- **Recommendation:** Fix `rss/index.php` by adding `include_once('config.php')`. Route every value through a single XML-escaping helper and drop `htmlspecialchars` inside CDATA. Gate both feeds on `enabled`. Map the company from `joborder.company_id`, and country and zip from the job order. Replace the feed layer with a `/api/v1/public/jobs` resource (JSON) and schema.org `JobPosting` JSON-LD on `p=showJob` (which Google for Jobs consumes), and keep an Indeed XML adapter generated from the same model.

### API-013: ZIP lookup is an unauthenticated outbound proxy to a keyless Google API that no longer answers
- **Severity:** MEDIUM
- **Finding:**
  - `ajax.php?f=zipLookup` uses the unauthenticated `AJAXInterface` (`ajax/zipLookup.php:9`) and calls `simplexml_load_file('http://maps.googleapis.com/maps/api/geocode/xml?sensor=false&address=' . $zip)`. There is no URL-encoding and no API key (`lib/ZipLookup.php:23-26`).
  - Observed: the endpoint returns `REQUEST_DENIED: You must use an API key`.
  - On failure the code reads the undefined `$loc_level_*` variables (`:55-60`), so notices corrupt the XML response when `display_errors` is on.
- **Evidence:** `ajax/zipLookup.php:9-38`; `lib/ZipLookup.php:23-26`, `:55-60`; observed `REQUEST_DENIED` response.
- **Impact:** City/state autofill in the Add/Edit forms for candidates, companies, and contacts silently does nothing. Anonymous users can make the server issue outbound requests.
- **Recommendation:** Require `SecureAJAXInterface`. Use the local `zipcodes` table first, since it is already shipped (`db/upgrade-zipcodes.sql`). Put any external geocoder behind a configurable adapter over HTTPS with a key from the environment.

### API-014: No rate limiting or abuse controls on public endpoints
- **Severity:** MEDIUM
- **Finding:**
  - A grep for `rate.?limit|throttl|brute|lockout|captcha` finds only an unused CAPTCHA image renderer (`lib/GraphGenerator.php:432-445`, reachable at `m=graphs&a=wordVerify`, `GraphsUI.php:591-610`). The careers apply flow never uses it.
  - Careers `onApplyToJobOrder` creates candidates, attachments, pipelines, and activities, and sends e-mail to the **applicant-supplied** address (`CareersUI.php:1518-1523`). An attacker can therefore use it to send the confirmation template to arbitrary recipients.
  - Public graphs render images of any size up to 2000×1200 (`GraphsUI.php:53-66`).
  - Toolbar and login `processLogin` have no attempt throttling.
- **Evidence:** `modules/careers/CareersUI.php:1190-1600` (no throttle or CAPTCHA), `:1518-1523`; `modules/graphs/GraphsUI.php:53-66`, `:78-99`; `lib/GraphGenerator.php:432-445` (unused CAPTCHA); `modules/toolbar/ToolbarUI.php:95-103`; empty greps for rate limiting.
- **Impact:** Spam relay, database pollution, CPU exhaustion, and credential stuffing.
- **Recommendation:** Add per-IP token buckets (APCu or database) around `careers onApplyToJobOrder`, `m=login`, `m=toolbar`, `m=graphs`, and `ajax.php`. Add a CAPTCHA or proof-of-work to apply. Send confirmation mail only after double opt-in. In the future API, return `429` with `Retry-After`.

### API-015: Inconsistent and unsafe AJAX response contract
- **Severity:** MEDIUM
- **Finding:**
  - Error responses come in three shapes: XML `errorcode`/`errormessage` (`lib/AJAXInterface.php:61-69`), bare text through `die()` (`ajax/editActivity.php:77`; `getCandidateIdBy{Email,Phone}.php:36`, where the phone handler says "Invalid E-Mail address."), and HTML.
  - Values are interpolated into XML without escaping in `getCompanyContacts.php:64-66`, `getCompanyLocation.php:60-63`, `getCandidateIdByEmail.php:63`, `getParsedAddress.php:136-155`, and the error message itself (`AJAXInterface.php:66`). Other handlers use `htmlspecialchars` (`getDataItemJobOrders.php:95-97`) or `rawurlencode` (`getCompanyNames.php:81`).
  - Error codes are magic numbers (`-1`, `-2`).
  - There is no version, schema, or content negotiation.
  - The client detects errors by sniffing for PHP's HTML error text (`js/lib.js:443-446`).
  - The dispatcher strips leading whitespace from every line of every buffered response (`ajax.php:122`), which mangles `<pre>` and textarea content unless the caller sets `nospacefilter`.
- **Evidence:** `lib/AJAXInterface.php:61-69`; `ajax/editActivity.php:77`; `ajax/getCandidateIdByPhone.php:36`; `ajax/getCompanyContacts.php:64-66`; `ajax/getParsedAddress.php:136-155`; `ajax.php:122`; `js/lib.js:443-446`.
- **Impact:** Company or contact names containing `&` or `<` break the UI (XML parse errors) and allow XML/HTML injection into the DOM. Correct third-party consumption is impossible.
- **Recommendation:** Freeze the legacy contract as-is for the UI, but centralise escaping in a helper (`AJAXInterface::xmlElement($name, $value)`), and use it in all 22 XML handlers. New endpoints should use JSON with RFC 9457 `application/problem+json` errors.

### API-016: No API credentials or SSO; LDAP is the only external identity provider, and it is weak
- **Severity:** MEDIUM
- **Finding:**
  - There are no API keys, personal access tokens, or OAuth2 clients, and no SAML or OIDC: greps for `oauth|saml|openid|bearer|api[_-]?key` are empty.
  - Authentication modes are `sql`, `ldap`, and `sql+ldap` (`config.php:48`, `lib/Users.php:823-845`). Local passwords are unsalted `md5` (`lib/Users.php:840`).
  - LDAP builds its search filter without `ldap_escape` (`lib/LDAP.php:68`, `:112`, `:130`) and connects without TLS (`:40-51`).
- **Evidence:** `config.php:48`, `:264-284`; `lib/Users.php:823-845`, `:840`; `lib/LDAP.php:40-51`, `:68`, `:112`, `:130`; empty greps for `oauth|saml|openid|bearer|api[_-]?key`.
- **Impact:** Integrations must share a human's password. There is no central identity, MFA, or de-provisioning. LDAP credentials cross the network in cleartext.
- **Recommendation:**
  - Add OIDC login (Authorization Code with PKCE) as a new `AUTH_MODE`, and map IdP groups to `ACCESS_LEVEL_*` and user categories.
  - Add hashed, revocable personal access tokens and OAuth2 client-credentials for server-to-server use (§7).
  - For LDAP, apply `ldap_escape($username, '', LDAP_ESCAPE_FILTER)`, add `ldap_start_tls()` or `ldaps://`, and move settings from `config.php` to environment variables.

### API-017: No webhooks or outbound events; the extension API is `eval` of session-stored PHP
- **Severity:** MEDIUM
- **Finding:**
  - There are no webhooks or outbound event notifications (grep for `webhook` is empty).
  - The internal extension mechanism, `Hooks::get($name)`, returns concatenated PHP source strings taken from `$_SESSION['hooks']` for callers to `eval` (`lib/Hooks.php:52-72`).
  - The session copy is filled from every module's `getHooks()` on module scan (`lib/ModuleUtility.php:275-298`).
  - There are 232 distinct hook names across 278 call sites. Only `SettingsUI::defineHooks()` provides implementations, and there are 3 of them (`modules/settings/SettingsUI.php:87-117`).
  - The same pattern appears in `ajax.php:118`/`:125-128` (`AJAX_HOOK`, `$filters`), in the wizard (`WizardUI.php:181`), and in queue task instantiation (`lib/QueueProcessor.php:210`).
- **Evidence:** `lib/Hooks.php:52-72`; `lib/ModuleUtility.php:279`, `:296`; `modules/settings/SettingsUI.php:87-117`; `ajax.php:118`, `:125-128`; `modules/wizard/WizardUI.php:181`; `lib/QueueProcessor.php:210`.
- **Impact:** Integrators cannot react to changes such as a new applicant or a status change without polling or forking the code. Anything that can write `$_SESSION` gains code execution. Hook names are an undocumented, unstable internal contract.
- **Recommendation:** Keep the hook names as the event catalogue, but replace string-`eval` with callable listeners registered at bootstrap. Emit domain events at the points where e-mail is already sent and history is already recorded (`Pipelines::setStatus` `lib/Pipelines.php:340-366`, `Candidates::add/update`, `CareersUI::onApplyToJobOrder`, `ActivityEntries::add`). Deliver them through an outbox table plus signed webhooks (§7).

### API-018: Async queue relies on undocumented cron; registration defects
- **Severity:** LOW
- **Finding:**
  - Reminder e-mails and exception cleanup run only if something executes `QueueCLI.php` every minute. This is not documented beyond `QueueCLI.php:27-29`.
  - `modules/queue/tasks.php:41` (`registerRecurringTask('CleanExceptions')`, without a path) is never loaded. The copy that actually runs is `modules/queue/tasks/tasks.php:39`.
  - `registerRecurringTask` stores only the task **name** in `queue.task` (`lib/QueueProcessor.php:156`). If `startNextTask` later picks up a leftover row, it calls `getInstantiatedTask('Reminders')`, which cannot resolve a path (`:201-225`) (INFERENCE: such rows stay unprocessed until cleanup).
  - `QueueCLI.php:118` duplicates `case TASKRET_SUCCESS` where `TASKRET_SUCCESS_NOLOG` was intended.
- **Evidence:** `QueueCLI.php:27-29`, `:115-118`; `modules/queue/tasks.php:41`; `modules/queue/tasks/tasks.php:39`; `lib/ModuleUtility.php:86-101`; `lib/QueueProcessor.php:156`, `:201-225`, `:493-523`.
- **Impact:** Silent loss of reminders on installs without cron. Background processing is unreliable.
- **Recommendation:** Document the cron entry in README and the installer. Store the task path. Fix the duplicate case. Use the queue as the delivery engine for mail and webhooks (§7).

### API-019: Every machine-facing entry point hits a fatal error on PHP ≥ 8.0
- **Severity:** HIGH
- **Finding:** `ajax.php:50` and `:56`, `index.php:93` and `:99`, and `QueueCLI.php:59` and `:65` call `get_magic_quotes_runtime()` and `get_magic_quotes_gpc()`. Both were removed in PHP 8.0; `function_exists` returns `false` on the PHP 8.4 CLI. There is no polyfill (grep). CI runs only PHP 7.2 (`.github/workflows/ci.yml` matrix `['7.2']`), and the Docker image is `opencats/php-base:7.2-fpm-alpine` (`docker/docker-compose.yml`). The legacy `.travis.yml` lists 8.0 and 8.2.
- **Evidence:** `ajax.php:50`, `:56`; `index.php:93`, `:99`; `QueueCLI.php:59`, `:65`; `.github/workflows/ci.yml` (matrix `php-version: ['7.2']`); `docker/docker-compose.yml` (`opencats/php-base:7.2-fpm-alpine`).
- **Impact:** On any PHP version still supported upstream (8.1+), AJAX, careers, RSS, XML, the toolbar, and the queue all fail. The API surface can only run on end-of-life PHP.
- **Recommendation:** Delete these blocks, which are no-ops since PHP 5.4, along with `lib/Attachments.php:944`, `modules/import/ImportUI.php:495`, and `lib/InstallationTests.php:185`. Add PHP 8.2 and 8.3 to the CI matrix, with a smoke test that calls `ajax.php?f=getParsedAddress`.

### API-020: Import/export gaps: candidate CSV export has no ACL and no formula-injection protection
- **Severity:** MEDIUM
- **Finding:**
  - `ExportUI` makes no `getUserAccessLevel` call (grep). "All records mode" (`ids` empty) exports every candidate's name, phones, and e-mail (`modules/export/ExportUI.php:77-127`; `lib/Candidates.php:665-670`).
  - Cells are quoted only for `"` (`lib/Export.php:161`, `lib/DataGrid.php:1451`). Values beginning with `= + - @` are not neutralised. Public applicants control those values through careers fields.
  - Only candidates can be exported through `Export` (`lib/Export.php:132-139`). Other entities go through DataGrid.
  - Import supports CSV/TSV only (`ImportUI.php:620-624`). There is no XLSX, no HR-XML/HR Open Standards, and no API.
- **Evidence:** `modules/export/ExportUI.php:77-127` (no `getUserAccessLevel`); `lib/Export.php:132-139`, `:161`; `lib/DataGrid.php:1451`; `lib/Candidates.php:665-670`; `modules/import/ImportUI.php:620-624`.
- **Impact:** Bulk PII exfiltration by any user, including READ-only accounts, and CSV-injection against the recruiters who open exports.
- **Recommendation:** Gate export on a `candidates.export` secured object at ≥ EDIT or SA. Prefix risky leading characters with `'`. Offer exports as asynchronous API jobs (`POST /api/v1/exports`) that are audited in `history`.

### API-021: Almost no automated coverage of interfaces
- **Severity:** MEDIUM
- **Finding:**
  - CI runs PHPUnit unit and integration tests plus the Behat `default` and `security` suites (`test/runAllTests.sh`, `.github/workflows/ci.yml`).
  - No Behat feature calls `ajax.php`, careers, RSS, XML, graphs, or the toolbar. A case-insensitive grep of `test/features` finds only commented-out `ajax_*` lines (`GET_POST_requestsSecurity.feature:1331-1370`).
  - Unit coverage relevant to interfaces is limited to `AJAXInterfaceTest` (ID validators) and `VCardTest`.
  - The in-app SimpleTest AJAX tests (`modules/tests/testcases/AJAXTests.php`) are not run in CI. `GetCompanyNamesTest`, `GetPipelineJobOrderTest`, `SetCandidateJobOrderRatingTest`, `TestEmailSettingsTest`, and `ZipLookupTest` are stubs that only log in or are empty (`:380-927`).
- **Evidence:** `test/runAllTests.sh`; `.github/workflows/ci.yml`; `test/features/GET_POST_requestsSecurity.feature:1331-1370` (commented out); `modules/tests/testcases/AJAXTests.php:380-927`; `src/OpenCATS/Tests/UnitTests/AJAXInterfaceTest.php:13`, `:104`.
- **Impact:** API-002, API-003, API-005, API-012, and API-019 went undetected. Nothing protects an API migration.
- **Recommendation:** Add Behat/HTTP contract tests for all 32 handlers: auth, ACL, and response shape. Add careers apply scenarios, including a forged `candidateID`, and RSS/XML validity checks (parse with `simplexml`). Generate contract tests from the OpenAPI document once it exists.

### API-022: The in-app test harness can be run by any logged-in user
- **Severity:** MEDIUM
- **Finding:** `m=tests` requires only login (`modules/tests/TestsUI.php:65`). `a=runSelectedTests` executes the SimpleTest web and AJAX suites against the running instance and its database (`:104-125`). There is no access-level check (grep). `modules/tests/ajax/getCandidateJobOrderID.php` is exposed through `ajax.php`.
- **Evidence:** `modules/tests/TestsUI.php:65`, `:79-94`, `:104-125`; `modules/tests/ajax/getCandidateJobOrderID.php:33`.
- **Impact:** Test code can create or modify production data, and production ships an unnecessary attack surface.
- **Recommendation:** Exclude `modules/tests/` from release packages (`ci/package-code.sh`, and the zip in `ci.yml` `release`), or require ROOT.

---

## 7. Recommendations: target API design

### 7.1 Principles
1. **Build a new, separate API.** Use REST with JSON as the primary style, described by an **OpenAPI 3.1** document in the repo, for example `docs/api/openapi.yaml`, from which contract tests are generated. Do not try to retrofit `ajax.php`. REST fits the CRUD-plus-workflow nature of an ATS and the existing ACL model. GraphQL could be added later as a read-only layer for reporting, but it is not recommended first because per-field ACL enforcement against `getAccessLevel(secobj)` is harder.
2. **Share one service layer with the UI.** Extract services from `lib/*.php`, reusing `src/OpenCATS/Entity/*Repository`. Both the UI modules and `/api/v1` then call the same code, so ACL checks, history (`lib/History.php`), and e-mail triggers are identical.
3. **Version in the path.** Use `/api/v1/...`. Mark deprecations with the `Deprecation` and `Sunset` headers.
4. **Errors** use RFC 9457 `application/problem+json`. **Pagination** is cursor-based. **Filtering** reuses DataGrid filter semantics (`=~`, `==`, `=@` near ZIP, `lib/DataGrid.php:1226`).
5. **Tenant scoping:** every token is bound to a single `site_id`, which replaces the `getFirstSiteID()`, `Attachments(-1)`, and `Site(-1)` shortcuts.

### 7.2 Authentication and authorisation
- **Machine credentials:**
  - Personal access tokens: a new `api_token` table storing `site_id`, `user_id`, a `sha256` hash, scopes, `last_used_at`, and `expires_at`.
  - OAuth2 client-credentials for server integrations, and Authorization Code with PKCE for browser or mobile clients.
- **Human SSO:** OIDC (and optionally SAML via a bridge), mapping IdP groups to `ACCESS_LEVEL_{READ,EDIT,DELETE,SA,ROOT}` and user categories (`sourcer`, `careerportal`).
- **Scopes** are derived from the existing secured-object names, so ACL remains the single source of truth:

| Scope | ACL equivalent (evidence) |
|---|---|
| `candidates:read` / `candidates:write` / `candidates:delete` | `candidates.*` (`CandidatesUI.php:129`, `:279`) |
| `pipelines:write` | `pipelines.addActivityChangeStatus`, `pipelines.editRating` (`JobOrdersUI.php:176`, `ajax/setCandidateJobOrderRating.php:35`) |
| `activities:write` / `activities:delete` | `contacts.deleteActivity`, `candidates.delete` (`contacts/Show.tpl:287`) |
| `lists:write` | none today; add `lists.*` |
| `exports:run` | new `candidates.export` (API-020) |
| `settings:admin` | `settings.*` at SA |

- Every request is logged to `history` or an `api_audit` table. Rate limits apply per token and per IP, returning `429` with `Retry-After`.

### 7.3 Resource model: domain objects and legacy endpoints to migrate
| Resource (table) | Routes | Legacy endpoint(s) to preserve or migrate |
|---|---|---|
| `candidates` (`candidate`, `extra_field`, `candidate_tag`, `candidate_duplicates`) | `GET/POST /candidates`, `GET/PATCH/DELETE /candidates/{id}`, `GET /candidates?email=&phone=` | `getCandidateIdByEmail`, `getCandidateIdByPhone`, `m=export&a=export`, careers apply (API-002) |
| `companies` (`company`, `company_department`) | `/companies`, `/companies/{id}/contacts`, `/companies/{id}/departments`, `GET /companies?name~=` | `getCompanyNames`, `getCompanyContacts`, `getCompanyLocation`, `getCompanyLocationAndDepartments` |
| `contacts` (`contact`) | `/contacts`, `GET /contacts/{id}` with `Accept: text/vcard` (vCard 4.0) | `m=contacts&a=downloadVCard` (vCard 2.1) |
| `job-orders` (`joborder`) | `/job-orders`, `GET /job-orders/{id}/pipeline?sort=&page=` | `getPipelineJobOrder` (return JSON, not HTML), `getDataItemJobOrders` |
| `pipelines` (`candidate_joborder`, `candidate_joborder_status_history`) | `POST /job-orders/{id}/pipeline` (add candidate), `PATCH /pipelines/{id}` (`status`, `rating`), `GET /pipelines/{id}/history` | `setCandidateJobOrderRating`, `getPipelineDetails`, `tests:getCandidateJobOrderID` |
| `activities` (`activity`) | `/activities`, `PATCH/DELETE /activities/{id}` | `editActivity`, `deleteActivity` |
| `attachments` (`attachment`) | `POST /{entity}/{id}/attachments` (multipart), `GET /attachments/{id}/content` (signed, short-lived URL instead of `directoryNameHash`) | `getAttachmentLocal`, `m=attachments&a=getAttachment`, mass import |
| `lists` (`saved_list`, `saved_list_entry`) | `/lists`, `POST /lists/{id}/entries` (bulk) | `lists:newList`, `lists:editListName`, `lists:deleteList`, `lists:addToLists` |
| `calendar-events` (`calendar_event`) | `/calendar-events`, plus a per-user **iCalendar feed** `GET /calendar.ics?token=` for Outlook and Google subscription | `m=calendar&a=dynamicData` |
| `email-templates` (`email_template`) | `GET /email-templates/{id}`, `POST /email-templates/{id}/render` | `showTemplate`, `replaceTemplateTags` |
| `tags` (`tag`) | `/tags` | `m=settings&a=ajax_tags_*` |
| `users` (`user`) | `/users` (SA only), `/me` | `ajax_wizardAddUser` / `DeleteUser` |
| **Public** `jobs` (`joborder` with `public=1`) | `GET /public/v1/jobs`, `GET /public/v1/jobs/{id}`, `POST /public/v1/jobs/{id}/applications` (CAPTCHA, rate limit, e-mail verification) | `careers/?p=showAll|showJob|onApplyToJobOrder`, `rss/`, `xml/?t=` (keep as thin adapters over the same query) |
| Utilities | `GET /geo/postal-codes/{zip}` (local `zipcodes` table first), `POST /parse/address`, `POST /parse/resume` (pluggable) | `zipLookup`, `getParsedAddress`, Resfly |
| Async jobs (`queue`) | `POST /exports`, `POST /imports`, `GET /jobs/{id}` | `import:processMassImportItem`, `settings:backup`, CSV import |

### 7.4 Event model and webhooks
- **Event catalogue:** each event is emitted at a code point that already exists.

| Event | Emission point |
|---|---|
| `candidate.created`, `candidate.updated`, `candidate.deleted` | `lib/Candidates.php` `add`/`update`/`delete` |
| `application.submitted` | `CareersUI::onApplyToJobOrder` |
| `pipeline.added`, `pipeline.status_changed`, `pipeline.rating_changed` | `lib/Pipelines.php` `add`, `setStatus` (`:294`), `updateRatingValue` |
| `activity.created` | `ActivityEntries::add` |
| `joborder.published` / `joborder.closed` | `JobOrders::update` when `public` or `status` changes |
| `attachment.created` | `AttachmentCreator` via the `CREATE_ATTACHMENT_FINISHED` hook |
| `calendar.reminder_due` | `Reminders` task |

- **Delivery:** use a transactional outbox table (e.g. `event_outbox`). The existing `QueueProcessor` delivers events as HTTPS `POST`s with `X-OpenCATS-Signature: sha256=HMAC(secret, body)`, `X-OpenCATS-Event`, and `X-OpenCATS-Delivery` headers. Retries use exponential backoff and failures go to a dead-letter queue. Subscriptions live in a new `webhook_subscription` table (`site_id`, `url`, `events[]`, `secret_hash`, `active`).
- **Migrating hooks:** the 232 names in §6/API-017 become in-process listener topics. The 3 real implementations in `SettingsUI::defineHooks()` become PHP callables. Session-stored `eval` strings are removed.

### 7.5 Integration adapters (ports and adapters)
| Port | Adapters |
|---|---|
| `MailTransport` | SMTP (current), sendmail, API-based providers; always queued; honours `MAIL_MAILER=0` (API-011) |
| `ResumeParser` | none (default), a local heuristic built from `AddressParser`, an external HTTPS/JSON vendor. The Resfly SOAP adapter is deleted (API-010) |
| `Geocoder` | local `zipcodes` table first, external provider configured with a key |
| `DocumentConverter` | current binaries; fix the ODT bug at `lib/DocumentToText.php:166` |
| `SearchIndex` | MySQL FULLTEXT, Sphinx/Manticore |
| `JobDistribution` | Indeed XML feed, schema.org `JobPosting` JSON-LD, Google for Jobs sitemap; push adapters where job boards support them |
| `IdentityProvider` | SQL (bcrypt/argon2), LDAP over TLS with escaping, OIDC |
| `CalendarSync` | ICS feed first; CalDAV or Graph later |

### 7.6 Migration order
1. **Stop the bleeding.** Fix API-002, 003, 004, 005, 006, 007, 010, 019, and 012a. All are small, local code changes.
2. **Contract freeze.** Add HTTP contract tests for the 32 legacy handlers and the public feeds (API-021).
3. **Service extraction.** Build services and the `/api/v1` skeleton, with token authentication, OpenAPI, and read-only endpoints for candidates, companies, contacts, job orders, and the public jobs resource.
4. **Writes and events.** Add pipelines, activities, and attachments, plus the outbox and webhooks.
5. **Migrate the UI.** Move UI JS from `AJAX_callCATSFunction` to `/api/v1`, one handler at a time following §7.3. Remove each `ajax/*.php` once its last consumer is migrated. Consumers are listed in §2.4.
6. **Retire legacy surfaces.** Remove `modules/toolbar`, `wsdl/`, `ParseUtility`, and `$filters`/`AJAX_HOOK` `eval`, and replace `rss/` and `xml/` with adapters over the public jobs service.

---

## Facts vs Assumptions

**FACT (verified in code, and by execution where noted):**
- Contents of the §2.4 table: authentication lines, ACL presence, response types, and JS consumers (grep-verified).
- There is no REST/JSON API, SOAP server, webhook, CSRF token, rate limiter, OAuth, SAML, OIDC, or iCal (greps empty).
- `DataGrid::get` regex is ineffective (executed).
- `get_magic_quotes_*` do not exist on PHP 8.4 (executed).
- `rss/index.php` uses `LEGACY_ROOT` without including `config.php`; the undefined-constant fatal was reproduced on PHP 8.4.
- `isParsingEnabled()` always returns true.
- The careers `candidateID` trust and the argument misalignment.
- The ODT `$filename` typo.
- `Users::getPassword` and `PASSWORD_RESET_*` are undefined.
- `ToolbarUI::getLicenseKey` is unauthenticated.
- `Mailer` uses `PHPMailer(true)` without try/catch.

**Observed from the sandbox through its egress proxy (2026-09-25):**
- `soap.resfly.com` does not resolve.
- The Google Geocoding API returns `REQUEST_DENIED` without a key.
- `www.catsone.com/catsnewversion.php` returned 403. This is inconclusive because the proxy may have caused it.

**INFERENCE:**
- PHPMailer 6 throws on an invalid `AddAddress` or a failed `Send` in exception mode, and defaults to the `mail()` transport.
- PHP ignores a session ID sent in POST under the default `session.use_only_cookies=1`.
- On PHP 7.2, `rss/index.php` produces a warning followed by a fatal "Class not found".
- `.htaccess` rules do not apply under the nginx Docker image.
- `scripts/makeBackup.php` can run over the web if `register_argc_argv` is on.
- Leftover queue rows are not processable.
- With ext-soap loaded, parsing fails gracefully through `SoapFault`; without it, a fatal error occurs.

**ASSUMPTION (external knowledge):**
- Resfly (the Cognizo/CATS parsing SaaS) has been shut down.
- SimplyHired's 2007 XML intake URL and Indeed's 2007 feed schema are obsolete.
- The toolbar targets a legacy XUL Firefox extension, and those stopped working with Firefox 57.
- Sphinx/Manticore compatibility with API command version `0x107` is untested.

---

## Unknowns / Needs Further Investigation
1. **Web server configuration in production.** Whether nginx or Apache denies direct access to `QueueCLI.php`, `rebuild_old_docs.php`, `scripts/`, `modules/*/ajax/*.php`, `attachments/`, and `upload/`. The repo has no nginx configuration, and `.htaccess` is Apache-only.
2. **PHP runtime flags on deployed hosts:** `session.use_only_cookies`, `session.cookie_samesite`, `register_argc_argv`, `display_errors` (which affects whether notices break XML), and whether ext-soap and ext-ldap are loaded in `opencats/php-base:7.2-fpm-alpine`.
3. **Whether `INSTALL_BLOCK` reliably exists after install.** CI creates it manually (`ci.yml` step "touch ./INSTALL_BLOCK"). If it is missing, `install:ui` allows unauthenticated `config.php` rewrites.
4. **Exploitability of API-007.** Whether an attacker can place a file named `dataGrids.php` anywhere reachable by a relative path (upload staging directories, temp directories).
5. **Actual behaviour of the Indeed and Google for Jobs ingestion** of the current `/xml/?t=indeed` output (double-encoded CDATA, hard-coded company). This needs a live test with Indeed's feed validator.
6. **The queue in practice.** Whether any production install runs `QueueCLI.php` under cron. Check whether `queue.time` exists and how old it is.
7. **Whether any site has enabled `candidateRegistration` or custom career-portal templates** that add verification fields. This changes the practical reach of API-004.
8. **Third-party consumers of `ajax.php` or the feeds.** Access logs are needed to see whether external scripts call `ajax.php` or the feeds today; such consumers would need a compatibility shim during migration.
9. **Whether the `CAREERS_SITEID`, `RSS_SITEID`, and `XML_SUBMIT_FEEDS_TO_QUEUE` hooks were implemented in a proprietary hosted edition.** They are absent from this repo; their existence suggests multi-site feed support existed elsewhere.

# OpenCATS — API Assessment
Complete edition · 2026-09-26 · code at d607279 (OpenCATS 0.9.7.4)

## Scope and method

- **Inspected (read-only):** `ajax.php` and `lib/AJAXInterface.php`; all 21 handlers in `ajax/` and 11 in `modules/*/ajax/`; machine-facing actions routed through `index.php` (export, vCard, attachments, graphs, calendar data, settings `ajax_*`, wizard); the public surfaces (`careers/` → `modules/careers/CareersUI.php`, `rss/`, `xml/` → `modules/xml/XmlUI.php`, `lib/XmlJobExport.php`, `modules/toolbar/ToolbarUI.php`, install AJAX, `QueueCLI.php`, `rebuild_old_docs.php`); integrations (`lib/Mailer.php`, `lib/LDAP.php`, `lib/ParseUtility.php` + `wsdl/`, `lib/License.php`, `lib/ZipLookup.php`, `lib/NewVersionCheck.php`, `lib/DocumentToText.php`, `lib/VCard.php`, `lib/Export.php`, `modules/import/*`); the JS client (`js/lib.js`).
- **Commands:** `grep`/`git grep` for every endpoint name and for `json_encode|application/json|SoapServer|csrf|oauth|saml|webhook|rate.?limit|VCALENDAR`; `sed -n` for every citation; `php -r` on PHP 8.4 to check the `DataGrid` identifier regex and removed functions.
- **Runtime evidence used:** Phase 0.5 baseline (`docs/baseline/`): RT-01…RT-17, smoke steps #01–#94, `CURRENT_UI_MAP.md`, and `evidence/final-run/nginx.log` (42 `POST /ajax.php` requests, all HTTP 200; the `f` parameter is in the POST body and not logged) and `php_errors.log`. The baseline ran with the administrator account only, no SMTP server, no outbound internet, no scheduler.
- **Earlier observation reused:** the Phase 0 edition probed external hosts from the audit sandbox on 2026-09-25 (not from the app): `soap.resfly.com` did not resolve; Google's keyless geocode URL returned `REQUEST_DENIED`; `www.catsone.com` returned 403 through the proxy (inconclusive). These are labelled as such.
- **Not done:** no runtime security testing of any endpoint (none was allowed); no calls to a running instance; no LDAP, SMTP, parsing-service or job-board tests. Security weaknesses on these surfaces are owned by `SECURITY_AUDIT.md`; the API IDs below are kept because other documents reference them, but their security detail is kept short and points to the SEC ID.

## Summary

| ID | Title | Severity | Confirmation |
|---|---|---|---|
| API-001 | No public, documented or versioned API; the only machine interface is a session-bound UI RPC | MEDIUM | Static |
| API-002 | Careers "apply" trusts a client-supplied `candidateID` (unauthenticated candidate overwrite; = SEC-024) | CRITICAL | Static |
| API-003 | Careers returning-candidate update passes misaligned arguments to `Candidates::update()` | HIGH | Static |
| API-004 | Careers registered-candidate login is a forgeable knowledge-based cookie (= SEC-025) | HIGH | Static |
| API-005 | State-changing AJAX handlers check login only, not access level (= SEC-026) | HIGH | Static |
| API-006 | No CSRF protection; `ajax.php` accepts GET; no SameSite on the session cookie (= SEC-004) | HIGH | Static |
| API-007 | `getDataGridPager` identifier sanitiser is ineffective (include path / class instantiation; = SEC-027) | HIGH | Static |
| API-008 | Maintenance and operations endpoints reachable without authentication (= SEC-028) | MEDIUM | Static |
| API-009 | Legacy Firefox-toolbar API: unauthenticated licence-key output, credentials in GET, broken action | MEDIUM | Static |
| API-010 | Resfly SOAP parsing is dead but always "enabled"; would send résumé text and licence key over plain HTTP | HIGH | Partial |
| API-011 | Mail integration: uncaught PHPMailer exceptions, "disabled" mode still sends, forgot-password calls a missing method | HIGH | Runtime |
| API-012 | Job syndication: RSS entry point fatal; feeds ignore portal settings, escape wrongly and hard-code employer data | MEDIUM | Runtime |
| API-013 | ZIP lookup: unauthenticated endpoint proxies to a keyless Google API that refuses requests | MEDIUM | Partial |
| API-014 | No rate limiting or abuse controls on public endpoints | MEDIUM | Static |
| API-015 | AJAX response contract is inconsistent: XML/HTML/text, unescaped values, PHP errors returned as HTTP 200 | MEDIUM | Runtime |
| API-016 | No machine credentials or SSO; LDAP is the only external identity source and is weak | MEDIUM | Static |
| API-017 | No webhooks or outbound events; the only extension point is `eval` of session-stored hook strings | MEDIUM | Static |
| API-018 | [Merged into ARCH-016] Queue/cron defects | — | — |
| API-019 | [Merged into ARCH-001] PHP ≥ 8.0 fatals on every machine-facing entry point | — | — |
| API-020 | Import/export: candidate CSV export has no access check and no formula-injection guard; import is CSV/TSV only | MEDIUM | Static |
| API-021 | Almost no automated coverage of any interface | MEDIUM | Static |
| API-022 | In-app SimpleTest harness (`m=tests`) runnable by any logged-in user against the live database | MEDIUM | Static |
| API-023 | Careers apply endpoint silently discards a chosen résumé unless it was staged with "Upload" | HIGH | Runtime |

21 findings — 1 CRITICAL / 8 HIGH / 12 MEDIUM / 0 LOW · Runtime 4 / Static 15 / Partial 2 / Unverified 0 · 2 merged stubs (API-018, API-019) excluded from the counts.

---

## 1. Absence of a public API

**As built.** There is no REST, JSON, SOAP-server, XML-RPC or GraphQL interface. `git grep` for `json_encode|application/json` finds only `lib/DataGrid.php` (grid state in URLs) and `ajax/getDataGridPager.php:44`; no response is sent as JSON; `SoapServer`, `Authorization` header handling, API keys and CORS code are absent. What exists instead:

| Interface | Direction | Format | Auth | Consumer |
|---|---|---|---|---|
| `ajax.php` RPC (§2) | In | XML, HTML fragments, text | PHP session cookie `CATS` | The app's own JS |
| Careers portal (§3.1) | In (public) | HTML forms, multipart | None / knowledge cookie | Applicants |
| RSS / XML job feeds (§3.2) | Out (pull) | RSS 2.0, custom XML | None | Feed readers, job boards |
| CSV export, vCard, attachment download | Out | `text/x-csv`, `text/x-vCard`, binary | Session | Users' browsers |
| CSV/TSV import, bulk résumé import | In | Files via UI | Session | Users |
| Graph images | Out | PNG/JPEG | Five actions public | Pages, PDF report |

Runtime: the final smoke run made 42 `POST /ajax.php` calls, all from the UI (autocomplete, grids, test e-mail); no other machine client exists in the repository.

```
                 +------------- authenticated (PHP session cookie "CATS") --------------+
 Browser UI -XHR-> ajax.php?f=<fn> | f=<module>:<fn> -> ajax/*.php, modules/*/ajax/*.php  (XML/HTML/text)
            -GET-> index.php?m=<module>&a=<action>    -> pages; some actions return CSV, vCard, files, images
                 +-----------------------------------------------------------------------+
 Public    -----> careers/index.php?p=...             HTML portal: list, detail, apply (+ upload)
           -----> xml/?t=indeed|simplyhired            job feed (works)      rss/  (fatal, RT-05)
           -----> index.php?m=graphs|toolbar|wizard     images / toolbar text protocol / wizard pages
           -----> ajax.php?f=getParsedAddress|zipLookup|install:*   QueueCLI.php  rebuild_old_docs.php
 Outbound  -----> SMTP (PHPMailer) | LDAP :389 | SOAP http://soap.resfly.com | http://maps.googleapis.com
                  | http://www.catsone.com:80 (version check, off by seed) | Sphinx :3312 | exec(converters)
                  | http://<Host>/index.php?m=graphs... (PDF report fetches itself, ARCH-026)
```

### API-001 — No public, documented or versioned API
*Confirmation: **Static** · Phase 0 severity: HIGH → now MEDIUM (absence of a capability; no existing workflow is broken, so it does not meet this edition's HIGH criteria) · Related: PRODUCT_GAPS, ARCH-010*

- **Confirmed fact:** No domain object (candidate, company, contact, job order, pipeline, activity, attachment, list, event, user) can be read or written by another system except by driving the HTML UI with a logged-in browser session. `ajax.php` is a private UI RPC: it returns XML or HTML fragments shaped for specific pages, has no versioning, no documentation and no credential other than the session cookie.
- **Evidence:** `ajax.php:76-92` (routing by `f`); `lib/AJAXInterface.php:196-261` (session-only authentication); six handlers return HTML fragments (§2 inventory), e.g. `ajax/getPipelineJobOrder.php:184-330`, `ajax/getDataGridPager.php:60-61`; empty greps listed above.
- **Impact:** Integrations with HRIS, job boards, calendars, e-mail tools or BI require HTML scraping. Automation and mobile clients are not possible. Because the UI and its RPC are the same code, any UI change breaks any unofficial client.
- **Severity:** MEDIUM — a significant capability gap for an ATS, but not a defect in an existing workflow.
- **Recommendation:** Treat the absence of a supported integration interface as an explicit product gap, and do not present `ajax.php` as an API, since its contract is tied to page markup.
- **Unknown / needs further validation:** Whether third parties scrape the UI or call `ajax.php` today. Needs access logs from real installations.

### API-016 — No machine credentials or SSO; LDAP is the only external identity source and is weak
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: SEC-001, SEC-006*

- **Confirmed fact:** There are no API keys, personal access tokens, OAuth2 clients, SAML or OIDC (`grep` for `oauth|saml|openid|bearer|api[_-]?key` is empty). Authentication modes are `sql`, `ldap` and `sql+ldap` (`config.php:48`). Local passwords are unsalted MD5. The LDAP client builds its search filter by concatenation without `ldap_escape()` and connects with plain `ldap_connect()` without StartTLS; defaults point at a public test server.
- **Evidence:** `lib/Users.php:35-37`, `:93`, `:823-845`; `lib/LDAP.php:40-51`, `:60`, `:68`, `:97`; `config.php:264-284` (`LDAP_HOST 'ldap.forumsys.com'`, port 389).
- **Impact:** Any integration would have to share a human's password; there is no central identity, MFA or de-provisioning; LDAP credentials cross the network in cleartext. Security detail: SEC-001, SEC-006.
- **Severity:** MEDIUM — limits integration and identity management; the credential weaknesses are rated in the SEC findings.
- **Recommendation:** Record the lack of machine credentials and federated login as a gap, and harden the existing LDAP path (escaping, transport encryption) because it is the only external identity source today.
- **Unknown / needs further validation:** LDAP behaviour against a real directory (not tested in the baseline). Needs an isolated directory server.

### API-017 — No webhooks or outbound events; the only extension point is `eval` of hook strings
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: ARCH-004, SEC-011*

- **Confirmed fact:** No webhook or outbound event mechanism exists (`grep webhook` is empty). The internal extension mechanism, `Hooks::get($name)`, returns PHP source strings from `$_SESSION['hooks']` for callers to `eval`. There are 278 call sites and 251 distinct hook names; 10 hooks are implemented, all in `SettingsUI::defineHooks()` (career-portal user restrictions). The same pattern appears in `ajax.php` (`AJAX_HOOK`, `$filters`).
- **Evidence:** `lib/Hooks.php:52-72`; `lib/ModuleUtility.php:276-280`, `:296`; `modules/settings/SettingsUI.php:87-128`; `ajax.php:118`, `:125-128`.
- **Impact:** Integrators cannot react to events such as a new application or a status change without polling or forking. Hook names are an undocumented internal contract; code execution risk is in SEC-011.
- **Severity:** MEDIUM — missing integration capability plus an unsafe internal extension model.
- **Recommendation:** Record the absence of an event interface as a gap, and note that the natural event points already exist where the code sends e-mail and writes history (status change, application, activity).
- **Unknown / needs further validation:** Whether a hosted edition implemented hooks such as `CAREERS_SITEID` or `XML_SUBMIT_FEEDS_TO_QUEUE` elsewhere. Not answerable from this repository.

---

## 2. Internal AJAX RPC (`ajax.php`)

**As built.** `ajax.php` loads config, the DB wrapper, the session class, `AJAXInterface` and `CATSUtility` (`:36-41`), then routes `f=<fn>` to `ajax/<fn>.php` or `f=<module>:<fn>` to `modules/<module>/ajax/<fn>.php` after stripping non-alphanumerics (`:76-92`; this sanitiser is correct). Parameters are read from `$_REQUEST`, so GET and POST both work. The handler output is buffered, `AJAX_HOOK` is evaluated, leading whitespace is stripped from every line unless `nospacefilter` is set, and `$filters` are evaluated (`:108-131`); `nobuffer` skips all of that. The JS client (`js/lib.js:342-366`) always POSTs, appends a random `rhash` and the session ID (`&CATS=<id>`, from `CATSSession::getCookie()`, printed into 40 places in templates and handlers). `SecureAJAXInterface` starts the session and dies unless logged in (`lib/AJAXInterface.php:202-222`); it performs no access-level check. The request/response contract is in Reference R1.

### 2.1 Endpoint inventory

Auth = `new SecureAJAXInterface()` at the cited line (login only). ACL = explicit `getAccessLevel` check. Writes = persistent side effect. "UI" = consumer in `js/` or templates.

| # | `f=` | Purpose | Auth | ACL | Writes | Response |
|---|---|---|---|---|---|---|
| 1 | `deleteActivity` | Delete activity | `ajax/deleteActivity.php:33` | none | delete `:47` | XML |
| 2 | `editActivity` | Update activity | `:36` | none | update `:113` | XML; text on bad date `:77` |
| 3 | `getAttachmentLocal` | Check attachment file exists | `:31` | none; `Attachments(-1)` skips site scope `:46` | — | XML |
| 4 | `getCandidateIdByEmail` | Duplicate check | `:30` | none | — | XML, name unescaped `:63` |
| 5 | `getCandidateIdByPhone` | Duplicate check | `:30` | none | — | XML (reuses e-mail error text `:36`) |
| 6 | `getCompanyContacts` | Company's contacts | `:33` | none | — | XML, unescaped `:64-66` |
| 7 | `getCompanyLocation` | Company address | `:33` | none | — | XML, unescaped `:60-63` |
| 8 | `getCompanyLocationAndDepartments` | Address + departments | `:33` | none | — | XML, partly escaped |
| 9 | `getCompanyNames` | Company autocomplete | `:34` | none | — | XML (`rawurlencode`) |
| 10 | `getDataGridPager` | Re-render a data grid | `:34` | none (API-007) | session grid state | HTML |
| 11 | `getDataItemJobOrders` | Job orders for an item | `:30` | none | — | XML (escaped) |
| 12 | `getParsedAddress` | Parse free-text address | **none** (`new AJAXInterface()` `:35`) | n/a | — | XML, input echoed unescaped `:136-155` |
| 13 | `getPipelineDetails` | Pipeline activity history | `:33` | none | — | HTML, notes raw `:79-81` |
| 14 | `getPipelineJobOrder` | Paged pipeline for a job | `:37` | row actions only `:293,303,308` | session page size | HTML + JS |
| 15 | `getReportHTML` | — | — | — | — | empty file (0 bytes) |
| 16 | `replaceTemplateTags` | Fill e-mail template | `:6` | none | — | XML |
| 17 | `setCandidateJobOrderRating` | Pipeline rating | `:33` | `pipelines.editRating ≥ EDIT` `:35` | update | XML |
| 18 | `setColumnWidth` | Save grid column width | `:30` | none | DB preference `:46` | XML |
| 19 | `showTemplate` | E-mail template body | `:5` | none | — | XML |
| 20 | `testEmailSettings` | Send a test e-mail | `:33` | none | sends mail `:86-93` | XML (RT-04 fatal text at #77) |
| 21 | `zipLookup` | City/state via Google | **none** (`:9`) | n/a | outbound HTTP | XML |
| 22 | `import:processMassImportItem` | Next 50 bulk-import files | `:33` | none (session state from `ImportUI`) | creates attachments `:62-65` | text |
| 23 | `install:ui` | Installer steps | **none**; refuses when `INSTALL_BLOCK` exists `:55` | n/a | rewrites `config.php`, resets DB | HTML + script |
| 24 | `install:maint` | Includes `index.php` with `$maintPage` | **none** (`maint.php:30-37`) | n/a | deletes `modules.cache`; one pending migration per call | HTML + script |
| 25 | `install:attachmentsReindex` | Re-extract all attachment text | only if `INSTALL_BLOCK` exists `:32-35` | SA, same condition `:52` | bulk UPDATE | text |
| 26 | `install:attachmentsToThreeDirectory` | 0.x storage migration | `:33` | ROOT `:35` | ALTER + file moves | — |
| 27–30 | `lists:addToLists`, `deleteList`, `editListName`, `newList` | Saved lists | `:63` / `:36` | none | yes | XML |
| 31 | `settings:backup` | Full or attachments backup | `:34` | SA `:36` | writes zip + `progress.txt` under `attachments/` | HTML + script |
| 32 | `tests:getCandidateJobOrderID` | Test helper | `:33` | none | — | XML |

**Totals (re-verified by grep):** 32 files; 27 use `SecureAJAXInterface`, 2 the public `AJAXInterface`, 3 neither (`getReportHTML` empty, `install:ui` and `install:maint`). Access-level checks: 4 handlers (`setCandidateJobOrderRating`, `settings:backup`, `install:attachmentsToThreeDirectory`, conditionally `install:attachmentsReindex`) plus row actions in `getPipelineJobOrder`. About 15 handlers change persistent state. Machine-facing actions routed through `index.php` are listed in Reference R2.

### API-005 — State-changing AJAX handlers check login only, not access level
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: SEC-026, ARCH-007, TEST-004*

- **Confirmed fact:** `SecureAJAXInterface` enforces only "logged in". Handlers that delete or modify data (`deleteActivity`, `editActivity`, the four `lists:*` handlers, `setColumnWidth`, `import:processMassImportItem`) and `testEmailSettings` (sends mail with a caller-chosen From address) perform no access-level check, while the equivalent page actions are gated in the UI (e.g. the delete-activity link is shown only at `contacts.deleteActivity ≥ EDIT` or `candidates.delete ≥ DELETE`). `m=settings&a=ajax_tags_add|del|upd` likewise skip the SA check that the Tags page applies.
- **Evidence:** `lib/AJAXInterface.php:202-222`; `ajax/deleteActivity.php:33-47`; `ajax/editActivity.php:36,113`; `modules/lists/ajax/deleteList.php:36-51`; `ajax/testEmailSettings.php:33,62,73,86-93`; `modules/settings/SettingsUI.php:232`, `:675-700`; `modules/contacts/Show.tpl:287`, `modules/candidates/Show.tpl:611`.
- **Impact:** Access levels are enforced in the presentation layer only; a low-privileged user's permissions are wider through the RPC than through the pages. Exploitability and impact are assessed in SEC-026.
- **Severity:** HIGH — authorization gap with the precondition of a valid low-privileged account.
- **Recommendation:** Give every RPC handler the same access requirement as its page counterpart, enforced before the handler runs, so the RPC cannot do more than the UI allows.
- **Unknown / needs further validation:** Actual behaviour for READ/EDIT/sourcer accounts (baseline used only `admin`). Needs authorized security testing on an isolated instance.

### API-006 — No CSRF protection; `ajax.php` accepts GET; no SameSite on the session cookie
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: SEC-004, SEC-007, SEC-015*

- **Confirmed fact:** `grep` for `csrf|xsrf|nonce|form_token` finds nothing. `ajax.php` and handlers read `$_REQUEST`, so state-changing calls work over GET. The PHP session cookie is started with default parameters (`session_set_cookie_params` is never called); `lib/Session.php:899` defines `$samesite = 'Strict'` but never passes it, and sets an unrelated `session_cookie`. The session ID is also printed into pages via `getCookie()`.
- **Evidence:** `ajax.php:63`, `:76-92`; `lib/Session.php:555-558`, `:893-903`; `js/lib.js:332-352`; `config.php:151`. The baseline nginx image adds `Access-Control-Allow-Origin: *` to responses (`ENVIRONMENT.md` §2); the app itself sets no CORS headers.
- **Impact:** Any site a logged-in user visits can trigger state-changing calls in their session (details and severity context in SEC-004).
- **Severity:** HIGH — cross-site request forgery against all state-changing endpoints, with the precondition of a logged-in victim.
- **Recommendation:** Require a per-session anti-forgery token and a non-GET method for every state-changing call, and set restrictive cookie attributes, so requests from other sites cannot act in a user's session.
- **Unknown / needs further validation:** Effective cookie attributes and headers on real deployments (they depend on `php.ini` and the web server). Needs a review of deployed configurations; no testing was done here.

### API-007 — `getDataGridPager` identifier sanitiser is ineffective
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: SEC-027*

- **Confirmed fact:** `ajax/getDataGridPager.php:43-58` passes `$_REQUEST['i']` to `DataGrid::get()`, which "sanitises" the module and class parts with `preg_replace("[^A-Za-z0-9]", "", …)`. Without delimiters PHP treats `[`…`]` as the delimiters, so the pattern only removes the literal prefix `^A-Za-z0-9`; on PHP 8.4 a test string containing `../` path segments is returned unchanged. The values then reach `include_once(sprintf('modules/%s/dataGrids.php', $module))` and `new $class(…)`. The same path backs `m=export&a=exportByDataGrid`.
- **Evidence:** `lib/DataGrid.php:267-268`, `:275-282`, `:295-303`; `modules/export/ExportUI.php:135-140`; read-only `php -r` check on PHP 8.4. The dispatcher's own sanitiser (`ajax.php:78,88-89`) uses correct delimiters.
- **Impact:** A logged-in user controls part of an include path and which class is instantiated. Whether this leads further depends on files present on the server (SEC-027).
- **Severity:** HIGH — authenticated control over include and instantiation.
- **Recommendation:** Resolve grid identifiers only against a fixed list of known grids, so request data never becomes a path or class name.
- **Unknown / needs further validation:** Exploitability depends on the server's file layout. Needs authorized security testing on an isolated instance.

### API-015 — AJAX response contract is inconsistent; PHP errors returned as HTTP 200
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: ARCH-020, RT-04, RT-15, SEC-005*

- **Confirmed fact:** Errors come in three shapes: the XML envelope (`<errorcode>`/`<errormessage>`, message not escaped), bare text via `die()`, and HTML. Codes are magic numbers (`-1`, `-2`). Several handlers interpolate DB values into XML without escaping; others use `htmlspecialchars` or `rawurlencode`. There is no version, schema or content negotiation. The JS client detects server failure by searching the body for PHP's HTML error text. The dispatcher strips leading whitespace from every buffered line, which alters `<pre>`/textarea content unless `nospacefilter` is sent.
- **Evidence:**
  - `lib/AJAXInterface.php:61-69`, `:77-86`; `ajax/editActivity.php:77`; `ajax/getCandidateIdByPhone.php:36`; `ajax/getCompanyContacts.php:64-66`; `ajax/getParsedAddress.php:136-155`; `ajax.php:120-123`; `js/lib.js:443-446`.
  - Runtime, RT-04 / #77: "Send Test E-Mail" returned the PHP fatal page (stack trace, SMTP error) inside the AJAX response with HTTP 200, and the UI displayed it in the result box. All 42 `ajax.php` calls in the final run returned 200 (`nginx.log`).
- **Impact:** Names containing `&` or `<` can break the XML parse or inject markup into the page; failures cannot be told apart by status code; no third party could consume the contract reliably.
- **Severity:** MEDIUM — fragile contract with an injection side effect (rated in SEC-005).
- **Recommendation:** Give the RPC one response envelope with consistent escaping and real HTTP status codes, so the client and any future consumer can detect errors without parsing PHP output.
- **Unknown / needs further validation:** Which handlers break on special characters in stored data. Needs a test data set with such characters on an isolated instance.

### API-019 — [Merged into ARCH-001] PHP ≥ 8.0 fatals on every machine-facing entry point
The `get_magic_quotes_*()` calls in `ajax.php:50,56`, `index.php:93,99` and `QueueCLI.php:59,65` are one of the PHP 8 blockers listed in ARCH-001 (Reference R5 of `ARCHITECTURE.md`).

### API-021 — Almost no automated coverage of any interface
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: TEST-004, TEST-006, TEST-012*

- **Confirmed fact:** CI runs PHPUnit and the Behat `default` and `security` suites. No Behat feature calls `ajax.php`, careers, RSS, XML, graphs or the toolbar; the only matching lines in `test/features` are commented out. Interface-related unit tests are limited to `AJAXInterfaceTest` (ID validators) and `VCardTest`. The in-app SimpleTest AJAX tests are not run in CI and several are empty stubs.
- **Evidence:** `test/runAllTests.sh`; `.github/workflows/ci.yml`; `test/features/GET_POST_requestsSecurity.feature:1331-1370` (commented); `modules/tests/testcases/AJAXTests.php:380-927`; `src/OpenCATS/Tests/UnitTests/AJAXInterfaceTest.php`.
- **Impact:** RT-05 (RSS fatal), RT-03 (forgot password), RT-04 (mail fatals) and API-002/003/005 were not caught by any test. Any change to an interface has no safety net.
- **Severity:** MEDIUM — high change risk on every interface.
- **Recommendation:** Cover each RPC handler and public endpoint with contract-level tests (authentication, access level, response shape), so interface behaviour is pinned before anything is changed.
- **Unknown / needs further validation:** Whether the CI Behat suites currently pass (TESTING_AUDIT owns this). Needs CI run history.

### API-022 — In-app SimpleTest harness runnable by any logged-in user against the live database
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: TEST-009, ARCH-015*

- **Confirmed fact:** `m=tests` requires login only; `a=runSelectedTests` runs the SimpleTest web and AJAX suites against the running instance and its database, with no access-level check. `tests:getCandidateJobOrderID` is exposed through `ajax.php`. The module is discovered and instantiated on every new session.
- **Evidence:** `modules/tests/TestsUI.php:41-46`, `:65`, `:79-94`, `:104-125`; `modules/tests/ajax/getCandidateJobOrderID.php:33`; RT-02 (23 modules, including `tests`, queried at discovery).
- **Impact:** Any user can run test code that creates or changes production data; production carries an unnecessary surface.
- **Severity:** MEDIUM — data-integrity risk requiring a valid account.
- **Recommendation:** Keep test harnesses out of production builds, so no production user can run them.
- **Unknown / needs further validation:** What the suites write when run against a real database. Needs a run on an isolated copy.

---

## 3. Public (unauthenticated) surfaces

**As built.** `index.php` skips authentication for modules whose `_authenticationRequired` is `false`: `careers`, `graphs`, `install`, `login`, `rss`, `toolbar`, `wizard`, `xml` (`index.php:195`, `:256-259`; `lib/ModuleUtility.php:109-140`). `careers`, `rss` and `xml` are also forced by the `$careerPage`/`$rssPage`/`$xmlPage` shim flags or `?showCareerPortal=1` (`index.php:176-191`). Outside `index.php`, `ajax.php?f=getParsedAddress|zipLookup|install:*`, `QueueCLI.php`, `rebuild_old_docs.php`, `installtest.php` and stored files under `attachments/` are reachable without a session (RT-17 for the last).

| Surface | What it does | Runtime (baseline) |
|---|---|---|
| Careers portal `careers/index.php?p=…` | Job list, job detail, apply with résumé upload, questionnaire, optional candidate registration/profile | Works after enabling (#80–#86); blank until enabled (RT-16); applicant sees fatal on mail failure (RT-04); unstaged résumé dropped (RT-12) |
| XML job feed `xml/?t=<template>` | Pull feed of public job orders (Indeed, SimplyHired templates) | Works, `text/xml` (#89) |
| RSS feed `rss/` | RSS 2.0 of public job orders | Fatal (RT-05, #88) |
| Graphs `m=graphs&a=testGraph\|wordVerify\|jobOrderReportGraph\|generic\|genericPie` | Render images from GET data | Used by the PDF report (RT-09); public by design (ARCH-026) |
| Toolbar `m=toolbar&a=…` | Legacy Firefox toolbar protocol | Not tested |
| Wizard `m=wizard&a=ajax_getPage` | Evaluates wizard code stored in the session | Not tested |
| Installer AJAX, `QueueCLI.php`, `rebuild_old_docs.php`, `installtest.php` | Install/maintenance | Not tested |

### 3.1 Careers portal

**As built.** Site is always `Site::getFirstSiteID()` (`CareersUI.php:79`). Disabled portals return `<!-- Job Board Disabled -->` (`:98-103`; default `enabled => '0'`, `lib/CareerPortal.php:77`). Any visitor can switch the template with `?templateName=` (`:106-108`). Jobs come from `JobOrders::getAll(…, onlyPublic)` (`:118`). The page map is in Reference R4. `p=search` renders the search template (#83) but the `search` and `searchResults` branches are empty (`:180-182`, `:856-858`), so no job search is performed.

### API-002 — Careers "apply" trusts a client-supplied `candidateID`
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: SEC-024, API-003, DB-011*

- **Confirmed fact:** The public application form carries `candidateID` in a hidden field. On submit the value is read from POST and passed to `onApplyToJobOrder()`, which, when it is set, updates that existing candidate with the submitted personal data, sets the owner to the automated user, then attaches files, adds a pipeline row and logs an activity. Nothing ties the submitter to that candidate, and this path does not depend on candidate registration being enabled.
- **Evidence:** `modules/careers/CareersUI.php:699,710` (hidden field), `:725-726`, `:750`, `:1190`, `:1279-1293`; `lib/Candidates.php:249-254` (update scoped only by `site_id`). Runtime: only the new-applicant path was exercised (#85, #86: new candidates created); no security testing was done.
- **Impact:** Anyone who can reach an enabled careers portal with one public job can alter existing candidate records (personal data, ownership, attachments). Details: SEC-024.
- **Severity:** CRITICAL — an unauthenticated actor can corrupt core recruiting data.
- **Recommendation:** Never accept a candidate identity from the client on the public portal; derive it only from server-side verified state, so a public form cannot address existing records.
- **Unknown / needs further validation:** Whether any installation has been affected. Needs authorized security testing on an isolated instance and a review of candidate history on real data.

### API-003 — Careers returning-candidate update passes misaligned arguments
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: ARCH-011, DB-011*

- **Confirmed fact:** `Candidates::update()` takes 32 positional parameters ending `…, $owner, $isHot, $email, $emailAddress, $gender, $race, $veteran, $disability`. The careers call passes `…, $automatedUser['userID'], $automatedUser['userID'], $gender, $race, $veteran, $disability`, so `isHot` receives a user ID, the notification body and address receive the gender and race values, `gender`/`race` receive the veteran and disability values, and `veteran`/`disability` fall back to `''`. Because the address slot is non-empty, the update tries to send an "Ownership Change" e-mail to that value. The registered-profile path passes the candidate's e-mail in both e-mail slots, so each profile update mails the candidate an ownership-change notice.
- **Evidence:** `lib/Candidates.php:249-254`, `:341-351`; `modules/careers/CareersUI.php:1284-1290`, `:298-332`. Not exercised at runtime (returning candidates and registration were not tested, `SMOKE_TEST.md` §4).
- **Impact:** EEO data is silently corrupted, candidates are wrongly flagged hot, and spurious or failing mail is triggered (with PHPMailer in exception mode, a fatal after the DB write; see API-011).
- **Severity:** HIGH — silent corruption of compliance-relevant data.
- **Recommendation:** Fix the argument order in both careers calls and stop passing long positional lists for this update, so fields land in the right columns.
- **Unknown / needs further validation:** How many stored records carry shifted EEO values. Needs a read-only check of real data.

### API-004 — Careers registered-candidate login is a forgeable knowledge-based cookie
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: SEC-025*

- **Confirmed fact:** When candidate registration is enabled (off by default), a returning candidate is identified by matching template fields (for the default template: e-mail, last name, ZIP) from POST or from a client-side cookie `cats<siteID>cw`; no secret is involved. The profile handler then updates the profile and deletes an attachment chosen by `$_GET['attachmentID']`; `Attachments::delete()` is scoped by site only, not by candidate.
- **Evidence:** `modules/careers/CareersUI.php:1629-1763`, `:259-358` (`:291`, `:340`); `lib/Attachments.php:304-335`; `lib/CareerPortal.php:79` (`candidateRegistration => '0'`); `db/cats_schema.sql:440`.
- **Impact:** With registration enabled, knowledge of a candidate's basic details is enough to edit their profile, and file deletion is not limited to the candidate's own files (SEC-025).
- **Severity:** HIGH — account takeover and deletion with the precondition that registration is enabled.
- **Recommendation:** Require a verified, server-side session for returning candidates and limit profile actions to that candidate's own records.
- **Unknown / needs further validation:** How many installations enable registration. Needs field data; authorized testing on an isolated instance.

### API-023 — Careers apply endpoint silently discards a chosen résumé unless it was staged
*Confirmation: **Runtime** · New in this edition · Related: RT-12, API-002, UX findings*

- **Confirmed fact:** The apply form's visible file input is `resumeFile`. Its "Upload" button posts it with `applyToJobSubAction=resumeLoad`, stores it, and writes the stored name into a hidden `file` field. The final submit (`p=onApplyToJobOrder`) only attaches `$_FILES['file']` or `$_POST['file']`; a file chosen in `resumeFile` but not uploaded is ignored without any message.
- **Evidence:** `modules/careers/CareersUI.php:498`, `:601-602` (field names), `:1351-1402` (final submit reads only `file`). RT-12: applicant Jordan (#85, file chosen, submitted) → candidate and pipeline created, no attachment; applicant Morgan (#86, Upload then submit) → attachment stored and searchable (#87).
- **Impact:** Applicants who skip the extra click lose their résumé; recruiters receive applications without CVs and the applicant is not told.
- **Severity:** HIGH — silent loss of applicant data in the core public workflow.
- **Recommendation:** Make the final submission accept the file the applicant selected (or refuse the submission with a clear message), so a chosen résumé is never dropped silently.
- **Unknown / needs further validation:** Behaviour on other browsers and with the questionnaire step enabled. Needs a UI test with those variations.

### 3.2 Job syndication feeds

**As built.** `xml/?t=<name>` matches `xml_feeds.xml_template_name` (seeded `indeed`, `simplyhired`; `db/cats_schema.sql:1173-1174`), renders `.xtpl` templates with `$[tag]` placeholders (`lib/XmlJobExport.php:125-218`) and logs each hit to `http_log` (`XmlUI.php:117-120`). `rss/` (and `index.php?m=rss`) emits RSS 2.0 (`modules/rss/RssUI.php:99-156`). Both are pull-only: `XmlTemplate::submitXMLFeeds()` is a hook stub that nothing calls, and `xml_feeds.post_url`/`success_string` are never read.

### API-012 — Job syndication: RSS entry point fatal; feeds ignore settings, escape wrongly, hard-code employer data
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-05, RT-16, ARCH-022, ARCH-013, ARCH-008*

- **Confirmed fact:**
  - (a) `rss/index.php` uses `LEGACY_ROOT` before loading config and fails; the careers "RSS Feed" button links to it.
  - (b) The XML feed sends `CATS (www.catsone.com)` as the hiring company for every job, `US` as the country and an empty postal code, instead of the job order's company and address.
  - (c) Feed values are HTML-encoded and then placed inside `CDATA`, so they are double-encoded (e.g. the job URL contains literal `&amp;`); RSS writes title, city and state without any escaping.
  - (d) Neither feed checks the career portal's `enabled` flag, which the careers page does; RSS also ignores `allowBrowse`.
  - (e) Absolute links are built from the client `Host` header; feeds serve only the first site; `rss.xtpl` cannot be selected (not seeded); a `notes` tag would expose internal job-order notes if an admin added it to a template; push submission is a stub.
- **Evidence:**
  - (a) `rss/index.php:37`; RT-05 / #88 (HTTP 200, fatal "Class 'CATSUtility' not found").
  - (b), (c) `modules/xml/XmlUI.php:255-261`, `:280-294`; `lib/XmlJobExport.php:218`; `modules/xml/xml_templates/indeed.xtpl:14-23`; runtime #89 (`screenshots/89-12-careers-portal-xml-job-feed.png`): `<company>` is `CATS (www.catsone.com)` although the job belongs to "Baseline Test Co (TEST)", `<country>` `US`, empty `<postalcode>`, and `<url>` `http://localhost:8080/careers/?p=showJob&amp;ID=1&amp;ref=indeed` inside CDATA.
  - (c) `modules/rss/RssUI.php:140-150`; (d) `modules/careers/CareersUI.php:98-103` vs `XmlUI.php:105-190`, `RssUI.php:99-156`; (e) `lib/CATSUtility.php:220-240`, `XmlUI.php:107`, `RssUI.php:103`, `XmlUI.php:304-310`, `lib/XmlJobExport.php:108-111`.
  - Static only: (d) and (e) were not exercised (the XML feed was requested after the portal was enabled, #75).
- **Impact:** Job boards receive the wrong employer and location data and broken links; the RSS feed is unusable; feeds may publish jobs while the portal is disabled; feed readers see a failure as HTTP 200.
- **Severity:** MEDIUM — a public distribution feature is partly broken and publishes wrong data.
- **Recommendation:** Build feed values from the job order's own data with one XML-correct escaping step, honour the portal settings, and repair the RSS entry point, so syndicated postings are accurate and controlled by the administrator.
- **Unknown / needs further validation:** How current job boards ingest this format (Indeed/SimplyHired specifications have changed since 2007, external knowledge). Needs validation with the boards' current feed validators.

### 3.3 Toolbar, maintenance endpoints and abuse controls

### API-009 — Legacy Firefox-toolbar API
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: SEC-010, ARCH-019*

- **Confirmed fact:** `index.php?m=toolbar` is a public module. `a=getLicenseKey` prints `LICENSE_KEY` without authentication; `a=authenticate` logs in with `CATSUser`/`CATSPassword` taken from GET and is gated on `LicenseUtility::isProfessional()`, which always returns `true`; `a=attemptLogin` calls a method `ToolbarUI` does not have (fatal); `storeMonsterResumeText` scrapes 2007-era Monster.com markup. The client was a legacy XUL Firefox extension (external knowledge: such extensions stopped working with Firefox 57 in 2017).
- **Evidence:** `modules/toolbar/ToolbarUI.php:37`, `:46`, `:57-86`, `:95-96`, `:114`, `:282-285`; `config.php:31`.
- **Impact:** A dead feature that exposes a (committed) licence key, encourages credentials in URLs and logs, and adds an unauthenticated login surface.
- **Severity:** MEDIUM — limited-scope exposure on an obsolete interface.
- **Recommendation:** Retire or disable the toolbar interface, since it has no working client and only adds exposure.
- **Unknown / needs further validation:** Whether any user still has a working client. Needs field data.

### API-008 — Maintenance and operations endpoints reachable without authentication
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: SEC-028, ARCH-006, ARCH-016, ARCH-005*

- **Confirmed fact:** `ajax.php?f=install:maint` has no guard; it deletes `modules.cache` and includes `index.php` in maintenance mode, which applies one pending migration step per call. `install:attachmentsReindex` authenticates only when `INSTALL_BLOCK` exists. `QueueCLI.php` and `rebuild_old_docs.php` have no SAPI or authentication check; the latter re-extracts text for unindexed attachments and prints stored filenames. `install:ui` rewrites `config.php` from request data whenever `INSTALL_BLOCK` is absent (by design during installation).
- **Evidence:** `modules/install/ajax/maint.php:30-37`; `lib/ModuleUtility.php:517-536`; `modules/install/ajax/attachmentsReindex.php:32-35`, `:52`; `QueueCLI.php:26-86`; `rebuild_old_docs.php:14-65`; `modules/install/ajax/ui.php:55`, `:120-135`.
- **Impact:** Anonymous visitors can trigger migrations, bulk conversion work and queue runs, and learn internal filenames (SEC-028). A missing `INSTALL_BLOCK` turns the installer into an open configuration writer.
- **Severity:** MEDIUM — resource abuse and information disclosure; the configuration-writer case needs a missing lock file.
- **Recommendation:** Make maintenance operations available only to authenticated administrators or the command line, so they cannot be started from the public web.
- **Unknown / needs further validation:** Whether real web servers expose these scripts (no web-server rules ship with the repo) and whether `INSTALL_BLOCK` reliably exists after install. Needs a review of deployed configurations.

### API-014 — No rate limiting or abuse controls on public endpoints
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: SEC-014, PERF-013, ARCH-026*

- **Confirmed fact:** `grep` for `rate.?limit|throttl|lockout|captcha` finds only an unused CAPTCHA image renderer (`m=graphs&a=wordVerify`). Careers apply creates candidates, attachments, pipelines and activities and sends the confirmation template to the applicant-supplied address without any throttle or challenge. Public graph actions render images from request data up to about 2000 × 1200 px. Login and toolbar login have no attempt throttling.
- **Evidence:** `modules/careers/CareersUI.php:1190-1600` (confirmation mail `:1518-1523`); `modules/graphs/GraphsUI.php:53-66`, `:76-98`; `lib/GraphGenerator.php:432-445`; `modules/toolbar/ToolbarUI.php:95-103`. RT-04 (#85, #86) shows the applicant confirmation is sent synchronously during the apply request.
- **Impact:** The portal can be used to fill the database with junk applications, to send the confirmation e-mail to arbitrary addresses, and to consume CPU; login can be brute-forced (SEC-014).
- **Severity:** MEDIUM — abuse potential on public endpoints without a direct data compromise.
- **Recommendation:** Add request-rate and anti-automation controls to the public write and render endpoints and to login, so public surfaces cannot be used for spam, junk data or resource exhaustion.
- **Unknown / needs further validation:** Whether a front proxy provides rate limiting in real deployments. Needs deployment data.

---

## 4. Integrations

**As built.** All integrations are outbound calls made synchronously inside user requests, configured by constants in `config.php`; none has retries, timeouts managed by the app (except the version check's 5 s socket timeout), health reporting or tests.

| Integration | Protocol / direction | Configuration and auth | Status (evidence) |
|---|---|---|---|
| E-mail (PHPMailer 6.8.0) | Out: SMTP (default `localhost:587`, TLS, auth), sendmail or `mail()` | `config.php:208-225`; `lib/Mailer.php:314-351` | Every send failed with an uncaught exception in the baseline (no relay; RT-04) — API-011 |
| LDAP | Out: `ldap://` :389, no StartTLS | `config.php:264-284`; `lib/LDAP.php` | Optional (`AUTH_MODE='sql'` default); not tested — API-016 |
| Resfly résumé parsing | Out: SOAP 1.1 over HTTP to `soap.resfly.com` | `wsdl/parse.wsdl:78`, `status.wsdl:69`; licence key in body | Host did not resolve (Phase 0 sandbox probe); parser UI shown (#22) — API-010 |
| Google geocoding (ZIP → city/state) | Out: HTTP GET, no key | `lib/ZipLookup.php:23-26` | Keyless requests refused (Phase 0 probe) — API-013 |
| Local ZIP radius search | DB table `zipcodes` | `db/upgrade-zipcodes.sql`; `US_ZIPS_ENABLED` | Optional; installed only by the installer option |
| Version check / telemetry | Out: raw socket HTTP to `www.catsone.com:80`, sends version, UID, site name, active users, licence key | `lib/NewVersionCheck.php:100-122`, `:198-224` | Off via seeded `system.disable_version_check=1` (`db/cats_schema.sql:1044`); column default 0 |
| Sphinx search | Out: binary protocol to `localhost:3312` | `config.php:97-101`; 2007 client | Off by default (`ENABLE_SPHINX=false`) |
| Document converters | Local `exec` of antiword/pdftotext/html2text | `config.php:62-81` (placeholders) | PDF extraction fails by default (RT-08); ODT always fails (ARCH-018) |
| Job boards | Out: pull feeds | §3.2 | XML works with wrong employer data (#89); RSS fatal (RT-05) |
| Calendar sync | none (no iCal/CalDAV; `grep VCALENDAR` empty) | — | Absent |
| Webhooks / events | none | — | Absent (API-017) |
| Google Maps link | Plain link on company page | — | Link only |

Integration details not covered by a finding below:

- **LDAP** (`lib/LDAP.php`, `lib/Users.php:823-850`): used when `AUTH_MODE` is `ldap` or `sql+ldap`; unknown directory users are auto-provisioned as disabled local accounts; empty passwords are rejected before bind. Weaknesses in API-016 / SEC-006.
- **Version check** (`lib/NewVersionCheck.php`): once a day at most; when a newer version is recorded, SA users see a link to `www.catsone.com/download.php` (`lib/TemplateUtility.php:173-180`); enabled wherever the seeded `system` row is missing. Covered by ARCH-019 / SEC-017.
- **Mass e-mail** is sent with `new Mailer(CATS_ADMIN_SITE)` (`modules/candidates/CandidatesUI.php:3320`), i.e. under the hosted-admin site ID rather than the user's site; the effect on `email_history` attribution was not verified.
- **Calendar reminders** go through the queue (`modules/calendar/tasks/Reminders.php:93` → `lib/Calendar.php:952-966`) and need the scheduler (ARCH-016).

### API-011 — Mail integration: uncaught exceptions, "disabled" mode still sends, forgot-password calls a missing method
*Confirmation: **Runtime** · Phase 0 severity: unchanged · Related: RT-03, RT-04, SEC-002, ARCH-020, ARCH-027, PERF-005*

- **Confirmed fact:** `Mailer` creates `new PHPMailer(true)` (exception mode) and calls `AddAddress()`/`Send()` without `try/catch`, so any SMTP or address failure is an uncaught exception after the caller's DB writes; the `if (!Send())` error path is unreachable in that mode. `MAIL_MAILER == 0` (disabled) is a no-op `case`, so direct senders (calendar reminders, test e-mail) still use PHPMailer's default transport; only template-driven sends check the flag. `SetLanguage()` points at a directory that does not exist. `LoginUI::onForgotPassword()` calls `Users::getPassword()` and constants `PASSWORD_RESET_SUBJECT`/`_BODY`, none of which exist. `Mailer` reads the web session for the user ID when none is passed.
- **Evidence:**
  - `lib/Mailer.php:76`, `:85`, `:96`, `:234`, `:241-247`, `:314-317`; `lib/EmailTemplates.php:350-357`; `modules/login/LoginUI.php:448-461`; `git grep` finds no `Users::getPassword` and no `PASSWORD_RESET_*` definition (only `FORGOT_PASSWORD_*` in `config.php:172-174`).
  - RT-03 / #04: "Call to undefined method Users::getPassword()" with stack trace.
  - RT-04 / #77, #79, #85, #86: "Uncaught PHPMailer\PHPMailer\Exception: SMTP Error: Could not connect to SMTP host" on test e-mail, candidate e-mail and careers apply (applicant sees the fatal; application already saved; `email_history` empty).
- **Impact:** Every mail failure becomes a user-visible fatal, including on the public careers site; there is no password recovery at all; administrators cannot actually switch mail off.
- **Severity:** HIGH — core workflows (password recovery, notifications, applications) fail or leave partial state.
- **Recommendation:** Handle mail failures inside the mail layer, honour the disabled setting for every send, and replace the non-existent password-recovery flow with a working one (SEC-002 owns its security design).
- **Unknown / needs further validation:** Behaviour with a reachable SMTP relay and rejected recipients. Needs a real SMTP relay in a test environment.

### API-010 — Resfly SOAP parsing is dead but always "enabled"
*Confirmation: **Partial** · Phase 0 severity: unchanged · Related: SEC-017, DEP-010, ARCH-019*

- **Confirmed fact:** `LicenseUtility::isParsingEnabled()` returns `true` on every branch; `PARSING_ENABLED=false` only skips the status call. Callers (`CandidatesUI` add/parse, careers `resumeParse`, mass import) then create `SoapClient('wsdl/parse.wsdl')` and send the licence key and the full résumé text over plain HTTP to `soap.resfly.com`. `SoapFault` is caught; a missing `soap` extension is not (class-not-found fatal).
- **Evidence:**
  - `lib/License.php:687-706`, `:708-727`; `config.php:51`; `lib/ParseUtility.php:53`, `:60`, `:87-101`; `wsdl/parse.wsdl:78`; `modules/careers/CareersUI.php:521-541`; `modules/candidates/CandidatesUI.php:841-872`, `:1005-1008`; `modules/import/ImportUI.php:1373-1416`.
  - Runtime (verified part): with `PARSING_ENABLED=false`, the add-candidate page renders the parser layout ("Manually enter information / OR import resume", #22), i.e. `isParsingEnabled()` returned `true`.
  - Not exercised: the SOAP call itself (no parse action in the smoke run; containers had no internet). The host did not resolve in the Phase 0 sandbox probe (outside the app).
- **Impact:** The UI advertises a parser that cannot work; if the domain were ever re-registered by someone else, résumé text and the licence key from any install where a user parses would go to that party in cleartext; hosts without `soap` crash on these pages.
- **Severity:** HIGH — potential cleartext disclosure of candidate PII to a third party, with the precondition of the domain being re-registered.
- **Recommendation:** Make the parsing switch actually disable the integration and remove the dead service endpoint, so no candidate data can be sent to an unmaintained host.
- **Unknown / needs further validation:** Current ownership of `resfly.com`. Needs a registry lookup; no traffic should be sent.

### API-013 — ZIP lookup proxies anonymously to a keyless Google API
*Confirmation: **Partial** · Phase 0 severity: unchanged · Related: SEC-017, DEP-010*

- **Confirmed fact:** `ajax.php?f=zipLookup` uses the unauthenticated `AJAXInterface` and calls `simplexml_load_file('http://maps.googleapis.com/maps/api/geocode/xml?sensor=false&address=' . $zip)` with no key and no URL encoding; on failure it reads undefined variables, whose notices corrupt the XML when displayed.
- **Evidence:** `ajax/zipLookup.php:9-38`; `lib/ZipLookup.php:14-60` (`:23-26` request). The keyless URL returned `REQUEST_DENIED` in the Phase 0 sandbox probe (outside the app). The "Lookup" button is on the add-candidate form (#22); it was not clicked in the smoke run and the baseline had no internet.
- **Impact:** City/state autofill does nothing; anonymous users can make the server issue outbound requests.
- **Severity:** MEDIUM — broken helper feature plus a minor outbound-request exposure.
- **Recommendation:** Require login for the lookup and use a working, configured data source (the shipped `zipcodes` table exists), so the helper works and cannot be used anonymously.
- **Unknown / needs further validation:** Behaviour of the endpoint with outbound internet. Needs a test instance with controlled egress.

### API-018 — [Merged into ARCH-016] Queue/cron defects
The cron dependency, duplicate task files, name-vs-path task storage and the duplicated `case TASKRET_SUCCESS` in `QueueCLI.php:115-118` are covered in ARCH-016.

---

## 5. Import and export

**As built.** Import: CSV/TSV upload for candidates, companies and contacts (`modules/import/ImportUI.php:620-624`, `:699-703`; `lib/*Import.php`), with per-import revert (`ImportUI.php:69`), requiring `import.import ≥ EDIT` (`:742`); bulk résumé import reads files placed in `upload/` and processes 50 per AJAX call (`:1300-1327`, `import:processMassImportItem`), requiring `import.bulkResumes ≥ SA` (`:2027`). Export: candidate CSV (`m=export&a=export`) and any data grid (`exportByDataGrid`), quoted for `"` only; vCard 2.1 for contacts (`lib/VCard.php:54`, `:375`), gated `contacts.downloadVCard ≥ READ`. None of these were executed in the baseline.

### API-020 — Candidate CSV export has no access check and no formula-injection guard; import is CSV/TSV only
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: SEC-022, ARCH-007, PERF-016*

- **Confirmed fact:** `ExportUI` has no access-level check; with no IDs selected it exports every candidate's name, phones and e-mail. Cells are quoted only for `"`; values starting with `=`, `+`, `-` or `@` are not neutralised, and careers applicants control some of those values. Only candidates export through `Export`; other entities go through DataGrid. Import accepts CSV/TSV only, with no machine interface.
- **Evidence:** `modules/export/ExportUI.php:60-66`, `:77-127` (`grep` finds no `getUserAccessLevel`); `lib/Export.php:132-139`, `:161`; `lib/DataGrid.php:1451`, `:1463`; `lib/Candidates.php:665-670`; `modules/import/ImportUI.php:620-624`.
- **Impact:** Any logged-in user, including READ-only accounts, can export the whole candidate PII set; spreadsheets opened by recruiters may evaluate injected formulas.
- **Severity:** MEDIUM — bulk PII access by low-privileged users and a spreadsheet-injection risk.
- **Recommendation:** Put export behind an explicit permission and neutralise formula-leading characters in exported cells, so bulk PII access is deliberate and exported files are safe to open.
- **Unknown / needs further validation:** Behaviour for non-admin roles and with large data sets. Needs authorized role-based testing and production-size data.

---

## Reference material

### R1. `ajax.php` request and response contract

| Aspect | Behaviour | Evidence |
|---|---|---|
| Method | Any; parameters from `$_REQUEST`. The JS client always POSTs `application/x-www-form-urlencoded` | `ajax.php:63`, `:76`; `js/lib.js:308-315`, `:342-366` |
| Routing | `f=<fn>` → `ajax/<fn>.php`; `f=<module>:<fn>` → `modules/<module>/ajax/<fn>.php`; non-alphanumerics stripped (correct regex) | `ajax.php:76-92` |
| Unknown / missing `f` | `text/xml` envelope with `errorcode -1` | `ajax.php:63-74`, `:94-105` |
| Buffering | Output buffered; `AJAX_HOOK` eval; leading whitespace stripped per line unless `nospacefilter`; `$filters` eval; `nobuffer` bypasses all | `ajax.php:108-135` |
| Session | `SecureAJAXInterface` starts the `CATS` session and requires login; client also sends `&CATS=<session id>` in the body | `lib/AJAXInterface.php:202-222`; `lib/Session.php:555-558`; `js/lib.js:332-352` |
| Success envelope | `<data><errorcode>0</errorcode><errormessage></errormessage><response>…</response></data>` as `text/xml`, UTF-8 | `lib/AJAXInterface.php:47-53`, `:77-86`; `config.php:133` |
| Error envelope | Same with non-zero code (`-1` invalid input/not logged in, `-2` no data/operation error, by convention); message not escaped | `lib/AJAXInterface.php:61-69` |
| Other shapes | Plain text via `die()`, HTML fragments, CSV-like text | §2.1 |
| Client error detection | Searches the body for `'</b> on line <b>'` | `js/lib.js:443-446` |
| Timeout / caching | 15 s client timeout; random `rhash`; `Expires` in the past | `js/lib.js:50`, `:322-325`; `ajax.php:44-45` |
| Versioning, schema | None | — |

### R2. Machine-facing actions routed through `index.php`

| Route | Returns | Auth / access check | Evidence |
|---|---|---|---|
| `m=settings&a=ajax_tags_add\|ajax_tags_del\|ajax_tags_upd` | HTML fragment | Login only (Tags page itself requires SA) | `modules/settings/SettingsUI.php:232`, `:675-700` |
| `m=settings&a=ajax_wizard*` (11 actions) | Text/HTML | SA, except `ajax_wizardEmail` (READ, `:820`) | `SettingsUI.php:702-855` |
| `m=wizard&a=ajax_getPage` | HTML; evaluates PHP stored in `$_SESSION['CATS_WIZARD']` | Public module; data from session | `modules/wizard/WizardUI.php:82`, `:181` |
| `m=calendar&a=dynamicData&month&year` | Custom delimited event string | Login | `modules/calendar/CalendarUI.php:75`, `:305-338` |
| `m=export&a=export\|exportByDataGrid` | CSV `text/x-csv` | Login only (API-020) | `modules/export/ExportUI.php:60-66`, `:125`; `lib/DataGrid.php:1463` |
| `m=contacts&a=downloadVCard` | vCard 2.1 | `contacts.downloadVCard ≥ READ` | `modules/contacts/ContactsUI.php:175`; `lib/VCard.php:54`, `:375` |
| `m=attachments&a=getAttachment&id&directoryNameHash` | File, `Content-Disposition: inline` | Login + MD5 of directory; site filter bypassed (ARCH-013) | `modules/attachments/AttachmentsUI.php:59`, `:83-86`, `:127-130`; runtime #29 (downloads 200, correct sizes) |
| `m=import&a=massImport&step=…` | Text | `import.massImport ≥ EDIT` | `modules/import/ImportUI.php:1507` |
| `m=graphs&a=testGraph\|wordVerify\|jobOrderReportGraph\|generic\|genericPie` | Image | **Public** | `modules/graphs/GraphsUI.php:76-98` |
| `m=graphs&a=activity\|newCandidates\|newJobOrders\|newSubmissions\|miniPlacementStatistics\|miniJobOrderPipeline` | Image | Login | `GraphsUI.php:100-133`; runtime: 10 graph requests in the final run, all 200 |
| `m=toolbar&a=…` | Text/JS | Public (API-009) | `modules/toolbar/ToolbarUI.php:57-86` |

### R3. E-mail triggers (all synchronous, in-request)

| Event | Code path | Runtime |
|---|---|---|
| Ownership change of candidate / contact / company / job order | `lib/Candidates.php:341-351`, `lib/Contacts.php:279-290`, `lib/Companies.php:192-200`, `lib/JobOrders.php:250-258` | Not triggered |
| Pipeline status change (optional e-mail to candidate) | `lib/Pipelines.php:367-377` | #31 with e-mail unchecked: works |
| Careers application (applicant confirmation; owner/recruiter notice) | `lib/CareerPortal.php:452-470` via `CareersUI.php:1518`, `:1585`, `:1595` | Fatal after save (RT-04, #85, #86) |
| Calendar reminders | `modules/calendar/tasks/Reminders.php:93` → `lib/Calendar.php:945-966` | Needs scheduler; not run |
| Mass e-mail to candidates | `modules/candidates/CandidatesUI.php:3305-3370` | Fatal (RT-04, #79) |
| Test e-mail | `ajax/testEmailSettings.php:86-93` | Fatal text in AJAX box (RT-04, #77) |
| Forgot password | `modules/login/LoginUI.php:448-461` | Fatal before sending (RT-03, #04) |

Placeholders: `%DATETIME% %SITENAME% %USERFULLNAME% %USERMAIL%` (`lib/EmailTemplates.php`) plus careers `%CAND*%`/`%JBOD*%` (`CareersUI.php:1489-1512`). Successful sends are logged to `email_history` (`lib/Mailer.php:363-391`).

### R4. Careers portal page map

| `p=` / sub-action | Method | Purpose | Evidence | Runtime |
|---|---|---|---|---|
| (none) | GET | Home / registered-candidate login block | `CareersUI.php:856-935` | #80 |
| `showAll` | GET | Job list (honours `allowBrowse`) | `:151-179` | #81 |
| `showJob&ID=` | GET | Job detail (checks `public`) | `:793-855` | #82 |
| `search`, `searchResults` | GET | Empty branches; template only | `:180-182`, `:856-858` | #83 (page renders) |
| `candidateRegistration&ID=` | GET | "Applied before?" gate (registration only) | `:359-411` | Not tested |
| `applyToJob&ID=` (+ `resumeLoad`, `resumeParse`, `processLogin`) | GET/POST | Application form; stage or parse a résumé | `:412-714` (`resumeParse` `:521-541`) | #84; `resumeLoad` used in #86 |
| `onApplyToJobOrder` | POST multipart | Create/update candidate, attachment, pipeline, activity, questionnaire, e-mails | `:715-792`, `:1190-1600` | #85, #86 (saved; then RT-04) |
| `registeredCandidateProfile`, `onRegisteredCandidateProfile` | GET/POST | Profile view/update, résumé replace | `:183-358` | Not tested |
| `pa=logout` | POST | Clear portal cookie | `:134-141` | Not tested |
| `?templateName=` | GET | Any visitor can switch templates | `:106-108` | Not tested |

---

## Area-level unknowns

1. **Third-party consumers.** Whether external scripts call `ajax.php` or the feeds today; any such consumer depends on an undocumented contract. Validate with access logs from real installations.
2. **Deployed web-server rules and PHP flags.** Whether `QueueCLI.php`, `rebuild_old_docs.php`, `scripts/`, `modules/*/ajax/*.php`, `attachments/` and `upload/` are blocked, and the effective `session.cookie_*`, `display_errors` and `register_argc_argv` settings. Validate by reviewing deployment configurations; the repo ships none for nginx.
3. **Security behaviour of the RPC and portal.** API-002/004/005/006/007/008 are code findings only. Validate with authorized security testing on an isolated instance (no such testing was done or allowed here).
4. **Role behaviour.** Outcomes for READ/EDIT/sourcer/careerportal users across the RPC (baseline used only `admin`). Validate with authorized role-based testing.
5. **Mail with a working relay.** Behaviour when SMTP is reachable but rejects recipients or times out. Validate with a real SMTP relay in a test environment.
6. **Job-board ingestion.** Whether current Indeed or other boards accept the XML output. Validate with the boards' current feed validators.
7. **External hosts.** Ownership of `resfly.com` and the status of `www.catsone.com/catsnewversion.php`. Validate with registry lookups, without sending application data.
8. **Candidate registration in the field.** How many installations enable registration or custom portal templates (affects API-004 reach). Validate with field data.
9. **INSTALL_BLOCK reliability.** Whether the lock file reliably exists after installation and upgrades (if missing, the installer RPC is open). Validate on real installations.

## Changes from the Phase 0 edition

- **Re-rated:** API-001 HIGH → MEDIUM (absence of a capability, not a broken workflow, under this edition's scale).
- **Merged:** API-018 → ARCH-016 (queue/cron defects duplicated the architecture finding); API-019 → ARCH-001 (same PHP 8 blockers). Stubs kept.
- **New:** API-023 (careers apply drops an unstaged résumé; RT-12).
- **Upgraded to Runtime:** API-011 (RT-03, RT-04), API-012 (RT-05; #89 shows hard-coded company/country, empty postal code and double-encoded URL), API-015 (#77 PHP fatal returned inside an AJAX response with HTTP 200). Partial: API-010 (#22 parser UI shown with `PARSING_ENABLED=false`), API-013 (code plus an out-of-app probe).
- **Security-owned findings shortened:** API-002, API-004, API-005, API-006, API-007, API-008 now state the weakness, location, reach and impact, and point to SEC-024, SEC-025, SEC-026, SEC-004, SEC-027, SEC-028; attack-oriented wording from Phase 0 was removed.
- **Corrected facts:** hook implementations are 10 (not 3) and hook names 251 (not 232) (API-017); `Candidates::update()` has 32 parameters (API-003); careers `p=search` renders a page but performs no search (§3.1, runtime #83); the XML feed's double encoding and hard-coded employer are now shown at runtime.
- **Removed:** the Phase 0 "Recommendations: target API design" section (§7: REST/OpenAPI design, auth scopes, resource model, event catalogue, adapters, migration order). Per the brief, target designs are out of scope; the findings above state only what is missing.

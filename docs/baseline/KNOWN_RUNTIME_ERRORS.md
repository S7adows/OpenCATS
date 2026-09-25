# Known Runtime Errors — current OpenCATS baseline (Phase 0.5)

Every error below was **observed while running the current code** (commit `f50734a`, app files = `d607279`) on PHP 7.2.16 / nginx 1.17.3 / MariaDB 10.7.8. Nothing was fixed. Evidence paths are relative to `docs/baseline/`. Step numbers (#NN) refer to the final smoke run (`evidence/final-run/results.json`, screenshots `screenshots/NN-*.png`).

**Classification**
- **APP** — defect in the application code as committed.
- **DEP** — caused by a pinned dependency version (`composer.lock`).
- **CONFIG** — caused by a committed default in `config.php`.
- **ENV** — depends on how the app is deployed; would differ in another topology.

**Baseline impact:** *Blocking* (feature cannot be used) · *Major* (feature partly works, data loss or user-visible fatal) · *Minor* (cosmetic, or warning text on a working page).

Cross-references to the Phase 0 audit (`docs/audit/`) are given where the same defect was found by reading code.

---

## Summary

| ID | Area | Symptom | Class | Impact |
|---|---|---|---|---|
| RT-01 | Install (demo data) | Every request fatals: `mysql_real_escape_string()` undefined | APP | Blocking (demo path) |
| RT-02 | Install (unseeded DB) | 24 PHP warnings on login page; migrations create 16 tables in an empty DB | APP | Minor |
| RT-03 | Login → forgot password | Fatal `Users::getPassword()` undefined, stack trace shown | APP | Blocking (feature) |
| RT-04 | All outbound e-mail | Uncaught PHPMailer exception → PHP fatal page with stack trace | APP (+ENV trigger) | Major |
| RT-05 | RSS feed / careers "RSS Feed" button | Fatal: `LEGACY_ROOT` undefined, `CATSUtility` not found | APP | Blocking (feature) |
| RT-06 | Company detail | 3 × `count(): Parameter must be an array…` warnings printed in page | APP | Minor |
| RT-07 | Rich-text editors | CKEditor 4.25.1 refuses to start ("license key is missing or invalid"); plain textareas | DEP | Major |
| RT-08 | Resume/attachment indexing | PDF text not extracted (`sh: \path\to\pdftotext: not found`); PDFs not searchable | CONFIG | Major |
| RT-09 | Job-order PDF report | FPDF error: graph image fetched over HTTP from `Host` not reachable | ENV (app design) | Blocking (this topology) |
| RT-10 | EEO report page | JS error `Cannot read properties of undefined (reading 'focus')` | APP | Minor |
| RT-11 | E-mail candidates (compose) | Warning `Invalid argument supplied for foreach()` in `lib/DataGrid.php:248` | APP | Minor |
| RT-12 | Careers application | Resume silently discarded unless the applicant clicks "Upload" before submitting | APP | Major (data loss) |
| RT-13 | Forgot-password page | Missing images `images/login.gif`, `images/security.gif` (404) | APP | Minor |
| RT-14 | Layout | Not responsive: 978 px page width at 390 px viewport; header overlap; clipped "NO DATA" watermark | APP | Minor/Major (mobile) |
| RT-15 | Error handling | PHP fatals are served as **HTTP 200** with stack traces and server paths | APP + ENV default | Major |
| RT-16 | Careers site default | Careers URL returns an empty page (`<!-- Job Board Disabled -->`) until enabled | APP (by design) | Minor |
| RT-17 | Attachments under nginx | Stored files downloadable by direct URL without a session (`.htaccess` not honoured) | ENV + APP design | Observation (security) |

Not observed: HTTP 4xx/5xx from PHP routes (all 206 nginx-logged requests in the final run were 200/302), SQL errors in pages during the final run, slow pages (see §Performance).

---

## Details

### RT-01 — Demo-data install leaves the application unusable on PHP 7.2
- **Where:** `modules/install/Schema.php` migration `'225'` (starts line 702; call at line 725) calls `mysql_real_escape_string()`; migration `'341'` (starts line 1232; call at line 1236) has the same call. The `mysql_*` extension was removed in PHP 7.0.
- **Trigger:** load the installer's demo dataset (`db/cats_testdata.bak`), then request any page. The runner (`lib/ModuleUtility.php:processModuleSchema`) executes migrations 51→224, then dies in 225. The version is not saved, so the next request dies again.
- **Observed:** `Fatal error: Uncaught Error: Call to undefined function mysql_real_escape_string() in lib/ModuleUtility.php(542) : eval()'d code:24` on `/index.php` (login) and `/careers/index.php`.
- **Also:** `db/upgrade-0.9.4-0.9.5.sql` fails with `ERROR 1054 Unknown column 'questionnaire_id' in 'joborder'` during `upgradeCats` (installer ignores SQL errors).
- **Evidence:** `evidence/demo-data-path/seed-demo.log`, `migration-request.html`, `demo-second-request.html`, `php_errors.log`.
- **Class / impact:** APP · Blocking for the demo path. The empty-install path is unaffected because `db/cats_schema.sql` already records `install` at version 363. **INFERENCE:** any upgrade of an old (pre-225) database on PHP 7 hits the same fatal.

### RT-02 — Requests against an unseeded database
- **Trigger:** `INSTALL_BLOCK` present but database empty (e.g. containers started before seeding).
- **Observed:** login page renders with 23 × `mysqli_fetch_assoc() expects parameter 1 to be mysqli_result, boolean given in lib/DatabaseConnection.php:321` and 1 × same in `modules/install/scripts/150.php:56`; the migration runner then created 16 tables (career portal, EEO types, http_log, queue, xml_feeds, …) in the empty schema.
- **Evidence:** `evidence/empty-db-before-seed/first-request.html`.
- **Class / impact:** APP · Minor (operator error path), but it leaves a half-built schema behind.

### RT-03 — Forgot password is a fatal error
- **Where:** `modules/login/LoginUI.php:455` calls `Users::getPassword()`, which does not exist.
- **Observed (#04):** submitting the forgot-password form for `admin` → `Fatal error: Uncaught Error: Call to undefined method Users::getPassword()` with stack trace. No e-mail attempted.
- **Evidence:** `screenshots/04-15-email-forgot-password-submit-for-admin.png`; `evidence/final-run/php_errors.log`.
- **Cross-ref:** Phase 0 `SECURITY_AUDIT.md` SEC-002 (forgot-password path).
- **Class / impact:** APP · Blocking for self-service password recovery.

### RT-04 — Any e-mail send failure becomes a PHP fatal error
- **Where:** `lib/Mailer.php:241/134` → PHPMailer (`vendor/phpmailer/phpmailer/src/PHPMailer.php:2233`) throws `PHPMailer\PHPMailer\Exception`; nothing catches it.
- **Trigger in this baseline:** committed config uses SMTP `localhost:587` with TLS/auth; no SMTP server exists in the environment (by design — test data only).
- **Observed:**
  - *Settings → E-Mail → Send Test E-Mail* (#77): the AJAX result box shows "An error occurred. Fatal error: Uncaught PHPMailer…Exception: SMTP Error: Could not connect to SMTP host…" with stack trace.
  - *Candidates → select → E-Mail → Send* (#79): full-page fatal error.
  - *Careers application submit* (#85, #86): the **applicant** sees a raw fatal error page. The stack trace includes the e-mail subject ("Thank You for Y…") and the start of the applicant's address. The application itself **was saved** before the failure (candidate, pipeline row with status 100 "No Contact", activity "User applied through candidate portal"), but the later notification steps did not run. `email_history` stayed empty.
- **Evidence:** `screenshots/77-*.png`, `79-*.png`, `85-*.png`, `86-*.png`; `evidence/final-run/php_errors.log` (4 fatals).
- **Class / impact:** APP (no exception handling) with an ENV trigger · Major. **UNKNOWN:** behaviour with a reachable SMTP server was not tested (no real mail allowed).

### RT-05 — RSS feed is broken (and linked from the careers site)
- **Where:** `rss/index.php:37` uses `LEGACY_ROOT` before `config.php` defines it.
- **Observed (#88):** `Warning: Use of undefined constant LEGACY_ROOT`, `include_once(LEGACY_ROOT/lib/CATSUtility.php): failed to open stream`, then `Fatal error: Uncaught Error: Class 'CATSUtility' not found in rss/index.php:38`. HTTP status 200, content-type text/html.
- **Broken link:** every careers page has an "RSS Feed" shortcut button pointing to `../rss/`.
- **Evidence:** `screenshots/88-12-careers-portal-rss-job-feed.png`; PHP log. The XML feed (`/xml/`) works (#89, `text/xml`).
- **Class / impact:** APP · Blocking for RSS.

### RT-06 — Warnings printed on the company detail page
- **Where:** `modules/companies/Show.tpl:311`, `:349`, `:393` — `count()` on a non-array (PHP 7.2 warns).
- **Observed (#10, #11):** three warning lines rendered at the top of the company page on every view.
- **Class / impact:** APP · Minor (page works; warnings visible to users because `display_errors=On`).

### RT-07 — Rich-text editing does not start (CKEditor licence check)
- **Where:** `composer.lock` pins `ckeditor/ckeditor` **4.25.1**; the browser console reports: *"[CKEDITOR]: The license key is missing or invalid. If you suddenly started to see this message, this may mean you accidentally updated CKEditor 4 to the LTS version (4.23.0 and above). This version of the editor is under commercial terms…"*
- **Observed:** on *Job Orders → Add* (#19, `S1`) and *E-Mail candidates* (#78, `S2`) the editor script loads (`window.CKEDITOR` defined) but **no editor instance is created**; the fields stay plain `<textarea>`s. One aborted request for `vendor/ckeditor/ckeditor/contents.css`. Other CKEditor pages (e-mail templates, career-portal template editor) were not individually checked. **INFERENCE:** same behaviour everywhere the editor is used.
- **Class / impact:** DEP · Major (formatting unavailable; content still saves as plain text).

### RT-08 — PDF (and other tool-based) text extraction is disabled by default
- **Where:** `config.php` sets `PDFTOTEXT_PATH` (and antiword/html2text/unrtf) to placeholders like `\path\to\pdftotext`, although the PHP image has the real tools under `/usr/bin` and `/usr/local/bin`.
- **Observed:** uploading `portfolio_alex.pdf` (#27) → "The file has been successfully attached, but OpenCATS was unable to index the resume keywords…"; FPM stderr `sh: \path\to\pdftotext: not found`; the attachment row has `text = NULL`; resume search for the PDF's unique keyword finds nothing (#43, negative result). TXT (#42) and DOCX (#44, #87) are indexed and searchable.
- **Class / impact:** CONFIG · Major for recruiters relying on PDF resume search. (Config not changed in this phase.)

### RT-09 — Job-order PDF report fails in the two-container topology
- **Where:** the report builds `http://<HTTP_HOST>/index.php?m=graphs&a=jobOrderReportGraph…` and FPDF loads it with `getimagesize()` from inside PHP (`lib/fpdf/fpdf.php:1508`).
- **Observed (#54):** response is HTML: `Warning: getimagesize(http://localhost:8080/…): failed to open stream: Connection refused` + `FPDF error: Missing or incorrect image file`.
- **Control check:** the same request sent with `Host: web` (a name the PHP container can reach) returns a valid 1-page PDF (`application/pdf`, 37 KB) — `evidence/final-run/joborder-report-with-internal-host.pdf`.
- **Class / impact:** ENV (depends on the PHP host being able to reach its own public URL) · Blocking in the repo's Docker setup; **INFERENCE:** works on single-host installs where `http://<Host>/` resolves locally.

### RT-10 — JavaScript error on the EEO report page
- **Where:** `modules/reports/EEOReport.tpl:159` calls `document.jobOrderReportForm.siteName.focus()`; the EEO form has no `siteName` field.
- **Observed (#52):** 2 × page error `Cannot read properties of undefined (reading 'focus')` (customize page and preview). The preview itself renders.
- **Class / impact:** APP · Minor.

### RT-11 — Warning when opening "E-Mail" from the candidate list
- **Where:** `lib/DataGrid.php:248` (`foreach` over a non-array).
- **Observed (#78):** warning line rendered on the compose page reached from *Candidates → select → E-Mail*.
- **Class / impact:** APP · Minor.

### RT-12 — Careers application silently drops the resume unless "Upload" is clicked
- **Where:** the apply form's visible file input is `resumeFile`; the *Upload* button (`resumeLoad`) posts it and stores it as the hidden `file` value. On final submit, `modules/careers/CareersUI.php` (`onApplyToJobOrder`) only attaches `$_FILES['file']` or `$_POST['file']`, so a file chosen but not "uploaded" is ignored without any message.
- **Observed:** Jordan (#85: file chosen, submit) → candidate + pipeline created, **no attachment**. Morgan (#86: Choose File → Upload → submit) → attachment stored, text indexed, found by resume search (#87).
- **Class / impact:** APP · Major (applicant data loss without feedback).

### RT-13 — Missing images on the forgot-password page
- **Observed (#03):** `GET /images/login.gif` and `/images/security.gif` → 404 (browser console errors, broken images; nginx error log `open() … failed (2: No such file or directory)`).
- **Class / impact:** APP · Minor.

### RT-14 — Layout problems
- **Not responsive.** At 390 px viewport: candidates list page width 978 px (#92), dashboard 978 px with the user/role line drawn over the tab row (`S4`), candidate detail 978 px (`S5`), careers job list 940 px (#93). Only the login page fits (390 px, `S6`). The e-mail compose page is 1325 px wide even on a 1280 px desktop viewport (`S2`).
- **Dashboard empty states.** "Recent Hires" repeats a "NO DATA" watermark that is clipped at the panel edge ("NO D"); "Hiring Overview" draws placeholder bars behind "NO DATA" (#06, #90).
- **Raw error pages.** Fatal errors (RT-03/04/05) replace the whole page with unstyled PHP output, including on the candidate-facing careers site.
- **Class / impact:** APP · Minor on desktop, Major on phones.

### RT-15 — Errors are invisible to HTTP monitoring and leak internals
- **Observed:** every PHP fatal in this run was served with **HTTP 200** (nginx access log: only 200 and 302 in 206 requests), and the page body contains stack traces with absolute server paths (`/var/www/public/...`) and call arguments. This is the combination of the image default `display_errors=On` and the application having no error handler.
- **Class / impact:** APP + ENV default · Major (monitoring blind spot; information disclosure to applicants).

### RT-16 — Careers site is blank until enabled
- **Observed:** `/careers/index.php` returns `<html><body><!-- Job Board Disabled --></body></html>` on a fresh install; enabling *Settings → Administration → Careers Website* fixes it (#75, an application setting stored in the DB).
- **Class / impact:** APP (by design) · Minor — but there is no user-facing message.

### RT-17 — Attachment files are directly reachable under nginx (observation)
- **Observed:** an unauthenticated `GET /attachments/site_1/0xxx/<hash>/resume_alex.txt` returned 200 with the file. The repo protects these folders only with Apache `.htaccess` files, which nginx ignores. The application itself links to the raw path in activity notes ("…attached a new resume (<a href="./attachments/site_1/0xxx/…/resume_morgan.docx">Download</a>)").
- **Scope:** security-relevant; recorded only, not explored further (out of scope for this phase).
- **Cross-ref:** Phase 0 `SECURITY_AUDIT.md` SEC-008/SEC-009 (attachment access).
- **Class / impact:** ENV (web server) + APP design · Observation.

---

## By category (as requested)

| Category | Items |
|---|---|
| PHP / runtime errors | RT-01, RT-02, RT-03, RT-04, RT-05, RT-06, RT-11 (+ RT-09 warning). Final run PHP log: 3 distinct fatal errors (6 occurrences) and 8 distinct warnings (`evidence/final-run/php_errors.log`) |
| Browser console errors | CKEditor licence error on every editor page (RT-07); 2 × 404 on forgot-password page (RT-13) |
| JavaScript errors | RT-10 (2 page errors). No other uncaught JS errors in 94 steps |
| Server errors | None as HTTP status (RT-15). nginx error log: only the two missing images. FPM stderr: `\path\to\pdftotext: not found` (RT-08) |
| Database errors | Demo path: 1 SQL error in `upgrade-0.9.4-0.9.5.sql` (RT-01). Final run: none in pages or logs. MariaDB log: startup warnings only (`max_open_files`, `--skip-name-resolve`, IPv6 socket) |
| Broken links | Careers "RSS Feed" → fatal (RT-05); job-order "Generate Report" PDF (RT-09, topology-dependent); forgot-password flow (RT-03) |
| Layout problems | RT-14 |
| Slow pages | None observed (see below) |
| Missing assets | `images/login.gif`, `images/security.gif` (RT-13); aborted `contents.css` load (RT-07) |

## Performance (observed, small dataset)

- Server time to first byte for 14 main pages, 3 samples each with curl: **24–46 ms**; slowest nginx `request_time` in the final run: 73 ms (first `/index.php`). Browser `load` events: 12–150 ms.
- Longest step durations in the harness (3–5 s) come from deliberate waits (autocomplete debounce, popup close), not from the server.
- **INFERENCE:** these numbers only show that nothing is pathologically slow on an almost empty database; Phase 0 `PERFORMANCE_AUDIT.md` concerns (LIKE/REGEXP search, per-row queries) need realistic data volumes to measure.

## Latent issues not measured

The image's PHP 7.2 default `error_reporting` hides notices, strict and deprecation messages. Their count was not measured in this baseline; it is relevant to any PHP 8 migration.

# Smoke Test — current OpenCATS baseline (Phase 0.5)

**Verdict: the current application runs.** 14 of the 15 requested areas are usable in this environment; e-mail sending could not be verified (no mail server, by design) and every e-mail attempt ends in an uncaught PHP fatal error. Nothing was fixed.

| | |
|---|---|
| Code | commit `f50734a` (application files = `d607279`), OpenCATS 0.9.7.4 |
| Stack | PHP 7.2.16 FPM · nginx 1.17.3 · MariaDB 10.7.8 (`ENVIRONMENT.md`) |
| Data | Empty install + fictional records created through the UI (`INSTALLATION.md` §4) |
| Method | Playwright + headless Chromium 141, 1280×900 (plus 390×844 for layout); 94 scripted steps (`smoke/smoke.js`) + 6 supplementary captures (`smoke/supplement.js`) + curl checks |
| Final run | 2026-09-25 22:58:43Z → 23:00:23Z, from a freshly restored post-install database |
| Evidence | `evidence/final-run/` (`results.json`, `console-summary.log`, `php_errors.log`, `nginx.log`, `php-fpm.log`, `mariadb.log`); screenshots in `screenshots/` (#NN = step number) |

**What was captured on every step:** PHP warnings/notices/fatal text in the HTML of every frame (incl. popups), uncaught JS errors, console errors/warnings, failed requests, HTTP ≥ 400 responses, broken images, JS dialogs, navigation timing, full-page screenshot.

**Legend:** ✔ = applies. *Works* = the user goal was achieved. *Broken* = the user goal was not achieved. *Error* = a runtime error was observed (PHP, JS, console, missing asset) even if the goal was achieved. `RT-xx` → `KNOWN_RUNTIME_ERRORS.md`.

---

## 1. Checklist (requested format)

| Feature | Works | Broken | Error | Notes |
|---|:-:|:-:|:-:|---|
| **1. Login** | ✔ | | | Login page (#01); wrong password → "Invalid username or password." (#02); admin/admin → Dashboard (#05); logout → login page (#94). Default admin password is `admin` after install. |
| **2. Dashboard** | ✔ | | | Home widgets render empty (#06) and with data (#90): recent calls, upcoming calls/events, recent hires, hiring-overview graph, important-candidates grid. Activities (#07, #91) and Lists (#08) tabs load. Cosmetic: clipped "NO DATA" watermark (RT-14). |
| **3. Candidates** | ✔ | | | List before/after (#21, #25); add with resume upload that pre-fills the text box (#22, #23); duplicate warning shown when adding the same name/e-mail again (#24); edit + save (#33). |
| **4. Candidate detail** | ✔ | | | Detail page with attachments, pipelines, activities (#26, #32); add to job order via popup search (#30); status change No Contact → Contacted + activity note (#31; the "send e-mail" option is unchecked by default and was left unchecked); resume text popup (#34). |
| **5. Jobs** | ✔ | | ✔ | List (#17); "Add Job Order" popup offers Empty / Copy Existing (#18); add public job order with company autocomplete (#19); detail + pipeline (#20). **Error:** CKEditor refuses to start (licence check) → description is a plain textarea (RT-07, `S1`). |
| **6. Companies** | ✔ | | ✔ | List (#09); add (#10); edit page (#12). **Error:** company detail prints 3 PHP `count()` warnings on every view (#10, #11 — RT-06). |
| **7. Contacts** | ✔ | | | List (#13); add with company autocomplete (#14); detail (#15); cold-call list (#16). |
| **8. Calendar** | ✔ | | | Month view (#35); add event (event type is required — client-side validation alert if missing) (#36); upcoming events (#37); the event appears on the dashboard (#90). |
| **9. Search** | ✔ | | | Header quick search finds candidate, company, contact and job order (#38); candidate search by name / key skills / city (#39–#41); job order, company, contact search (#46–#48). Resume keyword search: see row 14. Results were checked outside the "Recent" bar to avoid false positives. |
| **10. Reports** | ✔ | ✔ | ✔ | Works: reports tab (#49), submission and placement reports (#50, #51), EEO report preview (#52), job-order report form (#53), pipeline graph image (#55). **Broken:** job-order **PDF** report returns an FPDF error in this Docker topology (#54 — RT-09; the same request succeeds when the PHP container can reach the request host). **Error:** JS error on the EEO page (RT-10). |
| **11. Settings** | ✔ | | | My profile, change-password page (#56, #58); Administration and 15 admin pages all load with HTTP 200 and no PHP errors (#57, #59–#73); add user riley.test (#74); enable careers website (#75). Not executed on purpose: creating a backup, running an import, changing passwords, renaming the site. |
| **12. Careers portal** | ✔ | ✔ | ✔ | Blank page until enabled in Settings (RT-16). After enabling: home (#80), all jobs incl. the public test job (#81), job detail (#82), search page (#83); XML feed works (#89). **Broken + Error:** RSS feed is a PHP fatal error, and the careers "RSS Feed" button links to it (#88 — RT-05). |
| **13. Candidate application** | ✔ | ✔ | ✔ | Apply form (#84). With *Choose File → Upload → Submit* the candidate, pipeline row, activity and resume are saved and the resume is searchable (#86, #87). **Error:** the applicant is shown a raw PHP fatal error (SMTP exception) after submitting (RT-04, RT-15). **Broken:** if the applicant chooses a file but does not click "Upload", the resume is silently discarded (#85, #87 — RT-12). |
| **14. Resume / document handling** | ✔ | ✔ | | Upload via add-candidate form (#22) and attachment popup: PDF, DOCX (#27, #28); downloads return 200, correct sizes (187 / 674 / 1359 bytes), `Content-Disposition: inline` (#29); resume text view (#34); keyword search finds TXT and DOCX content, negative control finds nothing (#42, #44, #45). **Broken:** PDF text is not extracted, so PDFs are not searchable — `config.php` ships placeholder tool paths (#27, #43 — RT-08). Careers upload: see row 13. |
| **15. E-mail** | | ✔ | ✔ | Safely testable parts only (no SMTP server, `example.test` addresses). E-mail settings page loads (#76). **Broken + Error:** forgot password → fatal `Users::getPassword()` (#04 — RT-03); send test e-mail (#77), e-mail candidates send (#79) and careers notifications (#85, #86) all end in an uncaught PHPMailer exception shown as a PHP fatal error (RT-04). Compose page shows a PHP warning and CKEditor error (#78 — RT-11, RT-07). **Unverified:** delivery with a working SMTP server. |

**Layout (cross-cutting):** not responsive — at 390 px the recruiter pages are 978 px wide and the header overlaps; careers pages are 940 px wide (#92, #93, `S4`–`S6`) — RT-14.

## 2. Totals

| Measure | Count |
|---|---|
| Requested areas | 15 |
| Working without runtime errors | 8 (Login, Dashboard, Candidates, Candidate detail, Contacts, Calendar, Search, Settings) |
| Working with runtime errors | 2 (Jobs, Companies) |
| Partly broken | 4 (Reports, Careers portal, Candidate application, Resume/document handling) |
| Broken / not verifiable in this environment | 1 (E-mail) |
| Scripted steps (final run) | 94 — 92 completed as expected, 2 functional failures (#43 PDF keyword search, #54 job-order PDF); further defects were recorded as errors on steps that completed (#04, #77, #79, #85, #86, #88) |
| Distinct PHP errors in log | 3 fatal (6 occurrences), 8 warnings |
| Uncaught JS errors | 2 (EEO page) |
| HTTP 4xx/5xx | 2 × 404 (missing images); PHP fatals are served as 200 (RT-15) |
| Slow pages (> 1 s server time) | 0 — max 73 ms on a near-empty DB |

## 3. How the run was conducted

1. Clean install (empty-database path) and post-install DB snapshot.
2. Two exploratory passes (login + form discovery, read-only link crawl) and two harness-debugging runs. The failures fixed between runs were **in the test script** (it clicked the header "Go" button instead of a form's Save/Submit, looked for a submit button where the careers page uses an image, did not select a calendar event type, and matched text in the "Recent" bar). No application file was touched.
3. Final run from the restored snapshot with emptied upload folders and a truncated PHP log; logs collected afterwards.
4. Supplementary checks: curl timings (3 samples × 14 pages), job-order PDF with an internal `Host` header, one unauthenticated request for a stored attachment file, supplementary screenshots `S1`–`S6`.

The post-install snapshot was taken after the two exploratory logins, so it contains two `user_login` rows and saved grid-column preferences for the admin user; it contains no business data.

## 4. Not covered

- Real e-mail delivery, LDAP login, resume parsing service (`PARSING_ENABLED` false), mass import, backup/restore execution, the Outlook/Firefox toolbar module, candidate self-registration on the careers site, questionnaires, saved lists beyond opening the tab, hot lists, merges of duplicate records, multi-user permission differences (only the administrator account was used).
- Security testing (out of scope for this phase; see Phase 0 `docs/audit/SECURITY_AUDIT.md`). One observation was recorded (RT-17).
- Browsers other than Chromium; realistic data volumes.

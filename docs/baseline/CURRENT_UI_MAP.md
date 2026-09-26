# Current UI Map — OpenCATS 0.9.7.4 as it runs today (Phase 0.5)

A map of the screens that were actually opened while running the current application, how they are reached, and the interaction patterns they use. Built from the running app (read-only link crawl `smoke/crawl.js` + the smoke run), not from code reading alone. Screenshot numbers refer to `screenshots/` (see `CURRENT_SYSTEM_SCREENSHOTS.md`).

Routing: every recruiter screen is `index.php?m=<module>&a=<action>&…`; AJAX calls go to `ajax.php` (`f=<module>:<function>`); the careers site is `careers/index.php?p=<page>`.

---

## 1. Global layout (every recruiter page)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [opencats logo]                              OpenCATS.org · Logout             │
│                               <User> <username> (<site name>)  <Access level> │
│ [Dashboard][Activities][Job Orders][Candidates][Companies][Contacts][Lists]    │
│ [Calendar][Reports][Settings]                        ← tab row (10 tabs)      │
│ ─ blue sub-navigation bar: module actions (e.g. Add Candidate · Search …) ─    │
│ Recent: <last 5 records visited, "MRU">                Quick Search: [____][Go]│
│ ┌─ page title with icon ────────────────────────────────────────────────────┐ │
│ │ content (fixed-width tables, data grids, forms)                           │ │
│ └───────────────────────────────────────────────────────────────────────────┘ │
│         OpenCATS Version 0.9.7.4. Powered by OpenCATS.  Server Response Time   │
└──────────────────────────────────────────────────────────────────────────────┘
```
- Desktop-only layout: at 390 px width the page stays ~978 px wide and the user line overlaps the tabs (`S4`, #92).
- Quick Search (`m=home&a=quickSearch`) searches candidates, companies, contacts and job orders together (#38).
- "Recent" bar (`#MRUPanel`) links to the last visited records.

## 2. Screens by tab

### Login (unauthenticated)
| Screen | URL | Notes | Shot |
|---|---|---|---|
| Login | `index.php` / `m=login` | username, password; page JS also defines `defaultLogin()` (admin/cats) and `demoLogin()` (john@mycompany.net/john99) helpers | #01, `S6` |
| Failed login | POST `m=login&a=attemptLogin` | "Invalid username or password." | #02 |
| Forgot password | `m=login&a=forgotPassword` | two images missing; submitting → PHP fatal (RT-03) | #03, #04 |
| Logout | `m=logout` | back to login | #94 |

### Dashboard — `m=home`
Widgets: My Recent Calls · My Upcoming Calls · My Upcoming Events · Recent Hires · Hiring Overview (graph image `m=graphs&a=miniPlacementStatistics`, weekly/monthly/yearly) · Important Candidates grid (submitted/interviewing/offered in active job orders; AJAX paging). Shots #06, #90.

### Activities — `m=activity`
Period filters Today / Yesterday / Last Week / Last Month / Last 6 Months / All (`a=viewByDate&period=…`); data grid of activities. Shots #07, #91.

### Job Orders — `m=joborders`
| Screen / action | URL or trigger | Shot |
|---|---|---|
| List (filter "Active / On Hold / Full", data grid) | `m=joborders` | #17 |
| Add Job Order chooser (popup: Empty / Copy Existing) | `showPopWin('m=joborders&a=addJobOrderPopup')` | #18 |
| Add form (company autocomplete or "Internal Postings", contact, type, openings, recruiter, owner, Hot, **Public**, description, notes) | `a=add` | `S1` |
| Detail: fields, attachments, description, "Status of Candidates" graph, pipeline grid; actions Edit · Delete · Administrative Hide · Generate Report · View History · Add Candidate to This Job Order (popup `a=considerCandidateSearch`) · Export | `a=show&jobOrderID=` | #20 |
| Search | `a=search` | #46 |
| Grid actions on selection | Add to list (popup `m=lists&a=addToListFromDatagridModal`), Export (`m=export`) | — |

### Candidates — `m=candidates`
| Screen / action | URL or trigger | Shot |
|---|---|---|
| List (data grid, attachments icon, row checkboxes) | `m=candidates` | #21, #25 |
| Selection actions | Add to list (popup), Add to pipeline (popup `a=considerForJobSearch`), E-mail (`a=emailCandidates`), Export | — |
| Add form: resume file → "Upload" pre-fills a text box (`loadDocument`); contact, address (address-block parser, ZIP lookup), relocation, pay, source, key skills, notes | `a=add` | #22, #23 |
| Duplicate notice after add | `a=show` (banner) + "Link duplicate" popup `a=linkDuplicate` | #24 |
| Detail: contact data, misc notes, upcoming events (Schedule Event), attachments (view text 🔍, delete), Add Attachment (popup `a=createAttachment`), tags (popup `a=addCandidateTags`), Edit · Delete · View History · Administrative Hide · Link duplicate; job orders grid with rating, status, per-row "log activity / change status" (popup `a=addActivityChangeStatus`) and remove; lists; activity log + Log an Activity | `a=show&candidateID=` | #26, #32 |
| Add to job order (popup search by title/company → pick) | `a=considerForJobSearch` | #30 |
| Change status / log activity (status list 100–800, activity type, note, optional event, optional e-mail) | `a=addActivityChangeStatus` | #31 |
| Resume text viewer (new window) | `a=viewResume&attachmentID=` | #34 |
| Edit | `a=edit&candidateID=` | #33 |
| Search: by Candidate Name / Resume Keywords / Key Skills / City, recent + saved searches, Advanced | `a=search` | #39–#45 |
| E-mail compose (to, subject, template, body, preview) | `a=emailCandidates` | #78, `S2` |

Pipeline statuses seen in the UI: 100 No Contact · 200 Contacted · 250 Candidate Responded · 300 Qualifying · 400 Submitted · 500 Interviewing · 600 Offered · 650 Not in Consideration · 700 Client Declined · 800 Placed.

### Companies — `m=companies`
| Screen / action | URL | Shot |
|---|---|---|
| List | `m=companies` | #09 |
| Add (name, address block, phones, fax, URL, departments, Hot, key technologies, notes) | `a=add` | — |
| Detail: fields, attachments, Edit · Delete · View History, Job Orders grid + Add Job Order, Contacts grid + Add Contact | `a=show&companyID=` | #10, #11 |
| Edit | `a=edit&companyID=` | #12 |
| Go To My Company / Internal Postings | `a=internalPostings` → `a=show&companyID=1` | — |
| Search | `a=search` | #47 |

### Contacts — `m=contacts`
| Screen / action | URL | Shot |
|---|---|---|
| List | `m=contacts` | #13 |
| Add (company autocomplete via `ajax.php` suggest list, title, department, reports-to, Hot, e-mails, phones, address, notes) | `a=add` | #14 (result) |
| Detail | `a=show&contactID=` | #15 |
| Cold Call List | `a=showColdCallList` | #16 |
| Search | `a=search` | #48 |

### Lists — `m=lists`
Saved lists grid ("Show Lists"). Lists are filled from data-grid selections in other tabs. Shot #08.

### Calendar — `m=calendar`
Month view with day links, previous/next month, Goto Today, My Upcoming Events, Add Event form (title, type Call/Email/Meeting/Interview/Personal/Other, public, date picker, all day / time, reminder e-mail, duration, description); event edit/delete form. Shots #35–#37.

### Reports — `m=reports`
| Screen | URL | Shot |
|---|---|---|
| Reports tab: submissions/placements for today, yesterday, this/last week, month, year, to date | `m=reports` | #49 |
| Submission report | `a=showSubmissionReport&period=` | #50 |
| Placement report | `a=showPlacementReport&period=` | #51 |
| EEO report (period, status) + preview with graphs | `a=customizeEEOReport` → `a=generateEEOReportPreview` | #52 |
| Job order report form → PDF | `a=customizeJobOrderReport&jobOrderID=` → `a=generateJobOrderReportPDF` | #53 (PDF: RT-09) |
| Graph images | `m=graphs&a=…` (JPEG) | — |

### Settings — `m=settings`
| Group | Screen | URL | Shot |
|---|---|---|---|
| My Profile | Profile / View Profile / Change Password | `m=settings`, `a=showUser&userID=`, `a=myProfile&s=changePassword` | #56, #58 |
| Site Management | Careers Website (enable, browse, registration, templates, questionnaires) | `a=careerPortalSettings` | #75 |
| | Change Site Details | `a=administration&s=siteName` | #59 |
| | User Management / Add User / Show User | `a=manageUsers`, `a=addUser`, `a=showUser` | #60, #61, #74 |
| | Login Activity | `a=loginActivity` | #62 |
| | General E-Mail Configuration (incl. Send Test E-Mail) | `a=emailSettings` | #76, #77 |
| | E-Mail Template Configuration | `a=emailTemplates` | #63 |
| | Localization | `a=administration&s=localization` | #64 |
| | Data Import | `m=import` | #73 |
| | Site Backup | `a=createBackup` | #65 |
| Feature Settings | EEO / EOC Support | `a=eeo` | #66 |
| | Configure Tags | `a=tags` | #67 |
| GUI Customization | Customize Calendar | `a=customizeCalendar` | #68 |
| | Customize Extra Fields | `a=customizeExtraFields` | #69 |
| System | Passwords | `a=administration&s=passwords` | #70 |
| | New Version Check | `a=administration&s=newVersionCheck` | #71 |
| | System Information | `a=administration&s=systemInformation` | #72 |

## 3. Careers site (public) — `careers/index.php`

| Page | URL | Shot |
|---|---|---|
| Disabled state (default) | any → `<!-- Job Board Disabled -->` | — |
| Home (template "CATS 2.0": Return to Main · Show All Jobs · RSS Feed shortcuts) | `careers/index.php` | #80 |
| All jobs | `?p=showAll` | #81 |
| Job detail + "Apply to Position" | `?p=showJob&ID=` | #82 |
| Search | `?p=search` | #83 |
| Apply: 1 Import resume (Choose File → Upload → text box → "Populate Fields") · 2 About you · 3 Contact · 4 Additional info → image button "Submit Application Now" | `?p=applyToJob&ID=` → POST `?m=careers&p=onApplyToJobOrder` | #84, `S3` |
| RSS feed (broken) | `../rss/` | #88 |
| XML job feed | `xml/` | #89 |

## 4. Interaction patterns in use

| Pattern | Where | Notes |
|---|---|---|
| **Sub-modal popups** (`showPopWin(url, w, h)`) rendered as an iframe `popupFrameIFrame` over the page | Add job order chooser, add to pipeline, change status, add attachment, tags, add to list, link duplicate | Each popup is a full server-rendered page |
| **New browser windows** (`window.open`) | Resume text viewer, "show candidate" from search popups | — |
| **Data grids** (`lib/DataGrid.php`) | All list screens, dashboard grid | Column chooser, filter, rows-per-page, sorting, row checkboxes, "Selected / All" actions; state serialized into the URL (`p=` parameter) |
| **AJAX suggest lists** | Company name fields (contacts, job orders) | Typed text → `ajax.php` → clickable list sets a hidden `companyID` |
| **Date picker widget** | Calendar, job start date, candidate date available | Writes to hidden fields |
| **Server-rendered graphs** (JPEG) | Dashboard, job order detail, EEO report | `m=graphs&a=…` |
| **Rich-text editor** (CKEditor 4) | Job order description, e-mail bodies/templates | Does not initialise in this build (RT-07) |
| **Postback forms that re-render the page** | Add candidate resume upload, careers apply "Upload" | "gives the illusion of AJAX" (code comment in `CareersUI.php`) |
| **Validation** | Client-side `alert()` dialogs (e.g. "You must select an Event Type") | — |

## 5. Screens not opened in this baseline
Toolbar/Outlook integration module, import execution, backup creation, candidate registration/login on the careers site, questionnaires, hot lists, merge screens, history ("View History") pages, e-mail template editing, extra-field editing, xml feed submissions, the installer UI.

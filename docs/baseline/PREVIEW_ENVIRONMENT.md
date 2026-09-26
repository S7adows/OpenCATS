# Preview Environment — browser-accessible OpenCATS demo per commit

**Purpose.** Every milestone and vertical slice ends with a preview you can open and use yourself. The preview runs the **actual application built from the current branch/commit**, with **fictional demo data**, isolated from production, reachable at a **public HTTPS URL**. A slice is not "complete" until you have tested it there.

Everything described here is environment-only tooling (`docs/baseline/preview/`, `docs/baseline/env/`, `.github/workflows/preview.yml`). It never changes application code; the application is copied from `git archive HEAD` and run as is.

---

## 1. Where the preview runs, and why

| Option (your priority order) | Available? | Evidence |
|---|---|---|
| 1. Hosted preview environment already provisioned for the project | No | None exists for this fork |
| 2. GitHub Codespaces / forwarded HTTPS port | Not usable by Claude | No Codespaces API in this session; a Codespace would also have to be started by you each cycle, and its private forwarded URL cannot be verified from outside |
| 3. HTTPS tunnel **from Claude's session container** | **Blocked** | The session's network policy refuses `api.trycloudflare.com` (HTTP 403 on CONNECT), and no inbound access exists |
| 4. **Another temporary HTTPS preview mechanism: the repository's own GitHub Actions runner + Cloudflare quick tunnel** | **Chosen** | Runners have normal internet access; the workflow is part of the repo; it can be re-run on every commit without any manual infrastructure work |

So the preview is deployed by the workflow **`.github/workflows/preview.yml`** ("Preview environment") on a GitHub-hosted runner:

```
push to claude/** (or manual "Run workflow")
  └─ GitHub runner (ubuntu-24.04)
       ├─ preview.sh up  → git archive HEAD → composer install (lock) → containers → install DB → demo data
       ├─ cloudflared quick tunnel → https://<random-words>.trycloudflare.com  (TLS by Cloudflare)
       ├─ verify-preview.js → 10 checks + safety checks, run THROUGH the public URL
       ├─ check run "OpenCATS Preview" on the commit (summary + encrypted URL/credentials)
       └─ keeps serving for 5 hours (health-checked every 5 min), then shuts down
```

Container layout on the runner:

```
Internet ──HTTPS──> Cloudflare edge ──tunnel──> cloudflared ──> gateway (nginx) ──> web (nginx) ──> php (PHP 7.2 FPM) ──> db (MariaDB 10.7)
                                                 [edge network]      [edge + app]      [app network: INTERNAL, no internet]
```

## 2. How the preview is started and deployed

| Trigger | What happens |
|---|---|
| **Push** to any `claude/**` branch that changes application files, `docs/baseline/preview/**`, `docs/baseline/env/**` or this document | Workflow deploys that commit. A newer push **cancels** the previous preview (one preview per branch) |
| **Manual**: GitHub → Actions → "Preview environment" → *Run workflow* (branch, hours) | Same, for the chosen branch; `hours` ≤ 5.5 |
| **Re-run** of an existing run (Actions UI, or Claude via the API) | Redeploys the same commit (new quick-tunnel URL) |

Pure documentation commits (other files under `docs/`) do **not** redeploy, so the URL stays the same while you test.

**One-time prerequisite:** GitHub Actions must be enabled for this fork (forks start with Actions disabled): repository → **Actions** tab → *"I understand my workflows, go ahead and enable them"*. Nothing else needs configuring.

## 3. URL strategy

- **Default: Cloudflare quick tunnel** — `https://<random-words>.trycloudflare.com`, HTTPS terminated by Cloudflare, unguessable, **temporary**: valid while the run is alive (default 5 h), and a **new URL for each deployment** (each new commit or re-run).
- **Persistent URL (optional upgrade, one-time setup):** create a named Cloudflare Tunnel on a domain you control and add repository secret `PREVIEW_TUNNEL_TOKEN` and repository variable `PREVIEW_PUBLIC_URL` (e.g. `https://opencats-preview.example.com`). The workflow then uses `cloudflared tunnel run` with that token and every deployment is served at the **same URL**. No code change needed.
- The URL is **not printed** in workflow logs, job summaries or artifacts (it is masked and redacted as `<PREVIEW_URL>`). It is delivered encrypted (§4).

## 4. Demo credentials strategy

| Account | Purpose | Password |
|---|---|---|
| `demo.recruiter` (Demo Recruiter, access level **400 – Site Administrator**) | For you: every module incl. Settings/Administration | Random per deployment, 16 chars (`xxxx-xxxx-xxxx-xxxx`) |
| `admin` (built-in root) | Not for use | Rotated to a random value **before** demo data is created; `admin/admin` never works on a preview (verified on every run) |

- Passwords are generated on the runner, stored only in `<work-dir>/secrets/` (mode 600) and masked in logs.
- **Delivery:** the workflow encrypts `{url, user, password, admin password, commit, expiry}` with the public key `docs/baseline/preview/recipient.pub.pem` (RSA-4096, OAEP-SHA256) and puts only the ciphertext into the **"OpenCATS Preview" check run** on the commit. Claude holds the private key, decrypts it, and gives you URL + username + password in chat.
- **Key rotation:** if the private key is lost (e.g. a new Claude session), generate a new key pair (`openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096`), commit the new public key, and redeploy.

## 5. Database and demo-data strategy

- Fresh database on every deployment: the installer's empty-install SQL (`db/cats_schema.sql`) → the application's own schema migrations on first request → installer finalisation (`docs/baseline/env/seed_install.php`). This always matches the schema required by the deployed commit.
- **Fictional demo data**, created **through the application's own screens and form endpoints** (`docs/baseline/preview/demo-seed.js`), so every row is written by the unmodified code:

| Data | Count |
|---|---|
| Companies (all suffixed "(Demo)") + built-in "Internal Postings" | 5 + 1 |
| Contacts | 10 |
| Job orders (6 public on the careers site) | 8 |
| Candidates, each with a plain-text resume attachment | 30 |
| Pipelines with status history (No Contact … Placed) | 29 pipelines, 89 status changes |
| Scheduled interviews + 1 team meeting | 4 + 1 |
| Site name | "OpenCATS Preview (Demo)" · careers website enabled |

- No real people or companies: e-mail addresses use the reserved `example.test` domain, phones use 555-01xx, resumes say "FICTIONAL DEMO RESUME".
- Data is owned by `demo.recruiter`, so the demo account's dashboard, calls and upcoming events are populated.

## 6. Non-production marking and isolation

- **Visible marker:** every top-level page shows a banner "**OpenCATS Preview — Demo Environment · fictional data · not production · e-mail is not delivered**", and the tab title starts with `[PREVIEW]`. Injected by the gateway, not by application code. Headers `X-OpenCATS-Environment: preview-demo` and `X-Robots-Tag: noindex, nofollow`.
- **No production access:** the preview has its own database container; no production host, database or credential exists in the workflow.
- **Outbound network restrictions:** `php`, `web` and `db` sit on a Docker network with `internal: true` — **no route to the internet**. Consequences: e-mail is never delivered (the app's SMTP target `localhost:587` does not exist, as in the baseline; send attempts show the baseline's PHPMailer error), candidate data cannot reach third-party services (e.g. the legacy Resfly parser), and the app cannot phone home. Only the gateway and `cloudflared` have outbound access.
- **Gateway hardening (preview only):** refuses script execution under `attachments/`, `upload/`, `temp/` (403) and hides installer/maintenance/developer scripts (`installtest.php`, `installwizard.php`, `modules/install/`, `scripts/`, `config.php`, …) (404); rewrites the app's absolute `http://` redirects and links to `https://`. Runtime copy excludes `docs/`, `.github/`, `docker/`, `test/`, `ci/` (same as the upstream release archive, plus `docs/`).

## 7. Environment variables

| Variable | Where | Default | Meaning |
|---|---|---|---|
| `PREVIEW_PORT` | preview.sh | `8090` | Local gateway port (`127.0.0.1` only) |
| `PREVIEW_PROJECT` | preview.sh | `opencats-preview` | Compose project name |
| `PREVIEW_GATEWAY_IMAGE` | preview.sh | `nginx:1.27-alpine` | Gateway image (`prooph/nginx:www` works for local tests) |
| `PREVIEW_DEMO_USERNAME` | preview.sh | `demo.recruiter` | Demo account name |
| `PREVIEW_DEMO_PASSWORD`, `PREVIEW_ADMIN_PASSWORD` | preview.sh | random | Override generated passwords (local use only) |
| `PREVIEW_TUNNEL_TOKEN` (secret), `PREVIEW_PUBLIC_URL` (variable) | workflow | unset | Named tunnel → persistent URL |
| `PREVIEW_NODE_PATH` | preview.sh | global npm root | `node_modules` containing `playwright` (and `axe-core` for verification) |
| `COMPOSER_DOCKER_ARGS`, `COMPOSER_FLAGS`, `COMPOSER_AUTH` | preview.sh | – / `--prefer-dist` / – | Composer step options. The workflow sets none of them: Composer 1.8.4 (in the PHP 7.2 image) rejects current GitHub token formats, and the two locked packages download anonymously (falling back to `git clone`) |
| `HOURS` (input `hours`) | workflow | `5` | How long the preview stays online (≤ 5.5) |

## 8. Verification before a URL is handed over

`verify-preview.js` runs **from the runner through the public HTTPS URL** (i.e. from outside the preview network) and must pass before the URL is given to you:

| # | Check | Blocking |
|---|---|---|
| 1 | HTTP health (login page, HTTP 200) | yes |
| 2 | Login with the demo account (lands on Dashboard over HTTPS) | yes |
| 3 | Main navigation — 11 screens, HTTP 200, no fatal errors | yes |
| 4 | Feature workflow — demo data listed, candidate detail, job pipeline, quick search, resume keyword search, careers site | yes |
| 5 | Browser console / uncaught JS errors | reported |
| 6 | Failed requests / HTTP ≥ 400 | reported |
| 7 | PHP / application errors (fatal = blocking) | yes (fatal) |
| 8 | Screenshots (artifact) | reported |
| 9 | Responsive check at 390 px | reported (baseline is desktop-only) |
| 10 | Accessibility smoke (axe-core, WCAG 2 A/AA) | reported (baseline findings) |
| S1–S4 | Banner present on every page, gateway header, **admin/admin rejected** | yes |

Results: check run summary (public, no secrets) + artifact `preview-verification-<run id>` (screenshots, `results.json`, container logs; URL redacted).

## 9. Reset, reproduce, shut down

| Task | How |
|---|---|
| **Reset the demo database** (same URL, same passwords) | On a machine running the preview: `docs/baseline/preview/preview.sh reset <work-dir>`. For the hosted preview: re-run the workflow (fresh DB; new quick-tunnel URL unless a named tunnel is configured) |
| **Reproduce locally** | `docs/baseline/preview/preview.sh up /tmp/opencats-preview` → `http://127.0.0.1:8090`, credentials in `/tmp/opencats-preview/secrets/credentials.env`; add `--tunnel` for a public quick tunnel where outbound access to Cloudflare is allowed. Needs Docker, Node + Playwright |
| **Verify any preview** | `PREVIEW_URL=… PREVIEW_DEMO_PASSWORD=… node docs/baseline/preview/verify-preview.js <out-dir>` |
| **Status** | `preview.sh status <work-dir>` (never prints secrets) |
| **Shut down** | Hosted: cancel the workflow run (Actions UI) or let it expire; local: `preview.sh down <work-dir>` (removes containers and the DB volume) |

## 10. Preview report format (used at the end of every milestone)

```
PREVIEW   URL: …  (temporary until …)
LOGIN     Username: …  Password: …
COMMIT    <sha> on <branch>
BUILD     workflow run <link>, images/digests
DATABASE  fresh install + demo data (counts)
TESTS     checks 1–10 + safety checks
BROWSER CHECK  console / failed requests / PHP / responsive / accessibility
KNOWN ISSUES   …
```

## 11. Limits and honest caveats

- Claude's own session cannot open `*.trycloudflare.com` (egress policy), so external verification is performed by the runner through the public URL and reviewed by Claude from the check run and artifacts.
- Quick-tunnel URLs change on every deployment; use the named-tunnel option for a fixed URL.
- A GitHub-hosted job lives at most ~6 h; the preview is online for 5 h by default and can be redeployed on request.
- The demo shows the application **as it is**, including its known defects (`KNOWN_RUNTIME_ERRORS.md`).

# OpenCATS Forensic Audit — Complete Edition

Complete edition · 2026-09-26 · code at `d607279` (OpenCATS 0.9.7.4, `constants.php:45`)

This folder is the forensic audit of the current OpenCATS application. It reports **findings only**: what the system is, what works, what is broken or risky, and what that means. It does not modernize anything, does not choose a technology stack and does not set a roadmap. Competitor research and the OpenCATS 2.0 product strategy come later, as separate work.

Start with [EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md).

---

## 1. Documents

### The ten assessment areas

| # | Area | Document | ID prefix |
|---|---|---|---|
| 1 | Architecture | [ARCHITECTURE.md](ARCHITECTURE.md) (map: [CODEBASE_MAP.md](CODEBASE_MAP.md)) | ARCH- / ARCH-M |
| 2 | Database and schema | [DATABASE_AUDIT.md](DATABASE_AUDIT.md) | DB- |
| 3 | Security | [SECURITY_AUDIT.md](SECURITY_AUDIT.md) | SEC- |
| 4 | API | [API_AUDIT.md](API_AUDIT.md) | API- |
| 5 | UX/UI | [UX_UI_AUDIT.md](UX_UI_AUDIT.md) | UX- |
| 6 | Performance | [PERFORMANCE_AUDIT.md](PERFORMANCE_AUDIT.md) | PERF- |
| 7 | Testing and dependencies | [TESTING_AUDIT.md](TESTING_AUDIT.md), [DEPENDENCY_AUDIT.md](DEPENDENCY_AUDIT.md) | TEST- / DEP- |
| 8 | Feature inventory | [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md) | FEAT- |
| 9 | Technical debt | [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md) | DEBT- |
| 10 | Current workflows | [WORKFLOW_ANALYSIS.md](WORKFLOW_ANALYSIS.md) | WF- |

### Cross-cutting conclusions

| Document | What it answers |
|---|---|
| [EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md) | The findings in brief: counts, what is confirmed, the most serious problems, what is still unknown |
| [MUST_NOT_REBUILD.md](MUST_NOT_REBUILD.md) | Existing capabilities and workflows that work, have real value, and must be preserved |
| [MODERNIZATION_DECISIONS.md](MODERNIZATION_DECISIONS.md) | One decision per major subsystem — KEEP / REFACTOR / REPLACE / REMOVE / NEW — with evidence and reasoning |

### Phase 0 forward-looking documents (not revised in this edition)

[RISKS.md](RISKS.md), [PRODUCT_GAPS.md](PRODUCT_GAPS.md), [MODERNIZATION_OPPORTUNITIES.md](MODERNIZATION_OPPORTUNITIES.md) and [RECOMMENDED_ROADMAP.md](RECOMMENDED_ROADMAP.md) were written in Phase 0. They look forward: target architecture, gaps against the market, phasing. They are **outside this findings-only audit** and will be revisited during the strategy work. Where they disagree with this edition (for example a re-rated severity), this edition wins.

---

## 2. Evidence base

| Source | What it gives | Where |
|---|---|---|
| Static review | Reading the committed code, schema, configuration, tests and CI; read-only commands (`grep`, `wc`, `git log`, `php -l` on PHP 8.4 CLI) | `file:line` citations in every finding |
| Runtime baseline (Phase 0.5) | The **unmodified** application installed and run on PHP 7.2.16 / nginx 1.17.3 / MariaDB 10.7.8 with fictional data; 94-step browser smoke run over 15 feature areas; logs and screenshots | [`docs/baseline/`](../baseline/) — `KNOWN_RUNTIME_ERRORS.md` (RT-01…RT-17), `SMOKE_TEST.md` (step #NN), `CURRENT_UI_MAP.md`, `screenshots/`, `evidence/` |
| Git history | Change history of the fork (history before 2022 is not in this clone) | `git log` |

**Not done in this audit** (each gap is recorded as an "Unknown / needs further validation" in the affected finding):

- No runtime security testing. Security findings not observed during the normal smoke run are confirmed by code reading only (**Static**).
- No measurement at realistic data volumes. Page timings exist only for a near-empty database.
- No real e-mail delivery, no LDAP directory, no resume-parsing service, no production data, no users interviewed.
- Only Chromium was used for the browser run; only the administrator account was exercised.

**Support tooling is not product.** `docs/baseline/env/`, `docs/baseline/smoke/`, `docs/baseline/preview/` and `.github/workflows/preview.yml` were added to run and observe the application. They are audit tooling. They are not part of OpenCATS and are not assessed as product. The application code is byte-identical to `d607279`.

---

## 3. How to read a finding

Every finding uses the same shape:

```
### SEC-001 — Short, specific title
*Confirmation: **Static** · Phase 0 severity: unchanged · Related: RT-03, API-011*

- **Confirmed fact:** what is verifiably true.
- **Evidence:** file:line, command and result, runtime evidence (RT-xx, smoke step #NN, screenshot).
- **Impact:** who or what is affected, and how.
- **Severity:** CRITICAL / HIGH / MEDIUM / LOW — one-line reason.
- **Recommendation:** what should change about this finding, and why. Not a plan.
- **Unknown / needs further validation:** what is not known yet, and how to find out.
```

### Confirmation levels

| Level | Meaning |
|---|---|
| **Runtime** | Observed on the unmodified application in the Phase 0.5 baseline. The finding cites the RT-xx item, smoke step or evidence file. |
| **Static** | Verified by reading the committed code, configuration or schema, or by a read-only command. Not exercised at runtime. |
| **Partial** | Part verified, part inferred. The finding says which part is which. |
| **Unverified** | A plausible lead that could not be verified. Kept so it is not lost. |

### Severity scale

| Severity | Meaning |
|---|---|
| **CRITICAL** | An unauthenticated or low-privileged actor can compromise accounts or data; or core recruiting data can be silently corrupted or lost; or the system cannot run on any supported platform. |
| **HIGH** | A serious security weakness with a precondition; a data-integrity risk; a broken core workflow; or a major barrier to any modernization. |
| **MEDIUM** | A limited-scope weakness, a degraded or partly broken feature, or a notable maintainability or performance cost. |
| **LOW** | Cosmetic, hygiene, or a minor inconsistency. |

### IDs

Finding IDs from the Phase 0 edition are stable, so references from other documents still work. A Phase 0 finding that proved wrong or duplicated stays as a short stub marked **[Withdrawn]** or **[Merged into …]**. New findings continue each area's numbering. Every document ends with a "Changes from the Phase 0 edition" section.

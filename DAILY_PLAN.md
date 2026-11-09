# Daily Quality Plan (15 days)

One small, real, verifiable improvement per run. Work happens on a branch
(`claude/daily-YYYY-MM-DD-topic`) and lands through a reviewed pull request.
No PR is required on a given day: if no safe, testable improvement exists, the
run reports "no safe change". Quality and truth come before streaks.

Status values: `TODO` · `IN PROGRESS` · `DONE` · `SKIPPED (reason)`

| Day | Focus | Deliverable | Acceptance evidence | Status |
|---|---|---|---|---|
| 1 | Baseline audit | `REPO_SCORECARD.md` with facts, gaps and links | No invented score; every item points to a file or check | DONE |
| 2 | README quick start | Clean-clone install and first successful run verified | Commands tested in a fresh environment | TODO |
| 3 | Repository structure | Document folders, entry points and configuration | Tree agrees with actual files | TODO |
| 4 | Unit testing | Tests for one core module and one failure path | `npm test` passes; no fabricated coverage | TODO |
| 5 | CI pipeline | Extend existing `ci.yml` (lint, audit) if useful | Green workflow on the PR | TODO |
| 6 | Dependency hygiene | Lockfile check and update policy | Reproducible `npm ci`; no risky major upgrade | TODO |
| 7 | Security | Secret exclusions and dependency/security scan | No secrets in diff; findings recorded honestly | TODO |
| 8 | Architecture | Current-state Mermaid diagram in `docs/` | Every box/arrow maps to code; planned parts marked planned | TODO |
| 9 | Evaluation design | Evaluation schema, baseline plan, TO MEASURE table | No invented results; dataset provenance stated | TODO |
| 10 | Observability | Structured logs/error handling for one key path | Failure reproducible; logs contain no sensitive data | TODO |
| 11 | API usability | Validated example requests/responses and errors | Examples run from documented commands | TODO |
| 12 | Responsible AI | Limitations, privacy and non-medical-advice section | No clinical or diagnostic claim | TODO |
| 13 | Contribution quality | Issue templates; refine CONTRIBUTING and PR template | A new contributor can follow the steps | TODO |
| 14 | Release readiness | `CHANGELOG.md` and v0.1.0 release checklist (no auto-release) | Owner reviews version/features before tagging | TODO |
| 15 | Final audit | Compare Day 1 baseline with actual artifacts and gaps | Report cites tests, workflows, files and PRs only | TODO |

## Rules

- Max 8 files / 300 changed lines per run; larger work becomes an issue.
- Never commit to `main` directly, never auto-merge, never force-push.
- Never invent features, metrics, test results or clinical claims.
- Do not touch `.github/workflows/health-check.yml` or `status/` (owner-managed).
- After Day 15 the scheduled task is disabled.

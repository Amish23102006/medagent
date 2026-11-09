# Repository scorecard (Day 1 baseline, 2026-11-09)

A factual snapshot of what this repository has today and what it is missing.
Every item points to a file or a check. No scores are invented.

## What exists

| Area | Status | Evidence |
|---|---|---|
| Server | Express MCP server, JSON-RPC 2.0 (`initialize`, `tools/list`, `tools/call`, `ping`) plus REST routes | `mcp-server.js` |
| Frontend | React + Vite single-page app | `src/App.jsx`, `vite.config.js` |
| Tests | 19 server tests with Node's built-in runner, all passing | `tests/server.test.js`, `npm test` |
| CI | Tests and frontend build on every push and pull request | `.github/workflows/ci.yml` |
| Uptime log | Daily check of the live backend and frontend | `.github/workflows/health-check.yml`, `status/uptime.md` |
| Input validation | Tool inputs checked against JSON Schema before any model call | `mcp-server.js`, tests 13-16 |
| Safety | Red-flag escalation enforced in code, per-IP rate limit, model-call timeout | `mcp-server.js`, README "Safety and limitations" |
| Packaging | Multi-stage Docker image with health check; Smithery config | `Dockerfile`, `smithery.yaml` |
| Docs | README, contributing guide, security policy, PR template, MIT license | `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `.github/pull_request_template.md`, `LICENSE` |
| Config | Example environment file; `.env` ignored | `.env.example`, `.gitignore` |

## Gaps

| Gap | Evidence | Tracked |
|---|---|---|
| Node 20 (end-of-life) in CI and Docker | `ci.yml`, `Dockerfile` | #6 |
| `npm audit`: high advisories in `body-parser`, `browserslist` | `npm audit` | #7 |
| `npm audit`: `esbuild` (needs Vite 6+) and `qs` (held by Express 4) remain | `npm audit` after `npm audit fix` | needs breaking upgrade |
| No frontend tests | only `tests/server.test.js` exists | Day 4 |
| No linter or formatter in CI | no ESLint/Prettier config in the repo | Day 5 |
| CORS allows every origin | `app.use(cors())` in `mcp-server.js` | Day 7 |
| No architecture document beyond the README sketch | `docs/` holds only `screenshot.png` | Day 8 |
| No evaluation results | README "Evaluation: Not run yet" | #2, Day 9 |
| MCP Streamable HTTP transport not implemented | README "Safety and limitations" | #4 |
| No changelog or tagged release | no `CHANGELOG.md`, no tags | Day 14 |

## How to re-check

```bash
npm ci
npm test        # expect 19 passing
npm run build
npm audit
```

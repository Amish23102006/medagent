# Contributing to MedAgent

Thanks for your interest. MedAgent is a small educational/research project, so contributions are kept focused and easy to review.

## Ground rules

- MedAgent is **not medical advice**. Do not add diagnosis, treatment or "clinically validated" claims.
- Use only synthetic or publicly licensed data. Never add real patient data.
- Never commit secrets. Keys go in `.env` (see `.env.example`).
- Document only behaviour that exists in the code. Mark future work as *Planned*.

## Local setup

Requirements: Node.js 18+ and a free Groq API key.

```bash
git clone https://github.com/Amish23102006/medagent
cd medagent
npm ci
cp .env.example .env   # add GROQ_API_KEY
npm test               # server tests
npm run build          # frontend build
npm run dev            # MCP server on :3001 and Vite on :5173
```

## Workflow

1. Open or pick an issue that describes the problem.
2. Create a branch: `feat/<topic>`, `fix/<topic>`, `docs/<topic>` or `test/<topic>`.
3. Keep the change small: one problem per pull request.
4. Add or update tests when behaviour changes.
5. Run `npm test` and `npm run build` locally; CI must be green.
6. Use [Conventional Commits](https://www.conventionalcommits.org/), e.g. `test: add pipeline failure-path coverage`.
7. Open a pull request and fill in the template.

## Code style

- ES modules, 2-space indentation, descriptive names.
- Validate inputs at the API boundary; return clear error messages.
- No new dependencies without a short reason in the PR.

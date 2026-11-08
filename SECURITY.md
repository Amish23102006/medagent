# Security Policy

MedAgent is an educational and research demo. It is not a medical device and must never receive real patient or personal health information.

## Supported versions

Only the latest commit on `main` is supported.

## Reporting a vulnerability

Please do **not** open a public issue for security problems.

- Use GitHub's private reporting: **Security → Report a vulnerability** on this repository, or
- Email: chaturvediamish06@gmail.com with the subject `MedAgent security`.

Include the affected endpoint or file, steps to reproduce and the impact. You can expect a first reply within 7 days.

## Scope

In scope: the Node.js MCP server (`mcp-server.js`), the React frontend, the Dockerfile and the GitHub Actions workflows.

Out of scope: Groq, Render and Vercel platform issues (report those to the provider).

## Secrets

- API keys live only in `.env` (git-ignored) or in the hosting provider's environment settings.
- Never commit `.env`, keys, tokens or logs that contain them.
- If a secret is ever committed, it is **revoked and rotated first**, then removed from history.

## Data handling

The server does not store submitted text, but the text is sent to the Groq API for inference. Do not submit real personal or health information.

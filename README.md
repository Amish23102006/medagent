# MedAgent

**A 4-agent symptom-triage pipeline exposed as MCP tools, powered by Groq (LLaMA 3.3 70B).**

[Live demo](https://medagent-rust.vercel.app) · [Demo video](#) <!-- TODO: add link -->

![MedAgent screenshot](docs/screenshot.png) <!-- TODO: add screenshot of a completed run -->

> **Medical disclaimer:** MedAgent is an educational and research demo. It is **not** a medical device and does not provide diagnosis or medical advice. Do not enter real personal health information. In an emergency, call your local emergency number.

## What it does

You describe symptoms (plus age, gender and optional medical history). MedAgent runs them through four specialised agents in sequence, and every call reports its token usage and latency.

```
Symptom Analyzer → Disease Matcher → Risk Assessor → Care Coordinator
```

| Agent | Role |
| --- | --- |
| **Symptom Analyzer** | Classifies symptoms by type and severity and flags red-flag signs |
| **Disease Matcher** | Suggests the top 3 possible conditions with relative likelihood |
| **Risk Assessor** | Estimates urgency and gives emergency-care guidance |
| **Care Coordinator** | Suggests specialist referrals, home care and follow-up |

Each agent is also available on its own as an MCP tool, so any compatible client can call it directly.

## Why MCP?

The agents are published as tools through the [Model Context Protocol](https://modelcontextprotocol.io), so they can be discovered and called by MCP clients instead of only through this UI. The server also lists additional demo tools (Legal, Finance, HR, DevOps) to show how new agent suites plug into the same marketplace.

## Architecture

```
┌─────────────────┐   HTTP    ┌──────────────────────┐   API    ┌──────────────┐
│  React + Vite   │ ────────► │  Node.js MCP server  │ ───────► │  Groq        │
│  (Vercel)       │           │  (Express, Docker)   │          │  LLaMA 3.3   │
└─────────────────┘           └──────────────────────┘          └──────────────┘
   Symptom Checker                tool registry
   Marketplace                    pipeline orchestrator
   MCP Console                    execution logs
```

<!-- TODO: replace with a proper diagram image if you make one -->

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite |
| Backend | Node.js, Express |
| LLM | Groq, LLaMA 3.3 70B |
| Protocol | Model Context Protocol (MCP) |
| Packaging | Docker, Smithery |

## Getting started

**Requirements:** Node.js 18+ and a free [Groq API key](https://console.groq.com).

```bash
git clone https://github.com/Amish23102006/medagent
cd medagent
npm install
cp .env.example .env   # then add your GROQ_API_KEY
npm run dev            # starts the MCP server (port 3001) and Vite (port 5173)
```

Run only the server with `npm start`. Never commit your `.env` file.

### Docker

```bash
docker build -t medagent .
docker run -p 3001:3001 -e GROQ_API_KEY=your_key medagent
```

## API endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/mcp/info` | Server info and capabilities |
| GET | `/mcp/tools` | List available tools |
| GET | `/mcp/suites` | List agent suites |
| POST | `/mcp/tools/{toolId}/execute` | Run a single tool |
| POST | `/mcp/pipeline/execute` | Run the full 4-agent pipeline |
| GET | `/mcp/logs` | Recent execution logs |
| GET | `/health` | Health check |

## Safety and limitations

- Outputs come from a general-purpose LLM and can be wrong, incomplete or overconfident.
- The pipeline is not validated against clinical data or reviewed by clinicians.
- The Risk Assessor is designed to escalate serious symptoms to emergency care, but it must never be relied on in a real emergency.
- No user health data should be stored. Do not submit real patient information.

## Evaluation

<!-- TODO: fill in after running a benchmark -->
Planned: compare the 4-agent pipeline against a single-prompt baseline on a public symptom or medical QA dataset, reporting accuracy, latency and cost per query, with an ablation of each agent.

## Roadmap

- [ ] Streamable HTTP transport that follows the official MCP specification, built on the MCP SDK
- [ ] Benchmark and ablation results
- [ ] Automated tests and CI
- [ ] Authentication and per-user run history
- [ ] More specialised agents

## License

MIT

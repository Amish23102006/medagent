# MedAgent

An AI agent marketplace with a healthcare focus, built with LangChain and the Model Context Protocol (MCP).

## Overview
MedAgent is a marketplace where AI agents are exposed as tools that any MCP-compatible client can discover and call. It pairs a Vite web frontend with a Node.js MCP server, and is deployed on Railway and packaged for Smithery.

## Features
- Marketplace of AI agents that users can browse and use
- MCP server exposing agent tools to any MCP-compatible client
- Web frontend built with Vite
- Containerised with Docker, deployed on Railway
- Smithery configuration included (`smithery.yaml`)

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | HTML, JavaScript, Vite |
| Backend | Node.js MCP server (`mcp-server.js`) |
| AI | LangChain, Model Context Protocol |
| Deployment | Docker, Railway, Smithery |

## Project Structure
```
medagent/
├── index.html        # Web frontend entry
├── mcp-server.js     # MCP server exposing agent tools
├── smithery.yaml     # Smithery deployment config
├── vite.config.js    # Vite build config
├── Dockerfile        # Container image
└── package.json
```

## Getting Started
```bash
git clone https://github.com/Amish23102006/medagent
cd medagent
npm install
npm run dev
```

To run the MCP server:
```bash
node mcp-server.js
```

Set any required API keys in a local `.env` file. Never commit this file.

## Future Improvements
- Add more specialised agents to the marketplace
- Add authentication and per-user agent history
- Add automated tests and CI

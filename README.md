# MedAgent

AI agent marketplace for [healthcare / medical use case], built with LangChain and the Model Context Protocol (MCP).

**Live demo:** [your Railway or deployed URL]

## Overview
[2-3 sentences: what problem it solves, who it's for, and what users can do on it.]

## Features
- Marketplace of AI agents that users can browse and use [edit]
- MCP server exposing agent tools to any MCP-compatible client
- Web frontend built with Vite
- Deployed on Railway and packaged for Smithery

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | HTML, JavaScript, Vite |
| Backend | Node.js MCP server |
| AI | LangChain, MCP |
| Deployment | Docker, Railway, Smithery |

## Architecture
[3-4 lines: how the frontend, MCP server, and agents connect.]

## Getting Started
git clone https://github.com/Amish23102006/medagent
cd medagent
npm install
npm run dev

Create a `.env` file with:
API_KEY=your_key_here    # [list the variables the project needs]

## MCP Server
Run the server with `node mcp-server.js`.
Smithery config is in `smithery.yaml`.

## Screenshots
![Home](images/home.png)

## Future Improvements
- [Idea 1]
- [Idea 2]

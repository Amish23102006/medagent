// Integration tests for the MedAgent MCP server.
// They start the real server with a dummy API key and only exercise
// endpoints that do not call the Groq API, so they run offline in CI.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 3900 + Math.floor(Math.random() * 90);
const BASE = `http://127.0.0.1:${PORT}`;
let server;

async function waitForServer(timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return;
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("Server did not start in time");
}

function rpc(method, params, id = 1) {
  return fetch(`${BASE}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
}

before(async () => {
  server = spawn(process.execPath, ["mcp-server.js"], {
    cwd: ROOT,
    env: { ...process.env, GROQ_API_KEY: "test-key", PORT: String(PORT) },
    stdio: "ignore",
  });
  await waitForServer();
});

after(() => {
  server?.kill();
});

test("GET /health reports ok with tool and suite counts", async () => {
  const body = await (await fetch(`${BASE}/health`)).json();
  assert.equal(body.status, "ok");
  assert.ok(body.tools > 0);
  assert.ok(body.suites > 0);
  assert.ok(body.installedSuites.includes("medical"));
});

test("JSON-RPC initialize returns protocol version and server info", async () => {
  const body = await (await rpc("initialize", {})).json();
  assert.equal(body.jsonrpc, "2.0");
  assert.equal(body.id, 1);
  assert.ok(body.result.protocolVersion);
  assert.equal(body.result.serverInfo.name, "MedAgent MCP Server");
});

test("JSON-RPC ping returns an empty result", async () => {
  const body = await (await rpc("ping")).json();
  assert.deepEqual(body.result, {});
});

test("JSON-RPC tools/list includes the four medical agents with schemas", async () => {
  const body = await (await rpc("tools/list")).json();
  const names = body.result.tools.map((t) => t.name);
  for (const name of ["symptom_analyzer", "disease_matcher", "risk_assessor", "care_coordinator"]) {
    assert.ok(names.includes(name), `missing tool ${name}`);
  }
  for (const tool of body.result.tools) {
    assert.equal(typeof tool.description, "string");
    assert.equal(typeof tool.inputSchema, "object");
  }
});

test("JSON-RPC tools/call with an unknown tool returns -32601", async () => {
  const body = await (await rpc("tools/call", { name: "does_not_exist", arguments: {} })).json();
  assert.equal(body.error.code, -32601);
});

test("JSON-RPC unknown method returns -32601", async () => {
  const body = await (await rpc("no/such/method")).json();
  assert.equal(body.error.code, -32601);
});

test("JSON-RPC notifications are acknowledged with 202 and no body", async () => {
  const res = await fetch(`${BASE}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
  });
  assert.equal(res.status, 202);
});

test("GET /mcp/info lists capabilities", async () => {
  const body = await (await fetch(`${BASE}/mcp/info`)).json();
  assert.ok(body.capabilities.includes("pipeline_execution"));
});

test("POST /mcp/tools/:id/execute with an unknown tool returns 404", async () => {
  const res = await fetch(`${BASE}/mcp/tools/does_not_exist/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(res.status, 404);
});

test("POST /mcp/pipeline/execute with an unknown suite returns 404", async () => {
  const res = await fetch(`${BASE}/mcp/pipeline/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ suiteId: "nope", input: {} }),
  });
  assert.equal(res.status, 404);
});

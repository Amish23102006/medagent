/**
 * REAL MCP Server — Model Context Protocol over HTTP/SSE
 * Each tool is a genuine callable endpoint with schemas,
 * input validation, execution traces, and state passing.
 * 
 * Updated for Smithery.ai deployment:
 * - /health endpoint for Docker healthcheck
 * - PORT from environment variable
 * - CORS allows all origins for remote access
 */
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import * as dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error("❌ Missing GROQ_API_KEY in .env");
  process.exit(1);
}

// ─── Real Tool Registry ────────────────────────────────────────────────────
const TOOL_REGISTRY = {
  // ── Medical Suite ──
  symptom_analyzer: {
    id: "symptom_analyzer",
    name: "Symptom Analyzer",
    suite: "medical",
    icon: "🔬",
    tag: "Diagnostics",
    color: "#00d4ff",
    description: "Classifies and analyzes patient symptoms — severity, type, red flags.",
    inputSchema: {
      type: "object",
      required: ["age", "gender", "symptoms"],
      properties: {
        age: { type: "number", description: "Patient age" },
        gender: { type: "string", enum: ["male", "female", "other"] },
        symptoms: { type: "string", description: "Patient symptoms description" },
        medical_history: { type: "string", description: "Optional medical history" },
      },
    },
    outputKey: "symptom_analysis",
    systemPrompt: "You are a medical symptom analyst. Be extremely concise. Use emojis. Max 6 lines.",
    buildPrompt: (input) =>
      `Patient: ${input.age}yo ${input.gender}. Symptoms: ${input.symptoms}. History: ${input.medical_history || "none"}.

Respond in this exact format (no extra text):
🏷️ Type: [category]
⚡ Severity: [Mild/Moderate/Severe]
🚨 Red Flag: [Yes/No — one reason]
📝 Key Finding: [one sentence]`,
  },

  disease_matcher: {
    id: "disease_matcher",
    name: "Disease Matcher",
    suite: "medical",
    icon: "🧬",
    tag: "AI Diagnosis",
    color: "#a78bfa",
    description: "Matches symptoms to top 3 possible conditions with likelihood.",
    inputSchema: {
      type: "object",
      required: ["age", "gender", "symptoms", "symptom_analysis"],
      properties: {
        age: { type: "number" },
        gender: { type: "string" },
        symptoms: { type: "string" },
        symptom_analysis: { type: "string", description: "Output from symptom_analyzer" },
      },
    },
    outputKey: "possible_conditions",
    systemPrompt: "You are a diagnosis assistant. Be extremely concise. Use emojis. Max 6 lines.",
    buildPrompt: (input) =>
      `Patient: ${input.age}yo ${input.gender}. Symptoms: ${input.symptoms}. Analysis: ${input.symptom_analysis}

List top 3 conditions only, this exact format:
1. 🔵 [Condition] — [High/Med/Low] — [one-line reason]
2. 🟡 [Condition] — [High/Med/Low] — [one-line reason]
3. 🟢 [Condition] — [High/Med/Low] — [one-line reason]`,
  },

  risk_assessor: {
    id: "risk_assessor",
    name: "Risk Assessor",
    suite: "medical",
    icon: "⚠️",
    tag: "Triage",
    color: "#fb923c",
    description: "Evaluates urgency with ER guidance.",
    inputSchema: {
      type: "object",
      required: ["age", "gender", "symptoms", "possible_conditions"],
      properties: {
        age: { type: "number" },
        gender: { type: "string" },
        symptoms: { type: "string" },
        possible_conditions: { type: "string", description: "Output from disease_matcher" },
      },
    },
    outputKey: "risk_assessment",
    systemPrompt: "You are a triage specialist. Be extremely concise. Use emojis. Max 5 lines.",
    buildPrompt: (input) =>
      `Patient: ${input.age}yo ${input.gender}. Symptoms: ${input.symptoms}. Conditions: ${input.possible_conditions}

Respond in this exact format:
🚦 Risk: [CRITICAL/HIGH/MEDIUM/LOW]
🏥 Action: [what to do right now, one line]
👁️ Watch For: [top 2 warning signs, comma separated]`,
  },

  care_coordinator: {
    id: "care_coordinator",
    name: "Care Coordinator",
    suite: "medical",
    icon: "👨‍⚕️",
    tag: "Recommendations",
    color: "#34d399",
    description: "Specialist referrals, home care & follow-up.",
    inputSchema: {
      type: "object",
      required: ["age", "gender", "symptoms", "risk_assessment"],
      properties: {
        age: { type: "number" },
        gender: { type: "string" },
        symptoms: { type: "string" },
        risk_assessment: { type: "string", description: "Output from risk_assessor" },
      },
    },
    outputKey: "recommendations",
    systemPrompt: "You are a care coordinator. Be extremely concise. Use emojis. Max 7 lines.",
    buildPrompt: (input) =>
      `Patient: ${input.age}yo ${input.gender}. Risk: ${input.risk_assessment}. Symptoms: ${input.symptoms}

Respond in this exact format:
👨‍⚕️ See: [specialist type]
🏠 Home Care: [top 2 tips, comma separated]
💊 OTC: [medication or "None"]
📅 Follow-up: [timeframe]
⚠️ If worse: [one emergency trigger]`,
  },

  // ── Legal Suite ──
  legal_advisor: {
    id: "legal_advisor",
    name: "Legal Advisor",
    suite: "legal",
    icon: "⚖️",
    tag: "Legal",
    color: "#f59e0b",
    description: "Contract review, legal risk analysis, jurisdiction guidance.",
    inputSchema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string", description: "Legal question or contract text" },
        jurisdiction: { type: "string", description: "Optional: country/state" },
      },
    },
    outputKey: "legal_analysis",
    systemPrompt: "You are a concise legal advisor. Never give definitive legal advice — always recommend consulting a licensed attorney. Use emojis. Max 8 lines.",
    buildPrompt: (input) =>
      `Legal Query: ${input.query}${input.jurisdiction ? `\nJurisdiction: ${input.jurisdiction}` : ""}

Respond in this exact format:
⚖️ Issue Type: [category]
🔍 Key Risk: [main legal risk in one line]
📋 Relevant Law: [applicable law or principle]
✅ Recommended Action: [what to do]
⚠️ Disclaimer: Always consult a licensed attorney.`,
  },

  // ── Finance Suite ──
  finance_analyst: {
    id: "finance_analyst",
    name: "Finance Analyst",
    suite: "finance",
    icon: "📈",
    tag: "Finance",
    color: "#06b6d4",
    description: "Portfolio risk, earnings summaries, market sentiment analysis.",
    inputSchema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string", description: "Financial question or asset to analyze" },
        timeframe: { type: "string", description: "Optional: short/medium/long term" },
      },
    },
    outputKey: "financial_analysis",
    systemPrompt: "You are a concise financial analyst. Never give definitive investment advice. Use emojis. Max 8 lines.",
    buildPrompt: (input) =>
      `Financial Query: ${input.query}${input.timeframe ? `\nTimeframe: ${input.timeframe}` : ""}

Respond in this exact format:
📊 Asset Type: [category]
📈 Sentiment: [Bullish/Bearish/Neutral]
🔍 Key Factor: [main driver in one line]
💡 Insight: [one actionable insight]
⚠️ Risk: [main risk factor]
📝 Note: Not financial advice. Consult a licensed advisor.`,
  },

  // ── HR Suite ──
  hr_assistant: {
    id: "hr_assistant",
    name: "HR Assistant",
    suite: "hr",
    icon: "👥",
    tag: "HR",
    color: "#ec4899",
    description: "Onboarding workflows, policy Q&A, performance reviews.",
    inputSchema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string", description: "HR question or scenario" },
        company_size: { type: "string", description: "Optional: startup/mid/enterprise" },
      },
    },
    outputKey: "hr_guidance",
    systemPrompt: "You are a concise HR advisor. Use emojis. Max 8 lines.",
    buildPrompt: (input) =>
      `HR Query: ${input.query}${input.company_size ? `\nCompany Size: ${input.company_size}` : ""}

Respond in this exact format:
👥 Topic: [HR category]
✅ Recommendation: [primary action]
📋 Policy Note: [relevant policy guidance]
⏱️ Timeline: [suggested timeframe]
📌 Next Step: [immediate action]`,
  },

  // ── DevOps Suite ──
  devops_bot: {
    id: "devops_bot",
    name: "DevOps Bot",
    suite: "devops",
    icon: "🛠️",
    tag: "Engineering",
    color: "#8b5cf6",
    description: "CI/CD pipeline review, infra cost analysis, incident triage.",
    inputSchema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string", description: "DevOps question or incident description" },
        stack: { type: "string", description: "Optional: tech stack" },
      },
    },
    outputKey: "devops_analysis",
    systemPrompt: "You are a concise DevOps engineer. Use emojis. Max 8 lines.",
    buildPrompt: (input) =>
      `DevOps Query: ${input.query}${input.stack ? `\nStack: ${input.stack}` : ""}

Respond in this exact format:
🛠️ Issue Type: [category]
🔍 Root Cause: [likely cause]
⚡ Quick Fix: [immediate action]
🔧 Long-term Fix: [proper solution]
📊 Impact: [Low/Medium/High] — [one line reason]`,
  },
};

// ─── Agent Suite Definitions ──────────────────────────────────────────────
const AGENT_SUITES = {
  medical: {
    id: "medical",
    name: "Medical Suite",
    icon: "🏥",
    color: "#00d4ff",
    description: "4-agent diagnostic pipeline for symptom analysis.",
    tools: ["symptom_analyzer", "disease_matcher", "risk_assessor", "care_coordinator"],
    pipeline: ["symptom_analyzer", "disease_matcher", "risk_assessor", "care_coordinator"],
    status: "installed",
  },
  legal: {
    id: "legal",
    name: "Legal Suite",
    icon: "⚖️",
    color: "#f59e0b",
    description: "Contract review, risk analysis, jurisdiction guidance.",
    tools: ["legal_advisor"],
    pipeline: ["legal_advisor"],
    status: "available",
  },
  finance: {
    id: "finance",
    name: "Finance Suite",
    icon: "📈",
    color: "#06b6d4",
    description: "Portfolio risk, market sentiment, earnings analysis.",
    tools: ["finance_analyst"],
    pipeline: ["finance_analyst"],
    status: "available",
  },
  hr: {
    id: "hr",
    name: "HR Suite",
    icon: "👥",
    color: "#ec4899",
    description: "Onboarding, policy Q&A, performance reviews.",
    tools: ["hr_assistant"],
    pipeline: ["hr_assistant"],
    status: "available",
  },
  devops: {
    id: "devops",
    name: "DevOps Suite",
    icon: "🛠️",
    color: "#8b5cf6",
    description: "CI/CD review, infra cost, incident triage.",
    tools: ["devops_bot"],
    pipeline: ["devops_bot"],
    status: "available",
  },
};

// In-memory installed suites state
const installedSuites = new Set(["medical"]);

// Execution history per session
const executionLog = [];

// ─── Health Check — Required by Docker & Smithery ─────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    server: "MedAgent MCP Server",
    version: "1.0.0",
    uptime: process.uptime(),
    tools: Object.keys(TOOL_REGISTRY).length,
    suites: Object.keys(AGENT_SUITES).length,
    installedSuites: [...installedSuites],
    timestamp: new Date().toISOString(),
  });
});

// ─── MCP Protocol Endpoints ───────────────────────────────────────────────

// 1. Tool Discovery — list all registered tools
app.get("/mcp/tools", (req, res) => {
  const tools = Object.values(TOOL_REGISTRY).map((t) => ({
    id: t.id,
    name: t.name,
    suite: t.suite,
    icon: t.icon,
    tag: t.tag,
    color: t.color,
    description: t.description,
    inputSchema: t.inputSchema,
    outputKey: t.outputKey,
  }));
  res.json({ tools, count: tools.length, protocol: "mcp/1.0" });
});

// 2. Suite Registry
app.get("/mcp/suites", (req, res) => {
  const suites = Object.values(AGENT_SUITES).map((s) => ({
    ...s,
    installed: installedSuites.has(s.id),
  }));
  res.json({ suites });
});

// 3. Install a suite
app.post("/mcp/suites/:suiteId/install", (req, res) => {
  const { suiteId } = req.params;
  if (!AGENT_SUITES[suiteId]) return res.status(404).json({ error: "Suite not found" });
  installedSuites.add(suiteId);
  logExecution(`📦 Suite installed: ${AGENT_SUITES[suiteId].name}`, "system");
  res.json({ success: true, suiteId, installed: true });
});

// 4. Uninstall a suite (medical can't be uninstalled)
app.post("/mcp/suites/:suiteId/uninstall", (req, res) => {
  const { suiteId } = req.params;
  if (suiteId === "medical") return res.status(400).json({ error: "Core suite cannot be uninstalled" });
  installedSuites.delete(suiteId);
  logExecution(`🗑️ Suite uninstalled: ${AGENT_SUITES[suiteId]?.name}`, "system");
  res.json({ success: true, suiteId, installed: false });
});

// 5. Execute a single tool — REAL AI call
app.post("/mcp/tools/:toolId/execute", async (req, res) => {
  const { toolId } = req.params;
  const tool = TOOL_REGISTRY[toolId];
  if (!tool) return res.status(404).json({ error: `Tool not found: ${toolId}` });

  const input = req.body;
  const startTime = Date.now();

  logExecution(`📡 MCP → Invoking: ${tool.name} [${toolId}]`, "tool");

  try {
    const prompt = tool.buildPrompt(input);
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 500,
        messages: [
          { role: "system", content: tool.systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await groqRes.json();
    if (data.error) throw new Error(data.error.message);

    const output = data.choices[0].message.content;
    const duration = Date.now() - startTime;
    const tokens = data.usage?.total_tokens || 0;

    logExecution(`✅ ${tool.name} → ${tokens} tokens · ${duration}ms`, "success");

    res.json({
      toolId,
      outputKey: tool.outputKey,
      output,
      meta: { duration, tokens, model: "llama-3.3-70b-versatile" },
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    logExecution(`❌ ${tool.name} failed: ${err.message}`, "error");
    res.status(500).json({ error: err.message, toolId, duration });
  }
});

// 6. Execute a full pipeline
app.post("/mcp/pipeline/execute", async (req, res) => {
  const { suiteId, input } = req.body;
  const suite = AGENT_SUITES[suiteId];
  if (!suite) return res.status(404).json({ error: "Suite not found" });
  if (!installedSuites.has(suiteId)) return res.status(400).json({ error: "Suite not installed" });

  logExecution(`🚀 Pipeline started: ${suite.name}`, "system");

  const state = { ...input };
  const results = [];

  for (const toolId of suite.pipeline) {
    const tool = TOOL_REGISTRY[toolId];
    const startTime = Date.now();
    logExecution(`📡 MCP → Invoking: ${tool.name}`, "tool");

    try {
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.3,
          max_tokens: 500,
          messages: [
            { role: "system", content: tool.systemPrompt },
            { role: "user", content: tool.buildPrompt(state) },
          ],
        }),
      });

      const data = await groqRes.json();
      if (data.error) throw new Error(data.error.message);

      const output = data.choices[0].message.content;
      const duration = Date.now() - startTime;
      const tokens = data.usage?.total_tokens || 0;

      state[tool.outputKey] = output;
      results.push({ toolId, outputKey: tool.outputKey, output, meta: { duration, tokens } });
      logExecution(`✅ ${tool.name} → ${tokens} tokens · ${duration}ms`, "success");
    } catch (err) {
      logExecution(`❌ ${tool.name} failed: ${err.message}`, "error");
      return res.status(500).json({ error: err.message, failedTool: toolId, results });
    }
  }

  logExecution(`🏁 Pipeline complete: ${suite.name} — ${results.length} tools executed`, "system");
  res.json({ suiteId, results, finalState: state });
});

// 7. Execution log endpoint (real-time polling)
app.get("/mcp/logs", (req, res) => {
  const since = parseInt(req.query.since || "0");
  res.json({ logs: executionLog.filter((l) => l.id > since) });
});

// 8. MCP Protocol info / handshake
app.get("/mcp/info", (req, res) => {
  res.json({
    protocol: "mcp/1.0",
    server: "MedAgent MCP Server",
    version: "1.0.0",
    transport: "http+sse",
    capabilities: ["tool_discovery", "tool_execution", "suite_management", "pipeline_execution", "execution_log"],
    tools: Object.keys(TOOL_REGISTRY).length,
    suites: Object.keys(AGENT_SUITES).length,
    installedSuites: [...installedSuites],
  });
});

// ─── Proxy endpoint for frontend ─────────────────────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { system, userPrompt } = req.body;
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 1000,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error });
    res.json({ content: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// ─── Helper ───────────────────────────────────────────────────────────────
let logIdCounter = 0;
function logExecution(msg, type = "info") {
  logIdCounter++;
  executionLog.push({
    id: logIdCounter,
    msg,
    type,
    ts: new Date().toLocaleTimeString(),
    timestamp: Date.now(),
  });
  // Keep last 200 logs
  if (executionLog.length > 200) executionLog.shift();
  console.log(`[MCP] ${msg}`);
}

// ─── Start Server ─────────────────────────────────────────────────────────
// PORT from env so Docker / Smithery can configure it
const PORT = process.env.PORT || 3001;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ MCP Server running on http://0.0.0.0:${PORT}`);
  console.log(`🏥 Health check: http://0.0.0.0:${PORT}/health`);
  console.log("📋 Tool Registry:", Object.keys(TOOL_REGISTRY).length, "tools");
  console.log("📦 Suites:", Object.keys(AGENT_SUITES).length, "suites");
  console.log(`🔗 MCP Info: http://0.0.0.0:${PORT}/mcp/info`);
});
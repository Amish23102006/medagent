import { useState, useEffect, useRef, useCallback } from "react";

// ─── Real MCP Client ──────────────────────────────────────────────────────
const MCP_BASE = "/mcp";

const mcpClient = {
  async getInfo() {
    const r = await fetch(`${MCP_BASE}/info`);
    return r.json();
  },
  async getTools() {
    const r = await fetch(`${MCP_BASE}/tools`);
    return r.json();
  },
  async getSuites() {
    const r = await fetch(`${MCP_BASE}/suites`);
    return r.json();
  },
  async installSuite(suiteId) {
    const r = await fetch(`${MCP_BASE}/suites/${suiteId}/install`, { method: "POST" });
    return r.json();
  },
  async uninstallSuite(suiteId) {
    const r = await fetch(`${MCP_BASE}/suites/${suiteId}/uninstall`, { method: "POST" });
    return r.json();
  },
  async executeTool(toolId, input) {
    const r = await fetch(`${MCP_BASE}/tools/${toolId}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return r.json();
  },
  async executePipeline(suiteId, input) {
    const r = await fetch(`${MCP_BASE}/pipeline/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suiteId, input }),
    });
    return r.json();
  },
  async getLogs(since = 0) {
    const r = await fetch(`${MCP_BASE}/logs?since=${since}`);
    return r.json();
  },
};

// ─── Colour helpers ───────────────────────────────────────────────────────
function hex(c, a) { return `${c}${Math.round(a * 255).toString(16).padStart(2, "0")}`; }

// ─── RiskBadge ────────────────────────────────────────────────────────────
function RiskBadge({ text }) {
  if (!text) return null;
  const level = text.match(/CRITICAL|HIGH|MEDIUM|LOW/i)?.[0]?.toUpperCase();
  const map = {
    CRITICAL: { bg: "#ff2d2d22", border: "#ff2d2d", color: "#ff6b6b" },
    HIGH:     { bg: "#fb923c22", border: "#fb923c", color: "#fb923c" },
    MEDIUM:   { bg: "#fbbf2422", border: "#fbbf24", color: "#fbbf24" },
    LOW:      { bg: "#34d39922", border: "#34d399", color: "#34d399" },
  };
  if (!level) return null;
  const s = map[level];
  return (
    <span style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, borderRadius: 6, padding: "2px 10px", fontSize: 11, fontWeight: 700, letterSpacing: 1, fontFamily: "monospace" }}>
      {level}
    </span>
  );
}

// ─── AgentCard ────────────────────────────────────────────────────────────
function AgentCard({ tool, result, active, done, meta }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { if (done) setOpen(true); }, [done]);

  return (
    <div style={{
      border: `1px solid ${active || done ? tool.color + "66" : "#1e2a3a"}`,
      borderRadius: 14, background: active ? `${tool.color}0d` : done ? "#0d1620" : "#080e16",
      transition: "all 0.4s", overflow: "hidden",
      boxShadow: active ? `0 0 24px ${tool.color}33` : "none",
    }}>
      <div onClick={() => done && setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", cursor: done ? "pointer" : "default" }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: `${tool.color}22`,
          border: `1.5px solid ${tool.color}55`, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 20,
          animation: active ? "pulse 1.2s ease infinite" : "none",
        }}>{tool.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 15 }}>{tool.name}</span>
            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: `${tool.color}22`, color: tool.color, fontWeight: 600 }}>{tool.tag}</span>
            {done && <RiskBadge text={result} />}
            {done && meta && (
              <span style={{ fontSize: 10, color: "#334155", fontFamily: "monospace" }}>
                {meta.tokens}tok · {meta.duration}ms
              </span>
            )}
          </div>
          <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{tool.description}</div>
        </div>
        <div>
          {active && <span style={{ color: tool.color, fontSize: 12, animation: "blink 1s infinite" }}>● Running</span>}
          {done && <span style={{ color: "#34d399", fontSize: 18 }}>{open ? "▲" : "▼"}</span>}
          {!active && !done && <span style={{ color: "#1e2a3a", fontSize: 18 }}>○</span>}
        </div>
      </div>
      {open && done && (
        <div style={{ borderTop: `1px solid ${tool.color}22`, padding: "16px 20px", background: "#060c14" }}>
          {result?.split('\n').filter(l => l.trim()).map((line, i) => (
            <div key={i} style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.6, fontFamily: "monospace", padding: "4px 10px", background: "#0a1220", borderRadius: 6, borderLeft: `2px solid ${tool.color}44`, marginBottom: 4 }}>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Suite Card for Marketplace ───────────────────────────────────────────
function SuiteCard({ suite, onInstall, onUninstall, installing }) {
  const isCore = suite.id === "medical";
  return (
    <div style={{
      border: `1px solid ${suite.installed ? suite.color + "55" : "#1a2332"}`,
      borderRadius: 14, background: suite.installed ? `${suite.color}08` : "#080e16",
      padding: "18px 20px", transition: "all 0.3s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = suite.color + "88"}
      onMouseLeave={e => e.currentTarget.style.borderColor = suite.installed ? suite.color + "55" : "#1a2332"}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${suite.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{suite.icon}</div>
          <div>
            <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14 }}>{suite.name}</div>
            <div style={{ color: "#64748b", fontSize: 11.5, marginTop: 3, maxWidth: 220 }}>{suite.description}</div>
            <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {suite.tools?.map(tid => (
                <span key={tid} style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: `${suite.color}15`, color: suite.color, fontFamily: "monospace" }}>{tid}</span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          {suite.installed ? (
            <>
              <span style={{ fontSize: 10, color: "#34d399", border: "1px solid #34d39944", borderRadius: 6, padding: "3px 8px" }}>✓ Installed</span>
              {!isCore && (
                <button onClick={() => onUninstall(suite.id)} disabled={installing}
                  style={{ fontSize: 10, color: "#ef4444", border: "1px solid #ef444444", borderRadius: 6, padding: "3px 8px", background: "transparent", cursor: "pointer" }}>
                  Remove
                </button>
              )}
            </>
          ) : (
            <button onClick={() => onInstall(suite.id)} disabled={installing}
              style={{ fontSize: 10, color: suite.color, border: `1px solid ${suite.color}55`, borderRadius: 6, padding: "4px 12px", background: `${suite.color}11`, cursor: installing ? "not-allowed" : "pointer", fontWeight: 600 }}>
              {installing ? "Installing…" : "+ Install"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Standalone Agent Tester ──────────────────────────────────────────────
function AgentTester({ tools, installedSuites }) {
  const [selectedTool, setSelectedTool] = useState(null);
  const [inputs, setInputs] = useState({});
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const installedToolIds = installedSuites.flatMap(s => s.tools || []);
  const availableTools = tools.filter(t => installedToolIds.includes(t.id));

  const handleRun = async () => {
    if (!selectedTool) return;
    setRunning(true); setResult(null); setError(null);
    try {
      const res = await mcpClient.executeTool(selectedTool.id, inputs);
      if (res.error) throw new Error(res.error);
      setResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  const tool = selectedTool;
  const schema = tool?.inputSchema?.properties || {};

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
      <div>
        <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Select Tool</div>
        {availableTools.length === 0 && (
          <div style={{ color: "#334155", fontSize: 12, padding: 12 }}>No tools installed. Install a suite from Marketplace.</div>
        )}
        {availableTools.map(t => (
          <div key={t.id} onClick={() => { setSelectedTool(t); setInputs({}); setResult(null); }}
            style={{
              padding: "12px 14px", borderRadius: 10, marginBottom: 8, cursor: "pointer",
              border: `1px solid ${selectedTool?.id === t.id ? t.color + "66" : "#1a2332"}`,
              background: selectedTool?.id === t.id ? `${t.color}0d` : "#080e16",
              transition: "all 0.2s",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>{t.icon}</span>
              <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>{t.name}</span>
            </div>
            <div style={{ color: "#475569", fontSize: 11, marginTop: 3 }}>{t.description}</div>
          </div>
        ))}
      </div>

      <div>
        {!tool && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#1e2a3a", fontSize: 14 }}>
            ← Select a tool to test it
          </div>
        )}
        {tool && (
          <>
            <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
              Inputs — <span style={{ color: tool.color }}>{tool.name}</span>
            </div>
            {Object.entries(schema).map(([key, prop]) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <label style={{ color: "#475569", fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {key} {tool.inputSchema.required?.includes(key) && <span style={{ color: "#ef4444" }}>*</span>}
                </label>
                {prop.enum ? (
                  <select value={inputs[key] || ""} onChange={e => setInputs(p => ({ ...p, [key]: e.target.value }))}
                    style={{ width: "100%", background: "#080e16", border: "1px solid #1a2332", borderRadius: 8, color: "#e2e8f0", fontSize: 13, padding: "8px 12px" }}>
                    <option value="">Select…</option>
                    {prop.enum.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                ) : (
                  <input type={prop.type === "number" ? "number" : "text"}
                    placeholder={prop.description}
                    value={inputs[key] || ""}
                    onChange={e => setInputs(p => ({ ...p, [key]: prop.type === "number" ? Number(e.target.value) : e.target.value }))}
                    style={{ width: "100%", background: "#080e16", border: "1px solid #1a2332", borderRadius: 8, color: "#e2e8f0", fontSize: 13, padding: "8px 12px" }}
                  />
                )}
              </div>
            ))}
            <button onClick={handleRun} disabled={running}
              style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: running ? "#0f1e2e" : `linear-gradient(135deg,${tool.color},${tool.color}99)`, color: "white", cursor: running ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13 }}>
              {running ? "Running…" : `▶ Execute ${tool.name}`}
            </button>

            {error && <div style={{ marginTop: 12, padding: 12, background: "#ff2d2d11", border: "1px solid #ff2d2d44", borderRadius: 8, color: "#ff6b6b", fontSize: 12 }}>❌ {error}</div>}
            {result && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 11, color: "#475569", fontFamily: "monospace" }}>
                  <span>⏱ {result.meta?.duration}ms</span>
                  <span>🔢 {result.meta?.tokens} tokens</span>
                  <span>🔑 → state.{result.outputKey}</span>
                </div>
                {result.output?.split('\n').filter(l => l.trim()).map((line, i) => (
                  <div key={i} style={{ color: "#94a3b8", fontSize: 13, fontFamily: "monospace", padding: "5px 12px", background: "#060c14", borderRadius: 6, borderLeft: `2px solid ${tool.color}55`, marginBottom: 4 }}>{line}</div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("checker");
  const [mcpInfo, setMcpInfo] = useState(null);
  const [tools, setTools] = useState([]);
  const [suites, setSuites] = useState([]);
  const [logs, setLogs] = useState([]);
  const [lastLogId, setLastLogId] = useState(0);
  const [installing, setInstalling] = useState(null);
  const [consoleSubTab, setConsoleSubTab] = useState("registry");
  const logRef = useRef(null);

  // Medical pipeline state
  const [form, setForm] = useState({ age: "", gender: "male", symptoms: "", medical_history: "" });
  const [pipeline, setPipeline] = useState({ running: false, currentStep: -1, results: {}, metas: {} });

  // Load MCP data on mount
  useEffect(() => {
    async function loadMcp() {
      try {
        const [info, toolsData, suitesData] = await Promise.all([
          mcpClient.getInfo(),
          mcpClient.getTools(),
          mcpClient.getSuites(),
        ]);
        setMcpInfo(info);
        setTools(toolsData.tools || []);
        setSuites(suitesData.suites || []);
      } catch (e) {
        console.error("MCP connect failed:", e);
      }
    }
    loadMcp();
  }, []);

  // Poll real logs from MCP server
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const data = await mcpClient.getLogs(lastLogId);
        if (data.logs?.length) {
          setLogs(prev => [...prev, ...data.logs].slice(-200));
          setLastLogId(data.logs[data.logs.length - 1].id);
        }
      } catch {}
    }, 1000);
    return () => clearInterval(interval);
  }, [lastLogId]);

  // Auto-scroll logs
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const refreshSuites = async () => {
    const data = await mcpClient.getSuites();
    setSuites(data.suites || []);
  };

  const handleInstall = async (suiteId) => {
    setInstalling(suiteId);
    await mcpClient.installSuite(suiteId);
    await refreshSuites();
    setInstalling(null);
  };

  const handleUninstall = async (suiteId) => {
    setInstalling(suiteId);
    await mcpClient.uninstallSuite(suiteId);
    await refreshSuites();
    setInstalling(null);
  };

  // Run medical pipeline via MCP pipeline endpoint
  const runPipeline = async () => {
    if (!form.age || !form.symptoms) return;
    setPipeline({ running: true, currentStep: 0, results: {}, metas: {} });

    const medTools = tools.filter(t => t.suite === "medical");
    const state = { ...form, age: Number(form.age) };
    const results = {};
    const metas = {};

    for (let i = 0; i < medTools.length; i++) {
      const tool = medTools[i];
      setPipeline(p => ({ ...p, currentStep: i }));
      try {
        const res = await mcpClient.executeTool(tool.id, state);
        if (res.error) throw new Error(res.error);
        state[res.outputKey] = res.output;
        results[tool.id] = res.output;
        metas[tool.id] = res.meta;
        setPipeline(p => ({ ...p, results: { ...results }, metas: { ...metas } }));
      } catch (err) {
        console.error(err);
        break;
      }
    }
    setPipeline(p => ({ ...p, running: false, currentStep: -1 }));
  };

  const medTools = tools.filter(t => t.suite === "medical");
  const installedSuites = suites.filter(s => s.installed);

  const nav = (t) => ({
    padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
    background: tab === t ? "#0ea5e911" : "transparent",
    color: tab === t ? "#0ea5e9" : "#475569",
    border: tab === t ? "1px solid #0ea5e944" : "1px solid transparent",
    transition: "all 0.2s",
  });

  const subNav = (t) => ({
    padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600,
    background: consoleSubTab === t ? "#0ea5e911" : "transparent",
    color: consoleSubTab === t ? "#0ea5e9" : "#475569",
    border: consoleSubTab === t ? "1px solid #0ea5e933" : "1px solid transparent",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#030811", fontFamily: "'DM Sans', sans-serif", backgroundImage: "radial-gradient(ellipse at 20% 0%, #0ea5e912 0%, transparent 60%)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=DM+Mono&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, textarea, select, button { font-family: inherit; }
        input:focus, textarea:focus, select:focus { outline: 1px solid #0ea5e944 !important; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes slideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#1e2a3a;border-radius:2px}
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #0f1e2e", padding: "0 32px", background: "#04090f" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#0ea5e9,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏥</div>
            <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 16 }}>MedAgent</span>
            <span style={{ color: "#334155", fontSize: 12 }}>/ MCP Marketplace</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={nav("checker")} onClick={() => setTab("checker")}>🔬 Symptom Checker</button>
            <button style={nav("marketplace")} onClick={() => setTab("marketplace")}>🛒 Marketplace</button>
            <button style={nav("mcp")} onClick={() => setTab("mcp")}>⚡ MCP Console</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {mcpInfo ? (
              <div style={{ fontSize: 11, color: "#34d399", border: "1px solid #0f2233", borderRadius: 6, padding: "4px 10px", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", display: "inline-block", animation: "pulse 2s infinite" }} />
                MCP Connected · {mcpInfo.tools} tools
              </div>
            ) : (
              <div style={{ fontSize: 11, color: "#64748b", border: "1px solid #0f2233", borderRadius: 6, padding: "4px 10px" }}>
                Connecting…
              </div>
            )}
            <div style={{ fontSize: 11, color: "#0ea5e9", border: "1px solid #0f2233", borderRadius: 6, padding: "4px 10px" }}>
              llama-3.3-70b · Groq
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── SYMPTOM CHECKER ─────────────────────────────────────────────── */}
        {tab === "checker" && (
          <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24, animation: "slideIn 0.3s ease" }}>
            <div>
              <h2 style={{ color: "#e2e8f0", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Patient Intake</h2>
              <p style={{ color: "#475569", fontSize: 13, marginBottom: 24 }}>Runs 4 real MCP tools via Groq — each call tracked with tokens & latency</p>

              {[
                { label: "Age", key: "age", type: "number", placeholder: "e.g. 32" },
                { label: "Symptoms", key: "symptoms", type: "textarea", placeholder: "e.g. fever, headache, sore throat for 3 days..." },
                { label: "Medical History", key: "medical_history", type: "textarea", placeholder: "e.g. Diabetes, hypertension (optional)" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <label style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, display: "block", marginBottom: 6, textTransform: "uppercase" }}>{f.label}</label>
                  {f.type === "textarea"
                    ? <textarea value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} rows={3} style={{ width: "100%", background: "#080e16", border: "1px solid #1a2332", borderRadius: 10, color: "#e2e8f0", fontSize: 13, padding: "10px 14px", resize: "vertical" }} />
                    : <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width: "100%", background: "#080e16", border: "1px solid #1a2332", borderRadius: 10, color: "#e2e8f0", fontSize: 13, padding: "10px 14px" }} />
                  }
                </div>
              ))}

              <div style={{ marginBottom: 16 }}>
                <label style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, display: "block", marginBottom: 6, textTransform: "uppercase" }}>Gender</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["male", "female", "other"].map(g => (
                    <button key={g} onClick={() => setForm(p => ({ ...p, gender: g }))}
                      style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${form.gender === g ? "#0ea5e9" : "#1a2332"}`, background: form.gender === g ? "#0ea5e911" : "#080e16", color: form.gender === g ? "#0ea5e9" : "#475569", cursor: "pointer", fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={runPipeline} disabled={pipeline.running || !form.age || !form.symptoms}
                style={{ width: "100%", padding: "14px", borderRadius: 12, cursor: pipeline.running ? "not-allowed" : "pointer", background: pipeline.running ? "#0f1e2e" : "linear-gradient(135deg,#0ea5e9,#6366f1)", border: "none", color: pipeline.running ? "#334155" : "white", fontSize: 14, fontWeight: 700, boxShadow: pipeline.running ? "none" : "0 4px 20px #0ea5e944" }}>
                {pipeline.running ? "⚡ Running MCP Pipeline…" : "▶ Run Agent Pipeline"}
              </button>

              <div style={{ marginTop: 24 }}>
                <div style={{ color: "#334155", fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>Quick Samples</div>
                {[
                  { label: "🤧 Common Cold", age: "25", gender: "male", symptoms: "runny nose, sore throat, mild fever 99F, sneezing, fatigue for 2 days", medical_history: "None" },
                  { label: "❤️ Cardiac Alert", age: "55", gender: "male", symptoms: "chest pain, shortness of breath, left arm pain, sweating for 1 hour", medical_history: "High blood pressure, diabetes" },
                  { label: "🧠 Migraine", age: "30", gender: "female", symptoms: "severe headache on one side, nausea, sensitivity to light, blurred vision for 4 hours", medical_history: "History of migraines" },
                ].map(s => (
                  <button key={s.label} onClick={() => setForm(s)}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 14px", marginBottom: 6, borderRadius: 8, border: "1px solid #1a2332", background: "#080e16", color: "#64748b", cursor: "pointer", fontSize: 12 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#0ea5e944"; e.currentTarget.style.color = "#94a3b8"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#1a2332"; e.currentTarget.style.color = "#64748b"; }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <h2 style={{ color: "#e2e8f0", fontSize: 22, fontWeight: 800 }}>Agent Pipeline</h2>
                  <p style={{ color: "#475569", fontSize: 13, marginTop: 4 }}>Real MCP tool calls — each tracked with tokens & latency</p>
                </div>
                {pipeline.running && (
                  <div style={{ fontSize: 12, color: "#0ea5e9", display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9", animation: "pulse 1s infinite" }} />
                    Step {pipeline.currentStep + 1} / {medTools.length}
                  </div>
                )}
              </div>

              {/* Pipeline flow diagram */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 20, padding: "10px 16px", background: "#080e16", borderRadius: 10, border: "1px solid #0f1e2e", flexWrap: "wrap" }}>
                {medTools.map((tool, i) => (
                  <div key={tool.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: pipeline.results[tool.id] ? `${tool.color}22` : pipeline.running && pipeline.currentStep === i ? `${tool.color}11` : "#0d1620", color: pipeline.results[tool.id] ? tool.color : pipeline.running && pipeline.currentStep === i ? tool.color : "#2a3a4a", border: `1px solid ${pipeline.results[tool.id] ? tool.color + "44" : "#1a2332"}`, transition: "all 0.4s" }}>
                      {tool.icon} {tool.name}
                    </div>
                    {i < medTools.length - 1 && <span style={{ color: "#1e2a3a" }}>→</span>}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {medTools.map((tool, i) => (
                  <AgentCard
                    key={tool.id}
                    tool={tool}
                    result={pipeline.results[tool.id]}
                    active={pipeline.running && pipeline.currentStep === i}
                    done={!!pipeline.results[tool.id]}
                    meta={pipeline.metas[tool.id]}
                  />
                ))}
              </div>

              {pipeline.results["care_coordinator"] && (
                <div style={{ marginTop: 20, padding: "16px 20px", borderRadius: 12, background: "#ff2d2d0a", border: "1px solid #ff2d2d22" }}>
                  <div style={{ color: "#ef4444", fontSize: 12, fontWeight: 700 }}>⚠️ Medical Disclaimer</div>
                  <div style={{ color: "#64748b", fontSize: 11.5, marginTop: 4, lineHeight: 1.6 }}>AI-generated for informational purposes only. Not a substitute for professional medical advice. Always consult a qualified healthcare professional.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MARKETPLACE ─────────────────────────────────────────────────── */}
        {tab === "marketplace" && (
          <div style={{ animation: "slideIn 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
              <div>
                <h2 style={{ color: "#e2e8f0", fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Agent Marketplace</h2>
                <p style={{ color: "#475569", fontSize: 14 }}>Real MCP suites — install to unlock tools & pipelines. Each suite registers actual callable endpoints.</p>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { label: "Total Suites", value: suites.length, color: "#0ea5e9" },
                  { label: "Installed", value: suites.filter(s => s.installed).length, color: "#34d399" },
                  { label: "Total Tools", value: tools.length, color: "#a78bfa" },
                ].map(s => (
                  <div key={s.label} style={{ background: "#080e16", border: "1px solid #1a2332", borderRadius: 12, padding: "12px 16px", textAlign: "center" }}>
                    <div style={{ color: s.color, fontSize: 22, fontWeight: 800 }}>{s.value}</div>
                    <div style={{ color: "#475569", fontSize: 11 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Installed suites */}
            {suites.filter(s => s.installed).length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Installed Suites</span>
                  <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 20, background: "#34d39922", color: "#34d399", fontWeight: 700 }}>ACTIVE</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                  {suites.filter(s => s.installed).map(suite => (
                    <SuiteCard key={suite.id} suite={suite} onInstall={handleInstall} onUninstall={handleUninstall} installing={installing === suite.id} />
                  ))}
                </div>
              </div>
            )}

            {/* Available suites */}
            {suites.filter(s => !s.installed).length > 0 && (
              <div>
                <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Available Suites</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                  {suites.filter(s => !s.installed).map(suite => (
                    <SuiteCard key={suite.id} suite={suite} onInstall={handleInstall} onUninstall={handleUninstall} installing={installing === suite.id} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── MCP CONSOLE ─────────────────────────────────────────────────── */}
        {tab === "mcp" && (
          <div style={{ animation: "slideIn 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <h2 style={{ color: "#e2e8f0", fontSize: 26, fontWeight: 800, marginBottom: 6 }}>MCP Console</h2>
                <p style={{ color: "#475569", fontSize: 13 }}>Real MCP protocol — live tool discovery, execution tracing, and standalone agent testing</p>
              </div>
              {mcpInfo && (
                <div style={{ background: "#080e16", border: "1px solid #34d39933", borderRadius: 10, padding: "10px 16px", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>
                  <div><span style={{ color: "#34d399" }}>protocol:</span> {mcpInfo.protocol}</div>
                  <div><span style={{ color: "#34d399" }}>transport:</span> {mcpInfo.transport}</div>
                  <div><span style={{ color: "#34d399" }}>tools:</span> {mcpInfo.tools} registered</div>
                  <div><span style={{ color: "#34d399" }}>suites:</span> {mcpInfo.suites} total</div>
                </div>
              )}
            </div>

            {/* Sub-navigation */}
            <div style={{ display: "flex", gap: 6, marginBottom: 24, background: "#080e16", padding: 6, borderRadius: 10, border: "1px solid #0f1e2e", width: "fit-content" }}>
              {[
                { id: "registry", label: "🗂️ Tool Registry" },
                { id: "tester", label: "🧪 Agent Tester" },
                { id: "logs", label: "📜 Execution Log" },
                { id: "schema", label: "📐 State Schema" },
              ].map(st => (
                <button key={st.id} style={subNav(st.id)} onClick={() => setConsoleSubTab(st.id)}>{st.label}</button>
              ))}
            </div>

            {/* Tool Registry */}
            {consoleSubTab === "registry" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
                {tools.map((tool, i) => (
                  <div key={tool.id} style={{ border: "1px solid #1a2332", borderRadius: 12, padding: "16px 18px", background: "#080e16" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{tool.icon}</span>
                        <span style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 13 }}>{tool.name}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 9, color: "#1e4a6a", background: "#030810", padding: "2px 6px", borderRadius: 4 }}>step_{i + 1}</span>
                        <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${tool.color}22`, color: tool.color }}>{tool.tag}</span>
                      </div>
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: 10.5, color: "#334155", lineHeight: 1.9 }}>
                      <div><span style={{ color: "#0ea5e966" }}>id: </span><span style={{ color: "#64748b" }}>{tool.id}</span></div>
                      <div><span style={{ color: "#0ea5e966" }}>suite: </span><span style={{ color: "#64748b" }}>{tool.suite}</span></div>
                      <div><span style={{ color: "#0ea5e966" }}>output: </span><span style={{ color: "#a78bfa99" }}>state.{tool.outputKey}</span></div>
                      <div><span style={{ color: "#0ea5e966" }}>required: </span><span style={{ color: "#64748b" }}>[{tool.inputSchema?.required?.join(", ")}]</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Agent Tester */}
            {consoleSubTab === "tester" && (
              <AgentTester tools={tools} installedSuites={installedSuites} />
            )}

            {/* Execution Log — real server logs */}
            {consoleSubTab === "logs" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ color: "#475569", fontSize: 12 }}>{logs.length} events from MCP server</span>
                  <button onClick={() => { setLogs([]); }} style={{ fontSize: 10, color: "#334155", border: "1px solid #1a2332", borderRadius: 5, padding: "2px 8px", background: "transparent", cursor: "pointer" }}>Clear</button>
                </div>
                <div ref={logRef} style={{ background: "#04090e", border: "1px solid #0f1e2e", borderRadius: 12, height: 420, overflowY: "auto", padding: 16, fontFamily: "monospace", fontSize: 11.5 }}>
                  {logs.length === 0
                    ? <div style={{ color: "#1e2a3a", textAlign: "center", marginTop: 80 }}>No executions yet.<br />Run a pipeline or execute a tool to see real logs.</div>
                    : logs.map((log, i) => (
                      <div key={i} style={{ marginBottom: 5, display: "flex", gap: 12 }}>
                        <span style={{ color: "#1e3a4a", flexShrink: 0 }}>{log.ts}</span>
                        <span style={{ color: log.type === "error" ? "#ef4444" : log.type === "success" ? "#34d399" : log.type === "tool" ? "#a78bfa" : log.type === "system" ? "#0ea5e9" : "#475569" }}>
                          {log.msg}
                        </span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* State Schema */}
            {consoleSubTab === "schema" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Medical Suite State Flow</div>
                  <div style={{ background: "#04090e", border: "1px solid #0f1e2e", borderRadius: 12, padding: 20 }}>
                    <pre style={{ fontFamily: "monospace", fontSize: 11, color: "#334155", lineHeight: 2 }}>{`{
  // ── Inputs ──────────────────
  age:               number    ← user
  gender:            string    ← user
  symptoms:          string    ← user
  medical_history:   string    ← user (opt)

  // ── Tool Outputs ─────────────
  symptom_analysis:  string    ← symptom_analyzer
  possible_conditions: string  ← disease_matcher
  risk_assessment:   string    ← risk_assessor
  recommendations:   string    ← care_coordinator
}`}</pre>
                  </div>
                </div>
                <div>
                  <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>MCP Capabilities</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {mcpInfo?.capabilities?.map(cap => (
                      <div key={cap} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#080e16", border: "1px solid #34d39922", borderRadius: 8 }}>
                        <span style={{ color: "#34d399" }}>✓</span>
                        <span style={{ color: "#64748b", fontSize: 12, fontFamily: "monospace" }}>{cap}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, color: "#64748b", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Installed Suites</div>
                  {mcpInfo?.installedSuites?.map(id => (
                    <div key={id} style={{ padding: "8px 12px", background: "#080e16", border: "1px solid #34d39922", borderRadius: 8, marginBottom: 6, fontFamily: "monospace", fontSize: 12, color: "#34d399" }}>
                      ✓ {id}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
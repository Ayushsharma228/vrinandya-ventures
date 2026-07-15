"use client";

import { useEffect, useState } from "react";
import {
  Brain, CheckCircle2, XCircle, Clock, RefreshCw,
  Play, RotateCcw, Zap, Activity, Database, AlertTriangle,
  ChevronRight, User,
} from "lucide-react";

interface Task {
  id: string;
  type: string;
  title: string;
  status: string;
  priority: number;
  sourceId: string | null;
  createdAt: string;
  completedAt: string | null;
  error: string | null;
  output: { analysis?: Analysis; audit?: Audit } | null;
  history: { fromStatus: string; toStatus: string; note: string; createdAt: string }[];
}

interface Analysis {
  leadScore: number;
  priority: string;
  summary: string;
  salesStrategy: string;
  riskFactors: string[];
  closingProbability: number;
  nextAction: string;
  estimatedValue: string;
  isDuplicate?: boolean;
}

interface Audit {
  promptVersion: string;
  toolsUsed: string[];
  inputTokens: number;
  outputTokens: number;
  iterations: number;
  durationMs: number;
  errors: string[];
}

interface ActivityRow {
  id: string;
  action: string;
  toolName: string | null;
  error: string | null;
  duration: number | null;
  createdAt: string;
}

interface Memory {
  id: string;
  type: string;
  key: string;
  value: unknown;
  updatedAt: string;
}

interface AryaData {
  employee: { id: string; name: string; role: string; avatar: string; status: string; isActive: boolean };
  tasksByStatus: Record<string, number>;
  recentTasks: Task[];
  recentActivity: ActivityRow[];
  memories: Memory[];
  totalLeadsProcessed: number;
  completedToday: number;
  failedToday: number;
  llmReady: boolean;
}

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  COMPLETED:  { bg: "rgba(0,198,122,0.1)",  text: "var(--green-500)" },
  FAILED:     { bg: "rgba(239,68,68,0.1)",  text: "#EF4444" },
  PENDING:    { bg: "rgba(245,158,11,0.1)", text: "#F59E0B" },
  PROCESSING: { bg: "rgba(96,165,250,0.1)", text: "#60A5FA" },
  WAITING:    { bg: "rgba(167,139,250,0.1)", text: "#A78BFA" },
  CANCELLED:  { bg: "rgba(255,255,255,0.05)", text: "rgba(255,255,255,0.3)" },
};

export default function AryaPage() {
  const [data, setData]           = useState<AryaData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<"tasks" | "activity" | "memory">("tasks");
  const [selectedTask, setSelected] = useState<Task | null>(null);
  const [leadIdInput, setLeadId]  = useState("");
  const [actionMsg, setActionMsg] = useState("");

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/ai-workforce/arya");
    if (r.ok) setData(await r.json());
    setLoading(false);
  }

  async function doAction(action: string, extra: Record<string, string> = {}) {
    setActionMsg("");
    const r = await fetch("/api/admin/ai-workforce/arya", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const d = await r.json();
    setActionMsg(d.message ?? d.error ?? "Done");
    setTimeout(load, 2000);
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--green-500)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!data) return <div className="p-6 text-sm" style={{ color: "var(--text-400)" }}>Failed to load Arya data.</div>;

  const { employee, tasksByStatus, recentTasks, recentActivity, memories, totalLeadsProcessed, completedToday, failedToday, llmReady } = data;

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
            style={{ background: "var(--bg-muted)" }}>
            {employee.avatar ?? "🌸"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: "var(--text-900)" }}>{employee.name}</h1>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: llmReady ? "rgba(0,198,122,0.1)" : "rgba(239,68,68,0.1)", color: llmReady ? "var(--green-500)" : "#EF4444" }}>
                {llmReady ? "Claude Connected" : "LLM Offline"}
              </span>
            </div>
            <p className="text-sm" style={{ color: "var(--text-400)" }}>{employee.role}</p>
          </div>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--bg-muted)", color: "var(--text-900)", border: "1px solid var(--border)" }}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* LLM Offline Warning */}
      {!llmReady && (
        <div className="flex items-center gap-3 p-4 rounded-xl"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: "#EF4444" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "#EF4444" }}>ANTHROPIC_API_KEY not configured</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>
              Add ANTHROPIC_API_KEY to your environment variables. Tasks will remain in WAITING state until the key is set.
            </p>
          </div>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Leads Processed", value: totalLeadsProcessed, icon: User,          color: "var(--green-500)" },
          { label: "Completed Today",        value: completedToday,      icon: CheckCircle2,  color: "var(--green-500)" },
          { label: "Failed Today",           value: failedToday,         icon: XCircle,       color: "#EF4444" },
          { label: "Pending",                value: tasksByStatus["PENDING"] ?? 0, icon: Clock, color: "#F59E0B" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-2">
              <k.icon className="w-4 h-4" style={{ color: k.color }} />
              <span className="text-xs" style={{ color: "var(--text-400)" }}>{k.label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: "var(--text-900)" }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Task Queue Summary */}
      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Task Queue</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(tasksByStatus).map(([s, c]) => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: STATUS_COLOR[s]?.bg ?? "var(--bg-muted)", color: STATUS_COLOR[s]?.text ?? "var(--text-400)" }}>
                {s}: {c}
              </span>
            ))}
          </div>
        </div>

        {/* Manual Actions */}
        <div className="flex flex-wrap items-end gap-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex gap-2 items-center">
            <input
              value={leadIdInput}
              onChange={(e) => setLeadId(e.target.value)}
              placeholder="Lead ID to qualify..."
              className="px-3 py-1.5 rounded-lg text-sm w-52"
              style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-900)" }}
            />
            <button
              onClick={() => { if (leadIdInput) doAction("qualify_lead", { leadId: leadIdInput }); }}
              disabled={!leadIdInput || !llmReady}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity"
              style={{ background: "var(--green-500)", color: "#000", opacity: (!leadIdInput || !llmReady) ? 0.4 : 1 }}
            >
              <Play className="w-3 h-3" /> Qualify Lead
            </button>
          </div>
          <button
            onClick={() => doAction("process_backlog")}
            disabled={!llmReady}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: "var(--bg-muted)", color: "var(--text-900)", border: "1px solid var(--border)", opacity: !llmReady ? 0.4 : 1 }}
          >
            <Zap className="w-3 h-3" /> Process Backlog
          </button>
        </div>
        {actionMsg && (
          <p className="text-xs mt-2" style={{ color: actionMsg.includes("Error") || actionMsg.includes("error") ? "#EF4444" : "var(--green-500)" }}>
            {actionMsg}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg p-1" style={{ background: "var(--bg-muted)", width: "fit-content" }}>
        {(["tasks", "activity", "memory"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize"
            style={tab === t ? { background: "var(--bg-card)", color: "var(--text-900)" } : { color: "var(--text-400)" }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Tasks */}
      {tab === "tasks" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Task list */}
          <div className="space-y-2">
            {recentTasks.length === 0 && (
              <p className="text-sm p-4" style={{ color: "var(--text-400)" }}>No tasks yet. Arya will start working when leads arrive.</p>
            )}
            {recentTasks.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className="w-full text-left p-4 rounded-xl transition-all"
                style={{
                  background: selectedTask?.id === t.id ? "var(--bg-muted)" : "var(--bg-card)",
                  border: `1px solid ${selectedTask?.id === t.id ? "var(--green-500)" : "var(--border)"}`,
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-900)" }}>{t.title}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: STATUS_COLOR[t.status]?.bg, color: STATUS_COLOR[t.status]?.text }}>
                    {t.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-400)" }}>
                  <span>{t.type}</span>
                  <span>·</span>
                  <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  {t.output?.analysis && (
                    <>
                      <span>·</span>
                      <span style={{ color: "var(--green-500)" }}>Score: {t.output.analysis.leadScore}</span>
                    </>
                  )}
                </div>
                {t.error && (
                  <p className="text-xs mt-1.5 truncate" style={{ color: "#EF4444" }}>{t.error}</p>
                )}
              </button>
            ))}
          </div>

          {/* Task detail */}
          {selectedTask ? (
            <div className="rounded-xl p-5 space-y-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Task Detail</h3>
                {(selectedTask.status === "FAILED" || selectedTask.status === "WAITING") && (
                  <button
                    onClick={() => doAction("retry_task", { taskId: selectedTask.id })}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg"
                    style={{ background: "rgba(96,165,250,0.1)", color: "#60A5FA" }}
                  >
                    <RotateCcw className="w-3 h-3" /> Retry
                  </button>
                )}
              </div>

              {/* Analysis output */}
              {selectedTask.output?.analysis && (
                <div className="space-y-3">
                  {/* Score */}
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold" style={{ color: selectedTask.output.analysis.leadScore >= 70 ? "var(--green-500)" : selectedTask.output.analysis.leadScore >= 40 ? "#F59E0B" : "#EF4444" }}>
                      {selectedTask.output.analysis.leadScore}
                    </div>
                    <div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: selectedTask.output.analysis.priority === "HIGH" ? "rgba(0,198,122,0.1)" : selectedTask.output.analysis.priority === "MEDIUM" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)", color: selectedTask.output.analysis.priority === "HIGH" ? "var(--green-500)" : selectedTask.output.analysis.priority === "MEDIUM" ? "#F59E0B" : "#EF4444" }}>
                        {selectedTask.output.analysis.priority} Priority
                      </span>
                      {selectedTask.output.analysis.closingProbability != null && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>
                          {selectedTask.output.analysis.closingProbability}% closing probability
                        </p>
                      )}
                    </div>
                  </div>

                  {[
                    { label: "Summary",         value: selectedTask.output.analysis.summary },
                    { label: "Sales Strategy",  value: selectedTask.output.analysis.salesStrategy },
                    { label: "Next Action",     value: selectedTask.output.analysis.nextAction },
                    { label: "Estimated Value", value: selectedTask.output.analysis.estimatedValue },
                  ].filter(i => i.value).map((item) => (
                    <div key={item.label}>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--text-400)" }}>{item.label}</p>
                      <p className="text-sm" style={{ color: "var(--text-900)" }}>{item.value}</p>
                    </div>
                  ))}

                  {selectedTask.output.analysis.riskFactors?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-400)" }}>Risk Factors</p>
                      <ul className="space-y-0.5">
                        {selectedTask.output.analysis.riskFactors.map((r, i) => (
                          <li key={i} className="text-xs flex items-start gap-1.5">
                            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "#F59E0B" }} />
                            <span style={{ color: "var(--text-400)" }}>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Audit */}
              {selectedTask.output?.audit && (
                <div className="pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-400)" }}>Execution Audit</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      ["Prompt",      selectedTask.output.audit.promptVersion],
                      ["Iterations",  selectedTask.output.audit.iterations],
                      ["Duration",    `${Math.round((selectedTask.output.audit.durationMs ?? 0) / 1000)}s`],
                      ["Tokens In",   selectedTask.output.audit.inputTokens],
                      ["Tokens Out",  selectedTask.output.audit.outputTokens],
                      ["Tools Used",  selectedTask.output.audit.toolsUsed?.length ?? 0],
                    ].map(([k, v]) => (
                      <div key={String(k)}>
                        <span style={{ color: "var(--text-400)" }}>{k}: </span>
                        <span style={{ color: "var(--text-900)" }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                  {selectedTask.output.audit.toolsUsed?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs" style={{ color: "var(--text-400)" }}>
                        {selectedTask.output.audit.toolsUsed.join(" → ")}
                      </p>
                    </div>
                  )}
                  {selectedTask.output.audit.errors?.length > 0 && (
                    <div className="mt-2">
                      {selectedTask.output.audit.errors.map((e, i) => (
                        <p key={i} className="text-xs" style={{ color: "#EF4444" }}>{e}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* History */}
              {selectedTask.history.length > 0 && (
                <div className="pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-400)" }}>Status History</p>
                  {selectedTask.history.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs mb-1">
                      <span style={{ color: STATUS_COLOR[h.fromStatus]?.text ?? "var(--text-400)" }}>{h.fromStatus}</span>
                      <ChevronRight className="w-3 h-3" style={{ color: "var(--text-300)" }} />
                      <span style={{ color: STATUS_COLOR[h.toStatus]?.text ?? "var(--text-400)" }}>{h.toStatus}</span>
                      <span style={{ color: "var(--text-300)" }}>·</span>
                      <span className="truncate" style={{ color: "var(--text-400)" }}>{h.note}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedTask.error && (
                <div className="p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.08)" }}>
                  <p className="text-xs font-medium" style={{ color: "#EF4444" }}>Error</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-400)" }}>{selectedTask.error}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl p-6 flex items-center justify-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--text-400)" }}>Select a task to view details</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Activity */}
      {tab === "activity" && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {recentActivity.length === 0 ? (
            <p className="p-6 text-sm" style={{ color: "var(--text-400)" }}>No activity yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--bg-muted)", borderBottom: "1px solid var(--border)" }}>
                  {["Action", "Tool", "Duration", "Status", "Time"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-400)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((a) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}>
                    <td className="px-4 py-3 max-w-[250px] truncate text-xs" style={{ color: "var(--text-900)" }}>{a.action}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-400)" }}>{a.toolName ?? "—"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>{a.duration != null ? `${a.duration}ms` : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: a.error ? "#EF4444" : "var(--green-500)" }} />
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>{new Date(a.createdAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Memory */}
      {tab === "memory" && (
        <div className="space-y-2">
          {memories.length === 0 && (
            <p className="text-sm p-4" style={{ color: "var(--text-400)" }}>No memories yet. Arya builds memory as she processes leads.</p>
          )}
          {memories.map((m) => (
            <div key={m.id} className="flex items-start gap-3 p-3 rounded-lg"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <Database className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#A78BFA" }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono font-medium" style={{ color: "var(--text-900)" }}>{m.key}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--bg-muted)", color: "var(--text-400)" }}>{m.type}</span>
                </div>
                <p className="text-xs" style={{ color: "var(--text-400)" }}>
                  {typeof m.value === "string" ? m.value : JSON.stringify(m.value)}
                </p>
              </div>
              <span className="text-xs flex-shrink-0" style={{ color: "var(--text-300)" }}>
                {new Date(m.updatedAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

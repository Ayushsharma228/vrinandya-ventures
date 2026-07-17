"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import {
  ArrowLeft, RefreshCw, Brain, CheckCircle2, XCircle, Clock,
  Zap, Activity, Database, ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
} from "lucide-react";
import Link from "next/link";

interface Employee {
  id: string;
  slug: string;
  name: string;
  role: string;
  description: string | null;
  avatar: string | null;
  status: string;
  isActive: boolean;
}

interface Task {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: number;
  source: string;
  createdAt: string;
  completedAt: string | null;
  result: unknown;
  history: Array<{ id: string; status: string; note: string | null; createdAt: string }>;
}

interface Memory {
  id: string;
  memoryType: string;
  key: string;
  value: unknown;
  updatedAt: string;
  expiresAt: string | null;
}

interface ActivityRow {
  id: string;
  action: string;
  toolName: string | null;
  error: string | null;
  duration: number | null;
  createdAt: string;
}

interface TasksByStatus {
  PENDING?: number;
  PROCESSING?: number;
  COMPLETED?: number;
  FAILED?: number;
  WAITING?: number;
  CANCELLED?: number;
}

interface PageData {
  employee: Employee;
  tasks: Task[];
  memories: Memory[];
  recentActivity: ActivityRow[];
  tasksByStatus: TasksByStatus;
}

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: "var(--green-500)",
  FAILED:    "#EF4444",
  PROCESSING:"#3B82F6",
  PENDING:   "#F59E0B",
  WAITING:   "#8B5CF6",
  CANCELLED: "var(--text-300)",
};

const SLUG_CONTEXT: Record<string, { icon: string; color: string; capability: string }> = {
  arya:   { icon: "🎯", color: "#8B5CF6", capability: "Lead qualification, CRM analysis, sales strategy" },
  lena:   { icon: "📋", color: "#3B82F6", capability: "Listing optimization, quality review, marketplace intelligence" },
  priya:  { icon: "💰", color: "var(--green-500)", capability: "Settlement analysis, finance reconciliation, payout insights" },
  vikram: { icon: "⚙️", color: "#F59E0B", capability: "Order operations, supplier assignment, SLA monitoring" },
  meera:  { icon: "💬", color: "#EC4899", capability: "Seller support, issue resolution, onboarding guidance" },
};

function statusBadge(status: string) {
  const color = STATUS_COLOR[status] ?? "var(--text-400)";
  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium"
      style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}>
      {status}
    </span>
  );
}

export default function AIEmployeePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  // Arya has its own dedicated page
  if (slug === "arya") {
    if (typeof window !== "undefined") window.location.replace("/admin/ai-workforce/arya");
    return null;
  }

  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"tasks" | "activity" | "memory">("tasks");
  const [toggling, setToggling] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch(`/api/admin/ai-workforce/employees/${slug}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, [slug]);

  const toggleActive = async () => {
    if (!data) return;
    setToggling(true);
    await fetch(`/api/admin/ai-workforce/employees/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !data.employee.isActive }),
    });
    await load();
    setToggling(false);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-24 rounded-xl animate-pulse" style={{ background: "var(--bg-card)" }} />
        <div className="h-64 rounded-xl animate-pulse" style={{ background: "var(--bg-card)" }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <Link href="/admin/ai-workforce" className="flex items-center gap-2 text-sm mb-4" style={{ color: "var(--text-400)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to AI Workforce
        </Link>
        <p style={{ color: "var(--text-400)" }}>Employee not found.</p>
      </div>
    );
  }

  const { employee, tasks, memories, recentActivity, tasksByStatus } = data;
  const ctx = SLUG_CONTEXT[slug] ?? { icon: "🤖", color: "var(--accent)", capability: "General AI tasks" };

  const total = Object.values(tasksByStatus).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <Link href="/admin/ai-workforce" className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-400)" }}>
        <ArrowLeft className="w-4 h-4" /> Back to AI Workforce
      </Link>

      {/* Header */}
      <div className="p-5 rounded-xl flex items-start justify-between gap-4 flex-wrap"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: `${ctx.color}15`, border: `1px solid ${ctx.color}30` }}>
            {employee.avatar ?? ctx.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold" style={{ color: "var(--text-900)" }}>{employee.name}</h1>
              <span className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ background: employee.isActive ? "rgba(0,198,122,0.1)" : "rgba(239,68,68,0.1)", color: employee.isActive ? "var(--green-500)" : "#EF4444" }}>
                {employee.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-400)" }}>{employee.role}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-300)" }}>{ctx.capability}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setLoading(true); load(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm"
            style={{ border: "1px solid var(--border)", color: "var(--text-400)" }}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={toggleActive} disabled={toggling}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ background: employee.isActive ? "rgba(239,68,68,0.1)" : "rgba(0,198,122,0.1)", color: employee.isActive ? "#EF4444" : "var(--green-500)", border: `1px solid ${employee.isActive ? "#EF444430" : "rgba(0,198,122,0.3)"}` }}>
            {employee.isActive
              ? <><ToggleRight className="w-4 h-4" /> Deactivate</>
              : <><ToggleLeft className="w-4 h-4" /> Activate</>}
          </button>
        </div>
      </div>

      {/* Task stat tiles */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { key: "PENDING",    label: "Pending",    color: "#F59E0B" },
          { key: "PROCESSING", label: "Running",    color: "#3B82F6" },
          { key: "COMPLETED",  label: "Completed",  color: "var(--green-500)" },
          { key: "FAILED",     label: "Failed",     color: "#EF4444" },
          { key: "WAITING",    label: "Waiting",    color: "#8B5CF6" },
          { key: "CANCELLED",  label: "Cancelled",  color: "var(--text-300)" },
        ].map(({ key, label, color }) => (
          <div key={key} className="p-3 rounded-xl text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="text-xl font-bold" style={{ color }}>{tasksByStatus[key as keyof TasksByStatus] ?? 0}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: "var(--bg-muted)" }}>
        {(["tasks", "activity", "memory"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors"
            style={tab === t ? { background: "var(--bg-card)", color: "var(--text-900)" } : { color: "var(--text-400)" }}>
            {t}
          </button>
        ))}
      </div>

      {/* Tasks tab */}
      {tab === "tasks" && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {tasks.length === 0 ? (
            <div className="p-8 text-center">
              <Brain className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-300)" }} />
              <p className="text-sm" style={{ color: "var(--text-400)" }}>No tasks yet</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-300)" }}>Tasks will appear here when {employee.name} is assigned work</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--bg-muted)", borderBottom: "1px solid var(--border)" }}>
                  {["Title", "Type", "Status", "Priority", "Created", ""].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-300)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <>
                    <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}
                      className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-4 py-3 max-w-[200px]">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-900)" }}>{t.title}</p>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>{t.type}</td>
                      <td className="px-4 py-3">{statusBadge(t.status)}</td>
                      <td className="px-4 py-3 text-center text-xs" style={{ color: "var(--text-400)" }}>{t.priority}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>
                        {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => setExpandedTask(expandedTask === t.id ? null : t.id)}
                          className="flex items-center gap-1 text-xs" style={{ color: "var(--text-300)" }}>
                          {expandedTask === t.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </td>
                    </tr>
                    {expandedTask === t.id && (
                      <tr key={`${t.id}-detail`} style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold" style={{ color: "var(--text-900)" }}>History</p>
                            {t.history.length === 0 ? (
                              <p className="text-xs" style={{ color: "var(--text-300)" }}>No history</p>
                            ) : t.history.map(h => (
                              <div key={h.id} className="flex items-start gap-2 text-xs">
                                <span className="w-24 flex-shrink-0" style={{ color: "var(--text-300)" }}>
                                  {new Date(h.createdAt).toLocaleTimeString("en-IN")}
                                </span>
                                {statusBadge(h.status)}
                                {h.note && <span style={{ color: "var(--text-400)" }}>{h.note}</span>}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Activity tab */}
      {tab === "activity" && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center">
              <Activity className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-300)" }} />
              <p className="text-sm" style={{ color: "var(--text-400)" }}>No activity yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--bg-muted)", borderBottom: "1px solid var(--border)" }}>
                  {["Action", "Tool", "Duration", "Status", "Time"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-300)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentActivity.map(a => (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}
                    className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3 max-w-[240px]">
                      <p className="text-xs truncate" style={{ color: "var(--text-900)" }}>{a.action}</p>
                      {a.error && <p className="text-xs mt-0.5 truncate" style={{ color: "#EF4444" }}>{a.error}</p>}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-400)" }}>
                      {a.toolName ?? <span style={{ color: "var(--text-300)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>
                      {a.duration != null ? `${a.duration}ms` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: a.error ? "#EF4444" : "var(--green-500)" }} />
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>
                      {new Date(a.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Memory tab */}
      {tab === "memory" && (
        <div className="space-y-3">
          {memories.length === 0 ? (
            <div className="p-8 rounded-xl text-center" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <Database className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-300)" }} />
              <p className="text-sm" style={{ color: "var(--text-400)" }}>No memories stored</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-300)" }}>{employee.name} will store context here as tasks are completed</p>
            </div>
          ) : memories.map(m => (
            <div key={m.id} className="p-4 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "var(--bg-muted)", color: "var(--text-400)" }}>{m.memoryType}</span>
                  <span className="text-xs font-mono font-medium" style={{ color: "var(--text-900)" }}>{m.key}</span>
                </div>
                <span className="text-xs" style={{ color: "var(--text-300)" }}>
                  {new Date(m.updatedAt).toLocaleDateString("en-IN")}
                  {m.expiresAt && ` · expires ${new Date(m.expiresAt).toLocaleDateString("en-IN")}`}
                </span>
              </div>
              <pre className="text-xs mt-2 overflow-x-auto whitespace-pre-wrap break-all p-2 rounded"
                style={{ background: "var(--bg-muted)", color: "var(--text-400)" }}>
                {typeof m.value === "string" ? m.value : JSON.stringify(m.value, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

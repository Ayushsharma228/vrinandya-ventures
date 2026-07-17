"use client";

import { useEffect, useState } from "react";
import {
  Brain, CheckCircle2, XCircle, Clock, Zap, Activity,
  RefreshCw, Cpu, Database, Wrench, ChevronRight,
} from "lucide-react";

interface Employee {
  id: string;
  slug: string;
  name: string;
  role: string;
  description: string | null;
  avatar: string | null;
  status: string;
  isActive: boolean;
  pendingTasks: number;
  processingTasks: number;
  completedToday: number;
  failedToday: number;
}

interface ActivityRow {
  id: string;
  action: string;
  toolName: string | null;
  error: string | null;
  duration: number | null;
  createdAt: string;
  employee: { name: string; avatar: string | null; slug: string };
}

interface Tool {
  id: string;
  name: string;
  description: string | null;
  module: string;
}

interface ConsoleData {
  employees: Employee[];
  tasksByStatus: Record<string, number>;
  activitiesToday: number;
  completedToday: number;
  failedToday: number;
  successRate: number;
  avgDuration: number | null;
  recentActivity: ActivityRow[];
  tools: Tool[];
}

const STATUS_COLOR: Record<string, string> = {
  IDLE:    "var(--green-500)",
  BUSY:    "#F59E0B",
  OFFLINE: "rgba(255,255,255,0.3)",
  ERROR:   "#EF4444",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:    "Pending",
  PROCESSING: "Processing",
  WAITING:    "Waiting",
  COMPLETED:  "Completed",
  FAILED:     "Failed",
  CANCELLED:  "Cancelled",
};

const MODULE_COLOR: Record<string, string> = {
  sales:      "#818CF8",
  listing:    "#34D399",
  finance:    "#F59E0B",
  operations: "#60A5FA",
  support:    "#F472B6",
};

export default function AIWorkforcePage() {
  const [data, setData]       = useState<ConsoleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<"overview" | "tasks" | "activity" | "tools">("overview");
  const [tasks, setTasks]     = useState<{ tasks: unknown[]; total: number } | null>(null);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/ai-workforce/console");
    if (r.ok) setData(await r.json());
    setLoading(false);
  }

  async function loadTasks() {
    const r = await fetch("/api/admin/ai-workforce/tasks?limit=50");
    if (r.ok) setTasks(await r.json());
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (tab === "tasks") loadTasks();
  }, [tab]);

  const kpis = data
    ? [
        { label: "AI Employees",      value: data.employees.length,    icon: Brain,         color: "var(--green-500)" },
        { label: "Active Today",       value: data.activitiesToday,     icon: Activity,      color: "#60A5FA" },
        { label: "Completed Today",    value: data.completedToday,      icon: CheckCircle2,  color: "var(--green-500)" },
        { label: "Failed Today",       value: data.failedToday,         icon: XCircle,       color: "#EF4444" },
        { label: "Success Rate",       value: `${data.successRate}%`,   icon: Zap,           color: "#F59E0B" },
        { label: "Avg Response",       value: data.avgDuration ? `${Math.round(data.avgDuration)}ms` : "—", icon: Clock, color: "#A78BFA" },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--green-500)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <main className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-900)" }}>AI Workforce Console</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-400)" }}>
            Monitor and manage AI employees across AXQEN
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: "var(--bg-muted)", color: "var(--text-900)", border: "1px solid var(--border)" }}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k) => (
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
      {data && (
        <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-900)" }}>Task Queue</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(data.tasksByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: "var(--bg-muted)" }}>
                <span className="text-xs font-medium" style={{ color: "var(--text-400)" }}>{STATUS_LABEL[status] ?? status}</span>
                <span className="text-sm font-bold" style={{ color: "var(--text-900)" }}>{count}</span>
              </div>
            ))}
            {Object.keys(data.tasksByStatus).length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-400)" }}>No tasks yet</p>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg p-1" style={{ background: "var(--bg-muted)", width: "fit-content" }}>
        {(["overview", "tasks", "activity", "tools"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize"
            style={tab === t
              ? { background: "var(--bg-card)", color: "var(--text-900)" }
              : { color: "var(--text-400)" }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Overview — Employee Cards */}
      {tab === "overview" && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.employees.map((emp) => (
            <div
              key={emp.id}
              className="rounded-xl p-5 space-y-4 hover:shadow-md transition-shadow"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              {/* Employee header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: "var(--bg-muted)" }}>
                    {emp.avatar ?? "🤖"}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text-900)" }}>{emp.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-400)" }}>{emp.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[emp.status] ?? "rgba(255,255,255,0.3)" }} />
                  <span className="text-xs" style={{ color: "var(--text-400)" }}>{emp.status}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-400)" }}>
                {emp.description ?? "No description"}
              </p>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Pending",    value: emp.pendingTasks,    color: "#F59E0B" },
                  { label: "Processing", value: emp.processingTasks, color: "#60A5FA" },
                  { label: "Done Today", value: emp.completedToday,  color: "var(--green-500)" },
                  { label: "Failed",     value: emp.failedToday,     color: "#EF4444" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg p-2" style={{ background: "var(--bg-muted)" }}>
                    <p className="text-xs" style={{ color: "var(--text-400)" }}>{s.label}</p>
                    <p className="text-lg font-bold" style={{ color: s.value > 0 ? s.color : "var(--text-400)" }}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Status badge */}
              <div className="flex items-center justify-between">
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: emp.isActive ? "rgba(0,198,122,0.1)" : "rgba(239,68,68,0.1)",
                    color: emp.isActive ? "var(--green-500)" : "#EF4444",
                  }}
                >
                  {emp.isActive ? "Active" : "Inactive"}
                </span>
                <button
                  onClick={() => window.location.href = `/admin/ai-workforce/${emp.slug}`}
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "var(--text-400)" }}
                >
                  View <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Tasks */}
      {tab === "tasks" && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {!tasks ? (
            <div className="p-6 text-center text-sm" style={{ color: "var(--text-400)" }}>Loading tasks…</div>
          ) : (tasks.tasks as Array<{
            id: string; title: string; status: string; priority: number; source: string;
            createdAt: string; employee: { name: string; avatar: string | null };
          }>).length === 0 ? (
            <div className="p-6 text-center text-sm" style={{ color: "var(--text-400)" }}>No tasks yet. Assign a task to an employee to get started.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--bg-muted)", borderBottom: "1px solid var(--border)" }}>
                  {["Employee", "Task", "Status", "Priority", "Source", "Created"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-400)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(tasks.tasks as Array<{
                  id: string; title: string; status: string; priority: number; source: string;
                  createdAt: string; employee: { name: string; avatar: string | null };
                }>).map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}>
                    <td className="px-4 py-3">
                      <span>{t.employee.avatar ?? "🤖"} {t.employee.name}</span>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate" style={{ color: "var(--text-900)" }}>{t.title}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{
                        background: t.status === "COMPLETED" ? "rgba(0,198,122,0.1)" : t.status === "FAILED" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                        color:      t.status === "COMPLETED" ? "var(--green-500)" : t.status === "FAILED" ? "#EF4444" : "#F59E0B",
                      }}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center" style={{ color: "var(--text-400)" }}>{t.priority}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>{t.source}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Activity */}
      {tab === "activity" && data && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {data.recentActivity.length === 0 ? (
            <div className="p-6 text-center text-sm" style={{ color: "var(--text-400)" }}>No activity yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--bg-muted)", borderBottom: "1px solid var(--border)" }}>
                  {["Employee", "Action", "Tool", "Duration", "Status", "Time"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-400)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentActivity.map((a) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}>
                    <td className="px-4 py-3 text-xs">{a.employee.avatar ?? "🤖"} {a.employee.name}</td>
                    <td className="px-4 py-3 max-w-[220px] truncate text-xs" style={{ color: "var(--text-900)" }}>{a.action}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>
                      {a.toolName ?? <span style={{ color: "var(--text-300)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>
                      {a.duration != null ? `${a.duration}ms` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: a.error ? "#EF4444" : "var(--green-500)" }} />
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>
                      {new Date(a.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Tools */}
      {tab === "tools" && data && (
        <div>
          {/* Group by module */}
          {["sales", "listing", "finance", "operations", "support"].map((mod) => {
            const modTools = data.tools.filter((t) => t.module === mod);
            if (modTools.length === 0) return null;
            return (
              <div key={mod} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="w-4 h-4" style={{ color: MODULE_COLOR[mod] ?? "var(--text-400)" }} />
                  <h3 className="text-sm font-semibold capitalize" style={{ color: "var(--text-900)" }}>{mod}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-muted)", color: "var(--text-400)" }}>
                    {modTools.length} tools
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {modTools.map((t) => (
                    <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg"
                      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                      <Cpu className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: MODULE_COLOR[mod] ?? "var(--text-400)" }} />
                      <div>
                        <p className="text-xs font-mono font-medium" style={{ color: "var(--text-900)" }}>{t.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>{t.description ?? ""}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

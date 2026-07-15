"use client";

import { useState, useEffect, useCallback } from "react";
import { Settings, Activity, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight } from "lucide-react";

interface Rule {
  id:          string;
  name:        string;
  description: string;
  event:       string;
  enabled:     boolean;
  isSystem:    boolean;
  createdAt:   string;
}

interface LogEntry {
  id:         string;
  event:      string;
  entityType?: string;
  entityId?:  string;
  action:     string;
  result:     string;
  details?:   Record<string, unknown>;
  createdAt:  string;
  rule?:      { name: string } | null;
}

const RESULT_COLORS: Record<string, { bg: string; text: string }> = {
  SUCCESS: { bg: "#dcfce7", text: "#16a34a" },
  FAILED:  { bg: "#fee2e2", text: "#dc2626" },
  SKIPPED: { bg: "#fef9c3", text: "#b45309" },
};

const fmtDate = (d: string) => new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function AutomationPage() {
  const [tab, setTab]     = useState<"rules" | "logs">("rules");
  const [rules, setRules] = useState<Rule[]>([]);
  const [logs,  setLogs]  = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page,  setPage]  = useState(1);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const loadRules = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/automation/rules");
      if (r.ok) { const d = await r.json(); setRules(d.rules ?? []); }
    } finally { setLoading(false); }
  }, []);

  const loadLogs = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/automation/logs?page=${p}`);
      if (r.ok) { const d = await r.json(); setLogs(d.logs ?? []); setTotal(d.total ?? 0); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === "rules") loadRules();
    else                 loadLogs(page);
  }, [tab, page, loadRules, loadLogs]);

  const toggleRule = async (rule: Rule) => {
    setToggling(rule.id);
    try {
      const r = await fetch("/api/admin/automation/rules", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: rule.id, enabled: !rule.enabled }),
      });
      if (r.ok) {
        setRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: !rule.enabled } : r));
      }
    } finally { setToggling(null); }
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div style={{ padding: "24px", maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-900)", margin: 0 }}>Automation Engine</h1>
        <p style={{ color: "var(--text-400)", margin: "4px 0 0", fontSize: 14 }}>Configure rules and view automation activity</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
        {(["rules", "logs"] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            style={{ padding: "8px 20px", border: "none", background: "none", cursor: "pointer", fontSize: 14,
                     fontWeight: tab === t ? 600 : 400,
                     color: tab === t ? "var(--accent)" : "var(--text-400)",
                     borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                     display: "flex", alignItems: "center", gap: 6 }}>
            {t === "rules" ? <Settings size={14} /> : <Activity size={14} />}
            {t === "rules" ? "Rules" : "Activity Log"}
          </button>
        ))}
      </div>

      {/* Rules tab */}
      {tab === "rules" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {loading && <div style={{ color: "var(--text-400)", padding: 16 }}>Loading rules…</div>}
          {rules.map(rule => (
            <div key={rule.id}
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10,
                       padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center",
                       opacity: rule.enabled ? 1 : 0.6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-900)" }}>{rule.name}</span>
                  {rule.isSystem && (
                    <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "var(--bg-muted)",
                                   color: "var(--text-400)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      System
                    </span>
                  )}
                  <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 4,
                                 background: "var(--bg-muted)", color: "var(--accent)" }}>
                    {rule.event}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-400)" }}>{rule.description}</div>
              </div>
              <button onClick={() => toggleRule(rule)} disabled={toggling === rule.id}
                style={{ background: "none", border: "none", cursor: "pointer",
                         color: rule.enabled ? "var(--green-500)" : "var(--text-300)",
                         opacity: toggling === rule.id ? 0.5 : 1 }}>
                {rule.enabled
                  ? <ToggleRight size={24} />
                  : <ToggleLeft  size={24} />}
              </button>
            </div>
          ))}
          {!loading && rules.length === 0 && (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-400)" }}>
              No rules yet — deploy to seed system rules
            </div>
          )}
        </div>
      )}

      {/* Logs tab */}
      {tab === "logs" && (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-400)" }}>
                <th style={{ textAlign: "left", padding: "8px 10px" }}>Time</th>
                <th style={{ textAlign: "left", padding: "8px 10px" }}>Event</th>
                <th style={{ textAlign: "left", padding: "8px 10px" }}>Rule</th>
                <th style={{ textAlign: "left", padding: "8px 10px" }}>Action</th>
                <th style={{ textAlign: "left", padding: "8px 10px" }}>Entity</th>
                <th style={{ textAlign: "left", padding: "8px 10px" }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => {
                const rc = RESULT_COLORS[log.result] ?? { bg: "var(--bg-muted)", text: "var(--text-400)" };
                return (
                  <tr key={log.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px", color: "var(--text-400)", whiteSpace: "nowrap" }}>{fmtDate(log.createdAt)}</td>
                    <td style={{ padding: "10px" }}>
                      <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4,
                                     background: "var(--bg-muted)", color: "var(--accent)" }}>
                        {log.event}
                      </span>
                    </td>
                    <td style={{ padding: "10px", color: "var(--text-400)", fontSize: 12 }}>{log.rule?.name ?? "—"}</td>
                    <td style={{ padding: "10px", fontFamily: "monospace", fontSize: 12 }}>{log.action}</td>
                    <td style={{ padding: "10px", color: "var(--text-400)", fontSize: 12 }}>
                      {log.entityType && <span>{log.entityType}</span>}
                      {log.entityId   && <span style={{ color: "var(--text-300)", marginLeft: 4 }}>{log.entityId.slice(-8)}</span>}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                                     background: rc.bg, color: rc.text }}>
                        {log.result}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "var(--text-400)" }}>
                  No automation activity yet
                </td></tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 20 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)",
                         background: "var(--bg-card)", cursor: "pointer" }}>
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: 13, color: "var(--text-400)" }}>Page {page} of {totalPages} ({total} logs)</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid var(--border)",
                         background: "var(--bg-card)", cursor: "pointer" }}>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

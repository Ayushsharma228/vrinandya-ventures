"use client";

import { useState, useEffect } from "react";
import { Settings, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface Config {
  key: string; value: string; label: string;
  description: string; unit: string; isDefault: boolean; type?: string;
}

export default function AdminConfigPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits,   setEdits]   = useState<Record<string, string>>({});
  const [saving,  setSaving]  = useState<string | null>(null);
  const [saved,   setSaved]   = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/config");
    if (r.ok) {
      const { configs: data } = await r.json();
      setConfigs(data);
      setEdits(Object.fromEntries(data.map((c: Config) => [c.key, c.value])));
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save(key: string) {
    setSaving(key); setError(null); setSaved(null);
    const r = await fetch("/api/admin/config", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ key, value: edits[key] }),
    });
    const json = await r.json();
    if (!r.ok) { setError(json.error ?? "Failed to save"); setSaving(null); return; }
    setSaving(null);
    setSaved(key);
    setConfigs((prev) => prev.map((c) => c.key === key ? { ...c, value: edits[key], isDefault: false } : c));
    setTimeout(() => setSaved(null), 2500);
  }

  const isDirty = (c: Config) => edits[c.key] !== c.value;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Platform Config"
        subtitle="Live-edit commission rates, fees, and remittance settings"
        cards={
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Commission Rate",   value: configs.find(c => c.key === "COMMISSION_RATE")?.value   ?? "5",  unit: "%" },
              { label: "GST on Fees",       value: configs.find(c => c.key === "GST_ON_FEES_RATE")?.value  ?? "18", unit: "%" },
              { label: "Remittance Days",   value: configs.find(c => c.key === "REMITTANCE_DAYS")?.value   ?? "7",  unit: "days" },
            ].map(({ label, value, unit }) => (
              <div key={label} className="rounded-2xl px-5 py-4"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-medium uppercase tracking-wide mb-1"
                  style={{ color: "var(--text-muted)" }}>{label}</p>
                <p className="text-2xl font-bold" style={{ color: "#16A34A" }}>
                  {value}<span className="text-sm font-normal ml-1" style={{ color: "var(--text-secondary)" }}>{unit}</span>
                </p>
              </div>
            ))}
          </div>
        }
      />

      <div className="px-4 md:px-8 py-6">
        {loading ? (
          <div className="py-16 flex justify-center">
            <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "var(--text-300)" }} />
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {configs.map((c) => {
              const dirty   = isDirty(c);
              const isSaved = saved === c.key;
              const isSaving = saving === c.key;

              return (
                <div key={c.key} className="card p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>
                          {c.label}
                        </p>
                        {c.isDefault && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-medium"
                            style={{ background: "var(--bg-muted)", color: "var(--text-400)" }}>
                            default
                          </span>
                        )}
                        {isSaved && (
                          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#16A34A" }}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                          </span>
                        )}
                      </div>
                      <p className="text-xs mb-3" style={{ color: "var(--text-400)" }}>{c.description}</p>

                      <div className="flex items-center gap-3">
                        <div className="relative flex items-center">
                          {c.type === "string" ? (
                            <input
                              type="text"
                              value={edits[c.key] ?? c.value}
                              onChange={(e) => setEdits((prev) => ({ ...prev, [c.key]: e.target.value }))}
                              className="w-52 text-sm font-mono rounded-xl px-3 py-2 border outline-none"
                              style={{
                                background:   "var(--bg-muted)",
                                color:        "var(--text-900)",
                                borderColor:  dirty ? "#16A34A" : "var(--border)",
                                boxShadow:    dirty ? "0 0 0 2px rgba(0,198,122,0.15)" : "none",
                              }}
                            />
                          ) : (
                            <>
                              <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={edits[c.key] ?? c.value}
                                onChange={(e) => setEdits((prev) => ({ ...prev, [c.key]: e.target.value }))}
                                className="w-28 text-sm font-bold rounded-xl px-3 py-2 pr-10 border outline-none"
                                style={{
                                  background:   "var(--bg-muted)",
                                  color:        "var(--text-900)",
                                  borderColor:  dirty ? "#16A34A" : "var(--border)",
                                  boxShadow:    dirty ? "0 0 0 2px rgba(0,198,122,0.15)" : "none",
                                }}
                              />
                              <span className="absolute right-3 text-xs font-medium pointer-events-none"
                                style={{ color: "var(--text-400)" }}>
                                {c.unit}
                              </span>
                            </>
                          )}
                        </div>

                        <button
                          onClick={() => save(c.key)}
                          disabled={!dirty || isSaving}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-40"
                          style={{ background: dirty ? "#16A34A" : "var(--bg-muted)" }}>
                          {isSaving ? "Saving…" : "Save"}
                        </button>

                        {dirty && (
                          <button
                            onClick={() => setEdits((prev) => ({ ...prev, [c.key]: c.value }))}
                            className="text-xs"
                            style={{ color: "var(--text-400)" }}>
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    <Settings className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: "var(--text-300)" }} />
                  </div>
                </div>
              );
            })}

            <p className="text-xs px-1 pt-2" style={{ color: "var(--text-300)" }}>
              Changes take effect on the next order settled after saving. Existing settlements are not retroactively recalculated.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

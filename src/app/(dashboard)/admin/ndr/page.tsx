"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, RotateCcw, PackageX, RefreshCw,
  CheckCircle2, Search, Loader2,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface NdrOrder {
  id: string;
  externalOrderId: string;
  status: string;
  customerName: string | null;
  totalAmount: number;
  awbNumber: string | null;
  courier: string | null;
  ndrReason: string | null;
  ndrStatus: string | null;
  ndrAttempts: number;
  ndrActionTaken: string | null;
  updatedAt: string;
  createdAt: string;
  seller: { id: string; name: string | null; brandName: string | null; email: string };
}

interface Stats {
  pendingCount: number;
  actionedCount: number;
  rtoCount: number;
  reattemptCount: number;
}

type Tab = "pending" | "actioned" | "all";

const ACTION_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  REATTEMPT: { bg: "#EFF6FF", color: "#2563EB", label: "Re-attempt" },
  RTO:       { bg: "#FFF7ED", color: "#EA580C", label: "RTO" },
};

export default function AdminNdrPage() {
  const [orders, setOrders]   = useState<NdrOrder[]>([]);
  const [stats, setStats]     = useState<Stats>({ pendingCount: 0, actionedCount: 0, rtoCount: 0, reattemptCount: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<Tab>("pending");
  const [search, setSearch]   = useState("");

  const fetchData = useCallback(async (t: Tab) => {
    setLoading(true);
    const p = new URLSearchParams({ tab: t });
    const r = await fetch(`/api/admin/ndr?${p}`);
    if (r.ok) {
      const d = await r.json();
      setOrders(d.orders ?? []);
      setStats(d.stats ?? {});
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(tab); }, [fetchData, tab]);

  const displayed = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.externalOrderId.toLowerCase().includes(q) ||
      (o.customerName?.toLowerCase().includes(q) ?? false) ||
      (o.awbNumber?.toLowerCase().includes(q) ?? false) ||
      (o.seller.brandName ?? o.seller.name ?? "").toLowerCase().includes(q) ||
      o.seller.email.toLowerCase().includes(q)
    );
  });

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "pending",  label: "Pending Action", count: stats.pendingCount },
    { key: "actioned", label: "Actioned",        count: stats.actionedCount },
    { key: "all",      label: "All NDRs",        count: stats.pendingCount + stats.actionedCount },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="NDR Management"
        subtitle="Non-delivery reports across all sellers"
        cards={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Pending Action",     value: stats.pendingCount,   color: "#EF4444", icon: AlertTriangle },
              { label: "Re-attempt Requested", value: stats.reattemptCount, color: "#3B82F6", icon: RotateCcw },
              { label: "RTO Initiated",      value: stats.rtoCount,       color: "#F59E0B", icon: PackageX },
              { label: "Total Actioned",     value: stats.actionedCount,  color: "#00C67A", icon: CheckCircle2 },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="rounded-2xl px-5 py-4 flex items-center gap-4"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.1)" }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
                  <p className="text-2xl font-bold text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
        }
      />

      <div className="px-4 md:px-8 py-6 space-y-4">
        {/* Tabs + search */}
        <div className="flex items-center gap-3 flex-wrap justify-between">
          <div className="flex items-center gap-1 rounded-xl p-1"
            style={{ background: "var(--bg-muted)", border: "1px solid var(--border)" }}>
            {tabs.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                style={tab === t.key
                  ? { background: "var(--bg-card)", color: "var(--text-900)", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                  : { color: "var(--text-400)" }}>
                {t.label}
                <span className="px-1.5 py-0.5 rounded-full text-xs"
                  style={{ background: tab === t.key ? "var(--bg-muted)" : "transparent",
                           color: tab === t.key ? "var(--text-400)" : "var(--text-300)" }}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-300)" }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search order, seller, AWB…"
              className="text-xs outline-none w-52"
              style={{ background: "transparent", color: "var(--text-900)" }} />
          </div>

          <button onClick={() => fetchData(tab)} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
            style={{ background: "var(--bg-card)", color: "var(--text-400)", border: "1px solid var(--border)" }}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="py-16 flex items-center justify-center gap-2 text-sm"
              style={{ color: "var(--text-400)" }}>
              <Loader2 className="w-5 h-5 animate-spin" /> Loading…
            </div>
          ) : displayed.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <CheckCircle2 className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm" style={{ color: "var(--text-400)" }}>
                {tab === "pending" ? "No pending NDRs — all clear!" : "No NDRs found"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
                    {["Order #", "Seller", "Customer", "AWB", "NDR Reason", "Attempts", "Seller Action", "Last Updated"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--text-400)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {displayed.map(o => {
                    const action = o.ndrActionTaken ? ACTION_BADGE[o.ndrActionTaken] : null;
                    return (
                      <tr key={o.id} className="hover:bg-gray-50/20 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold font-mono" style={{ color: "var(--accent)" }}>
                            #{o.externalOrderId}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold" style={{ color: "var(--text-900)" }}>
                            {o.seller.brandName ?? o.seller.name ?? "—"}
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-400)" }}>{o.seller.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs" style={{ color: "var(--text-900)" }}>{o.customerName ?? "—"}</p>
                          <p className="text-xs font-semibold" style={{ color: "var(--text-400)" }}>
                            ₹{o.totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono" style={{ color: "var(--text-500)" }}>
                            {o.awbNumber ?? "—"}
                          </span>
                          {o.courier && (
                            <p className="text-xs" style={{ color: "var(--text-300)" }}>{o.courier}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="text-xs truncate" style={{ color: "var(--text-500)" }}>
                            {o.ndrReason ?? "—"}
                          </p>
                          {o.ndrStatus && (
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-300)" }}>{o.ndrStatus}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{
                              background: o.ndrAttempts >= 3 ? "#FEF2F2" : "var(--bg-muted)",
                              color:      o.ndrAttempts >= 3 ? "#DC2626"  : "var(--text-500)",
                            }}>
                            {o.ndrAttempts}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {action ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: action.bg, color: action.color }}>
                              {action.label}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: "#FEF2F2", color: "#DC2626" }}>
                              Awaiting
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>
                          {new Date(o.updatedAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, RotateCcw, PackageX, RefreshCw,
  CheckCircle2, Search, Loader2, ChevronDown, ChevronUp,
  MapPin, Phone,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface NdrOrder {
  id: string;
  externalOrderId: string;
  status: string;
  customerName: string | null;
  customerAddress: { phone?: string; address?: string; city?: string; state?: string; pincode?: string } | null;
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

interface ActionForm {
  action: "REATTEMPT" | "RTO";
  name: string; phone: string; address: string;
  city: string; pincode: string; state: string; comments: string;
}

export default function AdminNdrPage() {
  const [orders,  setOrders]  = useState<NdrOrder[]>([]);
  const [stats,   setStats]   = useState<Stats>({ pendingCount: 0, actionedCount: 0, rtoCount: 0, reattemptCount: 0 });
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<Tab>("pending");
  const [search,  setSearch]  = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Per-order action form state
  const [forms,      setForms]      = useState<Record<string, ActionForm>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk,    setActionOk]    = useState<string | null>(null);

  const fetchData = useCallback(async (t: Tab) => {
    setLoading(true);
    const r = await fetch(`/api/admin/ndr?tab=${t}`);
    if (r.ok) {
      const d = await r.json();
      setOrders(d.orders ?? []);
      setStats(d.stats ?? {});
      // Pre-fill action forms from customer address
      const init: Record<string, ActionForm> = {};
      for (const o of d.orders ?? []) {
        if (!o.ndrActionTaken) {
          const addr = o.customerAddress ?? {};
          init[o.id] = {
            action: "REATTEMPT",
            name:    o.customerName    ?? "",
            phone:   addr.phone        ?? "",
            address: addr.address      ?? "",
            city:    addr.city         ?? "",
            pincode: addr.pincode      ?? "",
            state:   addr.state        ?? "",
            comments: "",
          };
        }
      }
      setForms(init);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(tab); }, [fetchData, tab]);

  function setForm(orderId: string, patch: Partial<ActionForm>) {
    setForms(p => ({ ...p, [orderId]: { ...p[orderId], ...patch } }));
  }

  async function handleAction(orderId: string) {
    const form = forms[orderId];
    if (!form) return;
    setSubmitting(orderId); setActionError(null); setActionOk(null);

    const res = await fetch("/api/admin/ndr/action", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ orderId, ...form }),
    });
    const data = await res.json();
    if (!res.ok) { setActionError(data.error || "Failed"); setSubmitting(null); return; }
    setActionOk(orderId);
    setExpanded(null);
    await fetchData(tab);
    setSubmitting(null);
  }

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
        subtitle="Non-delivery reports — action pending orders or view history"
        cards={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Pending Action",       value: stats.pendingCount,   color: "#EF4444", icon: AlertTriangle },
              { label: "Re-attempt Requested", value: stats.reattemptCount, color: "#3B82F6", icon: RotateCcw },
              { label: "RTO Initiated",        value: stats.rtoCount,       color: "#F59E0B", icon: PackageX },
              { label: "Total Actioned",       value: stats.actionedCount,  color: "#00C67A", icon: CheckCircle2 },
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
              <button key={t.key} onClick={() => { setTab(t.key); setExpanded(null); }}
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

        {actionError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-4 py-2.5 rounded-xl">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {actionError}
          </div>
        )}

        {/* Table / cards */}
        {loading ? (
          <div className="py-16 flex items-center justify-center gap-2 text-sm"
            style={{ color: "var(--text-400)" }}>
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 rounded-2xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <CheckCircle2 className="w-10 h-10" style={{ color: "var(--border)" }} />
            <p className="text-sm" style={{ color: "var(--text-400)" }}>
              {tab === "pending" ? "No pending NDRs — all clear!" : "No NDRs found"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map(o => {
              const action    = o.ndrActionTaken ? ACTION_BADGE[o.ndrActionTaken] : null;
              const isOpen    = expanded === o.id;
              const form      = forms[o.id];
              const isRTO     = form?.action === "RTO";
              const highAttempts = o.ndrAttempts >= 3;

              return (
                <div key={o.id} className="rounded-2xl overflow-hidden"
                  style={{ background: "var(--bg-card)", border: `1px solid ${highAttempts && !o.ndrActionTaken ? "#FCA5A5" : "var(--border)"}` }}>

                  {/* Row header */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Expand toggle — only for pending orders */}
                    {!o.ndrActionTaken && (
                      <button onClick={() => setExpanded(isOpen ? null : o.id)} className="flex-shrink-0">
                        {isOpen
                          ? <ChevronUp  size={14} style={{ color: "var(--text-400)" }} />
                          : <ChevronDown size={14} style={{ color: "var(--text-400)" }} />
                        }
                      </button>
                    )}

                    <div className="flex-1 grid grid-cols-2 md:grid-cols-7 gap-x-4 gap-y-0.5 text-xs items-center min-w-0">
                      {/* Order + seller */}
                      <div className="md:col-span-2">
                        <span className="font-semibold font-mono" style={{ color: "var(--accent)" }}>
                          #{o.externalOrderId}
                        </span>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>
                          {o.seller.brandName ?? o.seller.name ?? o.seller.email}
                        </div>
                      </div>

                      {/* Customer */}
                      <div className="hidden md:block">
                        <div style={{ color: "var(--text-900)" }}>{o.customerName ?? "—"}</div>
                        <div style={{ color: "var(--text-400)" }}>₹{o.totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                      </div>

                      {/* AWB */}
                      <div className="hidden md:block font-mono" style={{ color: "var(--text-400)" }}>
                        {o.awbNumber ?? "—"}
                        {o.courier && <div style={{ color: "var(--text-300)" }}>{o.courier}</div>}
                      </div>

                      {/* NDR reason */}
                      <div className="hidden md:block truncate max-w-[180px]" style={{ color: "var(--text-500)" }}>
                        {o.ndrReason ?? "—"}
                      </div>

                      {/* Attempts */}
                      <div className="hidden md:block text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{
                            background: highAttempts ? "#FEF2F2" : "var(--bg-muted)",
                            color:      highAttempts ? "#DC2626"  : "var(--text-500)",
                          }}>
                          {o.ndrAttempts}
                        </span>
                        {highAttempts && !o.ndrActionTaken && (
                          <div className="text-red-500 text-xs mt-0.5">High!</div>
                        )}
                      </div>

                      {/* Status / action badge */}
                      <div>
                        {action ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: action.bg, color: action.color }}>
                            {action.label}
                          </span>
                        ) : actionOk === o.id ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                            Done
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600">
                            Awaiting
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Inline action form for pending orders */}
                  {isOpen && form && (
                    <div className="px-5 pb-5 border-t pt-4 space-y-3" style={{ borderColor: "var(--border)" }}>
                      {/* Action toggle */}
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setForm(o.id, { action: "REATTEMPT" })}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                          style={!isRTO
                            ? { background: "#EFF6FF", color: "#3B82F6", borderColor: "#BFDBFE" }
                            : { background: "var(--bg-muted)", color: "var(--text-400)", borderColor: "var(--border)" }}>
                          <RotateCcw className="w-4 h-4" /> Re-attempt
                        </button>
                        <button type="button" onClick={() => setForm(o.id, { action: "RTO" })}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                          style={isRTO
                            ? { background: "#FEF2F2", color: "#EF4444", borderColor: "#FECACA" }
                            : { background: "var(--bg-muted)", color: "var(--text-400)", borderColor: "var(--border)" }}>
                          <PackageX className="w-4 h-4" /> Return to Origin
                        </button>
                      </div>

                      {!isRTO && (
                        <>
                          <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                            style={{ background: "rgba(59,130,246,0.08)", color: "#3B82F6" }}>
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            Update customer details if address or phone was incorrect
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                              { label: "Customer Name", key: "name",    icon: null },
                              { label: "Phone *",       key: "phone",   icon: Phone },
                              { label: "Address",       key: "address", icon: null },
                              { label: "City",          key: "city",    icon: null },
                              { label: "Pincode",       key: "pincode", icon: null },
                              { label: "State",         key: "state",   icon: null },
                            ].map(({ label, key }) => (
                              <div key={key} className={key === "address" ? "col-span-2" : ""}>
                                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-400)" }}>{label}</label>
                                <input
                                  value={(form as unknown as Record<string, string>)[key] ?? ""}
                                  onChange={e => setForm(o.id, { [key]: e.target.value } as Partial<ActionForm>)}
                                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                                  style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-900)" }}
                                />
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {isRTO && (
                        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                          style={{ background: "rgba(239,68,68,0.07)", color: "#EF4444" }}>
                          <PackageX className="w-3.5 h-3.5 flex-shrink-0" />
                          Order will be returned to origin. Seller will be notified by email.
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-400)" }}>Comments (optional)</label>
                        <input
                          value={form.comments}
                          onChange={e => setForm(o.id, { comments: e.target.value })}
                          placeholder="e.g. Call before delivery"
                          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                          style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-900)" }}
                        />
                      </div>

                      <button
                        onClick={() => handleAction(o.id)}
                        disabled={submitting === o.id}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ background: isRTO ? "#EF4444" : "#3B82F6", color: "#fff" }}>
                        {submitting === o.id
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                          : isRTO
                            ? <><PackageX className="w-4 h-4" /> Confirm RTO</>
                            : <><RotateCcw className="w-4 h-4" /> Submit Re-attempt</>
                        }
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle, RefreshCw, Loader2, RotateCcw, PackageX,
  Phone, MapPin, CheckCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface NdrOrder {
  id: string;
  externalOrderId: string;
  customerName: string | null;
  customerAddress: { phone?: string; address?: string; city?: string; state?: string; pincode?: string } | null;
  totalAmount: number;
  awbNumber: string | null;
  trackingUrl: string | null;
  ndrReason: string | null;
  ndrStatus: string | null;
  ndrAttempts: number;
  ndrActionTaken: string | null;
  createdAt: string;
}

export default function NdrPage() {
  const [pending, setPending] = useState<NdrOrder[]>([]);
  const [actioned, setActioned] = useState<NdrOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Per-order form state
  const [forms, setForms] = useState<Record<string, {
    action: "REATTEMPT" | "RTO";
    name: string; phone: string; address: string;
    city: string; pincode: string; state: string; comments: string;
  }>>({});

  useEffect(() => { fetchNdr(); }, []);

  async function fetchNdr() {
    setLoading(true);
    const res = await fetch("/api/seller/ndr");
    const data = await res.json();
    setPending(data.pending || []);
    setActioned(data.actioned || []);
    // Pre-fill forms with existing customer address
    const init: typeof forms = {};
    for (const o of data.pending || []) {
      init[o.id] = {
        action: "REATTEMPT",
        name: o.customerName || "",
        phone: o.customerAddress?.phone || "",
        address: o.customerAddress?.address || "",
        city: o.customerAddress?.city || "",
        pincode: o.customerAddress?.pincode || "",
        state: o.customerAddress?.state || "",
        comments: "",
      };
    }
    setForms(init);
    setLoading(false);
  }

  async function handleSync() {
    setSyncing(true); setSyncMsg("");
    const res = await fetch("/api/seller/ndr/sync", { method: "POST" });
    const data = await res.json();
    setSyncMsg(`${data.found ?? 0} NDR(s) found`);
    await fetchNdr();
    setSyncing(false);
  }

  async function handleSubmit(orderId: string) {
    const form = forms[orderId];
    if (!form) return;
    setSubmitting(orderId); setError(null); setSuccess(null);

    const res = await fetch("/api/seller/ndr/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, ...form }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed"); setSubmitting(null); return; }
    setSuccess(orderId);
    await fetchNdr();
    setSubmitting(null);
  }

  function setForm(orderId: string, patch: Partial<typeof forms[string]>) {
    setForms(p => ({ ...p, [orderId]: { ...p[orderId], ...patch } }));
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="NDR Management"
        subtitle="Manage failed delivery attempts — re-attempt or return to origin"
        actions={
          <div className="flex items-center gap-3">
            {syncMsg && <span className="text-xs font-medium" style={{ color: "#00C67A" }}>{syncMsg}</span>}
            <button onClick={handleSync} disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Checking..." : "Sync NDRs"}
            </button>
          </div>
        }
        cards={
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Pending Action", value: pending.length, color: "#EF4444", icon: AlertTriangle },
              { label: "Re-attempt Requested", value: actioned.filter(a => a.ndrActionTaken === "REATTEMPT").length, color: "#3B82F6", icon: RotateCcw },
              { label: "RTO Initiated", value: actioned.filter(a => a.ndrActionTaken === "RTO").length, color: "#F59E0B", icon: PackageX },
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

      <div className="px-8 py-6 space-y-6">
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Pending NDRs */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            Pending Action ({pending.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : pending.length === 0 ? (
            <div className="card py-16 flex flex-col items-center gap-3 text-center">
              <CheckCircle className="w-10 h-10 text-green-400" />
              <p className="text-sm text-gray-500 font-medium">No pending NDRs</p>
              <p className="text-xs text-gray-400">Click "Sync NDRs" to check for failed deliveries</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map(order => {
                const form = forms[order.id];
                const isExpanded = expanded === order.id;
                const isRTO = form?.action === "RTO";
                return (
                  <div key={order.id} className="card overflow-hidden">
                    {/* Header row */}
                    <div className="px-5 py-4 flex items-center gap-4 cursor-pointer"
                      onClick={() => setExpanded(isExpanded ? null : order.id)}>
                      <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900">#{order.externalOrderId}</span>
                          <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs font-semibold rounded-full">
                            {order.ndrAttempts} attempt{order.ndrAttempts !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{order.ndrReason || "Delivery failed"}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-800">₹{order.totalAmount.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{order.customerName || "—"}</p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>

                    {/* Action form */}
                    {isExpanded && form && (
                      <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                        {success === order.id && (
                          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                            <CheckCircle className="w-4 h-4" /> Action submitted successfully!
                          </div>
                        )}

                        {/* Action toggle */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-2">Action</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setForm(order.id, { action: "REATTEMPT" })}
                              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                              style={!isRTO
                                ? { background: "#EFF6FF", color: "#3B82F6", borderColor: "#BFDBFE" }
                                : { background: "#F9FAFB", color: "#6B7280", borderColor: "#E5E7EB" }}>
                              <RotateCcw className="w-4 h-4" /> Re-attempt Delivery
                            </button>
                            <button type="button" onClick={() => setForm(order.id, { action: "RTO" })}
                              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all"
                              style={isRTO
                                ? { background: "#FEF2F2", color: "#EF4444", borderColor: "#FECACA" }
                                : { background: "#F9FAFB", color: "#6B7280", borderColor: "#E5E7EB" }}>
                              <PackageX className="w-4 h-4" /> Return to Origin (RTO)
                            </button>
                          </div>
                        </div>

                        {/* Address fields — only for re-attempt */}
                        {!isRTO && (
                          <>
                            <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                              Update customer details if address/phone was wrong
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Customer Name</label>
                                <input value={form.name} onChange={e => setForm(order.id, { name: e.target.value })}
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> Phone *
                                </label>
                                <input value={form.phone} onChange={e => setForm(order.id, { phone: e.target.value })}
                                  placeholder="10-digit mobile" required
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                                <input value={form.address} onChange={e => setForm(order.id, { address: e.target.value })}
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
                                <input value={form.city} onChange={e => setForm(order.id, { city: e.target.value })}
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Pincode</label>
                                <input value={form.pincode} onChange={e => setForm(order.id, { pincode: e.target.value })}
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">State</label>
                                <input value={form.state} onChange={e => setForm(order.id, { state: e.target.value })}
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Comments (optional)</label>
                                <input value={form.comments} onChange={e => setForm(order.id, { comments: e.target.value })}
                                  placeholder="e.g. Call before delivery"
                                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
                              </div>
                            </div>
                          </>
                        )}

                        {isRTO && (
                          <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                            <PackageX className="w-3.5 h-3.5 flex-shrink-0" />
                            Order will be returned to your pickup address. Status will change to RTO.
                          </div>
                        )}

                        <button onClick={() => handleSubmit(order.id)}
                          disabled={submitting === order.id || (!isRTO && !form.phone)}
                          className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                          style={{ background: isRTO ? "#EF4444" : "#3B82F6", color: "white" }}>
                          {submitting === order.id
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                            : isRTO
                              ? <><PackageX className="w-4 h-4" /> Confirm RTO</>
                              : <><RotateCcw className="w-4 h-4" /> Submit Re-attempt Request</>
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

        {/* Actioned NDRs */}
        {actioned.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-700 mb-3">Recent Actions ({actioned.length})</h2>
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {["Order #", "Customer", "AWB", "NDR Reason", "Action Taken", "Attempts"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {actioned.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-mono text-xs text-blue-600">#{o.externalOrderId}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{o.customerName || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{o.awbNumber || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{o.ndrReason || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          o.ndrActionTaken === "RTO"
                            ? "bg-orange-50 text-orange-600"
                            : "bg-blue-50 text-blue-600"
                        }`}>
                          {o.ndrActionTaken === "RTO" ? "RTO" : "Re-attempt"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{o.ndrAttempts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

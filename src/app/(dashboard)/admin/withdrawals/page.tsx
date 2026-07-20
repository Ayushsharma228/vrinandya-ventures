"use client";

import { useState, useEffect, useCallback } from "react";
import { BanknoteIcon, RefreshCw, CheckCircle2, XCircle, Filter, Clock } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface WithdrawalRequest {
  id: string; amount: number; status: string; adminNote: string | null;
  bankHolder: string; bankAccount: string; bankIfsc: string;
  createdAt: string; processedAt: string | null; walletTxId: string | null;
  seller: { id: string; name: string | null; email: string; brandName: string | null };
}
interface Count { status: string; _count: { id: number } }

const TABS = ["PENDING", "APPROVED", "REJECTED"] as const;
type Tab = (typeof TABS)[number];

const BADGE: Record<string, { bg: string; color: string }> = {
  PENDING:  { bg: "#FEF3C7", color: "#D97706" },
  APPROVED: { bg: "#F0FDF4", color: "#15803D" },
  REJECTED: { bg: "#FEF2F2", color: "#DC2626" },
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

export default function AdminWithdrawalsPage() {
  const [tab,      setTab]      = useState<Tab>("PENDING");
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [counts,   setCounts]   = useState<Count[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [acting,   setActing]   = useState<string | null>(null);
  const [note,     setNote]     = useState("");
  const [bankTxId, setBankTxId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/withdrawals?status=${tab}`);
    if (r.ok) { const d = await r.json(); setRequests(d.requests); setCounts(d.counts); }
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  async function act(id: string, action: "APPROVED" | "REJECTED") {
    setActing(id);
    await fetch(`/api/admin/withdrawals/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action, adminNote: note, bankTxId: bankTxId || undefined }),
    });
    setActing(null); setExpanded(null); setNote(""); setBankTxId("");
    load();
  }

  function countFor(s: string) {
    return counts.find(c => c.status === s)?._count?.id ?? 0;
  }

  const totalPending  = countFor("PENDING");
  const totalApproved = countFor("APPROVED");
  const totalRejected = countFor("REJECTED");

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Payout Requests"
        subtitle="Review and process seller withdrawal requests"
        cards={
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Pending",  value: totalPending,  color: "#F59E0B" },
              { label: "Approved", value: totalApproved, color: "#16A34A" },
              { label: "Rejected", value: totalRejected, color: "#EF4444" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl px-5 py-4"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-medium uppercase tracking-wide mb-1"
                  style={{ color: "var(--text-muted)" }}>{label}</p>
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        }
      />

      <div className="px-4 md:px-8 py-6">
        {/* Tab bar */}
        <div className="flex items-center gap-1 mb-4">
          <Filter className="w-4 h-4 mr-1" style={{ color: "var(--text-400)" }} />
          {TABS.map(s => (
            <button key={s} onClick={() => setTab(s)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={tab === s
                ? { background: "var(--bg-sidebar)", color: "var(--text-primary)" }
                : { color: "var(--text-400)" }}>
              {s}
              {countFor(s) > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                  style={{ background: "var(--bg-muted)" }}>{countFor(s)}</span>
              )}
            </button>
          ))}
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center">
              <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "var(--text-300)" }} />
            </div>
          ) : requests.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2">
              <BanknoteIcon className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm" style={{ color: "var(--text-400)" }}>No {tab.toLowerCase()} requests</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {requests.map(req => {
                const badge = BADGE[req.status] ?? BADGE.PENDING;
                const isOpen = expanded === req.id;
                return (
                  <div key={req.id}>
                    <div className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50/10"
                      onClick={() => setExpanded(isOpen ? null : req.id)}>
                      {/* Amount */}
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(0,198,122,0.1)" }}>
                        <BanknoteIcon className="w-5 h-5" style={{ color: "#16A34A" }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold" style={{ color: "var(--text-900)" }}>
                            ₹{fmt(req.amount)}
                          </p>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: badge.bg, color: badge.color }}>
                            {req.status}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>
                          {req.seller.brandName ?? req.seller.name ?? req.seller.email}
                          {" · "}
                          {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>

                      {tab === "PENDING" && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={e => { e.stopPropagation(); setExpanded(isOpen ? null : req.id); }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ color: "var(--text-primary)" }}
                            style={{ background: "#16A34A" }}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button onClick={e => { e.stopPropagation(); setExpanded(isOpen ? null : req.id); }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      )}

                      {req.status !== "PENDING" && req.processedAt && (
                        <p className="text-xs flex-shrink-0" style={{ color: "var(--text-400)" }}>
                          {req.status === "APPROVED" ? "Paid" : "Rejected"}{" "}
                          {new Date(req.processedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-3 space-y-4"
                        style={{ background: "var(--bg-muted)", borderTop: "1px solid var(--border)" }}>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            { label: "Seller",        value: req.seller.name ?? req.seller.email },
                            { label: "Email",         value: req.seller.email },
                            { label: "Amount",        value: `₹${fmt(req.amount)}` },
                            { label: "Bank Holder",   value: req.bankHolder },
                            { label: "Account",       value: req.bankAccount },
                            { label: "IFSC",          value: req.bankIfsc },
                          ].map(({ label, value }) => (
                            <div key={label} className="rounded-xl p-3"
                              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                              <p className="text-xs" style={{ color: "var(--text-400)" }}>{label}</p>
                              <p className="text-sm font-semibold mt-0.5 break-all" style={{ color: "var(--text-900)" }}>{value}</p>
                            </div>
                          ))}
                        </div>

                        {req.adminNote && (
                          <div className="rounded-xl p-3" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                            <p className="text-xs font-semibold mb-1" style={{ color: "#D97706" }}>Admin Note</p>
                            <p className="text-sm" style={{ color: "var(--text-900)" }}>{req.adminNote}</p>
                          </div>
                        )}

                        {tab === "PENDING" && (
                          <div className="pt-3 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
                            <div>
                              <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-400)" }}>
                                Bank Tx ID (for approval — optional)
                              </p>
                              <input value={bankTxId} onChange={e => setBankTxId(e.target.value)}
                                placeholder="e.g. UTR number from NEFT/IMPS"
                                className="w-full text-sm rounded-xl px-3 py-2 border outline-none"
                                style={{ background: "var(--bg-card)", color: "var(--text-900)", borderColor: "var(--border)" }} />
                            </div>
                            <div>
                              <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-400)" }}>
                                Note (shown to seller on rejection)
                              </p>
                              <input value={note} onChange={e => setNote(e.target.value)}
                                placeholder="Optional note or rejection reason"
                                className="w-full text-sm rounded-xl px-3 py-2 border outline-none"
                                style={{ background: "var(--bg-card)", color: "var(--text-900)", borderColor: "var(--border)" }} />
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => act(req.id, "APPROVED")} disabled={acting === req.id}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                                style={{ background: "#16A34A" }}>
                                <CheckCircle2 className="w-4 h-4" />
                                {acting === req.id ? "Processing…" : "Confirm Approval"}
                              </button>
                              <button onClick={() => act(req.id, "REJECTED")} disabled={acting === req.id}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                                style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

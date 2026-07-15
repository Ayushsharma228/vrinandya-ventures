"use client";

import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, RefreshCw, CheckCircle2, XCircle, ExternalLink, Filter } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface Seller {
  id: string; name: string | null; email: string; brandName: string | null;
  businessName: string | null; phone: string | null; gstNumber: string | null;
  aadhaarNumber: string | null; aadhaarDocUrl: string | null;
  kycStatus: string; onboardingDone: boolean; createdAt: string;
  businessAddress: string | null; pincode: string | null;
  bankName: string | null; bankHolder: string | null; bankIfsc: string | null;
}

interface Count { kycStatus: string; _count: { id: number } }

const STATUS_TABS = ["SUBMITTED", "APPROVED", "REJECTED", "NOT_SUBMITTED"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const BADGE: Record<string, { bg: string; color: string }> = {
  SUBMITTED:     { bg: "#EFF6FF", color: "#2563EB" },
  APPROVED:      { bg: "#F0FDF4", color: "#15803D" },
  REJECTED:      { bg: "#FEF2F2", color: "#DC2626" },
  NOT_SUBMITTED: { bg: "var(--bg-muted)", color: "var(--text-400)" },
};

export default function AdminKycPage() {
  const [tab,      setTab]      = useState<StatusTab>("SUBMITTED");
  const [sellers,  setSellers]  = useState<Seller[]>([]);
  const [counts,   setCounts]   = useState<Count[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rejNote,  setRejNote]  = useState("");
  const [acting,   setActing]   = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/kyc?status=${tab}`);
    if (r.ok) {
      const d = await r.json();
      setSellers(d.sellers); setCounts(d.counts);
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function act(sellerId: string, action: "APPROVED" | "REJECTED") {
    setActing(sellerId);
    await fetch(`/api/admin/kyc/${sellerId}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action, adminNote: rejNote }),
    });
    setActing(null); setExpanded(null); setRejNote("");
    fetchData();
  }

  function countFor(s: string) {
    return counts.find(c => c.kycStatus === s)?._count?.id ?? 0;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="KYC Approvals"
        subtitle="Review and approve seller identity verification submissions"
        cards={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Pending Review", value: countFor("SUBMITTED"),     color: "#3B82F6" },
              { label: "Approved",       value: countFor("APPROVED"),      color: "#00C67A" },
              { label: "Rejected",       value: countFor("REJECTED"),      color: "#EF4444" },
              { label: "Not Submitted",  value: countFor("NOT_SUBMITTED"), color: "#F59E0B" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl px-5 py-4"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p className="text-xs font-medium uppercase tracking-wide mb-1"
                  style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
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
          {STATUS_TABS.map(s => (
            <button key={s} onClick={() => setTab(s)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={tab === s
                ? { background: "var(--bg-sidebar)", color: "white" }
                : { color: "var(--text-400)" }}>
              {s.replace("_", " ")}
              {countFor(s) > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                  style={{ background: "rgba(255,255,255,0.15)" }}>{countFor(s)}</span>
              )}
            </button>
          ))}
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center">
              <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "var(--text-300)" }} />
            </div>
          ) : sellers.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2">
              <ShieldCheck className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm" style={{ color: "var(--text-400)" }}>
                No sellers with status {tab.replace("_", " ").toLowerCase()}
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {sellers.map(seller => {
                const badge = BADGE[seller.kycStatus] ?? BADGE.NOT_SUBMITTED;
                const isOpen = expanded === seller.id;
                return (
                  <div key={seller.id}>
                    {/* Row */}
                    <div
                      className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50/20"
                      onClick={() => setExpanded(isOpen ? null : seller.id)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>
                            {seller.brandName ?? seller.name ?? seller.email}
                          </p>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: badge.bg, color: badge.color }}>
                            {seller.kycStatus.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>
                          {seller.email} · Joined {new Date(seller.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      {tab === "SUBMITTED" && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={e => { e.stopPropagation(); act(seller.id, "APPROVED"); }}
                            disabled={acting === seller.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                            style={{ background: "#00C67A" }}>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button onClick={e => { e.stopPropagation(); setExpanded(isOpen ? null : seller.id); }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div className="px-5 pb-5 pt-3 space-y-4"
                        style={{ background: "var(--bg-muted)", borderTop: "1px solid var(--border)" }}>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {[
                            { label: "GST Number",   value: seller.gstNumber },
                            { label: "Phone",        value: seller.phone },
                            { label: "Business",     value: seller.businessName },
                            { label: "Address",      value: seller.businessAddress },
                            { label: "Pincode",      value: seller.pincode },
                            { label: "Bank",         value: seller.bankName },
                            { label: "Account IFSC", value: seller.bankIfsc },
                            { label: "Holder",       value: seller.bankHolder },
                            { label: "Aadhaar",      value: seller.aadhaarNumber },
                          ].map(({ label, value }) => (
                            <div key={label} className="rounded-xl p-3"
                              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                              <p className="text-xs" style={{ color: "var(--text-400)" }}>{label}</p>
                              <p className="text-sm font-medium mt-0.5" style={{ color: "var(--text-900)" }}>
                                {value ?? <span style={{ color: "var(--text-300)" }}>—</span>}
                              </p>
                            </div>
                          ))}
                        </div>

                        {seller.aadhaarDocUrl && (
                          <a href={seller.aadhaarDocUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold"
                            style={{ color: "#3B82F6" }}>
                            <ExternalLink className="w-3.5 h-3.5" /> View KYC Document
                          </a>
                        )}

                        {tab === "SUBMITTED" && (
                          <div className="pt-3 space-y-2" style={{ borderTop: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold" style={{ color: "var(--text-400)" }}>
                              Rejection reason (shown to seller)
                            </p>
                            <input value={rejNote} onChange={e => setRejNote(e.target.value)}
                              placeholder="e.g. Aadhaar number doesn't match uploaded document"
                              className="w-full text-sm rounded-xl px-3 py-2 border outline-none"
                              style={{ background: "var(--bg-card)", color: "var(--text-900)", borderColor: "var(--border)" }}
                            />
                            <button onClick={() => act(seller.id, "REJECTED")}
                              disabled={acting === seller.id}
                              className="px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
                              style={{ background: "#EF4444" }}>
                              {acting === seller.id ? "Rejecting…" : "Confirm Rejection"}
                            </button>
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

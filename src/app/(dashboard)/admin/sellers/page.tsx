"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHero } from "@/components/layout/page-hero";
import {
  Users, CheckCircle2, XCircle, Clock, RefreshCw,
  ExternalLink, ShoppingCart, Store, BadgeCheck, Ban,
} from "lucide-react";

interface Seller {
  id: string;
  name: string | null;
  email: string;
  username: string | null;
  accountStatus: string;
  plan: string | null;
  planTier: string | null;
  paymentReference: string | null;
  paymentConfirmed: boolean;
  onboardingDone: boolean;
  kycStatus: string;
  aadhaarDocUrl: string | null;
  phone: string | null;
  businessName: string | null;
  createdAt: string;
}

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:   { label: "Pending",   bg: "#FFF7ED", color: "#D97706" },
  ACTIVE:    { label: "Active",    bg: "#F0FDF4", color: "#16A34A" },
  SUSPENDED: { label: "Suspended", bg: "#FEF2F2", color: "#DC2626" },
};

const KYC_STYLE: Record<string, { label: string; color: string }> = {
  NOT_SUBMITTED: { label: "Not Submitted", color: "#9CA3AF" },
  SUBMITTED:     { label: "Submitted",     color: "#3B82F6" },
  APPROVED:      { label: "Approved",      color: "#16A34A" },
  REJECTED:      { label: "Rejected",      color: "#DC2626" },
};

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchSellers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/sellers");
    const data = await res.json();
    setSellers(data.sellers ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchSellers(); }, [fetchSellers]);

  async function handleAction(sellerId: string, action: "activate" | "suspend") {
    setActionLoading(sellerId + action);
    await fetch("/api/admin/sellers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId, action }),
    });
    await fetchSellers();
    setActionLoading(null);
  }

  const filtered = sellers.filter((s) => {
    const matchSearch = !search || [s.name, s.email, s.username, s.businessName, s.paymentReference]
      .some((v) => v?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = !statusFilter || s.accountStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = sellers.filter((s) => s.accountStatus === "PENDING").length;
  const activeCount  = sellers.filter((s) => s.accountStatus === "ACTIVE").length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Sellers"
        subtitle="Manage seller accounts, review KYC, and activate new signups"
        searchValue={search}
        searchPlaceholder="Search by name, email, username, UTR..."
        onSearchChange={setSearch}
        onSearchSubmit={fetchSellers}
        actions={
          <button onClick={fetchSellers} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
            style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
        cards={
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Sellers", value: sellers.length, icon: Users,       color: "#3B82F6" },
              { label: "Pending",       value: pendingCount,   icon: Clock,       color: "#F59E0B" },
              { label: "Active",        value: activeCount,    icon: BadgeCheck,  color: "#00C67A" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl px-5 py-4"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        }
        filters={
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl text-white outline-none"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <option value="" className="text-gray-900 bg-white">All Statuses</option>
            <option value="PENDING" className="text-gray-900 bg-white">Pending</option>
            <option value="ACTIVE" className="text-gray-900 bg-white">Active</option>
            <option value="SUSPENDED" className="text-gray-900 bg-white">Suspended</option>
          </select>
        }
      />

      <div className="px-8 py-6">
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
            <Users className="w-4 h-4" style={{ color: "var(--text-400)" }} />
            <span className="font-semibold text-sm" style={{ color: "var(--text-900)" }}>
              Sellers ({filtered.length})
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--text-400)" }}>Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "#FAFAFA" }}>
                    {["Seller", "Service / Plan", "Payment Ref", "KYC", "Onboarding", "Status", "Joined", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                        style={{ color: "var(--text-400)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="py-12 text-center text-sm" style={{ color: "var(--text-400)" }}>No sellers found</td></tr>
                  ) : filtered.map((s) => {
                    const statusStyle = STATUS_STYLE[s.accountStatus] ?? STATUS_STYLE.PENDING;
                    const kycStyle = KYC_STYLE[s.kycStatus] ?? KYC_STYLE.NOT_SUBMITTED;
                    return (
                      <tr key={s.id} className="hover:bg-gray-50/50">
                        {/* Seller */}
                        <td className="px-4 py-3">
                          <p className="font-semibold text-sm" style={{ color: "var(--text-900)" }}>
                            {s.name || "—"}
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-400)" }}>{s.email}</p>
                          {s.username && (
                            <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-400)" }}>@{s.username}</p>
                          )}
                          {s.businessName && (
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-600)" }}>{s.businessName}</p>
                          )}
                        </td>

                        {/* Service / Plan */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {s.plan === "MARKETPLACE"
                              ? <Store className="w-3.5 h-3.5" style={{ color: "#7C3AED" }} />
                              : <ShoppingCart className="w-3.5 h-3.5" style={{ color: "#3B82F6" }} />
                            }
                            <span className="text-xs font-medium" style={{ color: "var(--text-700)" }}>
                              {s.plan ?? "Not selected"}
                            </span>
                          </div>
                          {s.planTier && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: "#F3F4F6", color: "#6B7280" }}>{s.planTier}</span>
                          )}
                        </td>

                        {/* Payment Ref */}
                        <td className="px-4 py-3">
                          {s.paymentReference ? (
                            <div>
                              <p className="text-xs font-mono" style={{ color: "var(--text-900)" }}>{s.paymentReference}</p>
                              <p className="text-xs mt-0.5" style={{ color: s.paymentConfirmed ? "#16A34A" : "#D97706" }}>
                                {s.paymentConfirmed ? "✓ Confirmed" : "Pending confirmation"}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs" style={{ color: "var(--text-400)" }}>—</span>
                          )}
                        </td>

                        {/* KYC */}
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-xs font-medium" style={{ color: kycStyle.color }}>{kycStyle.label}</span>
                            {s.aadhaarDocUrl && (
                              <a href={s.aadhaarDocUrl} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "#3B82F6" }}>
                                <ExternalLink className="w-3 h-3" /> View doc
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Onboarding */}
                        <td className="px-4 py-3">
                          {s.onboardingDone
                            ? <span className="text-xs font-medium" style={{ color: "#16A34A" }}>Complete</span>
                            : <span className="text-xs font-medium" style={{ color: "#D97706" }}>In Progress</span>
                          }
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ background: statusStyle.bg, color: statusStyle.color }}>
                            {statusStyle.label}
                          </span>
                        </td>

                        {/* Joined */}
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--text-400)" }}>
                          {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {s.accountStatus !== "ACTIVE" && (
                              <button
                                onClick={() => handleAction(s.id, "activate")}
                                disabled={actionLoading === s.id + "activate"}
                                title="Activate seller"
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold disabled:opacity-50"
                                style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #D1FAE5" }}>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {actionLoading === s.id + "activate" ? "..." : "Activate"}
                              </button>
                            )}
                            {s.accountStatus === "ACTIVE" && (
                              <button
                                onClick={() => handleAction(s.id, "suspend")}
                                disabled={actionLoading === s.id + "suspend"}
                                title="Suspend seller"
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold disabled:opacity-50"
                                style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                                <Ban className="w-3.5 h-3.5" />
                                {actionLoading === s.id + "suspend" ? "..." : "Suspend"}
                              </button>
                            )}
                            {s.accountStatus === "PENDING" && (
                              <button
                                onClick={() => handleAction(s.id, "suspend")}
                                disabled={actionLoading === s.id + "suspend"}
                                title="Reject application"
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold disabled:opacity-50"
                                style={{ background: "#FFF7ED", color: "#D97706", border: "1px solid #FED7AA" }}>
                                <XCircle className="w-3.5 h-3.5" />
                                {actionLoading === s.id + "suspend" ? "..." : "Reject"}
                              </button>
                            )}
                          </div>
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

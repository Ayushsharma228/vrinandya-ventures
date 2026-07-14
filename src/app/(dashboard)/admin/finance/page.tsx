"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, IndianRupee, Receipt, Users, BarChart2,
  ChevronLeft, ChevronRight, RefreshCw, CheckCircle2, Clock,
  Filter, Download,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface ReportData {
  period: { from: string | null; to: string | null };
  settlements: {
    count: number;
    grossRevenue: number; platformFee: number; gstOnFees: number;
    netPayable: number; supplierPayable: number; platformEarnings: number;
    shippingCharge: number; packingCharge: number; codFee: number;
    adSpend: number; marketplaceFee: number; grossProfit: number; netProfit: number;
  };
  orders: Record<string, number>;
  supplierPayments: {
    total: number; count: number; pendingAmount: number; pendingCount: number;
  };
}

interface Settlement {
  id: string; status: string; sellingPrice: number; platformFee: number;
  gstOnFees: number; netPayable: number; supplierPayable: number;
  platformEarnings: number; netProfit: number; createdAt: string;
  marketplace: string | null;
  seller: { id: string; name: string | null; email: string; brandName: string | null } | null;
}

interface SettlementList {
  settlements: Settlement[]; total: number; page: number; pages: number;
  summary: {
    grossRevenue: number; totalPlatformFee: number; totalNetPayable: number;
    totalSupplierPayable: number; platformEarnings: number; totalGst: number;
  };
}

interface SupplierPayment {
  id: string; amount: number; status: string; dueDate: string | null;
  paidAt: string | null; referenceNo: string | null; invoiceNo: string | null;
  createdAt: string;
  order: {
    id: string; externalOrderId: string; customerName: string | null;
    source: string; createdAt: string; status: string;
  } | null;
}

function fmt(n: number) { return `₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`; }

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:    { bg: "#FFF7ED", color: "#D97706", label: "Pending" },
  PROCESSING: { bg: "#EFF6FF", color: "#2563EB", label: "Processing" },
  APPROVED:   { bg: "#EFF6FF", color: "#2563EB", label: "Approved" },
  SETTLED:    { bg: "#F5F3FF", color: "#7C3AED", label: "Settled" },
  PAID:       { bg: "#F0FDF4", color: "#15803D", label: "Paid" },
  CANCELLED:  { bg: "#FEF2F2", color: "#DC2626", label: "Cancelled" },
  REVERSED:   { bg: "#FEF2F2", color: "#DC2626", label: "Reversed" },
  DISPUTED:   { bg: "#FFF7ED", color: "#B45309", label: "Disputed" },
};

const TABS = ["Overview", "Settlements", "Supplier Payments"] as const;
type Tab = (typeof TABS)[number];

export default function AdminFinancePage() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [report, setReport]   = useState<ReportData | null>(null);
  const [list,   setList]     = useState<SettlementList | null>(null);
  const [spList, setSpList]   = useState<{ payments: SupplierPayment[]; total: number; pages: number; summary: { pendingAmount: number; paidAmount: number } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [spPage, setSpPage]   = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [spStatus, setSpStatus] = useState("");
  const [paying, setPaying]   = useState<string | null>(null);
  const [payRef, setPayRef]   = useState("");

  const fetchReport = useCallback(async () => {
    const r = await fetch("/api/admin/finance/report");
    if (r.ok) setReport(await r.json());
  }, []);

  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter) params.set("status", statusFilter);
    const r = await fetch(`/api/admin/finance/settlements?${params}`);
    if (r.ok) setList(await r.json());
    setLoading(false);
  }, [page, statusFilter]);

  const fetchSupplierPayments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(spPage), limit: "20" });
    if (spStatus) params.set("status", spStatus);
    const r = await fetch(`/api/admin/supplier/payments?${params}`);
    if (r.ok) setSpList(await r.json());
    setLoading(false);
  }, [spPage, spStatus]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  useEffect(() => {
    if (tab === "Settlements")       fetchSettlements();
    if (tab === "Supplier Payments") fetchSupplierPayments();
    if (tab === "Overview")          setLoading(false);
  }, [tab, fetchSettlements, fetchSupplierPayments]);

  async function paySupplier(paymentId: string) {
    if (!payRef.trim()) return;
    const r = await fetch(`/api/admin/finance/settlements/${paymentId}/pay-supplier`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referenceNo: payRef }),
    });
    if (r.ok) {
      setPaying(null);
      setPayRef("");
      fetchSupplierPayments();
      fetchReport();
    }
  }

  const s = report?.settlements;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Finance OS"
        subtitle="Settlement engine, supplier payments, and platform earnings"
        cards={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Gross Revenue",      value: s ? fmt(s.grossRevenue)     : "—", color: "#00C67A" },
              { label: "Platform Earnings",  value: s ? fmt(s.platformEarnings) : "—", color: "#3B82F6" },
              { label: "Seller Payouts",     value: s ? fmt(s.netPayable)       : "—", color: "#A78BFA" },
              { label: "Supplier Payable",   value: s ? fmt(s.supplierPayable)  : "—", color: "#F59E0B" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl px-5 py-4"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        }
      />

      <div className="px-4 md:px-8 py-6 space-y-6">
        {/* Tab bar */}
        <div className="flex items-center gap-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={tab === t
                ? { background: "var(--bg-sidebar)", color: "white" }
                : { color: "var(--text-400)" }}>
              {t}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "Overview" && report && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Revenue breakdown */}
            <div className="card p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart2 className="w-4 h-4" style={{ color: "var(--accent)" }} />
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Revenue Breakdown</h3>
              </div>
              {[
                { label: "Gross Revenue",     value: s?.grossRevenue     ?? 0, color: "#00C67A" },
                { label: "Platform Fee",      value: s?.platformFee      ?? 0, color: "#3B82F6" },
                { label: "GST on Fees (18%)", value: s?.gstOnFees        ?? 0, color: "#6366F1" },
                { label: "Shipping Charges",  value: s?.shippingCharge   ?? 0, color: "#8B5CF6" },
                { label: "Packing Charges",   value: s?.packingCharge    ?? 0, color: "#EC4899" },
                { label: "COD Fees",          value: s?.codFee           ?? 0, color: "#F97316" },
                { label: "Ad Spend",          value: s?.adSpend          ?? 0, color: "#EF4444" },
                { label: "Marketplace Fee",   value: s?.marketplaceFee   ?? 0, color: "#DC2626" },
                { label: "Supplier Payable",  value: s?.supplierPayable  ?? 0, color: "#D97706" },
                { label: "Net Payable (Sellers)", value: s?.netPayable   ?? 0, color: "#A78BFA" },
                { label: "Platform Earnings", value: s?.platformEarnings ?? 0, color: "#00C67A", bold: true },
              ].map(({ label, value, color, bold }) => (
                <div key={label} className="flex items-center justify-between py-1"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="text-xs" style={{ color: "var(--text-500)" }}>{label}</span>
                  <span className={`text-sm ${bold ? "font-bold" : "font-medium"}`} style={{ color }}>
                    {fmt(value)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold" style={{ color: "var(--text-400)" }}>Total Settlements</span>
                <span className="text-sm font-bold" style={{ color: "var(--text-900)" }}>{s?.count ?? 0}</span>
              </div>
            </div>

            {/* Order status summary + supplier payments */}
            <div className="space-y-4">
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt className="w-4 h-4" style={{ color: "var(--accent)" }} />
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Order Status Summary</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(report.orders).map(([status, count]) => (
                    <div key={status} className="rounded-xl p-3 text-center"
                      style={{ background: "var(--bg-muted)", border: "1px solid var(--border)" }}>
                      <p className="text-xl font-bold" style={{ color: "var(--text-900)" }}>{count}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>{status}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4" style={{ color: "var(--accent)" }} />
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Supplier Payments</h3>
                </div>
                {[
                  { label: "Total Paid to Suppliers", value: fmt(report.supplierPayments.total), icon: CheckCircle2, color: "#00C67A" },
                  { label: "Pending Payments",        value: fmt(report.supplierPayments.pendingAmount), icon: Clock, color: "#F59E0B" },
                  { label: "Pending Count",           value: `${report.supplierPayments.pendingCount} orders`, icon: IndianRupee, color: "#6366F1" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="flex items-center justify-between py-2.5"
                    style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                      <span className="text-xs" style={{ color: "var(--text-500)" }}>{label}</span>
                    </div>
                    <span className="text-sm font-semibold" style={{ color }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settlements Tab */}
        {tab === "Settlements" && (
          <div className="card overflow-hidden">
            <div className="px-5 py-3 flex items-center gap-3 flex-wrap" style={{ borderBottom: "1px solid var(--border)" }}>
              <Filter className="w-4 h-4" style={{ color: "var(--text-400)" }} />
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="text-xs rounded-lg px-3 py-1.5 border"
                style={{ background: "var(--bg-card)", color: "var(--text-900)", borderColor: "var(--border)" }}>
                <option value="">All Status</option>
                {["PENDING","PROCESSING","SETTLED","PAID","REVERSED","DISPUTED"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {list && (
                <span className="text-xs" style={{ color: "var(--text-400)" }}>
                  {list.total} settlements · ₹{list.summary.grossRevenue.toLocaleString("en-IN")} gross
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <a href="/api/admin/finance/export?type=settlements"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ border: "1px solid var(--border)", color: "var(--text-400)" }}>
                  <Download className="w-3.5 h-3.5" /> Settlements CSV
                </a>
                <a href="/api/admin/finance/export?type=supplier-payments"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ border: "1px solid var(--border)", color: "var(--text-400)" }}>
                  <Download className="w-3.5 h-3.5" /> Supplier CSV
                </a>
                <a href="/api/admin/finance/export?type=ledger"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ border: "1px solid var(--border)", color: "var(--text-400)" }}>
                  <Download className="w-3.5 h-3.5" /> Ledger CSV
                </a>
              </div>
            </div>
            {loading ? (
              <div className="p-8 flex justify-center">
                <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "var(--text-300)" }} />
              </div>
            ) : !list || list.settlements.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-2">
                <TrendingUp className="w-10 h-10" style={{ color: "var(--border)" }} />
                <p className="text-sm" style={{ color: "var(--text-400)" }}>No settlements yet</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)", background: "#FAFAFA" }}>
                        {["Date","Seller","Gross","Platform Fee","GST","Seller Gets","Supplier","Net Profit","Status"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                            style={{ color: "var(--text-400)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                      {list.settlements.map((s) => {
                        const badge = STATUS_BADGE[s.status] ?? STATUS_BADGE.PENDING;
                        return (
                          <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>
                              {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs font-medium" style={{ color: "var(--text-900)" }}>
                                {s.seller?.brandName ?? s.seller?.name ?? "—"}
                              </p>
                              <p className="text-xs" style={{ color: "var(--text-400)" }}>{s.seller?.email ?? ""}</p>
                            </td>
                            <td className="px-4 py-3 font-semibold text-xs" style={{ color: "#00C67A" }}>{fmt(s.sellingPrice)}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: "#3B82F6" }}>{fmt(s.platformFee)}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: "#6366F1" }}>{fmt(s.gstOnFees)}</td>
                            <td className="px-4 py-3 text-xs font-semibold" style={{ color: "#A78BFA" }}>{fmt(s.netPayable)}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: "#D97706" }}>{fmt(s.supplierPayable)}</td>
                            <td className="px-4 py-3 text-xs font-semibold" style={{ color: s.netProfit > 0 ? "#00C67A" : "#EF4444" }}>
                              {fmt(s.netProfit ?? 0)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                style={{ background: badge.bg, color: badge.color }}>
                                {badge.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {list.pages > 1 && (
                  <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
                    <span className="text-xs" style={{ color: "var(--text-400)" }}>
                      Page {list.page} of {list.pages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                        className="p-1 rounded-lg disabled:opacity-30"
                        style={{ border: "1px solid var(--border)" }}>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button disabled={page >= list.pages} onClick={() => setPage(p => p + 1)}
                        className="p-1 rounded-lg disabled:opacity-30"
                        style={{ border: "1px solid var(--border)" }}>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Supplier Payments Tab */}
        {tab === "Supplier Payments" && (
          <div className="card overflow-hidden">
            <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <Filter className="w-4 h-4" style={{ color: "var(--text-400)" }} />
              <select value={spStatus} onChange={e => { setSpStatus(e.target.value); setSpPage(1); }}
                className="text-xs rounded-lg px-3 py-1.5 border"
                style={{ background: "var(--bg-card)", color: "var(--text-900)", borderColor: "var(--border)" }}>
                <option value="">All Status</option>
                {["PENDING","APPROVED","PAID","CANCELLED"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {spList && (
                <span className="ml-auto text-xs" style={{ color: "var(--text-400)" }}>
                  Pending: {fmt(spList.summary.pendingAmount)} · Paid: {fmt(spList.summary.paidAmount)}
                </span>
              )}
            </div>

            {/* Pay modal */}
            {paying && (
              <div className="fixed inset-0 z-50 flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.5)" }}>
                <div className="rounded-2xl p-6 w-80 space-y-4"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Mark Supplier Paid</h3>
                  <input value={payRef} onChange={e => setPayRef(e.target.value)}
                    placeholder="Reference / Transaction No."
                    className="w-full text-sm rounded-xl px-3 py-2 border"
                    style={{ background: "var(--bg-muted)", color: "var(--text-900)", borderColor: "var(--border)" }} />
                  <div className="flex gap-2">
                    <button onClick={() => { setPaying(null); setPayRef(""); }}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold"
                      style={{ border: "1px solid var(--border)", color: "var(--text-500)" }}>
                      Cancel
                    </button>
                    <button onClick={() => paySupplier(paying)}
                      disabled={!payRef.trim()}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40"
                      style={{ background: "#00C67A" }}>
                      Confirm Payment
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="p-8 flex justify-center">
                <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "var(--text-300)" }} />
              </div>
            ) : !spList || spList.payments.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-2">
                <IndianRupee className="w-10 h-10" style={{ color: "var(--border)" }} />
                <p className="text-sm" style={{ color: "var(--text-400)" }}>No supplier payments found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)", background: "#FAFAFA" }}>
                        {["Date","Order","Amount","Due Date","Status","Reference","Action"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                            style={{ color: "var(--text-400)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                      {spList.payments.map((p) => {
                        const badge = STATUS_BADGE[p.status] ?? STATUS_BADGE.PENDING;
                        return (
                          <tr key={p.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>
                              {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-xs font-mono font-medium" style={{ color: "var(--text-900)" }}>
                                {p.order?.externalOrderId ?? p.order?.id?.slice(-8) ?? "—"}
                              </p>
                              <p className="text-xs" style={{ color: "var(--text-400)" }}>
                                {p.order?.customerName ?? ""}
                              </p>
                            </td>
                            <td className="px-4 py-3 font-semibold text-xs" style={{ color: "#D97706" }}>{fmt(p.amount)}</td>
                            <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>
                              {p.dueDate ? new Date(p.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                style={{ background: badge.bg, color: badge.color }}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-400)" }}>
                              {p.referenceNo ?? "—"}
                            </td>
                            <td className="px-4 py-3">
                              {p.status === "PENDING" && (
                                <button onClick={() => setPaying(p.id)}
                                  className="text-xs font-semibold px-3 py-1 rounded-lg"
                                  style={{ background: "#FFF7ED", color: "#D97706", border: "1px solid #FED7AA" }}>
                                  Mark Paid
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {spList.pages > 1 && (
                  <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
                    <span className="text-xs" style={{ color: "var(--text-400)" }}>
                      Page {spPage} of {spList.pages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button disabled={spPage <= 1} onClick={() => setSpPage(p => p - 1)}
                        className="p-1 rounded-lg disabled:opacity-30"
                        style={{ border: "1px solid var(--border)" }}>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button disabled={spPage >= spList.pages} onClick={() => setSpPage(p => p + 1)}
                        className="p-1 rounded-lg disabled:opacity-30"
                        style={{ border: "1px solid var(--border)" }}>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

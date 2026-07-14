"use client";

import { useEffect, useState, useCallback } from "react";
import { Receipt, TrendingUp, Clock, CheckCircle, RefreshCw, ChevronLeft, ChevronRight, IndianRupee } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  note: string | null;
  orderId: string | null;
  poId: string | null;
  settledAt: string | null;
  createdAt: string;
};

type SupplierPayment = {
  id: string;
  amount: number;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  referenceNo: string | null;
  invoiceNo: string | null;
  createdAt: string;
  order: { id: string; externalOrderId: string; customerName: string | null; status: string } | null;
};

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; sign: string }> = {
  CREDIT:  { label: "Credit",  color: "#15803D", bg: "#F0FDF4", sign: "+" },
  DEBIT:   { label: "Debit",   color: "#DC2626", bg: "#FEF2F2", sign: "−" },
  HOLD:    { label: "On Hold", color: "#D97706", bg: "#FFF7ED", sign: "~" },
  RELEASE: { label: "Release", color: "#7C3AED", bg: "#F5F3FF", sign: "↑" },
};

const PAYMENT_BADGE: Record<string, { bg: string; color: string }> = {
  PENDING:  { bg: "#FFF7ED", color: "#D97706" },
  APPROVED: { bg: "#EFF6FF", color: "#2563EB" },
  PAID:     { bg: "#F0FDF4", color: "#15803D" },
  CANCELLED:{ bg: "#FEF2F2", color: "#DC2626" },
};

export default function SupplierSettlementsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [payTotal, setPayTotal]   = useState(0);
  const [payPage, setPayPage]     = useState(1);
  const [payPages, setPayPages]   = useState(1);
  const [payStatus, setPayStatus] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/supplier/settlements");
      const data = await res.json();
      setTransactions(data.transactions ?? []);
      setBalance(data.balance ?? 0);
      setPending(data.pending ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    setPayLoading(true);
    const params = new URLSearchParams({ page: String(payPage), limit: "15" });
    if (payStatus) params.set("status", payStatus);
    const r = await fetch(`/api/supplier/payments?${params}`);
    if (r.ok) {
      const d = await r.json();
      setPayments(d.payments ?? []);
      setPayTotal(d.total ?? 0);
      setPayPages(d.pages ?? 1);
    }
    setPayLoading(false);
  }, [payPage, payStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const totalCredits = transactions.filter((t) => t.type === "CREDIT").reduce((s, t) => s + t.amount, 0);
  const totalDebits  = transactions.filter((t) => t.type === "DEBIT").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Settlements"
        subtitle="Your payment history and upcoming settlements"
        cards={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Available Balance", value: `₹${balance.toLocaleString()}`,        icon: CheckCircle, color: "#00C67A" },
              { label: "On Hold",           value: `₹${pending.toLocaleString()}`,        icon: Clock,       color: "#F59E0B" },
              { label: "Total Earned",      value: `₹${totalCredits.toLocaleString()}`,   icon: TrendingUp,  color: "#3B82F6" },
              { label: "Total Debited",     value: `₹${totalDebits.toLocaleString()}`,    icon: Receipt,     color: "#EF4444" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl px-5 py-4"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <p className="text-xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        }
      />

      <div className="px-4 md:px-8 pt-6">
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "var(--text-300)" }} />
          </div>
        ) : transactions.length === 0 ? (
          <div className="card py-16 flex flex-col items-center gap-3">
            <Receipt className="w-10 h-10" style={{ color: "var(--border)" }} />
            <p className="text-sm" style={{ color: "var(--text-400)" }}>No settlement transactions yet</p>
            <p className="text-xs" style={{ color: "var(--text-300)" }}>
              Settlements are generated automatically when orders are delivered.
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "#FAFAFA" }}>
                    {["Date", "Type", "Amount", "Reference", "Note", "Settled On"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--text-400)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {transactions.map((tx) => {
                    const cfg = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.CREDIT;
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3.5 text-xs" style={{ color: "var(--text-500)" }}>
                          {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ background: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-sm"
                          style={{ color: tx.type === "CREDIT" ? "#15803D" : tx.type === "DEBIT" ? "#DC2626" : "var(--text-900)" }}>
                          {cfg.sign} ₹{tx.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs" style={{ color: "var(--text-400)" }}>
                          {tx.orderId ? `Order ${tx.orderId.slice(-8)}` : tx.poId ? `PO ${tx.poId.slice(-8)}` : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-xs" style={{ color: "var(--text-500)" }}>
                          {tx.note ?? "—"}
                        </td>
                        <td className="px-4 py-3.5 text-xs" style={{ color: "var(--text-400)" }}>
                          {tx.settledAt
                            ? new Date(tx.settledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                            : "Pending"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Per-Order Payment Tracking */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-900)" }}>
            <IndianRupee className="w-4 h-4" style={{ color: "var(--accent)" }} />
            Order Payment Status
          </h2>
          <div className="card overflow-hidden">
            <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <select value={payStatus} onChange={e => { setPayStatus(e.target.value); setPayPage(1); }}
                className="text-xs rounded-lg px-3 py-1.5 border"
                style={{ background: "var(--bg-card)", color: "var(--text-900)", borderColor: "var(--border)" }}>
                <option value="">All</option>
                {["PENDING","APPROVED","PAID","CANCELLED"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className="ml-auto text-xs" style={{ color: "var(--text-400)" }}>
                {payTotal} payment{payTotal !== 1 ? "s" : ""}
              </span>
            </div>
            {payLoading ? (
              <div className="p-6 flex justify-center">
                <RefreshCw className="w-4 h-4 animate-spin" style={{ color: "var(--text-300)" }} />
              </div>
            ) : payments.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2">
                <Receipt className="w-8 h-8" style={{ color: "var(--border)" }} />
                <p className="text-sm" style={{ color: "var(--text-400)" }}>No payment records yet</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)", background: "#FAFAFA" }}>
                        {["Date","Order","Customer","Amount","Status","Due","Paid On","Reference"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                            style={{ color: "var(--text-400)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                      {payments.map((p) => {
                        const badge = PAYMENT_BADGE[p.status] ?? PAYMENT_BADGE.PENDING;
                        return (
                          <tr key={p.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>
                              {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs font-medium" style={{ color: "var(--text-900)" }}>
                              {p.order?.externalOrderId ?? p.order?.id?.slice(-8) ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: "var(--text-500)" }}>
                              {p.order?.customerName ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-xs font-semibold" style={{ color: "#D97706" }}>
                              ₹{p.amount.toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                style={{ background: badge.bg, color: badge.color }}>
                                {p.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>
                              {p.dueDate
                                ? new Date(p.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                                : "—"}
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: "#15803D" }}>
                              {p.paidAt
                                ? new Date(p.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                                : "—"}
                            </td>
                            <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-400)" }}>
                              {p.referenceNo ?? "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {payPages > 1 && (
                  <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
                    <span className="text-xs" style={{ color: "var(--text-400)" }}>
                      Page {payPage} of {payPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button disabled={payPage <= 1} onClick={() => setPayPage(p => p - 1)}
                        className="p-1 rounded-lg disabled:opacity-30"
                        style={{ border: "1px solid var(--border)" }}>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button disabled={payPage >= payPages} onClick={() => setPayPage(p => p + 1)}
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
        </div>
      </div>
    </div>
  );
}

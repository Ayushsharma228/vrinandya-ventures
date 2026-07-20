"use client";

import { useState, useEffect } from "react";
import { Wallet, TrendingUp, TrendingDown, Clock, CheckCircle2, ArrowUpRight, ArrowDownRight, BanknoteIcon, XCircle } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface Transaction {
  id: string; type: string; amount: number; note: string | null;
  remittanceDate: string | null; bankTxId: string | null; createdAt: string;
}
interface WalletData {
  balance: number; totalCredit: number; totalDebit: number;
  upcomingAmount: number; upcoming: Transaction[]; paid: Transaction[];
  transactions: Transaction[];
}
interface WithdrawalRequest {
  id: string; amount: number; status: string; adminNote: string | null;
  bankAccount: string; createdAt: string; processedAt: string | null;
}
const WD_BADGE: Record<string, { color: string }> = {
  PENDING:  { color: "#F59E0B" },
  APPROVED: { color: "#16A34A" },
  REJECTED: { color: "#EF4444" },
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.abs(n));
}

const TABS = ["All", "Upcoming", "Paid", "Deductions"];

export default function SellerWalletPage() {
  const [data,       setData]       = useState<WalletData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState("All");
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [wdAmount,   setWdAmount]   = useState("");
  const [wdLoading,  setWdLoading]  = useState(false);
  const [wdError,    setWdError]    = useState("");
  const [wdSuccess,  setWdSuccess]  = useState(false);

  useEffect(() => {
    fetch("/api/seller/wallet").then(r => r.json()).then(d => { setData(d); setLoading(false); });
    fetch("/api/seller/wallet/withdraw").then(r => r.json()).then(d => setWithdrawals(d.requests ?? []));
  }, []);

  async function submitWithdrawal(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(wdAmount);
    if (!amt || amt <= 0) { setWdError("Enter a valid amount"); return; }
    setWdLoading(true); setWdError(""); setWdSuccess(false);
    const res = await fetch("/api/seller/wallet/withdraw", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amt }),
    });
    const json = await res.json();
    if (!res.ok) { setWdError(json.error ?? "Failed"); }
    else {
      setWdSuccess(true); setWdAmount("");
      setWithdrawals(prev => [json.request, ...prev]);
    }
    setWdLoading(false);
  }

  const allTx = data?.transactions ?? [];
  const upcoming = data?.upcoming ?? [];
  const paid = (data?.paid ?? []).filter(t => t.remittanceDate !== null);
  const deductions = allTx.filter(t => t.type === "DEBIT");

  const displayed =
    tab === "All"       ? allTx :
    tab === "Upcoming"  ? upcoming :
    tab === "Paid"      ? paid :
    deductions;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Wallet & Payouts"
        subtitle="Your earnings and remittance history"
        cards={
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Paid Till Now */}
            <div className="rounded-2xl px-6 py-5" style={{ background: "rgba(0,198,122,0.12)", border: "1px solid rgba(0,198,122,0.2)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                  Paid Till Now
                </p>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,198,122,0.2)" }}>
                  <Wallet style={{ color: "var(--green-500)", width: 18, height: 18 }} />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                {loading ? "—" : `₹${fmt(data?.totalCredit ?? 0)}`}
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Total paid to your account</p>
              <div className="mt-4 pt-4 flex items-center gap-2" style={{ borderTop: "1px solid var(--border)" }}>
                <TrendingUp style={{ color: "var(--green-500)", width: 14, height: 14 }} />
                <span className="text-xs" style={{ color: "var(--green-500)" }}>
                  {paid.length} payment{paid.length !== 1 ? "s" : ""} completed
                </span>
              </div>
            </div>

            {/* Upcoming Payout */}
            <div className="rounded-2xl px-6 py-5" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                  Upcoming Payout
                </p>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.15)" }}>
                  <Clock style={{ color: "#F59E0B", width: 18, height: 18 }} />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                {loading ? "—" : `₹${fmt(data?.upcomingAmount ?? 0)}`}
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {upcoming[0]?.remittanceDate
                  ? `Expected ${new Date(upcoming[0].remittanceDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                  : "No upcoming payout"}
              </p>
            </div>

            {/* Deductions */}
            <div className="rounded-2xl px-6 py-5" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                  Total Deductions
                </p>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)" }}>
                  <TrendingDown style={{ color: "#EF4444", width: 18, height: 18 }} />
                </div>
              </div>
              <p className="text-3xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                {loading ? "—" : `₹${fmt(data?.totalDebit ?? 0)}`}
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>RTO charges & adjustments</p>
            </div>
          </div>
        }
      />

      <div className="px-4 md:px-8 py-6 space-y-6">
        {/* Request Payout */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BanknoteIcon className="w-5 h-5" style={{ color: "#16A34A" }} />
            <h2 className="text-sm font-bold" style={{ color: "var(--text-900)" }}>Request Payout</h2>
          </div>
          <form onSubmit={submitWithdrawal} className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold"
                style={{ color: "var(--text-400)" }}>₹</span>
              <input
                type="number" min="1" step="1" value={wdAmount}
                onChange={e => { setWdAmount(e.target.value); setWdError(""); setWdSuccess(false); }}
                placeholder="Enter amount"
                className="w-full pl-7 pr-4 py-2.5 rounded-xl text-sm border outline-none"
                style={{ background: "var(--bg-muted)", color: "var(--text-900)", borderColor: "var(--border)" }}
              />
            </div>
            <button type="submit" disabled={wdLoading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "#16A34A" }}>
              {wdLoading ? "Submitting…" : "Request Payout"}
            </button>
          </form>
          {wdError   && <p className="text-xs mt-2" style={{ color: "#EF4444" }}>{wdError}</p>}
          {wdSuccess && <p className="text-xs mt-2" style={{ color: "#16A34A" }}>Payout request submitted! Admin will process it shortly.</p>}
          <p className="text-xs mt-3" style={{ color: "var(--text-400)" }}>
            Payouts are transferred to your registered bank account. Only settled (paid) wallet balance is eligible.
          </p>
        </div>

        {/* Withdrawal history */}
        {withdrawals.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-sm font-bold" style={{ color: "var(--text-900)" }}>Payout Request History</h2>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {withdrawals.map(wd => {
                const badge = WD_BADGE[wd.status] ?? WD_BADGE.PENDING;
                return (
                  <div key={wd.id} className="px-5 py-3.5 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(0,198,122,0.1)" }}>
                      {wd.status === "APPROVED"
                        ? <CheckCircle2 className="w-4 h-4" style={{ color: "#16A34A" }} />
                        : wd.status === "REJECTED"
                        ? <XCircle className="w-4 h-4" style={{ color: "#EF4444" }} />
                        : <Clock className="w-4 h-4" style={{ color: "#F59E0B" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--text-900)" }}>
                        Withdrawal Request — ₹{fmt(wd.amount)}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>
                        {new Date(wd.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {wd.adminNote ? ` · ${wd.adminNote}` : ""}
                      </p>
                    </div>
                    <span className="text-xs font-bold" style={{ color: badge.color }}>{wd.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Transaction history */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 flex items-center gap-1" style={{ borderBottom: "1px solid var(--border)" }}>
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={tab === t
                  ? { background: "var(--bg-sidebar)", color: "var(--text-primary)" }
                  : { color: "var(--text-400)" }}>
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: "var(--text-400)" }}>Loading...</div>
          ) : displayed.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2">
              <Wallet style={{ color: "var(--border)", width: 40, height: 40 }} />
              <p className="text-sm" style={{ color: "var(--text-400)" }}>No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {displayed.map((tx) => {
                const isCredit = tx.type === "CREDIT";
                const isPaid = tx.bankTxId !== null;
                return (
                  <div key={tx.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: isCredit ? "#F0FDF4" : "#FEF2F2" }}>
                      {isCredit
                        ? <ArrowDownRight style={{ color: "#16A34A", width: 16, height: 16 }} />
                        : <ArrowUpRight style={{ color: "#EF4444", width: 16, height: 16 }} />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-900)" }}>
                        {tx.note || (isCredit ? "Remittance Credit" : "Deduction")}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>
                        {tx.remittanceDate
                          ? (isPaid ? "Paid on: " : "Expected: ") +
                            new Date(tx.remittanceDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                        }
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold" style={{ color: isCredit ? "#16A34A" : "#EF4444" }}>
                        {isCredit ? "+" : "−"}₹{fmt(tx.amount)}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        {isPaid
                          ? <><CheckCircle2 style={{ color: "#16A34A", width: 12, height: 12 }} /><span className="text-xs" style={{ color: "#16A34A" }}>Paid</span></>
                          : <><Clock style={{ color: "#F59E0B", width: 12, height: 12 }} /><span className="text-xs" style={{ color: "#F59E0B" }}>Upcoming</span></>
                        }
                      </div>
                    </div>
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

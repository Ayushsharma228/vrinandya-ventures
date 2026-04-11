"use client";

import { useState, useEffect } from "react";
import { Wallet, TrendingUp, TrendingDown, Clock, CheckCircle2, ArrowUpRight, ArrowDownRight } from "lucide-react";
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

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.abs(n));
}

const TABS = ["All", "Upcoming", "Paid", "Deductions"];

export default function SellerWalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("All");

  useEffect(() => {
    fetch("/api/seller/wallet").then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

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
      />

      <div className="px-8 py-6 space-y-6">
        {/* 3 Balance Cards */}
        <div className="grid grid-cols-3 gap-5">
          {/* Available Balance — dark card */}
          <div className="card-dark rounded-2xl px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.4)" }}>
                Available Balance
              </p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(0,198,122,0.15)" }}>
                <Wallet style={{ color: "var(--green-500)", width: 18, height: 18 }} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {loading ? "—" : `₹${fmt(data?.balance ?? 0)}`}
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Total remitted so far</p>
            <div className="mt-4 pt-4 flex items-center gap-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <TrendingUp style={{ color: "var(--green-500)", width: 14, height: 14 }} />
              <span className="text-xs" style={{ color: "var(--green-400)" }}>
                ₹{fmt(data?.totalCredit ?? 0)} total credited
              </span>
            </div>
          </div>

          {/* Upcoming Payout */}
          <div className="card rounded-2xl px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-400)" }}>
                Upcoming Payout
              </p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FFF7ED" }}>
                <Clock style={{ color: "#F59E0B", width: 18, height: 18 }} />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1" style={{ color: "var(--text-900)" }}>
              {loading ? "—" : `₹${fmt(data?.upcomingAmount ?? 0)}`}
            </p>
            <p className="text-xs" style={{ color: "var(--text-400)" }}>
              {upcoming[0]?.remittanceDate
                ? `Expected ${new Date(upcoming[0].remittanceDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                : "No upcoming payout"}
            </p>
          </div>

          {/* Deductions */}
          <div className="card rounded-2xl px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-400)" }}>
                Total Deductions
              </p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#FEF2F2" }}>
                <TrendingDown style={{ color: "#EF4444", width: 18, height: 18 }} />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1" style={{ color: "var(--text-900)" }}>
              {loading ? "—" : `₹${fmt(data?.totalDebit ?? 0)}`}
            </p>
            <p className="text-xs" style={{ color: "var(--text-400)" }}>RTO charges & adjustments</p>
          </div>
        </div>

        {/* Transaction history */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 flex items-center gap-1" style={{ borderBottom: "1px solid var(--border)" }}>
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
                        ? <ArrowDownRight style={{ color: "#00C67A", width: 16, height: 16 }} />
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
                      <p className="text-sm font-bold" style={{ color: isCredit ? "#00C67A" : "#EF4444" }}>
                        {isCredit ? "+" : "−"}₹{fmt(tx.amount)}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        {isPaid
                          ? <><CheckCircle2 style={{ color: "#00C67A", width: 12, height: 12 }} /><span className="text-xs" style={{ color: "#00C67A" }}>Paid</span></>
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

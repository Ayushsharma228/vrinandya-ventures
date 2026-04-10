"use client";

import { useState, useEffect } from "react";
import { IndianRupee, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  note: string | null;
  orderId: string | null;
  createdAt: string;
}

interface WalletData {
  balance: number;
  totalCredit: number;
  totalDebit: number;
  transactions: Transaction[];
}

export default function SellerWalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchWallet(showRefreshing = false) {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    const res = await fetch("/api/seller/wallet");
    const json = await res.json();
    setData(json);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { fetchWallet(); }, []);

  if (loading) {
    return <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Wallet</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your balance and transaction history</p>
        </div>
        <button onClick={() => fetchWallet(true)} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Current Balance</p>
            <p className={`text-3xl font-bold mt-1 ${(data?.balance ?? 0) >= 0 ? "text-green-600" : "text-red-500"}`}>
              ₹{(data?.balance ?? 0).toFixed(2)}
            </p>
          </div>
          <IndianRupee className="w-8 h-8 text-gray-200" />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Total Credited</p>
            <p className="text-3xl font-bold text-green-600 mt-1">₹{(data?.totalCredit ?? 0).toFixed(2)}</p>
          </div>
          <TrendingUp className="w-8 h-8 text-green-300" />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Total Debited</p>
            <p className="text-3xl font-bold text-red-500 mt-1">₹{(data?.totalDebit ?? 0).toFixed(2)}</p>
          </div>
          <TrendingDown className="w-8 h-8 text-red-300" />
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Transaction History ({data?.transactions?.length ?? 0})</h2>
        </div>
        {!data?.transactions?.length ? (
          <p className="py-16 text-center text-sm text-gray-400">No transactions yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.type === "CREDIT" ? "bg-green-500" : "bg-red-500"}`} />
                  <div>
                    <p className="text-sm text-gray-800">{t.note || (t.type === "CREDIT" ? "Credit" : "Debit")}</p>
                    {t.orderId && <p className="text-xs text-gray-400">Order: {t.orderId}</p>}
                    <p className="text-xs text-gray-400">
                      {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <span className={`font-bold text-sm ${t.type === "CREDIT" ? "text-green-600" : "text-red-500"}`}>
                  {t.type === "CREDIT" ? "+" : "-"}₹{t.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

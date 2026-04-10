"use client";

import { useState, useEffect } from "react";
import { IndianRupee, TrendingUp, TrendingDown, RefreshCw, Copy } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  note: string | null;
  orderId: string | null;
  remittanceDate: string | null;
  createdAt: string;
}

interface RemittedOrder {
  id: string;
  externalOrderId: string;
  status: string;
  courier: string | null;
  customerName: string | null;
  totalAmount: number;
  productCost: number | null;
  shippingCharge: number | null;
  packingCharge: number | null;
  rtoCharge: number | null;
  remittedAt: string;
}

interface WalletData {
  balance: number;
  totalCredit: number;
  totalDebit: number;
  transactions: Transaction[];
  remittedOrders: RemittedOrder[];
}

function fmt(n: number) { return `₹${n.toFixed(2)}`; }

export default function SellerWalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [tab, setTab] = useState<"transactions" | "orders">("transactions");

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

  function copyTxId(id: string) {
    navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  function isRTO(order: RemittedOrder) {
    return order.courier?.includes("RTO") || false;
  }

  function netForOrder(order: RemittedOrder) {
    const pc = order.productCost ?? 0;
    const sc = order.shippingCharge ?? 0;
    const pac = order.packingCharge ?? 0;
    const rtc = order.rtoCharge ?? 0;
    if (isRTO(order)) return -(pc + rtc + pac);
    return order.totalAmount - pc - sc - pac;
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Wallet</h1>
          <p className="text-sm text-gray-500 mt-0.5">Balance, transactions, and remittance breakdown</p>
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
              {fmt(data?.balance ?? 0)}
            </p>
          </div>
          <IndianRupee className="w-8 h-8 text-gray-200" />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Total Credited</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{fmt(data?.totalCredit ?? 0)}</p>
          </div>
          <TrendingUp className="w-8 h-8 text-green-300" />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Total Debited</p>
            <p className="text-3xl font-bold text-red-500 mt-1">{fmt(data?.totalDebit ?? 0)}</p>
          </div>
          <TrendingDown className="w-8 h-8 text-red-300" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">History</h2>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden text-sm">
            <button onClick={() => setTab("transactions")}
              className={`px-4 py-1.5 transition-colors ${tab === "transactions" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
              Transactions
            </button>
            <button onClick={() => setTab("orders")}
              className={`px-4 py-1.5 border-l border-gray-200 transition-colors ${tab === "orders" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
              Order Breakdown
            </button>
          </div>
        </div>

        {tab === "transactions" ? (
          <>
            {!data?.transactions?.length ? (
              <p className="py-16 text-center text-sm text-gray-400">No transactions yet</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.transactions.map((t) => (
                  <div key={t.id} className="px-5 py-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${t.type === "CREDIT" ? "bg-green-500" : "bg-red-500"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800">{t.note || (t.type === "CREDIT" ? "Credit" : "Debit")}</p>
                          {t.orderId && <p className="text-xs text-gray-400">Order: {t.orderId}</p>}
                          <p className="text-xs text-gray-400">
                            {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                          {t.remittanceDate && (
                            <p className="text-xs text-blue-500 mt-0.5">
                              Expected remittance: {new Date(t.remittanceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            </p>
                          )}
                          <button onClick={() => copyTxId(t.id)}
                            className="flex items-center gap-1 mt-1 text-xs text-gray-400 hover:text-gray-600 font-mono">
                            <span>Tx: {t.id.slice(0, 12)}…</span>
                            <Copy className="w-3 h-3" />
                            {copied === t.id && <span className="text-green-500 font-sans">Copied!</span>}
                          </button>
                        </div>
                      </div>
                      <span className={`font-bold text-sm flex-shrink-0 ${t.type === "CREDIT" ? "text-green-600" : "text-red-500"}`}>
                        {t.type === "CREDIT" ? "+" : "-"}{fmt(t.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {!data?.remittedOrders?.length ? (
              <p className="py-16 text-center text-sm text-gray-400">No remitted orders yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50/60 border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Order #</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Customer</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Order Amt</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-purple-600">Product</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-blue-600">Shipping</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-orange-500">Packing</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-red-500">RTO</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-green-600">Net</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Remitted On</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.remittedOrders.map((o) => {
                      const rto = isRTO(o);
                      const net = netForOrder(o);
                      return (
                        <tr key={o.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 font-mono text-xs text-blue-600">{o.externalOrderId}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rto ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"}`}>
                              {rto ? "RTO" : "Delivered"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-600">{o.customerName || "—"}</td>
                          <td className="px-4 py-2.5 text-right text-xs font-semibold text-gray-700">
                            {rto ? <span className="text-gray-400">—</span> : fmt(o.totalAmount)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs text-purple-700">{o.productCost != null ? fmt(o.productCost) : "—"}</td>
                          <td className="px-4 py-2.5 text-right text-xs text-blue-700">{o.shippingCharge != null ? fmt(o.shippingCharge) : "—"}</td>
                          <td className="px-4 py-2.5 text-right text-xs text-orange-600">{o.packingCharge != null ? fmt(o.packingCharge) : "—"}</td>
                          <td className="px-4 py-2.5 text-right text-xs text-red-600">{o.rtoCharge != null ? fmt(o.rtoCharge) : "—"}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-xs">
                            <span className={net >= 0 ? "text-green-600" : "text-red-500"}>{fmt(net)}</span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-400 whitespace-nowrap">
                            {new Date(o.remittedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

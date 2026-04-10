"use client";

import { useState, useEffect } from "react";
import { IndianRupee, TrendingDown, RefreshCw, Clock, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";

interface Transaction {
  id: string; type: string; amount: number; note: string | null;
  orderId: string | null; remittanceDate: string | null; bankTxId: string | null; createdAt: string;
}

interface RemittedOrder {
  id: string; externalOrderId: string; status: string; courier: string | null;
  customerName: string | null; totalAmount: number; productCost: number | null;
  shippingCharge: number | null; packingCharge: number | null; rtoCharge: number | null;
  remittedAt: string; remittanceTxId: string | null;
}

interface WalletData {
  balance: number; totalCredit: number; totalDebit: number;
  upcomingAmount: number; upcoming: Transaction[]; paid: Transaction[];
  remittedOrders: RemittedOrder[];
}

function fmt(n: number) { return `₹${n.toFixed(2)}`; }

function netForOrder(o: RemittedOrder) {
  const rto = o.courier?.includes("RTO") || false;
  const pc = o.productCost ?? 0; const sc = o.shippingCharge ?? 0;
  const pac = o.packingCharge ?? 0; const rtc = o.rtoCharge ?? 0;
  return rto ? -(pc + rtc + pac) : o.totalAmount - pc - sc - pac;
}

export default function SellerWalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function fetchWallet(showRefreshing = false) {
    if (showRefreshing) setRefreshing(true); else setLoading(true);
    const res = await fetch("/api/seller/wallet");
    setData(await res.json());
    setLoading(false); setRefreshing(false);
  }

  useEffect(() => { fetchWallet(); }, []);

  if (loading) return <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>;

  const upcoming = data?.upcoming ?? [];
  const paid = (data?.paid ?? []).filter((t) => t.remittanceDate !== null); // only remittance-style paid (not manual)

  // Group remitted orders by remittanceTxId
  const ordersByTx: Record<string, RemittedOrder[]> = {};
  (data?.remittedOrders ?? []).forEach((o) => {
    const key = o.remittanceTxId ?? "unlinked";
    if (!ordersByTx[key]) ordersByTx[key] = [];
    ordersByTx[key].push(o);
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Wallet</h1>
          <p className="text-sm text-gray-500 mt-0.5">Balance and remittance history</p>
        </div>
        <button onClick={() => fetchWallet(true)} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Available Balance</p>
            <p className={`text-3xl font-bold mt-1 ${(data?.balance ?? 0) >= 0 ? "text-green-600" : "text-red-500"}`}>
              {fmt(data?.balance ?? 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">Paid remittances only</p>
          </div>
          <IndianRupee className="w-8 h-8 text-gray-200" />
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-yellow-600">Upcoming Remittances</p>
            <p className="text-3xl font-bold text-yellow-700 mt-1">{fmt(data?.upcomingAmount ?? 0)}</p>
            <p className="text-xs text-yellow-500 mt-1">{upcoming.length} scheduled</p>
          </div>
          <Clock className="w-8 h-8 text-yellow-300" />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Total Deducted</p>
            <p className="text-3xl font-bold text-red-500 mt-1">{fmt(data?.totalDebit ?? 0)}</p>
          </div>
          <TrendingDown className="w-8 h-8 text-red-200" />
        </div>
      </div>

      {/* Upcoming Remittances */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            <h2 className="font-semibold text-gray-800">Upcoming Remittances</h2>
          </div>
          {upcoming.map((t) => {
            const orders = ordersByTx[t.id] ?? [];
            const isOpen = expanded === t.id;
            return (
              <div key={t.id} className="bg-yellow-50 border border-yellow-200 rounded-xl overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : t.id)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-yellow-100/50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    {orders.length > 0 ? (isOpen ? <ChevronDown className="w-4 h-4 text-yellow-500" /> : <ChevronRight className="w-4 h-4 text-yellow-500" />) : <span className="w-4" />}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.note || "Remittance"}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Scheduled on: {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                      {t.remittanceDate && (
                        <p className="text-xs font-semibold text-yellow-700 mt-0.5">
                          Expected by: {new Date(t.remittanceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      )}
                      {orders.length > 0 && <p className="text-xs text-gray-400">{orders.length} order(s)</p>}
                    </div>
                  </div>
                  <p className="text-lg font-bold text-yellow-700 flex-shrink-0 ml-4">
                    {t.type === "CREDIT" ? "+" : "-"}{fmt(t.amount)}
                  </p>
                </button>
                {isOpen && orders.length > 0 && (
                  <div className="border-t border-yellow-200 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-yellow-100/50">
                          <th className="px-4 py-2 text-left text-gray-500">Order #</th>
                          <th className="px-4 py-2 text-left text-gray-500">Type</th>
                          <th className="px-4 py-2 text-right text-gray-500">Order Amt</th>
                          <th className="px-4 py-2 text-right text-purple-600">Product</th>
                          <th className="px-4 py-2 text-right text-blue-600">Shipping</th>
                          <th className="px-4 py-2 text-right text-orange-500">Packing</th>
                          <th className="px-4 py-2 text-right text-red-500">RTO</th>
                          <th className="px-4 py-2 text-right text-green-600 font-semibold">Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-yellow-100">
                        {orders.map((o) => {
                          const rto = o.courier?.includes("RTO") || false;
                          const net = netForOrder(o);
                          return (
                            <tr key={o.id}>
                              <td className="px-4 py-2 font-mono text-blue-600">{o.externalOrderId}</td>
                              <td className="px-4 py-2"><span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${rto ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"}`}>{rto ? "RTO" : "Delivered"}</span></td>
                              <td className="px-4 py-2 text-right font-semibold text-gray-700">{rto ? "—" : fmt(o.totalAmount)}</td>
                              <td className="px-4 py-2 text-right text-purple-700">{o.productCost != null ? fmt(o.productCost) : "—"}</td>
                              <td className="px-4 py-2 text-right text-blue-700">{o.shippingCharge != null ? fmt(o.shippingCharge) : "—"}</td>
                              <td className="px-4 py-2 text-right text-orange-600">{o.packingCharge != null ? fmt(o.packingCharge) : "—"}</td>
                              <td className="px-4 py-2 text-right text-red-600">{o.rtoCharge != null ? fmt(o.rtoCharge) : "—"}</td>
                              <td className="px-4 py-2 text-right font-bold"><span className={net >= 0 ? "text-green-600" : "text-red-500"}>{fmt(net)}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Received Remittances */}
      {paid.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <h2 className="font-semibold text-gray-800">Received Remittances</h2>
          </div>
          {paid.map((t) => {
            const orders = ordersByTx[t.id] ?? [];
            const isOpen = expanded === (`paid-${t.id}`);
            return (
              <div key={t.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : `paid-${t.id}`)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    {orders.length > 0 ? (isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />) : <span className="w-4" />}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.note || "Remittance"}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                      {t.bankTxId && (
                        <p className="text-xs text-green-700 font-mono font-semibold mt-0.5">Tx ID: {t.bankTxId}</p>
                      )}
                      {orders.length > 0 && <p className="text-xs text-gray-400">{orders.length} order(s)</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <p className={`text-lg font-bold ${t.type === "CREDIT" ? "text-green-600" : "text-red-500"}`}>
                      {t.type === "CREDIT" ? "+" : "-"}{fmt(t.amount)}
                    </p>
                  </div>
                </button>
                {isOpen && orders.length > 0 && (
                  <div className="border-t border-gray-100 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50/60">
                          <th className="px-4 py-2 text-left text-gray-500">Order #</th>
                          <th className="px-4 py-2 text-left text-gray-500">Type</th>
                          <th className="px-4 py-2 text-right text-gray-500">Order Amt</th>
                          <th className="px-4 py-2 text-right text-purple-600">Product</th>
                          <th className="px-4 py-2 text-right text-blue-600">Shipping</th>
                          <th className="px-4 py-2 text-right text-orange-500">Packing</th>
                          <th className="px-4 py-2 text-right text-red-500">RTO</th>
                          <th className="px-4 py-2 text-right text-green-600 font-semibold">Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {orders.map((o) => {
                          const rto = o.courier?.includes("RTO") || false;
                          const net = netForOrder(o);
                          return (
                            <tr key={o.id} className="hover:bg-gray-50/50">
                              <td className="px-4 py-2 font-mono text-blue-600">{o.externalOrderId}</td>
                              <td className="px-4 py-2"><span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${rto ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"}`}>{rto ? "RTO" : "Delivered"}</span></td>
                              <td className="px-4 py-2 text-right font-semibold text-gray-700">{rto ? "—" : fmt(o.totalAmount)}</td>
                              <td className="px-4 py-2 text-right text-purple-700">{o.productCost != null ? fmt(o.productCost) : "—"}</td>
                              <td className="px-4 py-2 text-right text-blue-700">{o.shippingCharge != null ? fmt(o.shippingCharge) : "—"}</td>
                              <td className="px-4 py-2 text-right text-orange-600">{o.packingCharge != null ? fmt(o.packingCharge) : "—"}</td>
                              <td className="px-4 py-2 text-right text-red-600">{o.rtoCharge != null ? fmt(o.rtoCharge) : "—"}</td>
                              <td className="px-4 py-2 text-right font-bold"><span className={net >= 0 ? "text-green-600" : "text-red-500"}>{fmt(net)}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {upcoming.length === 0 && paid.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 text-sm">No remittances yet</div>
      )}
    </div>
  );
}

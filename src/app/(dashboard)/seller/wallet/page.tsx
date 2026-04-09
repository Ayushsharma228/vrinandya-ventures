"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Package, TrendingUp, TrendingDown, Wallet, CreditCard } from "lucide-react";

interface WalletData {
  totalOrders: number;
  confirmed: number;
  rto: number;
  netBalance: number;
  currentBalance: number;
  totalMargins: number;
  totalPenalties: number;
  remitted: number;
  storeUrl: string | null;
  lastUpdated: string;
  orders: {
    id: string;
    externalOrderId: string;
    status: string;
    amount: number;
    createdAt: string;
  }[];
}

const STATUS_LABEL: Record<string, string> = {
  NEW: "New",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  NEW: "bg-blue-50 text-blue-600",
  PROCESSING: "bg-yellow-50 text-yellow-600",
  SHIPPED: "bg-purple-50 text-purple-600",
  IN_TRANSIT: "bg-indigo-50 text-indigo-600",
  DELIVERED: "bg-green-50 text-green-600",
  CANCELLED: "bg-red-50 text-red-600",
};

function fmt(amount: number) {
  return `₹${amount.toFixed(2)}`;
}

export default function SellerWalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [tab, setTab] = useState<"remittance" | "orders">("remittance");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWallet = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/seller/wallet");
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Wallet System</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage wallet balance and orders impact
            {data?.storeUrl && (
              <span className="text-blue-500"> for {data.storeUrl}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchWallet(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {data?.totalOrders ?? 0}
            </p>
          </div>
          <Package className="w-8 h-8 text-blue-400" />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Confirmed</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {fmt(data?.confirmed ?? 0)}
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-green-400" />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">RTO</p>
            <p className="text-2xl font-bold text-red-500 mt-1">
              {fmt(data?.rto ?? 0)}
            </p>
          </div>
          <TrendingDown className="w-8 h-8 text-red-400" />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Net Balance</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {fmt(data?.netBalance ?? 0)}
            </p>
          </div>
          <CreditCard className="w-8 h-8 text-green-400" />
        </div>
      </div>

      {/* Wallet Balance + Remitted */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-800">Current Wallet Balance</h2>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {fmt(data?.currentBalance ?? 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1.5">
            Last updated:{" "}
            {data?.lastUpdated
              ? new Date(data.lastUpdated).toLocaleString("en-IN")
              : "—"}
          </p>
          <div className="flex gap-6 mt-3">
            <span className="text-xs text-blue-500">
              Total Margins: {fmt(data?.totalMargins ?? 0)}
            </span>
            <span className="text-xs text-orange-500">
              Total Penalties: {fmt(data?.totalPenalties ?? 0)}
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-blue-500" />
            <h2 className="font-semibold text-gray-800">Remitted</h2>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {fmt(data?.remitted ?? 0)}
          </p>
          {data?.storeUrl && (
            <p className="text-xs text-blue-400 mt-2">
              Cumulative amount remitted for {data.storeUrl}
            </p>
          )}
        </div>
      </div>

      {/* Orders & Wallet Impact */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Orders & Wallet Impact</h2>
            <p className="text-xs text-gray-400 mt-0.5">View your remittance history</p>
          </div>
          <div className="flex border border-gray-200 rounded-lg overflow-hidden text-sm">
            <button
              onClick={() => setTab("remittance")}
              className={`px-4 py-2 transition-colors ${
                tab === "remittance"
                  ? "bg-white text-gray-800 font-medium"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              Remittance Logs
            </button>
            <button
              onClick={() => setTab("orders")}
              className={`px-4 py-2 transition-colors border-l border-gray-200 ${
                tab === "orders"
                  ? "bg-white text-gray-800 font-medium"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              Orders & Impact
            </button>
          </div>
        </div>

        {tab === "remittance" ? (
          <div className="py-16 text-center">
            <p className="text-sm text-blue-400">No remittance logs found.</p>
          </div>
        ) : (
          <>
            {!data?.orders?.length ? (
              <div className="py-16 text-center">
                <p className="text-sm text-gray-400">No orders found.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-medium text-blue-500">Order ID</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-blue-500">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-blue-500">Amount</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-blue-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">
                        #{o.externalOrderId}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {STATUS_LABEL[o.status] ?? o.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{fmt(o.amount)}</td>
                      <td className="px-5 py-3 text-gray-500">
                        {new Date(o.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Package, CheckCircle, XCircle, Truck, Wallet, ArrowDownCircle } from "lucide-react";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/lib/order-status";

interface WalletData {
  orders: {
    id: string;
    externalOrderId: string;
    source: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    items: { name: string | null; quantity: number; price: number }[];
  }[];
  remittances: {
    id: string;
    amount: number;
    note: string | null;
    createdAt: string;
  }[];
  stats: {
    totalOrders: number;
    delivered: number;
    cancelled: number;
    inTransit: number;
    walletBalance: number;
    totalRemittances: number;
  };
}

export default function SupplierWalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchData() {
    try {
      const res = await fetch("/api/supplier/wallet");
      const json = await res.json();
      setData(json);
    } catch { setData(null); }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }

  const stats = data?.stats;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
          <p className="text-sm text-gray-400 mt-0.5">Summary of your order impacts</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 bg-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Order Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { label: "Total Orders", value: stats?.totalOrders ?? 0, icon: Package,       color: "text-blue-500",  iconBg: "text-blue-400" },
          { label: "Delivered",    value: stats?.delivered ?? 0,    icon: CheckCircle,   color: "text-green-600", iconBg: "text-green-400" },
          { label: "Cancelled",    value: stats?.cancelled ?? 0,    icon: XCircle,       color: "text-red-500",   iconBg: "text-red-400" },
          { label: "In Transit",   value: stats?.inTransit ?? 0,    icon: Truck,         color: "text-blue-600",  iconBg: "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
            <s.icon className={`w-8 h-8 ${s.iconBg} opacity-80`} />
          </div>
        ))}
      </div>

      {/* Balance + Remittances */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Wallet Balance */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-semibold text-gray-700">Current Wallet Balance</p>
          </div>
          <p className="text-3xl font-bold text-green-600">
            ₹{(stats?.walletBalance ?? 0).toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">After remittances deducted</p>
        </div>

        {/* Total Remittances */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ArrowDownCircle className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-semibold text-gray-700">Total Remittances</p>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            ₹{(stats?.totalRemittances ?? 0).toFixed(2)}
          </p>
          <p className="text-xs text-blue-400 mt-1">Amount received from admin</p>
        </div>
      </div>

      {/* Orders & Impact */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">Orders & Impact</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading...</div>
        ) : !data?.orders?.length ? (
          <div className="py-12 text-center text-blue-400 text-sm">No entries</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {["Order ID", "Source", "Items", "Order Value", "Status", "Date"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.orders.map((order) => {
                  const itemTotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 font-mono text-xs text-blue-600">#{order.externalOrderId}</td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{order.source}</td>
                      <td className="px-5 py-3.5">
                        {order.items.map((item, i) => (
                          <p key={i} className="text-xs text-gray-600">{item.name} × {item.quantity}</p>
                        ))}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-800">₹{itemTotal.toFixed(2)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ORDER_STATUS_COLOR[order.status] || "bg-gray-50 text-gray-500"}`}>
                          {ORDER_STATUS_LABEL[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs">
                        {new Date(order.createdAt).toLocaleDateString("en-IN")}
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
  );
}

"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Package, CheckCircle, XCircle, Truck, Wallet, ArrowDownCircle } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  NEW:        { label: "New",        color: "#3B82F6", bg: "#EFF6FF" },
  PROCESSING: { label: "Processing", color: "#F59E0B", bg: "#FFF7ED" },
  SHIPPED:    { label: "Shipped",    color: "#7C3AED", bg: "#F5F3FF" },
  IN_TRANSIT: { label: "In Transit", color: "#025864", bg: "#ECFDF5" },
  DELIVERED:  { label: "Delivered",  color: "#00C67A", bg: "#F0FDF4" },
  RTO:        { label: "RTO",        color: "#EF4444", bg: "#FEF2F2" },
  CANCELLED:  { label: "Cancelled",  color: "#6B7280", bg: "#F9FAFB" },
};

function fmt(n: number) { return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n); }

export default function SupplierWalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchData(showRefreshing = false) {
    if (showRefreshing) setRefreshing(true); else setLoading(true);
    const res = await fetch("/api/supplier/wallet");
    setData(await res.json());
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { fetchData(); }, []);

  const stats = data?.stats;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Wallet"
        subtitle="Summary of your order value and remittances"
        actions={
          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
            style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
        cards={
          <div className="grid grid-cols-3 gap-5">
            {/* Wallet Balance */}
            <div className="rounded-2xl px-6 py-5"
              style={{ background: "rgba(0,198,122,0.12)", border: "1px solid rgba(0,198,122,0.2)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Wallet Balance
                </p>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,198,122,0.2)" }}>
                  <Wallet style={{ color: "var(--green-500)", width: 18, height: 18 }} />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">₹{fmt(stats?.walletBalance ?? 0)}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>After remittances deducted</p>
            </div>

            {/* Total Remittances */}
            <div className="rounded-2xl px-6 py-5"
              style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Total Remittances
                </p>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.2)" }}>
                  <ArrowDownCircle style={{ color: "#7C3AED", width: 18, height: 18 }} />
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">₹{fmt(stats?.totalRemittances ?? 0)}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Amount received from admin</p>
            </div>

            {/* Order Stats */}
            <div className="rounded-2xl px-6 py-5"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                Order Breakdown
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Delivered",   value: stats?.delivered ?? 0,   icon: CheckCircle, color: "#00C67A" },
                  { label: "In Transit",  value: stats?.inTransit ?? 0,   icon: Truck,       color: "#3B82F6" },
                  { label: "Cancelled",   value: stats?.cancelled ?? 0,   icon: XCircle,     color: "#EF4444" },
                  { label: "Total",       value: stats?.totalOrders ?? 0, icon: Package,     color: "#F59E0B" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <Icon style={{ color, width: 14, height: 14 }} />
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{label}:</span>
                    <span className="text-sm font-bold text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
      />

      <div className="px-8 py-6">
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Orders & Impact</h2>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--text-400)" }}>Loading...</div>
          ) : !data?.orders?.length ? (
            <div className="py-16 flex flex-col items-center gap-2">
              <Package className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm" style={{ color: "var(--text-400)" }}>No orders yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "#FAFAFA" }}>
                  {["Order ID", "Source", "Items", "Order Value", "Status", "Date"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-400)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {data.orders.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.NEW;
                  const itemTotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-xs" style={{ color: "var(--green-500)" }}>
                        #{order.externalOrderId}
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-600)" }}>{order.source}</td>
                      <td className="px-5 py-3.5">
                        {order.items.map((item, i) => (
                          <p key={i} className="text-xs" style={{ color: "var(--text-600)" }}>
                            {item.name} ×{item.quantity}
                          </p>
                        ))}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-xs" style={{ color: "var(--text-900)" }}>₹{fmt(itemTotal)}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-400)" }}>
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

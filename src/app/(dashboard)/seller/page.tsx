"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import {
  ShoppingCart, TrendingUp, TrendingDown, AlertTriangle,
  Wallet, Package, ArrowRight, Store,
  CheckCircle2, Clock, Truck, XCircle, IndianRupee, Megaphone,
} from "lucide-react";

interface Analytics {
  totalOrders: number;
  deliveredCount: number;
  rtoCount: number;
  inTransitCount: number;
  cancelledCount: number;
  deliveryRate: number;
  rtoRate: number;
  totalRevenue: number;
  trend: { date: string; total: number; delivered: number; rto: number }[];
  store: { storeUrl: string; storeName: string } | null;
}

interface Wallet {
  balance: number;
  upcomingAmount: number;
  totalCredit: number;
  totalDebit: number;
  upcoming: { id: string; remittanceDate: string; amount: number }[];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-600 mb-1">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export default function SellerDashboard() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [recentOrders, setRecentOrders] = useState<{ id: string; externalOrderId: string; customerName: string; totalAmount: number; status: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const name = session?.user?.name?.split(" ")[0] || "Seller";

  useEffect(() => {
    Promise.all([
      fetch("/api/seller/analytics").then(r => r.json()),
      fetch("/api/seller/wallet").then(r => r.json()),
      fetch("/api/seller/orders?limit=6").then(r => r.json()),
    ]).then(([a, w, o]) => {
      setAnalytics(a);
      setWallet(w);
      setRecentOrders(o.orders?.slice(0, 6) || []);
      setLoading(false);
    });
  }, []);

  const nextPayout = wallet?.upcoming?.[0];
  const nextPayoutDate = nextPayout?.remittanceDate
    ? new Date(nextPayout.remittanceDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : null;

  // Last 14 days of trend data
  const chartData = analytics?.trend?.slice(-14).map(d => ({
    date: new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    Orders: d.total,
    Delivered: d.delivered,
    RTO: d.rto,
  })) ?? [];

  const netProfit = (wallet?.totalCredit ?? 0) - (wallet?.totalDebit ?? 0);

  const stats = [
    {
      label: "Total Orders",
      value: fmt(analytics?.totalOrders ?? 0),
      icon: ShoppingCart,
      iconBg: "#EFF6FF",
      iconColor: "#3B82F6",
      sub: `${analytics?.inTransitCount ?? 0} in transit`,
    },
    {
      label: "Total Revenue",
      value: `₹${fmt(analytics?.totalRevenue ?? 0)}`,
      icon: IndianRupee,
      iconBg: "#F0FDF4",
      iconColor: "#00C67A",
      sub: wallet ? `₹${fmt(wallet.totalCredit)} remitted` : "—",
    },
    {
      label: "Meta Ads Spent",
      value: "₹0",
      icon: Megaphone,
      iconBg: "#F5F3FF",
      iconColor: "#7C3AED",
      sub: "Coming soon",
    },
    {
      label: "Net Profit",
      value: `₹${fmt(Math.max(0, netProfit))}`,
      icon: TrendingUp,
      iconBg: netProfit >= 0 ? "#F0FDF4" : "#FEF2F2",
      iconColor: netProfit >= 0 ? "#00C67A" : "#EF4444",
      sub: `After deductions`,
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>

      {/* ── Hero Band (D-5 style) ────────────────────────────── */}
      <div
        className="relative overflow-hidden px-8 pt-8 pb-10"
        style={{ background: "linear-gradient(135deg, #0D1117 0%, #0D2818 60%, #0a1f12 100%)" }}
      >
        {/* background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #00C67A, transparent)" }} />
          <div className="absolute -bottom-10 left-1/3 w-60 h-60 rounded-full opacity-5"
            style={{ background: "radial-gradient(circle, #3B82F6, transparent)" }} />
        </div>

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="text-3xl font-bold text-white mb-1">
              {getGreeting()}, {name}! 👋
            </h1>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              Here&apos;s what&apos;s happening with your store today
            </p>
          </div>

          <div className="flex items-center gap-3">
            {analytics?.store ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
                style={{ background: "rgba(0,198,122,0.15)", color: "#00C67A", border: "1px solid rgba(0,198,122,0.3)" }}>
                <CheckCircle2 className="w-4 h-4" />
                {analytics.store.storeUrl}
              </div>
            ) : (
              <Link href="/seller/shopify"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)" }}>
                <AlertTriangle className="w-4 h-4" />
                Connect Shopify
              </Link>
            )}
          </div>
        </div>

        {/* Mini stat row inside hero */}
        <div className="relative mt-6 grid grid-cols-4 gap-4">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl animate-pulse"
                style={{ background: "rgba(255,255,255,0.07)" }} />
            ))
          ) : stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl px-4 py-4"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{s.label}</p>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: s.iconBg }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: s.iconColor }} />
                  </div>
                </div>
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{s.sub}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="px-8 py-6 space-y-6">

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          {[
            { label: "View Orders",    href: "/seller/orders",   icon: ShoppingCart, color: "#3B82F6" },
            { label: "Product Catalog", href: "/seller/catalog",  icon: Package,      color: "#00C67A" },
            { label: "Deliveries",     href: "/seller/deliveries", icon: Truck,        color: "#7C3AED" },
            { label: "Wallet",         href: "/seller/wallet",   icon: Wallet,       color: "#F59E0B" },
            { label: "Shopify Store",  href: "/seller/shopify",  icon: Store,        color: "#EF4444" },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.href} href={a.href}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:shadow-sm"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-600)" }}>
                <Icon className="w-4 h-4" style={{ color: a.color }} />
                {a.label}
                <ArrowRight className="w-3 h-3 ml-auto opacity-40" />
              </Link>
            );
          })}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-5">

          {/* Area Chart — Order Trend */}
          <div className="col-span-2 card p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Order Trend</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>Last 14 days</p>
              </div>
              <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-400)" }}>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#00C67A" }} />
                  Delivered
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#3B82F6" }} />
                  Orders
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: "#EF4444" }} />
                  RTO
                </span>
              </div>
            </div>
            {chartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm" style={{ color: "var(--text-400)" }}>
                No order data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                  <Bar dataKey="Orders" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="Delivered" fill="#00C67A" radius={[4, 4, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="RTO" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Delivery Breakdown */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-900)" }}>Delivery Breakdown</h2>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-8 rounded-lg animate-pulse bg-gray-100" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: "Delivered",  count: analytics?.deliveredCount ?? 0, color: "#00C67A", icon: CheckCircle2 },
                  { label: "In Transit", count: analytics?.inTransitCount ?? 0, color: "#025864", icon: Truck },
                  { label: "RTO",        count: analytics?.rtoCount ?? 0,       color: "#EF4444", icon: TrendingDown },
                  { label: "Cancelled",  count: analytics?.cancelledCount ?? 0, color: "#6B7280", icon: XCircle },
                ].map((item) => {
                  const total = analytics?.totalOrders || 1;
                  const pct = Math.round((item.count / total) * 100);
                  const Icon = item.icon;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                          <span className="text-xs font-medium" style={{ color: "var(--text-600)" }}>{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color: "var(--text-900)" }}>{item.count}</span>
                          <span className="text-xs" style={{ color: "var(--text-400)" }}>{pct}%</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ background: "#F3F4F6" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: item.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Wallet summary */}
            <div className="mt-5 pt-4 rounded-xl p-3" style={{ background: "var(--bg-sidebar)" }}>
              <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Wallet Balance</p>
              <p className="text-xl font-bold text-white">₹{fmt(wallet?.balance ?? 0)}</p>
              {wallet?.upcomingAmount ? (
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "#00C67A" }}>
                  <Clock className="w-3 h-3" />
                  ₹{fmt(wallet.upcomingAmount)} upcoming
                </p>
              ) : null}
              <Link href="/seller/wallet"
                className="mt-2 flex items-center gap-1 text-xs font-medium"
                style={{ color: "rgba(255,255,255,0.4)" }}>
                View details <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Recent Orders</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>Your latest 6 orders</p>
            </div>
            <Link href="/seller/orders"
              className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: "var(--green-500)", background: "#F0FDF4", border: "1px solid #D1FAE5" }}>
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg animate-pulse bg-gray-50" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2">
              <ShoppingCart className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text-400)" }}>No orders yet</p>
              <p className="text-xs" style={{ color: "var(--text-400)" }}>
                Orders from your Shopify store will appear here
              </p>
              <Link href="/seller/shopify"
                className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: "var(--green-500)" }}>
                <Store className="w-4 h-4" /> Connect Store
              </Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {recentOrders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.NEW;
                return (
                  <div key={order.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: cfg.bg }}>
                      <ShoppingCart className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-900)" }}>
                        #{order.externalOrderId}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--text-400)" }}>
                        {order.customerName}
                      </p>
                    </div>
                    <span className="text-sm font-bold" style={{ color: "var(--text-900)" }}>
                      ₹{fmt(order.totalAmount)}
                    </span>
                    <span className="pill text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                    <span className="text-xs flex-shrink-0" style={{ color: "var(--text-400)" }}>
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
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

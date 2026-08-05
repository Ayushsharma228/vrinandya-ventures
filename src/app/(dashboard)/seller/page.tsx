"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  ShoppingCart, TrendingDown, AlertTriangle, Wallet,
  Package, ArrowRight, Store, CheckCircle2, Truck, XCircle,
  IndianRupee, ChevronDown, TrendingUp, Megaphone, Upload, Clock,
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
  earnings: {
    totalGMV: number;
    totalProductCost: number;
    totalShipping: number;
    totalFees: number;
    totalRtoCharge: number;
    totalEarned: number;
  };
}

interface WalletData { balance: number; totalRemittance: number; totalDeductions: number }

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
  NEW:        { label: "New",        color: "#4361EE", bg: "rgba(67,97,238,0.1)" },
  PROCESSING: { label: "Processing", color: "#F59E0B", bg: "#FFF7ED" },
  SHIPPED:    { label: "Shipped",    color: "#7C3AED", bg: "#F5F3FF" },
  IN_TRANSIT: { label: "In Transit", color: "#0891B2", bg: "#ECFEFF" },
  DELIVERED:  { label: "Delivered",  color: "#059669", bg: "#ECFDF5" },
  RTO:        { label: "RTO",        color: "#EF4444", bg: "#FEF2F2" },
  CANCELLED:  { label: "Cancelled",  color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl shadow-lg p-3 text-xs"
      style={{ background: "white", border: "1px solid #E5E7EB" }}>
      <p className="font-semibold mb-1" style={{ color: "#6B7280" }}>{label}</p>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

function Accordion({ label, icon: Icon, open, onToggle, badge }: {
  label: string; icon: React.ElementType; open: boolean;
  onToggle: () => void; badge?: string;
}) {
  return (
    <button onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-colors text-left"
      style={{
        background: open ? "white" : "white",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(67,97,238,0.1)" }}>
          <Icon className="w-4 h-4" style={{ color: "#4361EE" }} />
        </div>
        <span className="text-sm font-semibold" style={{ color: "#1e1b4b" }}>{label}</span>
        {badge && (
          <span className="text-xs px-2.5 py-0.5 rounded-full font-medium"
            style={{ background: "rgba(67,97,238,0.1)", color: "#4361EE" }}>{badge}</span>
        )}
      </div>
      <ChevronDown className="w-4 h-4 transition-transform flex-shrink-0"
        style={{ color: "#9CA3AF", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
    </button>
  );
}

export default function SellerDashboard() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [wallet, setWallet]       = useState<WalletData | null>(null);
  const [recentOrders, setRecentOrders] = useState<{
    id: string; externalOrderId: string; customerName: string;
    totalAmount: number; status: string; createdAt: string;
  }[]>([]);
  const [loading, setLoading]           = useState(true);
  const [adSpend, setAdSpend]           = useState(0);
  const [adRevenue, setAdRevenue]       = useState(0);
  const [metaConnected, setMetaConnected] = useState(false);
  const [openNdrs, setOpenNdrs]         = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [orderFilter, setOrderFilter]   = useState("ALL");
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [chartDays, setChartDays]       = useState(14);
  const [showAnalytics, setShowAnalytics]   = useState(false);
  const [showFinancials, setShowFinancials] = useState(false);

  const name = session?.user?.name?.split(" ")[0] || "Seller";

  useEffect(() => {
    Promise.all([
      fetch("/api/seller/analytics").then(r => r.json()),
      fetch("/api/seller/wallet").then(r => r.json()),
      fetch("/api/seller/ad-spend").then(r => r.json()),
      fetch("/api/seller/ndr").then(r => r.json()),
    ]).then(([a, w, ads, ndr]) => {
      setAnalytics(a); setWallet(w);
      setAdSpend(ads.total ?? 0);
      setAdRevenue(ads.last30DaysRevenue ?? 0);
      setMetaConnected(ads.metaConnected ?? false);
      setOpenNdrs(ndr.pending?.length ?? 0);
      setLoading(false);
    });
    fetch("/api/seller/orders?status=NEW&limit=1")
      .then(r => r.json()).then(d => setNewOrdersCount(d.total ?? 0)).catch(() => {});
  }, []);

  useEffect(() => {
    setOrdersLoading(true);
    const p = new URLSearchParams({ limit: "10" });
    if (orderFilter !== "ALL") p.set("status", orderFilter);
    fetch(`/api/seller/orders?${p}`).then(r => r.json()).then(o => {
      setRecentOrders(o.orders?.slice(0, 10) || []);
      setOrdersLoading(false);
    });
  }, [orderFilter]);

  const chartData = analytics?.trend
    ?.slice(chartDays > 0 ? -chartDays : undefined)
    .map(d => ({
      date: new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      Orders: d.total, Delivered: d.delivered, RTO: d.rto,
    })) ?? [];

  const deliveryRate  = analytics?.deliveryRate ?? 0;
  const rtoRate       = analytics?.rtoRate ?? 0;
  const todayData     = analytics?.trend?.at(-1);
  const yesterdayData = analytics?.trend?.at(-2);
  const todayOrders   = todayData?.total ?? 0;
  const todayDelta    = todayOrders - (yesterdayData?.total ?? 0);
  const avgOrderValue = analytics ? analytics.totalRevenue / Math.max(analytics.totalOrders, 1) : 0;
  const todayRevEst   = Math.round(todayOrders * avgOrderValue);
  const last7         = analytics?.trend?.slice(-7) ?? [];
  const prior7        = analytics?.trend?.slice(-14, -7) ?? [];
  const last7Total    = last7.reduce((s, d) => s + d.total, 0);
  const prior7Total   = prior7.reduce((s, d) => s + d.total, 0);
  const weekOverWeek  = prior7Total > 0 ? Math.round(((last7Total - prior7Total) / prior7Total) * 100) : 0;
  const bestDay       = analytics?.trend?.reduce<typeof analytics.trend[0] | null>(
    (best, d) => (d.total > (best?.total ?? 0) ? d : best), null
  );

  return (
    <div className="min-h-screen" style={{ background: "#F1F5FF" }}>

      {/* ── Welcome Hero ───────────────────────────────── */}
      <div className="px-4 md:px-8 pt-8 pb-6"
        style={{ background: "white", borderBottom: "1px solid #E5E7EB" }}>

        {/* Top row: welcome + big stats */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: "#818CF8" }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="text-4xl font-black mb-2" style={{ color: "#1e1b4b" }}>
              {getGreeting()}, {name}!
            </h1>

            {/* Status pills */}
            {!loading && analytics && analytics.totalOrders > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(67,97,238,0.08)", color: "#4361EE" }}>
                  📦 {analytics.totalOrders} total orders
                </span>
                {newOrdersCount > 0 && (
                  <Link href="/seller/orders"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: "rgba(67,97,238,0.15)", color: "#4361EE" }}>
                    🛒 {newOrdersCount} new waiting
                  </Link>
                )}
                {openNdrs > 0 && (
                  <Link href="/seller/ndr"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: "#FEF2F2", color: "#EF4444" }}>
                    ⚠️ {openNdrs} NDR action needed
                  </Link>
                )}
                {Math.abs(weekOverWeek) > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{ background: weekOverWeek >= 0 ? "rgba(67,97,238,0.08)" : "#FEF2F2", color: weekOverWeek >= 0 ? "#4361EE" : "#EF4444" }}>
                    {weekOverWeek >= 0 ? "📈" : "📉"} {Math.abs(weekOverWeek)}% vs last week
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 3 big number stats — Crextio style */}
          <div className="flex items-center gap-6 md:gap-10 flex-shrink-0">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-10 w-20 rounded-xl bg-gray-100 mb-1" />
                  <div className="h-3 w-16 rounded bg-gray-100" />
                </div>
              ))
            ) : (
              <>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(67,97,238,0.1)" }}>
                      <IndianRupee className="w-3.5 h-3.5" style={{ color: "#4361EE" }} />
                    </div>
                    <p className="text-3xl font-black" style={{ color: "#1e1b4b" }}>₹{fmt(analytics?.totalRevenue ?? 0)}</p>
                  </div>
                  <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Revenue</p>
                  {todayOrders > 0 && avgOrderValue > 0 && (
                    <p className="text-[10px] mt-0.5" style={{ color: "#4361EE" }}>~₹{fmt(todayRevEst)} today</p>
                  )}
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(67,97,238,0.1)" }}>
                      <ShoppingCart className="w-3.5 h-3.5" style={{ color: "#4361EE" }} />
                    </div>
                    <p className="text-3xl font-black" style={{ color: "#1e1b4b" }}>{fmt(analytics?.totalOrders ?? 0)}</p>
                  </div>
                  <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Orders</p>
                  {todayOrders > 0 && (
                    <p className="text-[10px] mt-0.5" style={{ color: todayDelta >= 0 ? "#4361EE" : "#EF4444" }}>
                      {todayDelta >= 0 ? "▲" : "▼"}{Math.abs(todayDelta)} today
                    </p>
                  )}
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                      style={{ background: deliveryRate >= 70 ? "rgba(67,97,238,0.1)" : "#FEF2F2" }}>
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: deliveryRate >= 70 ? "#4361EE" : "#EF4444" }} />
                    </div>
                    <p className="text-3xl font-black" style={{ color: deliveryRate >= 70 ? "#1e1b4b" : "#EF4444" }}>
                      {deliveryRate.toFixed(0)}%
                    </p>
                  </div>
                  <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Delivery</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>RTO {rtoRate.toFixed(1)}%</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────── */}
      <div className="px-4 md:px-8 py-6 space-y-5">

        {/* Card row: Store card + Quick actions + Wallet */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Store card */}
          <div className="rounded-3xl p-5"
            style={{ background: "white", border: "1px solid #E5E7EB", boxShadow: "0 1px 12px rgba(0,0,0,0.04)" }}>
            {analytics?.store ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(67,97,238,0.1)" }}>
                    <Store className="w-6 h-6" style={{ color: "#4361EE" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: "#1e1b4b" }}>
                      {analytics.store.storeName || analytics.store.storeUrl.replace(".myshopify.com", "")}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <p className="text-xs" style={{ color: "#6366F1" }}>Shopify Connected</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Delivered", value: analytics.deliveredCount },
                    { label: "In Transit", value: analytics.inTransitCount },
                    { label: "RTO", value: analytics.rtoCount },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between py-1.5"
                      style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <span className="text-xs" style={{ color: "#6B7280" }}>{row.label}</span>
                      <span className="text-xs font-bold" style={{ color: "#1e1b4b" }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "#FEF2F2" }}>
                  <Store className="w-6 h-6" style={{ color: "#EF4444" }} />
                </div>
                <p className="text-sm font-semibold text-center" style={{ color: "#1e1b4b" }}>No Shopify Store</p>
                <Link href="/seller/shopify"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white"
                  style={{ background: "#4361EE" }}>
                  Connect Store
                </Link>
              </div>
            )}
          </div>

          {/* Wallet card */}
          <div className="rounded-3xl p-5"
            style={{ background: "white", border: "1px solid #E5E7EB", boxShadow: "0 1px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(67,97,238,0.1)" }}>
                <Wallet className="w-6 h-6" style={{ color: "#4361EE" }} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Wallet Balance</p>
                <p className="text-2xl font-black" style={{ color: "#1e1b4b" }}>
                  {loading ? "—" : `₹${fmt(wallet?.balance ?? 0)}`}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: "Total Remitted", value: `₹${fmt(wallet?.totalRemittance ?? 0)}` },
                { label: "Deductions",     value: `₹${fmt(wallet?.totalDeductions ?? 0)}` },
                { label: "Net Payout",     value: `₹${fmt((wallet?.totalRemittance ?? 0) - (wallet?.totalDeductions ?? 0))}` },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-1.5"
                  style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <span className="text-xs" style={{ color: "#6B7280" }}>{row.label}</span>
                  <span className="text-xs font-bold" style={{ color: "#1e1b4b" }}>{row.value}</span>
                </div>
              ))}
            </div>
            <Link href="/seller/wallet"
              className="flex items-center justify-center gap-1.5 mt-4 w-full py-2 rounded-xl text-xs font-semibold"
              style={{ background: "rgba(67,97,238,0.08)", color: "#4361EE" }}>
              View Wallet <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Quick Actions card */}
          <div className="rounded-3xl p-5"
            style={{ background: "white", border: "1px solid #E5E7EB", boxShadow: "0 1px 12px rgba(0,0,0,0.04)" }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "#9CA3AF" }}>Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Orders",     href: "/seller/orders",          icon: ShoppingCart },
                { label: "Import",     href: "/seller/orders?import=1", icon: Upload },
                { label: "Products",   href: "/seller/catalog",         icon: Package },
                { label: "Deliveries", href: "/seller/deliveries",      icon: Truck },
                { label: "NDR",        href: "/seller/ndr",             icon: AlertTriangle },
                { label: "Shopify",    href: "/seller/shopify",         icon: Store },
              ].map((a) => {
                const Icon = a.icon;
                return (
                  <Link key={a.href} href={a.href}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all"
                    style={{ background: "#F9FAFB", color: "#374151", border: "1px solid #F3F4F6" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(67,97,238,0.06)"; e.currentTarget.style.color = "#4361EE"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#F9FAFB"; e.currentTarget.style.color = "#374151"; }}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#4361EE" }} />
                    {a.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="rounded-3xl overflow-hidden"
          style={{ background: "white", border: "1px solid #E5E7EB", boxShadow: "0 1px 12px rgba(0,0,0,0.04)" }}>
          <div className="px-6 pt-5 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold" style={{ color: "#1e1b4b" }}>Recent Orders</h2>
              <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>Your latest {recentOrders.length} orders</p>
            </div>
            <Link href="/seller/orders"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
              style={{ background: "rgba(67,97,238,0.08)", color: "#4361EE" }}>
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Status filter */}
          <div className="px-6 pb-3 flex gap-1.5 flex-wrap" style={{ borderBottom: "1px solid #F3F4F6" }}>
            {["ALL", "NEW", "PROCESSING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "RTO", "CANCELLED"].map((s) => {
              const cfg = STATUS_CONFIG[s];
              const active = orderFilter === s;
              return (
                <button key={s} onClick={() => setOrderFilter(s)}
                  className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                  style={active
                    ? { background: cfg ? cfg.color : "#4361EE", color: "#fff" }
                    : { background: cfg ? cfg.bg : "#F3F4F6", color: cfg ? cfg.color : "#6B7280" }}>
                  {s === "ALL" ? "All" : cfg?.label ?? s}
                </button>
              );
            })}
          </div>

          {loading || ordersLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 rounded-2xl animate-pulse" style={{ background: "#F9FAFB" }} />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="py-14 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center" style={{ background: "#F9FAFB" }}>
                <ShoppingCart className="w-7 h-7" style={{ color: "#D1D5DB" }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "#6B7280" }}>
                {orderFilter === "ALL" ? "No orders yet" : `No ${STATUS_CONFIG[orderFilter]?.label ?? orderFilter} orders`}
              </p>
              {orderFilter === "ALL" && (
                <Link href="/seller/shopify"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "#4361EE" }}>
                  <Store className="w-4 h-4" /> Connect Store
                </Link>
              )}
            </div>
          ) : (
            <div>
              {recentOrders.map((order, idx) => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.NEW;
                return (
                  <div key={order.id}
                    className="px-6 py-3.5 flex items-center gap-4 transition-colors cursor-default"
                    style={{ borderBottom: idx < recentOrders.length - 1 ? "1px solid #F9FAFB" : "none" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#FAFBFF"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: cfg.bg }}>
                      <ShoppingCart className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#1e1b4b" }}>
                        #{order.externalOrderId}
                      </p>
                      <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{order.customerName}</p>
                    </div>
                    <span className="text-sm font-bold flex-shrink-0" style={{ color: "#1e1b4b" }}>
                      ₹{fmt(order.totalAmount)}
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0"
                      style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    <span className="text-xs flex-shrink-0 hidden md:block" style={{ color: "#9CA3AF" }}>
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Analytics — collapsible */}
        <div className="rounded-3xl overflow-hidden"
          style={{ border: "1px solid #E5E7EB", boxShadow: "0 1px 12px rgba(0,0,0,0.04)" }}>
          <Accordion
            label="Analytics & Charts"
            icon={TrendingUp}
            open={showAnalytics}
            onToggle={() => setShowAnalytics(v => !v)}
            badge={`${chartDays}d`}
          />
          {showAnalytics && (
            <div className="bg-white px-6 py-5 space-y-5" style={{ borderTop: "1px solid #F3F4F6" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs" style={{ color: "#9CA3AF" }}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: "#4361EE" }} /> Orders
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: "#059669" }} /> Delivered
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: "#EF4444" }} /> RTO
                  </span>
                </div>
                <div className="flex items-center gap-0.5 rounded-xl p-1" style={{ background: "#F3F4F6" }}>
                  {[7, 14, 30, 60].map((d) => (
                    <button key={d} onClick={() => setChartDays(d)}
                      className="px-3 py-1 text-xs font-semibold rounded-lg transition-all"
                      style={chartDays === d
                        ? { background: "white", color: "#1e1b4b", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
                        : { color: "#9CA3AF" }}>
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              {chartData.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm" style={{ color: "#9CA3AF" }}>No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="Orders"    stroke="#4361EE" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Delivered" stroke="#059669" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="RTO"       stroke="#EF4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#9CA3AF" }}>Delivery Breakdown</p>
                  <div className="space-y-3">
                    {[
                      { label: "Delivered",  count: analytics?.deliveredCount ?? 0, color: "#059669" },
                      { label: "In Transit", count: analytics?.inTransitCount ?? 0, color: "#4361EE" },
                      { label: "RTO",        count: analytics?.rtoCount ?? 0,       color: "#EF4444" },
                      { label: "Cancelled",  count: analytics?.cancelledCount ?? 0, color: "#9CA3AF" },
                    ].map(item => {
                      const total = analytics?.totalOrders || 1;
                      const pct = Math.round((item.count / total) * 100);
                      return (
                        <div key={item.label}>
                          <div className="flex justify-between mb-1.5">
                            <span className="text-xs font-medium" style={{ color: "#6B7280" }}>{item.label}</span>
                            <span className="text-xs font-bold" style={{ color: "#1e1b4b" }}>{item.count} <span style={{ color: "#9CA3AF" }}>({pct}%)</span></span>
                          </div>
                          <div className="w-full h-2 rounded-full" style={{ background: "#F3F4F6" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: item.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {last7.length >= 3 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#9CA3AF" }}>Last 7 Days</p>
                    <div className="space-y-2">
                      {[
                        { label: "Orders",    value: last7Total, icon: ShoppingCart, color: "#4361EE", delta: weekOverWeek },
                        { label: "Delivered", value: last7.reduce((s, d) => s + d.delivered, 0), icon: CheckCircle2, color: "#059669", delta: null },
                        { label: "RTO",       value: last7.reduce((s, d) => s + d.rto, 0),       icon: TrendingDown, color: "#EF4444", delta: null },
                        { label: "Avg/day",   value: +(last7Total / 7).toFixed(1),                icon: Clock,        color: "#6366F1", delta: null },
                      ].map(row => {
                        const Icon = row.icon;
                        return (
                          <div key={row.label} className="flex items-center justify-between py-2"
                            style={{ borderBottom: "1px solid #F9FAFB" }}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-3.5 h-3.5" style={{ color: row.color }} />
                              <span className="text-xs font-medium" style={{ color: "#6B7280" }}>{row.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold" style={{ color: "#1e1b4b" }}>{row.value}</span>
                              {row.delta !== null && Math.abs(row.delta) > 0 && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                  style={{ background: row.delta >= 0 ? "rgba(67,97,238,0.1)" : "#FEF2F2", color: row.delta >= 0 ? "#4361EE" : "#DC2626" }}>
                                  {row.delta >= 0 ? "▲" : "▼"}{Math.abs(row.delta)}%
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {bestDay && (
                        <p className="text-[10px] pt-1" style={{ color: "#9CA3AF" }}>
                          🏆 Best day: {new Date(bestDay.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} ({bestDay.total} orders)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Financials — collapsible */}
        {analytics?.earnings && (
          <div className="rounded-3xl overflow-hidden"
            style={{ border: "1px solid #E5E7EB", boxShadow: "0 1px 12px rgba(0,0,0,0.04)" }}>
            <Accordion
              label="Financials & P&L"
              icon={Wallet}
              open={showFinancials}
              onToggle={() => setShowFinancials(v => !v)}
              badge={metaConnected && adSpend > 0 ? `${(adRevenue / adSpend).toFixed(2)}x ROAS` : undefined}
            />
            {showFinancials && (() => {
              const e = analytics.earnings;
              const net    = (e.totalGMV - e.totalProductCost - e.totalShipping - e.totalFees - e.totalRtoCharge) - adSpend;
              const margin = e.totalGMV > 0 ? (net / e.totalGMV) * 100 : 0;
              const profit = net >= 0;
              const rows   = [
                { label: "Revenue (GMV)",    value: e.totalGMV,         color: "#4361EE", sign: "+" },
                { label: "Product Cost",     value: e.totalProductCost, color: "#EF4444", sign: "−" },
                { label: "Shipping",         value: e.totalShipping,    color: "#EF4444", sign: "−" },
                { label: "Platform Fee",     value: e.totalFees,        color: "#EF4444", sign: "−" },
                { label: "RTO Losses",       value: e.totalRtoCharge,   color: "#EF4444", sign: "−" },
                { label: "Ad Spend (30d)",   value: adSpend,            color: "#7C3AED", sign: "−" },
              ];
              return (
                <div className="bg-white px-6 py-5" style={{ borderTop: "1px solid #F3F4F6" }}>
                  <div className="flex items-center justify-between mb-5 p-4 rounded-2xl"
                    style={{ background: profit ? "rgba(67,97,238,0.06)" : "#FEF2F2" }}>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Net Profit</p>
                      <p className="text-2xl font-black mt-0.5" style={{ color: profit ? "#4361EE" : "#EF4444" }}>
                        {profit ? "+" : "−"}₹{fmt(Math.abs(net))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>Net margin</p>
                      <p className="text-xl font-black" style={{ color: profit ? "#4361EE" : "#EF4444" }}>{margin.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="space-y-0">
                    {rows.map(r => (
                      <div key={r.label} className="flex items-center justify-between py-2.5"
                        style={{ borderBottom: "1px solid #F9FAFB" }}>
                        <p className="text-xs font-medium" style={{ color: "#6B7280" }}>{r.label}</p>
                        <p className="text-xs font-bold" style={{ color: r.color }}>{r.sign}₹{fmt(r.value)}</p>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-3">
                      <p className="text-sm font-black" style={{ color: "#1e1b4b" }}>Net Profit</p>
                      <p className="text-sm font-black" style={{ color: profit ? "#4361EE" : "#EF4444" }}>
                        {profit ? "+" : "−"}₹{fmt(Math.abs(net))} ({margin.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                  {!metaConnected && (
                    <Link href="/seller/profile?tab=integrations"
                      className="flex items-center justify-between mt-4 px-4 py-3 rounded-2xl"
                      style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.12)" }}>
                      <div className="flex items-center gap-2.5">
                        <Megaphone className="w-4 h-4" style={{ color: "#7C3AED" }} />
                        <span className="text-xs font-semibold" style={{ color: "#7C3AED" }}>Connect Meta Ads to track ROAS</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5" style={{ color: "#7C3AED" }} />
                    </Link>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Bottom spacer */}
        <div className="h-4" />
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  ShoppingCart, TrendingUp, TrendingDown, AlertTriangle,
  Wallet, Package, ArrowRight, Store,
  CheckCircle2, Clock, Truck, XCircle, IndianRupee, Megaphone, Upload,
  ChevronDown,
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

interface WalletData {
  balance: number;
  totalRemittance: number;
  totalDeductions: number;
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
  NEW:        { label: "New",        color: "#4361EE", bg: "rgba(67,97,238,0.1)" },
  PROCESSING: { label: "Processing", color: "#F59E0B", bg: "#FFF7ED" },
  SHIPPED:    { label: "Shipped",    color: "#7C3AED", bg: "#F5F3FF" },
  IN_TRANSIT: { label: "In Transit", color: "#0891B2", bg: "#ECFEFF" },
  DELIVERED:  { label: "Delivered",  color: "#059669", bg: "#ECFDF5" },
  RTO:        { label: "RTO",        color: "#EF4444", bg: "#FEF2F2" },
  CANCELLED:  { label: "Cancelled",  color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl shadow-lg p-3 text-xs"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <p className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>{label}</p>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

function SectionToggle({ label, icon: Icon, open, onToggle, count }: {
  label: string;
  icon: React.ElementType;
  open: boolean;
  onToggle: () => void;
  count?: string;
}) {
  return (
    <button onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-4 transition-colors"
      style={{ background: "var(--bg-card)", borderBottom: open ? "1px solid var(--border)" : "none" }}
      onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-muted)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = open ? "var(--bg-card)" : "var(--bg-card)"; }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(67,97,238,0.1)" }}>
          <Icon className="w-4 h-4" style={{ color: "#4361EE" }} />
        </div>
        <span className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>{label}</span>
        {count && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: "rgba(67,97,238,0.1)", color: "#4361EE" }}>{count}</span>
        )}
      </div>
      <ChevronDown className="w-4 h-4 transition-transform"
        style={{ color: "var(--text-400)", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
    </button>
  );
}

export default function SellerDashboard() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [recentOrders, setRecentOrders] = useState<{ id: string; externalOrderId: string; customerName: string; totalAmount: number; status: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartDays, setChartDays] = useState(14);
  const [adSpend, setAdSpend] = useState(0);
  const [adRevenue, setAdRevenue] = useState(0);
  const [metaConnected, setMetaConnected] = useState(false);
  const [openNdrs, setOpenNdrs] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [orderFilter, setOrderFilter] = useState("ALL");
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showFinancials, setShowFinancials] = useState(false);

  const name = session?.user?.name?.split(" ")[0] || "Seller";

  useEffect(() => {
    Promise.all([
      fetch("/api/seller/analytics").then(r => r.json()),
      fetch("/api/seller/wallet").then(r => r.json()),
      fetch("/api/seller/ad-spend").then(r => r.json()),
      fetch("/api/seller/ndr").then(r => r.json()),
    ]).then(([a, w, ads, ndr]) => {
      setAnalytics(a);
      setWallet(w);
      setAdSpend(ads.total ?? 0);
      setAdRevenue(ads.last30DaysRevenue ?? 0);
      setMetaConnected(ads.metaConnected ?? false);
      setOpenNdrs(ndr.pending?.length ?? 0);
      setLoading(false);
    });
    fetch("/api/seller/orders?status=NEW&limit=1").then(r => r.json()).then(d => {
      setNewOrdersCount(d.total ?? 0);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setOrdersLoading(true);
    const params = new URLSearchParams({ limit: "10" });
    if (orderFilter !== "ALL") params.set("status", orderFilter);
    fetch(`/api/seller/orders?${params}`).then(r => r.json()).then(o => {
      setRecentOrders(o.orders?.slice(0, 10) || []);
      setOrdersLoading(false);
    });
  }, [orderFilter]);

  const chartData = analytics?.trend?.slice(chartDays > 0 ? -chartDays : undefined).map(d => ({
    date: new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    Orders: d.total,
    Delivered: d.delivered,
    RTO: d.rto,
  })) ?? [];

  const deliveryRate = analytics?.deliveryRate ?? 0;
  const rtoRate      = analytics?.rtoRate ?? 0;

  const todayData       = analytics?.trend?.at(-1);
  const yesterdayData   = analytics?.trend?.at(-2);
  const todayOrders     = todayData?.total ?? 0;
  const yesterdayOrders = yesterdayData?.total ?? 0;
  const todayDelta      = todayOrders - yesterdayOrders;
  const avgOrderValue   = analytics ? analytics.totalRevenue / Math.max(analytics.totalOrders, 1) : 0;
  const todayRevEst     = Math.round(todayOrders * avgOrderValue);

  const last7    = analytics?.trend?.slice(-7)    ?? [];
  const prior7   = analytics?.trend?.slice(-14, -7) ?? [];
  const last7Total  = last7.reduce((s, d) => s + d.total, 0);
  const prior7Total = prior7.reduce((s, d) => s + d.total, 0);
  const weekOverWeek = prior7Total > 0
    ? Math.round(((last7Total - prior7Total) / prior7Total) * 100) : 0;

  const bestDay = analytics?.trend?.reduce<typeof analytics.trend[0] | null>(
    (best, d) => (d.total > (best?.total ?? 0) ? d : best), null
  );
  const bestDayLabel = bestDay
    ? new Date(bestDay.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
    : null;

  const deliverySparkline = analytics?.trend?.slice(-7).map(d =>
    d.total > 0 ? (d.delivered / d.total) * 100 : 0) ?? [];
  const rtoSparkline = analytics?.trend?.slice(-7).map(d =>
    d.total > 0 ? (d.rto / d.total) * 100 : 0) ?? [];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>

      {/* ── Hero — light smoke/blue, not dark ─────────────── */}
      <div className="px-4 md:px-8 pt-8 pb-8"
        style={{ background: "linear-gradient(135deg, #eef2ff 0%, #f8faff 100%)", borderBottom: "1px solid #e0e7ff" }}>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-medium mb-1" style={{ color: "#6366F1" }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="text-3xl font-bold mb-1" style={{ color: "#1e1b4b" }}>
              {getGreeting()}, {name}! 👋
            </h1>
            <p className="text-sm" style={{ color: "#6B7280" }}>
              Here&apos;s a quick look at your store today
            </p>
          </div>

          {/* Store status chip */}
          {analytics?.store ? (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl self-start"
              style={{ background: "rgba(67,97,238,0.08)", border: "1px solid rgba(67,97,238,0.2)" }}>
              <Store className="w-4 h-4" style={{ color: "#4361EE" }} />
              <div>
                <p className="text-xs font-bold" style={{ color: "#4361EE" }}>
                  {analytics.store.storeName || analytics.store.storeUrl.replace(".myshopify.com", "")}
                </p>
                <p className="text-[10px]" style={{ color: "#818CF8" }}>Shopify Connected</p>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            </div>
          ) : (
            <Link href="/seller/shopify" className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl self-start"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <AlertTriangle className="w-4 h-4" style={{ color: "#EF4444" }} />
              <p className="text-xs font-semibold" style={{ color: "#EF4444" }}>Connect Shopify →</p>
            </Link>
          )}
        </div>

        {/* 3 Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl animate-pulse bg-white/70" />
            ))
          ) : (
            <>
              {/* Total Orders */}
              <div className="bg-white rounded-2xl px-6 py-5" style={{ boxShadow: "0 1px 12px rgba(67,97,238,0.08)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Total Orders</p>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(67,97,238,0.1)" }}>
                    <ShoppingCart className="w-4 h-4" style={{ color: "#4361EE" }} />
                  </div>
                </div>
                <p className="text-3xl font-black" style={{ color: "#1e1b4b" }}>{fmt(analytics?.totalOrders ?? 0)}</p>
                <p className="text-xs mt-1.5" style={{ color: todayDelta >= 0 ? "#4361EE" : "#EF4444" }}>
                  {todayOrders} today · {todayDelta >= 0 ? "▲" : "▼"}{Math.abs(todayDelta)} vs yesterday
                </p>
              </div>

              {/* Total Revenue */}
              <div className="bg-white rounded-2xl px-6 py-5" style={{ boxShadow: "0 1px 12px rgba(67,97,238,0.08)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Total Revenue</p>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(67,97,238,0.1)" }}>
                    <IndianRupee className="w-4 h-4" style={{ color: "#4361EE" }} />
                  </div>
                </div>
                <p className="text-3xl font-black" style={{ color: "#1e1b4b" }}>₹{fmt(analytics?.totalRevenue ?? 0)}</p>
                <p className="text-xs mt-1.5" style={{ color: "#9CA3AF" }}>
                  {todayOrders > 0 && avgOrderValue > 0 ? `~₹${fmt(todayRevEst)} today` : `₹${fmt(wallet?.totalRemittance ?? 0)} remitted`}
                </p>
              </div>

              {/* Delivery Rate */}
              <div className="bg-white rounded-2xl px-6 py-5" style={{ boxShadow: "0 1px 12px rgba(67,97,238,0.08)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Delivery Rate</p>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: deliveryRate >= 70 ? "rgba(67,97,238,0.1)" : "#FEF2F2" }}>
                    <CheckCircle2 className="w-4 h-4"
                      style={{ color: deliveryRate >= 70 ? "#4361EE" : "#EF4444" }} />
                  </div>
                </div>
                <p className="text-3xl font-black" style={{ color: deliveryRate >= 70 ? "#1e1b4b" : "#EF4444" }}>
                  {deliveryRate.toFixed(1)}%
                </p>
                <p className="text-xs mt-1.5" style={{ color: "#9CA3AF" }}>
                  {analytics?.deliveredCount ?? 0} delivered · RTO {rtoRate.toFixed(1)}%
                </p>
              </div>
            </>
          )}
        </div>

        {/* Today strip */}
        {!loading && analytics && analytics.totalOrders > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-4">
            {Math.abs(weekOverWeek) > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: "rgba(67,97,238,0.08)", color: "#4361EE" }}>
                📈 This week: {weekOverWeek >= 0 ? "▲" : "▼"}{Math.abs(weekOverWeek)}% vs last week
              </span>
            )}
            {bestDayLabel && bestDay && bestDay.total > 1 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: "rgba(67,97,238,0.08)", color: "#4361EE" }}>
                🏆 Best: {bestDayLabel} ({bestDay.total} orders)
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="px-4 md:px-8 py-6 space-y-4">

        {/* Alert Banners — only when relevant */}
        {!loading && openNdrs > 0 && (
          <div className="flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
            style={{ background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.3)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(239,68,68,0.15)" }}>
                <AlertTriangle className="w-4.5 h-4.5" style={{ color: "#EF4444" }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#991B1B" }}>
                  {openNdrs} NDR{openNdrs > 1 ? "s" : ""} need action
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#EF4444" }}>
                  Unresolved NDRs can convert to RTO
                </p>
              </div>
            </div>
            <Link href="/seller/ndr"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap"
              style={{ background: "rgba(239,68,68,0.15)", color: "#DC2626" }}>
              Resolve <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {!loading && newOrdersCount > 0 && (
          <div className="flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
            style={{ background: "rgba(67,97,238,0.06)", border: "1px solid rgba(67,97,238,0.2)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse"
                style={{ background: "rgba(67,97,238,0.15)" }}>
                <ShoppingCart className="w-4 h-4" style={{ color: "#4361EE" }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#1e1b4b" }}>
                  {newOrdersCount} new order{newOrdersCount > 1 ? "s" : ""} waiting
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#6366F1" }}>Confirm to trigger fulfillment</p>
              </div>
            </div>
            <Link href="/seller/orders"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap"
              style={{ background: "rgba(67,97,238,0.15)", color: "#4361EE" }}>
              View <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {!loading && wallet && wallet.balance > 0 && (
          <div className="flex items-center justify-between gap-4 rounded-2xl px-5 py-4"
            style={{ background: "rgba(67,97,238,0.06)", border: "1px solid rgba(67,97,238,0.2)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(67,97,238,0.15)" }}>
                <Wallet className="w-4 h-4" style={{ color: "#4361EE" }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "#1e1b4b" }}>
                  ₹{fmt(wallet.balance)} wallet balance
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#6366F1" }}>Available for withdrawal</p>
              </div>
            </div>
            <Link href="/seller/wallet"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap"
              style={{ background: "rgba(67,97,238,0.15)", color: "#4361EE" }}>
              View Wallet <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Orders",     href: "/seller/orders",          icon: ShoppingCart },
            { label: "Import",     href: "/seller/orders?import=1", icon: Upload },
            { label: "Products",   href: "/seller/catalog",         icon: Package },
            { label: "Deliveries", href: "/seller/deliveries",      icon: Truck },
            { label: "Wallet",     href: "/seller/wallet",          icon: Wallet },
            { label: "Store",      href: "/seller/shopify",         icon: Store },
          ].map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.href} href={a.href}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-600)" }}>
                <Icon className="w-3.5 h-3.5" style={{ color: "#4361EE" }} />
                {a.label}
              </Link>
            );
          })}
        </div>

        {/* Recent Orders — always visible */}
        <div className="card overflow-hidden">
          <div className="px-5 pt-4 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(67,97,238,0.1)" }}>
                <ShoppingCart className="w-4 h-4" style={{ color: "#4361EE" }} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Recent Orders</h2>
            </div>
            <Link href="/seller/orders"
              className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ color: "#4361EE", background: "rgba(67,97,238,0.08)", border: "1px solid rgba(67,97,238,0.2)" }}>
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="px-5 pb-3 flex items-center gap-1.5 flex-wrap" style={{ borderBottom: "1px solid var(--border)" }}>
            {(["ALL", "NEW", "PROCESSING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "RTO", "CANCELLED"]).map((s) => {
              const cfg = STATUS_CONFIG[s];
              const isActive = orderFilter === s;
              return (
                <button key={s} onClick={() => setOrderFilter(s)}
                  className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                  style={isActive
                    ? { background: cfg ? cfg.color : "#4361EE", color: "#fff" }
                    : { background: cfg ? cfg.bg : "var(--bg-muted)", color: cfg ? cfg.color : "var(--text-500)" }
                  }>
                  {s === "ALL" ? "All" : cfg?.label ?? s}
                </button>
              );
            })}
          </div>

          {loading || ordersLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: "var(--bg-muted)" }} />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2">
              <ShoppingCart className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text-400)" }}>
                {orderFilter === "ALL" ? "No orders yet" : `No ${STATUS_CONFIG[orderFilter]?.label ?? orderFilter} orders`}
              </p>
              {orderFilter === "ALL" && (
                <Link href="/seller/shopify"
                  className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white"
                  style={{ background: "#4361EE" }}>
                  <Store className="w-4 h-4" /> Connect Store
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {recentOrders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.NEW;
                return (
                  <div key={order.id} className="px-5 py-3 flex items-center gap-4 transition-colors"
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-muted)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: cfg.bg }}>
                      <ShoppingCart className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-900)" }}>
                        #{order.externalOrderId}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--text-400)" }}>{order.customerName}</p>
                    </div>
                    <span className="text-sm font-bold" style={{ color: "var(--text-900)" }}>₹{fmt(order.totalAmount)}</span>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
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

        {/* Analytics — collapsible */}
        <div className="card overflow-hidden">
          <SectionToggle
            label="Analytics & Charts"
            icon={TrendingUp}
            open={showAnalytics}
            onToggle={() => setShowAnalytics(v => !v)}
            count={`Last ${chartDays}d`}
          />
          {showAnalytics && (
            <div className="p-5 space-y-5">

              {/* Day selector */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-400)" }}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#4361EE" }} /> Orders
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#059669" }} /> Delivered
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#EF4444" }} /> RTO
                  </span>
                </div>
                <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: "var(--bg-muted)" }}>
                  {[7, 14, 30, 60].map((d) => (
                    <button key={d} onClick={() => setChartDays(d)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md transition-all"
                      style={chartDays === d
                        ? { background: "var(--bg-card)", color: "var(--text-900)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                        : { color: "var(--text-400)" }}>
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart */}
              {chartData.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-sm" style={{ color: "var(--text-400)" }}>
                  No data yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-400)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--text-400)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="Orders" stroke="#4361EE" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Delivered" stroke="#059669" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="RTO" stroke="#EF4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {/* Delivery breakdown + 7-day side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-400)" }}>Delivery Breakdown</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Delivered",  count: analytics?.deliveredCount ?? 0, color: "#059669" },
                      { label: "In Transit", count: analytics?.inTransitCount ?? 0, color: "#4361EE" },
                      { label: "RTO",        count: analytics?.rtoCount ?? 0,       color: "#EF4444" },
                      { label: "Cancelled",  count: analytics?.cancelledCount ?? 0, color: "#9CA3AF" },
                    ].map((item) => {
                      const total = analytics?.totalOrders || 1;
                      const pct = Math.round((item.count / total) * 100);
                      return (
                        <div key={item.label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium" style={{ color: "var(--text-600)" }}>{item.label}</span>
                            <span className="text-xs font-bold" style={{ color: "var(--text-900)" }}>{item.count} <span style={{ color: "var(--text-400)" }}>({pct}%)</span></span>
                          </div>
                          <div className="w-full h-1.5 rounded-full" style={{ background: "var(--bg-muted)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: item.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {last7.length >= 3 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-400)" }}>Last 7 Days</h3>
                    <div className="space-y-2">
                      {[
                        { label: "Orders",    value: last7Total,                                  icon: ShoppingCart, color: "#4361EE", delta: weekOverWeek },
                        { label: "Delivered", value: last7.reduce((s, d) => s + d.delivered, 0), icon: CheckCircle2, color: "#059669", delta: null },
                        { label: "RTO",       value: last7.reduce((s, d) => s + d.rto, 0),       icon: TrendingDown, color: "#EF4444", delta: null },
                        { label: "Avg/day",   value: +(last7Total / 7).toFixed(1),                icon: Clock,        color: "#6366F1", delta: null },
                      ].map((row) => {
                        const Icon = row.icon;
                        return (
                          <div key={row.label} className="flex items-center justify-between py-1.5"
                            style={{ borderBottom: "1px solid var(--border)" }}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-3.5 h-3.5" style={{ color: row.color }} />
                              <span className="text-xs" style={{ color: "var(--text-600)" }}>{row.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold" style={{ color: "var(--text-900)" }}>{row.value}</span>
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
                      {bestDayLabel && bestDay && (
                        <p className="text-[10px] pt-1" style={{ color: "var(--text-400)" }}>
                          🏆 Best day: {bestDayLabel} ({bestDay.total} orders)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Unused sparkline variables suppressed */}
              <div style={{ display: "none" }}>{deliverySparkline.length}{rtoSparkline.length}</div>
            </div>
          )}
        </div>

        {/* Financials — collapsible */}
        {analytics?.earnings && (
          <div className="card overflow-hidden">
            <SectionToggle
              label="Financials & P&L"
              icon={Wallet}
              open={showFinancials}
              onToggle={() => setShowFinancials(v => !v)}
              count={metaConnected && adSpend > 0 ? `${(adRevenue / adSpend).toFixed(2)}x ROAS` : undefined}
            />
            {showFinancials && (() => {
              const e = analytics.earnings;
              const grossProfit = e.totalGMV - e.totalProductCost - e.totalShipping - e.totalFees - e.totalRtoCharge;
              const netProfit   = grossProfit - adSpend;
              const margin      = e.totalGMV > 0 ? (netProfit / e.totalGMV) * 100 : 0;
              const isProfit    = netProfit >= 0;

              const rows = [
                { label: "Revenue (GMV)",    value: e.totalGMV,         color: "#4361EE", sign: "+" },
                { label: "Product Cost",     value: e.totalProductCost, color: "#EF4444", sign: "−" },
                { label: "Shipping",         value: e.totalShipping,    color: "#EF4444", sign: "−" },
                { label: "Platform Fee",     value: e.totalFees,        color: "#EF4444", sign: "−" },
                { label: "RTO Losses",       value: e.totalRtoCharge,   color: "#EF4444", sign: "−" },
                { label: "Ad Spend (30d)",   value: adSpend,            color: "#7C3AED", sign: "−" },
              ];

              return (
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-400)" }}>Net Profit</p>
                      <p className="text-2xl font-black mt-0.5" style={{ color: isProfit ? "#4361EE" : "#EF4444" }}>
                        {isProfit ? "+" : "−"}₹{fmt(Math.abs(netProfit))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: "var(--text-400)" }}>Net margin</p>
                      <p className="text-lg font-bold" style={{ color: isProfit ? "#4361EE" : "#EF4444" }}>
                        {margin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="space-y-0">
                    {rows.map((r) => (
                      <div key={r.label} className="flex items-center justify-between py-2.5"
                        style={{ borderBottom: "1px solid var(--border)" }}>
                        <p className="text-xs font-medium" style={{ color: "var(--text-600)" }}>{r.label}</p>
                        <p className="text-xs font-bold" style={{ color: r.color }}>{r.sign}₹{fmt(r.value)}</p>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-3">
                      <p className="text-sm font-black" style={{ color: "var(--text-900)" }}>Net Profit</p>
                      <p className="text-sm font-black" style={{ color: isProfit ? "#4361EE" : "#EF4444" }}>
                        {isProfit ? "+" : "−"}₹{fmt(Math.abs(netProfit))} ({margin.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                  {metaConnected && (
                    <div className="mt-4 flex items-center justify-between px-4 py-3 rounded-xl"
                      style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
                      <div className="flex items-center gap-2">
                        <Megaphone className="w-4 h-4" style={{ color: "#7C3AED" }} />
                        <span className="text-xs font-medium" style={{ color: "var(--text-600)" }}>Meta Ads (30d)</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold" style={{ color: "#7C3AED" }}>₹{fmt(adSpend)} spent</p>
                        {adSpend > 0 && <p className="text-[10px]" style={{ color: "var(--text-400)" }}>{(adRevenue / adSpend).toFixed(2)}x ROAS</p>}
                      </div>
                    </div>
                  )}
                  {!metaConnected && (
                    <Link href="/seller/profile?tab=integrations"
                      className="mt-4 flex items-center justify-between px-4 py-3 rounded-xl"
                      style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
                      <div className="flex items-center gap-2">
                        <Megaphone className="w-4 h-4" style={{ color: "#7C3AED" }} />
                        <span className="text-xs font-medium" style={{ color: "#7C3AED" }}>Connect Meta Ads to track ROAS</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5" style={{ color: "#7C3AED" }} />
                    </Link>
                  )}
                </div>
              );
            })()}
          </div>
        )}

      </div>
    </div>
  );
}

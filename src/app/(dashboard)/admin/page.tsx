import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Package, Users, ShoppingCart, ListChecks,
  ArrowRight, Store, IndianRupee, AlertTriangle,
  BadgeIndianRupee, TrendingUp, MoreHorizontal,
  Zap, CheckCircle2,
} from "lucide-react";
import { AdminOrderTrendChart } from "@/components/admin/order-trend-chart";

function fmt(n: number) {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  APPROVED:    { bg: "rgba(52,199,89,0.15)",   color: "#34C759" },
  PENDING:     { bg: "rgba(245,158,11,0.15)",  color: "#F59E0B" },
  REJECTED:    { bg: "rgba(239,68,68,0.15)",   color: "#EF4444" },
  LISTED:      { bg: "rgba(52,199,89,0.15)",   color: "#34C759" },
  FAILED:      { bg: "rgba(239,68,68,0.15)",   color: "#EF4444" },
  IN_PROGRESS: { bg: "rgba(67,97,238,0.15)",   color: "#4361EE" },
};

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const [
    totalOrders, deliveredOrders, rtoOrders, activeOrders, cancelledOrders, newToday,
    totalSellers, activeSellers, totalSuppliers,
    pendingProducts, pendingListings,
    gmvResult,
    pendingNdrs, unremittedOrders, unassignedOrders,
    pendingPayablesAgg,
    recentProducts, recentListings,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.count({ where: { status: "RTO" } }),
    prisma.order.count({ where: { status: { in: ["PROCESSING", "SHIPPED", "IN_TRANSIT"] } } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.user.count({ where: { role: "SELLER", accountStatus: "ACTIVE" } }),
    prisma.user.count({ where: { role: "SUPPLIER" } }),
    prisma.product.count({ where: { status: "PENDING" } }),
    prisma.listingRequest.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({ _sum: { totalAmount: true } }),
    prisma.order.count({ where: { ndrStatus: { not: null }, ndrActionTaken: null } }),
    prisma.order.count({ where: { remittedAt: null, status: { in: ["DELIVERED", "RTO"] } } }),
    prisma.order.count({ where: { supplierId: null, status: { notIn: ["DELIVERED", "CANCELLED", "RTO"] } } }),
    prisma.supplierPayment.aggregate({ where: { status: "PENDING" }, _sum: { amount: true }, _count: { id: true } }),
    prisma.product.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { supplier: { select: { name: true } } } }),
    prisma.listingRequest.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { seller: { select: { name: true, brandName: true } }, product: { select: { name: true } } } }),
  ]);

  const gmv = gmvResult._sum.totalAmount ?? 0;
  const pendingPayablesAmount = pendingPayablesAgg._sum.amount ?? 0;
  const pendingPayablesCount  = pendingPayablesAgg._count.id ?? 0;
  const firstName = session.user.name?.split(" ")[0] ?? "there";

  const alerts = [
    pendingNdrs > 0          && { label: "NDRs pending",       value: pendingNdrs,                href: "/admin/ndr",              color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
    unassignedOrders > 0     && { label: "Unassigned orders",  value: unassignedOrders,           href: "/admin/orders",           color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
    unremittedOrders > 0     && { label: "Unremitted orders",  value: unremittedOrders,           href: "/admin/remittance",       color: "#4361EE", bg: "rgba(67,97,238,0.1)" },
    pendingPayablesCount > 0 && { label: "Supplier payables",  value: fmt(pendingPayablesAmount), href: "/admin/supplier-payables",color: "#34C759", bg: "rgba(52,199,89,0.1)" },
  ].filter(Boolean) as { label: string; value: string | number; href: string; color: string; bg: string }[];

  return (
    <div className="flex-1 overflow-auto" style={{ background: "var(--bg-page)" }}>
      <div className="p-6 md:p-8">

        {/* ── Heading ── */}
        <div className="mb-6">
          <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>
            Good {greeting()} — {todayStr}
          </p>
          <h1 style={{ fontSize: "2.6rem", lineHeight: 1.1, fontWeight: 900, color: "#fff" }}>
            Make it{" "}
            <span style={{
              background: "linear-gradient(90deg, #4361EE, #7C3AED)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Simple
            </span>
            , {firstName}.
          </h1>
        </div>

        {/* ── Filter pills ── */}
        <div className="flex items-center gap-2 mb-7 flex-wrap">
          {[
            { label: "Overview",  active: true },
            { label: "Today",     href: "/admin/orders?period=today" },
            { label: "Orders",    href: "/admin/orders" },
            { label: "Pending",   href: "/admin/orders?status=PROCESSING" },
            { label: "Delivered", href: "/admin/orders?status=DELIVERED" },
            { label: "Finance",   href: "/admin/finance" },
          ].map(({ label, href, active }) =>
            href ? (
              <Link key={label} href={href}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.45)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}>
                {label}
              </Link>
            ) : (
              <span key={label} className="px-4 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: active ? "var(--accent)" : "rgba(255,255,255,0.06)",
                  color: active ? "#fff" : "rgba(255,255,255,0.45)",
                  border: "1px solid transparent",
                  boxShadow: active ? "0 0 20px rgba(67,97,238,0.3)" : "none",
                }}>
                {label}
              </span>
            )
          )}
        </div>

        {/* ── Main two-column layout ── */}
        <div className="flex gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Featured GMV card */}
            <div className="rounded-2xl p-6 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #111d40 0%, #0c1530 60%, #080d1c 100%)",
                border: "1px solid rgba(67,97,238,0.25)",
                boxShadow: "0 0 50px rgba(67,97,238,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}>
              {/* Glow orb */}
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(67,97,238,0.35) 0%, transparent 70%)" }} />
              <div className="absolute bottom-0 left-16 w-24 h-24 rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)" }} />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Platform GMV
                    </p>
                    <p className="text-4xl font-black text-white">{fmt(gmv)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background: "rgba(67,97,238,0.2)", color: "#7C9FFF", border: "1px solid rgba(67,97,238,0.3)" }}>
                    <Zap className="w-3 h-3" />
                    Live
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-2xl font-bold text-white">{totalOrders}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Total Orders</p>
                  </div>
                  <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.1)" }} />
                  <div>
                    <p className="text-2xl font-bold" style={{ color: "#4361EE" }}>{newToday}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>New Today</p>
                  </div>
                  <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.1)" }} />
                  <div>
                    <p className="text-2xl font-bold" style={{ color: "#34C759" }}>{deliveredOrders}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Delivered</p>
                  </div>
                  <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.1)" }} />
                  <div>
                    <p className="text-2xl font-bold" style={{ color: "#F59E0B" }}>{activeOrders}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>In Transit</p>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI mini row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Active Sellers",  value: activeSellers,    sub: `${totalSellers} total`,           color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", icon: Store },
                { label: "Suppliers",       value: totalSuppliers,   sub: "connected",                      color: "#4361EE", bg: "rgba(67,97,238,0.12)",  icon: IndianRupee },
                { label: "Pending Review",  value: pendingProducts + pendingListings, sub: `${pendingProducts}p · ${pendingListings}l`, color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: Package },
              ].map(({ label, value, sub, color, bg, icon: Icon }) => (
                <div key={label} className="rounded-2xl p-4"
                  style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Order trend chart */}
            <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-white">Order Trend</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Last 30 days</p>
                </div>
                <button style={{ color: "rgba(255,255,255,0.3)" }}><MoreHorizontal className="w-4 h-4" /></button>
              </div>
              <AdminOrderTrendChart />
            </div>

            {/* Recent submissions — feed cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Recent Submissions</p>
                <Link href="/admin/products" className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--accent)" }}>
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {recentProducts.length === 0 ? (
                <div className="rounded-2xl p-6 text-center" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>No products yet</p>
                </div>
              ) : recentProducts.map((p) => {
                const timeAgo = (() => {
                  const diff = Date.now() - new Date(p.createdAt).getTime();
                  const h = Math.floor(diff / 3600000);
                  if (h < 1) return "Just now";
                  if (h < 24) return `${h}h ago`;
                  return `${Math.floor(h / 24)}d ago`;
                })();
                const s = STATUS_STYLE[p.status];
                return (
                  <Link key={p.id} href={`/admin/products`}
                    className="block rounded-2xl p-4 transition-all group"
                    style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="flex items-start justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wide"
                        style={{ background: s?.bg ?? "rgba(255,255,255,0.08)", color: s?.color ?? "#fff" }}>
                        {p.status}
                      </span>
                      <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>{timeAgo}</span>
                    </div>
                    <p className="text-sm font-semibold text-white mb-0.5 truncate">{p.name}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Submitted by {p.supplier.name}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                          style={{ background: "var(--accent)" }}>
                          {(p.supplier.name ?? "?")[0]?.toUpperCase()}
                        </div>
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{p.supplier.name}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "rgba(255,255,255,0.4)" }} />
                    </div>
                  </Link>
                );
              })}
            </div>

          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="w-72 flex-shrink-0 space-y-4">

            {/* Order status breakdown */}
            <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-white">Order Status</p>
                <span className="text-[10px] font-medium px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)" }}>
                  All time
                </span>
              </div>
              <div className="space-y-3.5">
                {[
                  { label: "Delivered",  value: deliveredOrders, color: "#34C759", pct: totalOrders ? Math.round(deliveredOrders / totalOrders * 100) : 0 },
                  { label: "In Transit", value: activeOrders,    color: "#4361EE", pct: totalOrders ? Math.round(activeOrders / totalOrders * 100) : 0 },
                  { label: "RTO",        value: rtoOrders,       color: "#F59E0B", pct: totalOrders ? Math.round(rtoOrders / totalOrders * 100) : 0 },
                  { label: "Cancelled",  value: cancelledOrders, color: "#EF4444", pct: totalOrders ? Math.round(cancelledOrders / totalOrders * 100) : 0 },
                ].map(({ label, value, color, pct }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{value}</span>
                        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending alerts */}
            {alerts.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-white">Needs Attention</p>
                  <AlertTriangle className="w-4 h-4" style={{ color: "#F59E0B" }} />
                </div>
                <div className="space-y-2">
                  {alerts.map((a) => (
                    <Link key={a.href} href={a.href}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
                      style={{ background: a.bg, border: `1px solid ${a.color}20` }}>
                      <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{a.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold" style={{ color: a.color }}>{a.value}</span>
                        <ArrowRight className="w-3 h-3" style={{ color: a.color }} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p className="text-sm font-semibold text-white mb-4">Quick Actions</p>
              <div className="space-y-1.5">
                {[
                  { label: "Manage Orders",    href: "/admin/orders",   icon: ShoppingCart, color: "#4361EE" },
                  { label: "Review Products",  href: "/admin/products", icon: Package,      color: "#F59E0B" },
                  { label: "Listing Requests", href: "/admin/listings", icon: ListChecks,   color: "#EF4444" },
                  { label: "Manage Sellers",   href: "/admin/sellers",  icon: Users,        color: "#8B5CF6" },
                  { label: "Finance OS",       href: "/admin/finance",  icon: TrendingUp,   color: "#4361EE" },
                ].map(({ label, href, icon: Icon, color }) => (
                  <Link key={href} href={href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl group"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}18` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <span className="flex-1 text-xs font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "rgba(255,255,255,0.35)" }} />
                  </Link>
                ))}
              </div>
            </div>

            {/* Listing requests */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-sm font-semibold text-white">Listing Requests</p>
                <Link href="/admin/listings" className="text-xs font-medium" style={{ color: "var(--accent)" }}>See all</Link>
              </div>
              {recentListings.length === 0 ? (
                <p className="p-4 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>No requests</p>
              ) : recentListings.map((l, i) => (
                <div key={l.id} className="px-4 py-3 flex items-center justify-between"
                  style={{ borderBottom: i < recentListings.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-white truncate">{l.product.name}</p>
                    <p className="text-[10px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.3)" }}>
                      {l.seller.brandName || l.seller.name} → {l.platform}
                    </p>
                  </div>
                  <span className="ml-2 flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: STATUS_STYLE[l.status]?.bg ?? "rgba(255,255,255,0.1)", color: STATUS_STYLE[l.status]?.color ?? "#fff" }}>
                    {l.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Supplier info */}
            <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(52,199,89,0.12)" }}>
                  <CheckCircle2 className="w-4 h-4" style={{ color: "#34C759" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Suppliers</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{totalSuppliers} connected</p>
                </div>
              </div>
              {pendingPayablesCount > 0 && (
                <Link href="/admin/supplier-payables"
                  className="flex items-center justify-between px-3 py-2 rounded-xl mt-2"
                  style={{ background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.15)" }}>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>{pendingPayablesCount} payables due</span>
                  <span className="text-xs font-bold" style={{ color: "#34C759" }}>{fmt(pendingPayablesAmount)}</span>
                </Link>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

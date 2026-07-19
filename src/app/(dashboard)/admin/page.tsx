import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Package, Users, ShoppingCart, ListChecks,
  CheckCircle, ArrowRight, Truck, RotateCcw,
  Store, IndianRupee, AlertTriangle, UserX,
  BadgeIndianRupee, Wallet, Zap, TrendingUp,
  MoreHorizontal, Circle,
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
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  APPROVED:    { bg: "rgba(0,198,122,0.15)",  color: "#00C67A" },
  PENDING:     { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" },
  REJECTED:    { bg: "rgba(239,68,68,0.15)",  color: "#EF4444" },
  LISTED:      { bg: "rgba(0,198,122,0.15)",  color: "#00C67A" },
  FAILED:      { bg: "rgba(239,68,68,0.15)",  color: "#EF4444" },
  IN_PROGRESS: { bg: "rgba(79,122,255,0.15)", color: "#4F7AFF" },
};

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
    pendingNdrs > 0          && { label: "NDRs pending",       value: pendingNdrs,                          href: "/admin/ndr",               color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
    unassignedOrders > 0     && { label: "Unassigned orders",  value: unassignedOrders,                     href: "/admin/orders",             color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
    unremittedOrders > 0     && { label: "Unremitted orders",  value: unremittedOrders,                     href: "/admin/remittance",         color: "#4F7AFF", bg: "rgba(79,122,255,0.12)" },
    pendingPayablesCount > 0 && { label: "Supplier payables",  value: fmt(pendingPayablesAmount),           href: "/admin/supplier-payables",  color: "#00C67A", bg: "rgba(0,198,122,0.12)" },
  ].filter(Boolean) as { label: string; value: string | number; href: string; color: string; bg: string }[];

  return (
    <div className="flex-1 overflow-auto" style={{ background: "var(--bg-page)" }}>
      <div className="p-6 md:p-8">

        {/* ── Heading ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">
            {greeting()}, <span style={{ color: "#4F7AFF" }}>{firstName}</span> 👋
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            Here's your platform overview for today.
          </p>
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex gap-6">

          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* KPI row */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Platform GMV",  value: fmt(gmv),         sub: `${totalOrders} orders total`,      color: "#00C67A", bg: "rgba(0,198,122,0.12)",  icon: IndianRupee },
                { label: "New Today",     value: newToday,          sub: `${activeOrders} in transit`,       color: "#4F7AFF", bg: "rgba(79,122,255,0.12)",  icon: ShoppingCart },
                { label: "Active Sellers",value: activeSellers,     sub: `${totalSellers} total`,            color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", icon: Store },
                { label: "Pending Review",value: pendingProducts + pendingListings, sub: `${pendingProducts} products · ${pendingListings} listings`, color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: Package },
              ].map(({ label, value, sub, color, bg, icon: Icon }) => (
                <div key={label} className="rounded-2xl p-5"
                  style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>{sub}</p>
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

            {/* Recent submissions */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-sm font-semibold text-white">Recent Submissions</p>
                <Link href="/admin/products" className="text-xs font-medium flex items-center gap-1" style={{ color: "#4F7AFF" }}>
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              {recentProducts.length === 0 ? (
                <p className="p-5 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No products yet</p>
              ) : recentProducts.map((p, i) => (
                <div key={p.id} className="px-5 py-3.5 flex items-center justify-between transition-colors"
                  style={{ borderBottom: i < recentProducts.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.06)" }}>
                      <Package className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>by {p.supplier.name}</p>
                    </div>
                  </div>
                  <span className="ml-3 flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: STATUS_STYLE[p.status]?.bg ?? "rgba(255,255,255,0.1)", color: STATUS_STYLE[p.status]?.color ?? "#fff" }}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>

          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="w-72 flex-shrink-0 space-y-4">

            {/* Order status breakdown */}
            <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-white">Order Status</p>
                <button style={{ color: "rgba(255,255,255,0.3)" }}><MoreHorizontal className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Delivered",   value: deliveredOrders, color: "#00C67A", pct: totalOrders ? Math.round(deliveredOrders / totalOrders * 100) : 0 },
                  { label: "In Transit",  value: activeOrders,    color: "#4F7AFF", pct: totalOrders ? Math.round(activeOrders / totalOrders * 100) : 0 },
                  { label: "RTO",         value: rtoOrders,       color: "#F59E0B", pct: totalOrders ? Math.round(rtoOrders / totalOrders * 100) : 0 },
                  { label: "Cancelled",   value: cancelledOrders, color: "#EF4444", pct: totalOrders ? Math.round(cancelledOrders / totalOrders * 100) : 0 },
                ].map(({ label, value, color, pct }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
                      </div>
                      <span className="text-xs font-semibold text-white">{value}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
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
                      style={{ background: a.bg, border: `1px solid ${a.color}25` }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.8"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}>
                      <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{a.label}</span>
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
              <div className="space-y-2">
                {[
                  { label: "Manage Orders",    href: "/admin/orders",   icon: ShoppingCart, color: "#4F7AFF" },
                  { label: "Review Products",  href: "/admin/products", icon: Package,      color: "#F59E0B" },
                  { label: "Listing Requests", href: "/admin/listings", icon: ListChecks,   color: "#EF4444" },
                  { label: "Manage Sellers",   href: "/admin/sellers",  icon: Users,        color: "#8B5CF6" },
                  { label: "Finance OS",       href: "/admin/finance",  icon: TrendingUp,   color: "#00C67A" },
                ].map(({ label, href, icon: Icon, color }) => (
                  <Link key={href} href={href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}18` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <span className="flex-1 text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{label}</span>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "rgba(255,255,255,0.4)" }} />
                  </Link>
                ))}
              </div>
            </div>

            {/* Listing requests */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-sm font-semibold text-white">Listing Requests</p>
                <Link href="/admin/listings" className="text-xs font-medium" style={{ color: "#4F7AFF" }}>See all</Link>
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

          </div>
        </div>
      </div>
    </div>
  );
}

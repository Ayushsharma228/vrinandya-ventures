import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Package, Users, ShoppingCart, ListChecks, Clock,
  CheckCircle, ArrowRight, Truck, RotateCcw, AlertCircle,
  TrendingUp, Store, IndianRupee, Layers,
  AlertTriangle, UserX, BadgeIndianRupee, Wallet, Zap,
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

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalOrders, deliveredOrders, rtoOrders, activeOrders, cancelledOrders, newToday,
    totalSellers, activeSellers, totalSuppliers,
    pendingProducts, totalProducts,
    pendingListings,
    gmvResult,
    pendingNdrs,
    unremittedOrders,
    unassignedOrders,
    pendingPayablesAgg,
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
    prisma.product.count(),
    prisma.listingRequest.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({ _sum: { totalAmount: true } }),
    prisma.order.count({ where: { ndrStatus: { not: null }, ndrActionTaken: null } }),
    prisma.order.count({ where: { remittedAt: null, status: { in: ["DELIVERED", "RTO"] } } }),
    prisma.order.count({ where: { supplierId: null, status: { notIn: ["DELIVERED", "CANCELLED", "RTO"] } } }),
    prisma.supplierPayment.aggregate({ where: { status: "PENDING" }, _sum: { amount: true }, _count: { id: true } }),
  ]);

  const gmv = gmvResult._sum.totalAmount ?? 0;
  const pendingPayablesAmount = pendingPayablesAgg._sum.amount ?? 0;
  const pendingPayablesCount  = pendingPayablesAgg._count.id ?? 0;
  const totalAlerts = (pendingNdrs > 0 ? 1 : 0) + (unremittedOrders > 0 ? 1 : 0) + (unassignedOrders > 0 ? 1 : 0) + (pendingPayablesCount > 0 ? 1 : 0);

  const recentProducts = await prisma.product.findMany({
    take: 6, orderBy: { createdAt: "desc" },
    include: { supplier: { select: { name: true } } },
  });

  const recentListings = await prisma.listingRequest.findMany({
    take: 6, orderBy: { createdAt: "desc" },
    include: {
      seller: { select: { name: true, brandName: true } },
      product: { select: { name: true } },
    },
  });

  const firstName = session.user.name?.split(" ")[0] ?? "there";
  const dateStr = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>

      {/* ── Top header ── */}
      <div className="px-8 pt-8 pb-6 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>{dateStr}</p>
          <h1 className="text-3xl font-bold text-white">{greeting()}, {firstName} 👋</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Here's what's happening on your platform today.</p>
        </div>
        {totalAlerts > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#F59E0B" }}>
            <AlertTriangle className="w-4 h-4" />
            {totalAlerts} action{totalAlerts > 1 ? "s" : ""} needed
          </div>
        )}
      </div>

      <div className="px-8 pb-8 space-y-6">

        {/* ── KPI Tiles ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Platform GMV",
              value: fmt(gmv),
              sub: `${totalOrders} total orders`,
              icon: IndianRupee,
              color: "#00C67A",
              glow: "rgba(0,198,122,0.12)",
            },
            {
              label: "New Today",
              value: newToday,
              sub: `${activeOrders} in transit`,
              icon: ShoppingCart,
              color: "#4F7AFF",
              glow: "rgba(79,122,255,0.12)",
            },
            {
              label: "Active Sellers",
              value: activeSellers,
              sub: `${totalSellers} total · ${totalSuppliers} suppliers`,
              icon: Store,
              color: "#8B5CF6",
              glow: "rgba(139,92,246,0.12)",
            },
            {
              label: "Pending Reviews",
              value: pendingProducts + pendingListings,
              sub: `${pendingProducts} products · ${pendingListings} listings`,
              icon: Clock,
              color: "#F59E0B",
              glow: "rgba(245,158,11,0.12)",
            },
          ].map(({ label, value, sub, icon: Icon, color, glow }) => (
            <div key={label} className="rounded-2xl p-5 flex flex-col gap-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</p>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: glow }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Alerts ── */}
        {totalAlerts > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {pendingNdrs > 0 && (
              <Link href="/admin/ndr"
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all hover:scale-[1.01]"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(239,68,68,0.15)" }}>
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-red-400">{pendingNdrs}</p>
                  <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>NDRs pending</p>
                </div>
                <ArrowRight className="w-4 h-4 text-red-400 opacity-50 flex-shrink-0" />
              </Link>
            )}
            {unremittedOrders > 0 && (
              <Link href="/admin/remittance"
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all hover:scale-[1.01]"
                style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(249,115,22,0.15)" }}>
                  <Wallet className="w-4 h-4" style={{ color: "#F97316" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold" style={{ color: "#F97316" }}>{unremittedOrders}</p>
                  <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>Unremitted orders</p>
                </div>
                <ArrowRight className="w-4 h-4 opacity-50 flex-shrink-0" style={{ color: "#F97316" }} />
              </Link>
            )}
            {unassignedOrders > 0 && (
              <Link href="/admin/orders"
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all hover:scale-[1.01]"
                style={{ background: "rgba(79,122,255,0.08)", border: "1px solid rgba(79,122,255,0.2)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(79,122,255,0.15)" }}>
                  <UserX className="w-4 h-4" style={{ color: "#4F7AFF" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold" style={{ color: "#4F7AFF" }}>{unassignedOrders}</p>
                  <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>Unassigned orders</p>
                </div>
                <ArrowRight className="w-4 h-4 opacity-50 flex-shrink-0" style={{ color: "#4F7AFF" }} />
              </Link>
            )}
            {pendingPayablesCount > 0 && (
              <Link href="/admin/supplier-payables"
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all hover:scale-[1.01]"
                style={{ background: "rgba(0,198,122,0.08)", border: "1px solid rgba(0,198,122,0.2)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(0,198,122,0.15)" }}>
                  <BadgeIndianRupee className="w-4 h-4" style={{ color: "#00C67A" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold" style={{ color: "#00C67A" }}>{fmt(pendingPayablesAmount)}</p>
                  <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>Supplier payables</p>
                </div>
                <ArrowRight className="w-4 h-4 opacity-50 flex-shrink-0" style={{ color: "#00C67A" }} />
              </Link>
            )}
          </div>
        )}

        {/* ── Order breakdown + Chart ── */}
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: "Delivered",     value: deliveredOrders, color: "#00C67A",  bg: "rgba(0,198,122,0.12)" },
            { label: "In Transit",    value: activeOrders,    color: "#4F7AFF",  bg: "rgba(79,122,255,0.12)" },
            { label: "RTO",           value: rtoOrders,       color: "#F59E0B",  bg: "rgba(245,158,11,0.12)" },
            { label: "Cancelled",     value: cancelledOrders, color: "#EF4444",  bg: "rgba(239,68,68,0.12)" },
            { label: "New Today",     value: newToday,        color: "#8B5CF6",  bg: "rgba(139,92,246,0.12)" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="rounded-2xl p-4 text-center"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: bg }}>
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              </div>
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── Chart ── */}
        <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-white">Order Trend</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Daily orders over the last 30 days</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: "#4F7AFF" }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Orders</span>
            </div>
          </div>
          <AdminOrderTrendChart />
        </div>

        {/* ── Quick Actions ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4" style={{ color: "#4F7AFF" }} />
            <p className="text-sm font-semibold text-white">Quick Actions</p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Manage Orders",    sub: `${totalOrders} total`,      href: "/admin/orders",   color: "#4F7AFF",  bg: "rgba(79,122,255,0.12)",  icon: ShoppingCart },
              { label: "Review Products",  sub: `${pendingProducts} pending`, href: "/admin/products", color: "#F59E0B",  bg: "rgba(245,158,11,0.12)", icon: Package },
              { label: "Listing Requests", sub: `${pendingListings} pending`, href: "/admin/listings", color: "#EF4444",  bg: "rgba(239,68,68,0.12)",  icon: ListChecks },
              { label: "Manage Sellers",   sub: `${totalSellers} sellers`,    href: "/admin/sellers",  color: "#8B5CF6",  bg: "rgba(139,92,246,0.12)", icon: Users },
            ].map(({ label, sub, href, color, bg, icon: Icon }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-4 py-4 rounded-2xl transition-all hover:scale-[1.01] group"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{label}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</p>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }} />
              </Link>
            ))}
          </div>
        </div>

        {/* ── Recent Activity ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
                <p className="text-sm font-semibold text-white">Recent Submissions</p>
              </div>
              <Link href="/admin/products" className="flex items-center gap-1 text-xs font-medium" style={{ color: "#4F7AFF" }}>
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentProducts.length === 0 ? (
              <p className="p-5 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No products yet</p>
            ) : (
              <div>
                {recentProducts.map((p, i) => (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between"
                    style={{ borderBottom: i < recentProducts.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{p.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>by {p.supplier.name}</p>
                    </div>
                    <span className="ml-3 flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: p.status === "APPROVED" ? "rgba(0,198,122,0.15)" : p.status === "REJECTED" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                        color:      p.status === "APPROVED" ? "#00C67A" : p.status === "REJECTED" ? "#EF4444" : "#F59E0B",
                      }}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4" style={{ color: "rgba(255,255,255,0.3)" }} />
                <p className="text-sm font-semibold text-white">Listing Requests</p>
              </div>
              <Link href="/admin/listings" className="flex items-center gap-1 text-xs font-medium" style={{ color: "#4F7AFF" }}>
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentListings.length === 0 ? (
              <p className="p-5 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No listing requests yet</p>
            ) : (
              <div>
                {recentListings.map((l, i) => (
                  <div key={l.id} className="px-5 py-3 flex items-center justify-between"
                    style={{ borderBottom: i < recentListings.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{l.product.name}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {l.seller.brandName || l.seller.name} → {l.platform}
                      </p>
                    </div>
                    <span className="ml-3 flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: l.status === "LISTED" ? "rgba(0,198,122,0.15)" : l.status === "FAILED" ? "rgba(239,68,68,0.15)" : l.status === "IN_PROGRESS" ? "rgba(79,122,255,0.15)" : "rgba(245,158,11,0.15)",
                        color:      l.status === "LISTED" ? "#00C67A" : l.status === "FAILED" ? "#EF4444" : l.status === "IN_PROGRESS" ? "#4F7AFF" : "#F59E0B",
                      }}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

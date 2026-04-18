import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Package, Users, ShoppingCart, ListChecks, Clock,
  CheckCircle, ArrowRight, Truck, RotateCcw, AlertCircle,
  TrendingUp, Store, IndianRupee, Layers,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { AdminOrderTrendChart } from "@/components/admin/order-trend-chart";

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
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
  ]);

  const gmv = gmvResult._sum.totalAmount ?? 0;
  const pendingReviews = pendingProducts + pendingListings;

  const recentProducts = await prisma.product.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: { supplier: { select: { name: true } } },
  });

  const recentListings = await prisma.listingRequest.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      seller: { select: { name: true, brandName: true } },
      product: { select: { name: true } },
    },
  });

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Admin Dashboard"
        subtitle="Platform overview and key metrics"
        cards={
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total Orders",    value: totalOrders,    icon: ShoppingCart,  color: "#3B82F6" },
              { label: "Platform GMV",    value: fmt(gmv),       icon: IndianRupee,   color: "#00C67A" },
              { label: "Active Sellers",  value: `${activeSellers} / ${totalSellers}`, icon: Store, color: "#A78BFA" },
              { label: "Pending Reviews", value: pendingReviews, icon: Clock,         color: "#F59E0B" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl px-5 py-4 flex items-center gap-4"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.1)" }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
                  <p className="text-2xl font-bold text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
        }
      />

      <div className="px-8 pt-6 space-y-6">

        {/* ── Order Status Breakdown ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4" style={{ color: "var(--green-500)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Order Breakdown</h2>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: "Delivered",      value: deliveredOrders, icon: CheckCircle,  bg: "#F0FDF4", text: "#16A34A" },
              { label: "Active / Transit",value: activeOrders,   icon: Truck,        bg: "#EFF6FF", text: "#3B82F6" },
              { label: "RTO",            value: rtoOrders,       icon: RotateCcw,    bg: "#FFFBEB", text: "#D97706" },
              { label: "Cancelled",      value: cancelledOrders, icon: AlertCircle,  bg: "#FEF2F2", text: "#DC2626" },
              { label: "New Today",      value: newToday,        icon: ShoppingCart, bg: "#F5F3FF", text: "#7C3AED" },
            ].map(({ label, value, icon: Icon, bg, text }) => (
              <div key={label} className="card flex items-center gap-4 px-5 py-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                  <Icon className="w-5 h-5" style={{ color: text }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-900)" }}>{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Order Trend Chart ── */}
        <AdminOrderTrendChart />

        {/* ── Quick Actions ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4" style={{ color: "var(--green-500)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Quick Actions</h2>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Manage Orders",   sub: `${totalOrders} total`,       href: "/admin/orders",   icon: ShoppingCart, bg: "#EFF6FF", text: "#3B82F6" },
              { label: "Review Products", sub: `${pendingProducts} pending`,  href: "/admin/products", icon: Package,      bg: "#FFFBEB", text: "#D97706" },
              { label: "Listing Requests",sub: `${pendingListings} pending`,  href: "/admin/listings", icon: ListChecks,   bg: "#FEF2F2", text: "#DC2626" },
              { label: "Manage Sellers",  sub: `${totalSellers} sellers · ${totalSuppliers} suppliers`, href: "/admin/sellers", icon: Users, bg: "#F5F3FF", text: "#7C3AED" },
            ].map(({ label, sub, href, icon: Icon, bg, text }) => (
              <Link key={href} href={href}
                className="card flex items-center gap-4 px-5 py-4 hover:shadow-md transition-shadow group">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                  <Icon className="w-5 h-5" style={{ color: text }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>{label}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-400)" }}>{sub}</p>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-400)" }} />
              </Link>
            ))}
          </div>
        </div>

        {/* ── Recent Activity ── */}
        <div className="grid grid-cols-2 gap-5 pb-6">
          {/* Recent Product Submissions */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" style={{ color: "var(--text-400)" }} />
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Recent Submissions</h2>
              </div>
              <Link href="/admin/products" className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--green-500)" }}>
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentProducts.length === 0 ? (
              <p className="p-5 text-sm" style={{ color: "var(--text-400)" }}>No products yet</p>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {recentProducts.map((p) => (
                  <div key={p.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-900)" }}>{p.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>by {p.supplier.name}</p>
                    </div>
                    <span className="ml-3 flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: p.status === "APPROVED" ? "#F0FDF4" : p.status === "REJECTED" ? "#FEF2F2" : "#FFF7ED",
                        color:      p.status === "APPROVED" ? "#16A34A" : p.status === "REJECTED" ? "#DC2626" : "#D97706",
                      }}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Listing Requests */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4" style={{ color: "var(--text-400)" }} />
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Listing Requests</h2>
              </div>
              <Link href="/admin/listings" className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--green-500)" }}>
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentListings.length === 0 ? (
              <p className="p-5 text-sm" style={{ color: "var(--text-400)" }}>No listing requests yet</p>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {recentListings.map((l) => (
                  <div key={l.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-900)" }}>{l.product.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>
                        {l.seller.brandName || l.seller.name} → {l.platform}
                      </p>
                    </div>
                    <span className="ml-3 flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: l.status === "LISTED" ? "#F0FDF4" : l.status === "FAILED" ? "#FEF2F2" : l.status === "IN_PROGRESS" ? "#EFF6FF" : "#FFF7ED",
                        color:      l.status === "LISTED" ? "#16A34A" : l.status === "FAILED" ? "#DC2626" : l.status === "IN_PROGRESS" ? "#3B82F6" : "#D97706",
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

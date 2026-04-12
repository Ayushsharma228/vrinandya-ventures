import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Package, Users, ShoppingCart, ListChecks, Clock, CheckCircle, ArrowRight, Truck, RotateCcw, TrendingUp, AlertCircle } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { AdminOrderTrendChart } from "@/components/admin/order-trend-chart";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [
    totalProducts, pendingProducts, approvedProducts,
    totalSellers, totalSuppliers, totalOrders, pendingListings,
    deliveredOrders, rtoOrders, activeOrders, cancelledOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "PENDING" } }),
    prisma.product.count({ where: { status: "APPROVED" } }),
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.user.count({ where: { role: "SUPPLIER" } }),
    prisma.order.count(),
    prisma.listingRequest.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "DELIVERED" } }),
    prisma.order.count({ where: { status: "RTO" } }),
    prisma.order.count({ where: { status: { in: ["PROCESSING", "SHIPPED", "IN_TRANSIT"] } } }),
    prisma.order.count({ where: { status: "CANCELLED" } }),
  ]);

  const recentProducts = await prisma.product.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: { supplier: { select: { name: true } } },
  });

  const recentListings = await prisma.listingRequest.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      seller: { select: { name: true } },
      product: { select: { name: true } },
    },
  });

  const statCards = [
    { label: "Total Orders",     value: totalOrders,      icon: ShoppingCart, color: "#3B82F6" },
    { label: "Total Sellers",    value: totalSellers,     icon: Users,        color: "#00C67A" },
    { label: "Total Suppliers",  value: totalSuppliers,   icon: Users,        color: "#7C3AED" },
    { label: "Pending Products", value: pendingProducts,  icon: Clock,        color: "#F59E0B" },
    { label: "Approved Products",value: approvedProducts, icon: CheckCircle,  color: "#00C67A" },
    { label: "Total Products",   value: totalProducts,    icon: Package,      color: "#3B82F6" },
    { label: "Pending Listings", value: pendingListings,  icon: ListChecks,   color: "#EF4444" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Admin Dashboard"
        subtitle="Platform overview and key metrics"
        cards={
          <div className="grid grid-cols-7 gap-3">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl px-4 py-3.5"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                </div>
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
              </div>
            ))}
          </div>
        }
      />

      {/* ── Order Analytics ─────────────────────────────── */}
      <div className="px-8 pt-6">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: "var(--green-500)" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Order Analytics</h2>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: "Total Orders",    value: totalOrders,     icon: ShoppingCart, color: "#3B82F6", bg: "#EFF6FF", text: "#3B82F6" },
            { label: "Delivered",       value: deliveredOrders, icon: CheckCircle,  color: "#00C67A", bg: "#F0FDF4", text: "#16A34A" },
            { label: "Active / Transit",value: activeOrders,    icon: Truck,        color: "#7C3AED", bg: "#F5F3FF", text: "#7C3AED" },
            { label: "RTOs",            value: rtoOrders,       icon: RotateCcw,    color: "#F59E0B", bg: "#FFFBEB", text: "#D97706" },
            { label: "Cancelled",       value: cancelledOrders, icon: AlertCircle,  color: "#EF4444", bg: "#FEF2F2", text: "#DC2626" },
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

      {/* ── Order Trend Chart ─────────────────────────────── */}
      <div className="px-8 pt-6">
        <AdminOrderTrendChart />
      </div>

      <div className="px-8 py-6 grid grid-cols-2 gap-5">
        {/* Recent Product Submissions */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Recent Product Submissions</h2>
            <Link href="/admin/products" className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--green-500)" }}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentProducts.length === 0 ? (
            <p className="p-5 text-sm" style={{ color: "var(--text-400)" }}>No products yet</p>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {recentProducts.map((p) => (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-900)" }}>{p.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>by {p.supplier.name}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: p.status === "APPROVED" ? "#F0FDF4" : p.status === "REJECTED" ? "#FEF2F2" : "#FFF7ED",
                      color:      p.status === "APPROVED" ? "#00C67A" : p.status === "REJECTED" ? "#EF4444" : "#F59E0B",
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
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Listing Requests</h2>
            <Link href="/admin/listings" className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--green-500)" }}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentListings.length === 0 ? (
            <p className="p-5 text-sm" style={{ color: "var(--text-400)" }}>No listing requests yet</p>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {recentListings.map((l) => (
                <div key={l.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50">
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-900)" }}>{l.product.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>{l.seller.name} → {l.platform}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: l.status === "LISTED" ? "#F0FDF4" : l.status === "FAILED" ? "#FEF2F2" : l.status === "IN_PROGRESS" ? "#EFF6FF" : "#FFF7ED",
                      color:      l.status === "LISTED" ? "#00C67A" : l.status === "FAILED" ? "#EF4444" : l.status === "IN_PROGRESS" ? "#3B82F6" : "#F59E0B",
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
  );
}

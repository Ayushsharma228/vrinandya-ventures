import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Package, CheckCircle, Clock, XCircle,
  Plus, ArrowRight, AlertCircle, ShoppingCart,
  ClipboardList, Boxes, TrendingUp,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

export default async function SupplierDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  const supplierId = session.user.id;

  const [
    totalProducts, pendingProducts, approvedProducts, rejectedProducts,
    pendingOrders, activeOrders, dispatchedOrders,
    pendingPOs, activePOs,
    totalInventoryItems, lowStockItems,
  ] = await Promise.all([
    prisma.product.count({ where: { supplierId } }),
    prisma.product.count({ where: { supplierId, status: "PENDING" } }),
    prisma.product.count({ where: { supplierId, status: "APPROVED" } }),
    prisma.product.count({ where: { supplierId, status: "REJECTED" } }),
    prisma.order.count({ where: { supplierId, supplierStatus: "ASSIGNED" } }),
    prisma.order.count({ where: { supplierId, supplierStatus: { in: ["ACCEPTED", "PROCESSING", "PACKED", "READY_TO_SHIP"] } } }),
    prisma.order.count({ where: { supplierId, supplierStatus: "DISPATCHED" } }),
    prisma.purchaseOrder.count({ where: { supplierId, status: "SENT" } }),
    prisma.purchaseOrder.count({ where: { supplierId, status: { in: ["ACCEPTED", "PROCESSING", "PACKED"] } } }),
    prisma.inventoryItem.count({ where: { supplierId } }),
    prisma.inventoryItem.count({ where: { supplierId, availableQty: { lte: 5 } } }),
  ]);

  const recentOrders = await prisma.order.findMany({
    where: { supplierId },
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true, externalOrderId: true, status: true, supplierStatus: true,
      totalAmount: true, customerName: true, createdAt: true,
    },
  });

  const recentProducts = await prisma.product.findMany({
    where: { supplierId },
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, sku: true, status: true, createdAt: true },
  });

  const rejectedWithNotes = await prisma.product.findMany({
    where: { supplierId, status: "REJECTED", adminNote: { not: null } },
    take: 3,
    select: { id: true, name: true, adminNote: true },
  });

  const SUPPLIER_STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
    ASSIGNED:      { bg: "#FFF7ED", text: "#D97706", label: "Pending Acceptance" },
    ACCEPTED:      { bg: "#EFF6FF", text: "#3B82F6", label: "Accepted" },
    PROCESSING:    { bg: "#F5F3FF", text: "#7C3AED", label: "Processing" },
    PACKED:        { bg: "#F0F9FF", text: "#0369A1", label: "Packed" },
    READY_TO_SHIP: { bg: "#FFF7ED", text: "#EA580C", label: "Ready to Ship" },
    DISPATCHED:    { bg: "#F0FDF4", text: "#15803D", label: "Dispatched" },
    REJECTED:      { bg: "#FEF2F2", text: "#DC2626", label: "Rejected" },
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title={`Welcome back, ${session.user.name?.split(" ")[0] || "Supplier"}`}
        subtitle="Your fulfillment dashboard"
        actions={
          <Link href="/supplier/products/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--green-500)" }}>
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        }
        cards={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Pending Orders",  value: pendingOrders,   icon: Clock,       color: "#F59E0B" },
              { label: "Active Orders",   value: activeOrders,    icon: ShoppingCart, color: "#3B82F6" },
              { label: "Pending POs",     value: pendingPOs,      icon: ClipboardList, color: "#8B5CF6" },
              { label: "Products",        value: approvedProducts, icon: Package,     color: "#00C67A" },
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

      <div className="px-4 md:px-8 pt-6 space-y-6">
        {/* Rejection alert */}
        {rejectedWithNotes.length > 0 && (
          <div className="flex items-start gap-3 px-5 py-4 rounded-2xl"
            style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700">
                {rejectedWithNotes.length} product{rejectedWithNotes.length > 1 ? "s" : ""} rejected
              </p>
              <ul className="mt-1.5 space-y-1">
                {rejectedWithNotes.map((p) => (
                  <li key={p.id} className="text-xs text-red-600">
                    <span className="font-medium">{p.name}:</span> {p.adminNote}
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/supplier/products" className="flex-shrink-0 text-xs font-semibold text-red-600 underline">View all</Link>
          </div>
        )}

        {/* Pending orders alert */}
        {pendingOrders > 0 && (
          <div className="flex items-center justify-between px-5 py-4 rounded-2xl"
            style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm font-semibold text-amber-700">{pendingOrders} order{pendingOrders !== 1 ? "s" : ""} awaiting your acceptance</p>
                <p className="text-xs text-amber-600 mt-0.5">Accept or reject promptly to maintain your acceptance rate.</p>
              </div>
            </div>
            <Link href="/supplier/orders"
              className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-amber-700 underline">
              View queue <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-900)" }}>Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Order Queue",    sub: `${pendingOrders} pending · ${activeOrders} active`,   href: "/supplier/orders",          icon: ShoppingCart, bg: "#EFF6FF", text: "#3B82F6" },
              { label: "Purchase Orders", sub: `${pendingPOs} pending · ${activePOs} active`,        href: "/supplier/purchase-orders", icon: ClipboardList, bg: "#F5F3FF", text: "#7C3AED" },
              { label: "Inventory",      sub: `${totalInventoryItems} products tracked`,             href: "/supplier/inventory",       icon: Boxes,        bg: "#F0FDF4", text: "#16A34A" },
            ].map(({ label, sub, href, icon: Icon, bg, text }) => (
              <Link key={href} href={href}
                className="card flex items-center gap-4 px-5 py-4 hover:shadow-md transition-shadow group">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: bg }}>
                  <Icon className="w-5 h-5" style={{ color: text }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>{label}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-400)" }}>{sub}</p>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-400)" }} />
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent orders */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" style={{ color: "var(--text-400)" }} />
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Recent Orders</h2>
              </div>
              <Link href="/supplier/orders" className="flex items-center gap-1 text-xs font-medium"
                style={{ color: "var(--green-500)" }}>
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2">
                <ShoppingCart className="w-8 h-8" style={{ color: "var(--border)" }} />
                <p className="text-sm" style={{ color: "var(--text-400)" }}>No orders assigned yet</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {recentOrders.map((order) => {
                  const badge = order.supplierStatus ? SUPPLIER_STATUS_BADGE[order.supplierStatus] : null;
                  return (
                    <div key={order.id} className="px-5 py-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium font-mono" style={{ color: "var(--text-900)" }}>
                          #{order.externalOrderId}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>
                          {order.customerName ?? "—"} · ₹{order.totalAmount.toLocaleString()}
                        </p>
                      </div>
                      {badge && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                          style={{ background: badge.bg, color: badge.text }}>
                          {badge.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent products */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" style={{ color: "var(--text-400)" }} />
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Products</h2>
              </div>
              <Link href="/supplier/products" className="flex items-center gap-1 text-xs font-medium"
                style={{ color: "var(--green-500)" }}>
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {recentProducts.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2">
                <Package className="w-8 h-8" style={{ color: "var(--border)" }} />
                <p className="text-sm" style={{ color: "var(--text-400)" }}>No products yet</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {recentProducts.map((p) => (
                  <div key={p.id} className="px-5 py-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-900)" }}>{p.name}</p>
                      <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--text-400)" }}>{p.sku ?? "No SKU"}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
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
        </div>

      </div>
    </div>
  );
}

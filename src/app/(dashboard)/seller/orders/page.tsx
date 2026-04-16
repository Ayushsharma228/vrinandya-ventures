"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Download, ShoppingCart, IndianRupee, Package, Star, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface OrderItem { id: string; name: string; sku: string | null; quantity: number; price: number; }
interface Order {
  id: string; externalOrderId: string; source: string; status: string;
  customerName: string | null; customerEmail: string | null;
  customerAddress: { phone?: string; address?: string; city?: string; state?: string; pincode?: string } | null;
  totalAmount: number; awbNumber: string | null; createdAt: string; items: OrderItem[];
}
interface Stats { totalOrders: number; totalRevenue: number; totalItems: number; topProduct: string | null; }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  NEW:        { label: "New",        color: "#3B82F6", bg: "#EFF6FF" },
  PROCESSING: { label: "Processing", color: "#F59E0B", bg: "#FFF7ED" },
  SHIPPED:    { label: "Shipped",    color: "#7C3AED", bg: "#F5F3FF" },
  IN_TRANSIT: { label: "In Transit", color: "#025864", bg: "#ECFDF5" },
  DELIVERED:  { label: "Delivered",  color: "#00C67A", bg: "#F0FDF4" },
  RTO:        { label: "RTO",        color: "#EF4444", bg: "#FEF2F2" },
  CANCELLED:  { label: "Cancelled",  color: "#6B7280", bg: "#F9FAFB" },
};

const STATUS_FILTERS = ["ALL", "NEW", "PROCESSING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "RTO", "CANCELLED"];

function formatDate(d: Date) {
  return d.toISOString().split("T")[0]; // YYYY-MM-DD for API params
}
function fmt(n: number) { return new Intl.NumberFormat("en-IN").format(n); }

export default function SellerOrdersPage() {
  const today = new Date();
  const yearAgo = new Date(today); yearAgo.setFullYear(today.getFullYear() - 1);

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, totalRevenue: 0, totalItems: 0, topProduct: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [from] = useState(formatDate(yearAgo));
  const [to] = useState(formatDate(today));
  const [confirming, setConfirming] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [syncError, setSyncError] = useState("");

  const fetchOrders = useCallback(async () => {
    const params = new URLSearchParams({ from, to });
    if (search) params.set("search", search);
    const res = await fetch(`/api/seller/orders?${params}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setStats(data.stats || { totalOrders: 0, totalRevenue: 0, totalItems: 0, topProduct: null });
    setLoading(false);
  }, [from, to, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function handleRefresh() {
    setRefreshing(true);
    setSyncError("");
    try {
      const res = await fetch("/api/seller/shopify/sync-orders", { method: "POST" });
      const data = await res.json();
      if (!res.ok) setSyncError(data.error || "Sync failed. Please check your Shopify connection.");
    } catch {
      setSyncError("Network error. Please try again.");
    }
    await fetchOrders();
    setRefreshing(false);
  }

  async function handleConfirm(orderId: string) {
    setConfirming(orderId);
    await fetch("/api/seller/orders/ship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    await fetchOrders();
    setConfirming(null);
  }

  async function handleCancel(orderId: string) {
    setCancelling(orderId);
    await fetch("/api/seller/orders/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    await fetchOrders();
    setCancelling(null);
  }

  function handleExport() {
    const csv = [
      ["Order #", "Name", "Phone", "Products", "Address", "Qty", "Amount", "Status", "Date"].join(","),
      ...orders.map((o) => [
        o.externalOrderId, o.customerName || "", o.customerAddress?.phone || "",
        o.items.map((i) => `${i.name} x${i.quantity}`).join("; "),
        [o.customerAddress?.address, o.customerAddress?.city, o.customerAddress?.state, o.customerAddress?.pincode].filter(Boolean).join(", "),
        o.items.reduce((s, i) => s + i.quantity, 0), o.totalAmount, o.status,
        new Date(o.createdAt).toLocaleDateString("en-IN"),
      ].map((v) => `"${v}"`).join(","))
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "orders.csv"; a.click();
  }

  const displayed = orders.filter((o) =>
    statusFilter === "ALL" || o.status === statusFilter
  );

  const statCards = [
    { label: "Total Orders", value: fmt(stats.totalOrders), icon: ShoppingCart, color: "#3B82F6", bg: "#EFF6FF" },
    { label: "Total Revenue", value: `₹${fmt(stats.totalRevenue)}`, icon: IndianRupee, color: "#00C67A", bg: "#F0FDF4" },
    { label: "Total Items", value: fmt(stats.totalItems), icon: Package, color: "#7C3AED", bg: "#F5F3FF" },
    { label: "Top Product", value: stats.topProduct ? stats.topProduct.slice(0, 22) + (stats.topProduct.length > 22 ? "…" : "") : "—", icon: Star, color: "#F59E0B", bg: "#FFF7ED" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Store Orders"
        subtitle="Manage orders from your connected stores"
        searchValue={search}
        searchPlaceholder="Search orders, customer, phone..."
        onSearchChange={setSearch}
        onSearchSubmit={fetchOrders}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Syncing..." : "Refresh Orders"}
            </button>
            <button onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ background: "var(--green-500)", color: "white" }}>
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        }
        cards={
          <div className="grid grid-cols-4 gap-4">
            {statCards.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-2xl px-5 py-4"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>{s.label}</p>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                      <Icon className="w-4 h-4" style={{ color: s.color }} />
                    </div>
                  </div>
                  <p className="text-xl font-bold leading-tight text-white">{s.value}</p>
                </div>
              );
            })}
          </div>
        }
      />

      <div className="px-8 py-6 space-y-5">
        {syncError && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            {syncError}
          </div>
        )}
        {/* Status filter buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const isActive = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={isActive
                  ? { background: cfg ? cfg.color : "var(--bg-sidebar)", color: "white" }
                  : { background: cfg ? cfg.bg : "#F3F4F6", color: cfg ? cfg.color : "var(--text-600)", border: `1px solid ${cfg ? cfg.bg : "#E5E7EB"}` }
                }>
                {s === "ALL" ? "All Orders" : cfg?.label ?? s}
              </button>
            );
          })}
        </div>

        {/* Orders table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm" style={{ color: "var(--text-400)" }}>
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: "var(--green-500)" }} />
              Loading orders...
            </div>
          ) : displayed.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <ShoppingCart className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text-400)" }}>No orders found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "#FAFAFA" }}>
                  {["Order #", "Customer", "Products", "Address", "Qty", "Amount", "Status", "Date", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-400)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {displayed.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.NEW;
                  const addr = order.customerAddress;
                  const canConfirm = order.status === "NEW" || order.status === "PROCESSING";
                  const canCancel = order.status !== "CANCELLED" && order.status !== "DELIVERED";
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-semibold" style={{ color: "var(--green-500)" }}>
                        #{order.externalOrderId}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-xs" style={{ color: "var(--text-900)" }}>{order.customerName || "—"}</p>
                        <p className="text-xs" style={{ color: "var(--text-400)" }}>{addr?.phone || order.customerEmail || "—"}</p>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-xs line-clamp-2" style={{ color: "var(--text-600)" }}>
                          {order.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs line-clamp-2" style={{ color: "var(--text-600)" }}>
                          {[addr?.address, addr?.city, addr?.state, addr?.pincode].filter(Boolean).join(", ") || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--text-600)" }}>
                        {order.items.reduce((s, i) => s + i.quantity, 0)}
                      </td>
                      <td className="px-4 py-3 font-bold text-xs" style={{ color: "var(--text-900)" }}>
                        ₹{fmt(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {canConfirm && (
                            <button
                              onClick={() => handleConfirm(order.id)}
                              disabled={confirming === order.id}
                              title="Confirm Order"
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
                              style={{ background: "#F0FDF4", color: "#00C67A" }}>
                              {confirming === order.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <CheckCircle className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          {canCancel && (
                            <button
                              onClick={() => handleCancel(order.id)}
                              disabled={cancelling === order.id}
                              title="Cancel Order"
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
                              style={{ background: "#FEF2F2", color: "#EF4444" }}>
                              {cancelling === order.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <XCircle className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
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

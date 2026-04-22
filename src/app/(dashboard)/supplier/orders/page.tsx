"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Download, ShoppingCart, Package, IndianRupee, Calendar, CheckCircle, Truck, XCircle, RotateCcw } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface Order {
  id: string;
  externalOrderId: string;
  source: string;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  totalAmount: number;
  awbNumber: string | null;
  createdAt: string;
  items: { name: string; quantity: number; price: number }[];
  seller: { name: string };
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

const STATUS_FILTERS = ["ALL", "NEW", "PROCESSING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "RTO", "CANCELLED"];

function fmt(n: number) { return new Intl.NumberFormat("en-IN").format(n); }

export default function SupplierOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchOrders = useCallback(async () => {
    const res = await fetch("/api/supplier/orders");
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }

  function handleExport() {
    const csv = [
      ["Order ID", "Customer", "Products", "Seller", "Amount", "Status", "AWB", "Date"].join(","),
      ...displayed.map((o) => [
        o.externalOrderId, o.customerName || "", o.items.map((i) => `${i.name} x${i.quantity}`).join("; "),
        o.seller.name, o.totalAmount, o.status, o.awbNumber || "",
        new Date(o.createdAt).toLocaleDateString("en-IN"),
      ].map((v) => `"${v}"`).join(","))
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "supplier-orders.csv";
    a.click();
  }

  const now = new Date();
  const filtered = orders.filter((o) => {
    const matchSearch = !search ||
      o.externalOrderId.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const displayed = filtered;

  const stats = {
    total:     orders.length,
    items:     orders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.quantity, 0), 0),
    revenue:   orders.reduce((s, o) => s + o.totalAmount, 0),
    thisMonth: orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
  };

  const statCards = [
    { label: "Total Orders",  value: fmt(stats.total),       icon: ShoppingCart, color: "#3B82F6" },
    { label: "Total Items",   value: fmt(stats.items),       icon: Package,      color: "#7C3AED" },
    { label: "Order Value",   value: `₹${fmt(stats.revenue)}`, icon: IndianRupee,  color: "#00C67A" },
    { label: "This Month",    value: fmt(stats.thisMonth),   icon: Calendar,     color: "#F59E0B" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="My Orders"
        subtitle="Orders containing your products"
        searchValue={search}
        searchPlaceholder="Search by order ID, customer or product..."
        onSearchChange={setSearch}
        onSearchSubmit={fetchOrders}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: "var(--green-500)", color: "white" }}>
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        }
        cards={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl px-5 py-4"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                </div>
                <p className="text-xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        }
      />

      <div className="px-4 md:px-8 py-6 space-y-5">
        {/* Status filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const isActive = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={isActive
                  ? { background: cfg ? cfg.color : "var(--bg-sidebar)", color: "white" }
                  : { background: cfg ? cfg.bg : "#F3F4F6", color: cfg ? cfg.color : "var(--text-600)" }
                }>
                {s === "ALL" ? "All Orders" : cfg?.label ?? s}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Orders ({displayed.length})</h2>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--text-400)" }}>Loading...</div>
          ) : displayed.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <ShoppingCart className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm" style={{ color: "var(--text-400)" }}>No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "#FAFAFA" }}>
                  {["Order ID", "Customer", "Products", "Seller", "Amount", "Status", "AWB", "Date"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-400)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {displayed.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.NEW;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-xs" style={{ color: "var(--green-500)" }}>
                        #{order.externalOrderId}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium" style={{ color: "var(--text-900)" }}>{order.customerName || "—"}</p>
                        <p className="text-xs" style={{ color: "var(--text-400)" }}>{order.customerEmail || ""}</p>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <p className="text-xs line-clamp-2" style={{ color: "var(--text-600)" }}>
                          {order.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-600)" }}>{order.seller.name}</td>
                      <td className="px-5 py-3.5 font-bold text-xs" style={{ color: "var(--text-900)" }}>₹{fmt(order.totalAmount)}</td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs" style={{ color: "var(--text-400)" }}>{order.awbNumber || "—"}</td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-400)" }}>
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          )}
        </div>
      </div>
    </div>
  );
}

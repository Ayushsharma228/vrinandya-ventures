"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, ShoppingCart, Save } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface Seller { id: string; name: string | null; email: string; }
interface Order {
  id: string;
  externalOrderId: string;
  status: string;
  awbNumber: string | null;
  courier: string | null;
  customerName: string | null;
  customerAddress: { phone?: string } | null;
  totalAmount: number;
  createdAt: string;
  seller: { name: string | null; email: string };
  items: { name: string; quantity: number }[];
}

const STATUS_COLOR: Record<string, string> = {
  NEW: "bg-gray-100 text-gray-600",
  PROCESSING: "bg-purple-50 text-purple-600",
  SHIPPED: "bg-blue-50 text-blue-600",
  IN_TRANSIT: "bg-yellow-50 text-yellow-600",
  DELIVERED: "bg-green-50 text-green-600",
  CANCELLED: "bg-red-50 text-red-600",
  RTO: "bg-orange-50 text-orange-600",
};

const STATUSES = ["NEW", "PROCESSING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED", "RTO"];

export default function AdminOrdersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [statusInputs, setStatusInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/sellers").then((r) => r.json()).then((d) => setSellers(d.sellers ?? []));
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (sellerFilter) params.set("sellerId", sellerFilter);
    const res = await fetch(`/api/admin/orders?${params}`);
    const data = await res.json();
    setOrders(data.orders ?? []);
    setLoading(false);
  }, [search, statusFilter, sellerFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  function getDisplayStatus(order: Order) {
    return order.courier?.includes("RTO") ? "RTO" : order.status;
  }

  async function handleSaveStatus(order: Order) {
    const status = statusInputs[order.id] ?? getDisplayStatus(order);
    setSaving(order.id);
    const res = await fetch("/api/admin/orders/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, status }),
    });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error || "Failed to update");
    } else {
      setStatusInputs((p) => { const n = { ...p }; delete n[order.id]; return n; });
      await fetchOrders();
    }
    setSaving(null);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Orders"
        subtitle="View and manage all seller orders"
        searchValue={search}
        searchPlaceholder="Search order ID, customer..."
        onSearchChange={setSearch}
        onSearchSubmit={fetchOrders}
        filters={
          <div className="flex items-center gap-2">
            <select value={sellerFilter} onChange={(e) => setSellerFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl text-white outline-none"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <option value="" className="text-gray-900 bg-white">All Sellers</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id} className="text-gray-900 bg-white">{s.name || s.email}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl text-white outline-none"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <option value="" className="text-gray-900 bg-white">All Statuses</option>
              {STATUSES.map((s) => <option key={s} value={s} className="text-gray-900 bg-white">{s}</option>)}
            </select>
          </div>
        }
      />

      <div className="px-8 py-6">
      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
          <ShoppingCart className="w-4 h-4" style={{ color: "var(--text-400)" }} />
          <span className="font-semibold text-sm" style={{ color: "var(--text-900)" }}>Orders ({orders.length})</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["Order #", "Seller", "Customer", "Products", "Amount", "AWB", "Status", "Date", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.length === 0 ? (
                  <tr><td colSpan={9} className="py-12 text-center text-gray-400 text-sm">No orders found</td></tr>
                ) : orders.map((order) => {
                  const ds = getDisplayStatus(order);
                  const currentStatus = statusInputs[order.id] ?? ds;
                  const isDirty = statusInputs[order.id] !== undefined && statusInputs[order.id] !== ds;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 whitespace-nowrap">{order.externalOrderId}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{order.seller.name || order.seller.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{order.customerName || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-[140px] truncate">
                        {order.items.map((i) => `${i.name} ×${i.quantity}`).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">₹{order.totalAmount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">{order.awbNumber || "—"}</td>
                      <td className="px-4 py-3">
                        <select
                          value={currentStatus}
                          onChange={(e) => setStatusInputs((p) => ({ ...p, [order.id]: e.target.value }))}
                          className={`text-xs px-2 py-1 rounded-full font-medium border border-transparent outline-none cursor-pointer ${STATUS_COLOR[currentStatus] ?? "bg-gray-100 text-gray-600"}`}>
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleSaveStatus(order)}
                          disabled={saving === order.id || !isDirty}
                          className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 whitespace-nowrap ${isDirty ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-100 text-gray-400 cursor-default"}`}>
                          <Save className="w-3 h-3" />
                          {saving === order.id ? "..." : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

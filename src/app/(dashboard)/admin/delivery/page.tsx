"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, Truck, Save } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface Order {
  id: string;
  externalOrderId: string;
  status: string;
  awbNumber: string | null;
  trackingUrl: string | null;
  customerName: string | null;
  customerAddress: { phone?: string } | null;
  totalAmount: number;
  courier: string | null;
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

const STATUSES = ["PROCESSING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED", "RTO"];

export default function AdminDeliveryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [awbInputs, setAwbInputs] = useState<Record<string, string>>({});
  const [statusInputs, setStatusInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/admin/orders?${params}`);
    const data = await res.json();
    // Exclude cancelled orders that were never shipped (no AWB) — nothing to manage delivery-wise
    const fetched: Order[] = (data.orders ?? []).filter(
      (o: Order) => o.status !== "CANCELLED" || o.awbNumber
    );
    setOrders(fetched);
    // Pre-fill AWB inputs with existing AWB values (only on first load)
    setAwbInputs((prev) => {
      const next = { ...prev };
      fetched.forEach((o) => {
        if (o.awbNumber && next[o.id] === undefined) next[o.id] = o.awbNumber;
      });
      return next;
    });
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function handleBulkSave() {
    const dirtyOrders = orders.filter((o) => statusInputs[o.id] !== undefined && statusInputs[o.id] !== o.status);
    if (dirtyOrders.length === 0) return;
    setBulkSaving(true);
    await Promise.all(dirtyOrders.map((order) =>
      fetch("/api/admin/orders/set-awb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          awb: (awbInputs[order.id] ?? order.awbNumber ?? "").trim(),
          status: statusInputs[order.id],
        }),
      })
    ));
    setStatusInputs({});
    await fetchOrders();
    setBulkSaving(false);
  }

  async function handleRefreshTracking() {
    setRefreshing(true);
    await fetch("/api/seller/deliveries/refresh-tracking", { method: "POST" });
    await fetchOrders();
    setRefreshing(false);
  }

  async function handleSaveAwb(order: Order) {
    const status = statusInputs[order.id] || order.status;
    const awb = (awbInputs[order.id] ?? "").trim() || order.awbNumber || "";
    if (status !== "CANCELLED" && !awb) return alert("Enter AWB number");
    setSaving(order.id);
    const res = await fetch("/api/admin/orders/set-awb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, awb, status }),
    });
    if (res.ok) {
      await fetchOrders();
    } else {
      const d = await res.json();
      alert(d.error || "Failed");
    }
    setSaving(null);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Delivery Management"
        subtitle="Manage AWB numbers and delivery status for all orders"
        searchValue={search}
        searchPlaceholder="Search by order #, customer, AWB..."
        onSearchChange={setSearch}
        onSearchSubmit={fetchOrders}
        actions={
          <div className="flex items-center gap-2">
            {Object.keys(statusInputs).some((id) => statusInputs[id] !== orders.find(o => o.id === id)?.status) && (
              <button onClick={handleBulkSave} disabled={bulkSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: "#00C67A", color: "white" }}>
                <Save className="w-4 h-4" />
                {bulkSaving ? "Saving..." : `Save All Changes`}
              </button>
            )}
            <button onClick={handleRefreshTracking} disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Tracking
            </button>
          </div>
        }
        filters={
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl text-white outline-none"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <option value="" className="text-gray-900 bg-white">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s} className="text-gray-900 bg-white">{s}</option>)}
          </select>
        }
      />

      <div className="px-8 py-6">
      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
          <Truck className="w-4 h-4" style={{ color: "var(--text-400)" }} />
          <span className="font-semibold text-sm" style={{ color: "var(--text-900)" }}>Orders ({orders.length})</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["Order #", "Seller", "Customer", "Phone", "Product", "Amount", "Status", "AWB", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.length === 0 ? (
                  <tr><td colSpan={9} className="py-12 text-center text-gray-400 text-sm">No orders found</td></tr>
                ) : orders.map((order) => {
                  const selectedStatus = statusInputs[order.id] ?? order.status;
                  const isCancelled = selectedStatus === "CANCELLED";
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-mono text-xs text-blue-600">{order.externalOrderId}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{order.seller.name || order.seller.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{order.customerName || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{order.customerAddress?.phone || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-[140px] truncate">
                        {order.items.map((i) => `${i.name} x${i.quantity}`).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">₹{order.totalAmount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <select
                          value={selectedStatus}
                          onChange={(e) => setStatusInputs((p) => ({ ...p, [order.id]: e.target.value }))}
                          className={`text-xs px-2 py-1 rounded-full font-medium border-0 outline-none cursor-pointer ${STATUS_COLOR[selectedStatus] ?? "bg-gray-100 text-gray-600"}`}>
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {isCancelled ? (
                          <span className="text-xs text-gray-300">—</span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <input
                              type="text"
                              placeholder="Enter AWB"
                              value={awbInputs[order.id] ?? ""}
                              onChange={(e) => setAwbInputs((p) => ({ ...p, [order.id]: e.target.value }))}
                              className="w-32 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                            />
                            {order.trackingUrl && (
                              <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="text-blue-500 text-xs hover:underline">Track</a>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleSaveAwb(order)}
                          disabled={saving === order.id}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50 whitespace-nowrap">
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

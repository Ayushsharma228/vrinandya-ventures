"use client";

import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Save, Trash2, Plus, X, Loader2 } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface Seller { id: string; name: string | null; email: string; }
interface Order {
  id: string;
  externalOrderId: string;
  status: string;
  awbNumber: string | null;
  customerName: string | null;
  customerAddress: { phone?: string } | null;
  totalAmount: number;
  createdAt: string;
  seller: { name: string | null; email: string };
  items: { name: string; quantity: number }[];
}

const STATUS_COLOR: Record<string, string> = {
  NEW:        "bg-gray-100 text-gray-600",
  PROCESSING: "bg-purple-50 text-purple-600",
  SHIPPED:    "bg-blue-50 text-blue-600",
  IN_TRANSIT: "bg-yellow-50 text-yellow-600",
  DELIVERED:  "bg-green-50 text-green-600",
  CANCELLED:  "bg-red-50 text-red-600",
  RTO:        "bg-orange-50 text-orange-600",
};

const STATUSES = ["NEW", "PROCESSING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED", "RTO"];

// ── Add Order Modal ───────────────────────────────────────────────────────

function AddOrderModal({ sellers, onClose, onSaved }: {
  sellers: Seller[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [sellerId, setSellerId]           = useState("");
  const [externalOrderId, setExtId]       = useState("");
  const [customerName, setCustName]       = useState("");
  const [customerPhone, setCustPhone]     = useState("");
  const [customerAddress, setCustAddress] = useState("");
  const [totalAmount, setTotal]           = useState("");
  const [status, setStatus]               = useState("NEW");
  const [orderDate, setOrderDate]         = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems]                 = useState([{ name: "", quantity: 1, price: 0 }]);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState("");

  function addItem() { setItems((p) => [...p, { name: "", quantity: 1, price: 0 }]); }
  function removeItem(i: number) { setItems((p) => p.filter((_, idx) => idx !== i)); }
  function updateItem(i: number, field: string, value: string | number) {
    setItems((p) => p.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sellerId || !externalOrderId || !totalAmount) {
      setError("Seller, Order ID and Amount are required"); return;
    }
    setSaving(true); setError("");
    const res = await fetch("/api/admin/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sellerId, externalOrderId, customerName, customerPhone,
        customerAddress, totalAmount, status, orderDate,
        items: items.filter((i) => i.name.trim()),
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed"); setSaving(false); return; }
    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h2 className="font-bold text-gray-900">Add Order Manually</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-100">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Seller *</label>
              <select value={sellerId} onChange={(e) => setSellerId(e.target.value)} required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Select seller...</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name || s.email}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Order ID *</label>
              <input value={externalOrderId} onChange={(e) => setExtId(e.target.value)} required
                placeholder="e.g. #1234" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Order Date</label>
              <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Customer Name</label>
              <input value={customerName} onChange={(e) => setCustName(e.target.value)}
                placeholder="Customer name" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
              <input value={customerPhone} onChange={(e) => setCustPhone(e.target.value)}
                placeholder="+91 98765 43210" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Delivery Address</label>
              <input value={customerAddress} onChange={(e) => setCustAddress(e.target.value)}
                placeholder="Full address" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Total Amount (₹) *</label>
              <input type="number" value={totalAmount} onChange={(e) => setTotal(e.target.value)} required
                placeholder="0" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-500">Products / Items</label>
              <button type="button" onClick={addItem}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={item.name} onChange={(e) => updateItem(i, "name", e.target.value)}
                    placeholder="Product name" className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  <input type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 1)}
                    placeholder="Qty" min={1} className="w-16 px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none text-center" />
                  <input type="number" value={item.price} onChange={(e) => updateItem(i, "price", parseFloat(e.target.value) || 0)}
                    placeholder="₹" className="w-20 px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none text-center" />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="p-1 text-red-400 hover:text-red-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0 bg-gray-50/50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100">
            Cancel
          </button>
          <button onClick={handleSubmit as never} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Plus className="w-4 h-4" /> Add Order</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  const [sellers, setSellers]             = useState<Seller[]>([]);
  const [orders, setOrders]               = useState<Order[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState("");
  const [sellerFilter, setSellerFilter]   = useState("");
  const [statusFilter, setStatusFilter]   = useState("");
  const [statusInputs, setStatusInputs]   = useState<Record<string, string>>({});
  const [saving, setSaving]               = useState<string | null>(null);
  const [selected, setSelected]           = useState<Set<string>>(new Set());
  const [deleting, setDeleting]           = useState(false);
  const [showAddModal, setShowAddModal]   = useState(false);

  useEffect(() => {
    fetch("/api/admin/sellers").then((r) => r.json()).then((d) => setSellers(d.sellers ?? []));
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)       params.set("search",   search);
    if (statusFilter) params.set("status",   statusFilter);
    if (sellerFilter) params.set("sellerId", sellerFilter);
    const res = await fetch(`/api/admin/orders?${params}`);
    const data = await res.json();
    setOrders(data.orders ?? []);
    setLoading(false);
  }, [search, statusFilter, sellerFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function handleSaveStatus(order: Order) {
    const status = statusInputs[order.id] ?? order.status;
    setSaving(order.id);
    const res = await fetch("/api/admin/orders/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, status }),
    });
    if (!res.ok) { const d = await res.json(); alert(d.error || "Failed"); }
    else { setStatusInputs((p) => { const n = { ...p }; delete n[order.id]; return n; }); await fetchOrders(); }
    setSaving(null);
  }

  async function handleDelete(orderIds: string[]) {
    if (!confirm(`Delete ${orderIds.length} order${orderIds.length > 1 ? "s" : ""}? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch("/api/admin/orders", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderIds }),
    });
    setSelected(new Set());
    await fetchOrders();
    setDeleting(false);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    setSelected(selected.size === orders.length ? new Set() : new Set(orders.map((o) => o.id)));
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Orders"
        subtitle="View, manage, add or delete seller orders"
        searchValue={search}
        searchPlaceholder="Search order ID, customer..."
        onSearchChange={setSearch}
        onSearchSubmit={fetchOrders}
        actions={
          <button onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#00C67A" }}>
            <Plus className="w-4 h-4" /> Add Order
          </button>
        }
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
        <div className="card overflow-hidden">
          {/* Table header */}
          <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" style={{ color: "var(--text-400)" }} />
              <span className="font-semibold text-sm" style={{ color: "var(--text-900)" }}>
                Orders ({orders.length})
              </span>
            </div>
            {selected.size > 0 && (
              <button onClick={() => handleDelete(Array.from(selected))} disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? "Deleting..." : `Delete ${selected.size} selected`}
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox" checked={selected.size === orders.length && orders.length > 0}
                        onChange={toggleAll} className="rounded cursor-pointer" />
                    </th>
                    {["Order #", "Seller", "Customer", "Products", "Amount", "AWB", "Status", "Date", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.length === 0 ? (
                    <tr><td colSpan={10} className="py-12 text-center text-gray-400 text-sm">No orders found</td></tr>
                  ) : orders.map((order) => {
                    const currentStatus = statusInputs[order.id] ?? order.status;
                    const isDirty = statusInputs[order.id] !== undefined && statusInputs[order.id] !== order.status;
                    const isSelected = selected.has(order.id);
                    return (
                      <tr key={order.id} className={`hover:bg-gray-50/50 ${isSelected ? "bg-red-50/30" : ""}`}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(order.id)} className="rounded cursor-pointer" />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-blue-600 whitespace-nowrap">{order.externalOrderId}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{order.seller.name || order.seller.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{order.customerName || "—"}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[140px] truncate">
                          {order.items.map((i) => `${i.name} ×${i.quantity}`).join(", ") || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">₹{order.totalAmount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 font-mono">{order.awbNumber || "—"}</td>
                        <td className="px-4 py-3">
                          <select value={currentStatus}
                            onChange={(e) => setStatusInputs((p) => ({ ...p, [order.id]: e.target.value }))}
                            className={`text-xs px-2 py-1 rounded-full font-medium border-0 outline-none cursor-pointer ${STATUS_COLOR[currentStatus] ?? "bg-gray-100 text-gray-600"}`}>
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => handleSaveStatus(order)}
                              disabled={saving === order.id || !isDirty}
                              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-40 ${isDirty ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-100 text-gray-400"}`}>
                              <Save className="w-3 h-3" />
                              {saving === order.id ? "..." : "Save"}
                            </button>
                            <button onClick={() => handleDelete([order.id])} disabled={deleting}
                              className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {showAddModal && (
        <AddOrderModal
          sellers={sellers}
          onClose={() => setShowAddModal(false)}
          onSaved={fetchOrders}
        />
      )}
    </div>
  );
}

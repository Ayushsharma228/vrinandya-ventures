"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Download, Search, Filter, Calendar, Package, ShoppingCart, IndianRupee, Star } from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  sku: string | null;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  externalOrderId: string;
  source: string;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  customerAddress: { phone?: string; address?: string; city?: string; state?: string; pincode?: string } | null;
  totalAmount: number;
  awbNumber: string | null;
  createdAt: string;
  items: OrderItem[];
}

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  totalItems: number;
  topProduct: string | null;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, "-");
}

export default function SellerOrdersPage() {
  const today = new Date();
  const monthAgo = new Date(today); monthAgo.setDate(today.getDate() - 30);

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, totalRevenue: 0, totalItems: 0, topProduct: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [from, setFrom] = useState(formatDate(monthAgo));
  const [to, setTo] = useState(formatDate(today));
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchOrders = useCallback(async () => {
    const params = new URLSearchParams({ from, to });
    if (search) params.set("search", search);
    if (productFilter) params.set("product", productFilter);

    const res = await fetch(`/api/seller/orders?${params}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setStats(data.stats || { totalOrders: 0, totalRevenue: 0, totalItems: 0, topProduct: null });
    setLoading(false);
  }, [from, to, search, productFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetch("/api/seller/shopify/sync-orders", { method: "POST" });
    await fetchOrders();
    setRefreshing(false);
  }

  function handleToday() {
    const f = formatDate(today);
    setFrom(f); setTo(f);
  }

  function handleExport() {
    const csv = [
      ["Order #", "Name", "Email", "Phone", "Products", "Shipping Address", "Qty", "Amount", "Status", "Date"].join(","),
      ...orders.map((o) => [
        o.externalOrderId,
        o.customerName || "",
        o.customerEmail || "",
        o.customerAddress?.phone || "",
        o.items.map((i) => `${i.name} x${i.quantity}`).join("; "),
        [o.customerAddress?.address, o.customerAddress?.city, o.customerAddress?.state, o.customerAddress?.pincode].filter(Boolean).join(", "),
        o.items.reduce((s, i) => s + i.quantity, 0),
        o.totalAmount,
        o.status,
        new Date(o.createdAt).toLocaleDateString("en-IN"),
      ].map((v) => `"${v}"`).join(","))
    ].join("\n");

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "orders.csv";
    a.click();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleAll() {
    setSelected(selected.size === orders.length ? new Set() : new Set(orders.map((o) => o.id)));
  }

  // Unique products for filter dropdown
  const allProducts = [...new Set(orders.flatMap((o) => o.items.map((i) => i.name)))];

  const STATUS_COLOR: Record<string, string> = {
    NEW: "text-blue-600", PROCESSING: "text-yellow-600", SHIPPED: "text-indigo-600",
    IN_TRANSIT: "text-purple-600", DELIVERED: "text-green-600", CANCELLED: "text-red-500",
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Orders</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage orders from your connected stores</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 bg-white disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh Orders
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 bg-white">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-2 justify-end mb-5">
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" value={from.split("-").reverse().join("-")}
            onChange={(e) => setFrom(formatDate(new Date(e.target.value)))}
            className="outline-none text-sm bg-transparent" />
        </div>
        <span className="text-gray-400">-</span>
        <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" value={to.split("-").reverse().join("-")}
            onChange={(e) => setTo(formatDate(new Date(e.target.value)))}
            className="outline-none text-sm bg-transparent" />
        </div>
        <button onClick={handleToday}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 bg-white">
          Today
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: "Total Orders",   value: stats.totalOrders,                           icon: ShoppingCart,  extra: null },
          { label: "Total Revenue",  value: `₹${stats.totalRevenue.toFixed(2)}`,          icon: IndianRupee,   extra: null },
          { label: "Total Items",    value: stats.totalItems,                             icon: Package,       extra: null },
          { label: "Top Product",    value: stats.topProduct || "No products",            icon: Star,          extra: null },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-400 mb-2">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 leading-tight">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search orders..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
            <option value="">All Products</option>
            {allProducts.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <button onClick={() => { setSearch(""); setProductFilter(""); setFrom(formatDate(monthAgo)); setTo(formatDate(today)); }}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
            <Filter className="w-4 h-4" /> Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading orders...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selected.size === orders.length && orders.length > 0}
                      onChange={toggleAll} className="w-4 h-4 rounded accent-blue-600" />
                  </th>
                  {["Order #", "Name", "Email", "Phone Number", "Products", "Shipping Address", "Quantities", "Amount", "Payment", "Date", "Ship", "Cancel"].map((h) => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-12 text-center text-gray-400 text-sm">
                      No orders match your filters
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const addr = order.customerAddress;
                    const shippingAddr = addr ? [addr.address, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ") : "—";
                    const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);

                    return (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={selected.has(order.id)}
                            onChange={() => toggleSelect(order.id)} className="w-4 h-4 rounded accent-blue-600" />
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-blue-600 whitespace-nowrap">#{order.externalOrderId}</td>
                        <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{order.customerName || "—"}</td>
                        <td className="px-3 py-3 text-gray-500 text-xs">{order.customerEmail || "—"}</td>
                        <td className="px-3 py-3 text-gray-500 text-xs">{addr?.phone || "—"}</td>
                        <td className="px-3 py-3 max-w-[140px]">
                          {order.items.map((i, idx) => (
                            <p key={idx} className="text-xs text-gray-600 truncate">{i.name}</p>
                          ))}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-500 max-w-[140px]">
                          <p className="truncate">{shippingAddr}</p>
                        </td>
                        <td className="px-3 py-3 text-center text-gray-700 font-medium">{totalQty}</td>
                        <td className="px-3 py-3 font-semibold text-gray-800 whitespace-nowrap">₹{order.totalAmount.toLocaleString()}</td>
                        <td className="px-3 py-3">
                          <span className={`text-xs font-semibold ${STATUS_COLOR[order.status] || "text-gray-500"}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-3 py-3">
                          <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap">
                            Ship
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <button className="px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors">
                            Cancel
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

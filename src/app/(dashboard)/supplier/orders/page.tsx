"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart, Package, DollarSign, Calendar,
  CheckCircle, RefreshCw, Truck, XCircle, Search,
  Download, RotateCcw
} from "lucide-react";
import { ORDER_STATUS_COLOR } from "@/lib/order-status";

interface Order {
  id: string;
  externalOrderId: string;
  source: string;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  totalAmount: number;
  currency: string;
  awbNumber: string | null;
  createdAt: string;
  items: { name: string; quantity: number; price: number }[];
  seller: { name: string };
}


export default function SupplierOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [syncing, setSyncing] = useState(false);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch("/api/supplier/orders");
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    }
    setLoading(false);
  }

  useEffect(() => { fetchOrders(); }, []);

  async function handleSync() {
    setSyncing(true);
    await fetchOrders();
    setSyncing(false);
  }

  function handleExport() {
    const csv = [
      ["Order ID", "Customer", "Status", "Amount", "Source", "AWB", "Date"].join(","),
      ...filtered.map(o => [
        o.externalOrderId, o.customerName, o.status,
        o.totalAmount, o.source, o.awbNumber || "", o.createdAt
      ].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
  }

  // Filter
  const now = new Date();
  const filtered = orders.filter((o) => {
    const matchSearch =
      !search ||
      o.externalOrderId.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === "all" || o.status === statusFilter;

    const orderDate = new Date(o.createdAt);
    let matchTime = true;
    if (timeFilter === "today") {
      matchTime = orderDate.toDateString() === now.toDateString();
    } else if (timeFilter === "week") {
      const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
      matchTime = orderDate >= weekAgo;
    } else if (timeFilter === "month") {
      matchTime = orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }

    return matchSearch && matchStatus && matchTime;
  });

  // Stats
  const stats = {
    total: orders.length,
    totalItems: orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0),
    revenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    thisMonth: orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    rto: orders.filter((o) => o.status === "CANCELLED").length,
    inTransit: orders.filter((o) => o.status === "IN_TRANSIT").length,
    cancelled: orders.filter((o) => o.status === "CANCELLED").length,
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-sm text-blue-500 mt-0.5">Orders containing your products</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors bg-white"
          >
            <RotateCcw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors bg-white disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            Sync Orders
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors bg-white"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Stats Row 1 */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        {[
          { label: "Total Orders", value: stats.total, icon: ShoppingCart, color: "border-blue-400 text-blue-500" },
          { label: "Total Items", value: stats.totalItems, icon: Package, color: "border-green-400 text-green-500" },
          { label: "Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "border-yellow-400 text-yellow-500" },
          { label: "This Month", value: stats.thisMonth, icon: Calendar, color: "border-purple-400 text-purple-500" },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl border border-gray-100 border-l-4 ${s.color.split(" ")[0]} p-4 flex items-center gap-3`}>
            <s.icon className={`w-6 h-6 ${s.color.split(" ")[1]}`} />
            <div>
              <p className={`text-xs font-medium ${s.color.split(" ")[1]}`}>{s.label}</p>
              <p className="text-xl font-bold text-gray-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Row 2 */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Delivered", value: stats.delivered, icon: CheckCircle, color: "border-green-400 text-green-500" },
          { label: "RTO", value: stats.rto, icon: RotateCcw, color: "border-orange-400 text-orange-500" },
          { label: "In-Transit", value: stats.inTransit, icon: Truck, color: "border-blue-400 text-blue-500" },
          { label: "Cancelled/Undelivered", value: stats.cancelled, icon: XCircle, color: "border-red-400 text-red-500" },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-xl border border-gray-100 border-l-4 ${s.color.split(" ")[0]} p-4 flex items-center gap-3`}>
            <s.icon className={`w-6 h-6 ${s.color.split(" ")[1]}`} />
            <div>
              <p className={`text-xs font-medium ${s.color.split(" ")[1]}`}>{s.label}</p>
              <p className="text-xl font-bold text-gray-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders, customers, or products..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
        </div>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="NEW">New</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="IN_TRANSIT">In-Transit</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Orders ({filtered.length})</h3>
          <p className="text-xs text-blue-500 mt-0.5">Recent orders containing your products</p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Loading orders...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <ShoppingCart className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No orders found</p>
            <p className="text-sm text-blue-400 mt-1">You don&apos;t have any orders yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Order ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Products</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Seller</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">AWB</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-blue-600">#{order.externalOrderId}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-700">{order.customerName || "—"}</p>
                      <p className="text-xs text-gray-400">{order.customerEmail || ""}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {order.items.map((item, i) => (
                        <p key={i} className="text-xs text-gray-600">{item.name} × {item.quantity}</p>
                      ))}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{order.seller.name}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-800">₹{order.totalAmount.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ORDER_STATUS_COLOR[order.status] || "bg-gray-50 text-gray-600"}`}>
                        {order.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{order.awbNumber || "—"}</td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {new Date(order.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Search,
  MapPin,
  Truck,
  Clock,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface Delivery {
  id: string;
  externalOrderId: string;
  status: string;
  awbNumber: string | null;
  trackingUrl: string | null;
  createdAt: string;
  customerName: string | null;
  customerEmail: string | null;
  customerAddress: { phone?: string } | null;
  courier: string | null;
}

function getDisplayStatus(d: Delivery) {
  if (d.courier?.includes("RTO")) return "RTO";
  return d.status;
}

const STATUS_LABEL: Record<string, string> = {
  SHIPPED: "Shipped", IN_TRANSIT: "In Transit", DELIVERED: "Delivered",
  CANCELLED: "Cancelled", NEW: "New", PROCESSING: "Processing", RTO: "RTO",
};

const STATUS_COLOR: Record<string, string> = {
  SHIPPED: "bg-blue-50 text-blue-600", IN_TRANSIT: "bg-yellow-50 text-yellow-600",
  DELIVERED: "bg-green-50 text-green-600", CANCELLED: "bg-red-50 text-red-600",
  NEW: "bg-gray-100 text-gray-600", PROCESSING: "bg-purple-50 text-purple-600",
  RTO: "bg-orange-50 text-orange-600",
};

interface Stats {
  pending: number;
  delivered: number;
  inTransit: number;
  rto: number;
  cancelled: number;
}

const STAT_CARDS = [
  { key: "pending",   label: "Pending",    icon: Clock,          iconColor: "text-purple-500" },
  { key: "delivered", label: "Delivered",  icon: MapPin,         iconColor: "text-green-500"  },
  { key: "inTransit", label: "In Transit", icon: Truck,          iconColor: "text-blue-500"   },
  { key: "rto",       label: "RTO",        icon: AlertTriangle,  iconColor: "text-orange-500" },
  { key: "cancelled", label: "Cancelled",  icon: XCircle,        iconColor: "text-red-500"    },
];

export default function ManageDeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    delivered: 0,
    inTransit: 0,
    rto: 0,
    cancelled: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const fetchDeliveries = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (statusFilter !== "ALL") params.set("status", statusFilter);
        const res = await fetch(`/api/seller/deliveries?${params}`);
        const data = await res.json();
        setDeliveries(data.orders ?? []);
        if (data.stats) setStats(data.stats);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, statusFilter]
  );

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  async function handleSyncAWB() {
    setSyncing(true); setSyncMsg("");
    const res = await fetch("/api/seller/deliveries/sync-awb", { method: "POST" });
    const data = await res.json();
    setSyncMsg(`Synced ${data.synced ?? 0} AWB(s) from Delhivery`);
    await fetchDeliveries();
    setSyncing(false);
  }

  async function handleRefreshTracking() {
    setRefreshing(true); setSyncMsg("");
    const res = await fetch("/api/seller/deliveries/refresh-tracking", { method: "POST" });
    const data = await res.json();
    setSyncMsg(`Updated ${data.updated ?? 0} order status(es)`);
    await fetchDeliveries(false);
    setRefreshing(false);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Manage Delivery
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track and manage order deliveries from your connected stores
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {syncMsg && <span className="text-xs text-green-600">{syncMsg}</span>}
          <button
            onClick={handleSyncAWB}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
            Sync AWB
          </button>
          <button
            onClick={handleRefreshTracking}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh Tracking
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-5 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, iconColor }) => (
          <div
            key={key}
            className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3"
          >
            <Icon className={`w-6 h-6 ${iconColor}`} />
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats[key as keyof Stats]}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order ID, customer name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 min-w-[160px]"
        >
          <option value="ALL">All Statuses</option>
          <option value="NEW">Pending (New)</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="DELIVERED">Delivered</option>
          <option value="RTO">RTO</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">
            Deliveries ({deliveries.length})
          </h2>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            Loading...
          </div>
        ) : deliveries.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm text-blue-500">
              No orders found for this store
            </p>
            <div className="flex justify-center">
              <Truck className="w-12 h-12 text-gray-200" />
            </div>
            <p className="text-sm text-gray-400">
              No deliveries found matching your criteria.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-medium text-blue-500">Order ID</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-blue-500">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-blue-500">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-blue-500">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-blue-500">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-blue-500">AWB / Tracking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {deliveries.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-blue-600">{d.externalOrderId}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{d.customerName || "—"}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{d.customerAddress?.phone || "—"}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {new Date(d.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3">
                    {(() => { const ds = getDisplayStatus(d); return (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[ds] ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABEL[ds] ?? ds}
                      </span>
                    ); })()}
                  </td>
                  <td className="px-5 py-3">
                    {d.status === "CANCELLED" && !d.awbNumber ? (
                      <span className="text-gray-300 text-xs">—</span>
                    ) : d.awbNumber ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-gray-700 font-mono text-xs">{d.awbNumber}</span>
                        {d.trackingUrl && (
                          <a href={d.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs">
                            Track on Delhivery
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">No AWB</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, ShoppingCart, Truck, AlertTriangle, XCircle, TrendingUp, Calendar } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

interface AnalyticsData {
  totalOrders: number;
  deliveryRate: number;
  deliveredCount: number;
  rtoRate: number;
  rtoCount: number;
  cancelledRate: number;
  cancelledCount: number;
  inTransitRate: number;
  inTransitCount: number;
  totalRevenue: number;
  avgRevenue: number;
  trend: { date: string; delivered: number; rto: number; cancelled: number; total: number }[];
  topProducts: { name: string; sku: string; orders: number; units: number; delPct: number; rtoPct: number }[];
  productDistribution: { name: string; value: number }[];
  store: { storeUrl: string; storeName: string } | null;
}

const PIE_COLORS = ["#3b5bdb", "#40c057", "#fd7e14", "#ae3ec9", "#f03e3e"];

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function toISODate(d: Date) { return d.toISOString().split("T")[0]; }

const PRESETS = [
  { label: "7D",  days: 7 },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "All", days: 0 },
];

export default function SellerAnalyticsPage() {
  const today = toISODate(new Date());
  const d30    = toISODate(new Date(Date.now() - 29 * 86400000));

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [from, setFrom] = useState(d30);
  const [to, setTo]     = useState(today);
  const [preset, setPreset] = useState<number>(30);

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true); else setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to)   params.set("to", to);
    const res = await fetch(`/api/seller/analytics?${params}`);
    setData(await res.json());
    setLoading(false); setRefreshing(false);
  }, [from, to]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function applyPreset(days: number) {
    setPreset(days);
    if (days === 0) {
      setFrom("");
      setTo("");
    } else {
      setFrom(toISODate(new Date(Date.now() - (days - 1) * 86400000)));
      setTo(today);
    }
  }

  const storeName = data?.store?.storeName ?? data?.store?.storeUrl ?? "All Stores";

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Store Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Performance metrics for <span className="text-blue-500 font-medium">{storeName}</span>
          </p>
        </div>

        {/* Date controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Preset buttons */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => applyPreset(p.days)}
                className="px-3 py-1 text-xs font-semibold rounded-md transition-all"
                style={preset === p.days
                  ? { background: "white", color: "#1D4ED8", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                  : { color: "#6B7280" }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom date inputs */}
          <div className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <input type="date" value={from} max={to || today}
              onChange={(e) => { setFrom(e.target.value); setPreset(-1); }}
              className="text-xs outline-none text-gray-700 w-28" />
            <span className="text-gray-300">→</span>
            <input type="date" value={to} min={from} max={today}
              onChange={(e) => { setTo(e.target.value); setPreset(-1); }}
              className="text-xs outline-none text-gray-700 w-28" />
          </div>

          <button onClick={() => fetchData(true)} disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
      ) : (
        <>
          {/* Stat Cards — 5 across */}
          <div className="grid grid-cols-5 gap-4">
            <StatCard
              label="Total Orders"
              value={data?.totalOrders ?? 0}
              sub="All time"
              subColor="text-blue-500"
              icon={<ShoppingCart className="w-6 h-6 text-gray-300" />}
              bg="bg-white"
            />
            <StatCard
              label="Delivery Rate"
              value={`${data?.deliveryRate ?? 0}%`}
              sub={`${data?.deliveredCount ?? 0} Delivered`}
              subColor="text-green-500"
              icon={<Truck className="w-6 h-6 text-green-300" />}
              bg="bg-white"
            />
            <StatCard
              label="In Transit Rate"
              value={`${data?.inTransitRate ?? 0}%`}
              sub={`${data?.inTransitCount ?? 0} In Transit`}
              subColor="text-blue-500"
              icon={<Truck className="w-6 h-6 text-blue-300" />}
              bg="bg-white"
            />
            <StatCard
              label="RTO Rate"
              value={`${data?.rtoRate ?? 0}%`}
              sub={`${data?.rtoCount ?? 0} RTOs`}
              subColor="text-orange-500"
              icon={<AlertTriangle className="w-6 h-6 text-orange-300" />}
              bg="bg-white"
            />
            <StatCard
              label="Cancelled Rate"
              value={`${data?.cancelledRate ?? 0}%`}
              sub={`${data?.cancelledCount ?? 0} Cancelled`}
              subColor="text-red-500"
              icon={<XCircle className="w-6 h-6 text-red-300" />}
              bg="bg-white"
            />
          </div>

          {/* Revenue row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₹{(data?.totalRevenue ?? 0).toFixed(0)}</p>
                <p className="text-xs text-gray-400 mt-1">Avg ₹{(data?.avgRevenue ?? 0).toFixed(0)} per order</p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-2">Order Status Breakdown</p>
              <div className="flex gap-3 flex-wrap">
                {[
                  { label: "Delivered", count: data?.deliveredCount ?? 0, color: "bg-green-500" },
                  { label: "In Transit", count: data?.inTransitCount ?? 0, color: "bg-blue-500" },
                  { label: "RTO", count: data?.rtoCount ?? 0, color: "bg-orange-500" },
                  { label: "Cancelled", count: data?.cancelledCount ?? 0, color: "bg-red-500" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${s.color}`} />
                    <span className="text-xs text-gray-600">{s.label}: <strong>{s.count}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Order Trends</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data?.trend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} />
                  <Tooltip labelFormatter={(v) => fmt(v as string)} contentStyle={{ fontSize: 12 }} />
                  <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="total" stroke="#9ca3af" dot={false} name="Total" />
                  <Line type="monotone" dataKey="delivered" stroke="#40c057" dot={false} name="Delivered" />
                  <Line type="monotone" dataKey="rto" stroke="#fd7e14" dot={false} name="RTO" />
                  <Line type="monotone" dataKey="cancelled" stroke="#f03e3e" dot={false} name="Cancelled" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Product Distribution</h2>
              {(data?.productDistribution?.length ?? 0) > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={data!.productDistribution} cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                      {data!.productDistribution.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">No data</div>
              )}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Top Products</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {["Product Name", "SKU", "Orders", "Units", "Del %", "RTO %"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(data?.topProducts?.length ?? 0) === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">No products data</td></tr>
                ) : data!.topProducts.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-900 font-medium max-w-[200px] truncate">{p.name}</td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                    <td className="px-5 py-3 text-gray-700">{p.orders}</td>
                    <td className="px-5 py-3 text-gray-700">{p.units}</td>
                    <td className="px-5 py-3 text-green-600 font-medium">{p.delPct}%</td>
                    <td className="px-5 py-3 text-orange-500 font-medium">{p.rtoPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, subColor, icon, bg }: {
  label: string; value: string | number; sub: string; subColor: string;
  icon: React.ReactNode; bg: string;
}) {
  return (
    <div className={`${bg} border border-gray-200 rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>
    </div>
  );
}

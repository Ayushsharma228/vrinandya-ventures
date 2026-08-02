"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshCw, ShoppingCart, Truck, AlertTriangle, XCircle, TrendingUp, Calendar, Wallet, BadgeIndianRupee } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
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
  earnings: {
    totalGMV: number;
    totalFees: number;
    totalProductCost: number;
    totalShipping: number;
    totalEarned: number;
    totalRtoCharge: number;
    settledCount: number;
    earningsTrend: { date: string; gmv: number; platformCharges: number; count: number }[];
  };
  wallet: { balance: number; upcoming: number };
}

const PIE_COLORS = ["#3b5bdb", "#40c057", "#fd7e14", "#ae3ec9", "#f03e3e"];

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
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

  // fetchData takes explicit dates so changing the inputs doesn't auto-fire requests
  const fetchData = useCallback(async (fromDate: string, toDate: string, showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true); else setLoading(true);
    const params = new URLSearchParams();
    if (fromDate) params.set("from", fromDate);
    if (toDate)   params.set("to",   toDate);
    const res = await fetch(`/api/seller/analytics?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false); setRefreshing(false);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(d30, today); }, []);

  function applyPreset(days: number) {
    const newFrom = days === 0 ? "" : toISODate(new Date(Date.now() - (days - 1) * 86400000));
    const newTo   = days === 0 ? "" : today;
    setPreset(days);
    setFrom(newFrom);
    setTo(newTo);
    fetchData(newFrom, newTo);   // fetch immediately on preset click
  }

  const storeName = data?.store?.storeName ?? data?.store?.storeUrl ?? "All Stores";

  const dowData = useMemo(() => {
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (!data?.trend?.length) return [];
    const buckets = Array(7).fill(null).map(() => ({ orders: 0, delivered: 0, rto: 0, days: 0 }));
    for (const d of data.trend) {
      const dow = new Date(d.date).getDay();
      buckets[dow].orders += d.total;
      buckets[dow].delivered += d.delivered;
      buckets[dow].rto += d.rto;
      buckets[dow].days += 1;
    }
    return labels.map((name, i) => ({
      name,
      orders: buckets[i].orders,
      delRate: buckets[i].orders > 0 ? Math.round((buckets[i].delivered / buckets[i].orders) * 100) : 0,
      rtoRate: buckets[i].orders > 0 ? Math.round((buckets[i].rto / buckets[i].orders) * 100) : 0,
      avgOrders: buckets[i].days > 0 ? +(buckets[i].orders / buckets[i].days).toFixed(1) : 0,
    }));
  }, [data]);

  const weeklyData = useMemo(() => {
    if (!data?.trend?.length) return [];
    const weeks: Record<string, { weekLabel: string; total: number; delivered: number; rto: number; cancelled: number }> = {};
    for (const d of data.trend) {
      const date = new Date(d.date);
      const day = date.getDay();
      const monday = new Date(date);
      monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
      const key = monday.toISOString().split("T")[0];
      if (!weeks[key]) {
        weeks[key] = {
          weekLabel: monday.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
          total: 0, delivered: 0, rto: 0, cancelled: 0,
        };
      }
      weeks[key].total += d.total;
      weeks[key].delivered += d.delivered;
      weeks[key].rto += d.rto;
      weeks[key].cancelled += d.cancelled;
    }
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({ ...v, inTransit: Math.max(0, v.total - v.delivered - v.rto - v.cancelled) }));
  }, [data]);

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

          {/* Custom date inputs — change dates then click Apply */}
          <div className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input type="date" value={from} max={to || today}
              onChange={(e) => { setFrom(e.target.value); setPreset(-1); }}
              className="text-xs outline-none text-gray-700" style={{ width: "7.5rem" }} />
            <span className="text-gray-300">→</span>
            <input type="date" value={to} min={from} max={today}
              onChange={(e) => { setTo(e.target.value); setPreset(-1); }}
              className="text-xs outline-none text-gray-700" style={{ width: "7.5rem" }} />
          </div>

          <button onClick={() => fetchData(from, to, true)} disabled={refreshing}
            title="Apply / Refresh"
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Earnings summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BadgeIndianRupee className="w-4 h-4 text-green-500" />
              <h2 className="font-semibold text-gray-900">Your Earnings</h2>
              <span className="text-xs text-gray-400 ml-1">({data?.earnings?.settledCount ?? 0} delivered orders in period)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
              {[
                { label: "Gross Revenue",       value: inr(data?.earnings?.totalGMV          ?? 0), color: "text-blue-600" },
                { label: "Product Cost",        value: inr(data?.earnings?.totalProductCost  ?? 0), color: "text-purple-600" },
                { label: "Platform Charges",    value: inr(data?.earnings?.totalFees         ?? 0), color: "text-orange-500" },
                { label: "Shipping",            value: inr(data?.earnings?.totalShipping     ?? 0), color: "text-blue-400" },
                { label: "RTO Charges",         value: inr(data?.earnings?.totalRtoCharge    ?? 0), color: "text-red-500" },
                { label: "Remitted to You",     value: inr(data?.earnings?.totalEarned       ?? 0), color: "text-green-600" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Wallet Balance</p>
                  <p className="text-lg font-bold text-gray-900">{inr(data?.wallet?.balance ?? 0)}</p>
                </div>
                <Wallet className="w-5 h-5 text-gray-300" />
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Upcoming Credits</p>
                  <p className="text-lg font-bold text-green-600">{inr(data?.wallet?.upcoming ?? 0)}</p>
                </div>
                <TrendingUp className="w-5 h-5 text-green-300" />
              </div>
            </div>
            {(data?.earnings?.earningsTrend?.length ?? 0) > 0 && (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data!.earnings.earningsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 10, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip labelFormatter={(v) => fmt(v as string)}
                    formatter={(val) => [inr(Number(val))]}
                    contentStyle={{ fontSize: 12 }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="gmv"             fill="#3b5bdb" name="GMV"               radius={[2,2,0,0]} />
                  <Bar dataKey="platformCharges" fill="#fd7e14" name="Platform Charges" radius={[2,2,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Day-of-week pattern */}
          {dowData.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h2 className="font-semibold text-gray-900">Day-of-Week Patterns</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Which days drive orders and which lose to RTO</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {(() => {
                    const best = [...dowData].sort((a, b) => b.orders - a.orders)[0];
                    const worst = [...dowData].sort((a, b) => b.rtoRate - a.rtoRate)[0];
                    return (
                      <>
                        <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                          Best: {best?.name} ({best?.orders} orders)
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 font-medium">
                          High RTO: {worst?.name} ({worst?.rtoRate}%)
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Orders by Day</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={dowData} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12 }} />
                      <Bar dataKey="orders" name="Total Orders" radius={[4, 4, 0, 0]}
                        fill="#3b5bdb"
                        label={{ position: "top", fontSize: 10, fill: "#6b7280", formatter: (v) => Number(v) > 0 ? v : "" }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Delivery vs RTO Rate</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={dowData} barSize={12}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} unit="%" domain={[0, 100]} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12 }}
                        formatter={(val) => [`${val}%`]} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="delRate" name="Delivery %" fill="#40c057" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="rtoRate" name="RTO %" fill="#fd7e14" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Heatmap row */}
              <div className="mt-4 grid grid-cols-7 gap-1.5">
                {dowData.map((d) => {
                  const intensity = Math.min(1, d.orders / (Math.max(...dowData.map((x) => x.orders)) || 1));
                  const bg = intensity > 0.75 ? "#1d4ed8" : intensity > 0.5 ? "#3b82f6" : intensity > 0.25 ? "#93c5fd" : intensity > 0 ? "#dbeafe" : "#f1f5f9";
                  const textColor = intensity > 0.5 ? "white" : "#374151";
                  return (
                    <div key={d.name} className="rounded-lg p-2 text-center" style={{ background: bg }}>
                      <p className="text-xs font-semibold" style={{ color: textColor }}>{d.name}</p>
                      <p className="text-sm font-bold mt-0.5" style={{ color: textColor }}>{d.orders}</p>
                      <p className="text-xs mt-0.5" style={{ color: intensity > 0.5 ? "rgba(255,255,255,0.8)" : "#6b7280" }}>
                        {d.avgOrders}/day
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weekly cohort */}
          {weeklyData.length > 1 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="mb-4">
                <h2 className="font-semibold text-gray-900">Weekly Cohort View</h2>
                <p className="text-xs text-gray-400 mt-0.5">Orders, deliveries, RTO and in-transit grouped by week placed</p>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyData} barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="weekLabel" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="delivered" name="Delivered" stackId="a" fill="#40c057" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="inTransit" name="In Transit" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="rto" name="RTO" stackId="a" fill="#fd7e14" />
                  <Bar dataKey="cancelled" name="Cancelled" stackId="a" fill="#f03e3e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {/* Cohort table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["Week of", "Orders", "Delivered", "In Transit", "RTO", "Cancelled", "Del %", "RTO %"].map((h) => (
                        <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {weeklyData.map((w, i) => {
                      const delPct = w.total > 0 ? Math.round((w.delivered / w.total) * 100) : 0;
                      const rtoPct = w.total > 0 ? Math.round((w.rto / w.total) * 100) : 0;
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-600 font-medium text-xs">{w.weekLabel}</td>
                          <td className="px-3 py-2 text-gray-900 font-semibold">{w.total}</td>
                          <td className="px-3 py-2 text-green-600">{w.delivered}</td>
                          <td className="px-3 py-2 text-blue-500">{w.inTransit}</td>
                          <td className="px-3 py-2 text-orange-500">{w.rto}</td>
                          <td className="px-3 py-2 text-red-500">{w.cancelled}</td>
                          <td className="px-3 py-2">
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${delPct >= 70 ? "bg-green-50 text-green-700" : delPct >= 50 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"}`}>
                              {delPct}%
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${rtoPct <= 15 ? "bg-green-50 text-green-700" : rtoPct <= 25 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"}`}>
                              {rtoPct}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top Products */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Top Products</h2>
            </div>
            <div className="overflow-x-auto"><table className="w-full text-sm">
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
            </table></div>
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

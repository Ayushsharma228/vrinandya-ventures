"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  ShoppingCart,
  Truck,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface TrendPoint {
  date: string;
  delivered?: number;
  rto?: number;
  total?: number;
  orders?: number;
}

interface TopProduct {
  name: string;
  sku: string;
  orders: number;
  units: number;
  delPct: number;
  rtoPct: number;
}

interface PiePoint {
  name: string;
  value: number;
}

interface DeliveredData {
  mode: "delivered";
  totalOrders: number;
  deliveryRate: number;
  rtoRate: number;
  inTransit: number;
  deliveredCount: number;
  rtoCount: number;
  trend: TrendPoint[];
  topProducts: TopProduct[];
  productDistribution: PiePoint[];
  store: { storeUrl: string; storeName: string } | null;
}

interface SyncedData {
  mode: "synced";
  totalOrders: number;
  totalRevenue: number;
  avgRevenue: number;
  trend: TrendPoint[];
  productDistribution: PiePoint[];
  store: { storeUrl: string; storeName: string } | null;
}

type AnalyticsData = DeliveredData | SyncedData;

const PIE_COLORS = ["#3b5bdb", "#40c057", "#fd7e14", "#ae3ec9", "#f03e3e"];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function SellerAnalyticsPage() {
  const today = new Date();
  const thirtyAgo = new Date(today);
  thirtyAgo.setDate(today.getDate() - 30);

  const [tab, setTab] = useState<"delivered" | "synced">("delivered");
  const [productTab, setProductTab] = useState<"top" | "region">("top");
  const [distTab, setDistTab] = useState<"all" | "delivered">("all");
  const [from, setFrom] = useState(toInputDate(thirtyAgo));
  const [to, setTo] = useState(toInputDate(today));
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      try {
        const params = new URLSearchParams({ from, to, mode: tab });
        const res = await fetch(`/api/seller/analytics?${params}`);
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [from, to, tab]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const storeName =
    data?.store?.storeName ?? data?.store?.storeUrl ?? "All Stores";

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Store Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Performance metrics for your store
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Store selector (read-only for now) */}
          <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm text-gray-700 min-w-[140px] gap-2">
            <span className="flex-1">{storeName}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          {/* Date range */}
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => {
              setFrom(toInputDate(today));
              setTo(toInputDate(today));
            }}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700"
          >
            Today
          </button>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-0">
        {(["delivered", "synced"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "delivered" ? "Delivered Orders" : "Synced Orders"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
      ) : tab === "delivered" ? (
        <DeliveredView
          data={data as DeliveredData | null}
          productTab={productTab}
          setProductTab={setProductTab}
          distTab={distTab}
          setDistTab={setDistTab}
        />
      ) : (
        <SyncedView data={data as SyncedData | null} />
      )}
    </div>
  );
}

function DeliveredView({
  data,
  productTab,
  setProductTab,
  distTab,
  setDistTab,
}: {
  data: DeliveredData | null;
  productTab: "top" | "region";
  setProductTab: (v: "top" | "region") => void;
  distTab: "all" | "delivered";
  setDistTab: (v: "all" | "delivered") => void;
}) {
  return (
    <div className="space-y-5">
      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Orders"
          value={data?.totalOrders ?? 0}
          sub="Orders in selected period"
          subColor="text-blue-500"
          icon={<ShoppingCart className="w-6 h-6 text-gray-300" />}
        />
        <StatCard
          label="Delivery Rate"
          value={`${data?.deliveryRate ?? 0}%`}
          sub={`${data?.deliveredCount ?? 0} Delivered`}
          subColor="text-green-500"
          icon={<Truck className="w-6 h-6 text-green-300" />}
        />
        <StatCard
          label="RTO Rate"
          value={`${data?.rtoRate ?? 0}%`}
          sub={`${data?.rtoCount ?? 0} RTOs`}
          subColor="text-orange-500"
          icon={<AlertTriangle className="w-6 h-6 text-orange-300" />}
        />
        <StatCard
          label="In Transit Orders"
          value={data?.inTransit ?? 0}
          sub="Orders currently in transit"
          subColor="text-blue-500"
          icon={<Truck className="w-6 h-6 text-blue-300" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Order Trends</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.trend ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
              />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} />
              <Tooltip
                labelFormatter={(v) => formatDate(v as string)}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend
                iconType="square"
                iconSize={10}
                wrapperStyle={{ fontSize: 12 }}
              />
              <Line type="monotone" dataKey="delivered" stroke="#40c057" dot={false} name="Delivered" />
              <Line type="monotone" dataKey="rto" stroke="#f03e3e" dot={false} name="RTO" />
              <Line type="monotone" dataKey="total" stroke="#9ca3af" dot={false} name="Total" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Product Distribution</h2>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden text-xs">
              {(["all", "delivered"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDistTab(t)}
                  className={`px-3 py-1.5 transition-colors ${
                    distTab === t
                      ? "bg-white text-gray-800 font-medium"
                      : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  {t === "all" ? "All Orders" : "Delivered"}
                </button>
              ))}
            </div>
          </div>
          {(data?.productDistribution?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data!.productDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                >
                  {data!.productDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Bottom tabs */}
      <div className="flex gap-2">
        {(["top", "region"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setProductTab(t)}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              productTab === t
                ? "bg-white text-gray-800 border-gray-200 font-medium"
                : "bg-gray-100 text-gray-500 border-gray-100 hover:bg-gray-200"
            }`}
          >
            {t === "top" ? "Top Products" : "Region Performance"}
          </button>
        ))}
      </div>

      {productTab === "top" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Top Products</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["PRODUCT NAME", "SKU", "ORDERS", "UNITS", "DEL %", "RTO %"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.topProducts?.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                    No products data available
                  </td>
                </tr>
              ) : (
                data!.topProducts.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-900 font-medium max-w-[200px] truncate">{p.name}</td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">{p.sku}</td>
                    <td className="px-5 py-3 text-gray-700">{p.orders}</td>
                    <td className="px-5 py-3 text-gray-700">{p.units}</td>
                    <td className="px-5 py-3 text-green-600 font-medium">{p.delPct}%</td>
                    <td className="px-5 py-3 text-red-500 font-medium">{p.rtoPct}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {productTab === "region" && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
          Region performance data coming soon.
        </div>
      )}
    </div>
  );
}

function SyncedView({ data }: { data: SyncedData | null }) {
  return (
    <div className="space-y-5">
      <button className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700">
        <RefreshCw className="w-4 h-4" />
        Sync Store
      </button>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{data?.totalOrders ?? 0}</p>
            <p className="text-xs text-blue-500 mt-1">Synced from Shopify</p>
          </div>
          <ShoppingCart className="w-7 h-7 text-gray-300" />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              ₹{data?.totalRevenue?.toFixed(0) ?? 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Avg: ₹{data?.avgRevenue?.toFixed(0) ?? 0}
            </p>
          </div>
          <DollarSign className="w-7 h-7 text-green-400" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">
            Order Trend (by Shopify Date)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.trend ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
              />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} allowDecimals={false} />
              <Tooltip
                labelFormatter={(v) => formatDate(v as string)}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="orders" stroke="#3b5bdb" dot={false} name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Product Distribution</h2>
          {(data?.productDistribution?.length ?? 0) > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data!.productDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                >
                  {data!.productDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  subColor,
  icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  subColor: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>
    </div>
  );
}

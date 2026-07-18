"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, TrendingUp, ShoppingCart, Truck, Users,
  Calendar, BadgeIndianRupee, ArrowUpRight, BanknoteIcon,
  UserCheck, MessageCircle, Zap,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { PageHero } from "@/components/layout/page-hero";

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface OrdersData {
  trend:           { date: string; total: number; delivered: number; rto: number; cancelled: number; revenue: number }[];
  totalOrders:     number;
  deliveredOrders: number;
  rtoOrders:       number;
  cancelledOrders: number;
  activeOrders:    number;
  totalRevenue:    number;
}

interface SettlementsData {
  count:            number;
  grossRevenue:     number;
  platformFee:      number;
  gstOnFees:        number;
  netPayable:       number;
  supplierPayable:  number;
  platformEarnings: number;
  trend:            { date: string; count: number; grossRevenue: number; platformEarnings: number; netPayable: number }[];
  byStatus:         Record<string, number>;
  funnel:           Record<string, number>;
}

interface TopSeller {
  id: string; name: string | null; email: string; brandName: string | null;
  orderCount: number; gmv: number; platformEarnings: number; netPayable: number;
}

interface AnalyticsData {
  period:              { from: string | null; to: string | null };
  orders:              OrdersData;
  settlements:         SettlementsData;
  topSellers:          TopSeller[];
  supplierPayments:    { totalPaid: number; count: number };
  activeSellers:       number;
  pendingWithdrawals:  { count: number; amount: number };
  leads:               { total: number; qualified: number; byStage: Record<string, number> };
  whatsapp:            Record<string, number>;
  activation:          Record<string, number>;
  remittances:         {
    netPaidToSellers: number; count: number; platformCharges: number;
    productCost: number; shipping: number; gmv: number;
    revenueTrend: { date: string; gmv: number; platformCharges: number; productCost: number }[];
  };
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
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

const PIE_COLORS = ["#00C67A", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"];

/* ─── Sub-components ─────────────────────────────────────────────────────── */
function KpiCard({
  label, value, sub, subColor, icon,
}: {
  label: string; value: string; sub: string; subColor?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-400)" }}>{label}</p>
        {icon && <div className="opacity-60">{icon}</div>}
      </div>
      <p className="text-2xl font-bold" style={{ color: "var(--text-900)" }}>{value}</p>
      <p className="text-xs mt-1.5 font-medium" style={{ color: subColor ?? "var(--text-400)" }}>{sub}</p>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
export default function AdminAnalyticsPage() {
  const today = toISODate(new Date());
  const d30   = toISODate(new Date(Date.now() - 29 * 86400000));

  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom]       = useState(d30);
  const [to, setTo]           = useState(today);
  const [preset, setPreset]   = useState<number>(30);

  const fetchData = useCallback(async (fromDate: string, toDate: string) => {
    setLoading(true);
    const p = new URLSearchParams();
    if (fromDate) p.set("from", fromDate);
    if (toDate)   p.set("to",   toDate);
    const res = await fetch(`/api/admin/analytics?${p}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(d30, today); }, []);

  function applyPreset(days: number) {
    const newFrom = days === 0 ? "" : toISODate(new Date(Date.now() - (days - 1) * 86400000));
    const newTo   = days === 0 ? "" : today;
    setPreset(days); setFrom(newFrom); setTo(newTo);
    fetchData(newFrom, newTo);
  }

  const s = data?.settlements;
  const o = data?.orders;

  const deliveryRate = o && o.totalOrders > 0
    ? Math.round((o.deliveredOrders / o.totalOrders) * 100)
    : 0;


  // settlement funnel for pie
  const funnelPieData = s
    ? Object.entries(s.funnel).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Analytics"
        subtitle="Platform-wide performance & financial overview"
        cards={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total GMV",           value: inr(data?.remittances?.gmv ?? s?.grossRevenue ?? 0),              color: "#00C67A" },
              { label: "Platform Charges",    value: inr(data?.remittances?.platformCharges ?? s?.platformFee ?? 0),   color: "#3B82F6" },
              { label: "Active Sellers",      value: String(data?.activeSellers ?? 0),                                  color: "#8B5CF6" },
              { label: "Pending Payouts",     value: String(data?.pendingWithdrawals.count ?? 0),                       color: "#F59E0B" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl px-5 py-4"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p className="text-xs font-medium uppercase tracking-wide mb-1"
                  style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        }
      />

      <div className="px-4 md:px-8 py-6 space-y-6">

        {/* Date controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 rounded-lg p-1"
            style={{ background: "var(--bg-muted)", border: "1px solid var(--border)" }}>
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => applyPreset(p.days)}
                className="px-3 py-1 text-xs font-semibold rounded-md transition-all"
                style={preset === p.days
                  ? { background: "var(--bg-card)", color: "var(--accent)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                  : { color: "var(--text-400)" }}>
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-sm rounded-lg px-3 py-1.5"
            style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}>
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-400)" }} />
            <input type="date" value={from} max={to || today}
              onChange={(e) => { setFrom(e.target.value); setPreset(-1); }}
              className="text-xs outline-none" style={{ width: "7.5rem", background: "transparent", color: "var(--text-900)" }} />
            <span style={{ color: "var(--border)" }}>→</span>
            <input type="date" value={to} min={from} max={today}
              onChange={(e) => { setTo(e.target.value); setPreset(-1); }}
              className="text-xs outline-none" style={{ width: "7.5rem", background: "transparent", color: "var(--text-900)" }} />
          </div>

          <button onClick={() => fetchData(from, to)} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-white rounded-lg disabled:opacity-50"
            style={{ background: "var(--accent)" }}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Apply
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm" style={{ color: "var(--text-400)" }}>Loading analytics…</div>
        ) : !data ? null : (
          <>
            {/* ── KPI tiles ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KpiCard label="Total Orders"    value={String(o?.totalOrders ?? 0)}
                sub={`${o?.activeOrders ?? 0} active`}
                icon={<ShoppingCart className="w-5 h-5" style={{ color: "#3B82F6" }} />} />
              <KpiCard label="Delivery Rate"   value={`${deliveryRate}%`}
                sub={`${o?.deliveredOrders ?? 0} delivered`} subColor="#00C67A"
                icon={<Truck className="w-5 h-5" style={{ color: "#00C67A" }} />} />
              <KpiCard label="RTO Rate"        value={`${o && o.totalOrders > 0 ? Math.round((o.rtoOrders / o.totalOrders) * 100) : 0}%`}
                sub={`${o?.rtoOrders ?? 0} orders`} subColor="#F59E0B"
                icon={<TrendingUp className="w-5 h-5" style={{ color: "#F59E0B" }} />} />
              <KpiCard label="Active Sellers"  value={String(data.activeSellers)}
                sub="KYC approved"
                icon={<Users className="w-5 h-5" style={{ color: "#8B5CF6" }} />} />
              <KpiCard label="Platform Charges" value={inr(data.remittances?.platformCharges ?? 0)}
                sub={`Product cost ${inr(data.remittances?.productCost ?? 0)}`} subColor="#8B5CF6"
                icon={<BadgeIndianRupee className="w-5 h-5" style={{ color: "#8B5CF6" }} />} />
              <KpiCard label="Net to Sellers"  value={inr(data.remittances?.netPaidToSellers ?? 0)}
                sub={`${data.remittances?.count ?? 0} remittances done`}
                icon={<ArrowUpRight className="w-5 h-5" style={{ color: "#3B82F6" }} />} />
              <KpiCard label="Supplier Paid"   value={inr(data.supplierPayments.totalPaid)}
                sub={`${data.supplierPayments.count} payments`}
                icon={<Users className="w-5 h-5" style={{ color: "#F59E0B" }} />} />
              <KpiCard label="Pending Payouts" value={inr(data.pendingWithdrawals.amount)}
                sub={`${data.pendingWithdrawals.count} requests`} subColor="#EF4444"
                icon={<BanknoteIcon className="w-5 h-5" style={{ color: "#EF4444" }} />} />
            </div>

            {/* ── Order trend chart ──────────────────────────────────────── */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-900)" }}>
                Order Trends
              </h2>
              {(o?.trend?.length ?? 0) === 0 ? (
                <div className="h-52 flex items-center justify-center text-sm" style={{ color: "var(--text-400)" }}>No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={o!.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 10, fill: "var(--text-400)" }} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--text-400)" }} allowDecimals={false} />
                    <Tooltip labelFormatter={(v) => fmt(v as string)} contentStyle={{ fontSize: 12, background: "var(--bg-card)", border: "1px solid var(--border)" }} />
                    <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="total"     stroke="#9ca3af"  dot={false} name="Total" />
                    <Line type="monotone" dataKey="delivered" stroke="#00C67A"  dot={false} name="Delivered" />
                    <Line type="monotone" dataKey="rto"       stroke="#F59E0B"  dot={false} name="RTO" />
                    <Line type="monotone" dataKey="cancelled" stroke="#EF4444"  dot={false} name="Cancelled" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* ── Revenue & funnel row ───────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Revenue trend */}
              <div className="card p-5">
                <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-900)" }}>
                  Revenue Trend <span className="text-xs font-normal ml-1" style={{ color: "var(--text-400)" }}>(from orders)</span>
                </h2>
                {(data.remittances?.revenueTrend?.length ?? 0) === 0 ? (
                  <div className="h-52 flex items-center justify-center text-sm" style={{ color: "var(--text-400)" }}>No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.remittances.revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 10, fill: "var(--text-400)" }} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--text-400)" }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        labelFormatter={(v) => fmt(v as string)}
                        formatter={(val: unknown) => [inr(Number(val))]}
                        contentStyle={{ fontSize: 12, background: "var(--bg-card)", border: "1px solid var(--border)" }} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="gmv"             fill="#3B82F6" name="GMV"               radius={[2,2,0,0]} />
                      <Bar dataKey="platformCharges" fill="#F59E0B" name="Platform Charges"  radius={[2,2,0,0]} />
                      <Bar dataKey="productCost"     fill="#8B5CF6" name="Product Cost"      radius={[2,2,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Settlement funnel pie */}
              <div className="card p-5">
                <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-900)" }}>
                  Settlement Funnel <span className="text-xs font-normal ml-1" style={{ color: "var(--text-400)" }}>(all-time)</span>
                </h2>
                {funnelPieData.length === 0 ? (
                  <div className="h-52 flex items-center justify-center text-sm" style={{ color: "var(--text-400)" }}>No settlements yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={funnelPieData} cx="50%" cy="50%"
                        innerRadius={50} outerRadius={80} dataKey="value" nameKey="name">
                        {funnelPieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, background: "var(--bg-card)", border: "1px solid var(--border)" }} />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {/* Status bar */}
                {s && Object.keys(s.byStatus).length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {Object.entries(s.byStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs"
                        style={{ background: "var(--bg-muted)" }}>
                        <span style={{ color: "var(--text-400)" }}>{status}</span>
                        <span className="font-bold" style={{ color: "var(--text-900)" }}>{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Top sellers table ──────────────────────────────────────── */}
            <div className="card overflow-hidden">
              <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>
                  Top Sellers by GMV
                </h2>
              </div>
              {data.topSellers.length === 0 ? (
                <div className="py-12 text-center text-sm" style={{ color: "var(--text-400)" }}>
                  No seller data in this period
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
                        {["#", "Seller", "Orders", "GMV", "Platform Earnings", "Net to Seller"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                            style={{ color: "var(--text-400)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                      {data.topSellers.map((seller, idx) => (
                        <tr key={seller.id} className="hover:bg-gray-50/20">
                          <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-400)" }}>
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs font-semibold" style={{ color: "var(--text-900)" }}>
                              {seller.brandName ?? seller.name ?? seller.email}
                            </p>
                            <p className="text-xs" style={{ color: "var(--text-400)" }}>{seller.email}</p>
                          </td>
                          <td className="px-4 py-3 text-xs font-medium" style={{ color: "var(--text-900)" }}>
                            {seller.orderCount}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold" style={{ color: "#3B82F6" }}>
                            {inr(seller.gmv)}
                          </td>
                          <td className="px-4 py-3 text-xs font-bold" style={{ color: "#00C67A" }}>
                            {inr(seller.platformEarnings)}
                          </td>
                          <td className="px-4 py-3 text-xs font-medium" style={{ color: "#8B5CF6" }}>
                            {inr(seller.netPayable)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Finance summary bar ────────────────────────────────────── */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-900)" }}>Financial Breakdown</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {[
                  { label: "Gross Revenue",     value: inr(s?.grossRevenue ?? 0),       color: "#3B82F6" },
                  { label: "Platform Fee",       value: inr(s?.platformFee ?? 0),        color: "#8B5CF6" },
                  { label: "GST on Fees",        value: inr(s?.gstOnFees ?? 0),          color: "#F59E0B" },
                  { label: "Platform Earnings",  value: inr(s?.platformEarnings ?? 0),   color: "#00C67A" },
                  { label: "Supplier Payable",   value: inr(s?.supplierPayable ?? 0),    color: "#EF4444" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center rounded-xl py-4 px-3"
                    style={{ background: "var(--bg-muted)", border: "1px solid var(--border)" }}>
                    <p className="text-xs mb-1" style={{ color: "var(--text-400)" }}>{label}</p>
                    <p className="text-base font-bold" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Sales & CRM ────────────────────────────────────────────── */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Sales & CRM</h2>

              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <KpiCard label="Total Leads"      value={String(data.leads.total)}
                  sub="all time"
                  icon={<UserCheck className="w-5 h-5" style={{ color: "#3B82F6" }} />} />
                <KpiCard label="Qualified"         value={String(data.leads.qualified)}
                  sub={`${data.leads.total > 0 ? Math.round((data.leads.qualified / data.leads.total) * 100) : 0}% conversion`}
                  subColor="#00C67A"
                  icon={<Zap className="w-5 h-5" style={{ color: "#00C67A" }} />} />
                <KpiCard label="WA Conversations"  value={String(Object.values(data.whatsapp).reduce((a, b) => a + b, 0))}
                  sub={`${data.whatsapp["QUALIFIED"] ?? 0} qualified`}
                  icon={<MessageCircle className="w-5 h-5" style={{ color: "#8B5CF6" }} />} />
                <KpiCard label="Clients Won"       value={String(data.leads.byStage["CLIENT"] ?? 0)}
                  sub="pipeline stage: CLIENT"
                  subColor="#00C67A"
                  icon={<Users className="w-5 h-5" style={{ color: "#00C67A" }} />} />
              </div>

              {/* Lead pipeline bar */}
              {Object.keys(data.leads.byStage).length > 0 && (
                <div className="card p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: "var(--text-400)" }}>
                    Lead Pipeline Breakdown
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={Object.entries(data.leads.byStage).map(([stage, count]) => ({ stage: stage.replace(/_/g, " "), count }))}
                      layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "var(--text-400)" }} allowDecimals={false} />
                      <YAxis type="category" dataKey="stage" tick={{ fontSize: 9, fill: "var(--text-400)" }} width={120} />
                      <Tooltip contentStyle={{ fontSize: 12, background: "var(--bg-card)", border: "1px solid var(--border)" }} />
                      <Bar dataKey="count" fill="#3B82F6" radius={[0, 3, 3, 0]} name="Leads" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* WhatsApp status breakdown */}
              {Object.keys(data.whatsapp).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { key: "ACTIVE",     label: "Active",     color: "#3B82F6" },
                    { key: "QUALIFIED",  label: "Qualified",  color: "#00C67A" },
                    { key: "HANDED_OFF", label: "Handed Off", color: "#8B5CF6" },
                    { key: "CLOSED",     label: "Closed",     color: "#9CA3AF" },
                    { key: "OPTED_OUT",  label: "Opted Out",  color: "#EF4444" },
                  ].map(({ key, label, color }) => (
                    <div key={key} className="rounded-xl px-4 py-3 text-center"
                      style={{ background: "var(--bg-card)", border: `1px solid var(--border)` }}>
                      <p className="text-xs mb-1" style={{ color: "var(--text-400)" }}>WA {label}</p>
                      <p className="text-xl font-bold" style={{ color }}>{data.whatsapp[key] ?? 0}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Seller Activation Funnel ───────────────────────────────── */}
            {Object.keys(data.activation).length > 0 && (
              <div className="card p-5">
                <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-900)" }}>Seller Activation Funnel</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Object.entries(data.activation)
                    .sort((a, b) => b[1] - a[1])
                    .map(([stage, count]) => {
                      const isGood = stage === "ACTIVATED";
                      const isBad  = stage === "STALLED" || stage === "BLOCKED";
                      const color  = isGood ? "#00C67A" : isBad ? "#EF4444" : "#3B82F6";
                      return (
                        <div key={stage} className="rounded-xl px-4 py-3"
                          style={{ background: "var(--bg-muted)", border: "1px solid var(--border)" }}>
                          <p className="text-xs mb-1 truncate" style={{ color: "var(--text-400)" }}>
                            {stage.replace(/_/g, " ")}
                          </p>
                          <p className="text-xl font-bold" style={{ color }}>{count}</p>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

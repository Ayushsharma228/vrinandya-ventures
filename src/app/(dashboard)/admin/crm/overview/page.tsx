"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, AlertCircle, ArrowRight, Users,
  Target, CheckCircle2, BarChart2,
} from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// ── Constants ────────────────────────────────────────────────────────────────

const STAGE_LABEL: Record<string, string> = {
  LEAD: "Lead", CALL_NOT_PICKED: "Call Not Picked", BUSY: "Busy",
  SCHEDULE_MEETING: "Schedule Meeting", NOT_INTERESTED: "Not Interested",
  PROSPECT: "Prospect", INTERESTED: "Interested", WILL_PAY: "Will Pay",
  PAID: "Paid", ONBOARDED: "Onboarded", WEBSITE_DONE: "Website Done",
  ENGAGEMENT_LIVE: "Engagement Live", ADS_LIVE: "Ads Live",
};
const STAGE_COLOR: Record<string, string> = {
  LEAD: "#9CA3AF", CALL_NOT_PICKED: "#F59E0B", BUSY: "#F59E0B",
  SCHEDULE_MEETING: "#3B82F6", NOT_INTERESTED: "#EF4444",
  PROSPECT: "#7C3AED", INTERESTED: "#7C3AED", WILL_PAY: "#F97316",
  PAID: "#16A34A", ONBOARDED: "#16A34A", WEBSITE_DONE: "#16A34A",
  ENGAGEMENT_LIVE: "#059669", ADS_LIVE: "#059669",
};
const SOURCE_LABEL: Record<string, string> = {
  META_ADS: "Meta Ads", WEBSITE: "Website Form", MANUAL: "Manual",
};
const SOURCE_COLOR: Record<string, string> = {
  META_ADS: "#3B82F6", WEBSITE: "#7C3AED", MANUAL: "#9CA3AF",
};

// ── Types ────────────────────────────────────────────────────────────────────

interface OverviewData {
  totalLeads: number;
  thisMonthLeads: number;
  lastMonthLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  overdueFollowUps: number;
  byStage:       { stage: string; count: number }[];
  bySource:      { source: string; count: number }[];
  activityCells: { date: string; count: number }[];
  topReps:       { id: string; name: string; title: string | null; total: number; won: number; rate: number }[];
  recentLeads:   { id: string; name: string; stage: string; source: string; createdAt: string; assignedTo: string | null }[];
}

// ── Heatmap ──────────────────────────────────────────────────────────────────

function HeatmapGrid({ cells }: { cells: { date: string; count: number }[] }) {
  const maxCount = Math.max(...cells.map(c => c.count), 1);
  const CELL = 10, GAP = 2, STRIDE = CELL + GAP;

  const firstDay = cells[0] ? new Date(cells[0].date + "T00:00:00").getDay() : 0;
  const padded: ({ date: string; count: number } | null)[] = [...Array(firstDay).fill(null), ...cells];
  const weeks: ({ date: string; count: number } | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    const week = padded.slice(i, i + 7);
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const getColor = (count: number) => {
    if (count === 0) return "var(--bg-muted)";
    const r = count / maxCount;
    if (r < 0.25) return "rgba(0,198,122,0.28)";
    if (r < 0.5)  return "rgba(0,198,122,0.52)";
    if (r < 0.75) return "rgba(0,198,122,0.76)";
    return "#00C67A";
  };

  const SVG_W = 20 + weeks.length * STRIDE;
  const SVG_H = 18 + 7 * STRIDE;

  return (
    <svg width={SVG_W} height={SVG_H}>
      {[1, 3, 5].map(i => (
        <text key={i} x={8} y={18 + i * STRIDE + CELL / 2 + 3}
          fontSize={7} fill="var(--text-400)" textAnchor="middle">
          {["S","M","T","W","T","F","S"][i]}
        </text>
      ))}
      {weeks.map((week, wi) =>
        week.map((cell, di) => (
          <rect key={`${wi}-${di}`}
            x={20 + wi * STRIDE} y={18 + di * STRIDE}
            width={CELL} height={CELL} rx={2}
            fill={cell ? getColor(cell.count) : "transparent"}
          >
            {cell && <title>{cell.date}: {cell.count} lead{cell.count !== 1 ? "s" : ""}</title>}
          </rect>
        ))
      )}
    </svg>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CRMOverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/crm/overview")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm" style={{ color: "var(--text-400)" }}>Loading CRM overview…</p>
      </div>
    );
  }

  const trendPct = data.lastMonthLeads > 0
    ? Math.round(((data.thisMonthLeads - data.lastMonthLeads) / data.lastMonthLeads) * 100)
    : data.thisMonthLeads > 0 ? 100 : 0;

  const conversionRate = data.totalLeads > 0
    ? Math.round((data.convertedLeads / data.totalLeads) * 100) : 0;
  const qualifiedRate = data.totalLeads > 0
    ? Math.round((data.qualifiedLeads / data.totalLeads) * 100) : 0;

  const donutData = [
    { name: "Qualified", value: data.qualifiedLeads },
    { name: "Other", value: Math.max(0, data.totalLeads - data.qualifiedLeads) },
  ];

  const dailyData = data.activityCells.slice(-30).map(c => ({
    date: c.date.slice(5),
    count: c.count,
  }));

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHero
        title="CRM Overview"
        description="Pipeline health, team performance, and lead activity at a glance"
        actions={
          <Link href="/admin/crm"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: "var(--bg-muted)", color: "var(--text-600)" }}>
            All Leads <ArrowRight className="w-3 h-3" />
          </Link>
        }
      />

      <div className="px-6 space-y-5">

        {/* ── KPI Row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Total + Qualified donut */}
          <div className="card p-5 flex items-center gap-4">
            <PieChart width={70} height={70}>
              <Pie data={donutData} cx={31} cy={31} innerRadius={20} outerRadius={31}
                dataKey="value" strokeWidth={0} startAngle={90} endAngle={-270}>
                <Cell fill="#00C67A" />
                <Cell fill="var(--bg-muted)" />
              </Pie>
            </PieChart>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-400)" }}>
                Total Leads
              </p>
              <p className="text-2xl font-bold mt-0.5 leading-none" style={{ color: "var(--text-900)" }}>
                {data.totalLeads.toLocaleString()}
              </p>
              <p className="text-xs mt-1 font-medium" style={{ color: "#00C67A" }}>
                {qualifiedRate}% qualified
              </p>
            </div>
          </div>

          {/* This Month + sparkline */}
          <div className="card p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-400)" }}>
                  This Month
                </p>
                <p className="text-2xl font-bold mt-0.5 leading-none" style={{ color: "var(--text-900)" }}>
                  {data.thisMonthLeads.toLocaleString()}
                </p>
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                trendPct >= 0 ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"
              }`}>
                {trendPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(trendPct)}%
              </span>
            </div>
            <p className="text-xs mb-2" style={{ color: "var(--text-400)" }}>
              vs {data.lastMonthLeads} last month
            </p>
            <ResponsiveContainer width="100%" height={32}>
              <BarChart data={dailyData.slice(-14)} barSize={4} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Bar dataKey="count" fill="#00C67A" radius={[2, 2, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Converted */}
          <div className="card p-5" style={{ borderLeft: "4px solid #16A34A" }}>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#16A34A" }} />
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-400)" }}>
                Converted
              </p>
            </div>
            <p className="text-2xl font-bold leading-none" style={{ color: "var(--text-900)" }}>
              {data.convertedLeads.toLocaleString()}
            </p>
            <p className="text-xs mt-1 font-medium" style={{ color: "#16A34A" }}>
              {conversionRate}% conversion rate
            </p>
            <div className="mt-3 h-1.5 rounded-full" style={{ background: "var(--bg-muted)" }}>
              <div className="h-1.5 rounded-full transition-all"
                style={{ width: `${conversionRate}%`, background: "#16A34A" }} />
            </div>
          </div>

          {/* Overdue */}
          <div className="card p-5" style={{ borderLeft: `4px solid ${data.overdueFollowUps > 0 ? "#EF4444" : "#9CA3AF"}` }}>
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 flex-shrink-0"
                style={{ color: data.overdueFollowUps > 0 ? "#EF4444" : "#9CA3AF" }} />
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-400)" }}>
                Overdue Follow-ups
              </p>
            </div>
            <p className="text-2xl font-bold leading-none"
              style={{ color: data.overdueFollowUps > 0 ? "#EF4444" : "var(--text-900)" }}>
              {data.overdueFollowUps.toLocaleString()}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-400)" }}>
              {data.overdueFollowUps === 0 ? "All follow-ups on track" : "leads missed their follow-up"}
            </p>
            {data.overdueFollowUps > 0 && (
              <Link href="/admin/crm"
                className="mt-2 flex items-center gap-1 text-xs font-semibold"
                style={{ color: "#EF4444" }}>
                View overdue <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        {/* ── Lead Volume + Heatmap ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Bar chart — 2/3 */}
          <div className="lg:col-span-2 card p-5">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>
              Lead Volume — Last 30 Days
            </h2>
            <p className="text-xs mt-0.5 mb-4" style={{ color: "var(--text-400)" }}>
              New leads added to pipeline per day
            </p>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={dailyData} barSize={9} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--text-400)" }}
                  tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fontSize: 9, fill: "var(--text-400)" }}
                  tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "var(--bg-muted)", radius: 4 }}
                  contentStyle={{ fontSize: 12, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}
                  formatter={(v) => [v, "Leads"]}
                />
                <Bar dataKey="count" fill="#00C67A" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Heatmap — 1/3 */}
          <div className="card p-5 flex flex-col">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>
              Activity Heatmap
            </h2>
            <p className="text-xs mt-0.5 mb-4" style={{ color: "var(--text-400)" }}>
              Lead creation — last 12 weeks
            </p>
            <div className="overflow-x-auto">
              <HeatmapGrid cells={data.activityCells} />
            </div>
            <div className="flex items-center gap-1.5 mt-auto pt-4">
              <span className="text-xs" style={{ color: "var(--text-400)" }}>Less</span>
              {(["var(--bg-muted)", "rgba(0,198,122,0.28)", "rgba(0,198,122,0.52)", "rgba(0,198,122,0.76)", "#00C67A"] as const).map((c, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ background: c, border: "1px solid var(--border)" }} />
              ))}
              <span className="text-xs" style={{ color: "var(--text-400)" }}>More</span>
            </div>
          </div>
        </div>

        {/* ── Stage breakdown + Source breakdown ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Stage breakdown */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-900)" }}>
              Pipeline Stages
            </h2>
            <div className="space-y-3">
              {data.byStage.slice(0, 9).map(({ stage, count }) => {
                const pct = data.totalLeads > 0 ? Math.round((count / data.totalLeads) * 100) : 0;
                const color = STAGE_COLOR[stage] ?? "#9CA3AF";
                return (
                  <div key={stage}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium" style={{ color: "var(--text-700)" }}>
                        {STAGE_LABEL[stage] ?? stage}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold tabular-nums" style={{ color: "var(--text-900)" }}>{count}</span>
                        <span className="text-xs tabular-nums w-7 text-right" style={{ color: "var(--text-400)" }}>{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "var(--bg-muted)" }}>
                      <div className="h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.max(pct, 1)}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Source breakdown */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-900)" }}>
              Lead Sources
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-4">
                {data.bySource.map(({ source, count }) => {
                  const pct = data.totalLeads > 0 ? Math.round((count / data.totalLeads) * 100) : 0;
                  const color = SOURCE_COLOR[source] ?? "#9CA3AF";
                  return (
                    <div key={source}>
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                          <span className="text-sm font-medium" style={{ color: "var(--text-700)" }}>
                            {SOURCE_LABEL[source] ?? source}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold tabular-nums" style={{ color: "var(--text-900)" }}>
                            {count.toLocaleString()}
                          </span>
                          <span className="text-xs tabular-nums w-7 text-right" style={{ color: "var(--text-400)" }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: "var(--bg-muted)" }}>
                        <div className="h-2 rounded-full"
                          style={{ width: `${Math.max(pct, 1)}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Source donut */}
              <div className="flex-shrink-0">
                <PieChart width={110} height={110}>
                  <Pie
                    data={data.bySource.map(s => ({ name: SOURCE_LABEL[s.source] ?? s.source, value: s.count }))}
                    cx={51} cy={51} innerRadius={28} outerRadius={50}
                    dataKey="value" strokeWidth={2} stroke="var(--bg-card)"
                  >
                    {data.bySource.map(({ source }) => (
                      <Cell key={source} fill={SOURCE_COLOR[source] ?? "#9CA3AF"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 11, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}
                  />
                </PieChart>
              </div>
            </div>
          </div>
        </div>

        {/* ── Team Performance + Recent Leads ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Top reps */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Team Performance</h2>
              <Link href="/admin/crm" className="text-xs font-medium" style={{ color: "var(--text-400)" }}>
                All Leads →
              </Link>
            </div>
            {data.topReps.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Users className="w-7 h-7 mx-auto mb-2" style={{ color: "var(--border)" }} />
                <p className="text-sm" style={{ color: "var(--text-400)" }}>No reps assigned to leads yet</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {data.topReps.map((rep, i) => (
                  <div key={rep.id} className="px-5 py-3.5 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: i === 0 ? "#00C67A" : i === 1 ? "#3B82F6" : i === 2 ? "#F59E0B" : "var(--bg-muted)",
                        color: i < 3 ? "white" : "var(--text-500)",
                      }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-900)" }}>{rep.name}</p>
                      <p className="text-xs truncate" style={{ color: "var(--text-400)" }}>{rep.title ?? "Sales Rep"}</p>
                    </div>
                    <div className="text-right flex-shrink-0 mr-2">
                      <p className="text-sm font-bold" style={{ color: "var(--text-900)" }}>{rep.total} leads</p>
                      <p className="text-xs font-medium" style={{ color: "#16A34A" }}>{rep.won} won · {rep.rate}%</p>
                    </div>
                    <div className="w-14 flex-shrink-0">
                      <div className="h-1.5 rounded-full" style={{ background: "var(--bg-muted)" }}>
                        <div className="h-1.5 rounded-full"
                          style={{ width: `${rep.rate}%`, background: "#00C67A" }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent leads */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Recent Leads</h2>
              <Link href="/admin/crm" className="text-xs font-medium" style={{ color: "var(--text-400)" }}>
                View All →
              </Link>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {data.recentLeads.map(lead => {
                const stageColor = STAGE_COLOR[lead.stage] ?? "#9CA3AF";
                return (
                  <Link href={`/admin/crm/leads/${lead.id}`} key={lead.id}
                    className="px-5 py-3 flex items-center gap-3 transition-colors"
                    style={{ display: "flex" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-muted)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: stageColor }}>
                      {lead.name[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-900)" }}>{lead.name}</p>
                      <p className="text-xs truncate" style={{ color: "var(--text-400)" }}>
                        {lead.assignedTo ?? "Unassigned"} · {SOURCE_LABEL[lead.source] ?? lead.source}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: stageColor + "22", color: stageColor }}>
                        {STAGE_LABEL[lead.stage] ?? lead.stage}
                      </span>
                      <p className="text-xs mt-1" style={{ color: "var(--text-400)" }}>
                        {timeAgo(lead.createdAt)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

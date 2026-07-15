"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart2, CheckCircle, XCircle, Clock, Zap } from "lucide-react";

interface AnalyticsData {
  kpis: {
    totalListings:        number;
    liveListings:         number;
    approvalRate:         number;
    avgOptimizationScore: number;
    avgListingTimeHours:  number;
    totalRejections:      number;
  };
  statusBreakdown: { status: string; _count: { id: number } }[];
  platformBreakdown: { platform: string; status: string; _count: { id: number } }[];
}

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "#9ca3af", CONTENT_PENDING: "#f59e0b", IN_REVIEW: "#3b82f6",
  AWAITING_SELLER: "#8b5cf6", AWAITING_MARKETPLACE: "#06b6d4",
  APPROVED: "#10b981", LIVE: "#16a34a", REJECTED: "#ef4444",
  OPTIMIZATION_REQUIRED: "#f97316",
};

export default function ListingAnalyticsPage() {
  const [data, setData]     = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/listing-os/analytics")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  const k = data?.kpis;

  return (
    <div style={{ padding: "24px", maxWidth: 1100 }}>
      <Link href="/admin/listing-os"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--text-400)",
                 textDecoration: "none", fontSize: 13, marginBottom: 20 }}>
        <ArrowLeft size={14} /> Back to Listing OS
      </Link>

      <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-900)", margin: "0 0 24px" }}>
        Listing Analytics
      </h1>

      {/* KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12, marginBottom: 28 }}>
        {[
          { icon: BarChart2, label: "Total Listings",    val: k?.totalListings,        color: "#6b7280" },
          { icon: CheckCircle, label: "Live Listings",   val: k?.liveListings,          color: "#16a34a" },
          { icon: CheckCircle, label: "Approval Rate",   val: k ? `${k.approvalRate}%` : "—", color: "#15803d" },
          { icon: Zap,         label: "Avg Opt Score",   val: k?.avgOptimizationScore, color: "#d97706" },
          { icon: Clock,       label: "Avg List Time",   val: k ? `${k.avgListingTimeHours}h` : "—", color: "#1d4ed8" },
          { icon: XCircle,     label: "Total Rejections", val: k?.totalRejections,     color: "#dc2626" },
        ].map(({ icon: Icon, label, val, color }) => (
          <div key={label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
              <Icon size={13} style={{ color }} />
              <span style={{ fontSize: 11, color: "var(--text-400)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: val ? color : "var(--text-300)" }}>
              {loading ? "—" : (val ?? 0)}
            </div>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-900)", marginBottom: 16 }}>Status Breakdown</div>
        {(data?.statusBreakdown ?? []).map(s => {
          const total = data?.kpis.totalListings ?? 1;
          const pct   = Math.round((s._count.id / total) * 100);
          const color = STATUS_COLOR[s.status] ?? "#9ca3af";
          return (
            <div key={s.status} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                <span style={{ color: "var(--text-900)" }}>{s.status}</span>
                <span style={{ color: "var(--text-400)" }}>{s._count.id} ({pct}%)</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--bg-muted)" }}>
                <div style={{ height: "100%", borderRadius: 3, background: color, width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        {!loading && (data?.statusBreakdown?.length ?? 0) === 0 && (
          <div style={{ color: "var(--text-400)", fontSize: 13 }}>No listing data yet</div>
        )}
      </div>

      {/* Platform breakdown */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-900)", marginBottom: 16 }}>Platform Breakdown</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-400)" }}>
              <th style={{ textAlign: "left", padding: "7px 10px" }}>Platform</th>
              <th style={{ textAlign: "left", padding: "7px 10px" }}>Status</th>
              <th style={{ textAlign: "right", padding: "7px 10px" }}>Count</th>
            </tr>
          </thead>
          <tbody>
            {(data?.platformBreakdown ?? []).map((p, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 10px", fontWeight: 500 }}>{p.platform}</td>
                <td style={{ padding: "8px 10px" }}>
                  <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                                 background: `${STATUS_COLOR[p.status]}22`, color: STATUS_COLOR[p.status] }}>
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: "8px 10px", textAlign: "right" }}>{p._count.id}</td>
              </tr>
            ))}
            {!loading && (data?.platformBreakdown?.length ?? 0) === 0 && (
              <tr><td colSpan={3} style={{ padding: "16px", textAlign: "center", color: "var(--text-400)" }}>
                No data yet
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

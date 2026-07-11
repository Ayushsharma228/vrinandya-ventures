"use client";

import { useEffect, useState, useCallback } from "react";
import { TrendingUp, Award, CheckCircle, XCircle, Truck, RefreshCw, Star, BarChart2 } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

type PerformanceData = {
  total: number;
  accepted: number;
  rejected: number;
  dispatched: number;
  delivered: number;
  cancelled: number;
  rto: number;
  acceptanceRate: number;
  cancellationRate: number;
  rtoRate: number;
  avgDispatchHours: number | null;
  revenue: number;
  qualityScore: number;
  preferredBadge: boolean;
};

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 80 ? "#00C67A" : pct >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function SupplierPerformancePage() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/supplier/performance");
      const d = await res.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
        <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "var(--text-300)" }} />
      </div>
    );
  }

  if (!data) return null;

  const scoreColor = data.qualityScore >= 80 ? "#00C67A" : data.qualityScore >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Performance"
        subtitle="Your fulfillment analytics and quality score"
        cards={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Orders",   value: data.total,                              icon: BarChart2,   color: "#3B82F6" },
              { label: "Delivered",      value: data.delivered,                          icon: CheckCircle, color: "#00C67A" },
              { label: "Revenue",        value: `₹${data.revenue.toLocaleString()}`,     icon: TrendingUp,  color: "#8B5CF6" },
              { label: "Quality Score",  value: `${data.qualityScore}/100`,              icon: Star,        color: scoreColor },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl px-5 py-4"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <p className="text-xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        }
      />

      <div className="px-4 md:px-8 pt-6 space-y-6">
        {/* Badge */}
        {data.preferredBadge && (
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl"
            style={{ background: "linear-gradient(135deg, #F0FDF4, #ECFDF5)", border: "1px solid #BBF7D0" }}>
            <Award className="w-6 h-6 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-800">Preferred Supplier Badge</p>
              <p className="text-xs text-green-600 mt-0.5">You meet the quality threshold. Admins will prioritize you for new orders.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rate metrics */}
          <div className="card px-6 py-5 space-y-5">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Key Rates</h3>
            {[
              { label: "Acceptance Rate",   value: data.acceptanceRate,   target: 90, unit: "%" },
              { label: "Cancellation Rate", value: data.cancellationRate, target: 5,  unit: "%", inverse: true },
              { label: "RTO Rate",          value: data.rtoRate,          target: 10, unit: "%", inverse: true },
            ].map(({ label, value, target, unit, inverse }) => {
              const score = inverse ? Math.max(0, 100 - value) : value;
              return (
                <div key={label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-xs font-medium" style={{ color: "var(--text-600)" }}>{label}</p>
                    <p className="text-sm font-bold" style={{ color: "var(--text-900)" }}>
                      {value}{unit}
                      <span className="text-xs font-normal ml-1" style={{ color: "var(--text-300)" }}>
                        target: {inverse ? `<${target}%` : `>${target}%`}
                      </span>
                    </p>
                  </div>
                  <ScoreBar value={score} />
                </div>
              );
            })}
          </div>

          {/* Order breakdown */}
          <div className="card px-6 py-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-900)" }}>Order Breakdown</h3>
            <div className="space-y-2.5">
              {[
                { label: "Accepted",     value: data.accepted,    color: "#3B82F6", icon: CheckCircle },
                { label: "Rejected",     value: data.rejected,    color: "#EF4444", icon: XCircle },
                { label: "Dispatched",   value: data.dispatched,  color: "#8B5CF6", icon: Truck },
                { label: "Delivered",    value: data.delivered,   color: "#00C67A", icon: CheckCircle },
                { label: "Cancelled",    value: data.cancelled,   color: "#6B7280", icon: XCircle },
                { label: "RTO",          value: data.rto,         color: "#F59E0B", icon: RefreshCw },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between py-2 px-3 rounded-lg"
                  style={{ background: "var(--bg-page)" }}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                    <p className="text-sm" style={{ color: "var(--text-600)" }}>{label}</p>
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dispatch speed + quality score */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card px-6 py-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-900)" }}>Dispatch Speed</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "#F0F9FF" }}>
                <Truck className="w-7 h-7 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: "var(--text-900)" }}>
                  {data.avgDispatchHours !== null ? `${data.avgDispatchHours}h` : "—"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>avg. time from order to dispatch</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-300)" }}>
                  {data.avgDispatchHours !== null && data.avgDispatchHours <= 24
                    ? "Excellent — within 24 hours"
                    : data.avgDispatchHours !== null && data.avgDispatchHours <= 48
                    ? "Good — within 48 hours"
                    : data.avgDispatchHours !== null
                    ? "Needs improvement — over 48 hours"
                    : "No dispatched orders yet"}
                </p>
              </div>
            </div>
          </div>

          <div className="card px-6 py-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-900)" }}>Quality Score</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: `${scoreColor}15` }}>
                <p className="text-xl font-bold" style={{ color: scoreColor }}>{data.qualityScore}</p>
              </div>
              <div className="flex-1">
                <ScoreBar value={data.qualityScore} />
                <div className="flex justify-between mt-1.5">
                  <p className="text-xs" style={{ color: "var(--text-400)" }}>0</p>
                  <p className="text-xs font-medium" style={{ color: scoreColor }}>
                    {data.qualityScore >= 85 ? "Excellent" : data.qualityScore >= 70 ? "Good" : data.qualityScore >= 50 ? "Average" : "Poor"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-400)" }}>100</p>
                </div>
                <p className="text-xs mt-1.5" style={{ color: "var(--text-300)" }}>
                  Score ≥ 85 with 10+ orders = Preferred Supplier badge
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

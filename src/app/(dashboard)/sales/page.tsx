"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserCheck, Target, TrendingUp, CalendarClock,
  Phone, MapPin, ArrowRight, Loader2,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

const STAGE_LABEL: Record<string, string> = {
  LEAD: "Lead", CALL_NOT_PICKED: "Call Not Picked", BUSY: "Busy",
  SCHEDULE_MEETING: "Schedule Meeting", NOT_INTERESTED: "Not Interested",
  PROSPECT: "Prospect", INTERESTED: "Interested", WILL_PAY: "Will Pay",
  PAID: "Paid", ONBOARDED: "Onboarded", WEBSITE_DONE: "Website Done",
  ENGAGEMENT_LIVE: "Engagement Live", ADS_LIVE: "Ads Live",
};

const STAGE_COLOR: Record<string, { bg: string; color: string }> = {
  LEAD:             { bg: "#F9FAFB", color: "#6B7280" },
  CALL_NOT_PICKED:  { bg: "#FFF7ED", color: "#D97706" },
  BUSY:             { bg: "#FFF7ED", color: "#D97706" },
  SCHEDULE_MEETING: { bg: "#EFF6FF", color: "#3B82F6" },
  NOT_INTERESTED:   { bg: "#FEF2F2", color: "#DC2626" },
  PROSPECT:         { bg: "#F5F3FF", color: "#7C3AED" },
  INTERESTED:       { bg: "#ECFDF5", color: "#059669" },
  WILL_PAY:         { bg: "#F0FDF4", color: "#16A34A" },
  PAID:             { bg: "#F0FDF4", color: "#16A34A" },
  ONBOARDED:        { bg: "#F0FDF4", color: "#16A34A" },
  WEBSITE_DONE:     { bg: "#EFF6FF", color: "#3B82F6" },
  ENGAGEMENT_LIVE:  { bg: "#EFF6FF", color: "#3B82F6" },
  ADS_LIVE:         { bg: "#F0FDF4", color: "#16A34A" },
};

interface FollowUp {
  id: string; name: string; phone: string; stage: string;
  followUpDate: string; city: string | null;
}

interface StageCount { stage: string; _count: number; }

interface DashboardData {
  name: string; salesTitle: string | null;
  salesTarget: number; paidThisMonth: number; totalLeads: number;
  followUpsToday: FollowUp[];
  stageBreakdown: StageCount[];
}

export default function SalesDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/sales/dashboard").then(r => r.json()).then(setData);
  }, []);

  if (!data) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--green-500)" }} />
    </div>
  );

  const targetPct = data.salesTarget > 0 ? Math.min(100, Math.round((data.paidThisMonth / data.salesTarget) * 100)) : 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title={`Hey, ${data.name?.split(" ")[0] || "there"} 👋`}
        subtitle={data.salesTitle || "Sales Team · Vrinandya Ventures"}
        cards={
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Assigned Leads",    value: data.totalLeads,     icon: UserCheck,    color: "#3B82F6" },
              { label: "Paid This Month",   value: data.paidThisMonth,  icon: TrendingUp,   color: "#00C67A" },
              { label: "Follow-ups Today",  value: data.followUpsToday.length, icon: CalendarClock, color: "#F59E0B" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl px-5 py-4 flex items-center gap-4"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.1)" }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
                  <p className="text-2xl font-bold text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
        }
      />

      <div className="px-8 pt-6 space-y-6 pb-8">

        {/* Monthly Target */}
        <div className="card px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" style={{ color: "var(--green-500)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Monthly Target</h2>
            </div>
            <span className="text-sm font-bold" style={{ color: targetPct >= 100 ? "#16A34A" : "var(--text-900)" }}>
              {data.paidThisMonth} / {data.salesTarget} paid
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${targetPct}%`, background: targetPct >= 100 ? "#16A34A" : "var(--green-500)" }} />
          </div>
          <p className="text-xs mt-2" style={{ color: "var(--text-400)" }}>
            {targetPct >= 100 ? "🎉 Target achieved!" : `${data.salesTarget - data.paidThisMonth} more to hit your target`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Today's Follow-ups */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4" style={{ color: "var(--text-400)" }} />
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>
                  Today&apos;s Follow-ups ({data.followUpsToday.length})
                </h2>
              </div>
              <Link href="/sales/leads" className="text-xs font-medium flex items-center gap-1"
                style={{ color: "var(--green-500)" }}>
                All leads <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {data.followUpsToday.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2">
                <CalendarClock className="w-8 h-8" style={{ color: "var(--border)" }} />
                <p className="text-sm" style={{ color: "var(--text-400)" }}>No follow-ups scheduled today</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {data.followUpsToday.map(f => {
                  const cfg = STAGE_COLOR[f.stage] ?? STAGE_COLOR.LEAD;
                  return (
                    <Link key={f.id} href={`/sales/leads/${f.id}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                        style={{ background: "var(--green-500)" }}>
                        {f.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-900)" }}>{f.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Phone className="w-3 h-3" style={{ color: "var(--text-400)" }} />
                          <span className="text-xs" style={{ color: "var(--text-400)" }}>{f.phone}</span>
                          {f.city && <>
                            <MapPin className="w-3 h-3" style={{ color: "var(--text-400)" }} />
                            <span className="text-xs" style={{ color: "var(--text-400)" }}>{f.city}</span>
                          </>}
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        {STAGE_LABEL[f.stage] ?? f.stage}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pipeline Summary */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 flex items-center gap-2"
              style={{ borderBottom: "1px solid var(--border)" }}>
              <TrendingUp className="w-4 h-4" style={{ color: "var(--text-400)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Pipeline Summary</h2>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {data.stageBreakdown.length === 0 ? (
                <div className="py-10 text-center text-sm" style={{ color: "var(--text-400)" }}>No leads yet</div>
              ) : (
                data.stageBreakdown
                  .sort((a, b) => {
                    const order = ["LEAD","CALL_NOT_PICKED","BUSY","SCHEDULE_MEETING","PROSPECT","INTERESTED","WILL_PAY","PAID","ONBOARDED","WEBSITE_DONE","ENGAGEMENT_LIVE","ADS_LIVE","NOT_INTERESTED"];
                    return order.indexOf(a.stage) - order.indexOf(b.stage);
                  })
                  .map(({ stage, _count }) => {
                    const cfg = STAGE_COLOR[stage] ?? STAGE_COLOR.LEAD;
                    const pct = data.totalLeads > 0 ? Math.round((_count / data.totalLeads) * 100) : 0;
                    return (
                      <div key={stage} className="px-5 py-2.5 flex items-center gap-3">
                        <span className="text-xs font-semibold w-28 flex-shrink-0 truncate"
                          style={{ color: cfg.color }}>
                          {STAGE_LABEL[stage] ?? stage}
                        </span>
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cfg.color }} />
                        </div>
                        <span className="text-xs font-bold w-5 text-right flex-shrink-0"
                          style={{ color: "var(--text-900)" }}>{_count}</span>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

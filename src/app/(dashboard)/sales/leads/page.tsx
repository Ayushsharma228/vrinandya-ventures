"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { UserCheck, Phone, MapPin, CalendarClock, ArrowRight, Search, RefreshCw } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

const STAGES = [
  "ALL","LEAD","CALL_NOT_PICKED","BUSY","SCHEDULE_MEETING","NOT_INTERESTED",
  "PROSPECT","INTERESTED","WILL_PAY","PAID","ONBOARDED","WEBSITE_DONE","ENGAGEMENT_LIVE","ADS_LIVE",
];

const STAGE_LABEL: Record<string, string> = {
  ALL: "All", LEAD: "Lead", CALL_NOT_PICKED: "Call Not Picked", BUSY: "Busy",
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

interface Lead {
  id: string; name: string; email: string | null; phone: string;
  city: string | null; investment: number | null; stage: string;
  isNI: boolean; followUpDate: string | null; createdAt: string;
  _count: { activities: number };
}

export default function SalesLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stage, setStage] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showNI, setShowNI] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (stage !== "ALL") params.set("stage", stage);
    if (search) params.set("search", search);
    if (showNI) params.set("ni", "true");
    const res = await fetch(`/api/sales/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads ?? []);
    setLoading(false);
  }, [stage, search, showNI]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const today = new Date().toDateString();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="My Leads"
        subtitle="Manage and track your assigned leads"
        searchValue={search}
        searchPlaceholder="Search name, phone, city..."
        onSearchChange={setSearch}
        onSearchSubmit={fetchLeads}
      />

      <div className="px-4 md:px-8 py-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {STAGES.map(s => {
              const cfg = STAGE_COLOR[s];
              const isActive = stage === s;
              return (
                <button key={s} onClick={() => setStage(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={isActive
                    ? { background: s === "ALL" ? "var(--bg-sidebar)" : (cfg?.color ?? "#374151"), color: "white" }
                    : { background: cfg?.bg ?? "#F3F4F6", color: cfg?.color ?? "#374151" }}>
                  {STAGE_LABEL[s]}
                </button>
              );
            })}
          </div>
          <button onClick={() => setShowNI(p => !p)}
            className="ml-auto px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={showNI
              ? { background: "#DC2626", color: "white" }
              : { background: "#FEF2F2", color: "#DC2626" }}>
            {showNI ? "Showing NI" : "Show NI"}
          </button>
        </div>

        {/* Leads grid */}
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "var(--text-400)" }} />
          </div>
        ) : leads.length === 0 ? (
          <div className="card py-16 flex flex-col items-center gap-3">
            <UserCheck className="w-10 h-10" style={{ color: "var(--border)" }} />
            <p className="text-sm" style={{ color: "var(--text-400)" }}>No leads found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {leads.map(lead => {
              const cfg = STAGE_COLOR[lead.stage] ?? STAGE_COLOR.LEAD;
              const isFollowUpToday = lead.followUpDate && new Date(lead.followUpDate).toDateString() === today;
              const isOverdue = lead.followUpDate && new Date(lead.followUpDate) < new Date() && !isFollowUpToday;
              return (
                <Link key={lead.id} href={`/sales/leads/${lead.id}`}
                  className="card p-5 hover:shadow-md transition-shadow block group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: "var(--green-500)" }}>
                        {lead.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "var(--text-900)" }}>{lead.name}</p>
                        {lead.city && (
                          <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--text-400)" }}>
                            <MapPin className="w-3 h-3" /> {lead.city}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      {STAGE_LABEL[lead.stage]}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs" style={{ color: "var(--text-500)" }}>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{lead.phone}</span>
                    </div>
                    {lead.investment && (
                      <div className="flex items-center gap-1.5">
                        <span>💰</span>
                        <span>₹{lead.investment.toLocaleString("en-IN")} investment</span>
                      </div>
                    )}
                    {lead.followUpDate && (
                      <div className="flex items-center gap-1.5"
                        style={{ color: isOverdue ? "#DC2626" : isFollowUpToday ? "#D97706" : "var(--text-400)" }}>
                        <CalendarClock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>
                          {isOverdue ? "Overdue · " : isFollowUpToday ? "Today · " : ""}
                          {new Date(lead.followUpDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3"
                    style={{ borderTop: "1px solid var(--border)" }}>
                    <span className="text-xs" style={{ color: "var(--text-400)" }}>
                      {lead._count.activities} activit{lead._count.activities === 1 ? "y" : "ies"}
                    </span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--green-500)" }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

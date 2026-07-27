"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, Phone, MapPin, CalendarClock, Search, RefreshCw, ChevronRight } from "lucide-react";
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
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stage, setStage] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showNI, setShowNI] = useState(false);
  const [overdue, setOverdue] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingStage, setUpdatingStage] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (stage !== "ALL") params.set("stage", stage);
    if (search) params.set("search", search);
    if (showNI) params.set("ni", "true");
    if (overdue) params.set("overdue", "true");
    const res = await fetch(`/api/sales/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads ?? []);
    setLoading(false);
  }, [stage, search, showNI, overdue]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  async function handleStageChange(leadId: string, newStage: string) {
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l));
    setUpdatingStage(leadId);
    try {
      await fetch(`/api/sales/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      });
    } catch {
      // revert on error
      fetchLeads();
    } finally {
      setUpdatingStage(null);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today.getTime() + 86400000);

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
            {/* Overdue chip */}
            <button
              onClick={() => { setOverdue(p => !p); setStage("ALL"); }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={overdue
                ? { background: "#DC2626", color: "#fff" }
                : { background: "#FEF2F2", color: "#DC2626" }}>
              Overdue
            </button>
            {STAGES.map(s => {
              const cfg = STAGE_COLOR[s];
              const isActive = !overdue && stage === s;
              return (
                <button key={s} onClick={() => { setStage(s); setOverdue(false); }}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={isActive
                    ? { background: s === "ALL" ? "var(--bg-sidebar)" : (cfg?.color ?? "#374151"), color: "var(--text-primary)" }
                    : { background: cfg?.bg ?? "#F3F4F6", color: cfg?.color ?? "#374151" }}>
                  {STAGE_LABEL[s]}
                </button>
              );
            })}
          </div>
          <button onClick={() => setShowNI(p => !p)}
            className="ml-auto px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={showNI
              ? { background: "#DC2626", color: "var(--text-primary)" }
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
              const followUpDate = lead.followUpDate ? new Date(lead.followUpDate) : null;
              const isFollowUpToday = followUpDate && followUpDate >= today && followUpDate < todayEnd;
              const isOverdue = followUpDate && followUpDate < today;
              return (
                <div
                  key={lead.id}
                  className="card p-5 hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => router.push(`/sales/leads/${lead.id}`)}>

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: "var(--green-500)" }}>
                        {lead.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: "var(--text-900)" }}>{lead.name}</p>
                        {lead.city && (
                          <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--text-400)" }}>
                            <MapPin className="w-3 h-3" /> {lead.city}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Inline stage selector — click stops card navigation */}
                    <div onClick={e => e.stopPropagation()} className="flex-shrink-0 ml-2">
                      <select
                        value={lead.stage}
                        disabled={updatingStage === lead.id}
                        onChange={e => handleStageChange(lead.id, e.target.value)}
                        className="text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer outline-none disabled:opacity-60"
                        style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33` }}>
                        {STAGES.filter(s => s !== "ALL").map(s => (
                          <option key={s} value={s} className="bg-white text-gray-900">{STAGE_LABEL[s]}</option>
                        ))}
                      </select>
                    </div>
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
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "var(--green-500)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

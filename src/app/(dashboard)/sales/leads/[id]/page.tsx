"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Phone, MapPin, CalendarClock, ArrowLeft, Loader2,
  PhoneCall, StickyNote, ChevronDown, CheckCircle, AlertTriangle,
} from "lucide-react";

const STAGES = [
  "LEAD","CALL_NOT_PICKED","BUSY","SCHEDULE_MEETING","NOT_INTERESTED",
  "PROSPECT","INTERESTED","WILL_PAY","PAID","ONBOARDED","WEBSITE_DONE","ENGAGEMENT_LIVE","ADS_LIVE",
];

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

const ACTIVITY_TYPE_LABEL: Record<string, string> = {
  CALL: "Call Logged", NOTE: "Note Added", STAGE_CHANGE: "Stage Changed",
};

interface Activity {
  id: string; type: string; content: string | null;
  createdAt: string; user: { name: string | null };
}

interface Lead {
  id: string; name: string; email: string | null; phone: string;
  city: string | null; investment: number | null; stage: string;
  isNI: boolean; followUpDate: string | null; notes: string | null;
  createdAt: string; activities: Activity[];
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingActivity, setAddingActivity] = useState(false);

  // Editable fields
  const [stage, setStage] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isNI, setIsNI] = useState(false);

  // New activity
  const [actType, setActType] = useState<"CALL" | "NOTE">("CALL");
  const [actContent, setActContent] = useState("");

  async function fetchLead() {
    const res = await fetch(`/api/sales/leads/${id}`);
    const data = await res.json();
    if (data.lead) {
      setLead(data.lead);
      setStage(data.lead.stage);
      setFollowUpDate(data.lead.followUpDate ? data.lead.followUpDate.split("T")[0] : "");
      setNotes(data.lead.notes ?? "");
      setIsNI(data.lead.isNI);
    }
    setLoading(false);
  }

  useEffect(() => { fetchLead(); }, [id]);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/sales/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, followUpDate: followUpDate || null, notes, isNI }),
    });
    await fetchLead();
    setSaving(false);
  }

  async function handleAddActivity() {
    if (!actContent.trim()) return;
    setAddingActivity(true);
    await fetch(`/api/sales/leads/${id}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: actType, content: actContent }),
    });
    setActContent("");
    await fetchLead();
    setAddingActivity(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--green-500)" }} />
    </div>
  );

  if (!lead) return (
    <div className="flex items-center justify-center min-h-screen text-sm" style={{ color: "var(--text-400)" }}>
      Lead not found
    </div>
  );

  const stageCfg = STAGE_COLOR[stage] ?? STAGE_COLOR.LEAD;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 pb-4 flex items-center gap-4 flex-wrap gap-y-2" style={{ borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-600)" }} />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: "var(--green-500)" }}>
            {lead.name[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: "var(--text-900)" }}>{lead.name}</h1>
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-400)" }}>
              <Phone className="w-3 h-3" />{lead.phone}
              {lead.city && <><MapPin className="w-3 h-3" />{lead.city}</>}
            </div>
          </div>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ background: stageCfg.bg, color: stageCfg.color }}>
          {STAGE_LABEL[stage]}
        </span>
        {isNI && (
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-50 text-red-600">NI</span>
        )}
      </div>

      <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left — Lead info + edit */}
        <div className="md:col-span-1 space-y-4">
          {/* Info card */}
          <div className="card p-5 space-y-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Lead Info</h2>
            {[
              { label: "Email",      value: lead.email },
              { label: "Phone",      value: lead.phone },
              { label: "City",       value: lead.city },
              { label: "Investment", value: lead.investment ? `₹${lead.investment.toLocaleString("en-IN")}` : null },
              { label: "Source",     value: "Meta Ads" },
              { label: "Added",      value: new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
            ].filter(r => r.value).map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span style={{ color: "var(--text-400)" }}>{label}</span>
                <span className="font-medium" style={{ color: "var(--text-900)" }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Update card */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Update Lead</h2>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-600)" }}>Stage</label>
              <div className="relative">
                <select value={stage} onChange={e => setStage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none pr-8">
                  {STAGES.map(s => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 pointer-events-none" style={{ color: "var(--text-400)" }} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-600)" }}>
                Follow-up Date
              </label>
              <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-600)" }}>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Any notes about this lead..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
            </div>

            <div className="flex items-center justify-between">
              <button onClick={() => setIsNI(p => !p)}
                className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl transition-all"
                style={isNI
                  ? { background: "#FEF2F2", color: "#DC2626" }
                  : { background: "#F9FAFB", color: "var(--text-600)" }}>
                <AlertTriangle className="w-3.5 h-3.5" />
                {isNI ? "Marked NI" : "Mark as NI"}
              </button>

              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "var(--green-500)" }}>
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><CheckCircle className="w-4 h-4" />Save</>}
              </button>
            </div>
          </div>
        </div>

        {/* Right — Activity log */}
        <div className="md:col-span-2 space-y-4">
          {/* Log activity */}
          <div className="card p-5 space-y-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Log Activity</h2>
            <div className="flex gap-2">
              {(["CALL", "NOTE"] as const).map(t => (
                <button key={t} onClick={() => setActType(t)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
                  style={actType === t
                    ? { background: "#EFF6FF", color: "#3B82F6", borderColor: "#BFDBFE" }
                    : { background: "#F9FAFB", color: "var(--text-600)", borderColor: "#E5E7EB" }}>
                  {t === "CALL" ? <PhoneCall className="w-4 h-4" /> : <StickyNote className="w-4 h-4" />}
                  {t === "CALL" ? "Log Call" : "Add Note"}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={actContent} onChange={e => setActContent(e.target.value)}
                placeholder={actType === "CALL" ? "What happened on the call?" : "Add a note..."}
                onKeyDown={e => { if (e.key === "Enter") handleAddActivity(); }}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
              <button onClick={handleAddActivity} disabled={addingActivity || !actContent.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#3B82F6" }}>
                {addingActivity ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
              </button>
            </div>
          </div>

          {/* Activity timeline */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>
                Activity ({lead.activities.length})
              </h2>
            </div>
            {lead.activities.length === 0 ? (
              <div className="py-10 text-center text-sm" style={{ color: "var(--text-400)" }}>
                No activity yet — log your first call or note above
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {lead.activities.map(act => (
                  <div key={act.id} className="px-5 py-3.5 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: act.type === "CALL" ? "#EFF6FF" : act.type === "STAGE_CHANGE" ? "#F5F3FF" : "#FFF7ED" }}>
                      {act.type === "CALL"
                        ? <PhoneCall className="w-3.5 h-3.5 text-blue-500" />
                        : act.type === "STAGE_CHANGE"
                          ? <CalendarClock className="w-3.5 h-3.5 text-purple-500" />
                          : <StickyNote className="w-3.5 h-3.5 text-yellow-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold" style={{ color: "var(--text-900)" }}>
                          {ACTIVITY_TYPE_LABEL[act.type] ?? act.type}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-400)" }}>
                          by {act.user.name} · {new Date(act.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {act.content && (
                        <p className="text-sm mt-0.5" style={{ color: "var(--text-600)" }}>{act.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

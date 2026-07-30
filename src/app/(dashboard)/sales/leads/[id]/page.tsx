"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Phone, MapPin, CalendarClock, ArrowLeft, Loader2,
  PhoneCall, StickyNote, ChevronDown, CheckCircle, AlertTriangle, MessageCircle,
  Sparkles, Copy, CopyCheck, ChevronRight,
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
  createdAt: string; source: string;
  businessStage: string | null; recommendedPlan: string | null; timeline: string | null;
  activities: Activity[];
}

const SERVICE_STYLE: Record<string, { bg: string; color: string; emoji: string }> = {
  "Dropshipping":           { bg: "rgba(59,130,246,0.12)", color: "#3B82F6", emoji: "🛒" },
  "Marketplace Management": { bg: "rgba(5,150,105,0.12)",  color: "#059669", emoji: "🏪" },
  "Brand Building":         { bg: "rgba(124,58,237,0.12)", color: "#7C3AED", emoji: "🏷️" },
};

function parseFormQA(raw: string | null): { q: string; a: string }[] {
  if (!raw) return [];
  return raw.split(" | ").map(part => {
    const idx = part.indexOf(": ");
    if (idx === -1) return null;
    return { q: part.substring(0, idx).trim(), a: part.substring(idx + 2).trim() };
  }).filter((x): x is { q: string; a: string } => !!x?.q && !!x?.a);
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
  const [sendingWa, setSendingWa] = useState(false);
  const [waResult, setWaResult] = useState<{ ok?: boolean; error?: string } | null>(null);

  // AI Coach
  interface AiSuggestion {
    insight: string;
    openingScript: string;
    talkingPoints: string[];
    objections: { o: string; r: string }[];
    suggestedFollowUpDays: number;
    suggestedFollowUpNote: string;
  }
  const [aiCoach, setAiCoach]         = useState<AiSuggestion | null>(null);
  const [loadingCoach, setLoadingCoach] = useState(false);
  const [coachError, setCoachError]   = useState<string | null>(null);
  const [copied, setCopied]           = useState(false);
  const [objOpen, setObjOpen]         = useState(false);
  const [acceptedDate, setAcceptedDate] = useState(false);

  async function handleWhatsAppOutreach() {
    setSendingWa(true); setWaResult(null);
    try {
      const res = await fetch(`/api/sales/leads/${id}/whatsapp-outreach`, { method: "POST" });
      const data = await res.json();
      setWaResult(res.ok ? { ok: true } : { error: data.error || "Failed to send" });
    } catch {
      setWaResult({ error: "Network error — try again" });
    } finally {
      setSendingWa(false);
    }
  }

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

  async function fetchAiCoach() {
    setLoadingCoach(true); setCoachError(null); setAiCoach(null); setAcceptedDate(false);
    try {
      const res = await fetch(`/api/sales/leads/${id}/ai-coach`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setCoachError(data.error || "AI unavailable"); return; }
      setAiCoach(data.suggestion);
    } catch {
      setCoachError("Network error — try again");
    } finally {
      setLoadingCoach(false);
    }
  }

  async function acceptFollowUp(days: number, note: string) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dateStr = d.toISOString().split("T")[0];
    setFollowUpDate(dateStr);
    setAcceptedDate(true);
    // Auto-log the note
    if (note) {
      await fetch(`/api/sales/leads/${id}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "NOTE", content: `[AI Coach] ${note}` }),
      });
    }
  }

  function copyScript(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const [quickLoading, setQuickLoading] = useState<string | null>(null);
  const [pickedNote, setPickedNote]     = useState("");
  const [showPickedInput, setShowPickedInput] = useState(false);

  async function logQuickCall(outcome: "not_picked" | "busy" | "scheduled") {
    const map = {
      not_picked: { content: "Called — not picked up",         stage: "CALL_NOT_PICKED" },
      busy:       { content: "Called — said busy, will retry", stage: "BUSY"            },
      scheduled:  { content: "Call done — meeting scheduled",  stage: "SCHEDULE_MEETING"},
    };
    const { content, stage: newStage } = map[outcome];
    setQuickLoading(outcome);
    await Promise.all([
      fetch(`/api/sales/leads/${id}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "CALL", content }),
      }),
      fetch(`/api/sales/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage }),
      }),
    ]);
    setStage(newStage);
    await fetchLead();
    setQuickLoading(null);
  }

  async function logPickedCall() {
    const content = pickedNote.trim() ? `Call picked — ${pickedNote.trim()}` : "Call picked";
    setQuickLoading("picked");
    await fetch(`/api/sales/leads/${id}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "CALL", content }),
    });
    setPickedNote("");
    setShowPickedInput(false);
    await fetchLead();
    setQuickLoading(null);
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
        <div className="flex items-center gap-2">
          <button onClick={fetchAiCoach} disabled={loadingCoach}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-60 transition-colors"
            style={{ background: "rgba(124,58,237,0.1)", color: "#7C3AED", border: "1px solid rgba(124,58,237,0.2)" }}>
            {loadingCoach ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {loadingCoach ? "Thinking..." : "AI Coach"}
          </button>
          {/* Chat on WhatsApp — opens inbox via company number 8679993305 */}
          <Link
            href={`/sales/inbox?leadId=${lead.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
            style={{ background: "rgba(37,211,102,0.12)", color: "#16A34A", border: "1px solid rgba(37,211,102,0.25)" }}>
            <MessageCircle className="w-3.5 h-3.5" />
            Chat on WhatsApp
          </Link>
          {/* Send via Arya — sends outreach template */}
          <button
            onClick={handleWhatsAppOutreach}
            disabled={sendingWa || waResult?.ok === true}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-60 transition-colors"
            style={{ background: "var(--bg-muted)", color: "var(--text-600)", border: "1px solid var(--border)" }}>
            {sendingWa
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <MessageCircle className="w-3.5 h-3.5" />}
            {sendingWa ? "Sending..." : "Send via Arya"}
          </button>
          {waResult && (
            <span className="text-xs font-medium" style={{ color: waResult.ok ? "#16A34A" : "#EF4444" }}>
              {waResult.ok ? "✓ Sent!" : waResult.error}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left — Lead info + edit */}
        <div className="md:col-span-1 space-y-4">
          {/* Info card */}
          <div className="card p-5 space-y-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Lead Info</h2>

            {/* Website application badges */}
            {lead.businessStage && (() => {
              const svc = SERVICE_STYLE[lead.businessStage] ?? { bg: "#F3F4F6", color: "#6B7280", emoji: "📋" };
              return (
                <div className="rounded-xl p-3 space-y-2" style={{ background: svc.bg }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold" style={{ color: svc.color }}>
                      {svc.emoji} {lead.businessStage}
                    </span>
                    {lead.recommendedPlan && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "rgba(0,0,0,0.08)", color: svc.color }}>
                        {lead.recommendedPlan.split("—")?.[0]?.trim() ?? lead.recommendedPlan}
                      </span>
                    )}
                  </div>
                  {lead.timeline && (
                    <p className="text-xs font-medium" style={{ color: svc.color }}>
                      ⏰ Best time to call: {lead.timeline}
                    </p>
                  )}
                </div>
              );
            })()}

            {[
              { label: "Email",      value: lead.email },
              { label: "Phone",      value: lead.phone },
              { label: "City",       value: lead.city },
              { label: "Investment", value: lead.investment ? `₹${lead.investment.toLocaleString("en-IN")}` : null },
              { label: "Source",     value: lead.source === "WEBSITE" ? "Website Form" : lead.source === "META_ADS" ? "Meta Ads" : lead.source },
              { label: "Added",      value: new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) },
            ].filter(r => r.value).map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span style={{ color: "var(--text-400)" }}>{label}</span>
                <span className="font-medium text-right" style={{ color: "var(--text-900)" }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Website form Q&A */}
          {lead.source === "WEBSITE" && lead.notes && (() => {
            const qas = parseFormQA(lead.notes);
            if (!qas.length) return null;
            return (
              <div className="card p-5 space-y-3">
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Application Responses</h2>
                <div className="space-y-2.5">
                  {qas.map(({ q, a }, i) => (
                    <div key={i} className="rounded-lg p-2.5" style={{ background: "var(--bg-muted)" }}>
                      <p className="text-[11px] font-semibold mb-0.5" style={{ color: "var(--text-400)" }}>{q}</p>
                      <p className="text-sm font-medium" style={{ color: "var(--text-900)" }}>{a}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

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

        {/* Right — AI Coach + Activity log */}
        <div className="md:col-span-2 space-y-4">

          {/* AI Coach panel */}
          {(aiCoach || coachError) && (
            <div className="card p-5 space-y-4" style={{ border: "1px solid rgba(124,58,237,0.2)", background: "rgba(124,58,237,0.02)" }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: "#7C3AED" }} />
                <h2 className="text-sm font-bold" style={{ color: "#7C3AED" }}>AI Coach Suggestion</h2>
              </div>

              {coachError && <p className="text-sm" style={{ color: "#EF4444" }}>{coachError}</p>}

              {aiCoach && (<>
                {/* Insight */}
                <div className="rounded-xl px-4 py-3" style={{ background: "rgba(124,58,237,0.08)" }}>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "#7C3AED" }}>💡 Key Insight</p>
                  <p className="text-sm" style={{ color: "var(--text-900)" }}>{aiCoach.insight}</p>
                </div>

                {/* Opening script */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold" style={{ color: "var(--text-600)" }}>📝 Opening Script</p>
                    <button onClick={() => copyScript(aiCoach.openingScript)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
                      style={{ background: "var(--bg-muted)", color: "var(--text-400)" }}>
                      {copied ? <CopyCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="rounded-xl px-4 py-3 text-sm italic" style={{ background: "var(--bg-muted)", color: "var(--text-700)" }}>
                    &ldquo;{aiCoach.openingScript}&rdquo;
                  </div>
                </div>

                {/* Talking points */}
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-600)" }}>✅ Talking Points</p>
                  <ul className="space-y-1.5">
                    {aiCoach.talkingPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--text-700)" }}>
                        <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold"
                          style={{ background: "rgba(124,58,237,0.12)", color: "#7C3AED" }}>{i + 1}</span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Objections */}
                <div>
                  <button onClick={() => setObjOpen(p => !p)}
                    className="flex items-center gap-1.5 text-xs font-semibold mb-2"
                    style={{ color: "var(--text-600)" }}>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform" style={{ transform: objOpen ? "rotate(90deg)" : "none" }} />
                    🔄 Likely Objections ({aiCoach.objections.length})
                  </button>
                  {objOpen && (
                    <div className="space-y-2">
                      {aiCoach.objections.map((obj, i) => (
                        <div key={i} className="rounded-xl p-3" style={{ background: "var(--bg-muted)" }}>
                          <p className="text-xs font-semibold mb-1" style={{ color: "#D97706" }}>"{obj.o}"</p>
                          <p className="text-xs" style={{ color: "var(--text-700)" }}>→ {obj.r}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Suggested follow-up */}
                <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.15)" }}>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#16A34A" }}>📅 Suggested Follow-up</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-600)" }}>
                      In {aiCoach.suggestedFollowUpDays} day{aiCoach.suggestedFollowUpDays !== 1 ? "s" : ""} — {aiCoach.suggestedFollowUpNote}
                    </p>
                  </div>
                  <button
                    onClick={() => acceptFollowUp(aiCoach.suggestedFollowUpDays, aiCoach.suggestedFollowUpNote)}
                    disabled={acceptedDate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-60 transition-colors"
                    style={{ background: acceptedDate ? "rgba(22,163,74,0.1)" : "#16A34A", color: acceptedDate ? "#16A34A" : "#fff" }}>
                    {acceptedDate ? <><CheckCircle className="w-3.5 h-3.5" /> Accepted</> : "Accept →"}
                  </button>
                </div>
              </>)}
            </div>
          )}

          {/* Log activity */}
          <div className="card p-5 space-y-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Log Activity</h2>

            {/* Quick call outcomes — one tap */}
            <div className="space-y-2">
              <p className="text-xs font-semibold" style={{ color: "var(--text-400)" }}>Quick call outcome</p>
              <div className="flex gap-2 flex-wrap">
                {([
                  { key: "not_picked", label: "📵 Not Picked", bg: "#FFF7ED", color: "#D97706", border: "#FDE68A" },
                  { key: "busy",       label: "🔁 Busy",        bg: "#FFF7ED", color: "#D97706", border: "#FDE68A" },
                  { key: "picked",     label: "✅ Picked",      bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" },
                  { key: "scheduled",  label: "🗓 Scheduled",   bg: "#EFF6FF", color: "#3B82F6", border: "#BFDBFE" },
                ] as const).map(({ key, label, bg, color, border }) => (
                  <button key={key}
                    disabled={quickLoading !== null}
                    onClick={() => key === "picked" ? setShowPickedInput(p => !p) : logQuickCall(key as "not_picked" | "busy" | "scheduled")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-50 transition-all"
                    style={{ background: bg, color, border: `1px solid ${border}` }}>
                    {quickLoading === key
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : label}
                  </button>
                ))}
              </div>

              {/* Picked outcome input */}
              {showPickedInput && (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    value={pickedNote}
                    onChange={e => setPickedNote(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") logPickedCall(); }}
                    placeholder="What was the outcome? (optional, press Enter)"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  <button onClick={logPickedCall} disabled={quickLoading === "picked"}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: "#16A34A" }}>
                    {quickLoading === "picked" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Log"}
                  </button>
                </div>
              )}
            </div>

            <div className="h-px" style={{ background: "var(--border)" }} />

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

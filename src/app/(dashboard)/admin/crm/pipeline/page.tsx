"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Flame, Droplets, Snowflake, Phone, CheckCircle2, FileText, CreditCard, Star } from "lucide-react";
import Link from "next/link";

interface Lead {
  id: string; name: string; phone: string; temperature: string | null;
  leadScore: number | null; pipelineStage: string; recommendedPlan: string | null;
  assignedTo: { name: string } | null; createdAt: string;
}

const STAGES = [
  { key: "NEW_LEAD",               label: "New Lead",               color: "#6B7280", icon: null },
  { key: "AI_CONTACT_PENDING",     label: "AI Contact Pending",     color: "#8B5CF6", icon: null },
  { key: "AI_CONVERSATION_STARTED",label: "AI Conversation",        color: "#3B82F6", icon: null },
  { key: "QUALIFICATION_COMPLETED",label: "Qualified",              color: "#F59E0B", icon: null },
  { key: "HOT_LEAD",               label: "Hot Lead 🔥",            color: "#EF4444", icon: Flame },
  { key: "WARM_LEAD",              label: "Warm Lead",              color: "#F59E0B", icon: Droplets },
  { key: "COLD_LEAD",              label: "Cold Lead",              color: "#3B82F6", icon: Snowflake },
  { key: "SALES_CALL_SCHEDULED",   label: "Call Scheduled",         color: "#10B981", icon: Phone },
  { key: "SALES_CALL_COMPLETED",   label: "Call Done",              color: "#00C67A", icon: CheckCircle2 },
  { key: "PROPOSAL_SENT",          label: "Proposal Sent",          color: "#8B5CF6", icon: FileText },
  { key: "PAYMENT_PENDING",        label: "Payment Pending",        color: "#F59E0B", icon: CreditCard },
  { key: "CLIENT",                 label: "Client ⭐",              color: "#00C67A", icon: Star },
];

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/crm/leads?limit=500")
      .then(r => r.json())
      .then(d => { setLeads(d.leads ?? []); setLoading(false); });
  }, []);

  async function moveStage(leadId: string, stage: string) {
    setMoving(leadId);
    await fetch(`/api/admin/crm/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipelineStage: stage }),
    });
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, pipelineStage: stage } : l));
    setMoving(null);
  }

  const byStage = (stageKey: string) => leads.filter(l => l.pipelineStage === stageKey);

  if (loading) return <div className="p-8 text-center text-sm" style={{ color: "var(--text-400)" }}>Loading pipeline...</div>;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <Link href="/admin/crm" className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-bold text-white">Sales Pipeline</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>{leads.length} total leads</p>
          </div>
        </div>
        <div className="flex gap-3 text-xs">
          {[
            { label: "Hot", count: leads.filter(l => l.temperature === "HOT").length, color: "#EF4444" },
            { label: "Warm", count: leads.filter(l => l.temperature === "WARM").length, color: "#F59E0B" },
            { label: "Cold", count: leads.filter(l => l.temperature === "COLD").length, color: "#3B82F6" },
            { label: "Clients", count: leads.filter(l => l.pipelineStage === "CLIENT").length, color: "#00C67A" },
          ].map(s => (
            <div key={s.label} className="px-3 py-1.5 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div className="font-bold" style={{ color: s.color }}>{s.count}</div>
              <div style={{ color: "var(--text-400)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-4 p-6" style={{ minWidth: STAGES.length * 240 + "px" }}>
          {STAGES.map(stage => {
            const stageLeads = byStage(stage.key);
            return (
              <div key={stage.key} className="flex-shrink-0 w-56">
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
                  <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>{stage.label}</span>
                  <span className="ml-auto text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.08)", color: "var(--text-400)" }}>
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2 min-h-24">
                  {stageLeads.map(lead => (
                    <div key={lead.id} className="rounded-xl p-3"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-xs font-semibold text-white leading-tight">{lead.name}</span>
                        {lead.leadScore !== null && (
                          <span className="text-xs font-bold flex-shrink-0" style={{ color: stage.color }}>{lead.leadScore}</span>
                        )}
                      </div>
                      <p className="text-xs mb-2" style={{ color: "var(--text-400)" }}>{lead.phone}</p>
                      {lead.recommendedPlan && (
                        <p className="text-xs mb-2 truncate" style={{ color: "var(--green-500)" }}>{lead.recommendedPlan}</p>
                      )}
                      {lead.assignedTo && (
                        <p className="text-xs" style={{ color: "var(--text-400)" }}>→ {lead.assignedTo.name}</p>
                      )}

                      {/* Move to next stage */}
                      {stage.key !== "CLIENT" && (
                        <select
                          onChange={e => e.target.value && moveStage(lead.id, e.target.value)}
                          disabled={moving === lead.id}
                          value=""
                          className="mt-2 w-full text-xs rounded-lg px-2 py-1 outline-none"
                          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid var(--border)", color: "var(--text-400)" }}>
                          <option value="">Move to...</option>
                          {STAGES.filter(s => s.key !== stage.key).map(s => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="text-xs text-center py-4" style={{ color: "var(--text-400)", borderRadius: 12, border: "1px dashed var(--border)" }}>
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserCheck, Plus, Trash2, Loader2, Target,
  TrendingUp, Users, Phone, MapPin, ChevronDown, UserPlus, KeyRound,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

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
  LEAD:{ bg:"#F9FAFB",color:"#6B7280"},CALL_NOT_PICKED:{bg:"#FFF7ED",color:"#D97706"},
  BUSY:{bg:"#FFF7ED",color:"#D97706"},SCHEDULE_MEETING:{bg:"#EFF6FF",color:"#3B82F6"},
  NOT_INTERESTED:{bg:"#FEF2F2",color:"#DC2626"},PROSPECT:{bg:"#F5F3FF",color:"#7C3AED"},
  INTERESTED:{bg:"#ECFDF5",color:"#059669"},WILL_PAY:{bg:"#F0FDF4",color:"#16A34A"},
  PAID:{bg:"#F0FDF4",color:"#16A34A"},ONBOARDED:{bg:"#F0FDF4",color:"#16A34A"},
  WEBSITE_DONE:{bg:"#EFF6FF",color:"#3B82F6"},ENGAGEMENT_LIVE:{bg:"#EFF6FF",color:"#3B82F6"},
  ADS_LIVE:{bg:"#F0FDF4",color:"#16A34A"},
};

interface SalesPerson { id: string; name: string | null; salesTitle: string | null; salesTarget: number | null; }
interface PerfStat extends SalesPerson { total: number; paid: number; paidThisMonth: number; onboarded: number; }
interface Lead {
  id: string; name: string; email: string | null; phone: string;
  city: string | null; investment: number | null; stage: string;
  isNI: boolean; createdAt: string;
  assignedTo: { id: string; name: string | null } | null;
}

export default function AdminCRMPage() {
  const [tab, setTab] = useState<"leads" | "team">("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [salesTeam, setSalesTeam] = useState<SalesPerson[]>([]);
  const [perfStats, setPerfStats] = useState<PerfStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [repFilter, setRepFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);

  // New lead form
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", investment: "", assignedToId: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // New team member form
  const [teamForm, setTeamForm] = useState({ name: "", email: "", password: "", salesTitle: "", salesTarget: "" });
  const [teamSaving, setTeamSaving] = useState(false);
  const [teamError, setTeamError] = useState("");
  const [teamSuccess, setTeamSuccess] = useState("");

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams();
    if (search)     params.set("search", search);
    if (repFilter)  params.set("assignedToId", repFilter);
    if (stageFilter) params.set("stage", stageFilter);
    const res = await fetch(`/api/admin/crm/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads ?? []);
    setSalesTeam(data.salesTeam ?? []);
    setPerfStats(data.perfStats ?? []);
    setLoading(false);
  }, [search, repFilter, stageFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.name || !form.phone) { setFormError("Name and phone are required"); return; }
    setSaving(true);
    const res = await fetch("/api/admin/crm/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error || "Failed"); setSaving(false); return; }
    setForm({ name: "", email: "", phone: "", city: "", investment: "", assignedToId: "" });
    setShowForm(false);
    await fetchData();
    setSaving(false);
  }

  async function handleAssign(leadId: string, assignedToId: string) {
    setAssigning(leadId);
    await fetch(`/api/admin/crm/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedToId }),
    });
    await fetchData();
    setAssigning(null);
  }

  async function handleDelete(leadId: string) {
    setDeleting(leadId);
    await fetch(`/api/admin/crm/leads/${leadId}`, { method: "DELETE" });
    setLeads(p => p.filter(l => l.id !== leadId));
    setDeleting(null);
  }

  async function handleCreateMember(e: React.FormEvent) {
    e.preventDefault();
    setTeamError(""); setTeamSuccess("");
    setTeamSaving(true);
    const res = await fetch("/api/admin/crm/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(teamForm),
    });
    const data = await res.json();
    if (!res.ok) { setTeamError(data.error || "Failed"); setTeamSaving(false); return; }
    setTeamSuccess(`Account created for ${data.user.name} — they can now log in at /login`);
    setTeamForm({ name: "", email: "", password: "", salesTitle: "", salesTarget: "" });
    await fetchData();
    setTeamSaving(false);
  }

  const totalLeads = leads.length;
  const totalPaid = leads.filter(l => l.stage === "PAID").length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Sales CRM"
        subtitle="Manage leads and track sales team performance"
        searchValue={search}
        searchPlaceholder="Search name, phone, city..."
        onSearchChange={setSearch}
        onSearchSubmit={fetchData}
        actions={
          <button onClick={() => setShowForm(p => !p)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--green-500)" }}>
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        }
        filters={
          <div className="flex items-center gap-2">
            <select value={repFilter} onChange={e => setRepFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl text-white outline-none"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <option value="" className="text-gray-900 bg-white">All Reps</option>
              {salesTeam.map(r => <option key={r.id} value={r.id} className="text-gray-900 bg-white">{r.name}</option>)}
            </select>
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl text-white outline-none"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <option value="" className="text-gray-900 bg-white">All Stages</option>
              {STAGES.map(s => <option key={s} value={s} className="text-gray-900 bg-white">{STAGE_LABEL[s]}</option>)}
            </select>
          </div>
        }
        cards={
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Leads",  value: totalLeads,           icon: UserCheck, color: "#3B82F6" },
              { label: "Paid / Converted", value: totalPaid,        icon: TrendingUp, color: "#00C67A" },
              { label: "Sales Reps",   value: salesTeam.length,     icon: Users,     color: "#A78BFA" },
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

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ background: "#F3F4F6" }}>
          {([["leads", "Leads", UserCheck], ["team", "Sales Team", Users]] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={tab === key
                ? { background: "white", color: "var(--text-900)", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                : { color: "var(--text-400)" }}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* ── TEAM TAB ── */}
        {tab === "team" && (
          <div className="space-y-6">
            {/* Create member form */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="w-4 h-4" style={{ color: "var(--green-500)" }} />
                <h2 className="text-sm font-bold" style={{ color: "var(--text-900)" }}>Create Sales Account</h2>
              </div>
              {teamError && <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{teamError}</div>}
              {teamSuccess && <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">{teamSuccess}</div>}
              <form onSubmit={handleCreateMember} className="grid grid-cols-3 gap-3">
                {[
                  { key: "name",        label: "Full Name *",      placeholder: "e.g. Keshav Sharma", type: "text" },
                  { key: "email",       label: "Email *",          placeholder: "work email",          type: "email" },
                  { key: "password",    label: "Password *",       placeholder: "Set a password",      type: "password" },
                  { key: "salesTitle",  label: "Title",            placeholder: "e.g. Sales Lead",     type: "text" },
                  { key: "salesTarget", label: "Monthly Target",   placeholder: "No. of paid leads",   type: "number" },
                ].map(({ key, label, placeholder, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-600)" }}>{label}</label>
                    <input type={type} value={teamForm[key as keyof typeof teamForm]}
                      onChange={e => setTeamForm(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                ))}
                <div className="col-span-3 flex justify-end">
                  <button type="submit" disabled={teamSaving}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-50"
                    style={{ background: "var(--green-500)" }}>
                    {teamSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Creating...</> : <><UserPlus className="w-4 h-4" />Create Account</>}
                  </button>
                </div>
              </form>
            </div>

            {/* Team list */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
                <Users className="w-4 h-4" style={{ color: "var(--text-400)" }} />
                <span className="font-semibold text-sm" style={{ color: "var(--text-900)" }}>
                  Team Members ({salesTeam.length})
                </span>
              </div>
              {salesTeam.length === 0 ? (
                <div className="py-12 text-center text-sm" style={{ color: "var(--text-400)" }}>
                  No sales team members yet — create one above
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "#FAFAFA" }}>
                      {["Name","Title","Monthly Target","Login Email"].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--text-400)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {salesTeam.map(rep => (
                      <tr key={rep.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                              style={{ background: "var(--green-500)" }}>
                              {rep.name?.[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium" style={{ color: "var(--text-900)" }}>{rep.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-600)" }}>
                          {rep.salesTitle || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: "var(--text-900)" }}>
                          {rep.salesTarget ? `${rep.salesTarget} paid/month` : "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-400)" }}>
                            <KeyRound className="w-3.5 h-3.5" />
                            Logs in at <span className="font-mono font-medium" style={{ color: "var(--green-500)" }}>/login</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {tab === "leads" && <>
        {/* Add lead form */}
        {showForm && (
          <div className="card p-5">
            <h2 className="text-sm font-bold mb-4" style={{ color: "var(--text-900)" }}>Add New Lead</h2>
            {formError && (
              <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{formError}</div>
            )}
            <form onSubmit={handleAddLead} className="grid grid-cols-3 gap-3">
              {[
                { key: "name",       label: "Name *",       placeholder: "Full name",         type: "text" },
                { key: "phone",      label: "Phone *",      placeholder: "10-digit number",   type: "text" },
                { key: "email",      label: "Email",        placeholder: "email@example.com", type: "email" },
                { key: "city",       label: "City",         placeholder: "City",              type: "text" },
                { key: "investment", label: "Investment (₹)", placeholder: "Amount",          type: "number" },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-600)" }}>{label}</label>
                  <input type={type} value={form[key as keyof typeof form]}
                    onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-600)" }}>Assign To</label>
                <div className="relative">
                  <select value={form.assignedToId} onChange={e => setForm(p => ({ ...p, assignedToId: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none appearance-none pr-8">
                    <option value="">Unassigned</option>
                    {salesTeam.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-2.5 w-4 h-4 pointer-events-none" style={{ color: "var(--text-400)" }} />
                </div>
              </div>
              <div className="col-span-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-50"
                  style={{ background: "var(--green-500)" }}>
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : "Add Lead"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Team performance */}
        {perfStats.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4" style={{ color: "var(--green-500)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Team Performance (This Month)</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {perfStats.map(rep => {
                const target = rep.salesTarget ?? 0;
                const pct = target > 0 ? Math.min(100, Math.round((rep.paidThisMonth / target) * 100)) : 0;
                return (
                  <div key={rep.id} className="card p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: "var(--green-500)" }}>
                        {rep.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "var(--text-900)" }}>{rep.name}</p>
                        <p className="text-xs" style={{ color: "var(--text-400)" }}>{rep.salesTitle || "Sales"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                      {[
                        { label: "Assigned", value: rep.total },
                        { label: "Paid",     value: rep.paid },
                        { label: "Onboarded",value: rep.onboarded },
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-xl py-2" style={{ background: "#F9FAFB" }}>
                          <p className="text-lg font-bold" style={{ color: "var(--text-900)" }}>{value}</p>
                          <p className="text-xs" style={{ color: "var(--text-400)" }}>{label}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-400)" }}>
                        <span>Monthly target</span>
                        <span>{rep.paidThisMonth} / {target}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                        <div className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: pct >= 100 ? "#16A34A" : "var(--green-500)" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Leads table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
            <UserCheck className="w-4 h-4" style={{ color: "var(--text-400)" }} />
            <span className="font-semibold text-sm" style={{ color: "var(--text-900)" }}>All Leads ({leads.length})</span>
          </div>
          {loading ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--text-400)" }}>Loading...</div>
          ) : leads.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--text-400)" }}>No leads found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "#FAFAFA" }}>
                    {["Lead","Phone / City","Investment","Stage","Assigned To","Added",""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--text-400)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {leads.map(lead => {
                    const cfg = STAGE_COLOR[lead.stage] ?? STAGE_COLOR.LEAD;
                    return (
                      <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                              style={{ background: "var(--green-500)" }}>
                              {lead.name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm" style={{ color: "var(--text-900)" }}>{lead.name}</p>
                              {lead.email && <p className="text-xs" style={{ color: "var(--text-400)" }}>{lead.email}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-600)" }}>
                            <Phone className="w-3 h-3" />{lead.phone}
                          </div>
                          {lead.city && (
                            <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "var(--text-400)" }}>
                              <MapPin className="w-3 h-3" />{lead.city}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: "var(--text-900)" }}>
                          {lead.investment ? `₹${lead.investment.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ background: cfg.bg, color: cfg.color }}>
                            {STAGE_LABEL[lead.stage] ?? lead.stage}
                          </span>
                          {lead.isNI && <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600">NI</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <select
                              value={lead.assignedTo?.id ?? ""}
                              onChange={e => handleAssign(lead.id, e.target.value)}
                              disabled={assigning === lead.id}
                              className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg outline-none appearance-none pr-6 disabled:opacity-50"
                              style={{ color: "var(--text-900)" }}>
                              <option value="">Unassigned</option>
                              {salesTeam.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                            {assigning === lead.id
                              ? <Loader2 className="absolute right-1.5 top-1.5 w-3 h-3 animate-spin text-gray-400" />
                              : <ChevronDown className="absolute right-1.5 top-1.5 w-3 h-3 pointer-events-none text-gray-400" />
                            }
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>
                          {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDelete(lead.id)} disabled={deleting === lead.id}
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                            {deleting === lead.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>}
      </div>
    </div>
  );
}

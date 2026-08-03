"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  HelpCircle, Plus, Loader2, X, ChevronRight,
  AlertCircle, Package, CreditCard, User, Wrench, MessageSquare,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface Ticket {
  id: string; ticketNumber: number; subject: string;
  category: string; priority: string; status: string;
  relatedOrderId: string | null; createdAt: string; updatedAt: string;
  messages: { createdAt: string }[];
}

const CATEGORY_OPTS = [
  { value: "ORDER_ISSUE", label: "Order Issue",  icon: AlertCircle },
  { value: "PAYMENT",     label: "Payment",       icon: CreditCard  },
  { value: "PRODUCT",     label: "Product",       icon: Package     },
  { value: "ACCOUNT",     label: "Account",       icon: User        },
  { value: "TECHNICAL",   label: "Technical",     icon: Wrench      },
  { value: "OTHER",       label: "General",       icon: MessageSquare },
];

const PRIORITY_OPTS = [
  { value: "LOW",    label: "Low",    color: "#6B7280" },
  { value: "NORMAL", label: "Normal", color: "#3B82F6" },
  { value: "HIGH",   label: "High",   color: "#F59E0B" },
  { value: "URGENT", label: "Urgent", color: "#EF4444" },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  OPEN:              { label: "Open",            bg: "#EFF6FF", color: "#2563EB" },
  IN_PROGRESS:       { label: "In Progress",     bg: "#FFF7ED", color: "#C2410C" },
  WAITING_ON_SELLER: { label: "Awaiting You",    bg: "#F5F3FF", color: "#7C3AED" },
  RESOLVED:          { label: "Resolved",        bg: "#F0FDF4", color: "#16A34A" },
  CLOSED:            { label: "Closed",          bg: "#F9FAFB", color: "#6B7280" },
};

const CAT_LABEL: Record<string, string> = {
  ORDER_ISSUE: "Order Issue", PAYMENT: "Payment", PRODUCT: "Product",
  ACCOUNT: "Account", TECHNICAL: "Technical", OTHER: "General",
};

function timeAgo(s: string) {
  const d = Math.floor((Date.now() - new Date(s).getTime()) / 1000);
  if (d < 60) return "Just now";
  if (d < 3600) return `${Math.floor(d/60)}m ago`;
  if (d < 86400) return `${Math.floor(d/3600)}h ago`;
  if (d < 604800) return `${Math.floor(d/86400)}d ago`;
  return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function SellerSupportPage() {
  const [tickets, setTickets]           = useState<Ticket[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showCreate, setShowCreate]     = useState(false);
  const [filter, setFilter]             = useState("ALL");
  const [form, setForm] = useState({
    subject: "", category: "OTHER", priority: "NORMAL", description: "", relatedOrderId: "",
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    fetch("/api/seller/support")
      .then((r) => r.json())
      .then((d) => { setTickets(d.tickets ?? []); setLoading(false); });
  }, []);

  const counts = {
    open: tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS" || t.status === "WAITING_ON_SELLER").length,
    resolved: tickets.filter((t) => t.status === "RESOLVED").length,
    closed: tickets.filter((t) => t.status === "CLOSED").length,
  };

  const visible = filter === "ALL" ? tickets :
    filter === "ACTIVE" ? tickets.filter((t) => ["OPEN","IN_PROGRESS","WAITING_ON_SELLER"].includes(t.status)) :
    tickets.filter((t) => t.status === filter);

  async function handleCreate() {
    if (!form.subject.trim() || !form.description.trim()) {
      setCreateError("Subject and description are required"); return;
    }
    setCreating(true); setCreateError("");
    const res = await fetch("/api/seller/support", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setTickets((prev) => [data.ticket, ...prev]);
      setShowCreate(false);
      setForm({ subject: "", category: "OTHER", priority: "NORMAL", description: "", relatedOrderId: "" });
    } else {
      const d = await res.json().catch(() => ({}));
      setCreateError(d.error ?? "Something went wrong");
    }
    setCreating(false);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Support Center"
        subtitle="Get help from the Vrinandya team"
        filters={
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--accent)" }}>
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        }
      />

      <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Active",   count: counts.open,     color: "#2563EB", bg: "#EFF6FF" },
            { label: "Resolved", count: counts.resolved, color: "#16A34A", bg: "#F0FDF4" },
            { label: "Closed",   count: counts.closed,   color: "#6B7280", bg: "#F9FAFB" },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-4 flex-wrap">
          {[
            { key: "ALL",    label: `All (${tickets.length})` },
            { key: "ACTIVE", label: `Active (${counts.open})` },
            { key: "RESOLVED", label: "Resolved" },
            { key: "CLOSED",   label: "Closed" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: filter === key ? "var(--accent)" : "var(--bg-card)",
                color: filter === key ? "#fff" : "var(--text-secondary)",
                border: filter === key ? "1px solid transparent" : "1px solid var(--border)",
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent)" }} />
          </div>
        ) : visible.length === 0 ? (
          <div className="card py-20 flex flex-col items-center gap-3 text-center">
            <HelpCircle className="w-14 h-14" style={{ color: "var(--border)" }} />
            <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>
              {filter === "ALL" ? "No tickets yet" : "No tickets in this category"}
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {filter === "ALL"
                ? "Create a ticket to reach out to our support team"
                : <button onClick={() => setFilter("ALL")} className="underline">View all tickets</button>
              }
            </p>
            {filter === "ALL" && (
              <button onClick={() => setShowCreate(true)}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: "var(--accent)" }}>
                <Plus className="w-4 h-4" /> Create Ticket
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((t) => {
              const st = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.OPEN;
              const lastActivity = t.messages[0]?.createdAt ?? t.updatedAt;
              const isAwaitingMe = t.status === "WAITING_ON_SELLER";
              return (
                <Link key={t.id} href={`/seller/support/${t.id}`}
                  className="card flex items-center gap-4 p-4 hover:shadow-md transition-all cursor-pointer"
                  style={{ borderLeft: isAwaitingMe ? "3px solid #7C3AED" : "" }}>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded"
                        style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}>
                        #{t.ticketNumber}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                      {isAwaitingMe && (
                        <span className="text-[10px] font-bold animate-pulse" style={{ color: "#7C3AED" }}>
                          ● Action needed
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{t.subject}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      <span>{CAT_LABEL[t.category] ?? t.category}</span>
                      <span>·</span>
                      <span>Updated {timeAgo(lastActivity)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: t.priority === "URGENT" ? "#FEF2F2" : t.priority === "HIGH" ? "#FFF7ED" : "var(--bg-muted)",
                        color: t.priority === "URGENT" ? "#EF4444" : t.priority === "HIGH" ? "#F59E0B" : "var(--text-muted)",
                      }}>
                      {t.priority}
                    </span>
                    <ChevronRight className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl flex flex-col max-h-[96vh] overflow-y-auto"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" style={{ color: "var(--accent)" }} />
                <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>New Support Ticket</span>
              </div>
              <button onClick={() => setShowCreate(false)} style={{ color: "var(--text-muted)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Subject <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="Briefly describe your issue"
                  className="w-full px-3 py-2.5 text-sm rounded-xl outline-none"
                  style={{ border: "1px solid var(--border)", background: "var(--bg-muted)", color: "var(--text-primary)" }} />
              </div>

              {/* Category + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Category</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm rounded-xl outline-none appearance-none"
                    style={{ border: "1px solid var(--border)", background: "var(--bg-muted)", color: "var(--text-primary)" }}>
                    {CATEGORY_OPTS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm rounded-xl outline-none appearance-none"
                    style={{ border: "1px solid var(--border)", background: "var(--bg-muted)", color: "var(--text-primary)" }}>
                    {PRIORITY_OPTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Related order */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Related Order ID <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
                </label>
                <input value={form.relatedOrderId} onChange={(e) => setForm((f) => ({ ...f, relatedOrderId: e.target.value }))}
                  placeholder="e.g. ORD-12345"
                  className="w-full px-3 py-2.5 text-sm rounded-xl outline-none"
                  style={{ border: "1px solid var(--border)", background: "var(--bg-muted)", color: "var(--text-primary)" }} />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Description <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe your issue in detail — the more context you provide, the faster we can help."
                  rows={5}
                  className="w-full px-3 py-2.5 text-sm rounded-xl outline-none resize-none"
                  style={{ border: "1px solid var(--border)", background: "var(--bg-muted)", color: "var(--text-primary)" }} />
              </div>

              {createError && (
                <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg"
                  style={{ background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA" }}>
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {createError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                  Cancel
                </button>
                <button onClick={handleCreate} disabled={creating}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: "var(--accent)" }}>
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Submit Ticket"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

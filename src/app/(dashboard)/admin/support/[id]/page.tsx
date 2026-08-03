"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Send, CheckCircle2, Lock,
  AlertCircle, Eye, EyeOff,
} from "lucide-react";

interface Author { id: string; name: string | null; role: string; }
interface Message {
  id: string; message: string; isInternal: boolean;
  createdAt: string; author: Author;
}
interface SellerInfo {
  id: string; name: string | null; email: string;
  phone: string | null; brandName: string | null;
}
interface TicketDetail {
  id: string; ticketNumber: number; subject: string;
  category: string; priority: string; status: string;
  relatedOrderId: string | null; createdAt: string; updatedAt: string;
  resolvedAt: string | null; closedAt: string | null;
  seller: SellerInfo;
  assignedTo: { id: string; name: string | null } | null;
  messages: Message[];
}

const STATUS_OPTS = [
  { value: "OPEN",              label: "Open",           color: "#2563EB" },
  { value: "IN_PROGRESS",       label: "In Progress",    color: "#C2410C" },
  { value: "WAITING_ON_SELLER", label: "Awaiting Seller",color: "#7C3AED" },
  { value: "RESOLVED",          label: "Resolved",       color: "#16A34A" },
  { value: "CLOSED",            label: "Closed",         color: "#6B7280" },
];

const PRIORITY_OPTS = [
  { value: "LOW",    label: "Low",    color: "#6B7280" },
  { value: "NORMAL", label: "Normal", color: "#3B82F6" },
  { value: "HIGH",   label: "High",   color: "#F59E0B" },
  { value: "URGENT", label: "Urgent", color: "#EF4444" },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  OPEN:              { label: "Open",           bg: "#EFF6FF", color: "#2563EB" },
  IN_PROGRESS:       { label: "In Progress",    bg: "#FFF7ED", color: "#C2410C" },
  WAITING_ON_SELLER: { label: "Awaiting Seller",bg: "#F5F3FF", color: "#7C3AED" },
  RESOLVED:          { label: "Resolved",       bg: "#F0FDF4", color: "#16A34A" },
  CLOSED:            { label: "Closed",         bg: "#F9FAFB", color: "#6B7280" },
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
  return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AdminTicketPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket,     setTicket]     = useState<TicketDetail | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [reply,      setReply]      = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending,    setSending]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/admin/support/${id}`)
      .then((r) => r.json())
      .then((d) => { setTicket(d.ticket ?? null); setLoading(false); });
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  async function sendReply() {
    if (!reply.trim()) return;
    setSending(true);
    const res = await fetch(`/api/admin/support/${id}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply.trim(), isInternal }),
    });
    if (res.ok) {
      const data = await res.json();
      setTicket((t) => t ? { ...t, messages: [...t.messages, data.message] } : t);
      setReply("");
    }
    setSending(false);
  }

  async function updateField(patch: { status?: string; priority?: string }) {
    if (!ticket) return;
    setSaving(true);
    const res = await fetch(`/api/admin/support/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      setTicket((t) => t ? { ...t, ...patch } : t);
    }
    setSaving(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent)" }} />
    </div>
  );
  if (!ticket) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <AlertCircle className="w-10 h-10" style={{ color: "var(--border)" }} />
      <p style={{ color: "var(--text-muted)" }}>Ticket not found</p>
    </div>
  );

  const st = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.OPEN;
  const isClosed = ticket.status === "CLOSED" || ticket.status === "RESOLVED";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>

      {/* Header */}
      <div className="px-4 md:px-8 py-5 flex items-start gap-4 flex-wrap"
        style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}>
        <button onClick={() => router.push("/admin/support")}
          className="flex items-center gap-1.5 text-sm font-medium flex-shrink-0 mt-0.5"
          style={{ color: "var(--text-muted)" }}>
          <ArrowLeft className="w-4 h-4" /> All Tickets
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded"
              style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}>
              #{ticket.ticketNumber}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: st.bg, color: st.color }}>{st.label}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}>
              {CAT_LABEL[ticket.category] ?? ticket.category}
            </span>
          </div>
          <h1 className="text-base font-bold truncate" style={{ color: "var(--text-primary)" }}>{ticket.subject}</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {ticket.seller.brandName ?? ticket.seller.name ?? ticket.seller.email}
            {" · "}Opened {timeAgo(ticket.createdAt)}
          </p>
        </div>
        {saving && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 mt-1" style={{ color: "var(--accent)" }} />}
      </div>

      <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 px-4 md:px-8 py-6 max-w-6xl mx-auto">

        {/* ── Conversation ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="space-y-4 mb-4">
            {ticket.messages.map((msg) => {
              const isAdmin  = msg.author.role === "ADMIN";
              const isSeller = !isAdmin;

              if (msg.isInternal) {
                return (
                  <div key={msg.id} className="rounded-2xl px-4 py-3"
                    style={{ background: "#FFFBEB", border: "1px dashed #FCD34D" }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <EyeOff className="w-3 h-3" style={{ color: "#B45309" }} />
                      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: "#B45309" }}>
                        Internal Note
                      </span>
                      <span className="text-[10px] ml-auto" style={{ color: "#92400E" }}>
                        {msg.author.name ?? "Admin"} · {timeAgo(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "#78350F" }}>{msg.message}</p>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex gap-3 ${isSeller ? "flex-row-reverse" : ""}`}>
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: isAdmin ? "#4361EE" : "#16A34A" }}>
                    {isAdmin ? "A" : (msg.author.name?.[0]?.toUpperCase() ?? "S")}
                  </div>
                  <div className={`max-w-[80%]`}>
                    <p className={`text-[10px] font-semibold mb-1 ${isSeller ? "text-right" : ""}`}
                      style={{ color: "var(--text-muted)" }}>
                      {isAdmin ? (msg.author.name ?? "Support") : (msg.author.name ?? "Seller")}
                      {" · "}{timeAgo(msg.createdAt)}
                    </p>
                    <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                      style={{
                        background: isSeller ? "rgba(67,97,238,0.08)" : "var(--bg-card)",
                        border: `1px solid ${isSeller ? "rgba(67,97,238,0.2)" : "var(--border)"}`,
                        color: "var(--text-primary)",
                        borderTopRightRadius: isSeller ? 4 : undefined,
                        borderTopLeftRadius: isAdmin ? 4 : undefined,
                      }}>
                      {msg.message}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Reply form */}
          <div className="card p-4">
            {/* Internal note toggle */}
            <button
              onClick={() => setIsInternal(!isInternal)}
              className="flex items-center gap-2 text-xs font-semibold mb-3 px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: isInternal ? "#FFFBEB" : "var(--bg-muted)",
                color: isInternal ? "#B45309" : "var(--text-muted)",
                border: `1px solid ${isInternal ? "#FCD34D" : "var(--border)"}`,
              }}>
              {isInternal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {isInternal ? "Internal Note (hidden from seller)" : "Public Reply"}
            </button>

            <textarea value={reply} onChange={(e) => setReply(e.target.value)}
              placeholder={isInternal ? "Write an internal note…" : "Type your reply to the seller…"}
              rows={4}
              onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) sendReply(); }}
              className="w-full px-3 py-2.5 text-sm rounded-xl outline-none resize-none mb-3"
              style={{
                border: `1px solid ${isInternal ? "#FCD34D" : "var(--border)"}`,
                background: isInternal ? "#FFFBEB" : "var(--bg-muted)",
                color: "var(--text-primary)",
              }} />

            <div className="flex items-center justify-between">
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>⌘+Enter to send</p>
              <button onClick={sendReply} disabled={sending || !reply.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: isInternal ? "#B45309" : "var(--accent)" }}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isInternal ? "Save note" : "Send reply"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <div className="lg:w-72 flex-shrink-0 space-y-4 mt-6 lg:mt-0">

          {/* Status + Priority controls */}
          <div className="card p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Manage</p>

            <div>
              <p className="text-[10px] font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Status</p>
              <select value={ticket.status}
                onChange={(e) => updateField({ status: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl outline-none appearance-none"
                style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                {STATUS_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-[10px] font-semibold mb-1" style={{ color: "var(--text-muted)" }}>Priority</p>
              <select value={ticket.priority}
                onChange={(e) => updateField({ priority: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl outline-none appearance-none"
                style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                {PRIORITY_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {!isClosed && (
              <button onClick={() => updateField({ status: "RESOLVED" })}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}>
                <CheckCircle2 className="w-4 h-4" /> Mark Resolved
              </button>
            )}

            {!isClosed && (
              <button onClick={() => updateField({ status: "CLOSED" })}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
                style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                <Lock className="w-4 h-4" /> Close ticket
              </button>
            )}
          </div>

          {/* Ticket info */}
          <div className="card p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Ticket Info</p>
            {[
              { label: "Ticket #",  value: `#${ticket.ticketNumber}` },
              { label: "Category",  value: CAT_LABEL[ticket.category] ?? ticket.category },
              { label: "Priority",  value: ticket.priority },
              { label: "Created",   value: new Date(ticket.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
              ...(ticket.relatedOrderId ? [{ label: "Related Order", value: ticket.relatedOrderId }] : []),
              ...(ticket.assignedTo     ? [{ label: "Assigned To",   value: ticket.assignedTo.name ?? "Admin" }] : []),
              ...(ticket.resolvedAt     ? [{ label: "Resolved At",   value: timeAgo(ticket.resolvedAt) }] : []),
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-xs gap-2">
                <span style={{ color: "var(--text-muted)" }} className="flex-shrink-0">{row.label}</span>
                <span className="font-semibold text-right" style={{ color: "var(--text-primary)" }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Seller info */}
          <div className="card p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Seller</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: "#4361EE" }}>
                {(ticket.seller.brandName ?? ticket.seller.name ?? "S")[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                  {ticket.seller.brandName ?? ticket.seller.name ?? "—"}
                </p>
                <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{ticket.seller.email}</p>
              </div>
            </div>
            {ticket.seller.phone && (
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--text-muted)" }}>Phone</span>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{ticket.seller.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

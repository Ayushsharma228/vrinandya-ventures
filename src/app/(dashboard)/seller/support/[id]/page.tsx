"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Send, CheckCircle2, Lock,
  HelpCircle, AlertCircle,
} from "lucide-react";

interface Author { id: string; name: string | null; role: string; }
interface Message { id: string; message: string; isInternal: boolean; createdAt: string; author: Author; }
interface TicketDetail {
  id: string; ticketNumber: number; subject: string;
  category: string; priority: string; status: string;
  relatedOrderId: string | null; createdAt: string; updatedAt: string;
  resolvedAt: string | null; closedAt: string | null;
  assignedTo: { id: string; name: string | null } | null;
  messages: Message[];
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  OPEN:              { label: "Open",          bg: "#EFF6FF", color: "#2563EB" },
  IN_PROGRESS:       { label: "In Progress",   bg: "#FFF7ED", color: "#C2410C" },
  WAITING_ON_SELLER: { label: "Awaiting You",  bg: "#F5F3FF", color: "#7C3AED" },
  RESOLVED:          { label: "Resolved",      bg: "#F0FDF4", color: "#16A34A" },
  CLOSED:            { label: "Closed",        bg: "#F9FAFB", color: "#6B7280" },
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

export default function SellerTicketPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply]     = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/seller/support/${id}`)
      .then((r) => r.json())
      .then((d) => { setTicket(d.ticket ?? null); setLoading(false); });
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  async function sendReply() {
    if (!reply.trim()) return;
    setSending(true);
    const res = await fetch(`/api/seller/support/${id}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setTicket((t) => t ? { ...t, messages: [...t.messages, data.message] } : t);
      setReply("");
    }
    setSending(false);
  }

  async function closeTicket() {
    setClosing(true);
    await fetch(`/api/seller/support/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close" }),
    });
    setTicket((t) => t ? { ...t, status: "CLOSED" } : t);
    setClosing(false);
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
        <button onClick={() => router.push("/seller/support")}
          className="flex items-center gap-1.5 text-sm font-medium flex-shrink-0 mt-0.5"
          style={{ color: "var(--text-muted)" }}>
          <ArrowLeft className="w-4 h-4" /> Support
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
            Opened {timeAgo(ticket.createdAt)}
            {ticket.assignedTo && ` · Assigned to ${ticket.assignedTo.name ?? "Support"}`}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-0 lg:gap-6 px-4 md:px-8 py-6 max-w-5xl mx-auto">

        {/* ── Conversation ──────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="space-y-4 mb-4">
            {ticket.messages.map((msg) => {
              const isAdmin = msg.author.role === "ADMIN";
              return (
                <div key={msg.id} className={`flex gap-3 ${isAdmin ? "" : "flex-row-reverse"}`}>
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: isAdmin ? "#4361EE" : "#16A34A" }}>
                    {isAdmin ? "S" : (msg.author.name?.[0]?.toUpperCase() ?? "U")}
                  </div>
                  {/* Bubble */}
                  <div className={`max-w-[80%] ${isAdmin ? "" : ""}`}>
                    <p className={`text-[10px] font-semibold mb-1 ${isAdmin ? "" : "text-right"}`}
                      style={{ color: "var(--text-muted)" }}>
                      {isAdmin ? "Support Team" : (msg.author.name ?? "You")}
                      {" · "}{timeAgo(msg.createdAt)}
                    </p>
                    <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                      style={{
                        background: isAdmin ? "var(--bg-card)" : "rgba(67,97,238,0.1)",
                        border: `1px solid ${isAdmin ? "var(--border)" : "rgba(67,97,238,0.2)"}`,
                        color: "var(--text-primary)",
                        borderTopLeftRadius: isAdmin ? 4 : undefined,
                        borderTopRightRadius: isAdmin ? undefined : 4,
                      }}>
                      {msg.message}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Resolved/closed banner */}
          {isClosed ? (
            <div className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: ticket.status === "RESOLVED" ? "#F0FDF4" : "var(--bg-muted)",
                       border: `1px solid ${ticket.status === "RESOLVED" ? "#BBF7D0" : "var(--border)"}` }}>
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: ticket.status === "RESOLVED" ? "#16A34A" : "var(--text-muted)" }} />
              <div>
                <p className="text-sm font-semibold" style={{ color: ticket.status === "RESOLVED" ? "#16A34A" : "var(--text-secondary)" }}>
                  This ticket is {ticket.status === "RESOLVED" ? "resolved" : "closed"}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  If you need further help, open a new ticket.
                </p>
              </div>
            </div>
          ) : (
            <div className="card p-4">
              <textarea value={reply} onChange={(e) => setReply(e.target.value)}
                placeholder="Type your reply…"
                rows={4}
                onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) sendReply(); }}
                className="w-full px-3 py-2.5 text-sm rounded-xl outline-none resize-none mb-3"
                style={{ border: "1px solid var(--border)", background: "var(--bg-muted)", color: "var(--text-primary)" }} />
              <div className="flex justify-end">
                <button onClick={sendReply} disabled={sending || !reply.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "var(--accent)" }}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send reply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <div className="lg:w-64 flex-shrink-0 space-y-4 mt-6 lg:mt-0">
          <div className="card p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Ticket Details</p>
            {[
              { label: "Status",   value: st.label },
              { label: "Category", value: CAT_LABEL[ticket.category] ?? ticket.category },
              { label: "Priority", value: ticket.priority },
              { label: "Ticket #", value: `#${ticket.ticketNumber}` },
              ...(ticket.relatedOrderId ? [{ label: "Order",  value: ticket.relatedOrderId }] : []),
              ...(ticket.assignedTo     ? [{ label: "Agent",  value: ticket.assignedTo.name ?? "Support" }] : []),
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-xs">
                <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{row.value}</span>
              </div>
            ))}
          </div>

          {!isClosed && (
            <button onClick={closeTicket} disabled={closing}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              {closing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Close ticket
            </button>
          )}

          <div className="card p-4 text-xs" style={{ color: "var(--text-muted)" }}>
            <p className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Response time</p>
            <p>We typically reply within <strong>4–12 hours</strong> during business hours (Mon–Sat, 10am–7pm IST).</p>
          </div>
        </div>
      </div>
    </div>
  );
}

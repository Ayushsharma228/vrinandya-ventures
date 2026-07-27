"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Send, RefreshCw, Phone, MapPin, ArrowLeft, User } from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  waId: string;
  name: string | null;
  status: string;
  lastMessageAt: string | null;
  lead: { id: string; name: string; phone: string; stage: string; city: string | null; source: string } | null;
  messages: Message[];
}

const STAGE_LABEL: Record<string, string> = {
  LEAD: "Lead", CALL_NOT_PICKED: "Call Not Picked", BUSY: "Busy",
  SCHEDULE_MEETING: "Schedule Meeting", NOT_INTERESTED: "Not Interested",
  PROSPECT: "Prospect", INTERESTED: "Interested", WILL_PAY: "Will Pay",
  PAID: "Paid", ONBOARDED: "Onboarded", WEBSITE_DONE: "Website Done",
  ENGAGEMENT_LIVE: "Engagement Live", ADS_LIVE: "Ads Live",
};

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today     = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  if (d >= today)     return "Today";
  if (d >= yesterday) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function WhatsAppInboxPage() {
  const [convs,       setConvs]       = useState<Conversation[]>([]);
  const [activeId,    setActiveId]    = useState<string | null>(null);
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [activeLead,  setActiveLead]  = useState<Conversation | null>(null);
  const [reply,       setReply]       = useState("");
  const [sending,     setSending]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchConvs = useCallback(async () => {
    const r = await fetch("/api/admin/crm/conversations");
    if (r.ok) {
      const { conversations } = await r.json();
      setConvs(conversations);
    }
    setLoading(false);
  }, []);

  const fetchMessages = useCallback(async (id: string, silent = false) => {
    if (!silent) setLoadingMsgs(true);
    const r = await fetch(`/api/admin/crm/conversations/${id}`);
    if (r.ok) {
      const { conversation } = await r.json();
      setMessages(conversation.messages);
      setActiveLead(conversation);
    }
    if (!silent) setLoadingMsgs(false);
  }, []);

  useEffect(() => { fetchConvs(); }, [fetchConvs]);

  // Poll active conversation every 5s
  useEffect(() => {
    if (!activeId) return;
    const t = setInterval(() => fetchMessages(activeId, true), 5000);
    return () => clearInterval(t);
  }, [activeId, fetchMessages]);

  // Poll conversation list every 15s
  useEffect(() => {
    const t = setInterval(fetchConvs, 15000);
    return () => clearInterval(t);
  }, [fetchConvs]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function openConv(id: string) {
    setActiveId(id);
    setMessages([]);
    await fetchMessages(id);
  }

  async function sendReply() {
    if (!reply.trim() || !activeId || sending) return;
    setSending(true);
    const text = reply.trim();
    setReply("");
    const r = await fetch(`/api/admin/crm/conversations/${activeId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });
    if (r.ok) {
      await fetchMessages(activeId, true);
      await fetchConvs();
    }
    setSending(false);
  }

  // Group messages by date
  const grouped: { date: string; msgs: Message[] }[] = [];
  for (const msg of messages) {
    const d = formatDate(msg.createdAt);
    const last = grouped[grouped.length - 1];
    if (last && last.date === d) last.msgs.push(msg);
    else grouped.push({ date: d, msgs: [msg] });
  }

  const activeConv = convs.find(c => c.id === activeId) ?? activeLead;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-page)" }}>
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 pb-4" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <MessageCircle className="w-5 h-5" style={{ color: "#16A34A" }} />
          <div>
            <h1 className="text-base font-bold" style={{ color: "var(--text-900)" }}>WhatsApp Inbox</h1>
            <p className="text-xs" style={{ color: "var(--text-400)" }}>All lead conversations in one place</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={fetchConvs} className="p-2 rounded-lg hover:opacity-70 transition-opacity" style={{ background: "var(--bg-muted)" }}>
              <RefreshCw className="w-3.5 h-3.5" style={{ color: "var(--text-400)" }} />
            </button>
            <Link href="/admin/crm" className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: "var(--bg-muted)", color: "var(--text-600)" }}>
              ← CRM
            </Link>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Conversation list */}
        <div style={{ width: 320, flexShrink: 0, borderRight: "1px solid var(--border)", overflowY: "auto", background: "var(--bg-card)" }}>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-4 h-4 animate-spin" style={{ color: "var(--text-400)" }} />
            </div>
          ) : convs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 px-6 text-center">
              <MessageCircle className="w-8 h-8" style={{ color: "var(--border)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--text-600)" }}>No conversations yet</p>
              <p className="text-xs" style={{ color: "var(--text-400)" }}>Send via Arya on a lead to start a conversation</p>
            </div>
          ) : (
            convs.map(c => {
              const lastMsg  = c.messages[0];
              const isActive = c.id === activeId;
              const preview  = lastMsg?.content
                ? lastMsg.content.length > 40 ? lastMsg.content.slice(0, 40) + "…" : lastMsg.content
                : "No messages yet";
              const isFromLead = lastMsg?.role === "USER";

              return (
                <button
                  key={c.id}
                  onClick={() => openConv(c.id)}
                  className="w-full text-left px-4 py-3 flex gap-3 items-start transition-colors"
                  style={{
                    background:   isActive ? "rgba(22,163,74,0.08)" : "transparent",
                    borderLeft:   isActive ? "3px solid #16A34A" : "3px solid transparent",
                    borderBottom: "1px solid var(--border)",
                  }}>
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{ background: "rgba(22,163,74,0.12)", color: "#16A34A" }}>
                    {(c.lead?.name ?? c.name ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-900)" }}>
                        {c.lead?.name ?? c.name ?? c.waId}
                      </p>
                      <span className="text-xs flex-shrink-0" style={{ color: "var(--text-400)" }}>
                        {timeAgo(c.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: isFromLead ? "var(--text-700)" : "var(--text-400)", fontWeight: isFromLead ? 500 : 400 }}>
                      {isFromLead ? "" : "You: "}{preview}
                    </p>
                    {c.lead?.stage && (
                      <p className="text-xs mt-1" style={{ color: "var(--text-400)" }}>
                        {STAGE_LABEL[c.lead.stage] ?? c.lead.stage}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Chat area */}
        {!activeId ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <MessageCircle className="w-12 h-12" style={{ color: "var(--border)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--text-600)" }}>Select a conversation</p>
            <p className="text-xs" style={{ color: "var(--text-400)" }}>Choose a lead from the left to start chatting</p>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Chat header */}
            <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}>
              <button onClick={() => setActiveId(null)} className="md:hidden p-1">
                <ArrowLeft className="w-4 h-4" style={{ color: "var(--text-400)" }} />
              </button>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ background: "rgba(22,163,74,0.12)", color: "#16A34A" }}>
                {(activeConv?.lead?.name ?? activeConv?.name ?? "?")[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: "var(--text-900)" }}>
                  {activeConv?.lead?.name ?? activeConv?.name ?? activeConv?.waId}
                </p>
                <div className="flex items-center gap-3">
                  {activeConv?.lead?.phone && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-400)" }}>
                      <Phone className="w-3 h-3" />{activeConv.lead.phone}
                    </span>
                  )}
                  {activeConv?.lead?.city && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-400)" }}>
                      <MapPin className="w-3 h-3" />{activeConv.lead.city}
                    </span>
                  )}
                  {activeConv?.lead?.stage && (
                    <span className="text-xs" style={{ color: "#16A34A" }}>
                      {STAGE_LABEL[activeConv.lead.stage] ?? activeConv.lead.stage}
                    </span>
                  )}
                </div>
              </div>
              {activeConv?.lead?.id && (
                <Link href={`/admin/crm/leads/${activeConv.lead.id}`}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"
                  style={{ background: "var(--bg-muted)", color: "var(--text-600)" }}>
                  <User className="w-3 h-3" /> View Lead
                </Link>
              )}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 2 }}>
              {loadingMsgs ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-4 h-4 animate-spin" style={{ color: "var(--text-400)" }} />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <p className="text-sm" style={{ color: "var(--text-400)" }}>No messages yet</p>
                </div>
              ) : (
                grouped.map(group => (
                  <div key={group.date}>
                    {/* Date divider */}
                    <div className="flex items-center gap-3 my-4">
                      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-muted)", color: "var(--text-400)" }}>
                        {group.date}
                      </span>
                      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {group.msgs.map(msg => {
                        const isUser = msg.role === "USER";
                        return (
                          <div key={msg.id} style={{ display: "flex", justifyContent: isUser ? "flex-start" : "flex-end" }}>
                            <div style={{
                              maxWidth: "72%",
                              padding: "8px 12px",
                              borderRadius: isUser ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                              background: isUser ? "var(--bg-muted)" : "rgba(22,163,74,0.12)",
                              border: `1px solid ${isUser ? "var(--border)" : "rgba(22,163,74,0.2)"}`,
                            }}>
                              <p className="text-sm" style={{ color: "var(--text-900)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                {msg.content}
                              </p>
                              <p className="text-xs mt-1 text-right" style={{ color: "var(--text-400)" }}>
                                {formatTime(msg.createdAt)}
                                {!isUser && <span className="ml-1" style={{ color: "#16A34A" }}>✓</span>}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply input */}
            <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}>
              <div className="flex gap-2 items-end">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                  rows={2}
                  className="flex-1 text-sm px-3 py-2 rounded-xl resize-none"
                  style={{
                    background: "var(--bg-muted)",
                    border: "1px solid var(--border)",
                    color: "var(--text-900)",
                    outline: "none",
                  }}
                />
                <button
                  onClick={sendReply}
                  disabled={!reply.trim() || sending}
                  className="p-2.5 rounded-xl flex items-center justify-center transition-opacity disabled:opacity-40"
                  style={{ background: "#16A34A", color: "#fff", flexShrink: 0 }}>
                  {sending
                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs mt-1.5" style={{ color: "var(--text-400)" }}>
                Free-text works within 24h of the lead&apos;s last reply. After that, use a template.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

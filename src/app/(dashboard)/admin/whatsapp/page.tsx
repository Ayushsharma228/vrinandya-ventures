"use client";

import { useEffect, useState, useCallback } from "react";
import { MessageCircle, RefreshCw, CheckCircle2, Zap, XCircle, Clock, ChevronRight, Send, X } from "lucide-react";
import Link from "next/link";

interface WAConversation {
  id: string;
  waId: string;
  phoneNumber: string;
  name: string | null;
  status: string;
  lastMessageAt: string | null;
  qualifiedAt: string | null;
  _count: { messages: number };
  messages: Array<{ content: string; role: string; createdAt: string }>;
  lead: { id: string; name: string; leadScore: number | null; temperature: string | null; pipelineStage: string } | null;
}

interface WAMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface DetailConversation extends WAConversation {
  messages: WAMessage[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ACTIVE:      { label: "Active",      color: "#3B82F6",          icon: MessageCircle },
  QUALIFIED:   { label: "Qualified",   color: "var(--green-500)", icon: CheckCircle2 },
  HANDED_OFF:  { label: "Handed Off",  color: "#8B5CF6",          icon: Zap },
  CLOSED:      { label: "Closed",      color: "var(--text-300)",  icon: XCircle },
  OPTED_OUT:   { label: "Opted Out",   color: "#EF4444",          icon: XCircle },
};

function relativeTime(date: string | null): string {
  if (!date) return "—";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function tempColor(temp: string | null): string {
  if (temp === "HOT") return "#EF4444";
  if (temp === "WARM") return "#F59E0B";
  return "#3B82F6";
}

export default function AdminWhatsAppPage() {
  const [conversations, setConversations] = useState<WAConversation[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<DetailConversation | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async (f = filter) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (f !== "all") params.set("status", f);
    const res = await fetch(`/api/admin/whatsapp?${params}`);
    if (res.ok) {
      const d = await res.json();
      setConversations(d.conversations);
      setStatusMap(d.statusMap ?? {});
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id: string) => {
    setLoadingDetail(true);
    const res = await fetch(`/api/admin/whatsapp/${id}`);
    if (res.ok) {
      const d = await res.json();
      setSelected(d.conversation);
    }
    setLoadingDetail(false);
  };

  const sendManualMessage = async () => {
    if (!selected || !message.trim()) return;
    setSending(true);
    await fetch(`/api/admin/whatsapp/${selected.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_message", message: message.trim() }),
    });
    setMessage("");
    await openDetail(selected.id);
    setSending(false);
  };

  const totalConvs = Object.values(statusMap).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-900)" }}>WhatsApp Conversations</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-400)" }}>Arya qualifies leads automatically via WhatsApp</p>
        </div>
        <button onClick={() => load()} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
          style={{ border: "1px solid var(--border)", color: "var(--text-400)" }}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, { label, color, icon: Icon }]) => (
          <div key={key} className="p-4 rounded-xl cursor-pointer transition-all"
            style={{ background: filter === key ? `${color}15` : "var(--bg-card)", border: `1px solid ${filter === key ? color : "var(--border)"}` }}
            onClick={() => { setFilter(key); load(key); }}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-4 h-4" style={{ color }} />
              <span className="text-xs" style={{ color: "var(--text-400)" }}>{label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color }}>{statusMap[key] ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4 h-[calc(100vh-320px)] min-h-[400px]">
        {/* Conversation list */}
        <div className="w-80 flex-shrink-0 rounded-xl overflow-hidden flex flex-col" style={{ border: "1px solid var(--border)" }}>
          {/* Filter bar */}
          <div className="px-3 py-2 flex gap-1 flex-wrap" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
            {["all", "ACTIVE", "QUALIFIED", "HANDED_OFF"].map(f => (
              <button key={f} onClick={() => { setFilter(f); load(f); }}
                className="px-2 py-1 rounded text-xs font-medium"
                style={filter === f ? { background: "var(--green-500)", color: "#fff" } : { background: "var(--bg-muted)", color: "var(--text-400)" }}>
                {f === "all" ? "All" : STATUS_CONFIG[f]?.label ?? f}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto" style={{ background: "var(--bg-page)" }}>
            {loading ? (
              <div className="p-4 text-center text-sm" style={{ color: "var(--text-300)" }}>Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageCircle className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-300)" }} />
                <p className="text-sm" style={{ color: "var(--text-400)" }}>No conversations yet</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-300)" }}>Leads who message your WhatsApp number will appear here</p>
              </div>
            ) : conversations.map(c => {
              const sc = STATUS_CONFIG[c.status];
              const lastMsg = c.messages[0];
              const isSelected = selected?.id === c.id;
              return (
                <div key={c.id} onClick={() => openDetail(c.id)}
                  className="px-4 py-3 cursor-pointer border-b transition-colors"
                  style={{ borderColor: "var(--border)", background: isSelected ? "rgba(0,198,122,0.06)" : "transparent" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-900)" }}>
                          {c.name ?? c.phoneNumber}
                        </p>
                        {c.lead?.temperature && (
                          <span className="text-xs font-bold flex-shrink-0" style={{ color: tempColor(c.lead.temperature) }}>
                            {c.lead.temperature === "HOT" ? "🔥" : c.lead.temperature === "WARM" ? "🟡" : "🔵"}
                          </span>
                        )}
                      </div>
                      {lastMsg && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-400)" }}>
                          {lastMsg.role === "ASSISTANT" ? "Arya: " : ""}{lastMsg.content.slice(0, 50)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs" style={{ color: "var(--text-300)" }}>{relativeTime(c.lastMessageAt)}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${sc?.color ?? "#888"}15`, color: sc?.color ?? "#888" }}>
                        {sc?.label ?? c.status}
                      </span>
                    </div>
                  </div>
                  {c.lead?.leadScore && (
                    <div className="mt-1 flex items-center gap-1">
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                        <div className="h-full rounded-full" style={{ width: `${c.lead.leadScore}%`, background: tempColor(c.lead.temperature) }} />
                      </div>
                      <span className="text-xs" style={{ color: "var(--text-300)" }}>{c.lead.leadScore}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat detail panel */}
        <div className="flex-1 rounded-xl flex flex-col overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
              <div className="text-center">
                <MessageCircle className="w-10 h-10 mx-auto mb-2" style={{ color: "var(--text-300)" }} />
                <p className="text-sm" style={{ color: "var(--text-400)" }}>Select a conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 flex items-center justify-between" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>{selected.name ?? selected.phoneNumber}</p>
                  <p className="text-xs" style={{ color: "var(--text-400)" }}>
                    {selected.phoneNumber} · {selected._count.messages} messages ·{" "}
                    <span style={{ color: STATUS_CONFIG[selected.status]?.color }}>{STATUS_CONFIG[selected.status]?.label}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selected.lead && (
                    <Link href={`/admin/crm/leads/${selected.lead.id}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: "rgba(0,198,122,0.1)", color: "var(--green-500)" }}>
                      View Lead →
                    </Link>
                  )}
                  <button onClick={() => setSelected(null)} style={{ color: "var(--text-300)" }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: "var(--bg-page)" }}>
                {loadingDetail ? (
                  <div className="text-center text-sm" style={{ color: "var(--text-300)" }}>Loading...</div>
                ) : selected.messages.map(msg => {
                  const isArya = msg.role === "ASSISTANT";
                  return (
                    <div key={msg.id} className={`flex ${isArya ? "justify-start" : "justify-end"}`}>
                      <div className="max-w-[70%] px-3 py-2 rounded-xl"
                        style={{
                          background: isArya ? "var(--bg-card)" : "rgba(0,198,122,0.15)",
                          border: `1px solid ${isArya ? "var(--border)" : "rgba(0,198,122,0.3)"}`,
                        }}>
                        {isArya && (
                          <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--green-500)" }}>Arya</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-900)" }}>{msg.content}</p>
                        <p className="text-xs mt-1" style={{ color: "var(--text-300)" }}>
                          {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Send message (admin manual reply) */}
              {selected.status !== "OPTED_OUT" && (
                <div className="px-4 py-3 flex gap-2" style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)" }}>
                  <input
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendManualMessage(); } }}
                    placeholder="Send manual message as admin..."
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-900)" }}
                  />
                  <button onClick={sendManualMessage} disabled={sending || !message.trim()}
                    className="px-3 py-2 rounded-lg disabled:opacity-50"
                    style={{ background: "var(--green-500)", color: "#fff" }}>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

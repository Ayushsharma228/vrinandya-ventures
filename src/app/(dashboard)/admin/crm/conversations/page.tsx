"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, Send, User, Zap, ThumbsUp, Minus, ThumbsDown, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Lead {
  id: string; name: string; phone: string; email: string | null;
  pipelineStage: string; temperature: string | null; leadScore: number | null;
  aiStatus: string; recommendedPlan: string | null;
}
interface Message { id: string; role: string; content: string; createdAt: string; }
interface Conversation { id: string; status: string; messages: Message[]; startedAt: string | null; }

const TEMP_COLOR: Record<string, string> = {
  HOT: "#EF4444", WARM: "#F59E0B", COLD: "#3B82F6",
};
const TEMP_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  HOT: ThumbsUp, WARM: Minus, COLD: ThumbsDown,
};

export default function AiConversationsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/crm/leads?limit=200")
      .then(r => r.json())
      .then(d => setLeads(d.leads ?? []));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  async function loadConversation(lead: Lead) {
    setSelectedLead(lead);
    setLoading(true);
    const res = await fetch(`/api/admin/crm/ai-conversation?leadId=${lead.id}`);
    const data = await res.json();
    setConversation(data.conversation ?? null);
    setLoading(false);
  }

  async function startConversation() {
    if (!selectedLead) return;
    setStarting(true);
    const res = await fetch("/api/admin/crm/ai-conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: selectedLead.id, startNew: true }),
    });
    const data = await res.json();
    setConversation(prev => ({
      id: data.conversationId, status: "ACTIVE", startedAt: new Date().toISOString(),
      messages: prev?.messages ?? [],
    }));
    if (data.reply) {
      setConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, { id: Date.now().toString(), role: "assistant", content: data.reply, createdAt: new Date().toISOString() }],
      } : null);
    }
    setStarting(false);
  }

  async function sendMessage() {
    if (!selectedLead || !input.trim() || !conversation) return;
    const msg = input.trim();
    setInput("");
    setConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, { id: Date.now().toString(), role: "user", content: msg, createdAt: new Date().toISOString() }],
    } : null);
    setSending(true);
    const res = await fetch("/api/admin/crm/ai-conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: selectedLead.id, userMessage: msg }),
    });
    const data = await res.json();
    if (data.reply) {
      setConversation(prev => prev ? {
        ...prev,
        messages: [...prev.messages, { id: (Date.now() + 1).toString(), role: "assistant", content: data.reply, createdAt: new Date().toISOString() }],
      } : null);
    }
    if (data.scoreResult) {
      setSelectedLead(prev => prev ? {
        ...prev,
        leadScore: data.scoreResult.totalScore,
        temperature: data.scoreResult.temperature,
        recommendedPlan: data.scoreResult.recommendedPlan,
      } : null);
      setLeads(prev => prev.map(l => l.id === selectedLead.id ? {
        ...l, leadScore: data.scoreResult.totalScore, temperature: data.scoreResult.temperature,
      } : l));
    }
    setSending(false);
  }

  return (
    <div className="flex h-screen" style={{ background: "var(--bg-page)" }}>
      {/* Lead list */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r" style={{ borderColor: "var(--border)", background: "var(--bg-sidebar)" }}>
        <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <Link href="/admin/crm" className="flex items-center gap-2 text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            <ArrowLeft className="w-3 h-3" /> Back to CRM
          </Link>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" style={{ color: "var(--green-500)" }} />
            <h1 className="text-sm font-bold text-white">AI Conversations</h1>
          </div>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{leads.length} leads</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {leads.map(lead => {
            const TempIcon = lead.temperature ? TEMP_ICON[lead.temperature] : null;
            const tempColor = lead.temperature ? TEMP_COLOR[lead.temperature] : "var(--text-400)";
            return (
              <button key={lead.id} onClick={() => loadConversation(lead)}
                className="w-full text-left px-4 py-3 border-b transition-colors"
                style={{
                  borderColor: "var(--border)",
                  background: selectedLead?.id === lead.id ? "rgba(0,198,122,0.1)" : "transparent",
                }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white truncate">{lead.name}</span>
                  {lead.leadScore !== null && (
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.1)", color: tempColor }}>
                      {lead.leadScore}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {TempIcon && <TempIcon className="w-3 h-3" />}
                  <span className="text-xs truncate" style={{ color: tempColor }}>
                    {lead.temperature ?? lead.aiStatus}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat panel */}
      {!selectedLead ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <Bot className="w-12 h-12" style={{ color: "var(--border)" }} />
          <p className="text-sm" style={{ color: "var(--text-400)" }}>Select a lead to view or start an AI conversation</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <div>
              <h2 className="font-bold text-white">{selectedLead.name}</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>{selectedLead.phone}</p>
            </div>
            <div className="flex items-center gap-3">
              {selectedLead.leadScore !== null && (
                <div className="text-center">
                  <div className="text-xl font-bold" style={{ color: selectedLead.temperature ? TEMP_COLOR[selectedLead.temperature] : "white" }}>
                    {selectedLead.leadScore}<span className="text-xs font-normal">/100</span>
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-400)" }}>Lead Score</div>
                </div>
              )}
              {selectedLead.recommendedPlan && (
                <div className="text-xs px-3 py-1.5 rounded-lg" style={{ background: "rgba(0,198,122,0.1)", color: "var(--green-500)", border: "1px solid rgba(0,198,122,0.2)" }}>
                  {selectedLead.recommendedPlan}
                </div>
              )}
              {!conversation && (
                <button onClick={startConversation} disabled={starting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "var(--green-500)" }}>
                  {starting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Start AI
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {loading ? (
              <div className="text-center text-sm py-8" style={{ color: "var(--text-400)" }}>Loading conversation...</div>
            ) : !conversation ? (
              <div className="text-center py-12">
                <Bot className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--border)" }} />
                <p className="text-sm mb-2" style={{ color: "var(--text-400)" }}>No conversation yet</p>
                <p className="text-xs" style={{ color: "var(--text-400)" }}>Click "Start AI" to begin qualifying this lead</p>
              </div>
            ) : conversation.messages.length === 0 ? (
              <div className="text-center text-sm py-8" style={{ color: "var(--text-400)" }}>Conversation started — send first message</div>
            ) : (
              conversation.messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "assistant" ? "" : "flex-row-reverse"}`}>
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                    style={{ background: msg.role === "assistant" ? "rgba(0,198,122,0.2)" : "rgba(255,255,255,0.1)" }}>
                    {msg.role === "assistant"
                      ? <Bot className="w-4 h-4" style={{ color: "var(--green-500)" }} />
                      : <User className="w-4 h-4 text-white" />
                    }
                  </div>
                  <div className="max-w-md">
                    <div className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={{
                        background: msg.role === "assistant" ? "rgba(0,198,122,0.1)" : "rgba(255,255,255,0.08)",
                        color: "white",
                        borderRadius: msg.role === "assistant" ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
                      }}>
                      {msg.content}
                    </div>
                    <p className="text-xs mt-1 px-1" style={{ color: "var(--text-400)" }}>
                      {msg.role === "assistant" ? "Arya (AI)" : "Admin"} ·{" "}
                      {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: "rgba(0,198,122,0.2)" }}>
                  <Bot className="w-4 h-4" style={{ color: "var(--green-500)" }} />
                </div>
                <div className="px-4 py-2.5 rounded-2xl text-sm" style={{ background: "rgba(0,198,122,0.1)", color: "rgba(255,255,255,0.4)" }}>
                  Arya is typing...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {conversation && (
            <div className="px-6 py-4 border-t" style={{ borderColor: "var(--border)" }}>
              <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type lead's reply to simulate conversation..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", color: "white" }}
                />
                <button type="submit" disabled={sending || !input.trim()}
                  className="px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-semibold disabled:opacity-40"
                  style={{ background: "var(--green-500)", color: "white" }}>
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-xs mt-2" style={{ color: "var(--text-400)" }}>
                Simulate the lead&apos;s WhatsApp replies here. In Phase 2, this will be live via WhatsApp Business API.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

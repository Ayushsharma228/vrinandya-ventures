"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  HelpCircle, Loader2, Search, ChevronRight, SlidersHorizontal,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface Ticket {
  id: string; ticketNumber: number; subject: string;
  category: string; priority: string; status: string;
  createdAt: string; updatedAt: string;
  seller: { id: string; name: string | null; email: string; brandName: string | null };
  assignedTo: { id: string; name: string | null } | null;
  messages: { createdAt: string }[];
  _count: { messages: number };
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  OPEN:              { label: "Open",          bg: "#EFF6FF", color: "#2563EB" },
  IN_PROGRESS:       { label: "In Progress",   bg: "#FFF7ED", color: "#C2410C" },
  WAITING_ON_SELLER: { label: "Awaiting Seller", bg: "#F5F3FF", color: "#7C3AED" },
  RESOLVED:          { label: "Resolved",      bg: "#F0FDF4", color: "#16A34A" },
  CLOSED:            { label: "Closed",        bg: "#F9FAFB", color: "#6B7280" },
};

const PRIORITY_COLOR: Record<string, string> = {
  URGENT: "#EF4444", HIGH: "#F59E0B", NORMAL: "#3B82F6", LOW: "#6B7280",
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

export default function AdminSupportPage() {
  const [tickets,  setTickets]  = useState<Ticket[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("");
  const [priority, setPriority] = useState("");

  function load() {
    setLoading(true);
    const p = new URLSearchParams();
    if (search)   p.set("search",   search);
    if (status)   p.set("status",   status);
    if (priority) p.set("priority", priority);
    fetch(`/api/admin/support?${p}`)
      .then((r) => r.json())
      .then((d) => { setTickets(d.tickets ?? []); setLoading(false); });
  }

  useEffect(() => { load(); }, [status, priority]);

  const counts = {
    open: tickets.filter((t) => t.status === "OPEN").length,
    inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    waiting: tickets.filter((t) => t.status === "WAITING_ON_SELLER").length,
    resolved: tickets.filter((t) => t.status === "RESOLVED").length,
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Support Tickets"
        subtitle={`${tickets.length} total tickets`}
        searchValue={search}
        searchPlaceholder="Search by subject or seller…"
        onSearchChange={setSearch}
        filters={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="pl-8 pr-3 py-2 text-sm rounded-xl outline-none appearance-none"
                style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                <option value="">All Statuses</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <SlidersHorizontal className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }} />
            </div>
            <div className="relative">
              <select value={priority} onChange={(e) => setPriority(e.target.value)}
                className="pl-8 pr-3 py-2 text-sm rounded-xl outline-none appearance-none"
                style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                <option value="">All Priorities</option>
                {["URGENT","HIGH","NORMAL","LOW"].map((p) => (
                  <option key={p} value={p}>{p[0]+p.slice(1).toLowerCase()}</option>
                ))}
              </select>
              <SlidersHorizontal className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }} />
            </div>
            <button onClick={load}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
              style={{ background: "var(--accent)", color: "#fff" }}>
              <Search className="w-3.5 h-3.5" /> Search
            </button>
          </div>
        }
      />

      <div className="px-4 md:px-8 py-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Open",       count: counts.open,       color: "#2563EB" },
            { label: "In Progress",count: counts.inProgress, color: "#C2410C" },
            { label: "Waiting",    count: counts.waiting,    color: "#7C3AED" },
            { label: "Resolved",   count: counts.resolved,   color: "#16A34A" },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent)" }} />
          </div>
        ) : tickets.length === 0 ? (
          <div className="card py-20 flex flex-col items-center gap-3 text-center">
            <HelpCircle className="w-14 h-14" style={{ color: "var(--border)" }} />
            <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>No tickets found</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-muted)", borderBottom: "1px solid var(--border)" }}>
                  {["#","Seller","Subject","Category","Priority","Status","Last Activity",""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap"
                      style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map((t, i) => {
                  const st = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.OPEN;
                  const lastActivity = t.messages[0]?.createdAt ?? t.updatedAt;
                  return (
                    <tr key={t.id}
                      style={{ borderBottom: i < tickets.length-1 ? "1px solid var(--border)" : "none", background: "var(--bg-card)" }}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-mono font-semibold" style={{ color: "var(--text-muted)" }}>#{t.ticketNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                          {t.seller.brandName ?? t.seller.name ?? t.seller.email}
                        </p>
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{t.seller.email}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{t.subject}</p>
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{t._count.messages} message{t._count.messages !== 1 ? "s" : ""}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                          {CAT_LABEL[t.category] ?? t.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[10px] font-bold" style={{ color: PRIORITY_COLOR[t.priority] ?? "#6B7280" }}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: st.bg, color: st.color }}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: "var(--text-muted)" }}>
                        {timeAgo(lastActivity)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link href={`/admin/support/${t.id}`}
                          className="flex items-center gap-1 text-xs font-semibold"
                          style={{ color: "var(--accent)" }}>
                          View <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

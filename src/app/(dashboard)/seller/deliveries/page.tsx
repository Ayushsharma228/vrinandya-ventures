"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, Truck, Clock, XCircle, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, ExternalLink, Copy, CopyCheck,
  AlertCircle, Flag, Package, MapPin, Send,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface DeliveryIssue { id: string; event: string; details: string | null; createdAt: string; }
interface Delivery {
  id: string; externalOrderId: string; status: string;
  awbNumber: string | null; trackingUrl: string | null; courier: string | null;
  supplierTrackingNo: string | null; supplierCourier: string | null;
  createdAt: string; updatedAt: string; totalAmount: number;
  expectedDeliveryDate: string | null;
  customerName: string | null;
  customerAddress: { phone?: string; city?: string; state?: string } | null;
  timeline: DeliveryIssue[];
}
interface Stats { pending: number; delivered: number; inTransit: number; rto: number; cancelled: number; }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SHIPPED:    { label: "Shipped",    color: "#7C3AED", bg: "#F5F3FF" },
  IN_TRANSIT: { label: "In Transit", color: "#025864", bg: "#ECFDF5" },
  DELIVERED:  { label: "Delivered",  color: "#16A34A", bg: "#F0FDF4" },
  CANCELLED:  { label: "Cancelled",  color: "#6B7280", bg: "#F9FAFB" },
  NEW:        { label: "Pending",    color: "#3B82F6", bg: "#EFF6FF" },
  PROCESSING: { label: "Processing", color: "#F59E0B", bg: "#FFF7ED" },
  RTO:        { label: "RTO",        color: "#EF4444", bg: "#FEF2F2" },
};

const STATUS_FILTERS = ["ALL", "NEW", "PROCESSING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "RTO", "CANCELLED"];

const STAT_CARDS = [
  { key: "pending",   label: "Pending",    icon: Clock,         color: "#7C3AED", bg: "#F5F3FF" },
  { key: "inTransit", label: "In Transit", icon: Truck,         color: "#3B82F6", bg: "#EFF6FF" },
  { key: "delivered", label: "Delivered",  icon: CheckCircle2,  color: "#16A34A", bg: "#F0FDF4" },
  { key: "rto",       label: "RTO",        icon: AlertTriangle, color: "#EF4444", bg: "#FEF2F2" },
  { key: "cancelled", label: "Cancelled",  icon: XCircle,       color: "#6B7280", bg: "#F9FAFB" },
];

// Delivery lifecycle steps
const STEPS = [
  { key: "NEW",        label: "Ordered"    },
  { key: "PROCESSING", label: "Processing" },
  { key: "SHIPPED",    label: "Shipped"    },
  { key: "IN_TRANSIT", label: "In Transit" },
  { key: "DELIVERED",  label: "Delivered"  },
];
const STEP_RANK: Record<string, number> = {
  NEW: 0, PROCESSING: 1, SHIPPED: 2, IN_TRANSIT: 3, DELIVERED: 4, RTO: 4, CANCELLED: 4,
};

const ISSUE_TYPES = [
  "Delivery attempt failed",
  "Customer not available",
  "Wrong address / incorrect location",
  "Delivery delayed",
  "Package damaged on arrival",
  "Shipment lost in transit",
  "Other",
];

function daysSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86_400_000);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ManageDeliveryPage() {
  const [deliveries,   setDeliveries]   = useState<Delivery[]>([]);
  const [stats,        setStats]        = useState<Stats>({ pending: 0, delivered: 0, inTransit: 0, rto: 0, cancelled: 0 });
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading,      setLoading]      = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [syncMsg,      setSyncMsg]      = useState("");

  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [copiedId,     setCopiedId]     = useState<string | null>(null);

  // Issue form state
  const [issueOrderId,  setIssueOrderId]  = useState<string | null>(null);
  const [issueType,     setIssueType]     = useState("");
  const [issueNote,     setIssueNote]     = useState("");
  const [issueSending,  setIssueSending]  = useState(false);
  const [issueSuccess,  setIssueSuccess]  = useState<string | null>(null);

  const fetchDeliveries = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true); else setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res  = await fetch(`/api/seller/deliveries?${params}`);
      const data = await res.json();
      setDeliveries(data.orders ?? []);
      if (data.stats) setStats(data.stats);
    } finally { setLoading(false); setRefreshing(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  async function handleRefreshTracking() {
    setRefreshing(true); setSyncMsg("");
    const res  = await fetch("/api/seller/deliveries/refresh-tracking", { method: "POST" });
    const data = await res.json();
    setSyncMsg(`Updated ${data.updated ?? 0} tracking status${data.updated !== 1 ? "es" : ""}`);
    await fetchDeliveries(false);
    setRefreshing(false);
  }

  async function submitIssue(orderId: string) {
    if (!issueType) return;
    setIssueSending(true);
    const res = await fetch(`/api/seller/deliveries/${orderId}/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueType, note: issueNote }),
    });
    if (res.ok) {
      setIssueSuccess(orderId);
      setIssueOrderId(null);
      setIssueType(""); setIssueNote("");
      fetchDeliveries();
      setTimeout(() => setIssueSuccess(null), 4000);
    }
    setIssueSending(false);
  }

  function copyAwb(awb: string, id: string) {
    navigator.clipboard.writeText(awb);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id);
    setIssueOrderId(null); setIssueType(""); setIssueNote("");
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Manage Delivery"
        subtitle="Track shipments, monitor delivery status, and raise issues"
        searchValue={search}
        searchPlaceholder="Search by order ID or customer name..."
        onSearchChange={setSearch}
        onSearchSubmit={() => fetchDeliveries()}
        actions={
          <div className="flex items-center gap-2">
            {syncMsg && <span className="text-xs font-medium" style={{ color: "#16A34A" }}>{syncMsg}</span>}
            <button onClick={handleRefreshTracking} disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
              style={{ background: "var(--bg-muted)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Syncing..." : "Refresh Tracking"}
            </button>
          </div>
        }
        cards={
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
              <div key={key} className="rounded-2xl px-4 py-4 flex items-center gap-3"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--bg-muted)" }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{stats[key as keyof Stats]}</p>
                </div>
              </div>
            ))}
          </div>
        }
      />

      <div className="px-4 md:px-8 py-6 space-y-5">
        {/* Status filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map((s) => {
            const cfg      = STATUS_CONFIG[s];
            const isActive = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={isActive
                  ? { background: cfg ? cfg.color : "var(--bg-sidebar)", color: "var(--text-primary)" }
                  : { background: cfg ? cfg.bg : "#F3F4F6", color: cfg ? cfg.color : "var(--text-600)" }}>
                {s === "ALL" ? "All" : cfg?.label ?? s}
              </button>
            );
          })}
        </div>

        {/* Deliveries table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>
              Deliveries ({deliveries.length})
            </h2>
            <p className="text-xs" style={{ color: "var(--text-400)" }}>
              Click any row to see delivery timeline and raise issues
            </p>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: "var(--text-300)" }} />
              <p className="text-sm" style={{ color: "var(--text-400)" }}>Loading deliveries...</p>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <Truck className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm" style={{ color: "var(--text-400)" }}>No deliveries found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "#FAFAFA" }}>
                    {["Order #", "Customer", "Status", "Expected By", "AWB / Courier", "Issues", ""].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--text-400)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((d) => {
                    const cfg       = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.NEW;
                    const awb       = d.awbNumber || d.supplierTrackingNo;
                    const carrier   = d.courier || d.supplierCourier;
                    const isExpanded = expandedId === d.id;
                    const isOverdue = d.expectedDeliveryDate
                      && new Date(d.expectedDeliveryDate) < new Date()
                      && !["DELIVERED", "CANCELLED", "RTO"].includes(d.status);
                    const daysShipped = (d.status === "SHIPPED" || d.status === "IN_TRANSIT")
                      ? daysSince(d.updatedAt)
                      : null;
                    const issues = d.timeline ?? [];

                    return (
                      <>
                        <tr key={d.id}
                          className="hover:bg-gray-50/40 cursor-pointer transition-colors"
                          style={{
                            borderBottom: isExpanded ? "none" : "1px solid var(--border)",
                            background: isExpanded ? "rgba(67,97,238,0.03)" : undefined,
                          }}
                          onClick={() => toggleExpand(d.id)}>

                          {/* Order # */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs font-mono"
                                style={{ color: "var(--green-500)" }}>
                                #{d.externalOrderId}
                              </span>
                              {issueSuccess === d.id && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                  style={{ background: "#F0FDF4", color: "#16A34A" }}>Reported</span>
                              )}
                            </div>
                            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-300)" }}>
                              {fmtDate(d.createdAt)}
                            </p>
                          </td>

                          {/* Customer */}
                          <td className="px-5 py-3.5">
                            <p className="text-xs font-medium" style={{ color: "var(--text-900)" }}>
                              {d.customerName || "—"}
                            </p>
                            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-400)" }}>
                              {d.customerAddress?.phone || ""}
                              {d.customerAddress?.city && ` · ${d.customerAddress.city}`}
                            </p>
                          </td>

                          {/* Status */}
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ background: cfg.bg, color: cfg.color }}>
                              {cfg.label}
                            </span>
                            {daysShipped !== null && (
                              <p className="text-[10px] mt-1" style={{ color: "var(--text-400)" }}>
                                {daysShipped}d in transit
                              </p>
                            )}
                          </td>

                          {/* Expected By */}
                          <td className="px-5 py-3.5">
                            {d.expectedDeliveryDate ? (
                              <div>
                                <span className={`text-xs font-medium ${isOverdue ? "font-semibold" : ""}`}
                                  style={{ color: isOverdue ? "#DC2626" : "var(--text-900)" }}>
                                  {fmtDate(d.expectedDeliveryDate)}
                                </span>
                                {isOverdue && (
                                  <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                                    style={{ background: "#FEF2F2", color: "#DC2626" }}>
                                    Overdue
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs" style={{ color: "var(--text-300)" }}>—</span>
                            )}
                          </td>

                          {/* AWB */}
                          <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                            {awb ? (
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs font-medium" style={{ color: "var(--text-900)" }}>
                                    {awb}
                                  </span>
                                  <button onClick={() => copyAwb(awb, d.id)}
                                    className="opacity-50 hover:opacity-100 transition-opacity">
                                    {copiedId === d.id
                                      ? <CopyCheck className="w-3 h-3" style={{ color: "#16A34A" }} />
                                      : <Copy className="w-3 h-3" style={{ color: "var(--text-400)" }} />}
                                  </button>
                                </div>
                                {carrier && <span className="text-[10px]" style={{ color: "var(--text-400)" }}>{carrier}</span>}
                                {d.trackingUrl && (
                                  <a href={d.trackingUrl} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-0.5 text-[10px] font-semibold"
                                    style={{ color: "var(--green-500)" }}>
                                    Track <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                                style={{ background: "#FFF7ED", color: "#D97706" }}>
                                Pending AWB
                              </span>
                            )}
                          </td>

                          {/* Issues */}
                          <td className="px-5 py-3.5">
                            {issues.length > 0 ? (
                              <span className="flex items-center gap-1 text-xs font-semibold"
                                style={{ color: "#DC2626" }}>
                                <AlertCircle className="w-3.5 h-3.5" />
                                {issues.length} issue{issues.length !== 1 ? "s" : ""}
                              </span>
                            ) : (
                              <span className="text-xs" style={{ color: "var(--text-300)" }}>None</span>
                            )}
                          </td>

                          {/* Expand toggle */}
                          <td className="px-5 py-3.5">
                            {isExpanded
                              ? <ChevronUp className="w-4 h-4" style={{ color: "var(--text-300)" }} />
                              : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-300)" }} />}
                          </td>
                        </tr>

                        {/* Expanded panel */}
                        {isExpanded && (
                          <tr key={`${d.id}-expanded`}
                            style={{ borderBottom: "1px solid var(--border)", background: "rgba(67,97,238,0.02)" }}>
                            <td colSpan={7} className="px-5 pb-5 pt-1">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4"
                                style={{ borderTop: "1px solid var(--border)" }}>

                                {/* LEFT — Delivery progress */}
                                <div className="space-y-4">
                                  <p className="text-xs font-semibold uppercase tracking-wide"
                                    style={{ color: "var(--text-400)" }}>Delivery Progress</p>

                                  {/* Horizontal step track */}
                                  <div className="flex items-start gap-0">
                                    {(d.status === "RTO" ? [
                                      ...STEPS.slice(0, 3),
                                      { key: "RTO", label: "RTO" },
                                    ] : d.status === "CANCELLED" ? [
                                      STEPS[0],
                                      { key: "CANCELLED", label: "Cancelled" },
                                    ] : STEPS).map((step, i, arr) => {
                                      const rank    = STEP_RANK[d.status] ?? 0;
                                      const myRank  = STEP_RANK[step.key] ?? i;
                                      const isDone  = myRank < rank;
                                      const isCurr  = myRank === rank || (step.key === d.status);
                                      const isRto   = step.key === "RTO";
                                      const isCancl = step.key === "CANCELLED";
                                      const dotColor =
                                        isCancl ? "#6B7280" :
                                        isRto   ? "#EF4444" :
                                        isDone || (isCurr && d.status === "DELIVERED") ? "#00C67A" :
                                        isCurr  ? "var(--accent)" :
                                        "var(--border)";
                                      const lineColor = isDone ? "#00C67A" : "var(--border)";
                                      return (
                                        <div key={step.key} className="flex items-center flex-1">
                                          <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                            <div className="w-3 h-3 rounded-full ring-2 ring-offset-2"
                                              style={{ background: dotColor, ["--tw-ring-color" as string]: dotColor }} />
                                            <p className="text-[10px] font-medium text-center leading-tight max-w-[56px]"
                                              style={{ color: isCurr || isDone ? "var(--text-900)" : "var(--text-300)" }}>
                                              {step.label}
                                            </p>
                                          </div>
                                          {i < arr.length - 1 && (
                                            <div className="flex-1 h-px mx-1 mb-5" style={{ background: lineColor }} />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Meta row */}
                                  <div className="grid grid-cols-2 gap-3 mt-2">
                                    {[
                                      { icon: Package,  label: "Order Value",    value: `₹${d.totalAmount.toLocaleString("en-IN")}` },
                                      { icon: Truck,    label: "Carrier",        value: carrier || "—" },
                                      { icon: MapPin,   label: "Deliver To",     value: d.customerAddress?.city ? `${d.customerAddress.city}${d.customerAddress.state ? `, ${d.customerAddress.state}` : ""}` : "—" },
                                      { icon: Clock,    label: "Last Updated",   value: fmtDate(d.updatedAt) },
                                    ].map(({ icon: Icon, label, value }) => (
                                      <div key={label} className="flex items-center gap-2">
                                        <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-300)" }} />
                                        <div>
                                          <p className="text-[10px]" style={{ color: "var(--text-400)" }}>{label}</p>
                                          <p className="text-xs font-medium" style={{ color: "var(--text-900)" }}>{value}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Reported issues */}
                                  {issues.length > 0 && (
                                    <div className="space-y-2">
                                      <p className="text-xs font-semibold uppercase tracking-wide"
                                        style={{ color: "var(--text-400)" }}>Reported Issues</p>
                                      {issues.map(issue => (
                                        <div key={issue.id}
                                          className="flex items-start gap-2 px-3 py-2 rounded-lg"
                                          style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                                          <Flag className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
                                          <div>
                                            <p className="text-xs font-medium" style={{ color: "#7F1D1D" }}>{issue.details}</p>
                                            <p className="text-[10px] mt-0.5" style={{ color: "#B91C1C" }}>
                                              {fmtDate(issue.createdAt)}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* RIGHT — Raise issue form */}
                                <div className="space-y-4">
                                  <p className="text-xs font-semibold uppercase tracking-wide"
                                    style={{ color: "var(--text-400)" }}>Raise a Delivery Issue</p>

                                  {issueSuccess === d.id ? (
                                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
                                      style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                                      <CheckCircle2 className="w-4 h-4" style={{ color: "#16A34A" }} />
                                      <p className="text-xs font-medium" style={{ color: "#15803D" }}>
                                        Issue reported. Admin will be notified.
                                      </p>
                                    </div>
                                  ) : issueOrderId === d.id ? (
                                    <div className="space-y-3">
                                      <select value={issueType} onChange={e => setIssueType(e.target.value)}
                                        className="w-full px-3 py-2 text-xs rounded-xl border outline-none"
                                        style={{ background: "var(--bg-muted)", color: "var(--text-900)", borderColor: "var(--border)" }}>
                                        <option value="">Select issue type...</option>
                                        {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                      </select>
                                      <textarea
                                        value={issueNote}
                                        onChange={e => setIssueNote(e.target.value)}
                                        placeholder="Additional details (optional)"
                                        rows={3}
                                        className="w-full px-3 py-2 text-xs rounded-xl border outline-none resize-none"
                                        style={{ background: "var(--bg-muted)", color: "var(--text-900)", borderColor: "var(--border)" }}
                                      />
                                      <div className="flex gap-2">
                                        <button onClick={() => { setIssueOrderId(null); setIssueType(""); setIssueNote(""); }}
                                          className="flex-1 py-2 rounded-xl text-xs font-medium"
                                          style={{ background: "var(--bg-muted)", color: "var(--text-400)" }}>
                                          Cancel
                                        </button>
                                        <button onClick={() => submitIssue(d.id)}
                                          disabled={!issueType || issueSending}
                                          className="flex-1 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-1.5"
                                          style={{ background: "#EF4444" }}>
                                          {issueSending
                                            ? "Submitting..."
                                            : <><Send className="w-3.5 h-3.5" /> Submit Issue</>}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      <div className="px-4 py-3 rounded-xl text-xs leading-relaxed"
                                        style={{ background: "var(--bg-muted)", color: "var(--text-500)" }}>
                                        Use this to report delivery problems — wrong address, failed attempt, damaged package, or delays. Admin will be notified immediately.
                                      </div>
                                      <button
                                        onClick={() => { setIssueOrderId(d.id); setIssueType(""); setIssueNote(""); }}
                                        className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                                        style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        Raise Delivery Issue
                                      </button>
                                      {awb && d.trackingUrl && (
                                        <a href={d.trackingUrl} target="_blank" rel="noopener noreferrer"
                                          className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                                          style={{ background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE" }}>
                                          <ExternalLink className="w-3.5 h-3.5" />
                                          Open Live Tracking
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, MapPin, Truck, Clock, XCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface Delivery {
  id: string; externalOrderId: string; status: string;
  awbNumber: string | null; trackingUrl: string | null;
  createdAt: string; customerName: string | null;
  customerAddress: { phone?: string } | null; courier: string | null;
}
interface Stats { pending: number; delivered: number; inTransit: number; rto: number; cancelled: number; }


const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  SHIPPED:    { label: "Shipped",    color: "#7C3AED", bg: "#F5F3FF" },
  IN_TRANSIT: { label: "In Transit", color: "#025864", bg: "#ECFDF5" },
  DELIVERED:  { label: "Delivered",  color: "#00C67A", bg: "#F0FDF4" },
  CANCELLED:  { label: "Cancelled",  color: "#6B7280", bg: "#F9FAFB" },
  NEW:        { label: "Pending",    color: "#3B82F6", bg: "#EFF6FF" },
  PROCESSING: { label: "Processing", color: "#F59E0B", bg: "#FFF7ED" },
  RTO:        { label: "RTO",        color: "#EF4444", bg: "#FEF2F2" },
};

const STATUS_FILTERS = ["ALL", "NEW", "PROCESSING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "RTO", "CANCELLED"];

const STAT_CARDS = [
  { key: "pending",   label: "Pending",    icon: Clock,         color: "#7C3AED", bg: "#F5F3FF" },
  { key: "inTransit", label: "In Transit", icon: Truck,         color: "#3B82F6", bg: "#EFF6FF" },
  { key: "delivered", label: "Delivered",  icon: CheckCircle2,  color: "#00C67A", bg: "#F0FDF4" },
  { key: "rto",       label: "RTO",        icon: AlertTriangle, color: "#EF4444", bg: "#FEF2F2" },
  { key: "cancelled", label: "Cancelled",  icon: XCircle,       color: "#6B7280", bg: "#F9FAFB" },
];

export default function ManageDeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, delivered: 0, inTransit: 0, rto: 0, cancelled: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [gettingAwb, setGettingAwb] = useState<string | null>(null);
  const [awbError, setAwbError] = useState<string | null>(null);

  const fetchDeliveries = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true); else setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(`/api/seller/deliveries?${params}`);
      const data = await res.json();
      setDeliveries(data.orders ?? []);
      if (data.stats) setStats(data.stats);
    } finally { setLoading(false); setRefreshing(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  async function handleGetAwb(orderId: string) {
    setGettingAwb(orderId); setAwbError(null);
    const res = await fetch("/api/seller/deliveries/create-awb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const data = await res.json();
    if (!res.ok) { setAwbError(data.error || "Failed to get AWB"); }
    else { await fetchDeliveries(); }
    setGettingAwb(null);
  }

  async function handleRefreshTracking() {
    setRefreshing(true); setSyncMsg("");
    const res = await fetch("/api/seller/deliveries/refresh-tracking", { method: "POST" });
    const data = await res.json();
    setSyncMsg(`Updated ${data.updated ?? 0} status(es)`);
    await fetchDeliveries(false);
    setRefreshing(false);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Manage Delivery"
        subtitle="Track and manage order deliveries"
        searchValue={search}
        searchPlaceholder="Search by order ID or customer name..."
        onSearchChange={setSearch}
        onSearchSubmit={() => fetchDeliveries()}
        actions={
          <div className="flex items-center gap-2">
            {syncMsg && <span className="text-xs" style={{ color: "#00C67A" }}>{syncMsg}</span>}
            <button onClick={handleRefreshTracking} disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Tracking
            </button>
          </div>
        }
        cards={
          <div className="grid grid-cols-5 gap-4">
            {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
              <div key={key} className="rounded-2xl px-4 py-4 flex items-center gap-3"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.1)" }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
                  <p className="text-2xl font-bold text-white">{stats[key as keyof Stats]}</p>
                </div>
              </div>
            ))}
          </div>
        }
      />

      <div className="px-8 py-6 space-y-5">
        {awbError && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            <XCircle className="w-4 h-4 flex-shrink-0" /> {awbError}
          </div>
        )}
        {/* Status filter buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FILTERS.map((s) => {
            const cfg = STATUS_CONFIG[s];
            const isActive = statusFilter === s;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={isActive
                  ? { background: cfg ? cfg.color : "var(--bg-sidebar)", color: "white" }
                  : { background: cfg ? cfg.bg : "#F3F4F6", color: cfg ? cfg.color : "var(--text-600)" }
                }>
                {s === "ALL" ? "All" : cfg?.label ?? s}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>
              Deliveries ({deliveries.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm" style={{ color: "var(--text-400)" }}>Loading...</div>
          ) : deliveries.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <Truck className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm" style={{ color: "var(--text-400)" }}>No deliveries found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "#FAFAFA" }}>
                  {["Order ID", "Customer", "Phone", "Date", "Status", "AWB / Tracking"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-400)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {deliveries.map((d) => {
                  const cfg = STATUS_CONFIG[d.status] ?? STATUS_CONFIG.NEW;
                  return (
                    <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 font-semibold text-xs" style={{ color: "var(--green-500)" }}>#{d.externalOrderId}</td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text-600)" }}>{d.customerName || "—"}</td>
                      <td className="px-5 py-3 text-xs" style={{ color: "var(--text-400)" }}>{d.customerAddress?.phone || "—"}</td>
                      <td className="px-5 py-3 text-xs" style={{ color: "var(--text-400)" }}>
                        {new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {d.awbNumber ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-xs font-medium" style={{ color: "var(--text-900)" }}>{d.awbNumber}</span>
                            {d.trackingUrl && (
                              <a href={d.trackingUrl} target="_blank" rel="noopener noreferrer"
                                className="text-xs underline" style={{ color: "var(--green-500)" }}>
                                Track →
                              </a>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleGetAwb(d.id)}
                            disabled={gettingAwb === d.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
                            style={{ background: "#EFF6FF", color: "#3B82F6" }}>
                            {gettingAwb === d.id
                              ? <><RefreshCw className="w-3 h-3 animate-spin" /> Getting...</>
                              : <><Truck className="w-3 h-3" /> Get AWB</>
                            }
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

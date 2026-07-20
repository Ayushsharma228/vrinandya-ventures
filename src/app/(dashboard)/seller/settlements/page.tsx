"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Receipt, TrendingUp, ChevronLeft, ChevronRight, RefreshCw, IndianRupee, Download,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface Order {
  id: string; externalOrderId: string; customerName: string | null;
  source: string; createdAt: string;
}

interface Settlement {
  id: string; status: string; sellingPrice: number; platformFee: number;
  gstOnFees: number; netPayable: number; supplierPayable: number;
  shippingCharge: number; packingCharge: number; codFee: number;
  adSpend: number; marketplaceFee: number; grossProfit: number | null;
  netProfit: number | null; createdAt: string; marketplace: string | null;
  order: Order | null;
}

interface SettlementData {
  settlements: Settlement[];
  total: number; page: number; pages: number;
  summary: {
    grossRevenue: number; platformFee: number; gstOnFees: number;
    netPayable: number; shippingCharge: number; packingCharge: number;
    codFee: number; adSpend: number; marketplaceFee: number;
    grossProfit: number; netProfit: number;
  };
}

function fmt(n: number) {
  return `₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  PENDING:    { bg: "#FFF7ED", color: "#D97706" },
  PROCESSING: { bg: "#EFF6FF", color: "#2563EB" },
  SETTLED:    { bg: "#F5F3FF", color: "#7C3AED" },
  PAID:       { bg: "#F0FDF4", color: "#15803D" },
  REVERSED:   { bg: "#FEF2F2", color: "#DC2626" },
  DISPUTED:   { bg: "#FFF7ED", color: "#B45309" },
};

export default function SellerSettlementsPage() {
  const [data, setData]     = useState<SettlementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (statusFilter) params.set("status", statusFilter);
    const r = await fetch(`/api/seller/settlements?${params}`);
    if (r.ok) setData(await r.json());
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const s = data?.summary;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="My Settlements"
        subtitle="Per-order financial breakdown and payout history"
        cards={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Gross Revenue",   value: s ? fmt(s.grossRevenue) : "—",  color: "#16A34A" },
              { label: "Platform Fee",    value: s ? fmt(s.platformFee)  : "—",  color: "#3B82F6" },
              { label: "Net Payable",     value: s ? fmt(s.netPayable)   : "—",  color: "#A78BFA" },
              { label: "Net Profit",      value: s ? fmt(s.netProfit)    : "—",  color: "#F59E0B" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl px-5 py-4"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <p className="text-xs font-medium uppercase tracking-wide mb-2"
                  style={{ color: "var(--text-muted)" }}>{label}</p>
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        }
      />

      <div className="px-4 md:px-8 py-6 space-y-6">
        <div className="card overflow-hidden">
          <div className="px-5 py-3 flex items-center gap-3 flex-wrap" style={{ borderBottom: "1px solid var(--border)" }}>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="text-xs rounded-lg px-3 py-1.5 border"
              style={{ background: "var(--bg-card)", color: "var(--text-900)", borderColor: "var(--border)" }}>
              <option value="">All Status</option>
              {["PENDING","PROCESSING","SETTLED","PAID","REVERSED","DISPUTED"].map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            {data && (
              <span className="text-xs" style={{ color: "var(--text-400)" }}>
                {data.total} settlements
              </span>
            )}
            <a href="/api/seller/settlements/export"
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ border: "1px solid var(--border)", color: "var(--text-400)" }}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </a>
          </div>

          {loading ? (
            <div className="p-8 flex justify-center">
              <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "var(--text-300)" }} />
            </div>
          ) : !data || data.settlements.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2">
              <Receipt className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm" style={{ color: "var(--text-400)" }}>No settlements yet</p>
              <p className="text-xs" style={{ color: "var(--text-300)" }}>
                Settlements are generated automatically when orders are marked delivered.
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {data.settlements.map((s) => {
                  const badge = STATUS_BADGE[s.status] ?? STATUS_BADGE.PENDING;
                  const isOpen = expanded === s.id;
                  return (
                    <div key={s.id}>
                      <div
                        className="px-5 py-3.5 flex items-center gap-4 cursor-pointer hover:bg-gray-50/40"
                        onClick={() => setExpanded(isOpen ? null : s.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-mono font-semibold" style={{ color: "var(--text-900)" }}>
                              {s.order?.externalOrderId ?? s.id.slice(-8)}
                            </p>
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: badge.bg, color: badge.color }}>
                              {s.status}
                            </span>
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>
                            {s.order?.customerName ?? "—"} ·{" "}
                            {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold" style={{ color: "#16A34A" }}>{fmt(s.sellingPrice)}</p>
                          <p className="text-xs" style={{ color: "#A78BFA" }}>→ {fmt(s.netPayable)} to you</p>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="px-5 pb-4 pt-1"
                          style={{ background: "var(--bg-muted)", borderTop: "1px solid var(--border)" }}>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                            {[
                              { label: "Selling Price",   value: fmt(s.sellingPrice),   color: "#16A34A" },
                              { label: "Platform Fee",    value: fmt(s.platformFee),    color: "#3B82F6" },
                              { label: "GST (18%)",       value: fmt(s.gstOnFees),      color: "#6366F1" },
                              { label: "Shipping",        value: fmt(s.shippingCharge), color: "#8B5CF6" },
                              { label: "Packing",         value: fmt(s.packingCharge),  color: "#EC4899" },
                              { label: "COD Fee",         value: fmt(s.codFee),         color: "#F97316" },
                              { label: "Ad Spend",        value: fmt(s.adSpend),        color: "#EF4444" },
                              { label: "Marketplace Fee", value: fmt(s.marketplaceFee), color: "#DC2626" },
                              { label: "Net Payable",     value: fmt(s.netPayable),     color: "#A78BFA" },
                              { label: "Net Profit",      value: fmt(s.netProfit ?? 0), color: (s.netProfit ?? 0) >= 0 ? "#16A34A" : "#EF4444" },
                            ].map(({ label, value, color }) => (
                              <div key={label} className="rounded-xl p-3"
                                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                <p className="text-xs" style={{ color: "var(--text-400)" }}>{label}</p>
                                <p className="text-sm font-bold mt-0.5" style={{ color }}>{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {data.pages > 1 && (
                <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
                  <span className="text-xs" style={{ color: "var(--text-400)" }}>
                    Page {data.page} of {data.pages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                      className="p-1 rounded-lg disabled:opacity-30"
                      style={{ border: "1px solid var(--border)" }}>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}
                      className="p-1 rounded-lg disabled:opacity-30"
                      style={{ border: "1px solid var(--border)" }}>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

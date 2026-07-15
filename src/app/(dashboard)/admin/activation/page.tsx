"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, RefreshCw, Users, CheckCircle2, TrendingUp, AlertTriangle, ChevronRight, Search, Filter } from "lucide-react";
import Link from "next/link";

interface SellerActivationRow {
  id: string;
  sellerId: string;
  currentStage: string;
  activationPct: number;
  healthScore: number;
  healthLabel: string;
  lastActivityAt: string | null;
  activatedAt: string | null;
  seller: { id: string; name: string | null; email: string; kycStatus: string; accountStatus: string; createdAt: string };
}

interface Summary {
  totalSellers: number;
  totalActivated: number;
  activationRate: number;
  avgActivationPct: number;
  avgActivationHours: number | null;
  inactiveSellers: number;
}

interface PageData {
  activations: SellerActivationRow[];
  total: number;
  page: number;
  pages: number;
  funnel: Record<string, number>;
  summary: Summary;
}

const STAGES = [
  "ACCOUNT_CREATED", "AGREEMENT_SIGNED", "KYC_APPROVED", "BANK_VERIFIED",
  "SHOPIFY_CONNECTED", "PRODUCTS_IMPORTED", "LISTING_REQUESTED",
  "FIRST_LISTING_LIVE", "FIRST_ORDER_RECEIVED", "ACTIVATED",
];

const STAGE_LABELS: Record<string, string> = {
  ACCOUNT_CREATED: "Account Created",
  AGREEMENT_SIGNED: "Agreement Signed",
  KYC_APPROVED: "KYC Approved",
  BANK_VERIFIED: "Bank Verified",
  SHOPIFY_CONNECTED: "Shopify Connected",
  PRODUCTS_IMPORTED: "Products Imported",
  LISTING_REQUESTED: "Listing Requested",
  FIRST_LISTING_LIVE: "First Listing Live",
  FIRST_ORDER_RECEIVED: "First Order Received",
  ACTIVATED: "Fully Activated",
  STALLED: "Stalled",
  BLOCKED: "Blocked",
};

function healthColor(label: string): string {
  if (label === "Excellent") return "var(--green-500)";
  if (label === "Good") return "#3B82F6";
  if (label === "Needs Attention") return "#F59E0B";
  return "#EF4444";
}

function stageBadge(stage: string) {
  const label = STAGE_LABELS[stage] ?? stage;
  const color = stage === "ACTIVATED" ? "var(--green-500)" :
    stage === "STALLED" ? "#F59E0B" :
    stage === "BLOCKED" ? "#EF4444" :
    "rgba(255,255,255,0.4)";
  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ color, border: `1px solid ${color}22`, background: `${color}15` }}>
      {label}
    </span>
  );
}

function relativeTime(date: string | null): string {
  if (!date) return "Never";
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function AdminActivationPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (f = filter, p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (f !== "all") params.set("filter", f);
    const res = await fetch(`/api/admin/activation?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  const handleFilter = (f: string) => { setFilter(f); setPage(1); load(f, 1); };

  const filtered = data?.activations.filter(a =>
    !search || a.seller.name?.toLowerCase().includes(search.toLowerCase()) || a.seller.email.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const s = data?.summary;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-900)" }}>Seller Activation</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-400)" }}>Track and manage seller onboarding journeys</p>
        </div>
        <button
          onClick={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ border: "1px solid var(--border)", color: "var(--text-400)" }}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPIs */}
      {s && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Sellers", value: s.totalSellers, icon: Users, color: "#3B82F6" },
            { label: "Fully Activated", value: s.totalActivated, icon: CheckCircle2, color: "var(--green-500)" },
            { label: "Activation Rate", value: `${s.activationRate}%`, icon: TrendingUp, color: "#8B5CF6" },
            { label: "Inactive Sellers", value: s.inactiveSellers, icon: AlertTriangle, color: "#F59E0B" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="p-4 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <span className="text-sm" style={{ color: "var(--text-400)" }}>{label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: "var(--text-900)" }}>{value}</p>
              {label === "Activation Rate" && (
                <p className="text-xs mt-0.5" style={{ color: "var(--text-300)" }}>Avg progress: {s.avgActivationPct}%</p>
              )}
              {label === "Fully Activated" && s.avgActivationHours && (
                <p className="text-xs mt-0.5" style={{ color: "var(--text-300)" }}>Avg {Math.round(s.avgActivationHours / 24)}d to activate</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Funnel */}
      {data?.funnel && (
        <div className="p-5 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-900)" }}>Activation Funnel</h2>
          <div className="space-y-2">
            {STAGES.map((stage) => {
              const count = data.funnel[stage] ?? 0;
              const max = data.summary.totalSellers || 1;
              const pct = Math.round((count / max) * 100);
              return (
                <div key={stage} className="flex items-center gap-3">
                  <span className="text-xs w-36 flex-shrink-0 text-right" style={{ color: "var(--text-400)" }}>
                    {STAGE_LABELS[stage]}
                  </span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: stage === "ACTIVATED" ? "var(--green-500)" : "var(--accent)" }} />
                  </div>
                  <span className="text-xs w-8 text-right" style={{ color: "var(--text-900)" }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters + Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
        {/* Toolbar */}
        <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: "all", label: "All" },
              { key: "inactive", label: "Inactive" },
              { key: "blocked", label: "Blocked" },
              { key: "activated", label: "Activated" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleFilter(key)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={filter === key
                  ? { background: "var(--green-500)", color: "#fff" }
                  : { background: "var(--bg-muted)", color: "var(--text-400)" }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-300)" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sellers..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg outline-none"
              style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-900)", width: 200 }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto" style={{ background: "var(--bg-page)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Seller", "Stage", "Progress", "Health", "Last Activity", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-300)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-300)" }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-300)" }}>No sellers found</td></tr>
              ) : filtered.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid var(--border)" }}
                  className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm" style={{ color: "var(--text-900)" }}>{a.seller.name ?? "—"}</p>
                    <p className="text-xs" style={{ color: "var(--text-400)" }}>{a.seller.email}</p>
                  </td>
                  <td className="px-4 py-3">{stageBadge(a.currentStage)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                        <div className="h-full rounded-full" style={{ width: `${a.activationPct}%`, background: a.activationPct >= 80 ? "var(--green-500)" : a.activationPct >= 50 ? "#3B82F6" : "#F59E0B" }} />
                      </div>
                      <span className="text-xs font-medium" style={{ color: "var(--text-900)" }}>{a.activationPct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: healthColor(a.healthLabel), background: `${healthColor(a.healthLabel)}15` }}>
                      {a.healthLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>
                    {relativeTime(a.lastActivityAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/activation/${a.sellerId}`}
                      className="flex items-center gap-1 text-xs font-medium transition-colors"
                      style={{ color: "var(--accent)" }}>
                      View <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between" style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border)" }}>
            <span className="text-xs" style={{ color: "var(--text-400)" }}>
              Showing {((data.page - 1) * 25) + 1}–{Math.min(data.page * 25, data.total)} of {data.total}
            </span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => { setPage(p => p - 1); load(filter, page - 1); }}
                className="px-3 py-1 text-xs rounded-lg disabled:opacity-40"
                style={{ background: "var(--bg-muted)", color: "var(--text-400)" }}>Prev</button>
              <button disabled={page >= data.pages} onClick={() => { setPage(p => p + 1); load(filter, page + 1); }}
                className="px-3 py-1 text-xs rounded-lg disabled:opacity-40"
                style={{ background: "var(--bg-muted)", color: "var(--text-400)" }}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

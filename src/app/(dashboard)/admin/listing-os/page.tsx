"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  RefreshCw, Package, CheckCircle, XCircle, Clock, Zap,
  BarChart2, Globe, AlertTriangle, Eye, Edit3, Plus,
} from "lucide-react";

interface MarketplaceListing {
  id:               string;
  platform:         string;
  status:           string;
  optimizationScore: number;
  adminNote?:       string | null;
  listingUrl?:      string | null;
  liveAt?:          string | null;
  updatedAt:        string;
  listingContent:   {
    product: { id: string; name: string; sku: string | null; images: string[] };
  };
  analytics?: { optimizationScore: number; rejectionCount: number } | null;
}

interface PendingProduct {
  id: string; name: string; sku: string | null; images: string[];
  category: string | null; createdAt: string;
}

interface WorkspaceData {
  listings:           MarketplaceListing[];
  pendingProducts:    PendingProduct[];
  summary:            Record<string, number>;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:                 { label: "Draft",               color: "#6b7280", bg: "#f3f4f6" },
  CONTENT_PENDING:       { label: "Content Pending",     color: "#b45309", bg: "#fef9c3" },
  IN_REVIEW:             { label: "In Review",           color: "#1d4ed8", bg: "#dbeafe" },
  AWAITING_SELLER:       { label: "Awaiting Seller",     color: "#7c3aed", bg: "#ede9fe" },
  AWAITING_MARKETPLACE:  { label: "Awaiting Marketplace", color: "#0369a1", bg: "#e0f2fe" },
  APPROVED:              { label: "Approved",            color: "#15803d", bg: "#dcfce7" },
  LIVE:                  { label: "Live",                color: "#16a34a", bg: "#dcfce7" },
  REJECTED:              { label: "Rejected",            color: "#dc2626", bg: "#fee2e2" },
  OPTIMIZATION_REQUIRED: { label: "Needs Optimization",  color: "#ea580c", bg: "#ffedd5" },
};

const PLATFORM_ICON: Record<string, string> = {
  AMAZON: "🟠", FLIPKART: "🔵", MEESHO: "🟣", SHOPIFY: "🟢",
};

const TABS = [
  { id: "all",          label: "All" },
  { id: "no_content",   label: "No Content" },
  { id: "DRAFT",        label: "Draft" },
  { id: "CONTENT_PENDING", label: "Content Pending" },
  { id: "IN_REVIEW",    label: "In Review" },
  { id: "AWAITING_SELLER", label: "Awaiting Seller" },
  { id: "AWAITING_MARKETPLACE", label: "Awaiting Marketplace" },
  { id: "LIVE",         label: "Live" },
  { id: "REJECTED",     label: "Rejected" },
  { id: "OPTIMIZATION_REQUIRED", label: "Needs Optimization" },
] as const;

const score_color = (s: number) =>
  s >= 80 ? "#16a34a" : s >= 50 ? "#d97706" : "#dc2626";

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function ListingOsPage() {
  const [data, setData]           = useState<WorkspaceData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState<string>("all");
  const [search, setSearch]       = useState("");
  const [updating, setUpdating]   = useState<string | null>(null);

  const load = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/listing-os${q ? `?search=${encodeURIComponent(q)}` : ""}`);
      if (r.ok) setData(await r.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (listingId: string, status: string, extra: Record<string, string> = {}) => {
    setUpdating(listingId);
    try {
      await fetch(`/api/admin/listing-os/marketplace/${listingId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status, ...extra }),
      });
      await load(search);
    } finally { setUpdating(null); }
  };

  const filtered = (() => {
    if (!data) return [];
    if (tab === "no_content") return [];
    if (tab === "all") return data.listings;
    return data.listings.filter(l => l.status === tab);
  })();

  const noContentList = tab === "no_content" ? (data?.pendingProducts ?? []) : [];

  const s = data?.summary ?? {};

  return (
    <div style={{ padding: "24px", maxWidth: 1400 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-900)", margin: 0 }}>Listing Operating System</h1>
          <p style={{ color: "var(--text-400)", margin: "4px 0 0", fontSize: 14 }}>Full lifecycle from supplier product to live marketplace listing</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/admin/listing-os/analytics"
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8,
                     background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-900)",
                     textDecoration: "none", fontSize: 13 }}>
            <BarChart2 size={14} /> Analytics
          </Link>
          <button onClick={() => load(search)} disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8,
                     background: "var(--bg-card)", border: "1px solid var(--border)", cursor: "pointer",
                     color: "var(--text-900)", fontSize: 13 }}>
            <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 24 }}>
        {[
          { key: "noContent",            label: "No Content",     icon: Package,       color: "#6b7280" },
          { key: "contentPending",       label: "Content Pending", icon: Edit3,        color: "#b45309" },
          { key: "inReview",             label: "In Review",      icon: Clock,         color: "#1d4ed8" },
          { key: "awaitingSeller",       label: "Awaiting Seller", icon: AlertTriangle, color: "#7c3aed" },
          { key: "awaitingMarketplace",  label: "Awaiting Mkt",   icon: Globe,         color: "#0369a1" },
          { key: "live",                 label: "Live",            icon: CheckCircle,   color: "#16a34a" },
          { key: "rejected",             label: "Rejected",        icon: XCircle,       color: "#dc2626" },
          { key: "optimizationRequired", label: "Needs Opt.",     icon: Zap,           color: "#ea580c" },
        ].map(({ key, label, icon: Icon, color }) => (
          <div key={key} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Icon size={12} style={{ color }} />
              <span style={{ fontSize: 10, color: "var(--text-400)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: s[key] ? color : "var(--text-300)" }}>
              {loading ? "—" : (s[key] ?? 0)}
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && load(search)}
          placeholder="Search product name…"
          style={{ width: "100%", maxWidth: 360, padding: "8px 12px", borderRadius: 8,
                   border: "1px solid var(--border)", background: "var(--bg-card)",
                   color: "var(--text-900)", fontSize: 13, outline: "none" }} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--border)", marginBottom: 20, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "7px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 12,
                     fontWeight: tab === t.id ? 600 : 400, whiteSpace: "nowrap",
                     color: tab === t.id ? "var(--accent)" : "var(--text-400)",
                     borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent" }}>
            {t.label}
            {t.id === "no_content" && s.noContent > 0 && (
              <span style={{ marginLeft: 4, padding: "0 5px", borderRadius: 8, background: "#dc2626",
                             color: "#fff", fontSize: 10 }}>{s.noContent}</span>
            )}
          </button>
        ))}
      </div>

      {/* No-content products list */}
      {tab === "no_content" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {noContentList.length === 0 && !loading && (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-400)" }}>
              All approved products have content
            </div>
          )}
          {noContentList.map(p => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                                      background: "var(--bg-card)", border: "1px solid var(--border)",
                                      borderRadius: 10, padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {p.images[0]
                  ? <img src={p.images[0]} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 6 }} />
                  : <div style={{ width: 40, height: 40, borderRadius: 6, background: "var(--bg-muted)", display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={16} style={{ color: "var(--text-300)" }} /></div>
                }
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-900)" }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-400)" }}>SKU: {p.sku ?? "—"} · {p.category ?? "No category"} · {fmtDate(p.createdAt)}</div>
                </div>
              </div>
              <Link href={`/admin/listing-os/${p.id}`}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", borderRadius: 7,
                         background: "var(--accent)", color: "#fff", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
                <Plus size={12} /> Create Content
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Listings table */}
      {tab !== "no_content" && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-400)" }}>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Product</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Platform</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Status</th>
              <th style={{ textAlign: "center", padding: "8px 10px" }}>Score</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Updated</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => {
              const meta = STATUS_META[l.status] ?? { label: l.status, color: "#6b7280", bg: "#f3f4f6" };
              return (
                <tr key={l.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {l.listingContent.product.images[0]
                        ? <img src={l.listingContent.product.images[0]} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 5 }} />
                        : <div style={{ width: 36, height: 36, borderRadius: 5, background: "var(--bg-muted)" }} />
                      }
                      <div>
                        <Link href={`/admin/listing-os/${l.listingContent.product.id}`}
                          style={{ fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>
                          {l.listingContent.product.name}
                        </Link>
                        <div style={{ fontSize: 11, color: "var(--text-400)" }}>SKU: {l.listingContent.product.sku ?? "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "10px" }}>
                    <span style={{ fontSize: 13 }}>{PLATFORM_ICON[l.platform] ?? "🔘"} {l.platform}</span>
                  </td>
                  <td style={{ padding: "10px" }}>
                    <span style={{ padding: "3px 9px", borderRadius: 5, fontSize: 11, fontWeight: 600,
                                   background: meta.bg, color: meta.color }}>
                      {meta.label}
                    </span>
                  </td>
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    <span style={{ fontWeight: 700, color: score_color(l.optimizationScore) }}>
                      {l.optimizationScore}
                    </span>
                  </td>
                  <td style={{ padding: "10px", color: "var(--text-400)" }}>{fmtDate(l.updatedAt)}</td>
                  <td style={{ padding: "10px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Link href={`/admin/listing-os/${l.listingContent.product.id}`}
                        style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)",
                                 background: "var(--bg-card)", color: "var(--text-900)", textDecoration: "none",
                                 fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                        <Eye size={11} /> View
                      </Link>
                      {l.status === "IN_REVIEW" && (
                        <>
                          <button onClick={() => updateStatus(l.id, "APPROVED")} disabled={updating === l.id}
                            style={{ padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                                     background: "#dcfce7", color: "#15803d", fontSize: 11 }}>
                            Approve
                          </button>
                          <button onClick={() => updateStatus(l.id, "REJECTED")} disabled={updating === l.id}
                            style={{ padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                                     background: "#fee2e2", color: "#dc2626", fontSize: 11 }}>
                            Reject
                          </button>
                        </>
                      )}
                      {l.status === "APPROVED" && (
                        <button onClick={() => updateStatus(l.id, "LIVE")} disabled={updating === l.id}
                          style={{ padding: "5px 10px", borderRadius: 6, border: "none", cursor: "pointer",
                                   background: "var(--accent)", color: "#fff", fontSize: 11, fontWeight: 600 }}>
                          Mark Live
                        </button>
                      )}
                      {l.listingUrl && (
                        <a href={l.listingUrl} target="_blank" rel="noopener noreferrer"
                          style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid var(--border)",
                                   background: "var(--bg-muted)", color: "var(--text-400)", textDecoration: "none", fontSize: 11 }}>
                          <Globe size={11} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!loading && filtered.length === 0 && tab !== "no_content" && (
              <tr><td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--text-400)" }}>
                No listings in this stage
              </td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

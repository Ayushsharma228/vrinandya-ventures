"use client";

import { useState, useEffect } from "react";
import {
  ListChecks, Clock, CheckCircle, XCircle, Loader2,
  Package, ExternalLink, RefreshCw, AlertCircle,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface Listing {
  id: string;
  platform: string;
  status: string;
  adminNote: string | null;
  listedUrl: string | null;
  createdAt: string;
  product: { id: string; name: string; sku: string | null; images: string[]; price: number };
}

interface Stats {
  total: number; pending: number; inProgress: number; listed: number; failed: number;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:     { label: "Pending",     bg: "#FFF7ED", color: "#D97706" },
  IN_PROGRESS: { label: "In Progress", bg: "#EFF6FF", color: "#3B82F6" },
  LISTED:      { label: "Listed",      bg: "#F0FDF4", color: "#16A34A" },
  FAILED:      { label: "Failed",      bg: "#FEF2F2", color: "#DC2626" },
};

const PLATFORM_CONFIG: Record<string, { bg: string; color: string }> = {
  AMAZON:  { bg: "#FFF7ED", color: "#EA580C" },
  EBAY:    { bg: "#EFF6FF", color: "#3B82F6" },
  ETSY:    { bg: "#FDF2F8", color: "#DB2777" },
  WALMART: { bg: "#F0F9FF", color: "#0284C7" },
  SHOPIFY: { bg: "#F0FDF4", color: "#16A34A" },
  OTHER:   { bg: "#F9FAFB", color: "#6B7280" },
};

const FILTERS = ["ALL", "PENDING", "IN_PROGRESS", "LISTED", "FAILED"];

export default function SellerListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, inProgress: 0, listed: 0, failed: 0 });
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/seller/listings")
      .then(r => r.json())
      .then(d => {
        setListings(d.listings ?? []);
        if (d.stats) setStats(d.stats);
        setLoading(false);
      });
  }, []);

  const filtered = filter === "ALL" ? listings : listings.filter(l => l.status === filter);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="My Listings"
        subtitle="Track your marketplace listing requests and their status"
        cards={
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: "Total",       value: stats.total,      icon: ListChecks,  color: "#7C3AED" },
              { label: "Pending",     value: stats.pending,    icon: Clock,       color: "#D97706" },
              { label: "In Progress", value: stats.inProgress, icon: Loader2,     color: "#3B82F6" },
              { label: "Listed",      value: stats.listed,     icon: CheckCircle, color: "#16A34A" },
              { label: "Failed",      value: stats.failed,     icon: XCircle,     color: "#DC2626" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl px-4 py-4 flex items-center gap-3"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.1)" }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
                  <p className="text-xl font-bold text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
        }
      />

      <div className="px-8 py-6 space-y-5">

        {/* Failed alert */}
        {stats.failed > 0 && (
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl"
            style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">
              {stats.failed} listing{stats.failed > 1 ? "s" : ""} failed — check admin notes below for details.
            </p>
          </div>
        )}

        {/* Status filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map(f => {
            const cfg = STATUS_CONFIG[f];
            const isActive = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={isActive
                  ? { background: cfg ? cfg.color : "var(--bg-sidebar)", color: "white" }
                  : { background: cfg ? cfg.bg : "#F3F4F6", color: cfg ? cfg.color : "var(--text-600)" }}>
                {f === "ALL" ? "All" : STATUS_CONFIG[f]?.label ?? f}
              </button>
            );
          })}
        </div>

        {/* Listings */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <ListChecks className="w-4 h-4" style={{ color: "var(--text-400)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>
                Listing Requests ({filtered.length})
              </h2>
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "var(--text-400)" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <ListChecks className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm" style={{ color: "var(--text-400)" }}>
                {filter === "ALL" ? "No listing requests yet" : `No ${STATUS_CONFIG[filter]?.label.toLowerCase()} listings`}
              </p>
              <p className="text-xs text-center max-w-xs" style={{ color: "var(--text-400)" }}>
                To list a product on a marketplace, go to your Product Catalog and click &quot;List on Marketplace&quot;.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "#FAFAFA" }}>
                  {["Product", "Platform", "Status", "Admin Note", "Requested"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--text-400)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {filtered.map(l => {
                  const statusCfg = STATUS_CONFIG[l.status] ?? { label: l.status, bg: "#F9FAFB", color: "#6B7280" };
                  const platformCfg = PLATFORM_CONFIG[l.platform] ?? PLATFORM_CONFIG.OTHER;
                  return (
                    <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                            {l.product.images?.[0] ? (
                              <img src={l.product.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-4 h-4 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-[180px]"
                              style={{ color: "var(--text-900)" }}>{l.product.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>
                              {l.product.sku ?? "—"} · ₹{l.product.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: platformCfg.bg, color: platformCfg.color }}>
                          {l.platform}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: statusCfg.bg, color: statusCfg.color }}>
                          {statusCfg.label}
                        </span>
                        {l.listedUrl && (
                          <a href={l.listedUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs mt-1"
                            style={{ color: "var(--green-500)" }}>
                            <ExternalLink className="w-3 h-3" /> View listing
                          </a>
                        )}
                      </td>

                      <td className="px-5 py-3.5 max-w-[220px]">
                        {l.adminNote ? (
                          <p className="text-xs leading-relaxed"
                            style={{ color: l.status === "FAILED" ? "#DC2626" : "var(--text-600)" }}>
                            {l.adminNote}
                          </p>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--text-400)" }}>—</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: "var(--text-400)" }}>
                        {new Date(l.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
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

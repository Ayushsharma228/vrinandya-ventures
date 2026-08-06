"use client";

import { useState, useEffect, useRef } from "react";
import { RefreshCw, Link2, Link2Off, ShoppingCart, Package, CheckCircle, AlertCircle, Loader2, ExternalLink, HelpCircle, Zap } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { MARKETPLACE_IDS } from "@/lib/amazon-sp";

interface Order { id: string; externalOrderId: string; status: string; totalAmount: number; createdAt: string; }
interface StatusData {
  connected:           boolean;
  amazonSellerId?:     string;
  marketplaceCountry?: string;
  connectedAt?:        string;
  lastSyncAt?:         string | null;
  orderCount?:         number;
  recentOrders?:       Order[];
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  NEW:        { label: "New",        color: "#3B82F6", bg: "#EFF6FF" },
  PROCESSING: { label: "Processing", color: "#F59E0B", bg: "#FFF7ED" },
  SHIPPED:    { label: "Shipped",    color: "#7C3AED", bg: "#F5F3FF" },
  IN_TRANSIT: { label: "In Transit", color: "#025864", bg: "#ECFDF5" },
  DELIVERED:  { label: "Delivered",  color: "#16A34A", bg: "#F0FDF4" },
  RTO:        { label: "RTO",        color: "#EF4444", bg: "#FEF2F2" },
  CANCELLED:  { label: "Cancelled",  color: "#6B7280", bg: "#F9FAFB" },
};

function fmt(n: number) { return new Intl.NumberFormat("en-IN").format(n); }

export default function AmazonConnectPage() {
  const [status, setStatus]           = useState<StatusData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [syncing, setSyncing]         = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");

  // OAuth connect
  const [marketplace, setMarketplace] = useState("IN");
  const [showHelp, setShowHelp]       = useState(false);
  const didReadParams                 = useRef(false);

  useEffect(() => {
    fetchStatus();
    if (!didReadParams.current) {
      didReadParams.current = true;
      const params = new URLSearchParams(window.location.search);
      const conn   = params.get("connected");
      const err    = params.get("error");
      if (conn === "oauth") setSuccess("Amazon account connected successfully!");
      else if (err) {
        const MAP: Record<string, string> = {
          missing_params:       "Authorization was cancelled or parameters were missing.",
          no_state_cookie:      "Session expired. Please try again.",
          state_mismatch:       "Security check failed. Please try again.",
          token_exchange_failed:"Amazon rejected the authorization. Please try again.",
          no_refresh_token:     "Amazon did not return a refresh token.",
        };
        setError(MAP[err] ?? `Connection failed: ${err}`);
      }
      if (conn || err) {
        const clean = new URL(window.location.href);
        clean.searchParams.delete("connected");
        clean.searchParams.delete("error");
        window.history.replaceState({}, "", clean.toString());
      }
    }
  }, []);

  async function fetchStatus() {
    setLoading(true);
    const res  = await fetch("/api/seller/amazon/status");
    const data = await res.json() as StatusData;
    setStatus(data);
    setLoading(false);
  }

  function handleOAuthConnect() {
    window.location.href = `/api/seller/amazon/auth?marketplace=${marketplace}`;
  }

  async function handleSync() {
    setSyncing(true); setError(""); setSuccess("");
    const res  = await fetch("/api/seller/amazon/sync-orders", { method: "POST" });
    const data = await res.json() as { ok?: boolean; created?: number; updated?: number; errors?: number; error?: string };
    if (!res.ok) { setError(data.error || "Sync failed"); }
    else setSuccess(`Sync complete — ${data.created} new, ${data.updated} updated${data.errors ? `, ${data.errors} errors` : ""}.`);
    setSyncing(false);
    await fetchStatus();
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect your Amazon account? Orders already synced will remain.")) return;
    setDisconnecting(true);
    await fetch("/api/seller/amazon/disconnect", { method: "DELETE" });
    setStatus({ connected: false });
    setDisconnecting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Amazon Seller Central"
        subtitle="Connect your Amazon store to sync orders, manage listings, and track settlements"
      />

      <div className="px-4 md:px-8 py-6 max-w-3xl space-y-5">

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: "#F0FDF4", border: "1px solid rgba(22,163,74,0.2)", color: "#16A34A" }}>
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {status?.connected ? (
          <>
            {/* Connected state */}
            <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold"
                    style={{ background: "#FF9900" }}>A</div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Amazon Connected</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Seller ID: {status.amazonSellerId} &middot; {MARKETPLACE_IDS[status.marketplaceCountry ?? "IN"]?.name ?? status.marketplaceCountry}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: "#F0FDF4", color: "#16A34A" }}>Active</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
                {[
                  { label: "Amazon Orders", value: status.orderCount ?? 0, icon: ShoppingCart },
                  { label: "Connected On", value: status.connectedAt ? new Date(status.connectedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—", icon: Link2 },
                  { label: "Last Sync", value: status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + " " + new Date(status.lastSyncAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Never", icon: RefreshCw },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl px-4 py-3" style={{ background: "var(--bg-muted)", border: "1px solid var(--border)" }}>
                    <p className="text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {typeof s.value === "number" ? fmt(s.value) : s.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 mt-4">
                <button onClick={handleSync} disabled={syncing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "var(--accent)" }}>
                  <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Syncing..." : "Sync Orders Now"}
                </button>
                <button onClick={handleDisconnect} disabled={disconnecting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: "var(--bg-muted)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <Link2Off className="w-4 h-4" />
                  {disconnecting ? "Disconnecting..." : "Disconnect"}
                </button>
              </div>
            </div>

            {/* Recent Amazon orders */}
            {(status.recentOrders?.length ?? 0) > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Recent Amazon Orders</p>
                </div>
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {status.recentOrders!.map((o) => {
                    const cfg = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.NEW;
                    return (
                      <div key={o.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                            #{o.externalOrderId}
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>₹{fmt(o.totalAmount)}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* OAuth connect card */}
            <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold"
                  style={{ background: "#FF9900" }}>A</div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Connect Amazon Seller Central</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Authorize with Amazon to sync orders, listings &amp; settlements</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Marketplace
                  </label>
                  <select value={marketplace} onChange={(e) => setMarketplace(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl outline-none"
                    style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                    {Object.entries(MARKETPLACE_IDS).map(([code, mp]) => (
                      <option key={code} value={code}>{mp.name}</option>
                    ))}
                  </select>
                </div>

                <button onClick={handleOAuthConnect}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "#FF9900" }}>
                  <Zap className="w-4 h-4" />
                  Connect with Amazon
                </button>

                <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                  You&apos;ll be redirected to Amazon Seller Central to authorize access. No passwords stored.
                </p>
              </div>
            </div>

            {/* How it works */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <button
                onClick={() => setShowHelp((p) => !p)}
                className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-left"
                style={{ color: "var(--text-primary)" }}>
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" style={{ color: "var(--accent)" }} />
                  How the connection works
                </span>
                <span style={{ color: "var(--text-muted)" }}>{showHelp ? "▲" : "▼"}</span>
              </button>
              {showHelp && (
                <div className="px-5 pb-5 space-y-3 text-sm" style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border)" }}>
                  {[
                    ["1. Click Connect with Amazon", "You'll be redirected to your Amazon Seller Central account."],
                    ["2. Authorize the AXQEN app", "Click 'Confirm' on the Amazon authorization page."],
                    ["3. Automatic redirect", "Amazon sends you back here with a secure token — no copying needed."],
                    ["4. Start syncing", "Your orders and listings are now accessible from the dashboard."],
                  ].map(([title, desc]) => (
                    <div key={title as string} className="flex gap-3 pt-2">
                      <p className="font-semibold flex-shrink-0 text-xs" style={{ color: "var(--text-primary)" }}>{title as string}</p>
                      <p className="text-xs">{desc as string}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* What gets synced */}
            <div className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <p className="font-semibold text-sm mb-4" style={{ color: "var(--text-primary)" }}>What gets synced</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { icon: ShoppingCart, title: "Orders",       desc: "All Amazon orders synced automatically (last 30 days)" },
                  { icon: Package,      title: "Order Items",  desc: "SKUs, quantities, and prices per order" },
                  { icon: Link2,        title: "Status Updates", desc: "Order statuses kept in sync with Seller Central" },
                  { icon: RefreshCw,    title: "Auto Refresh", desc: "Sync on demand or schedule via admin" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-3 p-3 rounded-xl"
                      style={{ background: "var(--bg-muted)" }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(67,97,238,0.1)" }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

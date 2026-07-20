"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Link2, Link2Off, ShoppingCart, Users, AlertCircle, CheckCircle, Loader2, Search } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { MARKETPLACE_IDS } from "@/lib/amazon-sp";

interface Account {
  id:                  string;
  sellerId:            string;
  sellerName:          string | null;
  sellerEmail:         string;
  brandName:           string | null;
  amazonSellerId?:     string;
  marketplaceCountry?: string;
  connectedAt?:        string;
  lastSyncAt?:         string | null;
  isActive:            boolean;
  orderCount:          number;
}

function fmt(n: number) { return new Intl.NumberFormat("en-IN").format(n); }

export default function AdminAmazonPage() {
  const [accounts, setAccounts]             = useState<Account[]>([]);
  const [totalOrders, setTotalOrders]       = useState(0);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState("");
  const [syncing, setSyncing]               = useState<string | null>(null); // sellerId or "all"
  const [error, setError]                   = useState("");
  const [successMsg, setSuccessMsg]         = useState("");

  // Connect-on-behalf form
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [targetEmail, setTargetEmail]         = useState("");
  const [sellerIdInput, setSellerIdInput]     = useState("");
  const [mpCountry, setMpCountry]             = useState("IN");
  const [rtInput, setRtInput]                 = useState("");
  const [connecting, setConnecting]           = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const res  = await fetch("/api/admin/amazon");
    const data = await res.json() as { accounts?: Account[]; totalAmazonOrders?: number };
    setAccounts(data.accounts ?? []);
    setTotalOrders(data.totalAmazonOrders ?? 0);
    setLoading(false);
  }

  async function handleSync(sellerId: string | "all") {
    setSyncing(sellerId); setError(""); setSuccessMsg("");
    const body = sellerId === "all"
      ? { all: true }
      : { sellerId };
    const res  = await fetch("/api/admin/amazon/sync", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    const data = await res.json() as { ok?: boolean; error?: string; created?: number; updated?: number; errors?: number; results?: { sellerId: string; created: number }[] };
    if (!res.ok) {
      setError(data.error ?? "Sync failed");
    } else if (data.results) {
      const total = data.results.reduce((s, r) => s + (r.created ?? 0), 0);
      setSuccessMsg(`Sync complete — ${total} new orders across ${data.results.length} sellers.`);
    } else {
      setSuccessMsg(`Sync complete — ${data.created} new, ${data.updated} updated.`);
    }
    setSyncing(null);
    await fetchData();
  }

  async function handleDisconnect(sellerId: string, sellerName: string | null) {
    if (!confirm(`Disconnect Amazon for ${sellerName ?? sellerId}? Orders already synced will remain.`)) return;
    await fetch(`/api/seller/amazon/disconnect?sellerId=${sellerId}`, { method: "DELETE" });
    await fetchData();
  }

  async function handleConnectForSeller(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccessMsg("");
    const user = await fetch(`/api/admin/users?search=${encodeURIComponent(targetEmail)}`).then((r) => r.json()).then((d) => d.users?.[0]);
    if (!user) { setError("Seller not found with that email"); return; }
    setConnecting(true);
    const res  = await fetch("/api/seller/amazon/connect", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ sellerId: sellerIdInput, marketplaceCountry: mpCountry, refreshToken: rtInput, targetSellerId: user.id }),
    });
    const data = await res.json() as { ok?: boolean; error?: string };
    if (!res.ok || !data.ok) { setError(data.error ?? "Failed"); setConnecting(false); return; }
    setSuccessMsg(`Connected Amazon for ${targetEmail}`);
    setShowConnectForm(false); setTargetEmail(""); setSellerIdInput(""); setRtInput("");
    setConnecting(false);
    await fetchData();
  }

  const filtered = accounts.filter((a) => {
    const q = search.toLowerCase();
    return !q
      || a.sellerName?.toLowerCase().includes(q)
      || a.sellerEmail.toLowerCase().includes(q)
      || a.brandName?.toLowerCase().includes(q)
      || a.amazonSellerId?.toLowerCase().includes(q);
  });

  const statCards = [
    { label: "Connected Sellers", value: accounts.length,                icon: Users,        color: "#4361EE", bg: "#EEF2FF" },
    { label: "Total Amazon Orders", value: totalOrders,                  icon: ShoppingCart, color: "#16A34A", bg: "#F0FDF4" },
    { label: "Active Connections", value: accounts.filter(a => a.isActive).length, icon: CheckCircle, color: "#7C3AED", bg: "#F5F3FF" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Amazon Integration"
        subtitle="Manage seller Amazon SP-API connections and sync orders"
        searchValue={search}
        searchPlaceholder="Search sellers..."
        onSearchChange={setSearch}
        cards={
          <div className="grid grid-cols-3 gap-4">
            {statCards.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-2xl px-5 py-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{s.label}</p>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                      <Icon className="w-4 h-4" style={{ color: s.color }} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{fmt(s.value)}</p>
                </div>
              );
            })}
          </div>
        }
      />

      <div className="px-4 md:px-8 py-6 space-y-5">

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444" }}>
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
            style={{ background: "#F0FDF4", border: "1px solid rgba(22,163,74,0.2)", color: "#16A34A" }}>
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><span>{successMsg}</span>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleSync("all")}
            disabled={syncing !== null}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--accent)" }}>
            <RefreshCw className={`w-4 h-4 ${syncing === "all" ? "animate-spin" : ""}`} />
            {syncing === "all" ? "Syncing All..." : `Sync All (${accounts.length})`}
          </button>
          <button
            onClick={() => setShowConnectForm((p) => !p)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)" }}>
            <Link2 className="w-4 h-4" />
            Connect for Seller
          </button>
        </div>

        {/* Connect-on-behalf form */}
        {showConnectForm && (
          <form onSubmit={handleConnectForSeller} className="rounded-2xl p-5 space-y-4"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Connect Amazon for a Seller</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Seller Email</label>
                <input value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="seller@example.com" className="w-full px-3 py-2 text-sm rounded-xl outline-none"
                  style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Marketplace</label>
                <select value={mpCountry} onChange={(e) => setMpCountry(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl outline-none"
                  style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                  {Object.entries(MARKETPLACE_IDS).map(([code, mp]) => (
                    <option key={code} value={code}>{mp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Amazon Seller ID</label>
                <input value={sellerIdInput} onChange={(e) => setSellerIdInput(e.target.value)}
                  placeholder="A1B2C3..." className="w-full px-3 py-2 text-sm rounded-xl outline-none"
                  style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>LWA Refresh Token</label>
                <input value={rtInput} onChange={(e) => setRtInput(e.target.value)}
                  placeholder="Atzr|..." type="password" className="w-full px-3 py-2 text-sm rounded-xl outline-none"
                  style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="submit" disabled={connecting}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "var(--accent)" }}>
                {connecting ? "Connecting..." : "Connect"}
              </button>
              <button type="button" onClick={() => setShowConnectForm(false)}
                className="px-4 py-2 rounded-xl text-sm" style={{ color: "var(--text-muted)" }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Connected sellers table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          {loading ? (
            <div className="p-8 flex items-center justify-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--accent)" }} /> Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <Link2 className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                {accounts.length === 0 ? "No sellers have connected Amazon yet" : "No results for that search"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
                    {["Seller", "Amazon ID", "Marketplace", "Orders", "Last Sync", "Connected", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {filtered.map((acc) => (
                    <tr key={acc.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-xs" style={{ color: "var(--text-primary)" }}>
                          {acc.brandName ?? acc.sellerName ?? "—"}
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{acc.sellerEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs px-2 py-0.5 rounded-lg font-mono"
                          style={{ background: "var(--bg-muted)", color: "var(--text-secondary)" }}>
                          {acc.amazonSellerId ?? "—"}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                        {MARKETPLACE_IDS[acc.marketplaceCountry ?? ""]?.name ?? acc.marketplaceCountry ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{fmt(acc.orderCount)}</span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                        {acc.lastSyncAt
                          ? new Date(acc.lastSyncAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) +
                            " " + new Date(acc.lastSyncAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                          : "Never"}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
                        {acc.connectedAt ? new Date(acc.connectedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleSync(acc.sellerId)}
                            disabled={syncing !== null}
                            title="Sync orders"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
                            style={{ background: "rgba(67,97,238,0.1)", color: "var(--accent)" }}>
                            <RefreshCw className={`w-3.5 h-3.5 ${syncing === acc.sellerId ? "animate-spin" : ""}`} />
                          </button>
                          <button
                            onClick={() => handleDisconnect(acc.sellerId, acc.sellerName)}
                            title="Disconnect"
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{ background: "#FEF2F2", color: "#EF4444" }}>
                            <Link2Off className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

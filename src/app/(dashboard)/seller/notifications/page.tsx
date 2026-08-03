"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell, Loader2, CheckCheck, IndianRupee,
  Package, AlertCircle, Info, ShoppingCart, Truck,
  Settings, Mail, Zap, BarChart2, Wallet,
  Send, RefreshCw, Check, ChevronDown,
  Filter, Inbox,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NotifData { category?: string; adminSent?: boolean; }
interface Notification {
  id: string; type: string; title: string;
  message: string; isRead: boolean; createdAt: string; data: NotifData | null;
}
interface NotificationPrefs {
  emailOnNewOrder: boolean;
  emailOnRto: boolean;
  emailOnDelivered: boolean;
  emailOnSettlement: boolean;
  digestFrequency: "none" | "daily" | "weekly";
  digestLastSent: string | null;
  alertRtoEnabled: boolean;
  alertRtoThreshold: number;
  alertRtoLastTriggered: string | null;
  alertLowBalanceEnabled: boolean;
  alertLowBalanceAmount: number;
  alertLowBalanceLastTriggered: string | null;
}
interface DigestSummary {
  period: string; totalOrders: number; delivered: number;
  rto: number; revenue: number; balance: number; unreadNotifs: number;
}

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  PRODUCT_APPROVED: { icon: CheckCheck,   color: "#16A34A", bg: "#F0FDF4" },
  PRODUCT_REJECTED: { icon: AlertCircle,  color: "#EF4444", bg: "#FEF2F2" },
  LISTING_REQUEST:  { icon: Package,      color: "#7C3AED", bg: "#F5F3FF" },
  LISTING_DONE:     { icon: CheckCheck,   color: "#16A34A", bg: "#F0FDF4" },
  ORDER_UPDATE:     { icon: ShoppingCart, color: "#3B82F6", bg: "#EFF6FF" },
  AWB_GENERATED:    { icon: Truck,        color: "#025864", bg: "#ECFDF5" },
  GENERAL:          { icon: Bell,         color: "#6B7280", bg: "#F9FAFB" },
};

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  "Payment Reminder": { icon: IndianRupee, color: "#F59E0B", bg: "#FFF7ED" },
  "Stock Update":     { icon: Package,     color: "#7C3AED", bg: "#F5F3FF" },
  "Order Alert":      { icon: AlertCircle, color: "#EF4444", bg: "#FEF2F2" },
  "Announcement":     { icon: Bell,        color: "#16A34A", bg: "#F0FDF4" },
  "General":          { icon: Info,        color: "#3B82F6", bg: "#EFF6FF" },
};

const FILTER_TABS = [
  { key: "all",      label: "All" },
  { key: "unread",   label: "Unread" },
  { key: "orders",   label: "Orders" },
  { key: "payments", label: "Payments" },
  { key: "products", label: "Products" },
  { key: "alerts",   label: "Alerts" },
];

const DEFAULT_PREFS: NotificationPrefs = {
  emailOnNewOrder: false, emailOnRto: true, emailOnDelivered: false, emailOnSettlement: true,
  digestFrequency: "none", digestLastSent: null,
  alertRtoEnabled: false, alertRtoThreshold: 20, alertRtoLastTriggered: null,
  alertLowBalanceEnabled: false, alertLowBalanceAmount: 500, alertLowBalanceLastTriggered: null,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getConfig(n: Notification) {
  if (n.data?.adminSent && n.data.category) return CATEGORY_CONFIG[n.data.category] ?? CATEGORY_CONFIG["General"];
  return TYPE_CONFIG[n.type] ?? TYPE_CONFIG["GENERAL"];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

function filterNotifs(notifications: Notification[], filter: string): Notification[] {
  if (filter === "unread") return notifications.filter((n) => !n.isRead);
  if (filter === "orders") return notifications.filter((n) =>
    ["ORDER_UPDATE", "AWB_GENERATED"].includes(n.type) || n.data?.category === "Order Alert");
  if (filter === "payments") return notifications.filter((n) =>
    n.data?.category === "Payment Reminder");
  if (filter === "products") return notifications.filter((n) =>
    ["PRODUCT_APPROVED", "PRODUCT_REJECTED", "LISTING_REQUEST", "LISTING_DONE"].includes(n.type));
  if (filter === "alerts") return notifications.filter((n) =>
    n.type === "GENERAL" && !n.data?.adminSent);
  return notifications;
}

// ── Toggle component ─────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="relative flex-shrink-0"
      style={{ width: 40, height: 22 }}>
      <div className="absolute inset-0 rounded-full transition-colors duration-200"
        style={{ background: on ? "var(--accent)" : "var(--border)" }} />
      <div className="absolute top-0.5 transition-all duration-200 rounded-full bg-white"
        style={{ width: 18, height: 18, left: on ? 20 : 2 }} />
    </button>
  );
}

// ── Pref row ─────────────────────────────────────────────────────────────────

function PrefRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5"
      style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</p>
        {desc && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">{children}</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SellerNotificationsPage() {
  const [tab,          setTab]          = useState<"inbox" | "preferences">("inbox");
  const [filter,       setFilter]       = useState("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [markingAll,   setMarkingAll]   = useState(false);

  // Preferences state
  const [prefs,        setPrefs]        = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const [prefsSaving,  setPrefsSaving]  = useState(false);
  const [prefsSaved,   setPrefsSaved]   = useState(false);

  // Alert check state
  const [checkingAlerts, setCheckingAlerts] = useState(false);
  const [alertResult,    setAlertResult]    = useState<{ triggered: string[]; checked: string[] } | null>(null);

  // Digest state
  const [digestLoading, setDigestLoading] = useState(false);
  const [digestPreview, setDigestPreview] = useState<DigestSummary | null>(null);
  const [digestSent,    setDigestSent]    = useState(false);

  // Load notifications
  useEffect(() => {
    fetch("/api/seller/notifications")
      .then((r) => r.json())
      .then((d) => {
        setNotifications(d.notifications ?? []);
        setUnreadCount(d.unreadCount ?? 0);
        setLoading(false);
      });
  }, []);

  // Load preferences when switching to that tab
  useEffect(() => {
    if (tab !== "preferences") return;
    setPrefsLoading(true);
    fetch("/api/seller/notifications/preferences")
      .then((r) => r.json())
      .then((d) => { setPrefs(d.prefs ?? DEFAULT_PREFS); setPrefsLoading(false); });
  }, [tab]);

  // ── Inbox actions ─────────────────────────────────────────────────────────

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch("/api/seller/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function markAllRead() {
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await fetch("/api/seller/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setMarkingAll(false);
  }

  // ── Preferences actions ───────────────────────────────────────────────────

  function updatePref<K extends keyof NotificationPrefs>(key: K, value: NotificationPrefs[K]) {
    setPrefs((p) => ({ ...p, [key]: value }));
    setPrefsSaved(false);
  }

  async function savePrefs() {
    setPrefsSaving(true);
    await fetch("/api/seller/notifications/preferences", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    setPrefsSaving(false);
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2500);
  }

  async function checkAlerts() {
    setCheckingAlerts(true);
    setAlertResult(null);
    const res = await fetch("/api/seller/notifications/check-alerts", { method: "POST" });
    const data = await res.json();
    setAlertResult(data);
    setCheckingAlerts(false);
    // Reload notifications if any triggered
    if (data.triggered?.length > 0) {
      const r = await fetch("/api/seller/notifications");
      const d = await r.json();
      setNotifications(d.notifications ?? []);
      setUnreadCount(d.unreadCount ?? 0);
    }
  }

  async function previewDigest() {
    setDigestLoading(true);
    setDigestSent(false);
    const res = await fetch("/api/seller/notifications/digest", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preview: true }),
    });
    const data = await res.json();
    setDigestPreview(data.summary);
    setDigestLoading(false);
  }

  async function sendDigest() {
    setDigestLoading(true);
    await fetch("/api/seller/notifications/digest", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preview: false }),
    });
    setDigestSent(true);
    setDigestPreview(null);
    setDigestLoading(false);
  }

  const visible = filterNotifs(notifications, filter);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Notifications"
        subtitle={loading ? "Loading…" : `${unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}`}
      />

      <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">

        {/* Tab switcher */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", width: "fit-content" }}>
          {([
            { key: "inbox",       label: "Inbox",       icon: Inbox },
            { key: "preferences", label: "Preferences", icon: Settings },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === key ? "var(--accent)" : "transparent",
                color: tab === key ? "#fff" : "var(--text-secondary)",
              }}>
              <Icon className="w-4 h-4" /> {label}
              {key === "inbox" && unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: tab === "inbox" ? "rgba(255,255,255,0.25)" : "#EF4444", color: "#fff" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── INBOX ─────────────────────────────────────────────────────────── */}
        {tab === "inbox" && (
          <div>
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex gap-1 flex-wrap">
                {FILTER_TABS.map(({ key, label }) => {
                  const count = key === "unread" ? unreadCount :
                                key === "all" ? notifications.length :
                                filterNotifs(notifications, key).length;
                  if (key !== "all" && key !== "unread" && count === 0) return null;
                  return (
                    <button key={key} onClick={() => setFilter(key)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: filter === key ? "var(--accent)" : "var(--bg-card)",
                        color: filter === key ? "#fff" : "var(--text-secondary)",
                        border: filter === key ? "1px solid transparent" : "1px solid var(--border)",
                      }}>
                      {label}
                      {count > 0 && (
                        <span className="text-[10px] font-bold px-1 rounded"
                          style={{ background: filter === key ? "rgba(255,255,255,0.2)" : "var(--bg-muted)", color: filter === key ? "#fff" : "var(--text-muted)" }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead} disabled={markingAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                  style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                  {markingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                  Mark all read
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent)" }} />
              </div>
            ) : visible.length === 0 ? (
              <div className="card py-20 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--bg-muted)" }}>
                  <Bell className="w-7 h-7" style={{ color: "var(--border)" }} />
                </div>
                <p className="font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {filter === "all" ? "No notifications yet" : `No ${filter} notifications`}
                </p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {filter !== "all"
                    ? <button onClick={() => setFilter("all")} className="underline">Show all</button>
                    : "Updates will appear here"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {visible.map((n) => {
                  const cfg  = getConfig(n);
                  const Icon = cfg.icon;
                  return (
                    <div key={n.id} onClick={() => !n.isRead && markRead(n.id)}
                      className="card flex gap-4 p-4 cursor-pointer transition-all hover:shadow-md"
                      style={{ opacity: n.isRead ? 0.72 : 1, borderLeft: n.isRead ? "" : `3px solid var(--accent)` }}>

                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: cfg.bg }}>
                        <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold" style={{ color: n.isRead ? "var(--text-secondary)" : "var(--text-primary)" }}>
                            {n.title}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!n.isRead && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "var(--accent)" }} />}
                            <span className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{timeAgo(n.createdAt)}</span>
                          </div>
                        </div>
                        <p className="text-sm mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>{n.message}</p>
                        {n.data?.category && n.data?.adminSent && (
                          <span className="inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ background: cfg.bg, color: cfg.color }}>
                            {n.data.category}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── PREFERENCES ───────────────────────────────────────────────────── */}
        {tab === "preferences" && (
          prefsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent)" }} />
            </div>
          ) : (
            <div className="space-y-5">

              {/* ── Email Notifications ────────────────────────────────────── */}
              <div className="card p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(67,97,238,0.1)" }}>
                    <Mail className="w-4 h-4" style={{ color: "var(--accent)" }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Email Notifications</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Receive event emails in addition to in-app notifications</p>
                  </div>
                </div>

                <PrefRow label="New order received" desc="Email when a new Shopify order comes in">
                  <Toggle on={prefs.emailOnNewOrder} onChange={(v) => updatePref("emailOnNewOrder", v)} />
                </PrefRow>
                <PrefRow label="Order delivered" desc="Email when your customer receives their package">
                  <Toggle on={prefs.emailOnDelivered} onChange={(v) => updatePref("emailOnDelivered", v)} />
                </PrefRow>
                <PrefRow label="Order returned (RTO)" desc="Email when a shipment is returned to origin">
                  <Toggle on={prefs.emailOnRto} onChange={(v) => updatePref("emailOnRto", v)} />
                </PrefRow>
                <PrefRow label="Settlement processed" desc="Email when a payment settlement is made">
                  <Toggle on={prefs.emailOnSettlement} onChange={(v) => updatePref("emailOnSettlement", v)} />
                </PrefRow>
              </div>

              {/* ── Smart Alert Rules ──────────────────────────────────────── */}
              <div className="card p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
                    <Zap className="w-4 h-4" style={{ color: "#EF4444" }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Smart Alert Rules</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Trigger an in-app notification when a business metric crosses a threshold</p>
                  </div>
                </div>

                {/* RTO threshold */}
                <div className="py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>RTO Rate Alert</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Alert when 30-day RTO rate exceeds your threshold</p>
                    </div>
                    <Toggle on={prefs.alertRtoEnabled} onChange={(v) => updatePref("alertRtoEnabled", v)} />
                  </div>
                  {prefs.alertRtoEnabled && (
                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Alert when RTO &gt;</span>
                        <div className="relative">
                          <input type="number" min={1} max={100} value={prefs.alertRtoThreshold}
                            onChange={(e) => updatePref("alertRtoThreshold", Math.min(100, Math.max(1, Number(e.target.value))))}
                            className="w-20 pl-2 pr-6 py-1.5 text-sm rounded-lg outline-none text-center"
                            style={{ border: "1px solid var(--border)", background: "var(--bg-muted)", color: "var(--text-primary)" }} />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs" style={{ color: "var(--text-muted)" }}>%</span>
                        </div>
                      </div>
                      {prefs.alertRtoLastTriggered && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "#FEF2F2", color: "#B91C1C" }}>
                          Last fired {timeAgo(prefs.alertRtoLastTriggered)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Low balance */}
                <div className="py-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Low Balance Alert</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Alert when wallet balance drops below a set amount</p>
                    </div>
                    <Toggle on={prefs.alertLowBalanceEnabled} onChange={(v) => updatePref("alertLowBalanceEnabled", v)} />
                  </div>
                  {prefs.alertLowBalanceEnabled && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Alert when balance &lt;</span>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>₹</span>
                        <input type="number" min={0} value={prefs.alertLowBalanceAmount}
                          onChange={(e) => updatePref("alertLowBalanceAmount", Math.max(0, Number(e.target.value)))}
                          className="w-28 pl-6 pr-2 py-1.5 text-sm rounded-lg outline-none"
                          style={{ border: "1px solid var(--border)", background: "var(--bg-muted)", color: "var(--text-primary)" }} />
                      </div>
                      {prefs.alertLowBalanceLastTriggered && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "#FEF3C7", color: "#92400E" }}>
                          Last fired {timeAgo(prefs.alertLowBalanceLastTriggered)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Check now button */}
                {(prefs.alertRtoEnabled || prefs.alertLowBalanceEnabled) && (
                  <div className="mt-3 pt-3 flex items-start gap-3 flex-wrap" style={{ borderTop: "1px solid var(--border)" }}>
                    <button onClick={checkAlerts} disabled={checkingAlerts}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                      style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                      {checkingAlerts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Check now
                    </button>
                    {alertResult && (
                      <div className="flex-1 text-xs rounded-lg px-3 py-2"
                        style={{ background: alertResult.triggered.length > 0 ? "#FEF2F2" : "#F0FDF4",
                                 color: alertResult.triggered.length > 0 ? "#B91C1C" : "#16A34A",
                                 border: `1px solid ${alertResult.triggered.length > 0 ? "#FECACA" : "#BBF7D0"}` }}>
                        {alertResult.triggered.length > 0
                          ? `⚡ ${alertResult.triggered.length} alert(s) triggered — check your inbox`
                          : "✓ No thresholds exceeded — looking good!"}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Email Digest ───────────────────────────────────────────── */}
              <div className="card p-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(22,163,74,0.1)" }}>
                    <BarChart2 className="w-4 h-4" style={{ color: "#16A34A" }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Email Digest</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Receive a business summary email on a schedule</p>
                  </div>
                </div>

                <PrefRow label="Digest frequency" desc={prefs.digestLastSent ? `Last sent ${timeAgo(prefs.digestLastSent)}` : "Never sent"}>
                  <div className="relative">
                    <select value={prefs.digestFrequency} onChange={(e) => updatePref("digestFrequency", e.target.value as "none" | "daily" | "weekly")}
                      className="pl-3 pr-7 py-1.5 text-sm rounded-lg outline-none appearance-none"
                      style={{ border: "1px solid var(--border)", background: "var(--bg-muted)", color: "var(--text-primary)" }}>
                      <option value="none">Off</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: "var(--text-muted)" }} />
                  </div>
                </PrefRow>

                {prefs.digestFrequency !== "none" && (
                  <div className="mt-4 space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={previewDigest} disabled={digestLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                        style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                        {digestLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Filter className="w-3.5 h-3.5" />}
                        Preview
                      </button>
                      <button onClick={sendDigest} disabled={digestLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                        style={{ background: "var(--accent)" }}>
                        {digestLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Send now
                      </button>
                      {digestSent && (
                        <span className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg"
                          style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}>
                          <Check className="w-3.5 h-3.5" /> Sent to your email
                        </span>
                      )}
                    </div>

                    {digestPreview && (
                      <div className="rounded-xl p-4" style={{ background: "var(--bg-muted)", border: "1px solid var(--border)" }}>
                        <p className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                          {digestPreview.period} Preview
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {[
                            { label: "Orders",    value: String(digestPreview.totalOrders),             icon: ShoppingCart, color: "var(--accent)" },
                            { label: "Delivered", value: String(digestPreview.delivered),               icon: Truck,        color: "#16A34A" },
                            { label: "RTO",       value: String(digestPreview.rto),                     icon: AlertCircle,  color: "#EF4444" },
                            { label: "Revenue",   value: `₹${fmt(digestPreview.revenue)}`,              icon: IndianRupee,  color: "#16A34A" },
                            { label: "Balance",   value: `₹${fmt(digestPreview.balance)}`,              icon: Wallet,       color: "var(--accent)" },
                            { label: "Unread",    value: String(digestPreview.unreadNotifs),            icon: Bell,         color: "#F59E0B" },
                          ].map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="rounded-lg p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                              <div className="flex items-center gap-1.5 mb-1">
                                <Icon className="w-3.5 h-3.5" style={{ color }} />
                                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{label}</span>
                              </div>
                              <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Save ──────────────────────────────────────────────────── */}
              <div className="flex justify-end">
                <button onClick={savePrefs} disabled={prefsSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all"
                  style={{ background: prefsSaved ? "#16A34A" : "var(--accent)" }}>
                  {prefsSaving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    : prefsSaved
                    ? <><Check className="w-4 h-4" /> Saved</>
                    : "Save preferences"}
                </button>
              </div>

            </div>
          )
        )}

      </div>
    </div>
  );
}

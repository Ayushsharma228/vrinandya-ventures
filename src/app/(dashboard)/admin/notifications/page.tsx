"use client";

import { useState, useEffect } from "react";
import { Bell, Send, Loader2, Users, User, IndianRupee, Package, AlertCircle, Info, CheckCircle } from "lucide-react";

interface Seller { id: string; name: string | null; email: string; brandName: string | null; }
interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  user: { id: string; name: string | null; email: string; brandName: string | null };
  data: { category?: string } | null;
}

const CATEGORIES = [
  { value: "General",          label: "General",           icon: Info,          color: "#3B82F6", bg: "#EFF6FF" },
  { value: "Payment Reminder", label: "Payment Reminder",  icon: IndianRupee,   color: "#F59E0B", bg: "#FFF7ED" },
  { value: "Stock Update",     label: "Stock Update",      icon: Package,       color: "#7C3AED", bg: "#F5F3FF" },
  { value: "Order Alert",      label: "Order Alert",       icon: AlertCircle,   color: "#EF4444", bg: "#FEF2F2" },
  { value: "Announcement",     label: "Announcement",      icon: Bell,          color: "#00C67A", bg: "#F0FDF4" },
];

function CategoryBadge({ category }: { category?: string }) {
  const cfg = CATEGORIES.find(c => c.value === category) ?? CATEGORIES[0];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  );
}

export default function AdminNotificationsPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [history, setHistory] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Form
  const [target, setTarget] = useState<"all" | "one">("all");
  const [sellerId, setSellerId] = useState("");
  const [category, setCategory] = useState("General");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/sellers").then(r => r.json()),
      fetch("/api/admin/notifications").then(r => r.json()),
    ]).then(([s, n]) => {
      const list = s.sellers || [];
      setSellers(list);
      if (list.length > 0) setSellerId(list[0].id);
      setHistory(n.notifications || []);
      setLoading(false);
    });
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSending(true); setSent(false);
    const res = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, sellerId: target === "one" ? sellerId : undefined, category, title, message }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Failed to send"); setSending(false); return; }
    setSent(true);
    setTitle(""); setMessage("");
    // Refresh history
    const n = await fetch("/api/admin/notifications").then(r => r.json());
    setHistory(n.notifications || []);
    setSending(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
          <Bell className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500">Send announcements, reminders and alerts to sellers</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* ── Compose form ── */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-2xl p-5 space-y-4 self-start">
          <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Send className="w-4 h-4" /> Send Notification
          </h2>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
          )}
          {sent && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" /> Notification sent!
            </div>
          )}

          <form onSubmit={handleSend} className="space-y-4">
            {/* Target */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Send To</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setTarget("all")}
                  className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border transition-all"
                  style={target === "all"
                    ? { background: "#EFF6FF", color: "#3B82F6", borderColor: "#BFDBFE" }
                    : { background: "#F9FAFB", color: "#6B7280", borderColor: "#E5E7EB" }}>
                  <Users className="w-3.5 h-3.5" /> All Sellers
                </button>
                <button type="button" onClick={() => setTarget("one")}
                  className="flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border transition-all"
                  style={target === "one"
                    ? { background: "#EFF6FF", color: "#3B82F6", borderColor: "#BFDBFE" }
                    : { background: "#F9FAFB", color: "#6B7280", borderColor: "#E5E7EB" }}>
                  <User className="w-3.5 h-3.5" /> Specific Seller
                </button>
              </div>
            </div>

            {target === "one" && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Select Seller</label>
                <select value={sellerId} onChange={e => setSellerId(e.target.value)} required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400">
                  {sellers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.brandName || s.name || s.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => {
                  const Icon = c.icon;
                  return (
                    <button key={c.value} type="button" onClick={() => setCategory(c.value)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all"
                      style={category === c.value
                        ? { background: c.bg, color: c.color, borderColor: c.color + "40" }
                        : { background: "#F9FAFB", color: "#6B7280", borderColor: "#E5E7EB" }}>
                      <Icon className="w-3 h-3" />{c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Payment Due Reminder" required maxLength={100}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Write your message here..." required rows={4} maxLength={500}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              <p className="text-xs text-gray-400 mt-1 text-right">{message.length}/500</p>
            </div>

            <button type="submit" disabled={sending || !title.trim() || !message.trim()}
              className="w-full py-2.5 font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors text-sm"
              style={{ background: "#3B82F6", color: "white" }}>
              {sending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                : <><Send className="w-4 h-4" /> {target === "all" ? `Send to All Sellers (${sellers.length})` : "Send to Seller"}</>
              }
            </button>
          </form>
        </div>

        {/* ── History ── */}
        <div className="col-span-3 bg-white border border-gray-200 rounded-2xl overflow-hidden self-start">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-700">Sent History</h2>
            <span className="text-xs text-gray-400">{history.length} notifications</span>
          </div>
          {history.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">No notifications sent yet</div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
              {history.map(n => (
                <div key={n.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <CategoryBadge category={n.data?.category} />
                        <span className="text-xs text-gray-400">
                          → {n.user.brandName || n.user.name || n.user.email}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400">
                        {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(n.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {n.isRead
                        ? <span className="text-xs text-green-500 font-medium">Read</span>
                        : <span className="text-xs text-orange-400 font-medium">Unread</span>
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

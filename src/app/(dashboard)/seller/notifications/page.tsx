"use client";

import { useState, useEffect } from "react";
import {
  Bell, Loader2, CheckCheck, IndianRupee,
  Package, AlertCircle, Info, ShoppingCart, Truck,
} from "lucide-react";

interface NotificationData { category?: string; adminSent?: boolean; }
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data: NotificationData | null;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  PRODUCT_APPROVED:  { icon: CheckCheck,    color: "#00C67A", bg: "#F0FDF4" },
  PRODUCT_REJECTED:  { icon: AlertCircle,   color: "#EF4444", bg: "#FEF2F2" },
  LISTING_REQUEST:   { icon: Package,       color: "#7C3AED", bg: "#F5F3FF" },
  LISTING_DONE:      { icon: CheckCheck,    color: "#00C67A", bg: "#F0FDF4" },
  ORDER_UPDATE:      { icon: ShoppingCart,  color: "#3B82F6", bg: "#EFF6FF" },
  AWB_GENERATED:     { icon: Truck,         color: "#025864", bg: "#ECFDF5" },
  GENERAL:           { icon: Bell,          color: "#6B7280", bg: "#F9FAFB" },
};

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  "Payment Reminder": { icon: IndianRupee, color: "#F59E0B", bg: "#FFF7ED" },
  "Stock Update":     { icon: Package,     color: "#7C3AED", bg: "#F5F3FF" },
  "Order Alert":      { icon: AlertCircle, color: "#EF4444", bg: "#FEF2F2" },
  "Announcement":     { icon: Bell,        color: "#00C67A", bg: "#F0FDF4" },
  "General":          { icon: Info,        color: "#3B82F6", bg: "#EFF6FF" },
};

function getConfig(n: Notification) {
  if (n.data?.adminSent && n.data.category) {
    return CATEGORY_CONFIG[n.data.category] ?? CATEGORY_CONFIG["General"];
  }
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

export default function SellerNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    fetch("/api/seller/notifications")
      .then(r => r.json())
      .then(d => {
        setNotifications(d.notifications || []);
        setUnreadCount(d.unreadCount ?? 0);
        setLoading(false);
      });
  }, []);

  async function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
    await fetch("/api/seller/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function markAllRead() {
    setMarkingAll(true);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await fetch("/api/seller/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setMarkingAll(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} disabled={markingAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors disabled:opacity-50">
            {markingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl py-20 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center">
            <Bell className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">No notifications yet</p>
          <p className="text-sm text-gray-400">Updates from your admin will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const cfg = getConfig(n);
            const Icon = cfg.icon;
            return (
              <div key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                className={`bg-white border rounded-2xl p-4 flex gap-4 transition-all cursor-pointer hover:shadow-sm ${
                  n.isRead ? "border-gray-100 opacity-75" : "border-blue-100 shadow-sm"
                }`}>
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: cfg.bg }}>
                  <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${n.isRead ? "text-gray-600" : "text-gray-900"}`}>
                      {n.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!n.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                      <span className="text-xs text-gray-400 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
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
  );
}

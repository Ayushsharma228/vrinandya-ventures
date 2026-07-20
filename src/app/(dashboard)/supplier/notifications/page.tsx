"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, CheckCheck, Package, ShoppingCart, AlertCircle } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data: Record<string, unknown> | null;
  createdAt: string;
};

const TYPE_ICON: Record<string, React.ElementType> = {
  ORDER_UPDATE: ShoppingCart,
  PRODUCT_APPROVED: Package,
  PRODUCT_REJECTED: AlertCircle,
  GENERAL: Bell,
};

const TYPE_COLOR: Record<string, string> = {
  ORDER_UPDATE: "#3B82F6",
  PRODUCT_APPROVED: "#16A34A",
  PRODUCT_REJECTED: "#EF4444",
  GENERAL: "#8B5CF6",
};

export default function SupplierNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/supplier/notifications");
      const data = await res.json();
      setNotifications(data.notifications ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await fetch("/api/supplier/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" });
      await fetchNotifications();
    } finally {
      setMarkingAll(false);
    }
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Notifications"
        subtitle="Stay updated on orders, products, and platform alerts"
        actions={
          unread > 0 ? (
            <button onClick={markAllRead} disabled={markingAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white"
              style={{ background: "var(--bg-muted)", border: "1px solid var(--border)" }}>
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          ) : null
        }
        cards={
          <div className="flex items-center gap-3 px-1">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <Bell className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-bold">{unread}</span>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>unread</span>
            </div>
          </div>
        }
      />

      <div className="px-4 md:px-8 pt-6">
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Bell className="w-6 h-6 animate-pulse" style={{ color: "var(--text-300)" }} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="card py-16 flex flex-col items-center gap-3">
            <Bell className="w-10 h-10" style={{ color: "var(--border)" }} />
            <p className="text-sm" style={{ color: "var(--text-400)" }}>No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const Icon = TYPE_ICON[n.type] ?? Bell;
              const color = TYPE_COLOR[n.type] ?? "#6B7280";
              return (
                <div key={n.id}
                  className="card px-5 py-4 flex items-start gap-4 transition-all"
                  style={{ opacity: n.isRead ? 0.7 : 1 }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15` }}>
                    <Icon className="w-4.5 h-4.5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>{n.title}</p>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-500)" }}>{n.message}</p>
                    <p className="text-xs mt-1.5" style={{ color: "var(--text-300)" }}>
                      {new Date(n.createdAt).toLocaleString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

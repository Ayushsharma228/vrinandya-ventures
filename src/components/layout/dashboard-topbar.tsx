"use client";

import { Bell, Search, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";

interface DashboardTopbarProps {
  role: "admin" | "seller" | "supplier" | "sales";
}

function useUnread(role: string) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const ep = role === "admin" ? "/api/admin/notifications" : role === "seller" ? "/api/seller/notifications" : null;
    if (!ep) return;
    fetch(ep).then(r => r.json()).then(d => setCount(d.unreadCount ?? 0)).catch(() => {});
  }, [role]);
  return count;
}

function crumb(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((p, i) => ({
    label: p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, " "),
    href: "/" + parts.slice(0, i + 1).join("/"),
  }));
}

export function DashboardTopbar({ role }: DashboardTopbarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const unread = useUnread(role);
  const breadcrumbs = crumb(pathname);
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const initial = session?.user?.name?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="h-16 flex items-center justify-between px-8 flex-shrink-0"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "var(--bg-page)" }}>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/" className="transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}>
          Home
        </Link>
        {breadcrumbs.map((b, i) => (
          <span key={b.href} className="flex items-center gap-2">
            <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
            {i === breadcrumbs.length - 1 ? (
              <span className="font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{b.label}</span>
            ) : (
              <Link href={b.href} className="transition-colors" style={{ color: "rgba(255,255,255,0.4)" }}
                onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}>
                {b.label}
              </Link>
            )}
          </span>
        ))}
        <span className="flex items-center gap-1 ml-2 px-2.5 py-1 rounded-lg text-xs font-medium"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {today} <ChevronDown className="w-3 h-3" />
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}>
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <Link href={`/${role}/notifications`}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors relative"
          style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}>
          <Bell className="w-4 h-4" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          )}
        </Link>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold cursor-pointer ml-1"
          style={{ background: "linear-gradient(135deg, #4361EE, #7C3AED)" }}>
          {initial}
        </div>
      </div>
    </header>
  );
}

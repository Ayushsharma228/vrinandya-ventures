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
    <header className="h-14 flex items-center justify-between px-8 flex-shrink-0"
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-card)",
      }}>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <Link href="/" className="transition-colors" style={{ color: "var(--text-muted)" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
          Home
        </Link>
        {breadcrumbs.map((b, i) => (
          <span key={b.href} className="flex items-center gap-1.5">
            <span style={{ color: "var(--border-strong)" }}>/</span>
            {i === breadcrumbs.length - 1 ? (
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{b.label}</span>
            ) : (
              <Link href={b.href} className="transition-colors" style={{ color: "var(--text-muted)" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                {b.label}
              </Link>
            )}
          </span>
        ))}
        <span className="flex items-center gap-1 ml-2 px-2 py-0.5 rounded-lg text-xs"
          style={{ background: "var(--bg-muted)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
          {today}
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
          style={{ color: "var(--text-muted)", background: "var(--bg-muted)" }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--accent-light)"; e.currentTarget.style.color = "var(--accent)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "var(--bg-muted)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Notifications */}
        <Link href={`/${role}/notifications`}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors relative"
          style={{ color: "var(--text-muted)", background: "var(--bg-muted)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--accent-light)"; (e.currentTarget as HTMLElement).style.color = "var(--accent)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-muted)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}>
          <Bell className="w-3.5 h-3.5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
          )}
        </Link>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold cursor-pointer ml-1 flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #4361EE, #7C3AED)" }}>
          {initial}
        </div>
      </div>
    </header>
  );
}

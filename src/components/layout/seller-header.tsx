"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import {
  ShoppingCart, Truck, AlertTriangle, Wallet, Receipt,
  Store, Activity, HelpCircle, Bell, User, LogOut,
  ChevronDown, Menu, X, BarChart2, LayoutDashboard,
} from "lucide-react";

interface NavItem { label: string; href: string; icon: React.ElementType }
interface NavGroup { label: string; href?: string; items?: NavItem[] }

const dropshippingNav: NavGroup[] = [
  { label: "Dashboard", href: "/seller" },
  { label: "Analytics", href: "/seller/analytics" },
  {
    label: "Fulfilment",
    items: [
      { label: "Orders",    href: "/seller/orders",     icon: ShoppingCart },
      { label: "Delivery",  href: "/seller/deliveries", icon: Truck },
      { label: "NDR",       href: "/seller/ndr",        icon: AlertTriangle },
    ],
  },
  { label: "Products", href: "/seller/catalog" },
  {
    label: "Finance",
    items: [
      { label: "Wallet",      href: "/seller/wallet",      icon: Wallet },
      { label: "Settlements", href: "/seller/settlements",  icon: Receipt },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Shopify Store", href: "/seller/shopify",       icon: Store },
      { label: "Activation",    href: "/seller/activation",    icon: Activity },
      { label: "Support",       href: "/seller/support",       icon: HelpCircle },
    ],
  },
];

export function SellerHeader({ plan, userName, userEmail }: {
  plan?: string;
  userName?: string;
  userEmail?: string;
}) {
  const pathname = usePathname();
  const [openGroup, setOpenGroup]   = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLElement>(null);

  const navGroups = dropshippingNav;
  const initial   = userName?.[0]?.toUpperCase() || "U";

  useEffect(() => {
    fetch("/api/seller/notifications")
      .then(r => r.json())
      .then(d => setUnreadCount(d.unreadCount ?? 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenGroup(null);
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => { setMobileOpen(false); setOpenGroup(null); setProfileOpen(false); }, [pathname]);

  const isGroupActive = (g: NavGroup) =>
    g.href
      ? g.href === "/seller" ? pathname === "/seller" : pathname.startsWith(g.href)
      : (g.items?.some(i => pathname === i.href || pathname.startsWith(i.href)) ?? false);

  return (
    <>
      <header ref={ref}
        className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center gap-4 px-4 md:px-8"
        style={{ background: "white", borderBottom: "1px solid #E5E7EB", boxShadow: "0 1px 12px rgba(0,0,0,0.05)" }}>

        {/* Logo */}
        <Link href="/seller" className="flex items-center gap-2.5 flex-shrink-0">
          <img src="/axqen-icon.png" alt="AXQEN" className="w-8 h-8 rounded-xl object-cover" />
          <span className="hidden sm:block font-bold text-sm tracking-wide" style={{ color: "#1e1b4b" }}>AXQEN</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          {navGroups.map((group) => {
            const active = isGroupActive(group);
            const isOpen = openGroup === group.label;

            if (!group.items) {
              return (
                <Link key={group.label} href={group.href!}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ background: active ? "#4361EE" : "transparent", color: active ? "white" : "#6B7280" }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#F5F7FF"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                  {group.label}
                </Link>
              );
            }

            return (
              <div key={group.label} className="relative">
                <button
                  className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ background: active ? "#4361EE" : isOpen ? "#F5F7FF" : "transparent", color: active ? "white" : "#6B7280" }}
                  onClick={() => setOpenGroup(isOpen ? null : group.label)}
                  onMouseEnter={e => { if (!active && !isOpen) e.currentTarget.style.background = "#F5F7FF"; }}
                  onMouseLeave={e => { if (!active && !isOpen) e.currentTarget.style.background = "transparent"; }}>
                  {group.label}
                  <ChevronDown className="w-3.5 h-3.5 transition-transform"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} />
                </button>

                {isOpen && (
                  <div className="absolute top-full left-0 mt-2 w-44 rounded-2xl overflow-hidden py-1.5"
                    style={{ background: "white", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid #E5E7EB" }}>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const itemActive = pathname === item.href || pathname.startsWith(item.href);
                      return (
                        <Link key={item.href} href={item.href}
                          className="flex items-center gap-3 mx-1.5 px-3 py-2.5 text-sm rounded-xl transition-colors"
                          style={{ background: itemActive ? "rgba(67,97,238,0.08)" : "transparent", color: itemActive ? "#4361EE" : "#374151" }}
                          onMouseEnter={e => { if (!itemActive) e.currentTarget.style.background = "#F9FAFB"; }}
                          onMouseLeave={e => { if (!itemActive) e.currentTarget.style.background = "transparent"; }}>
                          <Icon className="w-4 h-4 flex-shrink-0" style={{ color: itemActive ? "#4361EE" : "#9CA3AF" }} />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-2 ml-auto md:ml-0">
          {/* Notifications */}
          <Link href="/seller/notifications"
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(67,97,238,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#F9FAFB"; }}>
            <Bell className="w-4 h-4" style={{ color: "#6B7280" }} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Profile */}
          <div className="relative">
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
              style={{ background: "#4361EE" }}
              onClick={() => setProfileOpen(v => !v)}>
              {initial}
            </button>
            {profileOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 rounded-2xl overflow-hidden py-1.5"
                style={{ background: "white", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid #E5E7EB" }}>
                <div className="px-4 py-3 mx-1.5 rounded-xl mb-1" style={{ background: "#F9FAFB" }}>
                  <p className="text-sm font-semibold truncate" style={{ color: "#1e1b4b" }}>{userName || "User"}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: "#9CA3AF" }}>{userEmail}</p>
                </div>
                <Link href="/seller/profile"
                  className="flex items-center gap-3 mx-1.5 px-3 py-2.5 text-sm rounded-xl transition-colors"
                  style={{ color: "#374151" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#F9FAFB"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                  <User className="w-4 h-4" style={{ color: "#9CA3AF" }} />
                  <span className="font-medium">Profile</span>
                </Link>
                <button onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-3 mx-1.5 px-3 py-2.5 text-sm rounded-xl w-[calc(100%-12px)] transition-colors"
                  style={{ color: "#EF4444" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#FEF2F2"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center ml-1"
            style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
            onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen
              ? <X className="w-4 h-4" style={{ color: "#6B7280" }} />
              : <Menu className="w-4 h-4" style={{ color: "#6B7280" }} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.25)" }} />
          <div className="absolute top-16 left-0 right-0 bg-white shadow-xl overflow-y-auto max-h-[calc(100vh-64px)]"
            onClick={e => e.stopPropagation()}>
            {navGroups.map((group) =>
              !group.items ? (
                <Link key={group.label} href={group.href!}
                  className="flex items-center px-6 py-4 text-sm font-medium"
                  style={{
                    color: isGroupActive(group) ? "#4361EE" : "#374151",
                    borderBottom: "1px solid #F3F4F6",
                    background: isGroupActive(group) ? "rgba(67,97,238,0.05)" : "transparent",
                  }}>
                  {group.label}
                </Link>
              ) : (
                <div key={group.label}>
                  <div className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "#9CA3AF", background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                    {group.label}
                  </div>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || pathname.startsWith(item.href);
                    return (
                      <Link key={item.href} href={item.href}
                        className="flex items-center gap-3 px-8 py-3.5 text-sm"
                        style={{ color: active ? "#4361EE" : "#374151", borderBottom: "1px solid #F3F4F6", background: active ? "rgba(67,97,238,0.05)" : "transparent" }}>
                        <Icon className="w-4 h-4" style={{ color: active ? "#4361EE" : "#9CA3AF" }} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </>
  );
}

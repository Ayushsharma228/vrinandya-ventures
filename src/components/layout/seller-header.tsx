"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import {
  ShoppingCart, Truck, AlertTriangle, Wallet, Receipt,
  Store, Activity, HelpCircle, Bell, User, LogOut,
  ChevronDown, Menu, X, Settings, Package, Layers,
} from "lucide-react";

interface NavItem  { label: string; href: string; icon: React.ElementType }
interface NavGroup { label: string; href?: string; items?: NavItem[] }

const dropshippingNav: NavGroup[] = [
  { label: "Dashboard", href: "/seller" },
  { label: "Analytics",  href: "/seller/analytics" },
  {
    label: "Fulfilment",
    items: [
      { label: "Orders",   href: "/seller/orders",     icon: ShoppingCart },
      { label: "Delivery", href: "/seller/deliveries", icon: Truck },
      { label: "NDR",      href: "/seller/ndr",        icon: AlertTriangle },
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
      { label: "Shopify Store", href: "/seller/shopify",    icon: Store },
      { label: "Activation",   href: "/seller/activation",  icon: Activity },
      { label: "Support",      href: "/seller/support",     icon: HelpCircle },
    ],
  },
];

const marketplaceNav: NavGroup[] = [
  { label: "Dashboard", href: "/seller" },
  { label: "Analytics",  href: "/seller/analytics" },
  {
    label: "Fulfilment",
    items: [
      { label: "Orders",   href: "/seller/orders",     icon: ShoppingCart },
      { label: "Delivery", href: "/seller/deliveries", icon: Truck },
      { label: "Returns",  href: "/seller/ndr",        icon: AlertTriangle },
    ],
  },
  {
    label: "Products",
    items: [
      { label: "Listings",   href: "/seller/listings",  icon: Layers },
      { label: "Inventory",  href: "/seller/inventory", icon: Package },
    ],
  },
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
      { label: "Amazon",     href: "/seller/amazon",      icon: ShoppingCart },
      { label: "Activation", href: "/seller/activation",  icon: Activity },
      { label: "Support",    href: "/seller/support",     icon: HelpCircle },
    ],
  },
];

export function SellerHeader({ plan, userName, userEmail }: {
  plan?: string;
  userName?: string;
  userEmail?: string;
}) {
  const pathname    = usePathname();
  const sellerNav   = plan === "MARKETPLACE" ? marketplaceNav : dropshippingNav;
  const [openGroup,   setOpenGroup]   = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLElement>(null);

  const initial = userName?.[0]?.toUpperCase() || "U";

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

  useEffect(() => {
    setMobileOpen(false);
    setOpenGroup(null);
    setProfileOpen(false);
  }, [pathname]);

  const isGroupActive = (g: NavGroup) =>
    g.href
      ? g.href === "/seller" ? pathname === "/seller" : pathname.startsWith(g.href)
      : (g.items?.some(i => pathname === i.href || pathname.startsWith(i.href)) ?? false);

  return (
    <>
      {/* NO border-bottom, NO box-shadow separator */}
      <header
        ref={ref}
        className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center px-6 md:px-8 gap-6"
        style={{ background: "white" }}
      >
        {/* ── Logo + Name (left) ── */}
        <Link href="/seller" className="flex items-center gap-2.5 flex-shrink-0">
          <img src="/axqen-icon.png" alt="AXQEN" className="w-8 h-8 rounded-xl object-cover" />
          <span className="hidden sm:block font-bold text-base" style={{ color: "#1e1b4b" }}>AXQEN</span>
        </Link>

        {/* spacer — pushes nav towards the right */}
        <div className="flex-1" />

        {/* ── Nav inside smoke rounded rectangle ── */}
        <nav className="hidden md:flex items-center gap-1 px-2 py-2 rounded-full"
          style={{ background: "#F0F2F8" }}>
          {sellerNav.map((group) => {
            const active = isGroupActive(group);
            const isOpen = openGroup === group.label;

            if (!group.items) {
              return (
                <Link
                  key={group.label}
                  href={group.href!}
                  className="px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap"
                  style={{
                    background: active ? "#4361EE" : "transparent",
                    color: active ? "white" : "#6B7280",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#1e1b4b"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#6B7280"; }}
                >
                  {group.label}
                </Link>
              );
            }

            return (
              <div key={group.label} className="relative">
                <button
                  className="flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap"
                  style={{
                    background: active ? "#4361EE" : "transparent",
                    color: active ? "white" : "#6B7280",
                  }}
                  onClick={() => setOpenGroup(isOpen ? null : group.label)}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#1e1b4b"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#6B7280"; }}
                >
                  {group.label}
                  <ChevronDown
                    className="w-3.5 h-3.5 transition-transform"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>

                {isOpen && (
                  <div
                    className="absolute top-full left-0 mt-2 w-44 rounded-2xl overflow-hidden py-1.5"
                    style={{ background: "white", boxShadow: "0 8px 32px rgba(67,97,238,0.15)", border: "1px solid #ECEEF5" }}
                  >
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const itemActive = pathname === item.href || pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="flex items-center gap-3 mx-1.5 px-3 py-2.5 rounded-xl text-sm transition-colors"
                          style={{
                            background: itemActive ? "rgba(67,97,238,0.08)" : "transparent",
                            color: itemActive ? "#4361EE" : "#374151",
                          }}
                          onMouseEnter={e => { if (!itemActive) e.currentTarget.style.background = "#F5F7FF"; }}
                          onMouseLeave={e => { if (!itemActive) e.currentTarget.style.background = "transparent"; }}
                        >
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

        {/* ── Right: Bell + Settings + Profile ── */}
        <div className="flex items-center gap-3 ml-4">

          {/* Notification bell */}
          <Link
            href="/seller/notifications"
            className="relative w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
            style={{ background: "#F3F5FF", border: "1px solid #E8EBFF" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(67,97,238,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#F3F5FF"; }}
          >
            <Bell className="w-4 h-4" style={{ color: "#4361EE" }} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Settings */}
          <Link
            href="/seller/profile"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
            style={{ background: "#F3F5FF", border: "1px solid #E8EBFF" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(67,97,238,0.12)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#F3F5FF"; }}
          >
            <Settings className="w-4 h-4" style={{ color: "#4361EE" }} />
          </Link>

          {/* Profile — avatar + name + email */}
          <div className="relative flex-shrink-0">
            <button
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-2xl transition-colors"
              style={{ background: "#F3F5FF", border: "1px solid #E8EBFF" }}
              onClick={() => setProfileOpen(v => !v)}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(67,97,238,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#F3F5FF"; }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: "#4361EE" }}
              >
                {initial}
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-xs font-semibold truncate max-w-[100px]" style={{ color: "#1e1b4b" }}>
                  {userName || "User"}
                </p>
                <p className="text-[10px] truncate max-w-[100px]" style={{ color: "#9CA3AF" }}>
                  {userEmail}
                </p>
              </div>
            </button>

            {profileOpen && (
              <div
                className="absolute top-full right-0 mt-2 w-56 rounded-2xl overflow-hidden py-1.5"
                style={{ background: "white", boxShadow: "0 8px 32px rgba(67,97,238,0.14)", border: "1px solid #ECEEF5" }}
              >
                <div className="px-4 py-3 mx-1.5 mb-1 rounded-xl" style={{ background: "#F9FAFB" }}>
                  <p className="text-sm font-semibold truncate" style={{ color: "#1e1b4b" }}>{userName || "User"}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: "#9CA3AF" }}>{userEmail}</p>
                </div>
                <Link
                  href="/seller/profile"
                  className="flex items-center gap-3 mx-1.5 px-3 py-2.5 rounded-xl text-sm transition-colors"
                  style={{ color: "#374151" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#F5F7FF"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <User className="w-4 h-4" style={{ color: "#9CA3AF" }} />
                  <span className="font-medium">Profile</span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-3 mx-1.5 px-3 py-2.5 rounded-xl text-sm w-[calc(100%-12px)] transition-colors"
                  style={{ color: "#EF4444" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#FEF2F2"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#F3F5FF", border: "1px solid #E8EBFF" }}
            onClick={() => setMobileOpen(v => !v)}
          >
            {mobileOpen
              ? <X    className="w-4 h-4" style={{ color: "#4361EE" }} />
              : <Menu className="w-4 h-4" style={{ color: "#4361EE" }} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.2)" }} />
          <div
            className="absolute top-20 left-0 right-0 bg-white shadow-2xl overflow-y-auto max-h-[calc(100vh-80px)]"
            onClick={e => e.stopPropagation()}
          >
            {sellerNav.map((group) =>
              !group.items ? (
                <Link
                  key={group.label}
                  href={group.href!}
                  className="flex items-center px-6 py-4 text-sm font-medium"
                  style={{
                    color: isGroupActive(group) ? "#4361EE" : "#374151",
                    borderBottom: "1px solid #F3F4F6",
                    background: isGroupActive(group) ? "rgba(67,97,238,0.05)" : "transparent",
                  }}
                >
                  {group.label}
                </Link>
              ) : (
                <div key={group.label}>
                  <div className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "#9CA3AF", background: "#FAFAFA", borderBottom: "1px solid #F3F4F6" }}>
                    {group.label}
                  </div>
                  {group.items.map((item) => {
                    const Icon   = item.icon;
                    const active = pathname === item.href || pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-8 py-3.5 text-sm"
                        style={{
                          color: active ? "#4361EE" : "#374151",
                          borderBottom: "1px solid #F3F4F6",
                          background: active ? "rgba(67,97,238,0.05)" : "transparent",
                        }}
                      >
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

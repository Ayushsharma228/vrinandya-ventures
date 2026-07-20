"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Bell,
  LogOut, Truck, Store, ListChecks, CheckSquare,
  Wallet, BadgeIndianRupee, User, Megaphone, AlertTriangle, UserCheck,
  Menu, X, ClipboardList, BarChart2, Boxes, Receipt, TrendingUp,
  Settings2, ShieldCheck, BanknoteIcon, MonitorDot, Zap, Layers,
  Bot, Activity, MessageCircle,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  section?: string;
}

const adminNav: NavItem[] = [
  { label: "Dashboard",         href: "/admin",                   icon: LayoutDashboard, section: "MAIN" },
  { label: "Analytics",         href: "/admin/analytics",         icon: BarChart2 },
  { label: "Automation",        href: "/admin/automation",        icon: Zap },
  { label: "Operations",         href: "/admin/operations",        icon: MonitorDot,      section: "OPERATIONS" },
  { label: "Orders",            href: "/admin/orders",            icon: ShoppingCart },
  { label: "Delivery",          href: "/admin/delivery",          icon: Truck },
  { label: "NDR",               href: "/admin/ndr",               icon: AlertTriangle },
  { label: "Purchase Orders",   href: "/admin/purchase-orders",   icon: ClipboardList },
  { label: "Inventory",         href: "/admin/inventory",         icon: Boxes },
  { label: "Listing OS",        href: "/admin/listing-os",        icon: Layers,          section: "LISTING OS" },
  { label: "Listing Requests",  href: "/admin/listings",          icon: ListChecks },
  { label: "Products",          href: "/admin/products",          icon: Package },
  { label: "CRM",               href: "/admin/crm",               icon: UserCheck,       section: "CRM" },
  { label: "WhatsApp",          href: "/admin/whatsapp",          icon: MessageCircle },
  { label: "Reconciliation",    href: "/admin/reconciliation",    icon: CheckSquare,     section: "FINANCE" },
  { label: "Remittance",        href: "/admin/remittance",        icon: BadgeIndianRupee },
  { label: "Payouts",           href: "/admin/withdrawals",       icon: BanknoteIcon },
  { label: "Supplier Payables", href: "/admin/supplier-payables", icon: BadgeIndianRupee },
  { label: "Meta Ads",          href: "/admin/ad-spend",          icon: Megaphone },
  { label: "Amazon",            href: "/admin/amazon",            icon: ShoppingCart,    section: "MARKETPLACES" },
  { label: "AI Workforce",      href: "/admin/ai-workforce",      icon: Bot,             section: "TEAM" },
  { label: "Sellers",           href: "/admin/sellers",           icon: Store },
  { label: "Activation",        href: "/admin/activation",        icon: Activity },
  { label: "KYC",               href: "/admin/kyc",               icon: ShieldCheck },
  { label: "Config",            href: "/admin/config",            icon: Settings2 },
  { label: "Users",             href: "/admin/users",             icon: Users },
  { label: "Notifications",     href: "/admin/notifications",     icon: Bell },
];

const sellerNav: NavItem[] = [
  { label: "Dashboard",      href: "/seller",                  icon: LayoutDashboard, section: "MAIN" },
  { label: "Analytics",      href: "/seller/analytics",        icon: BarChart2 },
  { label: "Orders",         href: "/seller/orders",           icon: ShoppingCart,    section: "FULFILMENT" },
  { label: "Delivery",       href: "/seller/deliveries",       icon: Truck },
  { label: "NDR",            href: "/seller/ndr",              icon: AlertTriangle },
  { label: "My Listings",    href: "/seller/listings",         icon: ListChecks,      section: "PRODUCTS" },
  { label: "Catalog",        href: "/seller/catalog",          icon: Package },
  { label: "Wallet",         href: "/seller/wallet",           icon: Wallet,          section: "FINANCE" },
  { label: "Settlements",    href: "/seller/settlements",      icon: Receipt },
  { label: "Shopify Store",  href: "/seller/shopify",          icon: Store,           section: "SETTINGS" },
  { label: "Amazon",         href: "/seller/amazon",           icon: ShoppingCart },
  { label: "Activation",     href: "/seller/activation",       icon: Activity },
  { label: "Notifications",  href: "/seller/notifications",    icon: Bell },
  { label: "Profile",        href: "/seller/profile",          icon: User },
];

const salesNav: NavItem[] = [
  { label: "Dashboard",  href: "/sales",         icon: LayoutDashboard, section: "MAIN" },
  { label: "My Leads",   href: "/sales/leads",   icon: UserCheck },
];

const supplierNav: NavItem[] = [
  { label: "Dashboard",       href: "/supplier",                 icon: LayoutDashboard, section: "MAIN" },
  { label: "Performance",     href: "/supplier/performance",     icon: TrendingUp },
  { label: "Order Queue",     href: "/supplier/orders",          icon: ShoppingCart,    section: "ORDERS" },
  { label: "Purchase Orders", href: "/supplier/purchase-orders", icon: ClipboardList },
  { label: "My Products",     href: "/supplier/products",        icon: Package,         section: "CATALOGUE" },
  { label: "Add Product",     href: "/supplier/products/new",    icon: CheckSquare },
  { label: "Inventory",       href: "/supplier/inventory",       icon: Boxes },
  { label: "Wallet",          href: "/supplier/wallet",          icon: Wallet,          section: "FINANCE" },
  { label: "Settlements",     href: "/supplier/settlements",     icon: Receipt },
  { label: "Notifications",   href: "/supplier/notifications",   icon: Bell,            section: "ACCOUNT" },
  { label: "Profile",         href: "/supplier/profile",         icon: User },
];

interface SidebarV2Props {
  role: "admin" | "seller" | "supplier" | "sales";
  userName?: string;
  userEmail?: string;
}

export function SidebarV2({ role, userName, userEmail }: SidebarV2Props) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    if (role !== "seller") return;
    fetch("/api/seller/notifications").then(r => r.json()).then(d => setUnreadCount(d.unreadCount ?? 0)).catch(() => {});
  }, [role]);

  const nav = role === "admin" ? adminNav : role === "seller" ? sellerNav : role === "sales" ? salesNav : supplierNav;
  const initial = userName?.[0]?.toUpperCase() || "U";

  const content = (
    <div className="flex flex-col h-full" style={{ background: "var(--bg-sidebar)" }}>
      {/* Logo */}
      <div className="h-16 px-5 flex items-center gap-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 text-white"
          style={{ background: "var(--accent)" }}>
          A
        </div>
        <span className="font-bold text-sm tracking-wide" style={{ color: "var(--text-primary)" }}>AXQEN</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {nav.map((item) => {
          const Icon = item.icon;
          const roots = ["/admin", "/seller", "/supplier", "/sales"];
          const isActive = pathname === item.href || (!roots.includes(item.href) && pathname.startsWith(item.href));
          return (
            <div key={item.href}>
              {/* Section label */}
              {item.section && (
                <p className="text-[10px] font-semibold uppercase tracking-widest px-3 pb-1 mt-5 mb-0.5 first:mt-2"
                  style={{ color: "var(--text-muted)" }}>
                  {item.section}
                </p>
              )}
              <Link href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-100 mb-0.5"
                style={{
                  background: isActive ? "rgba(67,97,238,0.1)" : "transparent",
                  color: isActive ? "var(--accent)" : "var(--text-secondary)",
                  fontWeight: isActive ? 600 : 500,
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(13,17,23,0.04)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.href === "/seller/notifications" && unreadCount > 0 && (
                  <span className="w-5 h-5 text-[10px] font-bold rounded-full bg-red-500 text-white flex items-center justify-center flex-shrink-0">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl mb-1" style={{ background: "var(--bg-muted)" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: "var(--accent)" }}>
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{userName || "User"}</p>
            <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{userEmail}</p>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm transition-all"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}>
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4"
        style={{ background: "var(--bg-sidebar)", borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white" style={{ background: "var(--accent)" }}>A</div>
          <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>AXQEN</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2" style={{ color: "var(--text-secondary)" }}>
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-60 h-full z-10">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1.5 rounded-lg z-10"
              style={{ color: "var(--text-secondary)" }}>
              <X className="w-5 h-5" />
            </button>
            {content}
          </aside>
        </div>
      )}

      {/* Desktop */}
      <aside className="hidden md:flex w-56 flex-col min-h-screen flex-shrink-0"
        style={{ background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)" }}>
        {content}
      </aside>
    </>
  );
}

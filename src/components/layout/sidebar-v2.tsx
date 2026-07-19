"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Bell,
  LogOut, Truck, Store, ListChecks, CheckSquare,
  Wallet, BadgeIndianRupee, User, Megaphone, AlertTriangle, UserCheck,
  Menu, X, ClipboardList, BarChart2, Boxes, Receipt, TrendingUp, Settings2, ShieldCheck, BanknoteIcon,
  MonitorDot, Zap, Layers, Bot, Activity, MessageCircle, Settings,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  dividerBefore?: boolean;
}

const adminNav: NavItem[] = [
  { label: "Dashboard",         href: "/admin",                  icon: LayoutDashboard },
  { label: "Analytics",         href: "/admin/analytics",        icon: BarChart2 },
  { label: "Operations",        href: "/admin/operations",       icon: MonitorDot,       dividerBefore: true },
  { label: "Orders",            href: "/admin/orders",           icon: ShoppingCart },
  { label: "Delivery",          href: "/admin/delivery",         icon: Truck },
  { label: "NDR",               href: "/admin/ndr",              icon: AlertTriangle },
  { label: "Purchase Orders",   href: "/admin/purchase-orders",  icon: ClipboardList },
  { label: "Inventory",         href: "/admin/inventory",        icon: Boxes },
  { label: "Automation",        href: "/admin/automation",       icon: Zap },
  { label: "Listing OS",        href: "/admin/listing-os",       icon: Layers,           dividerBefore: true },
  { label: "Listing Requests",  href: "/admin/listings",         icon: ListChecks },
  { label: "Products",          href: "/admin/products",         icon: Package },
  { label: "CRM",               href: "/admin/crm",              icon: UserCheck,        dividerBefore: true },
  { label: "WhatsApp",          href: "/admin/whatsapp",         icon: MessageCircle },
  { label: "Finance OS",        href: "/admin/finance",          icon: TrendingUp,       dividerBefore: true },
  { label: "Reconciliation",    href: "/admin/reconciliation",   icon: CheckSquare },
  { label: "Remittance",        href: "/admin/remittance",       icon: BadgeIndianRupee },
  { label: "Payouts",           href: "/admin/withdrawals",      icon: BanknoteIcon },
  { label: "Supplier Payables", href: "/admin/supplier-payables",icon: BadgeIndianRupee },
  { label: "Meta Ads",          href: "/admin/ad-spend",         icon: Megaphone },
  { label: "AI Workforce",      href: "/admin/ai-workforce",     icon: Bot,              dividerBefore: true },
  { label: "Sellers",           href: "/admin/sellers",          icon: Store },
  { label: "Activation",        href: "/admin/activation",       icon: Activity },
  { label: "KYC Approvals",     href: "/admin/kyc",              icon: ShieldCheck },
  { label: "Platform Config",   href: "/admin/config",           icon: Settings2 },
  { label: "Users",             href: "/admin/users",            icon: Users },
  { label: "Notifications",     href: "/admin/notifications",    icon: Bell },
];

const sellerNav: NavItem[] = [
  { label: "Dashboard",         href: "/seller",                 icon: LayoutDashboard },
  { label: "Analytics",         href: "/seller/analytics",      icon: BarChart2 },
  { label: "Orders",            href: "/seller/orders",         icon: ShoppingCart,     dividerBefore: true },
  { label: "Delivery",          href: "/seller/deliveries",     icon: Truck },
  { label: "NDR Management",    href: "/seller/ndr",            icon: AlertTriangle },
  { label: "My Listings",       href: "/seller/listings",       icon: ListChecks },
  { label: "Product Catalog",   href: "/seller/catalog",        icon: Package,          dividerBefore: true },
  { label: "Wallet",            href: "/seller/wallet",         icon: Wallet,           dividerBefore: true },
  { label: "Settlements",       href: "/seller/settlements",    icon: Receipt },
  { label: "Activation",        href: "/seller/activation",     icon: Activity,         dividerBefore: true },
  { label: "Shopify Store",     href: "/seller/shopify",        icon: Store },
  { label: "Notifications",     href: "/seller/notifications",  icon: Bell },
  { label: "Profile",           href: "/seller/profile",        icon: User },
];

const salesNav: NavItem[] = [
  { label: "Dashboard",         href: "/sales",                  icon: LayoutDashboard },
  { label: "My Leads",          href: "/sales/leads",            icon: UserCheck,        dividerBefore: true },
];

const supplierNav: NavItem[] = [
  { label: "Dashboard",         href: "/supplier",               icon: LayoutDashboard },
  { label: "Performance",       href: "/supplier/performance",   icon: TrendingUp },
  { label: "Order Queue",       href: "/supplier/orders",        icon: ShoppingCart,     dividerBefore: true },
  { label: "Purchase Orders",   href: "/supplier/purchase-orders", icon: ClipboardList },
  { label: "My Products",       href: "/supplier/products",      icon: Package,          dividerBefore: true },
  { label: "Add Product",       href: "/supplier/products/new",  icon: CheckSquare },
  { label: "Inventory",         href: "/supplier/inventory",     icon: Boxes },
  { label: "Wallet",            href: "/supplier/wallet",        icon: Wallet,           dividerBefore: true },
  { label: "Settlements",       href: "/supplier/settlements",   icon: Receipt },
  { label: "Notifications",     href: "/supplier/notifications", icon: Bell,             dividerBefore: true },
  { label: "Profile",           href: "/supplier/profile",       icon: User },
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
    fetch("/api/seller/notifications")
      .then(r => r.json())
      .then(d => setUnreadCount(d.unreadCount ?? 0))
      .catch(() => {});
  }, [role]);

  const nav =
    role === "admin" ? adminNav :
    role === "seller" ? sellerNav :
    role === "sales" ? salesNav :
    supplierNav;

  const initial = userName?.[0]?.toUpperCase() || "U";

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 px-5 flex items-center gap-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #4F7AFF 0%, #00C67A 100%)", color: "#fff" }}>
          A
        </div>
        <span className="font-bold text-white text-base tracking-wide">AXQEN</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {nav.map((item) => {
          const Icon = item.icon;
          const rootPaths = ["/admin", "/seller", "/supplier", "/sales"];
          const isActive = pathname === item.href ||
            (!rootPaths.includes(item.href) && pathname.startsWith(item.href));

          return (
            <div key={item.href}>
              {item.dividerBefore && (
                <div className="my-2 mx-2" style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />
              )}
              <Link
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group"
                style={isActive
                  ? { background: "rgba(79,122,255,0.18)", color: "#6B9FFF" }
                  : { color: "rgba(255,255,255,0.4)" }
                }
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = "rgba(255,255,255,0.75)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; e.currentTarget.style.background = "transparent"; }}}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                    style={{ background: "#4F7AFF" }} />
                )}
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.href === "/seller/notifications" && unreadCount > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex-shrink-0 px-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
          style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #4F7AFF, #00C67A)" }}>
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-tight">{userName || "User"}</p>
            <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.3)" }}>{userEmail}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
          style={{ color: "rgba(255,255,255,0.3)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.background = "transparent"; }}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4"
        style={{ background: "var(--bg-sidebar)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs"
            style={{ background: "linear-gradient(135deg, #4F7AFF 0%, #00C67A 100%)", color: "#fff" }}>A</div>
          <span className="text-white font-bold text-sm tracking-wide">AXQEN</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg" style={{ color: "rgba(255,255,255,0.6)" }}>
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-60 h-full z-10" style={{ background: "var(--bg-sidebar)" }}>
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg" style={{ color: "rgba(255,255,255,0.4)" }}>
              <X className="w-5 h-5" />
            </button>
            {navContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col min-h-screen flex-shrink-0"
        style={{ background: "var(--bg-sidebar)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        {navContent}
      </aside>
    </>
  );
}

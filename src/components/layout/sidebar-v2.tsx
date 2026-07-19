"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
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
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const adminGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard",         href: "/admin",              icon: LayoutDashboard },
      { label: "Analytics",         href: "/admin/analytics",    icon: BarChart2 },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Operations",        href: "/admin/operations",   icon: MonitorDot },
      { label: "Orders",            href: "/admin/orders",       icon: ShoppingCart },
      { label: "Delivery",          href: "/admin/delivery",     icon: Truck },
      { label: "NDR",               href: "/admin/ndr",          icon: AlertTriangle },
      { label: "Purchase Orders",   href: "/admin/purchase-orders", icon: ClipboardList },
      { label: "Inventory",         href: "/admin/inventory",    icon: Boxes },
      { label: "Automation",        href: "/admin/automation",   icon: Zap },
    ],
  },
  {
    label: "Listings",
    items: [
      { label: "Listing OS",        href: "/admin/listing-os",   icon: Layers },
      { label: "Listing Requests",  href: "/admin/listings",     icon: ListChecks },
      { label: "Products",          href: "/admin/products",     icon: Package },
    ],
  },
  {
    label: "Sales & CRM",
    items: [
      { label: "CRM",               href: "/admin/crm",          icon: UserCheck },
      { label: "WhatsApp",          href: "/admin/whatsapp",     icon: MessageCircle },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Finance OS",        href: "/admin/finance",      icon: TrendingUp },
      { label: "Reconciliation",    href: "/admin/reconciliation", icon: CheckSquare },
      { label: "Remittance",        href: "/admin/remittance",   icon: BadgeIndianRupee },
      { label: "Payouts",           href: "/admin/withdrawals",  icon: BanknoteIcon },
      { label: "Supplier Payables", href: "/admin/supplier-payables", icon: BadgeIndianRupee },
      { label: "Meta Ads Spend",    href: "/admin/ad-spend",     icon: Megaphone },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "AI Workforce",      href: "/admin/ai-workforce", icon: Bot },
      { label: "Seller Activation", href: "/admin/activation",   icon: Activity },
      { label: "Sellers",           href: "/admin/sellers",      icon: Store },
      { label: "Users",             href: "/admin/users",        icon: Users },
      { label: "KYC Approvals",     href: "/admin/kyc",          icon: ShieldCheck },
      { label: "Platform Config",   href: "/admin/config",       icon: Settings2 },
      { label: "Notifications",     href: "/admin/notifications", icon: Bell },
    ],
  },
];

const sellerGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard",         href: "/seller",             icon: LayoutDashboard },
      { label: "Analytics",         href: "/seller/analytics",   icon: BarChart2 },
    ],
  },
  {
    label: "Orders",
    items: [
      { label: "Orders",            href: "/seller/orders",      icon: ShoppingCart },
      { label: "Delivery",          href: "/seller/deliveries",  icon: Truck },
      { label: "NDR Management",    href: "/seller/ndr",         icon: AlertTriangle },
      { label: "My Listings",       href: "/seller/listings",    icon: ListChecks },
    ],
  },
  {
    label: "Products",
    items: [
      { label: "Product Catalog",   href: "/seller/catalog",     icon: Package },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Wallet",            href: "/seller/wallet",      icon: Wallet },
      { label: "Settlements",       href: "/seller/settlements", icon: Receipt },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Activation",        href: "/seller/activation",  icon: Activity },
      { label: "Shopify Store",     href: "/seller/shopify",     icon: Store },
      { label: "Notifications",     href: "/seller/notifications", icon: Bell },
      { label: "Profile",           href: "/seller/profile",     icon: User },
    ],
  },
];

const salesGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard",    href: "/sales",        icon: LayoutDashboard },
    ],
  },
  {
    label: "CRM",
    items: [
      { label: "My Leads",     href: "/sales/leads",  icon: UserCheck },
    ],
  },
];

const supplierGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard",         href: "/supplier",               icon: LayoutDashboard },
      { label: "Performance",       href: "/supplier/performance",   icon: TrendingUp },
    ],
  },
  {
    label: "Orders",
    items: [
      { label: "Order Queue",       href: "/supplier/orders",        icon: ShoppingCart },
      { label: "Purchase Orders",   href: "/supplier/purchase-orders", icon: ClipboardList },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "My Products",       href: "/supplier/products",      icon: Package },
      { label: "Add Product",       href: "/supplier/products/new",  icon: CheckSquare },
      { label: "Inventory",         href: "/supplier/inventory",     icon: Boxes },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Wallet",            href: "/supplier/wallet",        icon: Wallet },
      { label: "Settlements",       href: "/supplier/settlements",   icon: Receipt },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Notifications",     href: "/supplier/notifications", icon: Bell },
      { label: "Profile",           href: "/supplier/profile",       icon: User },
    ],
  },
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

  const groups =
    role === "admin" ? adminGroups :
    role === "seller" ? sellerGroups :
    role === "sales" ? salesGroups :
    supplierGroups;

  const roleLabel =
    role === "admin" ? "Admin" :
    role === "seller" ? "Seller" :
    role === "sales" ? "Sales" :
    "Supplier";

  const initial = userName?.[0]?.toUpperCase() || "U";

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 h-16 flex items-center gap-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
          style={{ background: "linear-gradient(135deg, #4F7AFF 0%, #00C67A 100%)", color: "#fff" }}>
          A
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-tight tracking-wide">AXQEN</p>
          <p className="text-[10px] font-medium leading-tight" style={{ color: "rgba(255,255,255,0.35)" }}>{roleLabel} Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-1.5"
              style={{ color: "rgba(255,255,255,0.2)" }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const rootPaths = ["/admin", "/seller", "/supplier", "/sales"];
                const isActive = pathname === item.href ||
                  (!rootPaths.includes(item.href) && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 group"
                    style={isActive
                      ? { background: "rgba(79,122,255,0.15)", color: "#4F7AFF" }
                      : { color: "rgba(255,255,255,0.45)" }
                    }
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.45)"; }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.href === "/seller/notifications" && unreadCount > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#4F7AFF" }} />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="flex-shrink-0 px-3 py-4 space-y-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #4F7AFF, #00C67A)" }}>
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-tight">{userName || "User"}</p>
            <p className="text-[10px] truncate leading-tight" style={{ color: "rgba(255,255,255,0.3)" }}>{userEmail}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm transition-all duration-150"
          style={{ color: "rgba(255,255,255,0.3)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.background = "transparent"; }}
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4"
        style={{ background: "var(--bg-sidebar)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs"
            style={{ background: "linear-gradient(135deg, #4F7AFF 0%, #00C67A 100%)", color: "#fff" }}>A</div>
          <p className="text-white font-bold text-sm tracking-wide">AXQEN</p>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg" style={{ color: "rgba(255,255,255,0.6)" }}>
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full z-10" style={{ background: "var(--bg-sidebar)" }}>
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Bell,
  Settings, LogOut, Truck, Store, ListChecks, CheckSquare,
  Wallet, BadgeIndianRupee, ShoppingBag, ChevronRight, User,
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
    label: "Main",
    items: [
      { label: "Dashboard",         href: "/admin",             icon: LayoutDashboard },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Orders",            href: "/admin/orders",      icon: ShoppingCart },
      { label: "Delivery",          href: "/admin/delivery",    icon: Truck },
      { label: "Listing Requests",  href: "/admin/listings",    icon: ListChecks },
    ],
  },
  {
    label: "Products",
    items: [
      { label: "Products",          href: "/admin/products",    icon: Package },
      { label: "CJ Catalog",        href: "/admin/cj-catalog",  icon: ShoppingBag },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Remittance",        href: "/admin/remittance",  icon: BadgeIndianRupee },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Users",             href: "/admin/users",       icon: Users },
      { label: "Notifications",     href: "/admin/notifications", icon: Bell },
    ],
  },
];

const sellerGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard",         href: "/seller",            icon: LayoutDashboard },
    ],
  },
  {
    label: "Products",
    items: [
      { label: "Product Catalog",   href: "/seller/catalog",    icon: Package },
      { label: "My Listings",       href: "/seller/listings",   icon: ListChecks },
    ],
  },
  {
    label: "Orders",
    items: [
      { label: "Orders",            href: "/seller/orders",     icon: ShoppingCart },
      { label: "Delivery",          href: "/seller/delivery",   icon: Truck },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Wallet",            href: "/seller/wallet",     icon: Wallet },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Shopify Store",     href: "/seller/shopify",    icon: Store },
      { label: "Notifications",     href: "/seller/notifications", icon: Bell },
      { label: "Profile",           href: "/seller/profile",    icon: User },
    ],
  },
];

const supplierGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      { label: "Dashboard",         href: "/supplier",          icon: LayoutDashboard },
    ],
  },
  {
    label: "Products",
    items: [
      { label: "My Products",       href: "/supplier/products", icon: Package },
      { label: "Add Product",       href: "/supplier/products/new", icon: CheckSquare },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Notifications",     href: "/supplier/notifications", icon: Bell },
      { label: "Settings",          href: "/supplier/settings", icon: Settings },
    ],
  },
];

interface SidebarV2Props {
  role: "admin" | "seller" | "supplier";
  userName?: string;
  userEmail?: string;
}

export function SidebarV2({ role, userName, userEmail }: SidebarV2Props) {
  const pathname = usePathname();

  const groups =
    role === "admin" ? adminGroups :
    role === "seller" ? sellerGroups :
    supplierGroups;

  const roleLabel =
    role === "admin" ? "Admin Portal" :
    role === "seller" ? "Seller Portal" :
    "Supplier Portal";

  const initial = userName?.[0]?.toUpperCase() || "U";

  return (
    <aside
      className="w-60 flex flex-col min-h-screen flex-shrink-0"
      style={{ background: "var(--bg-sidebar)", borderRight: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{ background: "var(--green-500)" }}
        >
          V
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">Vrinandya</p>
          <p className="text-xs leading-tight" style={{ color: "var(--green-500)" }}>{roleLabel}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label}>
            <p
              className="text-xs font-semibold uppercase tracking-wider px-2 mb-1.5"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href ||
                  (item.href !== "/admin" && item.href !== "/seller" && item.href !== "/supplier" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 group",
                      isActive
                        ? "text-white"
                        : "text-white/50 hover:text-white/80"
                    )}
                    style={isActive ? {
                      background: "rgba(0, 198, 122, 0.15)",
                      color: "var(--green-400)",
                    } : {}}
                  >
                    <Icon
                      className="w-4 h-4 flex-shrink-0"
                      style={isActive ? { color: "var(--green-500)" } : {}}
                    />
                    <span className="flex-1">{item.label}</span>
                    {isActive && (
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: "var(--green-500)" }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2.5 px-2 mb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: "var(--green-600)" }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate leading-tight">{userName || "User"}</p>
            <p className="text-xs truncate leading-tight" style={{ color: "rgba(255,255,255,0.4)" }}>{userEmail}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 w-full px-2.5 py-2 rounded-lg text-sm transition-colors duration-150"
          style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.8)";
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

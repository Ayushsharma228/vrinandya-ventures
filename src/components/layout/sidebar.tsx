"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Bell,
  Settings,
  LogOut,
  Truck,
  Store,
  ListChecks,
  CheckSquare,
  Wallet,
  BadgeIndianRupee,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Listing Requests", href: "/admin/listings", icon: ListChecks },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Delivery", href: "/admin/delivery", icon: Truck },
  { label: "Wallet", href: "/admin/wallet", icon: Wallet },
  { label: "Remittance", href: "/admin/remittance", icon: BadgeIndianRupee },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
];

const sellerNav: NavItem[] = [
  { label: "Dashboard", href: "/seller", icon: LayoutDashboard },
  { label: "Product Catalog", href: "/seller/catalog", icon: Package },
  { label: "My Listings", href: "/seller/listings", icon: ListChecks },
  { label: "Orders", href: "/seller/orders", icon: ShoppingCart },
  { label: "Delivery", href: "/seller/delivery", icon: Truck },
  { label: "Wallet", href: "/seller/wallet", icon: Wallet },
  { label: "Shopify Store", href: "/seller/shopify", icon: Store },
  { label: "Notifications", href: "/seller/notifications", icon: Bell },
  { label: "Settings", href: "/seller/settings", icon: Settings },
];

const supplierNav: NavItem[] = [
  { label: "Dashboard", href: "/supplier", icon: LayoutDashboard },
  { label: "My Products", href: "/supplier/products", icon: Package },
  { label: "Add Product", href: "/supplier/products/new", icon: CheckSquare },
  { label: "Notifications", href: "/supplier/notifications", icon: Bell },
  { label: "Settings", href: "/supplier/settings", icon: Settings },
];

interface SidebarProps {
  role: "admin" | "seller" | "supplier";
  userName?: string;
  userEmail?: string;
}

export function Sidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();

  const navItems =
    role === "admin" ? adminNav : role === "seller" ? sellerNav : supplierNav;

  const roleLabel =
    role === "admin" ? "Admin" : role === "seller" ? "Seller" : "Supplier";

  return (
    <aside className="w-64 bg-slate-900 min-h-screen flex flex-col border-r border-slate-700">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">Vrinandya</h1>
        <p className="text-xs text-purple-400 font-medium mt-0.5">{roleLabel} Portal</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-purple-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold">
            {userName?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-slate-400 truncate">{userEmail}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

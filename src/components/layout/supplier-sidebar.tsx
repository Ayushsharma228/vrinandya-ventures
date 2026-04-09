"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Plus, List, ShoppingCart, Truck, Wallet } from "lucide-react";

const navItems = [
  { label: "List Product", href: "/supplier/products/new", icon: Plus },
  { label: "My Products", href: "/supplier/products", icon: List },
  { label: "Orders", href: "/supplier/orders", icon: ShoppingCart },
  { label: "Shipping", href: "/supplier/shipping", icon: Truck },
  { label: "Wallet", href: "/supplier/wallet", icon: Wallet },
];

interface SupplierSidebarProps {
  userName?: string;
  userEmail?: string;
}

export function SupplierSidebar({ userName, userEmail }: SupplierSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white min-h-screen flex flex-col border-r border-gray-100">
      {/* Title */}
      <div className="px-5 py-5 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-800">Supplier Dashboard</h2>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/supplier/products/new" && item.href !== "/supplier/products" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-blue-600" : "text-gray-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {userName?.[0]?.toUpperCase() || "S"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
            <p className="text-xs text-gray-400">Supplier Account</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

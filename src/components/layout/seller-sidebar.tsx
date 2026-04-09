"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, ShoppingCart, Truck, Wallet, BarChart2, RefreshCw, Plus, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

const navItems = [
  { label: "Home",            href: "/seller",          icon: Home },
  { label: "Manage Orders",   href: "/seller/orders",   icon: ShoppingCart },
  { label: "Manage Delivery", href: "/seller/deliveries", icon: Truck },
  { label: "Wallet",          href: "/seller/wallet",   icon: Wallet },
  { label: "Analytics",       href: "/seller/analytics",icon: BarChart2 },
];

interface ShopifyStore {
  id: string;
  storeName: string;
  storeUrl: string;
  createdAt: string;
}

export function SellerSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [store, setStore] = useState<ShopifyStore | null>(null);

  useEffect(() => {
    fetch("/api/seller/shopify/store")
      .then((r) => r.json())
      .then((d) => setStore(d.store || null))
      .catch(() => {});
  }, []);

  return (
    <aside className="w-56 bg-white min-h-screen flex flex-col border-r border-gray-100">
      <div className="px-5 py-5 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-800">Seller Dashboard</h2>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/seller" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-blue-600" : "text-gray-400")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Connected Stores */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500">Connected Stores</span>
          <div className="flex items-center gap-1">
            <button onClick={() => window.location.reload()} className="p-1 text-gray-400 hover:text-gray-600">
              <RefreshCw className="w-3 h-3" />
            </button>
            <Link href="/seller/shopify" className="p-1 text-gray-400 hover:text-gray-600">
              <Plus className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {store ? (
          <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700 truncate max-w-[100px]">
                {store.storeUrl.replace(".myshopify.com", "")}...
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs bg-green-100 text-green-600 font-semibold px-1.5 py-0.5 rounded">Active</span>
                <button className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400">Connected {new Date(store.createdAt).toLocaleDateString("en-IN")}</p>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
              Active: {store.storeUrl} ✓
            </p>
          </div>
        ) : (
          <Link href="/seller/shopify"
            className="block text-center text-xs text-blue-500 hover:text-blue-700 py-2 border border-dashed border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
            + Connect Shopify Store
          </Link>
        )}
      </div>
    </aside>
  );
}

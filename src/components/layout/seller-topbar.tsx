"use client";

import { signOut, useSession } from "next-auth/react";
import { Bell, Settings, LogOut } from "lucide-react";

export function SellerTopbar() {
  const { data: session } = useSession();
  const plan = session?.user?.plan === "MARKETPLACE" ? "Marketplace" : "Dropshipping";

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">VV</span>
        </div>
        <span className="font-bold text-gray-800 text-sm">Seller Dashboard</span>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
          Plan: {plan}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <Bell className="w-4 h-4" />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
          <Settings className="w-4 h-4" />
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors ml-1"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </header>
  );
}

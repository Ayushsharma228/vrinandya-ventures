"use client";

import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";

interface TopbarProps {
  title: string;
}

export function Topbar({ title }: TopbarProps) {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-600 rounded-full" />
        </button>
        <div className="text-sm text-gray-600">
          Welcome, <span className="font-medium text-gray-800">{session?.user?.name}</span>
        </div>
      </div>
    </header>
  );
}

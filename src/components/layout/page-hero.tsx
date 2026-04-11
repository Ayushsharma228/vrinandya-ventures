"use client";

import { Search } from "lucide-react";
import { ReactNode } from "react";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  searchValue?: string;
  searchPlaceholder?: string;
  onSearchChange?: (v: string) => void;
  onSearchSubmit?: () => void;
  actions?: ReactNode;
  filters?: ReactNode;
  cards?: ReactNode;
}

export function PageHero({
  title,
  subtitle,
  searchValue,
  searchPlaceholder = "Search...",
  onSearchChange,
  onSearchSubmit,
  actions,
  filters,
  cards,
}: PageHeroProps) {
  return (
    <div
      className="relative overflow-hidden px-8 pt-7"
      style={{
        background: "linear-gradient(135deg, #0D1117 0%, #0D2818 60%, #0a1f12 100%)",
        paddingBottom: cards ? "0" : "2rem",
      }}
    >
      {/* BG decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #00C67A, transparent)" }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #3B82F6, transparent)" }}
        />
      </div>

      <div className="relative">
        {/* Title row */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        {/* Search + filters row */}
        <div className="flex items-center gap-3">
          {onSearchChange && (
            <form
              onSubmit={(e) => { e.preventDefault(); onSearchSubmit?.(); }}
              className="flex-1 max-w-md relative"
            >
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "rgba(255,255,255,0.35)" }}
              />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 rounded-xl outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
                onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(0,198,122,0.5)"; }}
                onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.12)"; }}
              />
            </form>
          )}
          {filters && <div className="flex items-center gap-2">{filters}</div>}
        </div>

        {/* Stat cards inside gradient */}
        {cards && (
          <div className="mt-6 pb-6">
            {cards}
          </div>
        )}
      </div>
    </div>
  );
}

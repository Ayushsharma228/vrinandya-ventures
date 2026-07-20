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
      className="px-4 md:px-8 pt-6 md:pt-7"
      style={{
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
        paddingBottom: cards ? "0" : "1.5rem",
      }}
    >
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>

      {/* Search + filters row */}
      {(onSearchChange || filters) && (
        <div className="flex items-center gap-3 mb-4">
          {onSearchChange && (
            <form
              onSubmit={(e) => { e.preventDefault(); onSearchSubmit?.(); }}
              className="flex-1 max-w-sm relative"
            >
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl outline-none transition-all"
                style={{
                  background: "var(--bg-muted)",
                  border: "1.5px solid var(--border)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => { e.currentTarget.style.border = "1.5px solid var(--accent)"; e.currentTarget.style.background = "white"; }}
                onBlur={(e) => { e.currentTarget.style.border = "1.5px solid var(--border)"; e.currentTarget.style.background = "var(--bg-muted)"; }}
              />
            </form>
          )}
          {filters && <div className="flex items-center gap-2 flex-wrap">{filters}</div>}
        </div>
      )}

      {/* Stat cards */}
      {cards && (
        <div className="mt-2 pb-6">
          {cards}
        </div>
      )}
    </div>
  );
}

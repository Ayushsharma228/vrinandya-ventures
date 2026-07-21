"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Search, Package, ArrowLeft } from "lucide-react";
import { C } from "@/components/landing/constants";

type Product = {
  id:           string;
  name:         string;
  image:        string | null;
  sellingPrice: number;
  supplierCost: number;
  category:     string | null;
};

const BADGES = [
  { label: "🔥 Trending",      color: C.amber  },
  { label: "⚡ Fast Dispatch", color: C.indigo },
  { label: "✅ Low RTO",       color: C.green  },
];

function ProductCard({ p, index }: { p: Product; index: number }) {
  const badge  = BADGES[index % 3];
  const margin = p.sellingPrice - p.supplierCost;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <div
        className="w-full h-48 flex items-center justify-center overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", borderBottom: `1px solid ${C.border}` }}
      >
        {p.image ? (
          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl">📦</span>
        )}
      </div>

      <div className="p-5">
        <span
          className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-3"
          style={{ background: `${badge.color}20`, color: badge.color }}
        >
          {badge.label}
        </span>

        {p.category && (
          <p className="text-xs mb-1.5" style={{ color: C.muted }}>
            {p.category}
          </p>
        )}

        <h3 className="text-sm font-bold mb-4 leading-snug line-clamp-2" style={{ color: C.heading }}>
          {p.name}
        </h3>

        <div className="space-y-1.5 text-xs" style={{ color: C.body }}>
          <div className="flex justify-between">
            <span>Selling price</span>
            <span style={{ color: C.heading }}>₹{p.sellingPrice.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between">
            <span>Supplier cost</span>
            <span style={{ color: C.heading }}>₹{p.supplierCost.toLocaleString("en-IN")}</span>
          </div>
          <div
            className="flex justify-between pt-2 border-t font-bold text-sm"
            style={{ borderColor: C.border }}
          >
            <span style={{ color: C.green }}>Your margin</span>
            <span style={{ color: C.green }}>₹{margin.toLocaleString("en-IN")}/order</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CataloguePage() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    fetch("/api/catalogue?limit=0")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products ?? []);
        setCategories(data.categories ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch   = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !activeCategory || p.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, activeCategory]);

  return (
    <div className="min-h-screen" style={{ background: C.navy, color: C.heading }}>
      {/* Header */}
      <div
        className="sticky top-0 z-30 border-b"
        style={{ background: `${C.navy}f0`, backdropFilter: "blur(12px)", borderColor: C.border }}
      >
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: C.body }}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="flex-1" />
          <p className="text-xs font-black uppercase tracking-widest" style={{ color: C.gold }}>
            Full Catalogue
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-10">
          <h1
            className="text-4xl md:text-5xl font-black mb-3"
            style={{ letterSpacing: "-0.025em", fontFamily: "var(--font-space)" }}
          >
            Product Catalogue
          </h1>
          <p style={{ color: C.body }}>
            {loading ? "Loading…" : `${products.length} products from verified suppliers`}
          </p>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: C.muted }}
            />
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border outline-none focus:ring-2"
              style={{
                background: C.card,
                borderColor: C.border,
                color: C.heading,
                "--tw-ring-color": C.indigo,
              } as React.CSSProperties}
            />
          </div>

          {/* Category chips */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory("")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={
                  activeCategory === ""
                    ? { background: C.indigo, color: "#fff" }
                    : { background: C.card, color: C.body, border: `1px solid ${C.border}` }
                }
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat === activeCategory ? "" : cat)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={
                    activeCategory === cat
                      ? { background: C.indigo, color: "#fff" }
                      : { background: C.card, color: C.body, border: `1px solid ${C.border}` }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl animate-pulse"
                style={{ background: C.card, height: 320, border: `1px solid ${C.border}` }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 flex flex-col items-center gap-3">
            <Package className="w-12 h-12" style={{ color: C.border }} />
            <p className="font-semibold" style={{ color: C.body }}>
              {search || activeCategory ? "No products match your filters" : "No products yet"}
            </p>
            {(search || activeCategory) && (
              <button
                onClick={() => { setSearch(""); setActiveCategory(""); }}
                className="text-sm underline"
                style={{ color: C.indigo }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} p={p} index={i} />
            ))}
          </div>
        )}

        {/* CTA */}
        {!loading && (
          <div
            className="mt-16 rounded-2xl px-8 py-10 text-center"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <h2 className="text-2xl font-black mb-2" style={{ fontFamily: "var(--font-space)" }}>
              Want to sell these products?
            </h2>
            <p className="mb-6 text-sm" style={{ color: C.body }}>
              Apply to join Axiqen and get full access to all products with supplier pricing.
            </p>
            <Link
              href="/#apply"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-black text-sm transition-all hover:opacity-90"
              style={{ background: C.gold, color: C.navy }}
            >
              Apply Now — Free →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

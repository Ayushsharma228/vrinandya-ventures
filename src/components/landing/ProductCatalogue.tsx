"use client";
import { useEffect, useState } from "react";
import { C } from "./constants";
import { useInView } from "./useInView";

const BADGES = [
  { label: "🔥 Trending",      color: C.amber  },
  { label: "⚡ Fast Dispatch", color: C.indigo },
  { label: "✅ Low RTO",       color: C.green  },
];

const FALLBACK = [
  { id: "1", name: "Stainless Steel Water Bottle 1L",    image: null, sellingPrice: 1299, supplierCost: 420 },
  { id: "2", name: "Portable Neck Fan USB Rechargeable", image: null, sellingPrice: 999,  supplierCost: 310 },
  { id: "3", name: "Acupressure Foot Mat & Pillow Set",  image: null, sellingPrice: 1499, supplierCost: 520 },
  { id: "4", name: "LED Strip Lights 5m Smart RGB",      image: null, sellingPrice: 799,  supplierCost: 240 },
  { id: "5", name: "Bamboo Wooden Watch Unisex",         image: null, sellingPrice: 1799, supplierCost: 580 },
  { id: "6", name: "Car Dashboard Phone Holder 360°",   image: null, sellingPrice: 649,  supplierCost: 195 },
];

type CatalogueProduct = {
  id:           string;
  name:         string;
  image:        string | null;
  sellingPrice: number;
  supplierCost: number;
  category?:    string | null;
};

function ProductCard({
  p,
  locked,
  badgeIndex,
}: {
  p: CatalogueProduct;
  locked: boolean;
  badgeIndex: number;
}) {
  const badge  = BADGES[badgeIndex % 3];
  const margin = p.sellingPrice - p.supplierCost;

  return (
    <div
      className="rounded-2xl overflow-hidden relative transition-all duration-300 hover:translate-y-[-2px]"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      {/* Product image */}
      <div
        className="w-full h-44 flex items-center justify-center overflow-hidden"
        style={{ background: "rgba(255,255,255,0.03)", borderBottom: `1px solid ${C.border}` }}
      >
        {p.image ? (
          <img
            src={p.image}
            alt={p.name}
            className="w-full h-full object-cover"
          />
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

      {locked && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 md:hidden"
          style={{ background: `${C.navy}cc`, backdropFilter: "blur(4px)" }}
        >
          <span className="text-2xl">🔒</span>
          <p className="text-xs font-bold text-center px-4" style={{ color: C.heading }}>
            500+ more products inside
          </p>
        </div>
      )}
    </div>
  );
}

export function ProductCatalogue() {
  const { ref, inView } = useInView();
  const [products, setProducts] = useState<CatalogueProduct[]>(FALLBACK);

  useEffect(() => {
    fetch("/api/catalogue")
      .then((r) => r.json())
      .then((data) => {
        if (data.products?.length > 0) setProducts(data.products);
      })
      .catch(() => {});
  }, []);

  return (
    <section
      id="products"
      className="py-24 px-6"
      style={{ background: C.navy }}
      ref={ref}
    >
      <div
        className="max-w-[1200px] mx-auto transition-all duration-700"
        style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)" }}
      >
        <div className="text-center mb-14">
          <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: C.gold }}>
            Product Catalogue
          </p>
          <h2
            className="text-4xl md:text-5xl font-black mb-4"
            style={{ color: C.heading, letterSpacing: "-0.025em", fontFamily: "var(--font-space)" }}
          >
            Products already winning in India
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: C.body }}>
            Hand-picked from verified suppliers. Real margins, updated weekly.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-12">
          {products.map((p, i) => (
            <ProductCard key={p.id} p={p} locked={i >= 3} badgeIndex={i} />
          ))}
        </div>

        <div className="text-center">
          <a
            href="#apply"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-black transition-all hover:opacity-90 active:scale-95"
            style={{ background: C.gold, color: C.navy, borderRadius: 8 }}
          >
            Browse the full catalogue →
          </a>
          <p className="mt-3 text-xs" style={{ color: C.muted }}>
            Full catalogue unlocked after applying — free, no commitment.
          </p>
        </div>
      </div>
    </section>
  );
}

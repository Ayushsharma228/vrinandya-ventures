"use client";
import { C } from "./constants";
import { useInView } from "./useInView";

/* TODO: Replace with real product images and data from your catalog */
const PRODUCTS = [
  {
    name: "Stainless Steel Water Bottle 1L",
    image: null, // TODO: replace with real image path
    sellingPrice: 1299,
    supplierCost: 420,
    badge: { label: "🔥 Trending", color: C.amber },
  },
  {
    name: "Portable Neck Fan USB Rechargeable",
    image: null,
    sellingPrice: 999,
    supplierCost: 310,
    badge: { label: "⚡ Fast Dispatch", color: C.indigo },
  },
  {
    name: "Acupressure Foot Mat & Pillow Set",
    image: null,
    sellingPrice: 1499,
    supplierCost: 520,
    badge: { label: "✅ Low RTO", color: C.green },
  },
  {
    name: "LED Strip Lights 5m Smart RGB",
    image: null,
    sellingPrice: 799,
    supplierCost: 240,
    badge: { label: "🔥 Trending", color: C.amber },
  },
  {
    name: "Bamboo Wooden Watch Unisex",
    image: null,
    sellingPrice: 1799,
    supplierCost: 580,
    badge: { label: "⚡ Fast Dispatch", color: C.indigo },
  },
  {
    name: "Car Dashboard Phone Holder 360°",
    image: null,
    sellingPrice: 649,
    supplierCost: 195,
    badge: { label: "✅ Low RTO", color: C.green },
  },
];

function ProductCard({ p, locked }: { p: typeof PRODUCTS[0]; locked: boolean }) {
  const margin = p.sellingPrice - p.supplierCost;

  return (
    <div
      className="rounded-2xl overflow-hidden relative transition-all duration-300 hover:translate-y-[-2px]"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      {/* Product image */}
      <div
        className="w-full h-44 flex items-center justify-center text-4xl"
        style={{ background: "rgba(255,255,255,0.03)", borderBottom: `1px solid ${C.border}` }}
      >
        {/* TODO: replace with <Image src={p.image} fill alt={p.name} /> */}
        📦
      </div>

      <div className="p-5">
        {/* Badge */}
        <span
          className="inline-block text-xs font-bold px-2.5 py-1 rounded-full mb-3"
          style={{ background: `${p.badge.color}20`, color: p.badge.color }}
        >
          {p.badge.label}
        </span>

        <h3 className="text-sm font-bold mb-4 leading-snug" style={{ color: C.heading }}>
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

      {/* Lock overlay on mobile for cards 4-6 */}
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
          {PRODUCTS.map((p, i) => (
            <ProductCard key={p.name} p={p} locked={i >= 3} />
          ))}
        </div>

        {/* CTA — catalogue is gated, drives to apply form */}
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

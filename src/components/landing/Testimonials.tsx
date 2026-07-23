"use client";
import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { C } from "./constants";
import { useInView } from "./useInView";

const TESTIMONIALS = [
  {
    initials: "AK",
    name: "Alfaiz Khan",
    store: "thezolfcart.store",
    city: "Panipat",
    niche: "Electronics & Gadgets",
    quote: "Launched my HD Camera store, ran Meta ads, and did ₹89,682 in just 13 days — 120 orders, 19.45x ROAS on my main campaign. I spent ₹3,861 on ads and got 94 purchases. The fulfilment just ran on its own, I didn't touch a single order manually.",
    metrics: [
      { label: "Revenue", value: "₹89,682", sub: "in 13 days" },
      { label: "Orders", value: "120", sub: "fulfilled" },
      { label: "ROAS", value: "19.45x", sub: "on Meta Ads" },
      { label: "Ad Spend", value: "₹3,861", sub: "for 94 purchases" },
    ],
    images: [
      { src: "/testimonials/shopify-thezolfcart.png.png", alt: "Thezolfcart Shopify Dashboard – ₹89,682 revenue, 120 orders" },
      { src: "/testimonials/meta-thezolfcart.png.png", alt: "Thezolfcart Meta Ads – 19.45x ROAS" },
    ],
    color: C.amber,
  },
  {
    initials: "AM",
    name: "Ajay M.",
    images: undefined,
    store: null,
    city: "Surat",
    niche: "Home & Kitchen",
    quote: "340 orders in month 2. ₹1.2L payout, on time, every Monday. The account manager sorted an RTO cluster in 24 hours — no drama. This is what a real dropshipping backend looks like.",
    metrics: [
      { label: "Orders", value: "340", sub: "in month 2" },
      { label: "Payout", value: "₹1.2L", sub: "on time" },
      { label: "RTO Fix", value: "24h", sub: "resolution" },
      { label: "Effort", value: "Zero", sub: "manual work" },
    ],
    color: C.indigo,
  },
  {
    initials: "PR",
    name: "Priya R.",
    images: undefined,
    store: null,
    city: "Pune",
    niche: "Beauty & Skincare",
    quote: "I was manually forwarding orders on WhatsApp before this. Now everything's automatic and I just check the dashboard in the morning. Went from 0 to 180 orders a month in 45 days.",
    metrics: [
      { label: "Orders", value: "180/mo", sub: "in 45 days" },
      { label: "Started", value: "0", sub: "from scratch" },
      { label: "Time Saved", value: "4h/day", sub: "no manual work" },
      { label: "Dashboard", value: "1 check", sub: "every morning" },
    ],
    color: C.green,
  },
];

export function Testimonials() {
  const { ref, inView } = useInView();
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  const goTo = useCallback((idx: number) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setActive(idx);
      setAnimating(false);
    }, 250);
  }, [animating]);

  const next = useCallback(() => goTo((active + 1) % TESTIMONIALS.length), [active, goTo]);
  const prev = useCallback(() => goTo((active - 1 + TESTIMONIALS.length) % TESTIMONIALS.length), [active, goTo]);

  // Auto-advance every 5s
  useEffect(() => {
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [next]);

  const t = TESTIMONIALS[active];

  return (
    <section className="py-24 px-6" style={{ background: C.card }} ref={ref}>
      <div
        className="max-w-[900px] mx-auto transition-all duration-700"
        style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)" }}
      >
        {/* Heading */}
        <div className="text-center mb-14">
          <h2
            className="text-4xl md:text-5xl font-black mb-4"
            style={{ color: C.heading, letterSpacing: "-0.025em", fontFamily: "var(--font-space)" }}
          >
            Real sellers. Real numbers.
          </h2>
          <p className="text-base" style={{ color: C.muted }}>
            Not projections. Not estimates. Actual dashboards.
          </p>
        </div>

        {/* Slide card */}
        <div
          className="rounded-3xl p-8 md:p-10 transition-all duration-250"
          style={{
            background: C.navy,
            border: `1px solid ${t.color}40`,
            opacity: animating ? 0 : 1,
            transform: animating ? "scale(0.98)" : "scale(1)",
          }}
        >
          {/* Stars */}
          <div className="flex gap-1 mb-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} style={{ color: C.gold, fontSize: 18 }}>★</span>
            ))}
          </div>

          {/* Quote */}
          <p className="text-lg md:text-xl font-semibold leading-relaxed mb-8" style={{ color: C.heading }}>
            &ldquo;{t.quote}&rdquo;
          </p>

          {/* Metric tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {t.metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-2xl px-4 py-3 text-center"
                style={{ background: `${t.color}12`, border: `1px solid ${t.color}30` }}
              >
                <p className="text-xl font-black" style={{ color: t.color }}>{m.value}</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: C.heading }}>{m.label}</p>
                <p className="text-xs mt-0.5" style={{ color: C.muted }}>{m.sub}</p>
              </div>
            ))}
          </div>

          {/* Dashboard screenshots (Alfaiz Khan only) */}
          {t.images && t.images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              {t.images.map((img) => (
                <div
                  key={img.src}
                  className="relative group rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${t.color}25` }}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    width={600}
                    height={340}
                    className="w-full h-auto object-cover block"
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  {/* View overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: "rgba(0,0,0,0.45)" }}
                  >
                    <button
                      onClick={() => setLightbox(img)}
                      className="px-4 py-2 rounded-full text-sm font-bold transition-transform hover:scale-105"
                      style={{ background: t.color, color: "#0a0f1e" }}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lightbox */}
          {lightbox && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.85)" }}
              onClick={() => setLightbox(null)}
            >
              <div
                className="relative max-w-5xl w-full rounded-2xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={lightbox.src}
                  alt={lightbox.alt}
                  width={1200}
                  height={680}
                  className="w-full h-auto block"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                />
                <button
                  onClick={() => setLightbox(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                  style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Author + nav */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0"
                style={{ background: `${t.color}25`, color: t.color }}
              >
                {t.initials}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: C.heading }}>
                  {t.name}{t.store ? ` · ${t.store}` : ""}
                </p>
                <p className="text-xs" style={{ color: C.muted }}>{t.niche} · {t.city}</p>
              </div>
            </div>

            {/* Arrows + dots */}
            <div className="flex items-center gap-3">
              <button
                onClick={prev}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: `${t.color}18`, color: t.color, border: `1px solid ${t.color}30` }}
              >
                ‹
              </button>
              <div className="flex gap-1.5">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === active ? 20 : 8,
                      height: 8,
                      background: i === active ? t.color : `${t.color}30`,
                    }}
                  />
                ))}
              </div>
              <button
                onClick={next}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: `${t.color}18`, color: t.color, border: `1px solid ${t.color}30` }}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

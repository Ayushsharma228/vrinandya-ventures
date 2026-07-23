"use client";
import { C, WA_LINK } from "./constants";
import { useInView } from "./useInView";

const TESTIMONIALS = [
  {
    initials: "AM",
    name: "Ajay M.",
    city: "Surat",
    niche: "Home & Kitchen",
    quote: "340 orders in month 2. ₹1.2L payout, on time, every Monday. The account manager sorted an RTO cluster in 24 hours — no drama.",
    metric: "340 orders · ₹1.2L payout",
    color: C.indigo,
  },
  {
    initials: "PR",
    name: "Priya R.",
    city: "Pune",
    niche: "Beauty & Skincare",
    quote: "I was manually forwarding orders on WhatsApp before this. Now everything's automatic and I just check the dashboard in the morning.",
    metric: "0 → 180 orders/month in 45 days",
    color: C.green,
  },
  {
    initials: "AK",
    name: "Alfaiz Khan",
    city: "Panipat",
    niche: "Electronics & Gadgets",
    quote: "19.45x ROAS on my first HD Camera campaign. ₹89,682 revenue in 13 days, 120 orders — and I spent under ₹5,100 on ads total. Never seen numbers like this before.",
    metric: "₹89,682 in 13 days · 19.45x ROAS",
    color: C.amber,
  },
];

function TestimonialCard({ t }: { t: typeof TESTIMONIALS[0] }) {
  return (
    <div
      className="rounded-2xl p-7 flex flex-col gap-4 h-full transition-all duration-300 hover:translate-y-[-2px]"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      {/* Stars */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{ color: C.gold, fontSize: 14 }}>★</span>
        ))}
      </div>

      {/* Quote */}
      <p className="text-sm leading-relaxed flex-1" style={{ color: C.heading }}>
        &ldquo;{t.quote}&rdquo;
      </p>

      {/* Metric pill */}
      <span
        className="self-start text-xs font-black px-3 py-1.5 rounded-full"
        style={{ background: `${t.color}18`, color: t.color }}
      >
        {t.metric}
      </span>

      {/* Author */}
      <div className="flex items-center gap-3 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
        {/* TODO: replace with real <Image> */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
          style={{ background: `${t.color}20`, color: t.color }}
        >
          {t.initials}
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: C.heading }}>{t.name}, {t.city}</p>
          <p className="text-xs" style={{ color: C.muted }}>{t.niche}</p>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  const { ref, inView } = useInView();

  return (
    <section
      className="py-24 px-6"
      style={{ background: C.card }}
      ref={ref}
    >
      <div
        className="max-w-[1200px] mx-auto transition-all duration-700"
        style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)" }}
      >
        <div className="text-center mb-14">
          <h2
            className="text-4xl md:text-5xl font-black mb-4"
            style={{ color: C.heading, letterSpacing: "-0.025em", fontFamily: "var(--font-space)" }}
          >
            Sellers who stopped doing<br className="hidden md:block" /> everything themselves
          </h2>
        </div>

        {/* 3-column cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {TESTIMONIALS.map((t) => <TestimonialCard key={t.name} t={t} />)}
        </div>

        {/* Featured video card */}
        {/* TODO: replace video thumbnail + embed with real seller video */}
        <div
          className="rounded-2xl p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center"
          style={{ background: C.navy, border: `1px solid ${C.goldBorder}` }}
        >
          {/* Video thumbnail placeholder */}
          <div
            className="w-full md:w-72 h-44 rounded-xl flex items-center justify-center flex-shrink-0 relative cursor-pointer group"
            style={{ background: "rgba(212,175,55,0.06)", border: `1px solid ${C.goldBorder}` }}
          >
            {/* TODO: replace with <Image> of real seller thumbnail */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: C.gold }}
            >
              <span style={{ color: C.navy, fontSize: 20, marginLeft: 4 }}>▶</span>
            </div>
            <span
              className="absolute bottom-3 left-3 text-xs font-bold px-2 py-1 rounded"
              style={{ background: "rgba(0,0,0,0.6)", color: "white" }}
            >
              2:34 {/* TODO: real video duration */}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} style={{ color: C.gold, fontSize: 16 }}>★</span>
              ))}
            </div>
            <p className="text-xl font-bold leading-relaxed mb-5" style={{ color: C.heading }}>
              &ldquo;Launched my HD Camera store, ran Meta ads, and did ₹89,682 in just 13 days — 120 orders, 19.45x ROAS on my main campaign. I spent ₹3,861 on ads and got 94 purchases. The fulfilment just ran on its own, I didn&apos;t touch a single order manually.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black"
                style={{ background: C.goldDim, color: C.gold }}
              >
                AK
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: C.heading }}>Alfaiz Khan · thezolfcart.store</p>
                <p className="text-xs" style={{ color: C.muted }}>Electronics & Gadgets · Panipat</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

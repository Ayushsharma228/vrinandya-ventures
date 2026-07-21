"use client";
import { C } from "./constants";
import { useInView } from "./useInView";

const FEATURES = [
  {
    emoji: "🛒",
    title: "Auto-fulfilment, zero touch",
    desc: "Every Shopify order flows to the supplier automatically — no CSVs, no WhatsApp forwarding, no missed orders at 2 AM.",
    highlight: false,
  },
  {
    emoji: "📦",
    title: "Live tracking, dispatch to doorstep",
    desc: "Every shipment tracked in real time. Delivered, in-transit, or RTO — you always know exactly where your money is.",
    highlight: false,
  },
  {
    emoji: "💰",
    title: "Monday payouts, like clockwork",
    desc: "Your margin hits your bank account every Monday. No chasing, no \"processing\", no excuses.",
    highlight: false,
  },
  {
    emoji: "🧾",
    title: "Remittances you can actually read",
    desc: "Gross amount, supplier cost, fees, RTO deductions — every rupee itemised. If you can't explain your payout, we've failed.",
    highlight: false,
  },
  {
    emoji: "✅",
    title: "Verified suppliers only",
    desc: "Every supplier is vetted for dispatch speed, product quality, and pricing before they touch a single order of yours.",
    highlight: false,
  },
  {
    emoji: "🤝",
    title: "A human on WhatsApp",
    desc: "Stuck order? RTO dispute? Weird payout? Message your account manager and get an answer in hours, not tickets that die in a queue.",
    highlight: true, // differentiator — gets indigo border
  },
];

export function Features() {
  const { ref, inView } = useInView();

  return (
    <section
      id="features"
      className="py-24 px-6"
      style={{ background: C.navy }}
      ref={ref}
    >
      <div
        className="max-w-[1200px] mx-auto transition-all duration-700"
        style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)" }}
      >
        <div className="text-center mb-16">
          <h2
            className="text-4xl md:text-5xl font-black mb-4"
            style={{ color: C.heading, letterSpacing: "-0.025em", fontFamily: "var(--font-space)" }}
          >
            Automation does the work.<br className="hidden md:block" /> Our team watches it.
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: C.body }}>
            Most platforms give you a dashboard and disappear. Axiqen gives you the dashboard{" "}
            <em style={{ color: C.heading }}>and</em> the people behind it.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-7 transition-all duration-300 hover:translate-y-[-2px]"
              style={{
                background: C.card,
                border: f.highlight ? `1px solid ${C.indigoBorder}` : `1px solid ${C.border}`,
                boxShadow: f.highlight ? `0 0 24px rgba(124,111,240,0.08)` : "none",
              }}
            >
              {f.highlight && (
                <span
                  className="inline-block text-xs font-black px-2.5 py-1 rounded-full mb-4"
                  style={{ background: C.indigoDim, color: C.indigo }}
                >
                  ★ Our differentiator
                </span>
              )}
              <div className="text-3xl mb-5">{f.emoji}</div>
              <h3
                className="font-black text-base mb-3"
                style={{ color: f.highlight ? C.indigo : C.heading, fontFamily: "var(--font-space)" }}
              >
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: C.body }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

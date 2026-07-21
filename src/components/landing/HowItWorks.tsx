"use client";
import { C } from "./constants";
import { useInView } from "./useInView";

const STEPS = [
  {
    n: "01",
    title: "Apply & get on a call",
    desc: "Fill the form. Our team calls you, understands your budget, and builds your launch plan.",
    accent: "We come to you.",
  },
  {
    n: "02",
    title: "We set up your store",
    desc: "We connect Shopify, sync the app, and list your first products from the supplier catalog — done for you.",
    accent: "Not by you.",
  },
  {
    n: "03",
    title: "You run ads, orders flow in",
    desc: "Every COD order is auto-forwarded, packed, and shipped by our supplier network.",
    accent: "We handle the rest.",
  },
  {
    n: "04",
    title: "Get paid every Monday",
    desc: "Delivered orders convert to margin in your wallet. Payout hits your bank every Monday with a full breakdown.",
    accent: "Without chasing.",
  },
];

export function HowItWorks() {
  const { ref, inView } = useInView();

  return (
    <section
      id="how-it-works"
      className="py-24 px-6"
      style={{ background: C.card }}
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
            Live in 4 steps.
          </h2>
          <p className="text-base" style={{ color: C.body }}>
            Most sellers finish setup in under 48 hours.
          </p>
        </div>

        {/* Connector line on desktop */}
        <div className="relative">
          <div
            className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px"
            style={{ background: `linear-gradient(to right, transparent, ${C.gold}40, transparent)` }}
          />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="relative rounded-2xl p-7 transition-all duration-300 hover:translate-y-[-2px]"
                style={{ background: C.navy, border: `1px solid ${C.border}` }}
              >
                {/* Step number */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black mb-5"
                  style={{
                    background: i === 0 ? C.goldDim : C.indigoDim,
                    color: i === 0 ? C.gold : C.indigo,
                    border: `1px solid ${i === 0 ? C.goldBorder : C.indigoBorder}`,
                  }}
                >
                  {s.n}
                </div>

                <h3
                  className="font-black text-base mb-2.5 leading-snug"
                  style={{ color: C.heading, fontFamily: "var(--font-space)" }}
                >
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: C.body }}>
                  {s.desc}
                </p>
                <span
                  className="text-xs font-black uppercase tracking-wider"
                  style={{ color: C.gold }}
                >
                  {s.accent}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

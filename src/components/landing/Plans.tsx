"use client";
import { C } from "./constants";
import { useInView } from "./useInView";

const PLANS = [
  {
    name: "Launch",
    price: "₹25,000",
    tag: "one-time setup",
    desc: "For your first store. Everything you need to go from zero to first COD order.",
    popular: false,
    features: [
      "1 Shopify store connected",
      "Up to 200 orders/month",
      "Delhivery fulfilment",
      "Product catalog access",
      "Basic analytics dashboard",
      "Email + WhatsApp support",
    ],
  },
  {
    name: "Scale",
    price: "₹35,000",
    tag: "one-time setup",
    desc: "For sellers ready to grow. More stores, more products, a dedicated person watching your business.",
    popular: true,
    features: [
      "3 Shopify stores connected",
      "Unlimited orders",
      "Priority fulfilment queue",
      "Full analytics & ROAS tracking",
      "CRM access for your sales team",
      "Dedicated account manager",
    ],
  },
  {
    name: "Enterprise",
    price: "₹50,000",
    tag: "one-time setup",
    desc: "For teams running serious volume — custom integrations, multi-brand ops, priority everything.",
    popular: false,
    features: [
      "Unlimited Shopify stores",
      "Unlimited orders",
      "Express fulfilment SLA",
      "Advanced analytics suite",
      "Full CRM + sales team access",
      "Custom API integrations",
      "Priority support 7 days",
    ],
  },
];

export function Plans() {
  const { ref, inView } = useInView();

  return (
    <section
      id="plans"
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
            Plans that match your stage
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: C.body }}>
            One-time setup fee. No monthly charges. Platform fee applies per fulfilled order — discussed on your onboarding call.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="rounded-2xl p-8 flex flex-col relative transition-all duration-300 hover:translate-y-[-3px]"
              style={{
                background: plan.popular ? "linear-gradient(135deg, #1a2350 0%, #131A2E 100%)" : C.card,
                border: plan.popular ? `1px solid ${C.indigoBorder}` : `1px solid ${C.border}`,
                boxShadow: plan.popular ? "0 8px 40px rgba(124,111,240,0.15)" : "none",
              }}
            >
              {plan.popular && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-black"
                  style={{ background: C.gold, color: C.navy }}
                >
                  ★ Most Popular
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm font-bold mb-1" style={{ color: plan.popular ? C.indigo : C.body }}>
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-4xl font-black"
                    style={{ color: C.gold, fontFamily: "var(--font-space)" }}
                  >
                    {plan.price}
                  </span>
                  <span className="text-xs" style={{ color: C.muted }}>{plan.tag}</span>
                </div>
                <p className="text-sm mt-3 leading-relaxed" style={{ color: C.body }}>
                  {plan.desc}
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: C.heading }}>
                    <span style={{ color: C.green, flexShrink: 0, marginTop: 1 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="space-y-2">
                <a
                  href="#apply"
                  className="block text-center py-3.5 rounded-lg text-sm font-black transition-all hover:opacity-90 active:scale-95"
                  style={
                    plan.popular
                      ? { background: C.gold, color: C.navy, borderRadius: 8 }
                      : { background: "transparent", border: `1px solid ${C.borderStrong}`, color: C.heading, borderRadius: 8 }
                  }
                >
                  Apply for this plan
                </a>
                <p className="text-center text-xs" style={{ color: C.muted }}>
                  No monthly charges. Platform fee per fulfilled order.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

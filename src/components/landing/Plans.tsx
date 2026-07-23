"use client";
import { useState } from "react";
import { C, WA_LINK } from "./constants";
import { useInView } from "./useInView";

// ── Dropshipping plans ────────────────────────────────────────────────────────
const DS_PLANS = [
  {
    name: "Starter",
    price: "₹10,000",
    billing: "+ GST · One-Time",
    desc: "Perfect for first-time sellers",
    popular: false,
    enterprise: false,
    features: [
      "Premium Shopify Store",
      "1-Year Domain",
      "Payment Gateway Setup",
      "Product Import (Up to 100 Products)",
      "Winning Product Research",
      "Supplier Integration",
      "Order Dashboard Access",
      "Basic Training",
      "RTO Charges Applicable",
      "30 Days Support",
    ],
  },
  {
    name: "Growth",
    price: "₹25,000",
    billing: "+ GST · One-Time",
    desc: "Everything in Starter, plus:",
    popular: true,
    enterprise: false,
    features: [
      "AI Dashboard",
      "Meta Pixel Setup",
      "Premium Theme",
      "Product Optimization",
      "Conversion Optimization",
      "Supplier Management",
      "NDR Management",
      "0 RTO Management Charges for 12 Months",
      "Free Shipping Setup",
      "Priority Support",
      "Realtime Reports",
    ],
  },
  {
    name: "Scale",
    price: "₹50,000",
    billing: "+ GST · One-Time",
    desc: "Everything in Growth, plus:",
    popular: false,
    enterprise: false,
    features: [
      "Dedicated Account Manager",
      "Unlimited Product Import",
      "AI Commerce Dashboard",
      "Priority Operations",
      "Advanced Analytics",
      "Team Training",
      "Custom Branding",
      "Faster Turnaround",
      "Lifetime 0 RTO Management Charges",
      "Monthly Strategy Calls",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    billing: "Talk to us",
    desc: "For high-volume operations",
    popular: false,
    enterprise: true,
    features: [
      "Dedicated Operations Team",
      "AI Workforce",
      "Warehouse Integration",
      "ERP Integration",
      "Custom Automation",
      "API Integration",
      "Multi Store Management",
    ],
  },
];

// ── Marketplace plans ─────────────────────────────────────────────────────────
const MP_PLANS = [
  {
    name: "Starter",
    price: "₹5,000",
    billing: "+ GST / month",
    desc: "Perfect for sellers already selling online",
    popular: false,
    enterprise: false,
    features: [
      "Amazon Management",
      "Flipkart Management",
      "Meesho Management",
      "Product Listing (Up to 100)",
      "Inventory Updates",
      "Order Monitoring",
      "Basic Reports",
    ],
  },
  {
    name: "Growth",
    price: "₹10,000",
    billing: "+ GST / month",
    desc: "Everything in Starter, plus:",
    popular: true,
    enterprise: false,
    features: [
      "Catalog Optimization",
      "SEO Listings",
      "A+ Content Guidance",
      "Repricing Support",
      "Return Management",
      "NDR Management",
      "Priority Support",
      "Weekly Reports",
    ],
  },
  {
    name: "Scale",
    price: "₹20,000",
    billing: "+ GST / month",
    desc: "Everything in Growth, plus:",
    popular: false,
    enterprise: false,
    features: [
      "Dedicated Account Manager",
      "Unlimited Listings",
      "Brand Registry Support",
      "Listing Audit",
      "Performance Dashboard",
      "Competitor Analysis",
      "Buy Box Monitoring",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    billing: "Talk to us",
    desc: "Full-scale marketplace operations",
    popular: false,
    enterprise: true,
    features: [
      "Multi Marketplace Operations",
      "Dedicated Team",
      "AI Operations",
      "Finance Dashboard",
      "Supplier Dashboard",
      "Automation Engine",
    ],
  },
];

// ── Brand Building feature categories ────────────────────────────────────────
const BB_CATEGORIES = [
  {
    label: "Product Development",
    items: [
      "Product Research",
      "Market & Competitor Analysis",
      "Niche Validation",
      "Profitability Analysis",
      "Product Roadmap",
    ],
  },
  {
    label: "Supplier & Manufacturing",
    items: [
      "Manufacturer Sourcing",
      "Supplier Verification",
      "Price Negotiation",
      "MOQ Negotiation",
      "Quality Assurance",
      "Sample Coordination",
    ],
  },
  {
    label: "Brand Identity",
    items: [
      "Brand Naming",
      "Logo Design",
      "Brand Guidelines",
      "Color Palette",
      "Typography",
      "Brand Story",
      "Positioning Strategy",
    ],
  },
  {
    label: "Product Design",
    items: [
      "Packaging Design",
      "Label Design",
      "Box Design",
      "Compliance & Barcode Guidance",
      "Print-Ready Files",
    ],
  },
  {
    label: "Ecommerce Setup",
    items: [
      "Premium Shopify Store",
      "Domain Setup",
      "Payment Gateway",
      "Shipping Setup",
      "Product Upload",
      "Store Optimization",
    ],
  },
  {
    label: "Marketplace Launch",
    items: [
      "Amazon",
      "Flipkart",
      "Meesho",
      "Product Listings",
      "SEO Optimization",
      "A+ Content Guidance",
    ],
  },
  {
    label: "Marketing",
    items: [
      "Meta Ads Setup",
      "Google Ads Setup",
      "Social Media Setup",
      "Creative Strategy",
      "Content Calendar",
      "Launch Campaign",
    ],
  },
  {
    label: "Operations",
    items: [
      "Inventory Planning",
      "Order Management",
      "Supplier Coordination",
      "Dashboard Setup",
      "Reporting",
    ],
  },
  {
    label: "AI Commerce Stack",
    items: [
      "AXQEN Dashboard",
      "AI Sales Assistant",
      "AI Operations",
      "Real-time Analytics",
      "Automation Workflows",
    ],
  },
  {
    label: "Dedicated Team",
    items: [
      "Brand Strategist",
      "Graphic Designer",
      "Marketplace Specialist",
      "Shopify Developer",
      "Performance Marketer",
      "Operations Manager",
      "Account Manager",
    ],
  },
];

const BB_IDEAL = [
  "First-time founders",
  "D2C startups",
  "Businesses launching a new brand",
  "Manufacturers building a consumer brand",
  "Importers",
  "Private label businesses",
];

// ── Plan card component ───────────────────────────────────────────────────────
type Plan = {
  name: string;
  price: string;
  billing: string;
  desc: string;
  popular: boolean;
  enterprise: boolean;
  features: string[];
};

function PlanCard({ plan }: { plan: Plan }) {
  const onBlue = plan.popular; // text on blue card → white

  return (
    <div
      className="rounded-2xl p-7 flex flex-col relative transition-all duration-300 hover:translate-y-[-3px]"
      style={{
        background: plan.popular ? C.gold : C.card,
        border:     plan.popular ? "none" : `1px solid ${C.border}`,
        boxShadow:  plan.popular ? "0 8px 40px rgba(0,72,223,0.25)" : "none",
      }}
    >
      {plan.popular && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap"
          style={{ background: "#fff", color: C.gold }}
        >
          ★ Most Popular
        </div>
      )}

      <div className="mb-5">
        <p
          className="text-sm font-bold mb-2"
          style={{ color: onBlue ? "rgba(255,255,255,0.75)" : C.body }}
        >
          {plan.name}
        </p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span
            className="text-3xl font-black"
            style={{
              color: onBlue ? "#fff" : C.gold,
              fontFamily: "var(--font-space)",
            }}
          >
            {plan.price}
          </span>
          <span className="text-xs" style={{ color: onBlue ? "rgba(255,255,255,0.55)" : C.muted }}>
            {plan.billing}
          </span>
        </div>
        <p className="text-sm mt-2" style={{ color: onBlue ? "rgba(255,255,255,0.7)" : C.body }}>
          {plan.desc}
        </p>
      </div>

      <ul className="space-y-2.5 mb-7 flex-1">
        {plan.features.map((f) => {
          const isWarning = f.startsWith("RTO Charges Applicable");
          return (
            <li key={f} className="flex items-start gap-2 text-sm"
              style={{ color: onBlue ? "#fff" : isWarning ? "#EF4444" : C.heading }}>
              <span style={{ color: isWarning ? "#EF4444" : onBlue ? "rgba(255,255,255,0.8)" : C.green, flexShrink: 0, marginTop: 1 }}>
                {isWarning ? "!" : "✓"}
              </span>
              {f}
            </li>
          );
        })}
      </ul>

      <a
        href={plan.enterprise ? WA_LINK : "#apply"}
        target={plan.enterprise ? "_blank" : undefined}
        rel={plan.enterprise ? "noopener noreferrer" : undefined}
        className="block text-center py-3 rounded-lg text-sm font-black transition-all hover:opacity-90 active:scale-95"
        style={
          plan.popular
            ? { background: "#fff", color: C.gold }
            : plan.enterprise
            ? { background: C.goldDim, color: C.gold, border: `1px solid ${C.goldBorder}` }
            : { background: "transparent", border: `1px solid ${C.borderStrong}`, color: C.heading }
        }
      >
        {plan.enterprise ? "Talk to Us →" : "Apply for this Plan →"}
      </a>
    </div>
  );
}

// ── Tab button ────────────────────────────────────────────────────────────────
function Tab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
      style={{
        background: active ? C.gold : "transparent",
        color: active ? "#fff" : C.body,
        border: active ? "none" : `1px solid ${C.border}`,
      }}
    >
      {label}
    </button>
  );
}

// ── Main Plans component ──────────────────────────────────────────────────────
export function Plans() {
  const { ref, inView } = useInView();
  const [tab, setTab] = useState<"ds" | "mp" | "bb">("ds");

  return (
    <section
      id="plans"
      className="py-24 px-6"
      style={{ background: C.navy }}
      ref={ref}
    >
      <div
        className="max-w-[1200px] mx-auto transition-all duration-700"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "none" : "translateY(24px)",
        }}
      >
        {/* Header */}
        <div className="text-center mb-10">
          <h2
            className="text-4xl md:text-5xl font-black mb-4"
            style={{
              color: C.heading,
              letterSpacing: "-0.025em",
              fontFamily: "var(--font-space)",
            }}
          >
            Plans for every stage
          </h2>
          <p
            className="text-base max-w-xl mx-auto"
            style={{ color: C.body }}
          >
            All prices exclude GST. No hidden charges.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center gap-3 flex-wrap mb-12">
          <Tab
            label="Dropshipping"
            active={tab === "ds"}
            onClick={() => setTab("ds")}
          />
          <Tab
            label="Marketplace Management"
            active={tab === "mp"}
            onClick={() => setTab("mp")}
          />
          <Tab
            label="Brand Building"
            active={tab === "bb"}
            onClick={() => setTab("bb")}
          />
        </div>

        {/* Dropshipping */}
        {tab === "ds" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DS_PLANS.map((p) => (
              <PlanCard key={p.name} plan={p} />
            ))}
          </div>
        )}

        {/* Marketplace Management */}
        {tab === "mp" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MP_PLANS.map((p) => (
              <PlanCard key={p.name} plan={p} />
            ))}
          </div>
        )}

        {/* Brand Building */}
        {tab === "bb" && (
          <div className="space-y-8">
            {/* Hero pricing card */}
            <div
              className="rounded-2xl p-8 md:p-10 flex flex-col md:flex-row md:items-center gap-8"
              style={{
                background: C.card,
                border: `1px solid ${C.goldBorder}`,
              }}
            >
              <div className="flex-1">
                <span
                  className="inline-block text-xs font-black px-3 py-1 rounded-full mb-4"
                  style={{ background: C.goldDim, color: C.gold }}
                >
                  Fully Managed · End-to-End
                </span>
                <h3
                  className="text-3xl md:text-4xl font-black mb-2"
                  style={{
                    color: C.heading,
                    fontFamily: "var(--font-space)",
                  }}
                >
                  Brand Building
                </h3>
                <p
                  className="text-base mb-4"
                  style={{ color: C.body }}
                >
                  Launch your own brand from scratch — managed end-to-end by our expert team.
                </p>
                <div
                  className="flex flex-wrap gap-5 text-sm"
                  style={{ color: C.muted }}
                >
                  <span>⏱ Timeline: 30 – 120 Days</span>
                  <span>📦 Typical Projects: ₹1L – ₹10L+</span>
                </div>
              </div>

              <div className="flex-shrink-0 text-center md:text-right">
                <p
                  className="text-xs font-semibold uppercase tracking-wider mb-1"
                  style={{ color: C.muted }}
                >
                  Starting From
                </p>
                <p
                  className="text-5xl font-black mb-1"
                  style={{
                    color: C.gold,
                    fontFamily: "var(--font-space)",
                  }}
                >
                  ₹1,00,000
                </p>
                <p
                  className="text-xs mb-5"
                  style={{ color: C.muted }}
                >
                  + GST · Custom Pricing
                </p>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 rounded-lg text-sm font-black transition-all hover:opacity-90 active:scale-95"
                  style={{ background: C.gold, color: "#fff" }}
                >
                  Book a Brand Discovery Call →
                </a>
                <p
                  className="text-xs mt-3 max-w-xs"
                  style={{ color: C.muted }}
                >
                  Pricing customized to your category, scope, and launch requirements.
                </p>
              </div>
            </div>

            {/* What's included */}
            <div>
              <p
                className="text-xs font-black uppercase tracking-widest mb-6"
                style={{ color: C.muted }}
              >
                What&apos;s Included
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {BB_CATEGORIES.map((cat) => (
                  <div
                    key={cat.label}
                    className="rounded-xl p-5"
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                    }}
                  >
                    <p
                      className="text-sm font-black mb-3"
                      style={{ color: C.gold }}
                    >
                      {cat.label}
                    </p>
                    <ul className="space-y-1.5">
                      {cat.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2 text-sm"
                          style={{ color: C.body }}
                        >
                          <span
                            style={{ color: C.green, flexShrink: 0 }}
                          >
                            ✓
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Ideal for */}
            <div
              className="rounded-xl p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center"
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
              }}
            >
              <div className="flex-1">
                <p
                  className="text-sm font-black mb-3"
                  style={{ color: C.heading }}
                >
                  Ideal For
                </p>
                <div className="flex flex-wrap gap-2">
                  {BB_IDEAL.map((item) => (
                    <span
                      key={item}
                      className="text-xs px-3 py-1.5 rounded-full font-semibold"
                      style={{
                        background: C.goldDim,
                        color: C.gold,
                        border: `1px solid ${C.goldBorder}`,
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-block px-5 py-3 rounded-lg text-sm font-black transition-all hover:opacity-90"
                style={{ background: C.gold, color: C.navy }}
              >
                Get a Custom Quote →
              </a>
            </div>
          </div>
        )}

        {/* Footer note */}
        <p
          className="text-center text-xs mt-10"
          style={{ color: C.muted }}
        >
          All prices exclude GST · No monthly charges on one-time plans · Platform fee per fulfilled order applies to Dropshipping plans
        </p>
      </div>
    </section>
  );
}

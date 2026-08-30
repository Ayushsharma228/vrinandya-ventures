"use client";
import { useState } from "react";
import { C } from "./constants";
import { useInView } from "./useInView";

const CASES = [
  {
    seller:   "TheZolfKart",
    product:  "HD Security Camera",
    price:    "₹799",
    days:     31,
    period:   "July 2026",
    niche:    "Electronics & Gadgets",
    color:    C.amber,
    initials: "TZ",
    kpis: [
      { label: "Meta ROAS",        value: "20.81x",   highlight: true  },
      { label: "Shopify Orders",   value: "157"                        },
      { label: "Collected Revenue",value: "₹81,498"                   },
      { label: "Net Profit",       value: "₹13,119"                   },
      { label: "Ad Spend",         value: "₹5,720"                    },
      { label: "Delivery Rate",    value: "64.97%"                    },
    ],
    what: ["Product Selection", "Store Setup", "Product Page", "Ad Creative", "Meta Ads", "Fulfillment"],
    highlight: "₹81,498 collected from 102 delivered orders in 31 days — 20.81x ROAS on a ₹799 security camera.",
  },
  {
    seller:   "Hyperloop Global",
    product:  "Premium Detox Foot Patch",
    price:    "₹499",
    days:     37,
    period:   "Jun–Jul 2026",
    niche:    "Health & Wellness",
    color:    C.green,
    initials: "HG",
    kpis: [
      { label: "Meta ROAS",        value: "7.11x",    highlight: true  },
      { label: "Shopify Orders",   value: "121"                        },
      { label: "Collected Revenue",value: "₹44,910"                   },
      { label: "Net Profit",       value: "₹21,550"                   },
      { label: "Ad Spend",         value: "₹8,489"                    },
      { label: "Delivery Rate",    value: "74.38%"                    },
    ],
    what: ["Product Selection", "Store Setup", "Product Page", "Ad Creative", "Meta Ads", "Fulfillment"],
    highlight: "₹44,910 revenue, ₹21,550 net profit in 37 days — 74% delivery rate on a ₹499 health product.",
  },
  {
    seller:   "The BazarX",
    product:  "Premium Detox Foot Patch",
    price:    "₹599",
    days:     17,
    period:   "April 2026",
    niche:    "Health & Wellness",
    color:    C.indigo,
    initials: "BX",
    kpis: [
      { label: "Meta ROAS",        value: "9.58x",    highlight: true  },
      { label: "Shopify Orders",   value: "258"                        },
      { label: "Collected Revenue",value: "₹78,469"                   },
      { label: "Net Profit",       value: "₹40,699"                   },
      { label: "Ad Spend",         value: "₹16,134"                   },
      { label: "Delivery Rate",    value: "50.78%"                    },
    ],
    what: ["Product Selection", "Store Setup", "Product Page", "Ad Creative", "Meta Ads", "Fulfillment"],
    highlight: "258 orders, ₹78,469 revenue, ₹40,699 net profit — all in just 17 days flat.",
  },
];

export function CaseStudies() {
  const [active, setActive] = useState(0);
  const [ref, inView] = useInView();

  const cs = CASES[active];

  return (
    <section
      className="py-24 px-6"
      style={{ background: "#f8f9fb" }}
      ref={ref as React.RefObject<HTMLElement>}
    >
      <div
        className="max-w-6xl mx-auto"
        style={{
          opacity:    inView ? 1 : 0,
          transform:  inView ? "none" : "translateY(24px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        {/* Heading */}
        <div className="text-center mb-12">
          <span
            className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4"
            style={{ background: C.goldDim, color: C.gold }}
          >
            Real Results
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3" style={{ color: C.heading }}>
            Case Studies
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: C.body }}>
            Verified numbers from live AXQEN campaigns — no cherry-picked days, no inflated figures.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-1 justify-center flex-wrap">
          {CASES.map((c, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
              style={{
                background:   active === i ? c.color : C.card,
                color:        active === i ? "#fff"   : C.body,
                border:       `1.5px solid ${active === i ? c.color : C.border}`,
                boxShadow:    active === i ? `0 4px 14px ${c.color}33` : "none",
              }}
            >
              <span
                className="w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0"
                style={{ background: active === i ? "rgba(255,255,255,0.2)" : `${c.color}18`, color: active === i ? "#fff" : c.color }}
              >
                {c.initials}
              </span>
              {c.seller}
            </button>
          ))}
        </div>

        {/* Card */}
        <div
          key={active}
          className="rounded-2xl overflow-hidden"
          style={{ border: `1.5px solid ${C.border}`, background: "#fff", boxShadow: "0 4px 32px rgba(0,0,0,0.06)" }}
        >
          {/* Top bar */}
          <div className="px-6 pt-6 pb-5 flex flex-wrap items-start gap-4 justify-between" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0"
                style={{ background: cs.color }}
              >
                {cs.initials}
              </div>
              <div>
                <p className="text-lg font-extrabold" style={{ color: C.heading }}>{cs.seller}</p>
                <p className="text-sm" style={{ color: C.body }}>{cs.product} · {cs.price}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: `${cs.color}12`, color: cs.color }}>
                {cs.niche}
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: C.goldDim, color: C.gold }}>
                {cs.days}-Day Campaign · {cs.period}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 grid md:grid-cols-3 gap-6">
            {/* KPIs */}
            <div className="md:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: C.muted }}>Campaign Results</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {cs.kpis.map((k) => (
                  <div
                    key={k.label}
                    className="rounded-xl p-4"
                    style={{
                      background: k.highlight ? `${cs.color}10` : C.card,
                      border:     k.highlight ? `1.5px solid ${cs.color}30` : `1.5px solid transparent`,
                    }}
                  >
                    <p
                      className="text-2xl font-extrabold mb-0.5"
                      style={{ color: k.highlight ? cs.color : C.heading }}
                    >
                      {k.value}
                    </p>
                    <p className="text-xs" style={{ color: C.body }}>{k.label}</p>
                  </div>
                ))}
              </div>

              {/* Highlight quote */}
              <div className="mt-4 rounded-xl p-4" style={{ background: C.card }}>
                <p className="text-sm leading-relaxed font-medium" style={{ color: C.heading }}>
                  &ldquo;{cs.highlight}&rdquo;
                </p>
              </div>
            </div>

            {/* What AXQEN did */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: C.muted }}>What AXQEN Handled</p>
              <div className="flex flex-col gap-2">
                {cs.what.map((w) => (
                  <div key={w} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: C.greenDim }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke={C.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium" style={{ color: C.heading }}>{w}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl p-4" style={{ background: `${cs.color}08`, border: `1px solid ${cs.color}20` }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: cs.color }}>Seller continued</p>
                <p className="text-sm" style={{ color: C.body }}>
                  After Month 1 results, the seller requested continuation into Month 2.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <p className="text-center text-xs mt-6" style={{ color: C.muted }}>
          All figures verified from Shopify dashboards and Meta Ads Manager. Campaign data is independently auditable.
        </p>
      </div>
    </section>
  );
}

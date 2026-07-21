"use client";
import { useState } from "react";
import { C } from "./constants";
import { useInView } from "./useInView";

const FAQS = [
  {
    q: "What is COD dropshipping?",
    a: "You sell products online without buying or storing any inventory. When a customer orders on your store and opts for Cash on Delivery, the supplier packs and ships the product directly to them. You earn the difference between your selling price and the supplier's cost. Axiqen automates the entire chain — order routing to supplier, dispatch, tracking, RTO handling, and weekly payout — so you never have to touch a product or log into multiple dashboards.",
  },
  {
    q: "How is Axiqen different from other dropshipping platforms?",
    a: "Two things most platforms skip. First, we're done-for-you: our team physically sets up your Shopify store, connects the app, and lists your first products — you don't figure it out alone with a help article. Second, we're radically transparent: every weekly payout shows you the exact math — gross order value, supplier cost, shipping fee, RTO deductions — before the money reaches your bank. No black-box wallets, no surprise deductions.",
  },
  {
    q: "Do I need inventory or GST to start?",
    a: "No inventory, ever — that's the entire point. Suppliers hold stock and ship directly to your customers. You never buy upfront, so your risk is capped at your ad spend. For GST: you'll need it for compliant selling and to receive payouts to your business account. If you don't have one yet, our onboarding team will walk you through the registration process — it takes under a week and we'll guide every step.",
  },
  {
    q: "How and when do I get paid?",
    a: "Every successfully delivered order credits your margin to your Axiqen wallet within 48 hours of delivery confirmation. Every Monday, we batch the week's earnings and transfer them to your registered bank account with a line-by-line payout statement — so you can reconcile exactly: delivered orders × margin, minus any RTO deductions and platform fees. No chasing, no \"processing,\" no moving the date. Monday means Monday.",
  },
  {
    q: "What happens on an RTO (returned order)?",
    a: "Anyone who promises \"zero RTO\" is selling you a fantasy. COD naturally has return rates of 20–35% depending on niche and targeting. On Axiqen, every RTO shows in your dashboard the moment it's flagged, with the reverse shipping fee clearly stated (not hidden). Your account manager will actively help you cut your RTO rate — better ad targeting, address verification scripts, NDR follow-up calls — and you'll see the tactics working in your analytics week over week.",
  },
  {
    q: "How much money do I need to start?",
    a: "Realistically: your chosen setup plan (₹25K–₹50K one-time) plus ad spend. We recommend starting ads at ₹500–1,000/day so you can test and scale without burning through budget on untested products. Total starting capital: ₹35,000–₹65,000 is a sensible range. We'll build your launch plan around your actual budget on the onboarding call — and if we think your budget isn't enough to succeed, we'd rather tell you to wait and save up than take your money and watch you struggle.",
  },
  {
    q: "Can I connect my existing Shopify store?",
    a: "Yes — your existing store, products, and orders are completely untouched. Our team connects the Axiqen integration on your onboarding call (it takes under 5 minutes). From that point, new Shopify orders route automatically to our supplier network, and all your historical data stays exactly where it is. No need to start a new store, migrate anything, or pause your current operations during setup.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const { ref, inView } = useInView();

  return (
    <section
      id="faqs"
      className="py-24 px-6"
      style={{ background: C.card }}
      ref={ref}
    >
      <div
        className="max-w-3xl mx-auto transition-all duration-700"
        style={{ opacity: inView ? 1 : 0, transform: inView ? "none" : "translateY(24px)" }}
      >
        <div className="text-center mb-14">
          <h2
            className="text-4xl font-black mb-3"
            style={{ color: C.heading, letterSpacing: "-0.025em", fontFamily: "var(--font-space)" }}
          >
            Questions every smart seller asks
          </h2>
          <p className="text-sm" style={{ color: C.muted }}>
            Honest answers. No marketing copy.
          </p>
        </div>

        <div className="space-y-2">
          {FAQS.map((f, i) => (
            <div
              key={f.q}
              className="rounded-xl overflow-hidden transition-all duration-200"
              style={{
                background: open === i ? C.navy : "transparent",
                border: `1px solid ${open === i ? C.indigoBorder : C.border}`,
              }}
            >
              <button
                className="w-full flex items-center justify-between px-6 py-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span
                  className="text-sm font-bold pr-4"
                  style={{ color: open === i ? C.indigo : C.heading }}
                >
                  {f.q}
                </span>
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-lg font-light transition-transform duration-300"
                  style={{
                    color: C.indigo,
                    background: C.indigoDim,
                    transform: open === i ? "rotate(45deg)" : "none",
                  }}
                >
                  +
                </span>
              </button>

              {open === i && (
                <div
                  className="px-6 pb-6 text-sm leading-relaxed"
                  style={{ color: C.body, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}
                >
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

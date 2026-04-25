"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const FEATURES = [
  {
    title: "Centralise orders, products, and fulfilment",
    points: [
      "Track every order from placement to delivery in real time",
      "Connect your Shopify store and sync orders automatically",
      "Delhivery-powered dispatch with AWB generated in one click",
    ],
  },
  {
    title: "Manage your sellers and suppliers at scale",
    points: [
      "Onboard sellers and assign products from a single dashboard",
      "Monitor every seller's revenue, orders, and delivery performance",
      "Full supplier catalog management with margin visibility",
    ],
  },
  {
    title: "Track payouts and financials in real time",
    points: [
      "Weekly settlements calculated and recorded automatically",
      "Full remittance history for every seller on the platform",
      "Identify bottlenecks and act on data, not guesswork",
    ],
  },
];

const STEPS = [
  { label: "Connect", desc: "Link your Shopify store. Orders sync automatically — no manual entry." },
  { label: "List", desc: "Browse and push products from our curated catalog to your store." },
  { label: "Fulfil", desc: "We process and dispatch every order via Delhivery on your behalf." },
  { label: "Collect", desc: "Receive your weekly payout. No chasing, no delays." },
];

const FAQS = [
  { q: "How does fulfilment work?", a: "Once you confirm an order in your seller dashboard, our team creates the AWB via Delhivery and dispatches the shipment from our warehouse. You never touch inventory." },
  { q: "How often are payouts processed?", a: "Settlements are processed weekly. Your earnings are calculated after deducting fulfilment costs and transferred directly to your account." },
  { q: "What courier does Vrinandya use?", a: "We use Delhivery for all shipments — covering 18,000+ pin codes across India with real-time tracking for every order." },
  { q: "Can I connect my existing Shopify store?", a: "Yes. You can connect any Shopify store through your seller dashboard in under two minutes. Orders will start syncing immediately." },
  { q: "Is COD supported?", a: "Yes. We support both prepaid and cash-on-delivery orders across India." },
  { q: "Who manages the returns and NDR?", a: "Our platform tracks NDR and RTO orders automatically. You can view and action all return cases from your seller dashboard." },
];

const GRID_FEATURES = [
  "Shopify Integration", "Delhivery Dispatch", "Weekly Payouts",
  "Seller Dashboard", "Supplier Catalog", "Built-in CRM",
  "Real-Time Analytics", "NDR Management", "Role-Based Access",
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div style={{ background: "#070F1C", color: "white", fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? "rgba(7,15,28,0.9)" : "transparent",
          backdropFilter: scrolled ? "blur(24px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
              style={{ background: "#00C67A", color: "#070F1C" }}>V</div>
            <span className="font-semibold text-base tracking-tight">Vrinandya Ventures</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {["Features", "How It Works", "Pricing", "FAQs"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm transition-colors"
                style={{ color: "rgba(255,255,255,0.55)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "white")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
              >{l}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login"
              className="text-sm px-4 py-2 rounded-lg transition-colors"
              style={{ color: "rgba(255,255,255,0.6)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "white")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
            >Log in</Link>
            <Link href="/login"
              className="text-sm font-semibold px-5 py-2 rounded-lg transition-all"
              style={{ background: "#00C67A", color: "#070F1C" }}>
              Get started
            </Link>
          </div>

          <button className="md:hidden flex flex-col gap-1.5 p-1" onClick={() => setMenuOpen(p => !p)}>
            <span className="block w-5 h-px bg-white" />
            <span className="block w-5 h-px bg-white" />
            <span className="block w-3.5 h-px bg-white" />
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden px-6 pb-6 pt-2 space-y-4"
            style={{ background: "rgba(7,15,28,0.97)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {["Features", "How It Works", "Pricing", "FAQs"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                onClick={() => setMenuOpen(false)}
                className="block text-sm py-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>{l}</a>
            ))}
            <Link href="/login" onClick={() => setMenuOpen(false)}
              className="block text-center text-sm font-semibold px-5 py-3 rounded-lg mt-2"
              style={{ background: "#00C67A", color: "#070F1C" }}>
              Get started
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-36 pb-28 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-64"
          style={{ background: "linear-gradient(180deg,transparent,rgba(0,198,122,0.25),transparent)" }} />
        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse,rgba(0,198,122,0.06) 0%,transparent 70%)", filter: "blur(40px)" }} />

        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-sm font-medium mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
            style={{ background: "rgba(0,198,122,0.08)", border: "1px solid rgba(0,198,122,0.18)", color: "#00C67A" }}>
            Built for Indian dropshipping businesses
          </p>

          <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6"
            style={{ letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Run your entire<br />
            dropshipping business<br />
            <span style={{ color: "#00C67A" }}>from one platform.</span>
          </h1>

          <p className="text-lg md:text-xl leading-relaxed mb-10 max-w-xl mx-auto"
            style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.7 }}>
            Source products, automate fulfilment via Delhivery, track every order, and collect weekly payouts — without juggling multiple tools.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/login"
              className="px-7 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "#00C67A", color: "#070F1C" }}>
              Get started
            </Link>
            <a href="#how-it-works"
              className="px-7 py-3.5 rounded-xl text-sm font-medium transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)" }}>
              See how it works
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative max-w-3xl mx-auto mt-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { value: "500+", label: "Active sellers" },
              { value: "1L+", label: "Orders fulfilled" },
              { value: "Weekly", label: "Payouts processed" },
              { value: "18,000+", label: "Pin codes covered" },
            ].map(s => (
              <div key={s.label} className="px-6 py-5 text-center"
                style={{ background: "rgba(7,15,28,0.7)", backdropFilter: "blur(20px)" }}>
                <p className="text-2xl font-black mb-1" style={{ color: "white" }}>{s.value}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#00C67A" }}>Process</p>
            <h2 className="text-4xl md:text-5xl font-black mb-5" style={{ letterSpacing: "-0.02em" }}>
              Set up once. Run everything.
            </h2>
            <p className="text-base max-w-lg" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
              Connect your store, list products, and let us handle the rest. From dispatch to delivery to payout.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {STEPS.map((s, i) => (
              <div key={s.label} className="relative rounded-2xl p-6"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(20px)",
                }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-black tabular-nums"
                    style={{ color: "rgba(0,198,122,0.6)" }}>0{i + 1}</span>
                  <div className="flex-1 h-px" style={{ background: "rgba(0,198,122,0.15)" }} />
                </div>
                <h3 className="font-bold text-base mb-2">{s.label}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-28 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#00C67A" }}>Features</p>
            <h2 className="text-4xl md:text-5xl font-black mb-5" style={{ letterSpacing: "-0.02em" }}>
              Save hours every week<br />on operations.
            </h2>
            <p className="text-base max-w-lg" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
              Eliminate manual tracking. Vrinandya Ventures centralises your orders, sellers, fulfilment, and payments in one structured system.
            </p>
          </div>

          <div className="space-y-5">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="rounded-2xl p-8"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(20px)",
                }}>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  <div className="md:w-2/5">
                    <span className="text-xs font-bold" style={{ color: "rgba(0,198,122,0.5)" }}>0{i + 1}</span>
                    <h3 className="text-xl font-bold mt-2 leading-snug">{f.title}</h3>
                  </div>
                  <ul className="md:w-3/5 space-y-3">
                    {f.points.map(p => (
                      <li key={p} className="flex items-start gap-3 text-sm"
                        style={{ color: "rgba(255,255,255,0.55)" }}>
                        <span className="mt-0.5 text-xs flex-shrink-0" style={{ color: "#00C67A" }}>—</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Feature grid */}
          <div className="mt-10 grid grid-cols-3 gap-3">
            {GRID_FEATURES.map(f => (
              <div key={f} className="rounded-xl px-4 py-3 text-sm font-medium"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.5)",
                }}>
                {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-28 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#00C67A" }}>Pricing</p>
            <h2 className="text-4xl md:text-5xl font-black mb-5" style={{ letterSpacing: "-0.02em" }}>
              Simple pricing.<br />No hidden fees.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                name: "Launch", price: "₹25,000", popular: false,
                desc: "For sellers just getting started with dropshipping.",
                features: ["1 Shopify store", "Up to 200 orders/month", "Delhivery fulfilment", "Basic analytics", "Email support"],
              },
              {
                name: "Scale", price: "₹35,000", popular: true,
                desc: "For growing sellers who need more reach and tools.",
                features: ["3 Shopify stores", "Unlimited orders", "Priority fulfilment", "Full analytics", "CRM access", "Dedicated account manager"],
              },
              {
                name: "Enterprise", price: "₹50,000", popular: false,
                desc: "For teams running large-scale dropshipping operations.",
                features: ["Unlimited stores", "Unlimited orders", "Express fulfilment", "Advanced analytics", "Full CRM + sales team", "Custom integrations", "Priority support"],
              },
            ].map(plan => (
              <div key={plan.name} className="rounded-2xl p-7 flex flex-col"
                style={{
                  background: plan.popular ? "rgba(0,198,122,0.05)" : "rgba(255,255,255,0.025)",
                  border: plan.popular ? "1px solid rgba(0,198,122,0.25)" : "1px solid rgba(255,255,255,0.07)",
                  backdropFilter: "blur(20px)",
                }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold">{plan.name}</span>
                  {plan.popular && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(0,198,122,0.12)", color: "#00C67A" }}>
                      Most popular
                    </span>
                  )}
                </div>
                <div className="text-3xl font-black mt-3 mb-2">{plan.price}</div>
                <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>{plan.desc}</p>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm"
                      style={{ color: "rgba(255,255,255,0.6)" }}>
                      <span style={{ color: "#00C67A", fontSize: 10 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login"
                  className="block text-center py-3 rounded-xl text-sm font-semibold transition-all"
                  style={plan.popular
                    ? { background: "#00C67A", color: "#070F1C" }
                    : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)" }}>
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: "#00C67A" }}>
            Join 500+ sellers
          </p>
          <h2 className="text-4xl md:text-5xl font-black mb-5" style={{ letterSpacing: "-0.02em" }}>
            Ready to run your operations<br />on one platform?
          </h2>
          <p className="text-base mb-10 max-w-md mx-auto" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
            Stop managing orders and payouts across scattered tools. Start and scale your dropshipping business from one structured system.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/login"
              className="px-7 py-3.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: "#00C67A", color: "#070F1C" }}>
              Get started
            </Link>
            <a href="https://wa.me/918533949379" target="_blank" rel="noreferrer"
              className="px-7 py-3.5 rounded-xl text-sm font-medium transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)" }}>
              Talk to our team
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faqs" className="py-28 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#00C67A" }}>FAQs</p>
            <h2 className="text-4xl font-black" style={{ letterSpacing: "-0.02em" }}>Frequently asked questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div key={f.q} className="rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                <button
                  className="w-full flex items-center justify-between px-6 py-5 text-left text-sm font-semibold transition-colors"
                  style={{ background: openFaq === i ? "rgba(0,198,122,0.04)" : "rgba(255,255,255,0.02)", color: "white" }}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {f.q}
                  <span className="ml-4 flex-shrink-0 text-lg font-light transition-transform"
                    style={{ color: "#00C67A", transform: openFaq === i ? "rotate(45deg)" : "none" }}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm leading-relaxed"
                    style={{ color: "rgba(255,255,255,0.5)", background: "rgba(0,198,122,0.02)" }}>
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-16 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
                style={{ background: "#00C67A", color: "#070F1C" }}>V</div>
              <span className="font-semibold">Vrinandya Ventures</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              India&apos;s dropshipping operations platform. Built for sellers who want to scale without the chaos.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: "rgba(255,255,255,0.25)" }}>Platform</p>
            <ul className="space-y-3">
              {["Features", "Pricing", "How It Works", "FAQs"].map(l => (
                <li key={l}>
                  <a href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                    className="text-sm transition-colors"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "white")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>{l}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: "rgba(255,255,255,0.25)" }}>Company</p>
            <ul className="space-y-3">
              {["About", "Contact", "Support"].map(l => (
                <li key={l}>
                  <a href="#" className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{l}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: "rgba(255,255,255,0.25)" }}>Legal</p>
            <ul className="space-y-3">
              {["Privacy Policy", "Terms of Service", "Refund Policy"].map(l => (
                <li key={l}>
                  <a href="#" className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{l}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-14 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            © {new Date().getFullYear()} Vrinandya Ventures. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            connect@vrinandyaventures.in · +91 85339 49379
          </p>
        </div>
      </footer>

    </div>
  );
}

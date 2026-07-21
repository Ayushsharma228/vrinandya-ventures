"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const FEATURES = [
  { emoji: "🛒", title: "Shopify Auto-Fulfillment",     desc: "Orders from your Shopify store are automatically sent to suppliers. Zero manual effort required." },
  { emoji: "📦", title: "Real-Time Order Tracking",     desc: "Track every shipment live. Get instant status updates — from dispatch to delivery or RTO." },
  { emoji: "💰", title: "Weekly Payouts",               desc: "Your margins land in your bank account every Monday. Fully automated, fully transparent." },
  { emoji: "📊", title: "ROAS & Ad Analytics",          desc: "Monitor your Return on Ad Spend, orders per day, and revenue — all in one dashboard." },
  { emoji: "✅", title: "Verified Suppliers",           desc: "Curated supplier network with quality products, fast dispatch, and competitive pricing." },
  { emoji: "🔍", title: "Transparent Remittances",      desc: "See exactly how your payout is calculated — gross amount, supplier cost, fees, and RTO deductions." },
];

const STEPS = [
  { n: "01", title: "Create Your Account",   desc: "Sign up free and complete your dropshipper profile with GST and bank details." },
  { n: "02", title: "Connect Shopify Store", desc: "Link your Shopify store in one click. Our app syncs orders automatically." },
  { n: "03", title: "List & Sell Products",  desc: "Browse supplier catalog, list products, run ads, and start getting COD orders." },
  { n: "04", title: "Get Paid Weekly",       desc: "We fulfill orders. You receive your profit margin every Monday." },
];

const FAQS = [
  { q: "What is COD dropshipping in India?",          a: "COD (Cash on Delivery) dropshipping means you sell products online and customers pay on delivery. We handle fulfilment — you never hold inventory." },
  { q: "How does Axiqen work?",                        a: "You connect your Shopify store, list products from our catalog, and run ads. When an order comes in, we pick, pack, and ship it via Delhivery — automatically." },
  { q: "Do I need inventory to start?",               a: "No. We hold all the inventory. You only pay for products that are ordered and delivered." },
  { q: "How do I get paid?",                          a: "Every Monday, we calculate your earnings (selling price minus supplier cost, shipping, and RTO losses) and transfer them directly to your bank account." },
  { q: "What happens when an order is returned (RTO)?", a: "RTO losses are deducted from your weekly payout. We track every return and show you a full breakdown in your dashboard so there are no surprises." },
  { q: "Can I connect my existing Shopify store?",    a: "Yes. Any Shopify store connects in under two minutes. Orders start syncing immediately — no plugins or coding needed." },
];

const STORE_OPTIONS = [
  { emoji: "✅", label: "Yes, a Shopify store" },
  { emoji: "🏪", label: "Yes, on another platform" },
  { emoji: "🔨", label: "Building one right now" },
  { emoji: "🆕", label: "No, just getting started" },
];

const BUDGET_OPTIONS = [
  "₹15,000 – ₹25,000",
  "₹25,000 – ₹50,000",
  "₹50,000 – ₹1,00,000",
  "₹1,00,000+",
];

const NICHE_OPTIONS = ["Fashion & Clothing", "Beauty & Skincare", "Home & Kitchen", "Electronics & Gadgets", "Health & Wellness", "Other"];

export default function LandingPage() {
  const [menuOpen, setMenuOpen]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [openFaq, setOpenFaq]     = useState<number | null>(null);
  const [barDismissed, setBarDismissed] = useState(false);

  // Apply form
  const [step, setStep]           = useState(0); // 0=store,1=budget,2=niche,3=details
  const [store, setStore]         = useState("");
  const [budget, setBudget]       = useState("");
  const [niche, setNiche]         = useState("");
  const [name, setName]           = useState("");
  const [phone, setPhone]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) { setFormError("Please enter your name and WhatsApp number."); return; }
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, store, budget, niche }),
      });
      if (!res.ok) { const d = await res.json(); setFormError(d.error || "Something went wrong"); setSubmitting(false); return; }
      setSubmitted(true);
    } catch {
      setFormError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  const totalSteps = 4;
  const pct = Math.round((step / totalSteps) * 100);

  return (
    <div style={{ background: "#FFFFFF", color: "#111827", fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── ANNOUNCEMENT BAR ── */}
      {!barDismissed && (
        <div className="relative flex items-center justify-center py-2.5 px-6 text-sm font-medium text-white"
          style={{ background: "#00C67A" }}>
          <span>🎉 Free onboarding this week — get your first 10 orders fulfilled on us.
            <a href="#apply" className="underline ml-1 font-semibold">Apply now →</a>
          </span>
          <button onClick={() => setBarDismissed(true)}
            className="absolute right-4 text-white/70 hover:text-white text-lg leading-none">×</button>
        </div>
      )}

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(255,255,255,0.95)" : "white",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: "1px solid #F3F4F6",
          boxShadow: scrolled ? "0 1px 8px rgba(0,0,0,0.06)" : "none",
        }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
              style={{ background: "#00C67A", color: "white" }}>A</div>
            <span className="font-bold text-base tracking-tight" style={{ color: "#111827" }}>Axiqen</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {["Features", "How It Works", "Pricing", "FAQs"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm font-medium transition-colors"
                style={{ color: "#6B7280" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#111827")}
                onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}
              >{l}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              style={{ color: "#374151" }}>Log in</Link>
            <a href="#apply"
              className="text-sm font-bold px-5 py-2.5 rounded-lg transition-all hover:opacity-90"
              style={{ background: "#00C67A", color: "white" }}>
              Apply Now
            </a>
          </div>

          <button className="md:hidden p-1" onClick={() => setMenuOpen(p => !p)}>
            <div className="flex flex-col gap-1.5">
              <span className="block w-5 h-0.5 bg-gray-700" />
              <span className="block w-5 h-0.5 bg-gray-700" />
              <span className="block w-3.5 h-0.5 bg-gray-700" />
            </div>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden px-6 pb-6 pt-2 space-y-4 border-t" style={{ borderColor: "#F3F4F6" }}>
            {["Features", "How It Works", "Pricing", "FAQs"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                onClick={() => setMenuOpen(false)}
                className="block text-sm py-1.5 font-medium" style={{ color: "#374151" }}>{l}</a>
            ))}
            <a href="#apply" onClick={() => setMenuOpen(false)}
              className="block text-center text-sm font-bold px-5 py-3 rounded-lg"
              style={{ background: "#00C67A", color: "white" }}>
              Apply Now
            </a>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="pt-20 pb-16 px-6 text-center" style={{ background: "#FFFFFF" }}>
        <div className="max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-full mb-6"
            style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}>
            🇮🇳 Made for Indian Dropshippers
          </span>

          <h1 className="text-5xl md:text-6xl font-black leading-tight mb-5"
            style={{ letterSpacing: "-0.03em", color: "#111827", lineHeight: 1.08 }}>
            India&apos;s #1 COD<br />
            <span style={{ color: "#00C67A" }}>Dropshipping Platform</span>
          </h1>

          <p className="text-lg leading-relaxed mb-8 max-w-xl mx-auto" style={{ color: "#6B7280" }}>
            Automate your Shopify dropshipping business. Connect your store, list products from verified suppliers, and collect weekly payouts — all without touching inventory.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <a href="#apply"
              className="px-8 py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ background: "#00C67A", color: "white" }}>
              Apply to Get Started →
            </a>
            <Link href="/login"
              className="px-8 py-3.5 rounded-xl text-sm font-semibold border transition-all"
              style={{ borderColor: "#E5E7EB", color: "#374151" }}>
              Log In
            </Link>
          </div>

          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            No spam · Free onboarding · WhatsApp support in 24 hrs
          </p>
        </div>
      </section>

      {/* ── STATS BANNER ── */}
      <section style={{ background: "#00C67A" }} className="py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "500+",    label: "Active Dropshippers" },
            { value: "₹1Cr+",  label: "GMV Processed" },
            { value: "18,000+", label: "Pin Codes Covered" },
            { value: "95%",    label: "Delivery Rate" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-4xl font-black text-white mb-1">{s.value}</p>
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── APPLY FORM ── */}
      <section id="apply" className="py-24 px-6" style={{ background: "#F9FAFB" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

          {/* Left pitch */}
          <div>
            <span className="text-xs font-bold uppercase tracking-widest mb-4 block" style={{ color: "#00C67A" }}>
              🚀 Limited onboarding slots
            </span>
            <h2 className="text-3xl font-black mb-4 leading-tight" style={{ color: "#111827" }}>
              Apply for your free<br />dropshipping setup
            </h2>
            <p className="text-base mb-8 leading-relaxed" style={{ color: "#6B7280" }}>
              We work closely with serious sellers — so we onboard a limited number of dropshippers each week. Answer a few quick questions and our team will reach out on WhatsApp within 24 hours.
            </p>
            <ul className="space-y-3">
              {[
                "Personal onboarding call with our team",
                "Done-for-you Shopify connection & product listing",
                "Verified suppliers + winning product picks",
                "Weekly payouts straight to your bank",
              ].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium" style={{ color: "#374151" }}>
                  <span style={{ color: "#00C67A" }}>✓</span> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Right form */}
          <div className="rounded-2xl p-7 shadow-lg" style={{ background: "white", border: "1px solid #E5E7EB" }}>
            {submitted ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-black mb-2" style={{ color: "#111827" }}>You&apos;re on the list!</h3>
                <p className="text-sm" style={{ color: "#6B7280" }}>
                  Our team will reach out on WhatsApp within 24 hours to get you set up.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>
                    Step {step + 1} of {totalSteps}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>{pct}% done</span>
                </div>
                <div className="h-1 rounded-full mb-6" style={{ background: "#F3F4F6" }}>
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, background: "#00C67A" }} />
                </div>

                {step === 0 && (
                  <>
                    <h3 className="font-bold text-base mb-4" style={{ color: "#111827" }}>Do you already have an online store?</h3>
                    <div className="space-y-2.5">
                      {STORE_OPTIONS.map(o => (
                        <button key={o.label}
                          onClick={() => { setStore(o.label); setStep(1); }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-left transition-all border"
                          style={{
                            borderColor: store === o.label ? "#00C67A" : "#E5E7EB",
                            background: store === o.label ? "#F0FDF4" : "white",
                            color: "#111827",
                          }}>
                          <span>{o.emoji}</span> {o.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <h3 className="font-bold text-base mb-4" style={{ color: "#111827" }}>How much are you willing to invest?</h3>
                    <div className="space-y-2.5">
                      {BUDGET_OPTIONS.map(b => (
                        <button key={b}
                          onClick={() => { setBudget(b); setStep(2); }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-left transition-all border"
                          style={{
                            borderColor: budget === b ? "#00C67A" : "#E5E7EB",
                            background: budget === b ? "#F0FDF4" : "white",
                            color: "#111827",
                          }}>
                          💸 {b}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setStep(0)} className="mt-4 text-xs" style={{ color: "#9CA3AF" }}>← Back</button>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h3 className="font-bold text-base mb-4" style={{ color: "#111827" }}>What niche do you want to sell in?</h3>
                    <div className="space-y-2.5">
                      {NICHE_OPTIONS.map(n => (
                        <button key={n}
                          onClick={() => { setNiche(n); setStep(3); }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-left transition-all border"
                          style={{
                            borderColor: niche === n ? "#00C67A" : "#E5E7EB",
                            background: niche === n ? "#F0FDF4" : "white",
                            color: "#111827",
                          }}>
                          🏷️ {n}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setStep(1)} className="mt-4 text-xs" style={{ color: "#9CA3AF" }}>← Back</button>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h3 className="font-bold text-base mb-4" style={{ color: "#111827" }}>Your details</h3>
                    {formError && (
                      <div className="mb-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</div>
                    )}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>Full Name *</label>
                        <input
                          type="text"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all"
                          style={{ borderColor: "#E5E7EB", color: "#111827" }}
                          onFocus={e => (e.currentTarget.style.borderColor = "#00C67A")}
                          onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: "#374151" }}>WhatsApp Number *</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          placeholder="10-digit number"
                          className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all"
                          style={{ borderColor: "#E5E7EB", color: "#111827" }}
                          onFocus={e => (e.currentTarget.style.borderColor = "#00C67A")}
                          onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
                        />
                      </div>
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-60"
                        style={{ background: "#00C67A", color: "white" }}>
                        {submitting ? "Submitting..." : "Apply to Get Started →"}
                      </button>
                      <p className="text-center text-xs" style={{ color: "#9CA3AF" }}>
                        No spam. We&apos;ll only reach out on WhatsApp.
                      </p>
                    </div>
                    <button onClick={() => setStep(2)} className="mt-2 text-xs" style={{ color: "#9CA3AF" }}>← Back</button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6" style={{ background: "#FFFFFF" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-4" style={{ color: "#111827", letterSpacing: "-0.02em" }}>
              Everything you need to dropship in India
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: "#6B7280" }}>
              From order automation to weekly payouts — Axiqen handles every part of your COD dropshipping business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-2xl p-6 border transition-all hover:shadow-md"
                style={{ borderColor: "#E5E7EB", background: "white" }}>
                <div className="text-3xl mb-4">{f.emoji}</div>
                <h3 className="font-bold text-base mb-2" style={{ color: "#111827" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6" style={{ background: "#F9FAFB" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-4" style={{ color: "#111827", letterSpacing: "-0.02em" }}>
              How it works
            </h2>
            <p className="text-base" style={{ color: "#6B7280" }}>
              Start your dropshipping business in 4 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {STEPS.map(s => (
              <div key={s.n} className="rounded-2xl p-6 border bg-white"
                style={{ borderColor: "#E5E7EB" }}>
                <p className="text-4xl font-black mb-4" style={{ color: "#E5E7EB" }}>{s.n}</p>
                <h3 className="font-bold text-base mb-2" style={{ color: "#111827" }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6" style={{ background: "#FFFFFF" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-4" style={{ color: "#111827", letterSpacing: "-0.02em" }}>
              Simple pricing. No hidden fees.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <div key={plan.name} className="rounded-2xl p-7 flex flex-col border"
                style={{
                  borderColor: plan.popular ? "#00C67A" : "#E5E7EB",
                  background: plan.popular ? "#F0FDF4" : "white",
                  boxShadow: plan.popular ? "0 4px 24px rgba(0,198,122,0.12)" : "none",
                }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm" style={{ color: "#111827" }}>{plan.name}</span>
                  {plan.popular && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: "#00C67A", color: "white" }}>
                      Most popular
                    </span>
                  )}
                </div>
                <div className="text-4xl font-black mt-3 mb-1" style={{ color: "#111827" }}>{plan.price}</div>
                <p className="text-sm mb-6" style={{ color: "#6B7280" }}>{plan.desc}</p>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "#374151" }}>
                      <span style={{ color: "#00C67A", fontWeight: 700 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a href="#apply"
                  className="block text-center py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                  style={plan.popular
                    ? { background: "#00C67A", color: "white" }
                    : { background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#374151" }}>
                  Get started
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faqs" className="py-24 px-6" style={{ background: "#F9FAFB" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3" style={{ color: "#111827", letterSpacing: "-0.02em" }}>
              Frequently Asked Questions
            </h2>
            <p className="text-sm" style={{ color: "#9CA3AF" }}>Everything about COD dropshipping in India with Axiqen</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div key={f.q} className="rounded-xl overflow-hidden border bg-white"
                style={{ borderColor: "#E5E7EB" }}>
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-semibold"
                  style={{ color: openFaq === i ? "#00C67A" : "#111827" }}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {f.q}
                  <span className="ml-4 flex-shrink-0 text-xl font-light transition-transform"
                    style={{ color: "#00C67A", transform: openFaq === i ? "rotate(45deg)" : "none" }}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm leading-relaxed" style={{ color: "#6B7280" }}>
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 text-center" style={{ background: "#00C67A" }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-black mb-4 text-white" style={{ letterSpacing: "-0.02em" }}>
            Ready to start your dropshipping business?
          </h2>
          <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.8)" }}>
            Join 500+ dropshippers already automating their COD business on Axiqen.<br />Free to start, no inventory needed.
          </p>
          <a href="#apply"
            className="inline-block px-10 py-4 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: "white", color: "#00C67A" }}>
            Apply to Get Started →
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-6" style={{ background: "#111827" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black"
              style={{ background: "#00C67A", color: "white" }}>A</div>
            <span className="font-bold text-sm text-white">Axiqen</span>
          </div>
          <p className="text-xs" style={{ color: "#6B7280" }}>
            © {new Date().getFullYear()} Axiqen. India&apos;s COD Dropshipping Platform.
          </p>
          <div className="flex items-center gap-4 text-xs" style={{ color: "#6B7280" }}>
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <a href="#apply" className="hover:text-white transition-colors">Apply</a>
            <a href="https://wa.me/918533949379" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">WhatsApp</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

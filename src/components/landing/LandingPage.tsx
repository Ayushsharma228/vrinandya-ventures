"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const ACCENT  = "#3f37c9";
const BG      = "#edede9";
const DARK    = "#0f0e17";

const FEATURES = [
  {
    emoji: "🛒",
    title: "Auto-Fulfilment, Zero Touch",
    desc: "Every Shopify order flows to the supplier automatically — no CSVs, no WhatsApp forwarding, no missed orders at 2 AM.",
  },
  {
    emoji: "📦",
    title: "Live Tracking, Dispatch to Doorstep",
    desc: "Every shipment tracked in real time. Delivered, in-transit, or RTO — you always know exactly where your money is.",
  },
  {
    emoji: "💰",
    title: "Monday Payouts, Like Clockwork",
    desc: "Your margin hits your bank account every Monday. No chasing, no \"processing\", no excuses.",
  },
  {
    emoji: "🧾",
    title: "Remittances You Can Actually Read",
    desc: "Gross amount, supplier cost, fees, RTO deductions — every rupee itemised. If you can't explain your payout, we've failed.",
  },
  {
    emoji: "✅",
    title: "Verified Suppliers Only",
    desc: "Every supplier is vetted for dispatch speed, product quality, and pricing before they touch a single order of yours.",
  },
  {
    emoji: "🤝",
    title: "A Human on WhatsApp",
    desc: "Stuck order? RTO dispute? Weird payout? Message your account manager and get an answer in hours — not a ticket that dies in a queue.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Apply & Get On a Call",
    desc: "Fill the form. Our team calls you, understands your budget and experience, and builds your launch plan.",
    accent: "We come to you.",
  },
  {
    n: "02",
    title: "We Set Up Your Store",
    desc: "We connect Shopify, sync the app, and list your first products from the supplier catalog — done for you.",
    accent: "Not by you.",
  },
  {
    n: "03",
    title: "You Run Ads, Orders Flow In",
    desc: "You focus on Meta/Google ads. Every COD order is auto-forwarded, packed, and shipped by our supplier network.",
    accent: "We handle the rest.",
  },
  {
    n: "04",
    title: "Get Paid Every Monday",
    desc: "Delivered orders convert to margin in your wallet. Payout hits your bank every Monday, with a full breakdown.",
    accent: "Without chasing.",
  },
];

const FAQS = [
  {
    q: "What is COD dropshipping?",
    a: "You sell products online without buying inventory. Customer orders on your store and pays cash on delivery; the supplier ships directly to them. Your profit is the difference between your selling price and the supplier cost. Axiqen automates the entire chain — order forwarding, shipping, tracking, and payout.",
  },
  {
    q: "How is Axiqen different from other dropshipping platforms?",
    a: "Two things. First, we're done-for-you: our team sets up your store, lists products, and stays with you on WhatsApp — you're never alone with a dashboard. Second, radical transparency: every payout shows the full math — gross, supplier cost, fees, RTO deductions. No black-box wallets.",
  },
  {
    q: "Do I need inventory or GST to start?",
    a: "No inventory, ever — suppliers ship directly. GST is required for payouts and compliant selling; if you don't have one yet, our team will guide you through the process during onboarding.",
  },
  {
    q: "How and when do I get paid?",
    a: "After every successful delivery, your margin is credited to your Axiqen wallet. Payouts go to your registered bank account every Monday, with a line-by-line breakdown of the calculation.",
  },
  {
    q: "What happens on an RTO (returned order)?",
    a: "COD means some orders come back — anyone who says otherwise is lying to you. On Axiqen, each RTO shows up in your dashboard in real time with a nominal, clearly-stated reverse-shipping fee. You'll also get guidance from your account manager on cutting RTO rates — better targeting, address verification, and NDR follow-ups.",
  },
  {
    q: "I already have a Shopify store. Can I connect it?",
    a: "Yes — connection takes under 5 minutes and your existing orders and products are untouched. Our team does it with you on the onboarding call.",
  },
  {
    q: "How much money do I need to start?",
    a: "Realistically, budget for your ad spend (we recommend starting at ₹500–1,000/day) plus the setup plan. We'll build a launch plan around your budget on the call — we'd rather tell you to wait than let you burn money.",
  },
];

const STORE_OPTIONS = [
  { emoji: "✅", label: "Yes, a Shopify store" },
  { emoji: "🏪", label: "Yes, on another platform" },
  { emoji: "🔨", label: "Building one right now" },
  { emoji: "🆕", label: "No, just getting started" },
];
const BUDGET_OPTIONS = ["₹15,000 – ₹25,000", "₹25,000 – ₹50,000", "₹50,000 – ₹1,00,000", "₹1,00,000+"];
const NICHE_OPTIONS  = ["Fashion & Clothing", "Beauty & Skincare", "Home & Kitchen", "Electronics & Gadgets", "Health & Wellness", "Other"];

export default function LandingPage() {
  const [menuOpen, setMenuOpen]       = useState(false);
  const [scrolled, setScrolled]       = useState(false);
  const [openFaq, setOpenFaq]         = useState<number | null>(null);
  const [barDismissed, setBarDismissed] = useState(false);

  const [step, setStep]           = useState(0);
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
    } catch { setFormError("Network error. Please try again."); }
    setSubmitting(false);
  }

  const totalSteps = 4;
  const pct = Math.round((step / totalSteps) * 100);

  return (
    <div style={{ background: BG, color: DARK, fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── ANNOUNCEMENT BAR ── */}
      {!barDismissed && (
        <div className="relative flex items-center justify-center py-3 px-6 text-sm font-medium text-white"
          style={{ background: ACCENT }}>
          🎉 <strong className="mx-1">Free onboarding this week</strong> — first 10 orders fulfilled on us. Limited slots.
          <a href="#apply" className="underline ml-1 font-bold">Claim yours →</a>
          <button onClick={() => setBarDismissed(true)}
            className="absolute right-4 opacity-70 hover:opacity-100 text-xl leading-none">×</button>
        </div>
      )}

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(237,237,233,0.95)" : BG,
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: `1px solid rgba(63,55,201,0.1)`,
          boxShadow: scrolled ? "0 1px 12px rgba(0,0,0,0.06)" : "none",
        }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
              style={{ background: ACCENT }}>A</div>
            <span className="font-black text-base tracking-tight" style={{ color: DARK }}>Axiqen</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {[["Features", "#features"], ["How It Works", "#how-it-works"], ["Pricing", "#pricing"], ["FAQs", "#faqs"]].map(([l, h]) => (
              <a key={l} href={h}
                className="text-sm font-medium transition-colors"
                style={{ color: "#6B7280" }}
                onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
                onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}
              >{l}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium px-4 py-2 rounded-lg"
              style={{ color: DARK }}>Log in</Link>
            <a href="#apply"
              className="text-sm font-black px-5 py-2.5 rounded-lg text-white transition-all hover:opacity-90"
              style={{ background: ACCENT }}>
              Apply Now
            </a>
          </div>

          <button className="md:hidden p-1" onClick={() => setMenuOpen(p => !p)}>
            <div className="flex flex-col gap-1.5">
              <span className="block w-5 h-0.5" style={{ background: DARK }} />
              <span className="block w-5 h-0.5" style={{ background: DARK }} />
              <span className="block w-3.5 h-0.5" style={{ background: DARK }} />
            </div>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden px-6 pb-6 pt-2 space-y-4 border-t" style={{ borderColor: "rgba(63,55,201,0.1)" }}>
            {[["Features", "#features"], ["How It Works", "#how-it-works"], ["Pricing", "#pricing"], ["FAQs", "#faqs"]].map(([l, h]) => (
              <a key={l} href={h} onClick={() => setMenuOpen(false)}
                className="block text-sm py-1.5 font-medium" style={{ color: DARK }}>{l}</a>
            ))}
            <a href="#apply" onClick={() => setMenuOpen(false)}
              className="block text-center text-sm font-black px-5 py-3 rounded-lg text-white"
              style={{ background: ACCENT }}>Apply Now</a>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="pt-24 pb-20 px-6 text-center" style={{ background: BG }}>
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-full mb-7"
            style={{ background: "rgba(63,55,201,0.08)", color: ACCENT, border: `1px solid rgba(63,55,201,0.18)` }}>
            🇮🇳 Built for Indian COD Sellers
          </span>

          <h1 className="text-5xl md:text-[64px] font-black leading-tight mb-6"
            style={{ letterSpacing: "-0.03em", color: DARK, lineHeight: 1.05 }}>
            Sell the products.<br />
            <span style={{ color: ACCENT }}>We run the business.</span>
          </h1>

          <p className="text-lg leading-relaxed mb-10 max-w-2xl mx-auto" style={{ color: "#4a4a5a", lineHeight: 1.75 }}>
            Axiqen is India&apos;s done-for-you COD dropshipping platform. Connect your Shopify store, pick winning products from verified suppliers, and let our team handle fulfilment, tracking, RTOs, and payouts — while you focus only on ads and sales.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
            <a href="#apply"
              className="px-8 py-4 rounded-xl text-base font-black text-white transition-all hover:opacity-90"
              style={{ background: ACCENT }}>
              Apply to Get Started →
            </a>
            <Link href="/login"
              className="px-8 py-4 rounded-xl text-base font-semibold border-2 transition-all"
              style={{ borderColor: "rgba(63,55,201,0.2)", color: DARK, background: "rgba(255,255,255,0.6)" }}>
              Log In
            </Link>
          </div>

          <p className="text-sm" style={{ color: "#9CA3AF" }}>
            No inventory · No hidden fees · WhatsApp support within 24 hrs
          </p>
        </div>
      </section>

      {/* ── STATS BANNER ── */}
      <section style={{ background: ACCENT }} className="py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "24 hrs",       label: "Avg. Onboarding Time" },
            { value: "Every Monday", label: "Payout, Without Fail" },
            { value: "1:1",          label: "Dedicated Account Manager" },
            { value: "18,000+",      label: "Pin Codes Covered" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl md:text-4xl font-black text-white mb-1">{s.value}</p>
              <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── APPLY FORM ── */}
      <section id="apply" className="py-24 px-6" style={{ background: "#f5f5f1" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div>
            <span className="text-xs font-black uppercase tracking-widest mb-5 block" style={{ color: ACCENT }}>
              🚀 Limited onboarding slots this week
            </span>
            <h2 className="text-3xl font-black mb-5 leading-tight" style={{ color: DARK }}>
              Apply for your free<br />done-for-you setup
            </h2>
            <p className="text-base mb-8 leading-relaxed" style={{ color: "#4a4a5a" }}>
              We don&apos;t do mass signups. Every seller gets a personal onboarding call, a done-for-you store connection, and hand-picked products before their first ad goes live. That&apos;s why we only onboard a limited number of sellers each week. Fill the form — our team reaches out on WhatsApp within 24 hours.
            </p>
            <ul className="space-y-4">
              {[
                "1-on-1 onboarding call — we understand your budget & goals first",
                "Shopify connected + first products listed for you, not by you",
                "Winning product picks from verified suppliers (no saturated junk)",
                "Weekly payouts straight to your bank — every Monday",
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-sm font-medium" style={{ color: "#374151" }}>
                  <span className="mt-0.5 font-black flex-shrink-0" style={{ color: ACCENT }}>✓</span> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl p-7 shadow-xl" style={{ background: "white", border: `1px solid rgba(63,55,201,0.1)` }}>
            {submitted ? (
              <div className="text-center py-10">
                <div className="text-6xl mb-5">🎉</div>
                <h3 className="text-xl font-black mb-3" style={{ color: DARK }}>You&apos;re on the list!</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
                  Our team will reach out on WhatsApp within 24 hours to get you set up. Keep your phone close.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>Step {step + 1} of {totalSteps}</span>
                  <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>{pct}% done</span>
                </div>
                <div className="h-1 rounded-full mb-7" style={{ background: "#F3F4F6" }}>
                  <div className="h-full rounded-full transition-all duration-400"
                    style={{ width: `${pct}%`, background: ACCENT }} />
                </div>

                {step === 0 && (
                  <>
                    <h3 className="font-bold text-base mb-5" style={{ color: DARK }}>Do you already have an online store?</h3>
                    <div className="space-y-2.5">
                      {STORE_OPTIONS.map(o => (
                        <button key={o.label}
                          onClick={() => { setStore(o.label); setStep(1); }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-left transition-all border-2"
                          style={{
                            borderColor: store === o.label ? ACCENT : "#E5E7EB",
                            background: store === o.label ? "rgba(63,55,201,0.05)" : "white",
                            color: DARK,
                          }}>
                          <span className="text-base">{o.emoji}</span> {o.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <h3 className="font-bold text-base mb-5" style={{ color: DARK }}>How much are you willing to invest?</h3>
                    <div className="space-y-2.5">
                      {BUDGET_OPTIONS.map(b => (
                        <button key={b}
                          onClick={() => { setBudget(b); setStep(2); }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-left transition-all border-2"
                          style={{
                            borderColor: budget === b ? ACCENT : "#E5E7EB",
                            background: budget === b ? "rgba(63,55,201,0.05)" : "white",
                            color: DARK,
                          }}>
                          <span>💸</span> {b}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setStep(0)} className="mt-5 text-xs font-medium" style={{ color: "#9CA3AF" }}>← Back</button>
                  </>
                )}

                {step === 2 && (
                  <>
                    <h3 className="font-bold text-base mb-5" style={{ color: DARK }}>What niche do you want to sell in?</h3>
                    <div className="space-y-2.5">
                      {NICHE_OPTIONS.map(n => (
                        <button key={n}
                          onClick={() => { setNiche(n); setStep(3); }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-left transition-all border-2"
                          style={{
                            borderColor: niche === n ? ACCENT : "#E5E7EB",
                            background: niche === n ? "rgba(63,55,201,0.05)" : "white",
                            color: DARK,
                          }}>
                          <span>🏷️</span> {n}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setStep(1)} className="mt-5 text-xs font-medium" style={{ color: "#9CA3AF" }}>← Back</button>
                  </>
                )}

                {step === 3 && (
                  <>
                    <h3 className="font-bold text-base mb-5" style={{ color: DARK }}>Almost there — your details</h3>
                    {formError && (
                      <div className="mb-4 text-xs font-medium rounded-lg px-3 py-2.5"
                        style={{ color: "#DC2626", background: "#FEF2F2" }}>{formError}</div>
                    )}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold mb-1.5" style={{ color: "#374151" }}>Full Name *</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full px-4 py-3 rounded-xl text-sm border-2 outline-none transition-all"
                          style={{ borderColor: "#E5E7EB", color: DARK, background: "white" }}
                          onFocus={e => (e.currentTarget.style.borderColor = ACCENT)}
                          onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1.5" style={{ color: "#374151" }}>WhatsApp Number *</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                          placeholder="10-digit mobile number"
                          className="w-full px-4 py-3 rounded-xl text-sm border-2 outline-none transition-all"
                          style={{ borderColor: "#E5E7EB", color: DARK, background: "white" }}
                          onFocus={e => (e.currentTarget.style.borderColor = ACCENT)}
                          onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")} />
                      </div>
                      <button onClick={handleSubmit} disabled={submitting}
                        className="w-full py-4 rounded-xl text-sm font-black text-white transition-all hover:opacity-90 disabled:opacity-60"
                        style={{ background: ACCENT }}>
                        {submitting ? "Submitting..." : "Apply to Get Started →"}
                      </button>
                      <p className="text-center text-xs" style={{ color: "#9CA3AF" }}>
                        No spam. We&apos;ll only reach out on WhatsApp.
                      </p>
                    </div>
                    <button onClick={() => setStep(2)} className="mt-3 text-xs font-medium" style={{ color: "#9CA3AF" }}>← Back</button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6" style={{ background: BG }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ color: DARK, letterSpacing: "-0.025em" }}>
              Automation does the work.<br />Our team watches it.
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: "#4a4a5a" }}>
              Most platforms give you a dashboard and disappear. Axiqen gives you the dashboard <em>and</em> the people behind it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title}
                className="rounded-2xl p-7 border-2 transition-all hover:border-opacity-60 hover:shadow-lg"
                style={{ borderColor: "rgba(63,55,201,0.1)", background: "white" }}>
                <div className="text-3xl mb-5">{f.emoji}</div>
                <h3 className="font-black text-base mb-2.5" style={{ color: DARK }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6" style={{ background: "#f5f5f1" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ color: DARK, letterSpacing: "-0.025em" }}>
              Live in 4 steps.
            </h2>
            <p className="text-base" style={{ color: "#4a4a5a" }}>
              Most sellers finish in under 48 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {STEPS.map(s => (
              <div key={s.n} className="rounded-2xl p-6 bg-white border-2"
                style={{ borderColor: "rgba(63,55,201,0.08)" }}>
                <p className="text-5xl font-black mb-5" style={{ color: "rgba(63,55,201,0.12)" }}>{s.n}</p>
                <h3 className="font-black text-base mb-2" style={{ color: DARK }}>{s.title}</h3>
                <p className="text-sm leading-relaxed mb-3" style={{ color: "#6B7280" }}>{s.desc}</p>
                <span className="text-xs font-black uppercase tracking-wider" style={{ color: ACCENT }}>{s.accent}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6" style={{ background: BG }}>
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-xs font-black uppercase tracking-widest mb-5 block" style={{ color: ACCENT }}>Pricing</span>
          <h2 className="text-4xl md:text-5xl font-black mb-5" style={{ color: DARK, letterSpacing: "-0.025em" }}>
            Plans that match<br />your stage
          </h2>
          <p className="text-base leading-relaxed mb-10 max-w-lg mx-auto" style={{ color: "#4a4a5a" }}>
            From first-time sellers to teams doing 100+ orders a day — pricing is shared on your onboarding call based on your volume and support needs. No hidden fees, ever.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 text-left">
            {[
              { icon: "🌱", label: "Just Starting", desc: "First store, first products, first orders. We walk you through everything." },
              { icon: "📈", label: "Growing Fast",   desc: "Multiple products, consistent orders, and a dedicated account manager." },
              { icon: "🏢", label: "Scaling Up",    desc: "High-volume ops, team access, custom integrations, and priority support." },
            ].map(t => (
              <div key={t.label} className="rounded-2xl p-6 bg-white border-2"
                style={{ borderColor: "rgba(63,55,201,0.1)" }}>
                <div className="text-3xl mb-4">{t.icon}</div>
                <h3 className="font-black text-base mb-2" style={{ color: DARK }}>{t.label}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>{t.desc}</p>
              </div>
            ))}
          </div>

          <a href="#apply"
            className="inline-block px-10 py-4 rounded-xl text-base font-black text-white transition-all hover:opacity-90"
            style={{ background: ACCENT }}>
            Apply to see plans →
          </a>
          <p className="mt-3 text-xs" style={{ color: "#9CA3AF" }}>No hidden fees, no monthly charges — discussed transparently on your call.</p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faqs" className="py-24 px-6" style={{ background: "#f5f5f1" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black mb-3" style={{ color: DARK, letterSpacing: "-0.025em" }}>
              Questions every smart seller asks
            </h2>
            <p className="text-sm" style={{ color: "#9CA3AF" }}>Everything about COD dropshipping in India with Axiqen</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div key={f.q} className="rounded-xl overflow-hidden border-2 bg-white"
                style={{ borderColor: openFaq === i ? ACCENT : "rgba(63,55,201,0.1)" }}>
                <button
                  className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-bold"
                  style={{ color: openFaq === i ? ACCENT : DARK }}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {f.q}
                  <span className="ml-4 flex-shrink-0 text-xl font-light transition-transform inline-block"
                    style={{ color: ACCENT, transform: openFaq === i ? "rotate(45deg)" : "none" }}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm leading-relaxed" style={{ color: "#4a4a5a", borderTop: `1px solid rgba(63,55,201,0.08)` }}>
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6 text-center" style={{ background: ACCENT }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black mb-5 text-white" style={{ letterSpacing: "-0.025em" }}>
            Your competitors are already automated.<br />Are you?
          </h2>
          <p className="text-base mb-10" style={{ color: "rgba(255,255,255,0.75)" }}>
            Join the sellers running their COD business on Axiqen — with automation doing the work and a real team watching their back. Limited onboarding slots each week.
          </p>
          <a href="#apply"
            className="inline-block px-10 py-4 rounded-xl text-base font-black transition-all hover:opacity-90"
            style={{ background: BG, color: ACCENT }}>
            Apply to Get Started →
          </a>
          <p className="mt-4 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
            Application takes 60 seconds · WhatsApp reply within 24 hrs
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 px-6" style={{ background: DARK }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black text-white"
                style={{ background: ACCENT }}>A</div>
              <span className="font-black text-sm text-white">Axiqen</span>
            </div>
            <p className="text-xs" style={{ color: "#6B7280" }}>A Vrinandya Ventures Product · Made in India 🇮🇳</p>
          </div>

          <p className="text-xs" style={{ color: "#4B5563" }}>
            © {new Date().getFullYear()} Axiqen — India&apos;s COD Dropshipping Platform.
          </p>

          <div className="flex items-center gap-5 text-xs" style={{ color: "#6B7280" }}>
            <Link href="/login" className="hover:text-white transition-colors">Login</Link>
            <a href="#apply" className="hover:text-white transition-colors">Apply</a>
            <a href="https://wa.me/918533949379" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">WhatsApp</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/refund" className="hover:text-white transition-colors">Refund Policy</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

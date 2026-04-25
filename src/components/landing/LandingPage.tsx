"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const NAV_LINKS = ["Features", "How It Works", "Products", "Pricing"];

const FEATURES = [
  { icon: "🛍️", title: "Shopify Integration", desc: "Connect your store in minutes. Orders sync automatically — no manual work." },
  { icon: "📦", title: "Auto Fulfillment", desc: "We dispatch via Delhivery the moment an order is confirmed. You never touch a package." },
  { icon: "💸", title: "Weekly Payouts", desc: "Revenue lands in your account every week, no delays, no excuses." },
  { icon: "📊", title: "Real-Time Analytics", desc: "Live dashboard showing orders, revenue, delivery rates, and seller performance." },
  { icon: "📞", title: "Built-In Sales CRM", desc: "Track leads, assign reps, and convert prospects — all in one place." },
  { icon: "🤝", title: "COD Support", desc: "Full cash-on-delivery support for every order across India." },
];

const STEPS = [
  { step: "01", title: "Connect Your Store", desc: "Link your Shopify store with one click. We pull your orders automatically." },
  { step: "02", title: "List Winning Products", desc: "Browse our curated catalog of high-margin products and push them to your store instantly." },
  { step: "03", title: "We Ship, You Earn", desc: "We handle packaging and Delhivery dispatch. You collect your weekly payout." },
];

const PRODUCTS = [
  { name: "Premium Detox Foot Patch", category: "Health & Wellness", tag: "🔥 Trending", price: "₹599", margin: "68%" },
  { name: "Magnetic Phone Holder", category: "Accessories", tag: "⚡ Hot", price: "₹349", margin: "72%" },
  { name: "Posture Corrector Belt", category: "Health", tag: "📈 Rising", price: "₹799", margin: "65%" },
  { name: "LED Desk Lamp", category: "Home Office", tag: "🔥 Trending", price: "₹1,299", margin: "58%" },
  { name: "Neck Massager Device", category: "Wellness", tag: "⚡ Hot", price: "₹1,499", margin: "61%" },
  { name: "Kitchen Chopper Pro", category: "Kitchen", tag: "📈 Rising", price: "₹449", margin: "70%" },
];

const TESTIMONIALS = [
  { name: "Arjun Mehta", location: "Mumbai", revenue: "₹3.8L/mo", text: "I was doing everything manually before. Vrinandya automated my entire fulfillment — I just focus on marketing now." },
  { name: "Priya Sharma", location: "Delhi", revenue: "₹6.2L/mo", text: "The weekly payouts changed everything for my cash flow. I scaled from 50 to 400 orders a month in 3 months." },
  { name: "Rahul Verma", location: "Bangalore", revenue: "₹12L/mo", text: "Their CRM helped my team convert 3x more leads. The platform literally pays for itself in the first week." },
  { name: "Sneha Patel", location: "Surat", revenue: "₹4.5L/mo", text: "Finally a dropshipping partner that actually understands the Indian market. COD support alone is a game changer." },
];

const PLANS = [
  {
    name: "Launch",
    price: "₹25,000",
    tag: "",
    color: "#3B82F6",
    features: ["1 Shopify Store", "Up to 200 Orders/mo", "Delhivery Fulfillment", "Basic Analytics", "Email Support"],
  },
  {
    name: "Scale",
    price: "₹35,000",
    tag: "Most Popular",
    color: "#00C67A",
    features: ["3 Shopify Stores", "Unlimited Orders", "Priority Fulfillment", "Advanced Analytics", "CRM Access", "Dedicated Manager"],
  },
  {
    name: "Dominate",
    price: "₹50,000",
    tag: "Best Value",
    color: "#A78BFA",
    features: ["Unlimited Stores", "Unlimited Orders", "Express Fulfillment", "Full Analytics Suite", "Full CRM + Sales Team", "Custom Integrations", "24/7 Support"],
  },
];

const STATS = [
  { value: "500+", label: "Active Sellers" },
  { value: "1L+", label: "Orders Delivered" },
  { value: "500+", label: "Winning Products" },
  { value: "95%+", label: "Delivery Rate" },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div style={{ background: "#030D1A", color: "white", fontFamily: "'Inter', sans-serif", overflowX: "hidden" }}>

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(3,13,26,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.07)" : "none",
        }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
              style={{ background: "linear-gradient(135deg,#00C67A,#00A864)", color: "white" }}>V</div>
            <span className="font-bold text-lg tracking-tight">Vrinandya <span style={{ color: "#00C67A" }}>Ventures</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                className="text-sm font-medium transition-colors hover:text-green-400"
                style={{ color: "rgba(255,255,255,0.6)" }}>{l}</a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold px-4 py-2 rounded-xl transition-colors hover:text-white"
              style={{ color: "rgba(255,255,255,0.65)" }}>Log In</Link>
            <Link href="/login" className="text-sm font-bold px-5 py-2 rounded-xl transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg,#00C67A,#00A864)", color: "white", boxShadow: "0 0 24px rgba(0,198,122,0.35)" }}>
              Get Started →
            </Link>
          </div>
          <button className="md:hidden p-2" onClick={() => setMenuOpen(p => !p)}>
            <div className="w-5 h-0.5 bg-white mb-1" />
            <div className="w-5 h-0.5 bg-white mb-1" />
            <div className="w-5 h-0.5 bg-white" />
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden px-6 pb-4 space-y-3"
            style={{ background: "rgba(3,13,26,0.95)", backdropFilter: "blur(20px)" }}>
            {NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                onClick={() => setMenuOpen(false)}
                className="block text-sm font-medium py-2" style={{ color: "rgba(255,255,255,0.7)" }}>{l}</a>
            ))}
            <Link href="/login" onClick={() => setMenuOpen(false)}
              className="block text-center text-sm font-bold px-5 py-2.5 rounded-xl mt-2"
              style={{ background: "linear-gradient(135deg,#00C67A,#00A864)", color: "white" }}>
              Get Started →
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle,#00C67A 0%,transparent 70%)", filter: "blur(80px)" }} />
          <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle,#3B82F6 0%,transparent 70%)", filter: "blur(60px)" }} />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle,#A78BFA 0%,transparent 70%)", filter: "blur(60px)" }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-semibold"
            style={{ background: "rgba(0,198,122,0.1)", border: "1px solid rgba(0,198,122,0.25)", color: "#00C67A" }}>
            🚀 India&apos;s Fastest Growing Dropshipping Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6"
            style={{ letterSpacing: "-0.03em" }}>
            Sell. Scale.{" "}
            <span style={{
              background: "linear-gradient(135deg,#00C67A,#00E589,#3B82F6)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Get Paid Weekly.
            </span>
          </h1>

          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.6)" }}>
            Source winning products, automate fulfillment with Delhivery, and receive weekly payouts — without holding a single unit of inventory.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/login"
              className="px-8 py-4 rounded-2xl text-base font-bold transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg,#00C67A,#00A864)", color: "white", boxShadow: "0 0 40px rgba(0,198,122,0.4)" }}>
              Start Selling Free →
            </Link>
            <a href="#how-it-works"
              className="px-8 py-4 rounded-2xl text-base font-semibold transition-all hover:bg-white/10"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}>
              See How It Works
            </a>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="rounded-2xl px-4 py-5"
                style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-3xl font-black" style={{ color: "#00C67A" }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold mb-3" style={{ color: "#00C67A" }}>EVERYTHING YOU NEED</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ letterSpacing: "-0.02em" }}>
              Built for Indian Dropshippers
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
              Every tool you need to run a profitable dropshipping business — under one roof.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <div key={f.title}
                className="rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 group"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: "rgba(0,198,122,0.1)", border: "1px solid rgba(0,198,122,0.15)" }}>
                  {f.icon}
                </div>
                <h3 className="text-base font-bold mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold mb-3" style={{ color: "#00C67A" }}>SIMPLE PROCESS</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ letterSpacing: "-0.02em" }}>
              Up & Running in 3 Steps
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-px"
              style={{ background: "linear-gradient(90deg,transparent,rgba(0,198,122,0.4),transparent)" }} />
            {STEPS.map(s => (
              <div key={s.step} className="relative rounded-2xl p-7 text-center"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black mx-auto mb-5"
                  style={{ background: "linear-gradient(135deg,rgba(0,198,122,0.2),rgba(0,168,100,0.1))", border: "1px solid rgba(0,198,122,0.25)", color: "#00C67A" }}>
                  {s.step}
                </div>
                <h3 className="text-base font-bold mb-2">{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section id="products" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold mb-3" style={{ color: "#00C67A" }}>CURATED CATALOG</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ letterSpacing: "-0.02em" }}>
              Trending Products Right Now
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
              Hand-picked high-margin products updated weekly based on real sales data.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PRODUCTS.map(p => (
              <div key={p.name} className="rounded-2xl p-5 transition-all hover:-translate-y-1"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}>
                <div className="rounded-xl h-40 mb-4 flex items-center justify-center text-5xl"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  📦
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>{p.category}</span>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ background: "rgba(0,198,122,0.1)", color: "#00C67A" }}>{p.tag}</span>
                </div>
                <h3 className="font-bold text-sm mb-3">{p.name}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black" style={{ color: "#00C67A" }}>{p.price}</span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(59,130,246,0.1)", color: "#60A5FA" }}>
                    {p.margin} margin
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{ background: "rgba(0,198,122,0.1)", border: "1px solid rgba(0,198,122,0.25)", color: "#00C67A" }}>
              View Full Catalog →
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold mb-3" style={{ color: "#00C67A" }}>SUCCESS STORIES</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ letterSpacing: "-0.02em" }}>
              Real Sellers. Real Results.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="rounded-2xl p-6"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <span key={i} style={{ color: "#F59E0B" }}>★</span>)}
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.65)" }}>&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: "linear-gradient(135deg,#00C67A,#00A864)" }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{t.name}</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{t.location}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs font-black" style={{ color: "#00C67A" }}>{t.revenue}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold mb-3" style={{ color: "#00C67A" }}>TRANSPARENT PRICING</p>
            <h2 className="text-4xl md:text-5xl font-black mb-4" style={{ letterSpacing: "-0.02em" }}>
              Simple. No Hidden Fees.
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
              Pick the plan that fits your scale. Upgrade anytime as you grow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div key={plan.name}
                className="relative rounded-2xl p-7 transition-all hover:-translate-y-1"
                style={{
                  background: plan.tag === "Most Popular"
                    ? "linear-gradient(135deg,rgba(0,198,122,0.1),rgba(0,168,100,0.05))"
                    : "rgba(255,255,255,0.03)",
                  backdropFilter: "blur(20px)",
                  border: plan.tag === "Most Popular"
                    ? "1px solid rgba(0,198,122,0.35)"
                    : "1px solid rgba(255,255,255,0.07)",
                  boxShadow: plan.tag === "Most Popular" ? "0 0 40px rgba(0,198,122,0.1)" : "none",
                }}>
                {plan.tag && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold"
                    style={{ background: plan.color, color: "white" }}>
                    {plan.tag}
                  </div>
                )}
                <h3 className="text-lg font-black mb-1">{plan.name}</h3>
                <div className="text-4xl font-black mb-6" style={{ color: plan.color }}>{plan.price}</div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                      <span style={{ color: plan.color }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login"
                  className="block text-center py-3 rounded-xl text-sm font-bold transition-all hover:scale-105"
                  style={plan.tag === "Most Popular"
                    ? { background: "linear-gradient(135deg,#00C67A,#00A864)", color: "white", boxShadow: "0 0 20px rgba(0,198,122,0.3)" }
                    : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
                  Get Started →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto rounded-3xl p-12 text-center relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg,rgba(0,198,122,0.12),rgba(59,130,246,0.08))",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(0,198,122,0.2)",
          }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 rounded-full opacity-30"
              style={{ background: "radial-gradient(circle,#00C67A,transparent)", filter: "blur(40px)" }} />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-semibold mb-3" style={{ color: "#00C67A" }}>READY TO START?</p>
            <h2 className="text-3xl md:text-5xl font-black mb-4" style={{ letterSpacing: "-0.02em" }}>
              Book a Free Consultation
            </h2>
            <p className="text-base mb-8 max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
              Talk to our team, understand if dropshipping is right for you, and get a personalised onboarding plan — completely free.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/login"
                className="px-8 py-4 rounded-2xl text-base font-bold transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg,#00C67A,#00A864)", color: "white", boxShadow: "0 0 30px rgba(0,198,122,0.35)" }}>
                Get Started Free →
              </Link>
              <a href="https://wa.me/918533949379" target="_blank" rel="noreferrer"
                className="px-8 py-4 rounded-2xl text-base font-semibold transition-all hover:bg-white/10"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}>
                💬 Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-16 px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                style={{ background: "linear-gradient(135deg,#00C67A,#00A864)" }}>V</div>
              <span className="font-bold text-lg">Vrinandya <span style={{ color: "#00C67A" }}>Ventures</span></span>
            </div>
            <p className="text-sm max-w-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
              India&apos;s leading dropshipping platform. We handle fulfillment, you handle growth.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>Platform</p>
            <ul className="space-y-2.5">
              {["Features", "Pricing", "Products", "How It Works"].map(l => (
                <li key={l}>
                  <a href={`#${l.toLowerCase().replace(/ /g, "-")}`}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "rgba(255,255,255,0.5)" }}>{l}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>Contact</p>
            <ul className="space-y-2.5 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
              <li>📧 connect@vrinandyaventures.in</li>
              <li>📞 +91 85339 49379</li>
              <li>📍 Agra, Uttar Pradesh, India</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            © {new Date().getFullYear()} Vrinandya Ventures. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {["Privacy Policy", "Terms of Service"].map(l => (
              <a key={l} href="#" className="text-xs transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.3)" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";
import { useState } from "react";
import { C, WA_LINK } from "./constants";

// ── Question bank ─────────────────────────────────────────────────────────────

type Option   = { emoji: string; label: string };
type Question = { q: string; options: Option[] };

const QUESTIONS: Record<"ds" | "mp" | "bb", Question[]> = {
  ds: [
    {
      q: "Which Dropshipping plan are you interested in?",
      options: [
        { emoji: "🌱", label: "Starter — ₹10,000" },
        { emoji: "🚀", label: "Growth — ₹25,000 (Most Popular)" },
        { emoji: "⚡", label: "Scale — ₹50,000" },
        { emoji: "🏢", label: "Enterprise — Custom" },
      ],
    },
    {
      q: "Do you already have an online store?",
      options: [
        { emoji: "✅", label: "Yes, on Shopify" },
        { emoji: "🏪", label: "Yes, on another platform" },
        { emoji: "🔨", label: "Building one right now" },
        { emoji: "🆕", label: "No, starting from scratch" },
      ],
    },
    {
      q: "Which product niche interests you most?",
      options: [
        { emoji: "👗", label: "Fashion & Apparel" },
        { emoji: "⚡", label: "Electronics & Gadgets" },
        { emoji: "🏠", label: "Home & Kitchen" },
        { emoji: "💄", label: "Health & Beauty" },
        { emoji: "🛒", label: "Multiple niches" },
        { emoji: "❓", label: "Not decided yet" },
      ],
    },
    {
      q: "What's your monthly ad budget?",
      options: [
        { emoji: "💸", label: "Under ₹15,000" },
        { emoji: "💸", label: "₹15,000 – ₹50,000" },
        { emoji: "💸", label: "₹50,000 – ₹1,00,000" },
        { emoji: "💸", label: "₹1,00,000+" },
      ],
    },
    {
      q: "What's your biggest challenge right now?",
      options: [
        { emoji: "🔍", label: "Finding good suppliers" },
        { emoji: "🏗️", label: "Setting up my store" },
        { emoji: "📢", label: "Running profitable ads" },
        { emoji: "📦", label: "Managing orders & NDR" },
        { emoji: "🆕", label: "Just getting started" },
      ],
    },
    {
      q: "When do you want to launch?",
      options: [
        { emoji: "🚀", label: "This week — ready to go" },
        { emoji: "📅", label: "This month" },
        { emoji: "🗓️", label: "In the next 3 months" },
        { emoji: "🔍", label: "Just exploring for now" },
      ],
    },
  ],
  mp: [
    {
      q: "Which Marketplace Management plan are you interested in?",
      options: [
        { emoji: "🌱", label: "Starter — ₹5,000/month" },
        { emoji: "🚀", label: "Growth — ₹10,000/month (Most Popular)" },
        { emoji: "⚡", label: "Scale — ₹20,000/month" },
        { emoji: "🏢", label: "Enterprise — Custom" },
      ],
    },
    {
      q: "Which platforms are you currently selling on?",
      options: [
        { emoji: "🟡", label: "Amazon" },
        { emoji: "🔵", label: "Flipkart" },
        { emoji: "🟣", label: "Meesho" },
        { emoji: "🔗", label: "Multiple platforms" },
        { emoji: "🆕", label: "Not selling yet" },
      ],
    },
    {
      q: "How many products do you currently have listed?",
      options: [
        { emoji: "📦", label: "1 – 50 products" },
        { emoji: "📦", label: "51 – 200 products" },
        { emoji: "📦", label: "200 – 500 products" },
        { emoji: "📦", label: "500+ products" },
      ],
    },
    {
      q: "What's your current monthly marketplace revenue?",
      options: [
        { emoji: "🆕", label: "Just getting started" },
        { emoji: "💰", label: "Under ₹50,000" },
        { emoji: "💰", label: "₹50,000 – ₹2,00,000" },
        { emoji: "💰", label: "₹2,00,000+" },
      ],
    },
    {
      q: "What's your biggest marketplace challenge?",
      options: [
        { emoji: "👁️", label: "Low rankings & visibility" },
        { emoji: "📦", label: "Returns, NDR & refunds" },
        { emoji: "📋", label: "Catalogue & listing quality" },
        { emoji: "💸", label: "Pricing & competition" },
      ],
    },
    {
      q: "When do you want to get started?",
      options: [
        { emoji: "🚀", label: "Immediately — this week" },
        { emoji: "📅", label: "This month" },
        { emoji: "🗓️", label: "Next quarter" },
        { emoji: "🔍", label: "Just exploring" },
      ],
    },
  ],
  bb: [
    {
      q: "What type of brand are you looking to build?",
      options: [
        { emoji: "🏷️", label: "Private Label (my own brand)" },
        { emoji: "🤝", label: "White Label (rebrand a product)" },
        { emoji: "🚀", label: "D2C Brand (direct to consumer)" },
        { emoji: "🏢", label: "Existing business — new product line" },
      ],
    },
    {
      q: "Which product category is your brand in?",
      options: [
        { emoji: "👗", label: "Fashion & Apparel" },
        { emoji: "💄", label: "Health & Beauty" },
        { emoji: "🍃", label: "Food & Beverages" },
        { emoji: "🏠", label: "Home & Lifestyle" },
        { emoji: "⚡", label: "Electronics & Tech" },
        { emoji: "📦", label: "Other category" },
      ],
    },
    {
      q: "Do you have a manufacturer or supplier ready?",
      options: [
        { emoji: "✅", label: "Yes, confirmed & ready" },
        { emoji: "🔍", label: "Shortlisted a few options" },
        { emoji: "❌", label: "No, need help sourcing" },
        { emoji: "❓", label: "Not sure where to start" },
      ],
    },
    {
      q: "What's your brand investment budget?",
      options: [
        { emoji: "💰", label: "₹1,00,000 – ₹2,00,000" },
        { emoji: "💰", label: "₹2,00,000 – ₹5,00,000" },
        { emoji: "💰", label: "₹5,00,000 – ₹10,00,000" },
        { emoji: "💰", label: "₹10,00,000+" },
      ],
    },
    {
      q: "What's your target launch timeline?",
      options: [
        { emoji: "⚡", label: "1 – 3 months" },
        { emoji: "📅", label: "3 – 6 months" },
        { emoji: "🗓️", label: "6 – 12 months" },
        { emoji: "🔄", label: "Flexible — no rush" },
      ],
    },
    {
      q: "Which sales channels are you targeting?",
      options: [
        { emoji: "🌐", label: "My own website (Shopify / D2C)" },
        { emoji: "🏪", label: "Amazon, Flipkart, Meesho" },
        { emoji: "🔗", label: "Both website + marketplaces" },
        { emoji: "🏬", label: "Offline + online" },
      ],
    },
  ],
};

const CATEGORIES = [
  { key: "ds" as const, emoji: "🛒", label: "Dropshipping",           sub: "Done-For-You Store Setup" },
  { key: "mp" as const, emoji: "🏪", label: "Marketplace Management", sub: "Amazon · Flipkart · Meesho" },
  { key: "bb" as const, emoji: "🏷️", label: "Brand Building",         sub: "Launch Your Own Brand" },
];

// ── Shared option button ──────────────────────────────────────────────────────

function OptionBtn({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-semibold text-left transition-all duration-150"
      style={{
        border:     `1.5px solid ${selected ? C.gold : C.border}`,
        background: selected ? C.goldDim : C.navy,
        color:      selected ? C.gold : C.heading,
      }}
    >
      {children}
    </button>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

type Phase = "category" | "questions" | "contact" | "done";

export function ApplyForm() {
  const [phase,      setPhase]      = useState<Phase>("category");
  const [category,   setCategory]   = useState<"ds" | "mp" | "bb" | null>(null);
  const [qIndex,     setQIndex]     = useState(0);
  const [answers,    setAnswers]    = useState<string[]>([]);
  const [name,       setName]       = useState("");
  const [phone,      setPhone]      = useState("");
  const [city,       setCity]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  // Progress: category(0) → Q1-Q6(1-6) → contact(7) → done
  const totalSteps = 8;
  const currentStep =
    phase === "category" ? 0
    : phase === "questions" ? qIndex + 1
    : phase === "contact"   ? 7
    : 8;
  const pct = Math.round((currentStep / totalSteps) * 100);

  function pickCategory(cat: "ds" | "mp" | "bb") {
    setCategory(cat);
    setQIndex(0);
    setAnswers([]);
    setPhase("questions");
  }

  function answerQuestion(answer: string) {
    const next = [...answers];
    next[qIndex] = answer;
    setAnswers(next);
    if (qIndex < 5) {
      setQIndex(qIndex + 1);
    } else {
      setPhase("contact");
    }
  }

  function goBack() {
    if (phase === "questions") {
      if (qIndex === 0) {
        setPhase("category");
        setCategory(null);
      } else {
        setQIndex(qIndex - 1);
      }
    } else if (phase === "contact") {
      setPhase("questions");
      setQIndex(5);
    }
  }

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) {
      setError("Name and WhatsApp number are required.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const qs = category ? QUESTIONS[category] : [];
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          city,
          category: category === "ds" ? "Dropshipping"
                  : category === "mp" ? "Marketplace Management"
                  : "Brand Building",
          answers: qs.map((q, i) => ({ q: q.q, a: answers[i] ?? "" })),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Something went wrong.");
        setSubmitting(false);
        return;
      }
      setPhase("done");
    } catch {
      setError("Network error — please try again.");
    }
    setSubmitting(false);
  }

  const currentQuestion = category ? QUESTIONS[category][qIndex] : null;

  return (
    <section
      id="apply"
      className="py-24 px-6"
      style={{ background: C.navy }}
    >
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

        {/* Left pitch */}
        <div>
          <span
            className="inline-block text-xs font-black uppercase tracking-widest mb-5"
            style={{ color: C.gold }}
          >
            🚀 Limited onboarding slots this week
          </span>
          <h2
            className="text-4xl md:text-5xl font-black mb-6 leading-tight"
            style={{ color: C.heading, letterSpacing: "-0.025em", fontFamily: "var(--font-space)" }}
          >
            Apply for your free<br />done-for-you setup
          </h2>
          <p className="text-base leading-relaxed mb-8" style={{ color: C.body }}>
            We don&apos;t do mass signups. Every seller gets a personal onboarding call, a done-for-you store connection, and hand-picked products before their first ad goes live. Fill the form — our team reaches out on WhatsApp within 24 hours.
          </p>
          <ul className="space-y-4">
            {[
              "1-on-1 onboarding call — we understand your budget & goals first",
              "Shopify connected + first products listed for you, not by you",
              "Winning product picks from verified suppliers (no saturated junk)",
              "Weekly payouts straight to your bank — every Monday",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm" style={{ color: C.body }}>
                <span className="mt-0.5 font-black flex-shrink-0" style={{ color: C.green }}>✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right form */}
        <div
          className="rounded-2xl p-8"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          {/* ── Done ── */}
          {phase === "done" ? (
            <div className="text-center py-10">
              <div className="text-6xl mb-5">✅</div>
              <h3
                className="text-2xl font-black mb-3"
                style={{ color: C.heading, fontFamily: "var(--font-space)" }}
              >
                Application received!
              </h3>
              <p className="text-sm mb-8 leading-relaxed" style={{ color: C.body }}>
                Our team will WhatsApp you within 24 hours to schedule your onboarding call.
                Keep your phone close.
              </p>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-sm font-black transition-all hover:opacity-90"
                style={{ background: "#25D366", color: "#fff" }}
              >
                💬 Message us on WhatsApp
              </a>
            </div>
          ) : (
            <>
              {/* Progress bar */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: C.muted }}>
                  {phase === "category" ? "Let's get started"
                   : phase === "contact" ? "Almost done"
                   : `Question ${qIndex + 1} of 6`}
                </span>
                <span className="text-xs font-semibold" style={{ color: C.muted }}>{pct}%</span>
              </div>
              <div className="h-1 rounded-full mb-8" style={{ background: C.border }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: C.gold }}
                />
              </div>

              {/* ── Category selection ── */}
              {phase === "category" && (
                <>
                  <h3
                    className="font-black text-base mb-6"
                    style={{ color: C.heading, fontFamily: "var(--font-space)" }}
                  >
                    What service are you looking for?
                  </h3>
                  <div className="space-y-3">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => pickCategory(cat.key)}
                        className="w-full flex items-start gap-4 px-5 py-4 rounded-xl text-left transition-all duration-150 hover:border-opacity-60"
                        style={{
                          border:     `1.5px solid ${C.border}`,
                          background: C.navy,
                          color:      C.heading,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = C.gold;
                          e.currentTarget.style.background  = C.goldDim;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = C.border;
                          e.currentTarget.style.background  = C.navy;
                        }}
                      >
                        <span className="text-2xl flex-shrink-0">{cat.emoji}</span>
                        <div>
                          <p className="text-sm font-black">{cat.label}</p>
                          <p className="text-xs mt-0.5" style={{ color: C.muted }}>{cat.sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* ── Questions ── */}
              {phase === "questions" && currentQuestion && (
                <>
                  <h3
                    className="font-black text-base mb-6"
                    style={{ color: C.heading, fontFamily: "var(--font-space)" }}
                  >
                    {currentQuestion.q}
                  </h3>
                  <div className="space-y-3">
                    {currentQuestion.options.map((opt) => (
                      <OptionBtn
                        key={opt.label}
                        selected={answers[qIndex] === opt.label}
                        onClick={() => answerQuestion(opt.label)}
                      >
                        <span className="text-lg flex-shrink-0">{opt.emoji}</span>
                        <span>{opt.label}</span>
                      </OptionBtn>
                    ))}
                  </div>
                  <button
                    onClick={goBack}
                    className="mt-6 text-xs font-medium"
                    style={{ color: C.muted }}
                  >
                    ← Back
                  </button>
                </>
              )}

              {/* ── Contact details ── */}
              {phase === "contact" && (
                <>
                  <h3
                    className="font-black text-base mb-6"
                    style={{ color: C.heading, fontFamily: "var(--font-space)" }}
                  >
                    Almost there — your details
                  </h3>
                  {error && (
                    <div
                      className="mb-4 text-xs font-semibold rounded-lg px-4 py-3"
                      style={{ background: C.redDim, color: C.red }}
                    >
                      {error}
                    </div>
                  )}
                  <div className="space-y-4">
                    {[
                      { label: "Full Name *",       val: name,  set: setName,  type: "text", placeholder: "e.g. Rahul Sharma" },
                      { label: "WhatsApp Number *", val: phone, set: setPhone, type: "tel",  placeholder: "10-digit mobile number" },
                      { label: "City",              val: city,  set: setCity,  type: "text", placeholder: "e.g. Surat" },
                    ].map((f) => (
                      <div key={f.label}>
                        <label
                          className="block text-xs font-bold mb-1.5"
                          style={{ color: C.body }}
                        >
                          {f.label}
                        </label>
                        <input
                          type={f.type}
                          value={f.val}
                          onChange={(e) => f.set(e.target.value)}
                          placeholder={f.placeholder}
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                          style={{
                            background: C.navy,
                            border:     `1px solid ${C.border}`,
                            color:      C.heading,
                          }}
                          onFocus={(e)  => (e.currentTarget.style.borderColor = C.gold)}
                          onBlur={(e)   => (e.currentTarget.style.borderColor = C.border)}
                        />
                      </div>
                    ))}

                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full py-4 rounded-lg text-sm font-black transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 mt-2"
                      style={{ background: C.gold, color: C.navy }}
                    >
                      {submitting ? "Submitting..." : "Apply to Get Started →"}
                    </button>
                    <p className="text-center text-xs" style={{ color: C.muted }}>
                      No spam. WhatsApp reply within 24 hrs.
                    </p>
                  </div>
                  <button
                    onClick={goBack}
                    className="mt-3 text-xs font-medium"
                    style={{ color: C.muted }}
                  >
                    ← Back
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

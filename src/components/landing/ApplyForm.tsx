"use client";
import { useState } from "react";
import { C, WA_LINK } from "./constants";

const STORE_OPTS = [
  { emoji: "✅", label: "Yes, a Shopify store" },
  { emoji: "🏪", label: "Yes, on another platform" },
  { emoji: "🔨", label: "Building one right now" },
  { emoji: "🆕", label: "No, just getting started" },
];
const BUDGET_OPTS = [
  { label: "Under ₹15,000/month" },
  { label: "₹15,000 – ₹50,000/month" },
  { label: "₹50,000 – ₹1,00,000/month" },
  { label: "₹1,00,000+/month" },
];
const TIMELINE_OPTS = [
  { emoji: "🚀", label: "This week — ready to go" },
  { emoji: "📅", label: "This month" },
  { emoji: "🔍", label: "Just exploring for now" },
];

type Step = 0 | 1 | 2 | 3;

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
      className="w-full flex items-center gap-3 px-5 py-4 rounded-xl text-sm font-semibold text-left transition-all duration-150 border-2"
      style={{
        borderColor: selected ? C.gold : C.border,
        background:  selected ? C.goldDim : C.navy,
        color:       selected ? C.gold : C.heading,
      }}
    >
      {children}
    </button>
  );
}

export function ApplyForm() {
  const [step, setStep]         = useState<Step>(0);
  const [store, setStore]       = useState("");
  const [budget, setBudget]     = useState("");
  const [timeline, setTimeline] = useState("");
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [city, setCity]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]       = useState("");

  const pct = Math.round((step / 4) * 100);

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) { setError("Name and WhatsApp number are required."); return; }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, city, store, budget, niche: timeline }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Something went wrong."); setSubmitting(false); return; }
      setSubmitted(true);
    } catch {
      setError("Network error — please try again.");
    }
    setSubmitting(false);
  }

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
          {submitted ? (
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
                style={{ background: "#25D366", color: "white", borderRadius: 8 }}
              >
                💬 Message us on WhatsApp
              </a>
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: C.muted }}>Step {step + 1} of 4</span>
                <span className="text-xs font-semibold" style={{ color: C.muted }}>{pct}% done</span>
              </div>
              <div className="h-1 rounded-full mb-8" style={{ background: C.border }}>
                <div
                  className="h-full rounded-full transition-all duration-400"
                  style={{ width: `${pct}%`, background: C.gold }}
                />
              </div>

              {/* Step 0 */}
              {step === 0 && (
                <>
                  <h3 className="font-black text-base mb-5" style={{ color: C.heading, fontFamily: "var(--font-space)" }}>
                    Do you already have an online store?
                  </h3>
                  <div className="space-y-3">
                    {STORE_OPTS.map((o) => (
                      <OptionBtn
                        key={o.label}
                        selected={store === o.label}
                        onClick={() => { setStore(o.label); setStep(1); }}
                      >
                        <span className="text-lg">{o.emoji}</span>
                        <span>{o.label}</span>
                      </OptionBtn>
                    ))}
                  </div>
                </>
              )}

              {/* Step 1 */}
              {step === 1 && (
                <>
                  <h3 className="font-black text-base mb-5" style={{ color: C.heading, fontFamily: "var(--font-space)" }}>
                    What&apos;s your monthly ad budget?
                  </h3>
                  <div className="space-y-3">
                    {BUDGET_OPTS.map((b) => (
                      <OptionBtn
                        key={b.label}
                        selected={budget === b.label}
                        onClick={() => { setBudget(b.label); setStep(2); }}
                      >
                        <span>💸</span>
                        <span>{b.label}</span>
                      </OptionBtn>
                    ))}
                  </div>
                  <button onClick={() => setStep(0)} className="mt-5 text-xs font-medium" style={{ color: C.muted }}>← Back</button>
                </>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <>
                  <h3 className="font-black text-base mb-5" style={{ color: C.heading, fontFamily: "var(--font-space)" }}>
                    When do you want to start?
                  </h3>
                  <div className="space-y-3">
                    {TIMELINE_OPTS.map((t) => (
                      <OptionBtn
                        key={t.label}
                        selected={timeline === t.label}
                        onClick={() => { setTimeline(t.label); setStep(3); }}
                      >
                        <span className="text-lg">{t.emoji}</span>
                        <span>{t.label}</span>
                      </OptionBtn>
                    ))}
                  </div>
                  <button onClick={() => setStep(1)} className="mt-5 text-xs font-medium" style={{ color: C.muted }}>← Back</button>
                </>
              )}

              {/* Step 3 — details */}
              {step === 3 && (
                <>
                  <h3 className="font-black text-base mb-5" style={{ color: C.heading, fontFamily: "var(--font-space)" }}>
                    Almost there — your details
                  </h3>
                  {error && (
                    <div className="mb-4 text-xs font-semibold rounded-lg px-4 py-3" style={{ background: C.redDim, color: C.red }}>
                      {error}
                    </div>
                  )}
                  <div className="space-y-4">
                    {[
                      { label: "Full Name *",          key: "name",  val: name,  set: setName,  type: "text",  placeholder: "e.g. Rahul Sharma" },
                      { label: "WhatsApp Number *",    key: "phone", val: phone, set: setPhone, type: "tel",   placeholder: "10-digit mobile number" },
                      { label: "City",                 key: "city",  val: city,  set: setCity,  type: "text",  placeholder: "e.g. Surat" },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="block text-xs font-bold mb-1.5" style={{ color: C.body }}>{f.label}</label>
                        <input
                          type={f.type}
                          value={f.val}
                          onChange={(e) => f.set(e.target.value)}
                          placeholder={f.placeholder}
                          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                          style={{
                            background: C.navy,
                            border: `1px solid ${C.border}`,
                            color: C.heading,
                          }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = C.gold)}
                          onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                        />
                      </div>
                    ))}

                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="w-full py-4 rounded-lg text-sm font-black transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 mt-2"
                      style={{ background: C.gold, color: C.navy, borderRadius: 8 }}
                    >
                      {submitting ? "Submitting..." : "Apply to Get Started →"}
                    </button>
                    <p className="text-center text-xs" style={{ color: C.muted }}>
                      No spam. WhatsApp reply within 24 hrs.
                    </p>
                  </div>
                  <button onClick={() => setStep(2)} className="mt-3 text-xs font-medium" style={{ color: C.muted }}>← Back</button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

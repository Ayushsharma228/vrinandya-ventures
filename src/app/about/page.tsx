import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — AXQEN",
  description: "Vrinandya Ventures Private Limited — the team behind AXQEN. Our story, mission, and the people who make it happen.",
};

const C = {
  blue:     "#0048DF",
  blueDim:  "rgba(0,72,223,0.08)",
  blueMid:  "rgba(0,72,223,0.18)",
  navy:     "#0A0E1A",
  body:     "#4B5563",
  muted:    "rgba(75,85,99,0.55)",
  amber:    "#EF9F27",
  amberDim: "rgba(239,159,39,0.1)",
  green:    "#1D9E75",
  greenDim: "rgba(29,158,117,0.1)",
  ground:   "#F7F9FF",
  card:     "#FFFFFF",
  border:   "rgba(0,0,0,0.07)",
};

const PILLARS = [
  {
    n: "01",
    head: "Ship without stress.",
    body: "Logistics, tracking, returns, NDRs — we absorb the chaos so you can focus on selling. Every order, handled.",
  },
  {
    n: "02",
    head: "Sell without guesswork.",
    body: "Real-time dashboards, attribution data, RTO forecasts. Every decision your business makes gets sharper with AXQEN.",
  },
  {
    n: "03",
    head: "Scale without limits.",
    body: "From your first 10 orders to your ten-thousandth — same platform, same team, relentlessly in your corner.",
  },
];

export default function AboutPage() {
  return (
    <div style={{ background: C.ground, minHeight: "100vh", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif" }}>

      {/* ── Navbar ── */}
      <nav style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 50 }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/axqen-icon.png" alt="AXQEN" className="w-7 h-7 rounded-lg object-cover" />
            <span className="font-black text-base tracking-tight" style={{ color: C.navy, fontFamily: "var(--font-space)" }}>AXQEN</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/company" className="text-sm font-medium hidden sm:block" style={{ color: C.body }}>Company</Link>
            <Link href="/#apply" className="text-sm font-black px-5 py-2.5 rounded-lg" style={{ background: C.blue, color: "#fff", fontFamily: "var(--font-space)" }}>
              Apply Now
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ background: C.navy, borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
        <div className="max-w-5xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center gap-12 md:gap-16">

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] mb-5"
              style={{ color: C.blue, fontFamily: "var(--font-space)" }}>
              About Us
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6"
              style={{
                color: "#ffffff",
                fontFamily: "var(--font-playfair)",
                fontStyle: "italic",
                textWrap: "balance",
              }}>
              Making Indian sellers unstoppable.
            </h1>
            <p className="text-base leading-relaxed max-w-lg"
              style={{ color: "rgba(255,255,255,0.62)", fontFamily: "var(--font-inter)" }}>
              We built AXQEN because sellers deserve a real partner — not another SaaS dashboard that leaves you alone with the hard parts.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              {[
                { label: "Founded 2025",          color: C.blue   },
                { label: "Agra, India",           color: C.amber  },
                { label: "DPIIT Recognised",      color: "#7C6FF0"},
                { label: "MSME Registered",       color: C.green  },
              ].map((b) => (
                <span key={b.label}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{
                    background: `${b.color}20`,
                    color: b.color,
                    border: `1px solid ${b.color}30`,
                    fontFamily: "var(--font-space)",
                  }}>
                  {b.label}
                </span>
              ))}
            </div>
          </div>

          {/* Founder photo card */}
          <div className="flex-shrink-0 flex flex-col items-center gap-4">
            {/* Photo frame — replace src with actual founder photo */}
            <div style={{
              width: 200, height: 240,
              borderRadius: "20px 20px 20px 4px",
              background: `linear-gradient(145deg, ${C.amberDim}, rgba(239,159,39,0.25))`,
              border: `2px solid ${C.amber}40`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Initials placeholder — swap with <img src="/founder.jpg"> when ready */}
              <div style={{
                width: 76, height: 76, borderRadius: "50%",
                background: `${C.amber}22`,
                border: `2px solid ${C.amber}60`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{
                  fontSize: 28, fontWeight: 800, color: C.amber,
                  fontFamily: "var(--font-space)",
                }}>AS</span>
              </div>
              <p style={{ fontSize: 11, color: "rgba(239,159,39,0.6)", fontFamily: "var(--font-space)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Add your photo
              </p>
              {/* Decorative corner accent */}
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: 48, height: 48,
                background: `${C.amber}18`,
                borderRadius: "20px 0 4px 0",
              }} />
            </div>
            <div className="text-center">
              <p className="font-bold text-sm" style={{ color: "#fff", fontFamily: "var(--font-space)" }}>Aayush Sharma</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-inter)" }}>Founder & CEO, Vrinandya Ventures</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-14 space-y-16">

        {/* ── Story ── */}
        <section>
          <div className="flex flex-col md:flex-row gap-10 items-start">
            <div className="md:w-44 flex-shrink-0">
              <p className="text-xs font-bold uppercase tracking-[0.15em]"
                style={{ color: C.muted, fontFamily: "var(--font-space)" }}>Our Story</p>
            </div>
            <div className="flex-1 space-y-4">
              <p className="text-2xl md:text-3xl font-bold leading-tight"
                style={{ color: C.navy, fontFamily: "var(--font-playfair)", fontStyle: "italic", textWrap: "balance" }}>
                "Every seller we work with gets the same attention I'd give my own business."
              </p>
              <p className="text-base leading-relaxed" style={{ color: C.body }}>
                Vrinandya Ventures was incorporated in Agra in December 2025, born out of a single frustration: dropshippers in India were choosing between affordable tools that did nothing, and expensive agencies that over-promised and under-delivered.
              </p>
              <p className="text-base leading-relaxed" style={{ color: C.body }}>
                AXQEN is our answer — an end-to-end operating system built for COD dropshipping in India. Suppliers. Fulfilment. Analytics. Marketing. Under one roof, with a team that actually picks up the phone.
              </p>
            </div>
          </div>
        </section>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: C.border }} />

        {/* ── Three pillars ── */}
        <section>
          <p className="text-xs font-bold uppercase tracking-[0.15em] mb-10"
            style={{ color: C.muted, fontFamily: "var(--font-space)" }}>What drives us</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {PILLARS.map((p) => (
              <div key={p.n} className="rounded-2xl p-6 flex flex-col gap-3"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <span style={{
                  fontSize: 40, fontWeight: 800, lineHeight: 1,
                  color: "rgba(0,72,223,0.2)",
                  fontFamily: "var(--font-space)",
                }}>
                  {p.n}
                </span>
                <p className="font-bold text-base leading-snug"
                  style={{ color: C.navy, fontFamily: "var(--font-playfair)" }}>
                  {p.head}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: C.body }}>{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: C.border }} />

        {/* ── Numbers ── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { v: "Dec 2025", l: "Incorporated" },
            { v: "Agra, UP", l: "Headquartered" },
            { v: "DIPP239200", l: "DPIIT Recognition" },
            { v: "Pvt. Ltd.", l: "Company Type" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <p className="font-black text-base mb-0.5 font-mono"
                style={{ color: C.blue, fontFamily: "var(--font-space)", fontVariantNumeric: "tabular-nums" }}>
                {s.v}
              </p>
              <p className="text-xs" style={{ color: C.muted, fontFamily: "var(--font-inter)" }}>{s.l}</p>
            </div>
          ))}
        </section>

        {/* ── Address ── */}
        <section>
          <div className="rounded-2xl p-8 flex flex-col sm:flex-row gap-8 sm:gap-12"
            style={{ background: C.card, border: `1px solid ${C.border}` }}>

            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.15em] mb-4"
                style={{ color: C.muted, fontFamily: "var(--font-space)" }}>Find us in Agra. Reach us everywhere.</p>
              <div className="space-y-2">
                <p className="font-bold text-base" style={{ color: C.navy, fontFamily: "var(--font-space)" }}>
                  Vrinandya Ventures Pvt. Ltd.
                </p>
                <p className="text-sm leading-relaxed" style={{ color: C.body }}>
                  4/210 Unt Gali, Kacheri Ghat<br />
                  Agra, Uttar Pradesh — 282004<br />
                  India
                </p>
              </div>
            </div>

            <div className="flex-shrink-0 space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.15em] mb-4"
                style={{ color: C.muted, fontFamily: "var(--font-space)" }}>Get in touch</p>
              <a href="mailto:connect@vrinandyaventures.in"
                className="flex items-center gap-2 text-sm font-semibold group"
                style={{ color: C.blue, fontFamily: "var(--font-space)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                connect@vrinandyaventures.in
              </a>
              <a href="https://app.vrinandyaventures.in"
                className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: C.blue, fontFamily: "var(--font-space)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>
                </svg>
                app.vrinandyaventures.in
              </a>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="text-center py-4">
          <p className="text-2xl md:text-3xl font-bold mb-4"
            style={{ color: C.navy, fontFamily: "var(--font-playfair)", fontStyle: "italic", textWrap: "balance" }}>
            Ready to run a better business?
          </p>
          <p className="text-sm mb-8" style={{ color: C.body }}>
            Join sellers already scaling with AXQEN's done-for-you platform.
          </p>
          <Link href="/#apply"
            className="inline-block text-sm font-black px-8 py-3.5 rounded-xl transition-opacity hover:opacity-90"
            style={{ background: C.blue, color: "#fff", fontFamily: "var(--font-space)", letterSpacing: "0.02em" }}>
            Apply Now — It's Free to Start
          </Link>
        </section>
      </div>

      {/* ── Footer ── */}
      <div className="py-8 px-6 text-center mt-4" style={{ background: "#fff", borderTop: `1px solid ${C.border}` }}>
        <p className="text-xs mb-1" style={{ color: C.muted }}>
          © {new Date().getFullYear()} Vrinandya Ventures Private Limited. All rights reserved.
        </p>
        <Link href="/" className="text-xs font-semibold hover:opacity-70" style={{ color: C.blue, fontFamily: "var(--font-space)" }}>
          ← Back to AXQEN
        </Link>
      </div>
    </div>
  );
}

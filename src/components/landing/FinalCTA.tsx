import { C } from "./constants";

export function FinalCTA() {
  return (
    <section
      className="py-24 px-6 text-center relative overflow-hidden"
      style={{ background: C.card }}
    >
      {/* Subtle radial */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.07) 0%, transparent 70%)" }}
      />

      <div className="relative max-w-2xl mx-auto">
        <h2
          className="text-4xl md:text-5xl font-black mb-5"
          style={{ color: C.heading, letterSpacing: "-0.025em", lineHeight: 1.1, fontFamily: "var(--font-space)" }}
        >
          Your competitors are<br />already automated.<br />
          <span style={{ color: C.gold }}>Are you?</span>
        </h2>
        <p className="text-base mb-10 leading-relaxed" style={{ color: C.body }}>
          Join the sellers running their COD business on Axiqen — automation doing the work,
          a real team watching their back. Limited onboarding slots each week.
        </p>
        <a
          href="#apply"
          className="inline-block px-10 py-4 rounded-lg text-base font-black transition-all hover:opacity-90 active:scale-95"
          style={{ background: C.gold, color: C.navy, borderRadius: 8 }}
        >
          Apply to Get Started →
        </a>
        <p className="mt-4 text-xs" style={{ color: C.muted }}>
          Application takes 60 seconds · WhatsApp reply within 24 hrs
        </p>
      </div>
    </section>
  );
}

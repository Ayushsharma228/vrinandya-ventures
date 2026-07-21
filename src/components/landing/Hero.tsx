"use client";
import Link from "next/link";
import { C } from "./constants";

export function Hero() {
  return (
    <section
      className="relative pt-32 pb-20 px-6 overflow-hidden"
      style={{ background: C.navy }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(124,111,240,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-[1200px] mx-auto text-center">
        {/* Badge */}
        <span
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-full mb-7"
          style={{
            background: C.indigoDim,
            color: C.indigo,
            border: `1px solid ${C.indigoBorder}`,
          }}
        >
          🇮🇳 Built for Indian COD Sellers
        </span>

        {/* H1 */}
        <h1
          className="text-5xl md:text-[68px] font-black leading-tight mb-6 max-w-3xl mx-auto"
          style={{
            color: C.heading,
            letterSpacing: "-0.03em",
            lineHeight: 1.06,
            fontFamily: "var(--font-space)",
          }}
        >
          Sell the products.{" "}
          <span style={{ color: C.gold }}>We run the business.</span>
        </h1>

        {/* Sub */}
        <p
          className="text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto"
          style={{ color: C.body, lineHeight: 1.75 }}
        >
          Axiqen is India&apos;s done-for-you COD dropshipping platform. Connect your Shopify store, pick winning products from verified suppliers, and let our team handle fulfilment, tracking, RTOs, and payouts — while you focus only on ads and sales.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
          <a
            href="#apply"
            className="w-full sm:w-auto px-8 py-4 text-base font-black rounded-lg transition-all hover:opacity-90 active:scale-95"
            style={{ background: C.gold, color: C.navy, borderRadius: 8 }}
          >
            Apply to Get Started →
          </a>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 text-base font-semibold rounded-lg border transition-all hover:border-opacity-80"
            style={{ borderColor: C.borderStrong, color: C.heading, borderRadius: 8 }}
          >
            Log In
          </Link>
        </div>

        {/* Trust line */}
        <p className="text-sm mb-12" style={{ color: C.muted }}>
          No inventory · No hidden fees · WhatsApp support within 24 hrs
        </p>

        {/* Testimonial strip */}
        {/* TODO: replace with a real seller quote */}
        <div
          className="inline-flex items-center gap-4 px-5 py-4 rounded-2xl text-left max-w-lg mx-auto"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          {/* Avatar placeholder */}
          <div
            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-black"
            style={{ background: C.indigoDim, color: C.indigo, border: `1px solid ${C.indigoBorder}` }}
          >
            {/* TODO: replace with real <Image> */}
            A
          </div>
          <div>
            <p className="text-sm leading-relaxed" style={{ color: C.heading }}>
              &ldquo;Went from 0 to 300+ orders/month in 60 days — and I never touched a package.&rdquo;
            </p>
            {/* TODO: replace with real seller name + city */}
            <p className="text-xs mt-1" style={{ color: C.muted }}>Ajay M., Surat — Home &amp; Kitchen</p>
          </div>
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs"
            style={{ background: C.goldDim, color: C.gold }}
          >
            ★
          </div>
        </div>
      </div>
    </section>
  );
}

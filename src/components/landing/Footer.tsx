import { C, WA_LINK } from "./constants";

const NAV = [
  { label: "Products",     href: "#products"    },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Plans",        href: "#plans"        },
  { label: "FAQs",         href: "#faqs"         },
  { label: "WhatsApp",     href: WA_LINK, external: true },
];

const LEGAL = [
  { label: "Terms of Service", href: "/terms"   },
  { label: "Privacy Policy",   href: "/privacy" },
  { label: "Refund Policy",    href: "/refund"  },
];

export function Footer() {
  return (
    <footer style={{ background: C.navy, borderTop: `1px solid ${C.border}` }}>

      {/* ── Top link strip ─────────────────────────────────────────────── */}
      <div
        className="max-w-[1200px] mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        {/* Nav links */}
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {NAV.map((item) =>
            item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="text-sm transition-opacity hover:opacity-70"
                style={{ color: C.body }}
              >
                {item.label}
              </a>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="text-sm transition-opacity hover:opacity-70"
                style={{ color: C.body }}
              >
                {item.label}
              </a>
            )
          )}
        </div>

        {/* Legal links */}
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {LEGAL.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-xs transition-opacity hover:opacity-70"
              style={{ color: C.muted }}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ─────────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">

        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black"
            style={{ background: C.gold, color: C.navy }}
          >
            A
          </div>
          <span className="font-black text-sm" style={{ color: C.heading, fontFamily: "var(--font-space)" }}>
            Axiqen
          </span>
        </div>

        {/* Copyright */}
        <p className="text-xs text-center" style={{ color: C.muted }}>
          © {new Date().getFullYear()} Axiqen — A Vrinandya Ventures Product. India&apos;s COD Dropshipping Platform.
        </p>

        {/* Auth links */}
        <div className="flex items-center gap-4 text-sm">
          <a
            href="/login"
            className="transition-opacity hover:opacity-70"
            style={{ color: C.body }}
          >
            Login
          </a>
          <a
            href="/signup"
            className="px-3 py-1 rounded-lg font-semibold transition-opacity hover:opacity-80"
            style={{ background: C.indigoDim, color: C.indigo, border: `1px solid ${C.indigoBorder}` }}
          >
            Register
          </a>
        </div>
      </div>

    </footer>
  );
}

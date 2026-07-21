import Link from "next/link";
import { C, WA_LINK } from "./constants";

const LINKS = {
  Platform: [
    { label: "Products",     href: "#products" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Plans",        href: "#plans" },
    { label: "FAQs",         href: "#faqs" },
  ],
  Company: [
    { label: "About",     href: "#" }, // TODO: add about page
    { label: "Contact",   href: "#" }, // TODO: add contact page
    { label: "WhatsApp",  href: WA_LINK, external: true },
  ],
  Legal: [
    { label: "Terms of Service", href: "/terms" },   // TODO: add page
    { label: "Privacy Policy",   href: "/privacy" }, // TODO: add page
    { label: "Refund Policy",    href: "/refund" },  // TODO: add page
  ],
};

export function Footer() {
  return (
    <footer
      className="py-16 px-6"
      style={{ background: C.navy, borderTop: `1px solid ${C.border}` }}
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
                style={{ background: C.gold, color: C.navy }}
              >
                A
              </div>
              <span
                className="font-black text-base"
                style={{ color: C.heading, fontFamily: "var(--font-space)" }}
              >
                Axiqen
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-4 max-w-[200px]" style={{ color: C.body }}>
              India&apos;s done-for-you COD dropshipping platform.
            </p>
            <p className="text-xs" style={{ color: C.muted }}>
              A Vrinandya Ventures Product. Made in India 🇮🇳
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([section, items]) => (
            <div key={section}>
              <p
                className="text-xs font-black uppercase tracking-widest mb-4"
                style={{ color: C.muted }}
              >
                {section}
              </p>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.label}>
                    {"external" in item && item.external ? (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm transition-colors"
                        style={{ color: C.body }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = C.indigo)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = C.body)}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <a
                        href={item.href}
                        className="text-sm transition-colors"
                        style={{ color: C.body }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = C.indigo)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = C.body)}
                      >
                        {item.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs"
          style={{ borderTop: `1px solid ${C.border}`, color: C.muted }}
        >
          <p>© {new Date().getFullYear()} Axiqen — A Vrinandya Ventures Product.</p>
          <p>connect@vrinandyaventures.in · +91 85339 49379</p>
        </div>
      </div>
    </footer>
  );
}

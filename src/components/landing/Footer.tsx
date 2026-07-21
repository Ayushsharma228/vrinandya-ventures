import { C } from "./constants";

export function Footer() {
  return (
    <footer style={{ background: C.navy, borderTop: `1px solid ${C.border}` }}>
      <div className="max-w-[1200px] mx-auto px-6 py-5 flex items-center justify-between">

        <span className="font-black text-sm" style={{ color: C.heading, fontFamily: "var(--font-space)" }}>
          Axiqen
        </span>

        <p className="text-xs" style={{ color: C.muted }}>
          © {new Date().getFullYear()} Axiqen. India&apos;s COD Dropshipping Platform.
        </p>

        <div className="flex items-center gap-4 text-sm" style={{ color: C.body }}>
          <a href="/login"  className="hover:opacity-70 transition-opacity">Login</a>
          <a href="/signup" className="hover:opacity-70 transition-opacity">Register</a>
        </div>

      </div>
    </footer>
  );
}

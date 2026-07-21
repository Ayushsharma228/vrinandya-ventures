"use client";
import { useState, useEffect, useRef } from "react";
import { C, WA_LINK } from "./constants";

export function MobileBar() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const applySection = document.getElementById("apply");
    if (!applySection) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(applySection);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden transition-all duration-300 safe-area-inset-bottom"
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? "translateY(0)" : "translateY(100%)",
        pointerEvents: visible ? "auto" : "none",
        background: C.navy,
        borderTop: `1px solid ${C.border}`,
        padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex gap-3">
        <a
          href={WA_LINK}
          target="_blank"
          rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-lg text-sm font-black transition-all active:scale-95"
          style={{ background: C.indigoDim, color: C.indigo, border: `1px solid ${C.indigoBorder}`, borderRadius: 8 }}
        >
          💬 WhatsApp
        </a>
        <a
          href="#apply"
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-lg text-sm font-black transition-all active:scale-95"
          style={{ background: C.gold, color: C.navy, borderRadius: 8 }}
        >
          Apply Now
        </a>
      </div>
    </div>
  );
}

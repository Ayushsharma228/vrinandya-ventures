"use client";
import { useState } from "react";
import { C } from "./constants";

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      className="relative flex items-center justify-center gap-2 py-2.5 px-6 text-sm font-semibold"
      style={{ background: C.gold, color: C.navy }}
    >
      🎉{" "}
      <span>
        <strong>Free onboarding this week</strong> — first 10 orders fulfilled on us. Limited slots.{" "}
        <a href="#apply" className="underline font-bold" style={{ color: C.navy }}>
          Claim yours →
        </a>
      </span>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        className="absolute right-4 opacity-60 hover:opacity-100 transition-opacity text-xl leading-none"
        style={{ color: C.navy }}
      >
        ×
      </button>
    </div>
  );
}

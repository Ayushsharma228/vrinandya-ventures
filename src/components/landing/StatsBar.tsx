import { C } from "./constants";

const STATS = [
  { value: "18,000+",      label: "Pin Codes Covered" },
  { value: "Every Monday", label: "Payout, Without Fail" },
  { value: "24 hrs",       label: "Avg. Onboarding Time" },
  { value: "1:1",          label: "Dedicated Account Manager" },
];

export function StatsBar() {
  return (
    <section style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p
                className="text-3xl md:text-4xl font-black mb-1.5"
                style={{ color: C.gold, fontFamily: "var(--font-space)", letterSpacing: "-0.02em" }}
              >
                {s.value}
              </p>
              <p className="text-sm font-medium" style={{ color: C.body }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

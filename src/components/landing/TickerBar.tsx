"use client";

const ITEMS = [
  { icon: "📦", label: "Order Management" },
  { icon: "🚀", label: "Shipping Automation" },
  { icon: "✅", label: "80%+ Delivery Rate" },
  { icon: "🛒", label: "Shopify Ready" },
  { icon: "📊", label: "Real-Time Analytics" },
  { icon: "⚡", label: "Scale Fast" },
  { icon: "🛡️", label: "RTO Reduction" },
  { icon: "🤖", label: "AI Powered" },
  { icon: "🏷️", label: "100+ Dropshippers" },
  { icon: "💰", label: "₹10Cr+ GMV" },
];

// Duplicate for seamless loop
const TRACK = [...ITEMS, ...ITEMS];

export function TickerBar() {
  return (
    <div
      style={{
        background: "#0048DF",
        overflow: "hidden",
        padding: "7px 0",
        borderTop: "1px solid rgba(255,255,255,0.12)",
      }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes axqen-ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .axqen-ticker-track {
          display: flex;
          width: max-content;
          animation: axqen-ticker 28s linear infinite;
        }
        .axqen-ticker-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="axqen-ticker-track">
        {TRACK.map((item, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0 1.6rem",
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "#ffffff",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-space), system-ui, sans-serif",
              letterSpacing: "0.01em",
              borderRight: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <span style={{ fontSize: "0.85rem" }}>{item.icon}</span>
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const [selected, setSelected] = useState<"DROPSHIPPING" | "MARKETPLACE" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSelectPlan() {
    if (!selected) return;
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/select-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: selected }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    await update({ plan: selected });
    window.location.href = "/seller";
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white">Choose Your Plan</h1>
        <p className="text-gray-300 mt-2">Select how you want to sell your products</p>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4 mb-6">
        {/* Dropshipping Plan */}
        <button
          onClick={() => setSelected("DROPSHIPPING")}
          className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
            selected === "DROPSHIPPING"
              ? "border-purple-500 bg-purple-500/20"
              : "border-white/20 bg-white/5 hover:bg-white/10"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 ${
              selected === "DROPSHIPPING" ? "border-purple-500" : "border-white/40"
            }`}>
              {selected === "DROPSHIPPING" && (
                <div className="w-3 h-3 rounded-full bg-purple-500" />
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Dropshipping</h3>
              <p className="text-gray-300 text-sm mt-1">
                Push products directly to your Shopify store. Automate inventory
                sync and order fulfillment.
              </p>
              <ul className="text-gray-400 text-xs mt-2 space-y-1">
                <li>✓ Push products to Shopify</li>
                <li>✓ Auto order sync from Shopify</li>
                <li>✓ AWB generation & tracking</li>
              </ul>
            </div>
          </div>
        </button>

        {/* Marketplace Plan */}
        <button
          onClick={() => setSelected("MARKETPLACE")}
          className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
            selected === "MARKETPLACE"
              ? "border-purple-500 bg-purple-500/20"
              : "border-white/20 bg-white/5 hover:bg-white/10"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center flex-shrink-0 ${
              selected === "MARKETPLACE" ? "border-purple-500" : "border-white/40"
            }`}>
              {selected === "MARKETPLACE" && (
                <div className="w-3 h-3 rounded-full bg-purple-500" />
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Marketplace</h3>
              <p className="text-gray-300 text-sm mt-1">
                List products on Amazon, eBay, Etsy, Walmart and more.
                Our team handles the listing process for you.
              </p>
              <ul className="text-gray-400 text-xs mt-2 space-y-1">
                <li>✓ List on Amazon, eBay, Etsy, Walmart</li>
                <li>✓ Admin-managed listings</li>
                <li>✓ Sync orders from all marketplaces</li>
                <li>✓ AWB generation & tracking</li>
              </ul>
            </div>
          </div>
        </button>
      </div>

      <button
        onClick={handleSelectPlan}
        disabled={!selected || loading}
        className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
      >
        {loading ? "Setting up your account..." : "Continue"}
      </button>
    </div>
  );
}

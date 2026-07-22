"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, Check, ChevronRight, Store, Package,
  Zap, TrendingUp, Crown,
} from "lucide-react";

const BLUE   = "#0048DF";
const BLUEDIM = "rgba(0,72,223,0.08)";
const BLUEBORDER = "rgba(0,72,223,0.25)";

const PLANS = {
  DROPSHIPPING: [
    {
      tier: "STARTER", label: "Starter", price: 10000,
      features: ["Premium Shopify Store", "1-Year Domain", "Payment Gateway Setup", "Product Import (Up to 100)", "Winning Product Research", "Basic Training", "30 Days Support"],
      icon: Zap,
    },
    {
      tier: "GROWTH", label: "Growth", price: 25000, popular: true,
      features: ["AI Dashboard", "Meta Pixel Setup", "Premium Theme", "Product Optimization", "Supplier Management", "NDR Management", "Free Shipping Setup", "Priority Support"],
      icon: TrendingUp,
    },
    {
      tier: "SCALE", label: "Scale", price: 50000,
      features: ["Dedicated Account Manager", "Unlimited Product Import", "AI Commerce Dashboard", "Priority Operations", "Advanced Analytics", "Custom Branding", "Faster Turnaround"],
      icon: Crown,
    },
  ],
  MARKETPLACE: [
    {
      tier: "STARTER", label: "Starter", price: 5000,
      features: ["Amazon Management", "Flipkart Management", "Meesho Management", "Product Listing (Up to 100)", "Inventory Updates", "Order Monitoring", "Basic Reports"],
      icon: Zap,
    },
    {
      tier: "GROWTH", label: "Growth", price: 10000, popular: true,
      features: ["Catalog Optimization", "SEO Listings", "A+ Content Guidance", "Return Management", "NDR Management", "Priority Support", "Weekly Reports"],
      icon: TrendingUp,
    },
    {
      tier: "SCALE", label: "Scale", price: 20000,
      features: ["Dedicated Account Manager", "Unlimited Listings", "Brand Registry Support", "Performance Dashboard", "Competitor Analysis", "Buy Box Monitoring"],
      icon: Crown,
    },
  ],
};


const STEPS = ["Account", "Service", "Plan"];

const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm outline-none border focus:ring-2 focus:border-blue-500 transition-all";
const inputStyle = { background: "#fff", borderColor: "#e5e7eb", color: "#0A0E1A" };

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={
                  done   ? { background: BLUE,            color: "white" } :
                  active ? { background: BLUE,            color: "white" } :
                           { background: "#e9ecef",       color: "#9ca3af" }
                }
              >
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-xs mt-1 font-medium"
                style={{ color: active || done ? BLUE : "#9ca3af" }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-12 h-0.5 mb-4 mx-1"
                style={{ background: i < current ? BLUE : "#e9ecef" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep]       = useState(0);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);

  const [service, setService]     = useState<"DROPSHIPPING" | "MARKETPLACE" | "">("");
  const [planTier, setPlanTier]   = useState("");

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, username, password, confirmPassword: confirm }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) { setError("Account created but sign-in failed. Please log in."); setLoading(false); return; }
    setStep(1); setLoading(false);
  }

  async function saveStep(payload: Record<string, unknown>): Promise<boolean> {
    try {
      const res = await fetch("/api/onboarding/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) { setError("Session expired. Please sign in again."); setLoading(false); return false; }
      if (!res.ok) { const d = await res.json().catch(() => ({ error: "Something went wrong" })); setError(d.error ?? "Something went wrong"); setLoading(false); return false; }
      return true;
    } catch {
      setError("Network error. Please try again."); setLoading(false); return false;
    }
  }

  async function handleService() {
    if (!service) return;
    setError(""); setLoading(true);
    const ok = await saveStep({ step: "service", service });
    if (ok) { setStep(2); setLoading(false); }
  }

  async function handlePlan() {
    if (!planTier) return;
    setError(""); setLoading(true);
    const ok = await saveStep({ step: "plan", planTier });
    if (ok) { router.push("/onboarding"); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "#f8f9fa" }}>

      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: BLUE }}>
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg" style={{ color: "#0A0E1A" }}>Axiqen</span>
          </div>
          <p className="text-sm" style={{ color: "#6B7280" }}>Create your seller account</p>
        </div>

        <StepBar current={step} />

        {/* Card */}
        <div className="rounded-2xl p-8 bg-white shadow-sm" style={{ border: "1px solid #e5e7eb" }}>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}>
              {error}{" "}
              {(error.includes("sign in") || error.includes("Session")) && (
                <Link href="/login" className="underline font-bold">Sign in here →</Link>
              )}
            </div>
          )}

          {/* ── Step 0: Account ── */}
          {step === 0 && (
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <h2 className="text-xl font-bold mb-1" style={{ color: "#0A0E1A" }}>Create your account</h2>
              <p className="text-sm mb-5" style={{ color: "#6B7280" }}>Fill in your details to get started</p>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Full Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required
                  placeholder="Your full name" className={inputCls} style={inputStyle} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="you@example.com" className={inputCls} style={inputStyle} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Username</label>
                <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} required
                  placeholder="your_username" className={`${inputCls} font-mono`} style={inputStyle} />
                <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Lowercase letters, numbers, underscores only</p>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                    placeholder="Min. 8 characters" className={`${inputCls} pr-10`} style={inputStyle} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>Confirm Password</label>
                <input type={showPw ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} required
                  placeholder="Re-enter password" className={inputCls} style={inputStyle} />
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2 text-white"
                style={{ background: BLUE }}>
                {loading ? "Creating account..." : <><span>Create Account</span><ChevronRight className="w-4 h-4" /></>}
              </button>

              <p className="text-center text-xs" style={{ color: "#6B7280" }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: BLUE }} className="font-semibold hover:opacity-80">Sign in</Link>
              </p>
            </form>
          )}

          {step > 0 && (
            <p className="text-center text-xs mt-5 pt-5" style={{ color: "#9CA3AF", borderTop: "1px solid #F3F4F6" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: BLUE }} className="font-semibold hover:opacity-80">Sign in</Link>
            </p>
          )}

          {/* ── Step 1: Service ── */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: "#0A0E1A" }}>Choose your service</h2>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Select how you want to sell your products</p>

              <div className="space-y-4 mb-6">
                {[
                  {
                    value: "DROPSHIPPING" as const,
                    label: "Dropshipping",
                    desc: "Push products to your Shopify store. We handle fulfilment end-to-end.",
                    icon: Package,
                    features: ["Shopify integration", "Auto order sync", "AWB generation & tracking"],
                  },
                  {
                    value: "MARKETPLACE" as const,
                    label: "Marketplace",
                    desc: "List on Amazon, Flipkart, Meesho and more — our team manages listings.",
                    icon: Store,
                    features: ["Multi-platform listings", "Admin-managed listings", "Order sync from all platforms"],
                  },
                ].map((opt) => {
                  const Icon   = opt.icon;
                  const active = service === opt.value;
                  return (
                    <button key={opt.value} onClick={() => setService(opt.value)}
                      className="w-full p-5 rounded-xl text-left transition-all"
                      style={{
                        border:     `2px solid ${active ? BLUE : "#e5e7eb"}`,
                        background: active ? BLUEDIM : "#fafafa",
                      }}>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: active ? BLUEDIM : "#f3f4f6" }}>
                          <Icon className="w-5 h-5" style={{ color: active ? BLUE : "#9CA3AF" }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold" style={{ color: "#0A0E1A" }}>{opt.label}</h3>
                            {active && <Check className="w-4 h-4" style={{ color: BLUE }} />}
                          </div>
                          <p className="text-sm mt-0.5 mb-2" style={{ color: "#6B7280" }}>{opt.desc}</p>
                          <div className="flex flex-wrap gap-2">
                            {opt.features.map((f) => (
                              <span key={f} className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: "#f3f4f6", color: "#6B7280" }}>{f}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button onClick={handleService} disabled={!service || loading}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 text-white"
                style={{ background: BLUE }}>
                {loading ? "Saving..." : <><span>Continue</span><ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
          )}

          {/* ── Step 2: Plan ── */}
          {step === 2 && service && (
            <div>
              <h2 className="text-xl font-bold mb-1" style={{ color: "#0A0E1A" }}>Select your plan</h2>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
                Choose a {service === "DROPSHIPPING" ? "Dropshipping" : "Marketplace"} plan
              </p>

              <div className="space-y-3 mb-6">
                {PLANS[service].map((plan) => {
                  const Icon   = plan.icon;
                  const active = planTier === plan.tier;
                  return (
                    <button key={plan.tier} onClick={() => setPlanTier(plan.tier)}
                      className="w-full p-4 rounded-xl text-left transition-all relative overflow-hidden"
                      style={{
                        border:     `2px solid ${active ? BLUE : "#e5e7eb"}`,
                        background: active ? BLUEDIM : "#fafafa",
                      }}>
                      {"popular" in plan && plan.popular && (
                        <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-semibold text-white"
                          style={{ background: BLUE }}>Popular</span>
                      )}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: active ? BLUE : "#f3f4f6" }}>
                          <Icon className="w-4 h-4" style={{ color: active ? "white" : "#9CA3AF" }} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: "#0A0E1A" }}>{plan.label}</p>
                          <p className="font-bold" style={{ color: BLUE }}>
                            ₹{plan.price.toLocaleString("en-IN")}
                            <span className="text-xs font-normal ml-1" style={{ color: "#9CA3AF" }}>one-time</span>
                          </p>
                        </div>
                        {active && <Check className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: BLUE }} />}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {plan.features.map((f) => (
                          <span key={f} className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "#f3f4f6", color: "#6B7280" }}>{f}</span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button onClick={handlePlan} disabled={!planTier || loading}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 text-white"
                style={{ background: BLUE }}>
                {loading ? "Saving..." : <><span>Continue</span><ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}

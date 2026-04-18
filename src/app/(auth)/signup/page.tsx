"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, Check, ChevronRight, Store, Package,
  Zap, TrendingUp, Crown, Copy, CheckCheck,
} from "lucide-react";

// ── Plan data ──────────────────────────────────────────────────────────────

const PLANS = {
  DROPSHIPPING: [
    {
      tier: "STARTER", label: "Starter", price: 5000,
      color: "#3B82F6", bg: "#EFF6FF",
      features: ["Up to 50 products", "Shopify integration", "AWB generation", "Order tracking", "Email support"],
      icon: Zap,
    },
    {
      tier: "GROWTH", label: "Growth", price: 15000,
      color: "#7C3AED", bg: "#F5F3FF",
      popular: true,
      features: ["Up to 200 products", "Priority AWB", "Advanced analytics", "WhatsApp updates", "RTO protection", "Priority support"],
      icon: TrendingUp,
    },
    {
      tier: "PRO", label: "Pro", price: 30000,
      color: "#00C67A", bg: "#F0FDF4",
      features: ["Unlimited products", "Dedicated manager", "Custom branding", "Fastest AWB", "Full RTO protection", "Custom integrations", "24/7 support"],
      icon: Crown,
    },
  ],
  MARKETPLACE: [
    {
      tier: "BASIC", label: "Basic", price: 15000,
      color: "#3B82F6", bg: "#EFF6FF",
      features: ["List on 2 marketplaces", "Admin-managed listings", "Order sync", "AWB tracking", "Email support"],
      icon: Zap,
    },
    {
      tier: "STANDARD", label: "Standard", price: 25000,
      color: "#7C3AED", bg: "#F5F3FF",
      popular: true,
      features: ["List on 4 marketplaces", "Priority listings", "Advanced analytics", "Dedicated support", "WhatsApp updates", "RTO protection"],
      icon: TrendingUp,
    },
    {
      tier: "PREMIUM", label: "Premium", price: 30000,
      color: "#00C67A", bg: "#F0FDF4",
      features: ["All marketplaces", "Unlimited listings", "Dedicated manager", "Priority AWB", "Full RTO protection", "Custom solutions", "24/7 support"],
      icon: Crown,
    },
  ],
};

const BANK_NAME    = process.env.NEXT_PUBLIC_BANK_NAME    ?? "HDFC Bank";
const BANK_HOLDER  = process.env.NEXT_PUBLIC_BANK_HOLDER  ?? "Vrinandya Ventures";
const BANK_ACCOUNT = process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "XXXXXXXXXXXX";
const BANK_IFSC    = process.env.NEXT_PUBLIC_BANK_IFSC    ?? "HDFC0000000";
const UPI_ID       = process.env.NEXT_PUBLIC_UPI_ID       ?? "vrinandya@upi";

// ── Step indicator ─────────────────────────────────────────────────────────

const STEPS = ["Account", "Service", "Plan", "Payment"];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={done
                  ? { background: "#00C67A", color: "white" }
                  : active
                  ? { background: "white", color: "#0D1F13" }
                  : { background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.4)" }}>
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-xs mt-1 font-medium"
                style={{ color: active ? "white" : done ? "#00C67A" : "rgba(255,255,255,0.35)" }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-12 h-0.5 mb-4 mx-1" style={{ background: i < current ? "#00C67A" : "rgba(255,255,255,0.15)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 0 — account
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [username, setUsername]       = useState("");
  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [showPw, setShowPw]           = useState(false);

  // Step 1 — service
  const [service, setService]         = useState<"DROPSHIPPING" | "MARKETPLACE" | "">("");

  // Step 2 — plan
  const [planTier, setPlanTier]       = useState("");

  // Step 3 — payment
  const [paymentRef, setPaymentRef]   = useState("");
  const [copied, setCopied]           = useState<string | null>(null);

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  }

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

    // Auto sign-in
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) { setError("Account created but sign-in failed. Please log in."); setLoading(false); return; }

    setStep(1);
    setLoading(false);
  }

  async function handleService() {
    if (!service) return;
    setError(""); setLoading(true);
    const res = await fetch("/api/onboarding/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "service", service }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); setLoading(false); return; }
    setStep(2);
    setLoading(false);
  }

  async function handlePlan() {
    if (!planTier) return;
    setError(""); setLoading(true);
    const res = await fetch("/api/onboarding/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "plan", planTier }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); setLoading(false); return; }
    setStep(3);
    setLoading(false);
  }

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentRef.trim()) { setError("Enter your payment reference / UTR number"); return; }
    setError(""); setLoading(true);
    const res = await fetch("/api/onboarding/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: "payment", paymentReference: paymentRef }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); setLoading(false); return; }
    router.push("/onboarding");
  }

  const selectedPlan = service ? PLANS[service].find((p) => p.tier === planTier) : null;
  const planAmount = selectedPlan?.price ?? 0;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, #0D1117 0%, #0D2818 60%, #0a1f12 100%)" }}>

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #00C67A, transparent)" }} />
        <div className="absolute -bottom-20 left-1/4 w-72 h-72 rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #3B82F6, transparent)" }} />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#00C67A" }}>
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg">Vrinandya Ventures</span>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Create your seller account</p>
        </div>

        <StepBar current={step} />

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
              {error}
            </div>
          )}

          {/* ── Step 0: Account ── */}
          {step === 0 && (
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-1">Create your account</h2>
              <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>Fill in your details to get started</p>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Full Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required
                  placeholder="Your full name"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-green-500"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-green-500"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Username</label>
                <input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} required
                  placeholder="your_username"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-green-500 font-mono"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} />
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>Lowercase letters, numbers, underscores only</p>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                    placeholder="Min. 8 characters"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-green-500"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Confirm Password</label>
                <input type={showPw ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} required
                  placeholder="Re-enter password"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-green-500"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} />
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
                style={{ background: "#00C67A", color: "white" }}>
                {loading ? "Creating account..." : <><span>Create Account</span><ChevronRight className="w-4 h-4" /></>}
              </button>

              <p className="text-center text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                Already have an account?{" "}
                <Link href="/login?zone=seller" className="text-green-400 hover:text-green-300">Sign in</Link>
              </p>
            </form>
          )}

          {/* ── Step 1: Service ── */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Choose your service</h2>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>Select how you want to sell your products</p>

              <div className="space-y-4 mb-6">
                {[
                  {
                    value: "DROPSHIPPING" as const,
                    label: "Dropshipping",
                    desc: "Push products directly to your Shopify store. We handle fulfillment end-to-end.",
                    icon: Package,
                    features: ["Shopify integration", "Auto order sync", "AWB generation & tracking"],
                  },
                  {
                    value: "MARKETPLACE" as const,
                    label: "Marketplace",
                    desc: "List products on Amazon, eBay, Etsy, Walmart and more — our team manages listings.",
                    icon: Store,
                    features: ["Multi-platform listings", "Admin-managed listings", "Order sync from all platforms"],
                  },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const active = service === opt.value;
                  return (
                    <button key={opt.value} onClick={() => setService(opt.value)}
                      className="w-full p-5 rounded-xl text-left transition-all"
                      style={{
                        border: `2px solid ${active ? "#00C67A" : "rgba(255,255,255,0.12)"}`,
                        background: active ? "rgba(0,198,122,0.1)" : "rgba(255,255,255,0.04)",
                      }}>
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: active ? "rgba(0,198,122,0.2)" : "rgba(255,255,255,0.08)" }}>
                          <Icon className="w-5 h-5" style={{ color: active ? "#00C67A" : "rgba(255,255,255,0.5)" }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-semibold">{opt.label}</h3>
                            {active && <Check className="w-4 h-4" style={{ color: "#00C67A" }} />}
                          </div>
                          <p className="text-sm mt-0.5 mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>{opt.desc}</p>
                          <div className="flex flex-wrap gap-2">
                            {opt.features.map((f) => (
                              <span key={f} className="text-xs px-2 py-0.5 rounded-full"
                                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>{f}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button onClick={handleService} disabled={!service || loading}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: "#00C67A", color: "white" }}>
                {loading ? "Saving..." : <><span>Continue</span><ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
          )}

          {/* ── Step 2: Plan ── */}
          {step === 2 && service && (
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Select your plan</h2>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
                Choose a {service === "DROPSHIPPING" ? "Dropshipping" : "Marketplace"} plan
              </p>

              <div className="space-y-3 mb-6">
                {PLANS[service].map((plan) => {
                  const Icon = plan.icon;
                  const active = planTier === plan.tier;
                  return (
                    <button key={plan.tier} onClick={() => setPlanTier(plan.tier)}
                      className="w-full p-4 rounded-xl text-left transition-all relative overflow-hidden"
                      style={{
                        border: `2px solid ${active ? plan.color : "rgba(255,255,255,0.1)"}`,
                        background: active ? `${plan.bg}18` : "rgba(255,255,255,0.03)",
                      }}>
                      {"popular" in plan && plan.popular && (
                        <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: plan.color, color: "white" }}>Popular</span>
                      )}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: active ? plan.color : "rgba(255,255,255,0.08)" }}>
                          <Icon className="w-4 h-4" style={{ color: active ? "white" : "rgba(255,255,255,0.5)" }} />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{plan.label}</p>
                          <p className="font-bold" style={{ color: plan.color }}>
                            ₹{plan.price.toLocaleString("en-IN")}
                            <span className="text-xs font-normal ml-1" style={{ color: "rgba(255,255,255,0.35)" }}>one-time</span>
                          </p>
                        </div>
                        {active && <Check className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: plan.color }} />}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {plan.features.map((f) => (
                          <span key={f} className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>{f}</span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button onClick={handlePlan} disabled={!planTier || loading}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: "#00C67A", color: "white" }}>
                {loading ? "Saving..." : <><span>Continue</span><ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
          )}

          {/* ── Step 3: Payment ── */}
          {step === 3 && (
            <form onSubmit={handlePayment}>
              <h2 className="text-xl font-bold text-white mb-1">Complete payment</h2>
              <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>
                Transfer ₹{planAmount.toLocaleString("en-IN")} to the details below, then enter your UTR/reference number.
              </p>

              {/* Amount box */}
              <div className="rounded-xl p-4 mb-5 text-center" style={{ background: "rgba(0,198,122,0.1)", border: "1px solid rgba(0,198,122,0.25)" }}>
                <p className="text-xs font-medium mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>Amount to pay</p>
                <p className="text-3xl font-bold text-white">₹{planAmount.toLocaleString("en-IN")}</p>
                <p className="text-xs mt-1" style={{ color: "#00C67A" }}>{selectedPlan?.label} Plan · {service === "MARKETPLACE" ? "Marketplace" : "Dropshipping"}</p>
              </div>

              {/* Bank details */}
              <div className="rounded-xl p-4 mb-5 space-y-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>Bank Transfer</p>
                {[
                  { label: "Account Name",   value: BANK_HOLDER },
                  { label: "Account Number", value: BANK_ACCOUNT },
                  { label: "IFSC Code",      value: BANK_IFSC },
                  { label: "Bank Name",      value: BANK_NAME },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-white">{value}</span>
                      <button type="button" onClick={() => copyText(value, label)}
                        className="p-1 rounded transition-colors" style={{ color: copied === label ? "#00C67A" : "rgba(255,255,255,0.3)" }}>
                        {copied === label ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}

                <div className="border-t border-white/10 pt-3 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>UPI</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>UPI ID</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-white">{UPI_ID}</span>
                      <button type="button" onClick={() => copyText(UPI_ID, "upi")}
                        className="p-1 rounded" style={{ color: copied === "upi" ? "#00C67A" : "rgba(255,255,255,0.3)" }}>
                        {copied === "upi" ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {/* QR Code */}
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <div className="bg-white p-2 rounded-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(BANK_HOLDER)}&am=${planAmount}&cu=INR&tn=${encodeURIComponent("Vrinandya Ventures Plan Payment")}`)}`}
                        alt="Scan to pay via UPI"
                        width={160}
                        height={160}
                        className="rounded-lg"
                      />
                    </div>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Scan with any UPI app to pay ₹{planAmount.toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>

              {/* UTR input */}
              <div className="mb-5">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Payment Reference / UTR Number *
                </label>
                <input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="Enter UTR or transaction reference"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-green-500 font-mono"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} />
                <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                  You&apos;ll find this in your bank app after the transfer. Your account will be activated within 24–48 hours.
                </p>
              </div>

              <button type="submit" disabled={loading || !paymentRef.trim()}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: "#00C67A", color: "white" }}>
                {loading ? "Submitting..." : "Submit Payment & Continue →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

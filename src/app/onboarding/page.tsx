"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  FileText, Building2, Landmark, ShieldCheck, CheckCircle2,
  ChevronRight, ChevronLeft, Zap, TrendingUp, Crown, Upload,
  Loader2, Check, ArrowRight, Sparkles, CreditCard, Lock,
} from "lucide-react";

// ─── Plan display data ────────────────────────────────────────────────────────

function Store(props: React.SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}

const PLAN_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType; price: string }> = {
  STARTER:      { label: "Starter",      color: "#3B82F6", bg: "#EFF6FF", icon: Zap,        price: "₹5,000/mo" },
  GROWTH:       { label: "Growth",       color: "#7C3AED", bg: "#F5F3FF", icon: TrendingUp,  price: "₹15,000/mo" },
  PRO:          { label: "Pro",          color: "#4361EE", bg: "#EEF2FF", icon: Crown,       price: "₹30,000/mo" },
  BASIC:        { label: "Basic",        color: "#3B82F6", bg: "#EFF6FF", icon: Zap,        price: "₹15,000/mo" },
  STANDARD:     { label: "Standard",     color: "#7C3AED", bg: "#F5F3FF", icon: TrendingUp,  price: "₹25,000/mo" },
  PREMIUM:      { label: "Premium",      color: "#4361EE", bg: "#EEF2FF", icon: Crown,       price: "₹30,000/mo" },
  DROPSHIPPING: { label: "Dropshipping", color: "#4361EE", bg: "#EEF2FF", icon: Zap,        price: "" },
  MARKETPLACE:  { label: "Marketplace",  color: "#7C3AED", bg: "#F5F3FF", icon: Store,       price: "" },
  // New tiers from landing page
  LAUNCH:       { label: "Launch",       color: "#4361EE", bg: "#EEF2FF", icon: Zap,        price: "₹25,000" },
  SCALE:        { label: "Scale",        color: "#7C3AED", bg: "#F5F3FF", icon: TrendingUp,  price: "₹35,000" },
  ENTERPRISE:   { label: "Enterprise",   color: "#D4AF37", bg: "#FFFBEB", icon: Crown,       price: "₹50,000" },
};

// Display label for plan payment amounts
const TIER_DISPLAY: Record<string, string> = {
  launch:     "₹25,000",
  scale:      "₹35,000",
  enterprise: "₹50,000",
};

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = [
  { id: "agreement", label: "Agreement",    icon: FileText    },
  { id: "payment",   label: "Payment",      icon: CreditCard  },
  { id: "business",  label: "Business",     icon: Building2   },
  { id: "bank",      label: "Bank Account", icon: Landmark    },
  { id: "kyc",       label: "KYC",          icon: ShieldCheck },
];

// ─── Razorpay global type ─────────────────────────────────────────────────────

declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => { open(): void };
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

// ─── Terms ────────────────────────────────────────────────────────────────────

const TERMS = `VRINANDYA VENTURES PRIVATE LIMITED
CLIENT SERVICE AGREEMENT

Registered Address: 4/210 UNT Gali, Kacheri Ghat, Taj Nagari, Agra – 282004, Uttar Pradesh
CIN: U63112UP2025PTC239392 | GST: 09AALCV7054P1ZD

─────────────────────────────────────────

1. DEFINITIONS

(A) "SERVICES" means the specific services selected by the Client, which may include dropshipping account management, e-commerce operations, digital marketing, social media management, brand building, or any combination thereof.
(B) "PLAN" means the specific service plan and tier selected by the Client, along with the associated service charge and inclusions.
(C) "SERVICE CHARGE" means the fee payable by the Client to the Company for the Services, exclusive of GST unless stated otherwise.
(D) "AD SPEND" means the advertising budget deployed on Meta (Facebook and Instagram) and/or any other advertising platform for running the Client's marketing campaigns.
(E) "PLATFORM(S)" means the e-commerce marketplaces, websites, and advertising platforms used in connection with the Services, including but not limited to Amazon, Flipkart, Meesho, Shopify, and Meta.
(F) "DASHBOARD" means the Company's client dashboard through which the Client may track orders, performance, and reports.
(G) "NET PROFIT" means the amount by which the Client's total revenue exceeds the sum of: (i) product cost, (ii) shipping and logistics cost, (iii) ad spend, and (iv) the service charge, calculated cumulatively over the relevant period.

─────────────────────────────────────────

2. SCOPE OF SERVICES

(A) The Company shall provide the Services strictly in accordance with the Plan selected. Any service not explicitly listed shall be considered outside the scope and may be provided separately, subject to additional charges.
(B) The Company shall use commercially reasonable efforts, professional judgment, and industry-standard practices in performing the Services.
(C) The Client acknowledges that the Services involve third-party platforms (including Meta, Amazon, Flipkart, Shopify, and courier/logistics partners) whose policies, algorithms, and performance are outside the Company's control.

─────────────────────────────────────────

3. ONBOARDING & PLATFORM ACCESS

(A) The Client shall provide timely access to all relevant accounts, platforms, and systems required for the Company to perform the Services within 3 days of onboarding and within 3 days of any subsequent request.
(B) The Company shall commence Services only upon receipt of the required access and the first payment.
(C) The Client shall ensure all accounts and platforms are active, in good standing, and compliant with respective platform policies.

─────────────────────────────────────────

4. FEES & PAYMENT TERMS

(A) The Client shall pay the Company the Service Charge in accordance with the payment schedule specified in the applicable Plan.
(B) All amounts are exclusive of GST unless stated otherwise. GST shall be charged at the applicable rate.
(C) The Service Charge is non-refundable once the Services have commenced, except as expressly provided under Clause 9 (Profit Guarantee).
(D) Delayed payment beyond the due date may result in an immediate pause on all active Services.
(E) The Company reserves the right to withhold deliverables, reports, campaign access, and dashboard access in the event of non-payment.

─────────────────────────────────────────

5. ADVERTISING SPEND (META ADS)

(A) The Client shall be solely and entirely responsible for funding all Meta Ads spend.
(B) The Company shall not fund, advance, reimburse, or guarantee any ad spend on behalf of the Client.
(C) The Company shall manage campaigns strictly within the ad spend budget made available by the Client.

─────────────────────────────────────────

9. PROFIT GUARANTEE & REFUND OF SERVICE CHARGE

(A) If, at the end of a continuous ad campaign period of 3 consecutive months, the Client has not achieved a positive Net Profit, the Company shall refund the Service Charge paid for the corresponding 3-month period.
(B) This refund is strictly limited to the Service Charge and shall not extend to ad spend, product cost, shipping, platform fees, or any other cost.
(C) This guarantee is contingent on Meta Ads campaigns having run continuously throughout the 3-month period.
(F) This guarantee may be invoked only once during the term of this Agreement.

─────────────────────────────────────────

15. TERM & TERMINATION

(A) Either Party may terminate this Agreement by providing 15 days' prior written notice.
(C) The Company may terminate with immediate effect in the event of non-payment, abusive conduct, or breach of these terms.

─────────────────────────────────────────

18. GOVERNING LAW & JURISDICTION

This Agreement shall be governed by the laws of India. Courts at Agra, Uttar Pradesh shall have exclusive jurisdiction.

Email: connect@vrinandyaventures.in | Contact: +91 7060401016`;

// ─── Shared components ────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>{label}</label>
      {children}
      {hint && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{hint}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 text-sm rounded-xl outline-none"
      style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
      onFocus={(e) => { e.currentTarget.style.border = "1.5px solid var(--accent)"; }}
      onBlur={(e)  => { e.currentTarget.style.border = "1px solid var(--border)"; }}
    />
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [step,    setStep]    = useState(0);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [done,    setDone]    = useState(false);

  // Seller info
  const [sellerName,       setSellerName]       = useState("");
  const [plan,             setPlan]             = useState("");
  const [planTier,         setPlanTier]         = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [payingNow,        setPayingNow]        = useState(false);

  // Step fields
  const [agreed,    setAgreed]    = useState(false);
  const [business,  setBusiness]  = useState({ brandName: "", businessName: "", gstNumber: "", phone: "", businessAddress: "", pincode: "" });
  const [bank,      setBank]      = useState({ bankName: "", bankHolder: "", bankAccount: "", bankIfsc: "" });
  const [kyc,       setKyc]       = useState({ aadhaarNumber: "", aadhaarDocUrl: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?zone=seller");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/seller/onboarding")
      .then((r) => r.json())
      .then((d) => {
        setSellerName(d.name ?? "");
        setPlan(d.plan ?? "");
        setPlanTier(d.planTier ?? "");
        if (d.brandName)       setBusiness((b) => ({ ...b, brandName:       d.brandName }));
        if (d.businessName)    setBusiness((b) => ({ ...b, businessName:    d.businessName }));
        if (d.gstNumber)       setBusiness((b) => ({ ...b, gstNumber:       d.gstNumber }));
        if (d.phone)           setBusiness((b) => ({ ...b, phone:           d.phone }));
        if (d.businessAddress) setBusiness((b) => ({ ...b, businessAddress: d.businessAddress }));
        if (d.pincode)         setBusiness((b) => ({ ...b, pincode:         d.pincode }));
        if (d.bankName)        setBank((b) => ({ ...b, bankName:    d.bankName }));
        if (d.bankHolder)      setBank((b) => ({ ...b, bankHolder:  d.bankHolder }));
        if (d.bankAccount)     setBank((b) => ({ ...b, bankAccount: d.bankAccount }));
        if (d.bankIfsc)        setBank((b) => ({ ...b, bankIfsc:    d.bankIfsc }));
        if (d.aadhaarNumber)   setKyc((k) => ({ ...k, aadhaarNumber: d.aadhaarNumber }));
        if (d.agreementAccepted) setAgreed(true);
        // Resume past payment step if already paid
        if (d.paymentConfirmed) {
          setPaymentConfirmed(true);
          if (d.agreementAccepted) setStep(2);
        } else if (d.agreementAccepted) {
          setStep(1); // go straight to payment
        }
      })
      .catch(() => {});
  }, []);

  const save = useCallback(async (data: Record<string, unknown>, stepName: string): Promise<boolean> => {
    setSaving(true); setError("");
    const r = await fetch("/api/seller/onboarding", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ step: stepName, ...data }),
    });
    const json = await r.json();
    if (!r.ok) { setError(json.error ?? "Failed to save. Please try again."); setSaving(false); return false; }
    setSaving(false);
    return true;
  }, []);

  async function handleAadhaarUpload(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const res  = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json() as { url?: string };
      if (data.url) setKyc((k) => ({ ...k, aadhaarDocUrl: data.url! }));
    } catch {}
    setUploading(false);
  }

  async function handlePayNow() {
    setPayingNow(true); setError("");
    try {
      const res  = await fetch("/api/payments/create-order", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not initiate payment."); setPayingNow(false); return; }

      const loaded = await loadRazorpay();
      if (!loaded) { setError("Could not load payment gateway. Please check your connection."); setPayingNow(false); return; }

      const rzp = new window.Razorpay({
        key:         data.key,
        amount:      data.amount,
        currency:    data.currency,
        order_id:    data.orderId,
        name:        "Axiqen",
        description: `${data.tierLabel} Plan Setup Fee`,
        prefill: { name: data.name, email: data.email },
        theme:   { color: "#4361EE" },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const vRes = await fetch("/api/payments/verify", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(response),
          });
          const vData = await vRes.json();
          if (!vRes.ok) { setError(vData.error ?? "Payment verification failed."); setPayingNow(false); return; }
          setPaymentConfirmed(true);
          setPayingNow(false);
          setStep(2); // advance to Business step
        },
        modal: {
          ondismiss: () => setPayingNow(false),
        },
      });
      rzp.open();
    } catch {
      setError("Something went wrong. Please try again.");
      setPayingNow(false);
    }
  }

  async function handleNext() {
    setError("");
    if (step === 0) {
      if (!agreed) { setError("Please accept the agreement to continue."); return; }
      const ok = await save({ agreed: true }, "agreement");
      if (ok) setStep(1);
    } else if (step === 1) {
      // Payment handled by handlePayNow — this branch shouldn't normally be hit
      if (!paymentConfirmed) { setError("Please complete payment to continue."); return; }
      setStep(2);
    } else if (step === 2) {
      const ok = await save(business, "business");
      if (ok) setStep(3);
    } else if (step === 3) {
      if (!bank.bankHolder || !bank.bankAccount || !bank.bankIfsc) {
        setError("Account holder, account number, and IFSC are required."); return;
      }
      const ok = await save(bank, "bank");
      if (ok) setStep(4);
    } else if (step === 4) {
      if (!kyc.aadhaarNumber) { setError("Aadhaar number is required."); return; }
      const ok = await save(kyc, "kyc");
      if (ok) {
        await update({ onboardingDone: true });
        setDone(true);
      }
    }
  }

  const planKey  = (planTier || plan || "").toUpperCase();
  const planMeta = PLAN_META[planKey] ?? null;
  const PlanIcon = planMeta?.icon ?? Sparkles;
  const firstName = (session?.user?.name ?? sellerName ?? "there").split(" ")[0];
  const tierDisplay = TIER_DISPLAY[(planTier || "Launch").toLowerCase()] ?? "₹25,000";

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  // ── Completion screen ──────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
        style={{ background: "var(--bg-page)" }}>
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "rgba(67,97,238,0.1)" }}>
            <CheckCircle2 className="w-10 h-10" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
              You&apos;re all set, {firstName}!
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Onboarding complete. Our team is reviewing your details and will activate your account within <strong>24–48 hours</strong>.
            </p>
          </div>
          <div className="rounded-2xl p-5 text-left space-y-3"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>What happens next</p>
            {[
              "Our team reviews your KYC documents",
              "Account gets activated within 24–48 hours",
              "You'll receive a welcome email with access details",
              "Connect your Shopify store and start selling",
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 text-white"
                  style={{ background: "var(--accent)" }}>{i + 1}</div>
                {s}
              </div>
            ))}
          </div>
          <button onClick={() => router.push("/seller")}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--accent)" }}>
            Go to Dashboard <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Questions? <a href="mailto:connect@vrinandyaventures.in" className="underline" style={{ color: "var(--accent)" }}>connect@vrinandyaventures.in</a>
          </p>
        </div>
      </div>
    );
  }

  // ── Main onboarding UI ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "var(--bg-page)" }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-7">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base"
          style={{ background: "var(--accent)" }}>A</div>
        <div>
          <p className="font-bold text-sm leading-tight" style={{ color: "var(--text-primary)" }}>Axiqen</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Seller Onboarding</p>
        </div>
      </div>

      {/* Plan badge */}
      {planMeta && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6"
          style={{ background: planMeta.bg, color: planMeta.color, border: `1px solid ${planMeta.color}30` }}>
          <PlanIcon className="w-4 h-4" />
          {planMeta.label} Plan{planMeta.price ? ` · ${planMeta.price}` : ""}
        </div>
      )}

      {/* Step progress */}
      <div className="w-full max-w-lg mb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const isDone   = i < step;
            const isActive = i === step;
            const Icon     = s.icon;
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: isDone || isActive ? "var(--accent)" : "var(--bg-muted)",
                      border:     isDone || isActive ? "none" : "1.5px solid var(--border)",
                    }}>
                    {isDone
                      ? <Check className="w-4 h-4 text-white" />
                      : <Icon className="w-4 h-4" style={{ color: isActive ? "white" : "var(--text-muted)" }} />
                    }
                  </div>
                  <span className="text-[10px] font-semibold hidden sm:block"
                    style={{ color: isActive || isDone ? "var(--accent)" : "var(--text-muted)" }}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all"
                    style={{ background: i < step ? "var(--accent)" : "var(--border)" }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg rounded-2xl p-7"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 4px 24px rgba(67,97,238,0.06)" }}>

        {/* Step header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(67,97,238,0.1)" }}>
            {(() => { const Icon = STEPS[step].icon; return <Icon className="w-5 h-5" style={{ color: "var(--accent)" }} />; })()}
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{STEPS[step].label}</h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Step {step + 1} of {STEPS.length}</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm"
            style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
            {error}
          </div>
        )}

        {/* ── Step 0: Agreement ──────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="rounded-xl p-4 text-xs leading-relaxed whitespace-pre-line overflow-y-auto"
              style={{ background: "var(--bg-muted)", color: "var(--text-secondary)", maxHeight: "220px", border: "1px solid var(--border)" }}>
              {TERMS}
            </div>
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl transition-colors"
              style={{ background: agreed ? "rgba(67,97,238,0.05)" : "transparent", border: `1px solid ${agreed ? "var(--accent)" : "var(--border)"}` }}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 flex-shrink-0 rounded accent-[#4361EE]" />
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                I have read and agree to the <strong>Vrinandya Ventures Seller Agreement</strong> and Terms of Service.
              </span>
            </label>
          </div>
        )}

        {/* ── Step 1: Payment ────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            {paymentConfirmed ? (
              <div className="flex items-center gap-3 px-4 py-4 rounded-xl"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)" }}>
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-500" />
                <div>
                  <p className="text-sm font-semibold text-green-700">Payment confirmed!</p>
                  <p className="text-xs text-green-600">Your setup fee has been received. Continue to fill in your details.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Plan summary card */}
                <div className="rounded-xl p-5 text-center"
                  style={{ background: "var(--bg-muted)", border: "1px solid var(--border)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                    Setup Fee
                  </p>
                  <p className="text-4xl font-black mb-1" style={{ color: "var(--text-primary)" }}>
                    {tierDisplay}
                  </p>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--accent)" }}>
                    {planTier || "Launch"} Plan
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    One-time · No monthly charges · Platform fee per fulfilled order
                  </p>
                </div>

                {/* Trust points */}
                <div className="space-y-2">
                  {[
                    "Secured by Razorpay — UPI, cards, net banking accepted",
                    "Instant payment confirmation",
                    "Receipt sent to your registered email",
                  ].map((t) => (
                    <div key={t} className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                      <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--accent)" }} />
                      {t}
                    </div>
                  ))}
                </div>

                {/* Pay button */}
                <button
                  onClick={handlePayNow}
                  disabled={payingNow}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-opacity"
                  style={{ background: "var(--accent)" }}
                >
                  {payingNow
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Opening payment...</>
                    : <><CreditCard className="w-4 h-4" /> Pay {tierDisplay} Now</>
                  }
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Step 2: Business Details ───────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Brand Name">
                <Input value={business.brandName} onChange={(v) => setBusiness((b) => ({ ...b, brandName: v }))} placeholder="e.g. StyleHub" />
              </Field>
              <Field label="Business / Company Name">
                <Input value={business.businessName} onChange={(v) => setBusiness((b) => ({ ...b, businessName: v }))} placeholder="e.g. StyleHub Pvt Ltd" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="GST Number" hint="15-digit GSTIN">
                <Input value={business.gstNumber} onChange={(v) => setBusiness((b) => ({ ...b, gstNumber: v.toUpperCase() }))} placeholder="27AAAAA0000A1Z5" />
              </Field>
              <Field label="Phone Number">
                <Input value={business.phone} onChange={(v) => setBusiness((b) => ({ ...b, phone: v }))} placeholder="+91 98765 43210" type="tel" />
              </Field>
            </div>
            <Field label="Business Address">
              <Input value={business.businessAddress} onChange={(v) => setBusiness((b) => ({ ...b, businessAddress: v }))} placeholder="Street, City, State" />
            </Field>
            <Field label="Pincode">
              <Input value={business.pincode} onChange={(v) => setBusiness((b) => ({ ...b, pincode: v }))} placeholder="400001" />
            </Field>
          </div>
        )}

        {/* ── Step 3: Bank Account ───────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="px-4 py-3 rounded-xl text-xs" style={{ background: "rgba(67,97,238,0.06)", color: "var(--text-secondary)", border: "1px solid rgba(67,97,238,0.15)" }}>
              Your bank details are used solely for settlement payouts. All data is encrypted and secure.
            </div>
            <Field label="Bank Name">
              <Input value={bank.bankName} onChange={(v) => setBank((b) => ({ ...b, bankName: v }))} placeholder="e.g. HDFC Bank, SBI" />
            </Field>
            <Field label="Account Holder Name" hint="Must match your bank records exactly">
              <Input value={bank.bankHolder} onChange={(v) => setBank((b) => ({ ...b, bankHolder: v }))} placeholder="Full name as on bank account" />
            </Field>
            <Field label="Account Number">
              <Input value={bank.bankAccount} onChange={(v) => setBank((b) => ({ ...b, bankAccount: v }))} placeholder="Enter account number" type="password" />
            </Field>
            <Field label="IFSC Code" hint="11-character code (e.g. HDFC0001234)">
              <Input value={bank.bankIfsc} onChange={(v) => setBank((b) => ({ ...b, bankIfsc: v.toUpperCase() }))} placeholder="HDFC0001234" />
            </Field>
          </div>
        )}

        {/* ── Step 4: KYC ───────────────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="px-4 py-3 rounded-xl text-xs" style={{ background: "rgba(67,97,238,0.06)", color: "var(--text-secondary)", border: "1px solid rgba(67,97,238,0.15)" }}>
              KYC is required to comply with Indian regulations. Your documents are stored securely and never shared.
            </div>
            <Field label="Aadhaar Number" hint="12-digit Aadhaar number">
              <Input value={kyc.aadhaarNumber} onChange={(v) => setKyc((k) => ({ ...k, aadhaarNumber: v }))} placeholder="XXXX XXXX XXXX" />
            </Field>
            <Field label="Aadhaar Document" hint="Upload a clear photo or scan of your Aadhaar card (front side)">
              <div>
                {kyc.aadhaarDocUrl ? (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: "rgba(67,97,238,0.06)", border: "1px solid rgba(67,97,238,0.2)" }}>
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "var(--accent)" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Document uploaded</p>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{kyc.aadhaarDocUrl}</p>
                    </div>
                    <button onClick={() => setKyc((k) => ({ ...k, aadhaarDocUrl: "" }))}
                      className="text-xs underline flex-shrink-0" style={{ color: "#EF4444" }}>Remove</button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 px-4 py-6 rounded-xl cursor-pointer transition-colors"
                    style={{ background: "var(--bg-muted)", border: "2px dashed var(--border)" }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleAadhaarUpload(f); }}>
                    {uploading
                      ? <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent)" }} />
                      : <Upload className="w-6 h-6" style={{ color: "var(--text-muted)" }} />
                    }
                    <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                      {uploading ? "Uploading..." : "Click to upload or drag & drop"}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>JPG, PNG or PDF · Max 5MB</p>
                    <input type="file" className="hidden" accept="image/*,.pdf"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAadhaarUpload(f); }} />
                  </label>
                )}
              </div>
            </Field>
          </div>
        )}

        {/* Navigation — hidden on payment step when payment not done */}
        {(step !== 1 || paymentConfirmed) && (
          <div className="flex items-center justify-between mt-8 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
            <button
              onClick={() => { setError(""); setStep((s) => s - 1); }}
              disabled={step === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30"
              style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleNext}
              disabled={saving || uploading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "var(--accent)" }}>
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                : step === STEPS.length - 1
                ? <><Check className="w-4 h-4" /> Complete Onboarding</>
                : <>Continue <ChevronRight className="w-4 h-4" /></>
              }
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mt-6 text-xs" style={{ color: "var(--text-muted)" }}>
        <span>Need help? <a href="mailto:connect@vrinandyaventures.in" className="underline" style={{ color: "var(--accent)" }}>connect@vrinandyaventures.in</a></span>
        <span>·</span>
        <Link href="/login?zone=seller" className="underline" style={{ color: "var(--accent)" }}>Sign in to a different account</Link>
      </div>
    </div>
  );
}

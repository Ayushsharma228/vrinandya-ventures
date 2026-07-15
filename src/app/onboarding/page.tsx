"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  FileText, Building2, Landmark, ShieldCheck, CheckCircle2, ChevronRight, ChevronLeft,
} from "lucide-react";

const STEPS = [
  { label: "Agreement",     icon: FileText },
  { label: "Business",      icon: Building2 },
  { label: "Bank Account",  icon: Landmark },
  { label: "KYC",           icon: ShieldCheck },
];

const TERMS = `Welcome to Vrinandya Ventures Dropshipping Platform.

By joining as a seller, you agree to:

1. Provide accurate business and personal information.
2. Maintain the quality of products listed on your store.
3. Pay applicable platform commission on every delivered order.
4. Not engage in fraudulent orders, chargebacks, or return abuse.
5. Keep your bank account and GST details up to date.
6. Allow Vrinandya Ventures to deduct applicable fees, shipping, and GST from settlement payouts.
7. Accept that RTO orders will result in settlement reversal.

Platform commission rate and fees are governed by your plan and may be updated with 7 days notice.`;

export default function OnboardingPage() {
  const { update } = useSession();
  const router     = useRouter();

  const [step,   setStep]   = useState(0);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const [agreed,   setAgreed]   = useState(false);
  const [business, setBusiness] = useState({
    brandName: "", businessName: "", gstNumber: "", phone: "",
    businessAddress: "", pincode: "",
  });
  const [bank, setBank] = useState({
    bankName: "", bankHolder: "", bankAccount: "", bankIfsc: "",
  });
  const [kyc, setKyc] = useState({ aadhaarNumber: "", aadhaarDocUrl: "" });

  async function save(data: Record<string, unknown>, stepName: string) {
    setSaving(true); setError("");
    const r = await fetch("/api/seller/onboarding", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ step: stepName, ...data }),
    });
    const json = await r.json();
    if (!r.ok) { setError(json.error ?? "Failed to save"); setSaving(false); return false; }
    setSaving(false);
    return true;
  }

  async function handleNext() {
    setError("");
    if (step === 0) {
      if (!agreed) { setError("Please accept the agreement to continue."); return; }
      const ok = await save({ agreed: true }, "agreement");
      if (ok) setStep(1);

    } else if (step === 1) {
      const ok = await save(business, "business");
      if (ok) setStep(2);

    } else if (step === 2) {
      if (!bank.bankHolder || !bank.bankAccount || !bank.bankIfsc) {
        setError("Account holder, account number, and IFSC are required.");
        return;
      }
      const ok = await save(bank, "bank");
      if (ok) setStep(3);

    } else if (step === 3) {
      if (!kyc.aadhaarNumber) { setError("Aadhaar number is required."); return; }
      const ok = await save(kyc, "kyc");
      if (ok) {
        await update({ onboardingDone: true });
        router.push("/seller");
      }
    }
  }

  const Icon = STEPS[step].icon;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "var(--bg-page)" }}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base"
          style={{ background: "#00C67A" }}>V</div>
        <div>
          <p className="font-bold text-base leading-tight" style={{ color: "var(--text-900)" }}>Vrinandya Ventures</p>
          <p className="text-xs" style={{ color: "#00C67A" }}>Seller Onboarding</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-lg mb-6">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={s.label} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: done ? "#00C67A" : active ? "var(--bg-sidebar)" : "var(--bg-muted)",
                    color: done || active ? "white" : "var(--text-400)",
                    border: active ? "2px solid #00C67A" : "none",
                  }}>
                  {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-xs hidden sm:block" style={{ color: active ? "#00C67A" : "var(--text-400)" }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="h-1 rounded-full" style={{ background: "var(--border)" }}>
          <div className="h-1 rounded-full transition-all duration-500"
            style={{ background: "#00C67A", width: `${(step / (STEPS.length - 1)) * 100}%` }} />
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg rounded-2xl p-7"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(0,198,122,0.1)" }}>
            <Icon className="w-5 h-5" style={{ color: "#00C67A" }} />
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--text-900)" }}>
              {STEPS[step].label}
            </h2>
            <p className="text-xs" style={{ color: "var(--text-400)" }}>
              Step {step + 1} of {STEPS.length}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-xl text-sm"
            style={{ background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>
            {error}
          </div>
        )}

        {/* ── Step 0: Agreement ─────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="rounded-xl p-4 text-xs leading-relaxed whitespace-pre-line overflow-y-auto"
              style={{ background: "var(--bg-muted)", color: "var(--text-400)", maxHeight: "200px", border: "1px solid var(--border)" }}>
              {TERMS}
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-green-500 flex-shrink-0" />
              <span className="text-sm" style={{ color: "var(--text-900)" }}>
                I have read and agree to the Vrinandya Ventures Seller Agreement and Terms of Service.
              </span>
            </label>
          </div>
        )}

        {/* ── Step 1: Business Details ──────────────────────── */}
        {step === 1 && (
          <div className="space-y-3">
            {[
              { label: "Brand Name", key: "brandName", placeholder: "Your store/brand name", required: false },
              { label: "Legal Business Name", key: "businessName", placeholder: "Registered company name", required: false },
              { label: "GST Number", key: "gstNumber", placeholder: "22AAAAA0000A1Z5", required: false },
              { label: "Phone Number", key: "phone", placeholder: "10-digit mobile", required: false },
              { label: "Business Address", key: "businessAddress", placeholder: "Street, City, State", required: false },
              { label: "Pincode", key: "pincode", placeholder: "400001", required: false },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-400)" }}>
                  {label}
                </label>
                <input
                  value={business[key as keyof typeof business]}
                  onChange={e => setBusiness(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full text-sm rounded-xl px-3 py-2 border outline-none"
                  style={{ background: "var(--bg-muted)", color: "var(--text-900)", borderColor: "var(--border)" }}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Step 2: Bank Account ──────────────────────────── */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-xs mb-2" style={{ color: "var(--text-400)" }}>
              Settlement payouts will be sent to this account.
            </p>
            {[
              { label: "Account Holder Name *", key: "bankHolder", placeholder: "Full name as on bank records" },
              { label: "Account Number *",      key: "bankAccount", placeholder: "Enter account number" },
              { label: "IFSC Code *",           key: "bankIfsc",    placeholder: "e.g. HDFC0001234" },
              { label: "Bank Name",             key: "bankName",    placeholder: "e.g. HDFC Bank" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-400)" }}>{label}</label>
                <input
                  value={bank[key as keyof typeof bank]}
                  onChange={e => setBank(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full text-sm rounded-xl px-3 py-2 border outline-none"
                  style={{ background: "var(--bg-muted)", color: "var(--text-900)", borderColor: "var(--border)" }}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Step 3: KYC ──────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="px-3 py-2 rounded-xl text-xs" style={{ background: "rgba(0,198,122,0.08)", color: "#15803D" }}>
              KYC verification is required for payouts above ₹50,000. Our team will review your submission within 24–48 hours.
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-400)" }}>Aadhaar Number *</label>
              <input
                value={kyc.aadhaarNumber}
                onChange={e => setKyc(p => ({ ...p, aadhaarNumber: e.target.value.replace(/\D/g, "").slice(0, 12) }))}
                placeholder="12-digit Aadhaar number"
                className="w-full text-sm rounded-xl px-3 py-2 border outline-none font-mono"
                style={{ background: "var(--bg-muted)", color: "var(--text-900)", borderColor: "var(--border)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-400)" }}>
                Aadhaar Document URL <span style={{ color: "var(--text-300)" }}>(optional)</span>
              </label>
              <input
                value={kyc.aadhaarDocUrl}
                onChange={e => setKyc(p => ({ ...p, aadhaarDocUrl: e.target.value }))}
                placeholder="https://drive.google.com/... or any public link"
                className="w-full text-sm rounded-xl px-3 py-2 border outline-none"
                style={{ background: "var(--bg-muted)", color: "var(--text-900)", borderColor: "var(--border)" }}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={() => { setStep(s => s - 1); setError(""); }}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-30 transition-all"
            style={{ border: "1px solid var(--border)", color: "var(--text-400)" }}>
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <button
            onClick={handleNext}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all"
            style={{ background: "#00C67A" }}>
            {saving ? "Saving…" : step === STEPS.length - 1 ? "Complete Setup" : "Next"}
            {!saving && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <p className="text-xs mt-4" style={{ color: "var(--text-300)" }}>
        Your data is encrypted and stored securely.
      </p>
    </div>
  );
}

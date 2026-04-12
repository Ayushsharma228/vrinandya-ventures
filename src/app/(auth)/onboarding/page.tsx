"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ChevronRight, Check, Upload, FileText, Shield,
  Clock, CheckCircle2, Loader2, Store,
} from "lucide-react";

const STEPS = ["Welcome", "Business", "KYC", "Plan Brief", "Agreement"];

const AGREEMENT_DS = `DROPSHIPPING SELLER AGREEMENT

This Dropshipping Seller Agreement ("Agreement") is entered into between Vrinandya Ventures ("Company") and the Seller.

1. SERVICES
The Company will provide the Seller access to its dropshipping platform, including product sourcing, inventory management, order fulfillment, AWB generation, and delivery tracking services.

2. SELLER OBLIGATIONS
The Seller agrees to:
(a) Maintain an active Shopify or equivalent e-commerce store
(b) Ensure timely payment of platform fees as per the selected plan
(c) Not misrepresent products listed on their store
(d) Comply with all applicable laws regarding e-commerce and consumer protection
(e) Not share platform access credentials with third parties

3. COMPANY OBLIGATIONS
The Company agrees to:
(a) Process orders within agreed timelines
(b) Provide AWB numbers for all shipped orders
(c) Handle RTO (Return to Origin) processing
(d) Provide platform support during business hours

4. FEES & PAYMENT
Platform fees are non-refundable once the account is activated. The Seller shall pay the one-time onboarding fee as per their selected plan. Additional charges may apply for specific services.

5. INTELLECTUAL PROPERTY
All product listings, images, and descriptions provided by the Company remain the Company's intellectual property. The Seller may use these only within the platform's intended scope.

6. CONFIDENTIALITY
Both parties agree to keep business information, pricing, and operational data confidential.

7. TERMINATION
Either party may terminate this agreement with 30 days' written notice. The Company reserves the right to terminate immediately for violations of this agreement.

8. LIMITATION OF LIABILITY
The Company's liability shall be limited to the amount of fees paid by the Seller in the preceding 3 months.

9. GOVERNING LAW
This Agreement is governed by the laws of India. Any disputes shall be resolved in courts of jurisdiction in the Company's registered state.

10. AMENDMENTS
The Company reserves the right to amend these terms with 30 days' notice to the Seller.

By checking the agreement box, you confirm that you have read, understood, and agree to be bound by this Agreement.`;

const AGREEMENT_MP = `MARKETPLACE SELLER AGREEMENT

This Marketplace Seller Agreement ("Agreement") is entered into between Vrinandya Ventures ("Company") and the Seller.

1. SCOPE OF SERVICES
The Company will list the Seller's products on designated marketplaces including but not limited to Amazon, eBay, Etsy, and Walmart. The Company acts as an intermediary facilitating marketplace listings on behalf of the Seller.

2. LISTING SERVICES
(a) The Company will create and manage product listings on selected marketplaces
(b) Product images, descriptions, and pricing will be agreed upon before listing
(c) The Company does not guarantee listing approval by marketplace platforms
(d) Timeline for listing activation depends on marketplace review processes

3. SELLER OBLIGATIONS
The Seller agrees to:
(a) Provide accurate product information, images, and pricing
(b) Ensure products comply with marketplace policies and applicable laws
(c) Maintain adequate inventory to fulfil orders
(d) Process refunds and returns as per marketplace policies
(e) Pay platform fees as per the selected plan on time

4. ORDER MANAGEMENT
The Company will sync orders from connected marketplaces to the Seller's dashboard. The Seller is responsible for timely order processing. AWB numbers will be generated for all shipped orders.

5. FEES & COMMISSIONS
Platform onboarding fees are non-refundable post-activation. Marketplace commissions are separate and paid directly to the respective marketplace by the Seller (or deducted from settlements).

6. CONTENT & IP
The Seller warrants that all product content (images, descriptions) provided does not infringe any third-party intellectual property rights. The Seller indemnifies the Company against any IP claims.

7. MARKETPLACE POLICY COMPLIANCE
The Seller is responsible for compliance with individual marketplace seller policies. Account suspensions by marketplaces due to Seller policy violations are outside the Company's control.

8. CONFIDENTIALITY
Both parties agree not to disclose business information, pricing strategy, or operational data to third parties without prior written consent.

9. TERMINATION
Either party may terminate this Agreement with 30 days' notice. Platform fees paid are non-refundable. The Company reserves the right to terminate immediately for material breaches.

10. DISPUTE RESOLUTION
Disputes will first be attempted to be resolved through mutual negotiation. If unresolved, disputes shall be referred to arbitration under the Arbitration and Conciliation Act, 1996.

11. GOVERNING LAW
This Agreement is governed by Indian law.

By checking the agreement box, you confirm that you have read, understood, and agree to be bound by all terms of this Agreement.`;

function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
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
            {i < total - 1 && (
              <div className="w-10 h-0.5 mb-4 mx-1"
                style={{ background: i < current ? "#00C67A" : "rgba(255,255,255,0.15)" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 2: Business details
  const [bizName, setBizName]           = useState("");
  const [bizAddress, setBizAddress]     = useState("");
  const [pincode, setPincode]           = useState("");
  const [gst, setGst]                   = useState("");
  const [phone, setPhone]               = useState("");

  // Step 3: KYC
  const [aadhaar, setAadhaar]           = useState("");
  const [kycFile, setKycFile]           = useState<File | null>(null);
  const [kycUrl, setKycUrl]             = useState("");
  const [uploading, setUploading]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 5: Agreement
  const [agreed, setAgreed]             = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [done, setDone]                 = useState(false);

  // Determine service from session
  const service = (session?.user as { plan?: string })?.plan ?? "";
  const planTier = (session?.user as { planTier?: string })?.planTier ?? "";
  const agreementText = service === "MARKETPLACE" ? AGREEMENT_MP : AGREEMENT_DS;

  // If already fully active, go to dashboard
  useEffect(() => {
    const u = session?.user as { accountStatus?: string; onboardingDone?: boolean } | undefined;
    if (u?.accountStatus === "ACTIVE") {
      router.replace("/seller");
    }
    if (u?.onboardingDone) {
      setDone(true);
    }
  }, [session, router]);

  async function save(body: Record<string, unknown>) {
    const res = await fetch("/api/onboarding/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save");
  }

  async function uploadKyc() {
    if (!kycFile) return "";
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", kycFile);
      const res = await fetch("/api/onboarding/upload-kyc", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setKycUrl(data.url);
      return data.url as string;
    } finally {
      setUploading(false);
    }
  }

  async function handleBusiness(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await save({ step: "invoice", name: session?.user?.name, businessName: bizName, businessAddress: bizAddress, pincode, gstNumber: gst, phone });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally { setLoading(false); }
  }

  async function handleKyc(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const clean = aadhaar.replace(/\s/g, "");
      if (clean.length !== 12) { setError("Enter valid 12-digit Aadhaar number"); setLoading(false); return; }
      let url = kycUrl;
      if (kycFile && !kycUrl) {
        try {
          url = await uploadKyc();
        } catch (uploadErr) {
          // Upload failed — still allow proceeding, admin will collect doc manually
          console.warn("KYC upload failed, proceeding without doc URL:", uploadErr);
          setError("");
        }
      }
      // url is optional — admin can collect Aadhaar doc via email if upload fails
      await save({ step: "kyc", aadhaarNumber: aadhaar, aadhaarDocUrl: url || "" });
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally { setLoading(false); }
  }

  async function handleAgreement(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) { setError("Please read and accept the agreement to continue"); return; }
    setError(""); setSubmitting(true);
    try {
      await save({ step: "agreement" });
      await update({ onboardingDone: true });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally { setSubmitting(false); }
  }

  // Pending activation screen
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "linear-gradient(135deg, #0D1117 0%, #0D2818 60%, #0a1f12 100%)" }}>
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(0,198,122,0.15)", border: "2px solid rgba(0,198,122,0.3)" }}>
            <Clock className="w-10 h-10" style={{ color: "#00C67A" }} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">You&apos;re all set!</h1>
          <p className="mb-6" style={{ color: "rgba(255,255,255,0.55)" }}>
            Your onboarding is complete. Our team is verifying your payment and KYC documents.
            Your account will be activated within <strong className="text-white">24–48 hours</strong>.
          </p>
          <div className="rounded-xl p-4 mb-6 text-left space-y-2"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {[
              { label: "Agreement", status: "Signed ✓" },
              { label: "KYC Documents", status: "Submitted ✓" },
              { label: "Payment Reference", status: "Submitted ✓" },
              { label: "Account Activation", status: "Pending review" },
            ].map(({ label, status }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
                <span className="text-xs font-semibold" style={{ color: status.includes("Pending") ? "#F59E0B" : "#00C67A" }}>{status}</span>
              </div>
            ))}
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            A confirmation email has been sent. Contact us at connect@vrinandyaventures.in for any queries.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(135deg, #0D1117 0%, #0D2818 60%, #0a1f12 100%)" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #00C67A, transparent)" }} />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#00C67A" }}>
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg">Vrinandya Ventures</span>
          </div>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Complete your onboarding</p>
        </div>

        <StepBar current={step} total={STEPS.length} />

        <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#FCA5A5" }}>
              {error}
            </div>
          )}

          {/* ── Step 0: Welcome ── */}
          {step === 0 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(0,198,122,0.15)", border: "1px solid rgba(0,198,122,0.25)" }}>
                <CheckCircle2 className="w-8 h-8" style={{ color: "#00C67A" }} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Welcome to Vrinandya!</h2>
              <p className="mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>
                We&apos;re excited to have you on board. You&apos;ve taken the first step towards building a successful e-commerce business.
              </p>
              <div className="text-left rounded-xl p-5 mb-6"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-sm italic mb-3" style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.7" }}>
                  "We built Vrinandya Ventures to make e-commerce accessible for every Indian entrepreneur. Our team is committed to your success — from product sourcing to delivery, we've got you covered. Welcome to the family!"
                </p>
                <p className="text-xs font-semibold" style={{ color: "#00C67A" }}>— Founder, Vrinandya Ventures</p>
              </div>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
                Next, we&apos;ll collect a few details to set up your account. This takes about <strong className="text-white">2 minutes</strong>.
              </p>
              <button onClick={() => setStep(1)}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: "#00C67A", color: "white" }}>
                Get Started <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step 1: Business Details ── */}
          {step === 1 && (
            <form onSubmit={handleBusiness} className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-1">Business Details</h2>
              <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>Used for invoices and communications</p>

              {[
                { label: "Business / Brand Name", value: bizName, set: setBizName, placeholder: "Your brand name" },
                { label: "Business Address", value: bizAddress, set: setBizAddress, placeholder: "Full address" },
                { label: "Pincode", value: pincode, set: setPincode, placeholder: "6-digit pincode" },
                { label: "GST Number (optional)", value: gst, set: setGst, placeholder: "22AAAAA0000A1Z5" },
                { label: "Phone Number", value: phone, set: setPhone, placeholder: "+91 98765 43210" },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>{label}</label>
                  <input value={value} onChange={(e) => set(e.target.value)}
                    required={!label.includes("optional")}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-green-500"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} />
                </div>
              ))}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                style={{ background: "#00C67A", color: "white" }}>
                {loading ? "Saving..." : <><span>Continue</span><ChevronRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {/* ── Step 2: KYC ── */}
          {step === 2 && (
            <form onSubmit={handleKyc} className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">KYC Verification</h2>
                <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>Required for account verification and compliance</p>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.6)" }}>Aadhaar Number *</label>
                <input
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12).replace(/(.{4})/g, "$1 ").trim())}
                  placeholder="XXXX XXXX XXXX"
                  maxLength={14}
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-green-500 font-mono tracking-wider"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Aadhaar Document (Front)</label>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Optional — can submit later</span>
                </div>
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setKycFile(f); setKycUrl(""); } }} />

                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full py-8 rounded-xl flex flex-col items-center gap-2 transition-all"
                  style={{
                    border: `2px dashed ${kycFile ? "#00C67A" : "rgba(255,255,255,0.2)"}`,
                    background: kycFile ? "rgba(0,198,122,0.08)" : "rgba(255,255,255,0.03)",
                  }}>
                  {uploading ? (
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#00C67A" }} />
                  ) : kycFile ? (
                    <>
                      <FileText className="w-8 h-8" style={{ color: "#00C67A" }} />
                      <span className="text-sm text-white font-medium">{kycFile.name}</span>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Click to change</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8" style={{ color: "rgba(255,255,255,0.3)" }} />
                      <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>Upload Aadhaar Copy</span>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>JPG, PNG or PDF · Max 5 MB</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-start gap-2 px-3 py-3 rounded-xl"
                style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "#F59E0B" }} />
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                  Your Aadhaar information is encrypted and stored securely. It is used solely for KYC compliance and will never be shared with third parties.
                </p>
              </div>

              <button type="submit" disabled={loading || uploading}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "#00C67A", color: "white" }}>
                {loading ? "Saving..." : <><span>Continue</span><ChevronRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}

          {/* ── Step 3: Plan Brief ── */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Your Plan Summary</h2>
              <p className="text-sm mb-5" style={{ color: "rgba(255,255,255,0.45)" }}>Here's what you get with your plan</p>

              <div className="rounded-xl p-5 mb-5" style={{ background: "rgba(0,198,122,0.08)", border: "1px solid rgba(0,198,122,0.2)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#00C67A" }}>
                    <Store className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold">{planTier || "Your Plan"}</p>
                    <p className="text-xs" style={{ color: "#00C67A" }}>{service === "MARKETPLACE" ? "Marketplace" : "Dropshipping"}</p>
                  </div>
                </div>

                {service === "DROPSHIPPING" ? (
                  <ul className="space-y-2">
                    {["Product sourcing & catalog access", "Shopify store integration", "Auto order sync & AWB generation", "Delivery tracking dashboard", "RTO management", "Dedicated seller support"].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#00C67A" }} /> {f}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-2">
                    {["Multi-marketplace listing management", "Admin-managed product listings", "Order sync from all platforms", "AWB generation & tracking", "RTO management", "Dedicated listing support"].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#00C67A" }} /> {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl p-4 mb-6 text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                One final step — read and accept our Seller Agreement to activate your account. Your account will go live within 24–48 hours after our team reviews your payment and KYC.
              </div>

              <button onClick={() => setStep(4)}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: "#00C67A", color: "white" }}>
                Read & Sign Agreement <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step 4: Agreement ── */}
          {step === 4 && (
            <form onSubmit={handleAgreement}>
              <h2 className="text-xl font-bold text-white mb-1">Seller Agreement</h2>
              <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>Please read carefully before accepting</p>

              <div className="rounded-xl p-4 mb-4 overflow-y-auto text-xs leading-relaxed"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.65)",
                  maxHeight: "240px",
                  whiteSpace: "pre-wrap",
                  fontFamily: "monospace",
                }}>
                {agreementText}
              </div>

              <label className="flex items-start gap-3 cursor-pointer mb-5">
                <div
                  onClick={() => setAgreed(!agreed)}
                  className="w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-all cursor-pointer"
                  style={{ background: agreed ? "#00C67A" : "rgba(255,255,255,0.1)", border: `2px solid ${agreed ? "#00C67A" : "rgba(255,255,255,0.25)"}` }}>
                  {agreed && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                  I have read and agree to the Seller Agreement for Vrinandya Ventures. I confirm all information provided is accurate.
                </span>
              </label>

              <button type="submit" disabled={!agreed || submitting}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: "#00C67A", color: "white" }}>
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                  : "Complete Onboarding →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

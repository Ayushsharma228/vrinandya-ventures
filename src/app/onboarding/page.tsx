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

(A) The Client shall be solely and entirely responsible for funding all Meta Ads spend. Ad spend shall be deposited directly into the Client's own Meta Ads account.
(B) The Company shall not fund, advance, reimburse, or guarantee any ad spend on behalf of the Client.
(C) The Company shall manage campaigns strictly within the ad spend budget made available by the Client. Scale and outcome are directly linked to the ad spend budget provided.
(D) The Company shall not be liable for any restriction, suspension, or disabling of the Client's Meta Ads account by Meta.

─────────────────────────────────────────

6. INTELLECTUAL PROPERTY

(A) All creatives, ad copies, campaign strategies, listings, content, and other deliverables developed by the Company shall remain the Company's intellectual property until full payment of the applicable Service Charge is received.
(B) Upon receipt of full payment, the Client is granted a non-exclusive licence to use such deliverables for the Client's own business purposes.

─────────────────────────────────────────

7. CLIENT RESPONSIBILITIES & APPROVAL TIMELINES

(A) The Client shall provide all inputs required (product details, pricing, brand preferences, images, account access) within 3 days of onboarding and within 3 days of any subsequent request.
(B) Each deliverable carries a 48-hour approval window. If no response is received within 48 hours, the deliverable shall be deemed approved.
(C) Delays caused by late approvals, delayed inputs, or non-cooperation of the Client shall not be counted against the Company's delivery timelines and shall not entitle the Client to any refund or compensation.
(D) The Client shall not make unilateral changes to product pricing, listings, ad account settings, or campaign strategy without prior consultation with the Company.

─────────────────────────────────────────

8. GENERAL PERFORMANCE DISCLAIMER

(A) Save as expressly provided under Clause 9, the Company does not guarantee any specific sales, revenue, ROAS, order volume, follower growth, or other performance outcome under any Plan.
(B) Performance is influenced by multiple external factors including market conditions, product-market fit, pricing, competition, platform algorithms, and consumer behaviour, all outside the Company's control.

─────────────────────────────────────────

9. PROFIT GUARANTEE & REFUND OF SERVICE CHARGE

(A) If, at the end of a continuous ad campaign period of 3 consecutive months, the Client has not achieved a positive Net Profit (as defined in Clause 1(G)), the Company shall refund the Service Charge paid for the corresponding 3-month period.
(B) This refund is strictly limited to the Service Charge and shall not extend to ad spend, product cost, shipping, platform fees, or any other cost incurred by the Client.
(C) This guarantee is contingent on Meta Ads campaigns having run continuously throughout the 3-month period. If the period is broken or paused for any reason attributable to the Client, the 3-month period shall be deemed reset.
(D) This guarantee shall not apply if Net Profit is not achieved due to reasons within the Client's control, including unilateral pricing changes, non-cooperation, product unavailability, or platform account suspension not attributable to the Company.
(E) Any claim for refund must be raised in writing within 15 days of completion of the relevant 3-month period.
(F) This guarantee may be invoked only once during the term of this Agreement.

─────────────────────────────────────────

10. CONFIDENTIALITY

(A) Each Party agrees to keep confidential all business information, strategies, pricing, account data, and other information disclosed during the course of this engagement.
(B) The Company shall not disclose the Client's business data, sales data, or account information to any third party, except as required to deliver the Services or as required by law.
(C) This obligation survives termination or expiry of this Agreement for a period of 2 years.

─────────────────────────────────────────

11. THIRD-PARTY DISCLAIMER

The Company shall not be responsible for any disruption, restriction, suspension, policy change, or loss caused by third-party platforms including Meta, Amazon, Flipkart, Meesho, Shopify, Razorpay, courier/logistics partners, or any other third-party service provider.

─────────────────────────────────────────

12. REPRESENTATIONS & WARRANTIES

(A) The Client represents that all information provided is true, accurate, and lawful.
(B) The Client represents that it holds valid title to sell the products listed and has all necessary licences, registrations, and regulatory approvals.
(C) The Client represents that the products, listings, and content do not infringe upon any third-party intellectual property rights, and agrees to indemnify the Company against any claim arising from a breach of this representation.

─────────────────────────────────────────

13. INDEMNIFICATION

The Client shall indemnify, defend, and hold harmless the Company, its directors, officers, and employees from and against any claims, losses, damages, liabilities, penalties, and expenses arising out of any breach of the Client's representations, warranties, or obligations; any intellectual property infringement claim; or any regulatory non-compliance, false representation, or illegal product supplied by the Client.

─────────────────────────────────────────

14. LIMITATION OF LIABILITY

(A) Save in cases of fraud, wilful misconduct, or gross negligence, and save as expressly provided under Clause 9, neither Party shall be liable to the other for any indirect, incidental, or consequential damages.
(B) The Company's total liability shall not exceed the total Service Charge paid by the Client for the period in which the claim arises.

─────────────────────────────────────────

15. TERM & TERMINATION

(A) This Agreement shall commence on the Effective Date and continue until terminated in accordance with this Clause.
(B) Either Party may terminate this Agreement by providing 15 days' prior written notice, subject to any minimum engagement period.
(C) The Company may terminate with immediate effect in the event of non-payment, abusive conduct, breach of these terms, or misuse of the Company's systems.
(D) Termination shall not affect rights and obligations accrued prior to the date of termination.

─────────────────────────────────────────

16. FORCE MAJEURE

Neither Party shall be liable for any failure or delay in performance caused by circumstances beyond its reasonable control, including acts of God, natural disasters, war, government action, pandemic, or disruption to platform/logistics networks.

─────────────────────────────────────────

18. GOVERNING LAW & JURISDICTION

This Agreement shall be governed by and construed in accordance with the laws of India. The courts at Agra, Uttar Pradesh shall have exclusive jurisdiction over any matters arising out of or in connection with this Agreement.

─────────────────────────────────────────

19. GENERAL PROVISIONS

(A) ENTIRE AGREEMENT: This Agreement constitutes the entire agreement between the Parties and supersedes all prior discussions, negotiations, and understandings.
(B) AMENDMENT: This Agreement may only be amended by a written instrument signed by authorised representatives of both Parties.
(C) INDEPENDENT CONTRACTORS: Nothing in this Agreement creates a partnership, joint venture, or employer-employee relationship between the Parties.
(D) SEVERABILITY: If any provision is held invalid or unenforceable, the remaining provisions shall continue in full force and effect.
(E) NOTICES: All notices shall be in writing and delivered via email or registered post.
(F) WAIVER: No failure or delay by either Party in exercising any right shall operate as a waiver of such right.

Email: connect@vrinandyaventures.in | Contact: +91 7060401016`;

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

"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, RefreshCw, Activity, Clock, Zap } from "lucide-react";
import Link from "next/link";

interface ActivationData {
  id: string;
  currentStage: string;
  activationPct: number;
  healthScore: number;
  healthLabel: string;
  estimatedDays: number | null;
  activatedAt: string | null;
  lastActivityAt: string | null;
  accountCreated: boolean;
  agreementSigned: boolean;
  businessFilled: boolean;
  bankFilled: boolean;
  kycApproved: boolean;
  shopifyConnected: boolean;
  productsImported: boolean;
  listingRequested: boolean;
  firstListingLive: boolean;
  firstOrderReceived: boolean;
  firstOrderDelivered: boolean;
  walletActive: boolean;
}

interface TimelineEvent {
  id: string;
  event: string;
  description: string;
  createdAt: string;
}

interface ChecklistItem {
  key: keyof ActivationData;
  label: string;
  desc: string;
  cta?: { label: string; href: string };
}

const CHECKLIST: ChecklistItem[] = [
  { key: "accountCreated",    label: "Account Created",          desc: "Your account is ready" },
  { key: "agreementSigned",   label: "Agreement Signed",         desc: "Accept the seller agreement", cta: { label: "Complete Onboarding", href: "/seller/onboarding" } },
  { key: "businessFilled",    label: "Business Details",         desc: "Fill in your business profile", cta: { label: "Update Profile", href: "/seller/profile" } },
  { key: "bankFilled",        label: "Bank Account Linked",      desc: "Add your bank account for payouts", cta: { label: "Update Profile", href: "/seller/profile" } },
  { key: "kycApproved",       label: "KYC Verified",             desc: "Submit documents for identity verification", cta: { label: "Submit KYC", href: "/seller/onboarding" } },
  { key: "shopifyConnected",  label: "Shopify Store Connected",  desc: "Connect your Shopify store", cta: { label: "Connect Shopify", href: "/seller/shopify" } },
  { key: "productsImported",  label: "Products Imported",        desc: "Add products from your catalog", cta: { label: "Browse Catalog", href: "/seller/catalog" } },
  { key: "listingRequested",  label: "Listing Requested",        desc: "Request a marketplace listing", cta: { label: "Request Listing", href: "/seller/catalog" } },
  { key: "firstListingLive",  label: "First Listing Live",       desc: "Waiting for admin to approve and publish your listing" },
  { key: "firstOrderReceived",label: "First Order Received",     desc: "Your first sale will happen soon!" },
  { key: "firstOrderDelivered",label: "First Order Delivered",   desc: "Order delivered to the customer" },
  { key: "walletActive",      label: "Wallet Active",            desc: "Settlement credited to your wallet" },
];

const STAGE_LABELS: Record<string, string> = {
  ACCOUNT_CREATED: "Account Created",
  AGREEMENT_SIGNED: "Agreement Signed",
  KYC_APPROVED: "KYC Verified",
  BANK_VERIFIED: "Bank Verified",
  SHOPIFY_CONNECTED: "Shopify Connected",
  PRODUCTS_IMPORTED: "Products Imported",
  LISTING_REQUESTED: "Listing Requested",
  FIRST_LISTING_LIVE: "First Listing Live",
  FIRST_ORDER_RECEIVED: "First Order Received",
  ACTIVATED: "Fully Activated",
  STALLED: "Stalled",
  BLOCKED: "Blocked",
};

function healthColor(label: string): string {
  if (label === "Excellent") return "var(--green-500)";
  if (label === "Good") return "#3B82F6";
  if (label === "Needs Attention") return "#F59E0B";
  return "#EF4444";
}

export default function SellerActivationPage() {
  const [activation, setActivation] = useState<ActivationData | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const res = await fetch("/api/seller/activation");
    if (res.ok) {
      const d = await res.json();
      setActivation(d.activation);
      setTimeline(d.timeline ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const refresh = async () => {
    setRefreshing(true);
    await fetch("/api/seller/activation", { method: "POST" });
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-24 rounded-xl animate-pulse" style={{ background: "var(--bg-card)" }} />
        <div className="h-64 rounded-xl animate-pulse" style={{ background: "var(--bg-card)" }} />
      </div>
    );
  }

  if (!activation) {
    return (
      <div className="p-6">
        <p style={{ color: "var(--text-400)" }}>Activation data not available.</p>
      </div>
    );
  }

  const hc = healthColor(activation.healthLabel);
  const doneCount = CHECKLIST.filter(c => activation[c.key] as boolean).length;
  const nextStep = CHECKLIST.find(c => !(activation[c.key] as boolean));
  const isFullyActivated = activation.currentStage === "ACTIVATED";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-900)" }}>My Activation Journey</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-400)" }}>
            {isFullyActivated ? "Congratulations! You are fully activated." : `Complete all steps to start selling`}
          </p>
        </div>
        <button onClick={refresh}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ border: "1px solid var(--border)", color: "var(--text-400)" }}>
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Progress Banner */}
      <div className="p-5 rounded-xl" style={{ background: isFullyActivated ? "rgba(0,198,122,0.08)" : "var(--bg-card)", border: `1px solid ${isFullyActivated ? "var(--green-500)" : "var(--border)"}` }}>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold" style={{ color: isFullyActivated ? "var(--green-500)" : "var(--text-900)" }}>
              {activation.activationPct}%
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>
                {STAGE_LABELS[activation.currentStage] ?? activation.currentStage}
              </p>
              <p className="text-xs" style={{ color: "var(--text-400)" }}>
                {doneCount} of {CHECKLIST.length} steps complete
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: `${hc}15`, color: hc }}>
              {activation.healthLabel}
            </span>
            {activation.estimatedDays && !isFullyActivated && (
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-400)" }}>
                <Clock className="w-3.5 h-3.5" />
                ~{activation.estimatedDays} days to activate
              </span>
            )}
          </div>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${activation.activationPct}%`, background: isFullyActivated ? "var(--green-500)" : "linear-gradient(90deg, var(--accent), var(--green-500))" }} />
        </div>
      </div>

      {/* Next Action CTA */}
      {!isFullyActivated && nextStep?.cta && (
        <div className="p-4 rounded-xl flex items-center justify-between gap-4" style={{ background: "rgba(0,198,122,0.06)", border: "1px solid rgba(0,198,122,0.2)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,198,122,0.15)" }}>
              <Zap className="w-4 h-4" style={{ color: "var(--green-500)" }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Next: {nextStep.label}</p>
              <p className="text-xs" style={{ color: "var(--text-400)" }}>{nextStep.desc}</p>
            </div>
          </div>
          <Link href={nextStep.cta.href}
            className="px-4 py-2 rounded-lg text-sm font-semibold flex-shrink-0 transition-opacity hover:opacity-90"
            style={{ background: "var(--green-500)", color: "#fff" }}>
            {nextStep.cta.label}
          </Link>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Checklist */}
        <div className="p-5 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-900)" }}>Activation Checklist</h2>
          <div className="space-y-3">
            {CHECKLIST.map(({ key, label, desc, cta }) => {
              const done = activation[key] as boolean;
              return (
                <div key={key} className="flex items-start gap-3">
                  {done
                    ? <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--green-500)" }} />
                    : <Circle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--border)" }} />
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium" style={{ color: done ? "var(--text-900)" : "var(--text-400)" }}>{label}</p>
                      {!done && cta && (
                        <Link href={cta.href}
                          className="text-xs font-medium flex-shrink-0 transition-opacity hover:opacity-80"
                          style={{ color: "var(--accent)" }}>
                          {cta.label} →
                        </Link>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: done ? "var(--text-300)" : "var(--text-300)" }}>{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        <div className="p-5 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-900)" }}>
            <Activity className="w-4 h-4" style={{ color: "var(--accent)" }} />
            Your Activity
          </h2>
          {timeline.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="w-8 h-8 mb-2" style={{ color: "var(--text-300)" }} />
              <p className="text-sm" style={{ color: "var(--text-400)" }}>No activity yet</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-300)" }}>Complete your first step to see your journey</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {[...timeline].reverse().map((ev, idx, arr) => (
                <div key={ev.id} className="flex gap-3">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full mt-1" style={{ background: "var(--green-500)" }} />
                    {idx < arr.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: "var(--border)" }} />}
                  </div>
                  <div className={idx < arr.length - 1 ? "pb-3" : ""}>
                    <p className="text-xs font-medium" style={{ color: "var(--text-900)" }}>{ev.description}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-300)" }}>
                      {new Date(ev.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

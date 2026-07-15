"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { ArrowLeft, RefreshCw, CheckCircle2, Circle, Clock, Activity } from "lucide-react";
import Link from "next/link";

interface ActivationDetail {
  id: string;
  sellerId: string;
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

interface SellerInfo {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  brandName: string | null;
  businessName: string | null;
  gstNumber: string | null;
  kycStatus: string;
  accountStatus: string;
  agreementAccepted: boolean;
  onboardingDone: boolean;
  createdAt: string;
  shopifyStore: { storeName: string; createdAt: string } | null;
  _count: { orders: number; listingRequests: number; walletTransactions: number };
}

const CHECKLIST = [
  { key: "accountCreated",    label: "Account Created",        desc: "Seller account registered" },
  { key: "agreementSigned",   label: "Agreement Signed",       desc: "Terms and conditions accepted" },
  { key: "businessFilled",    label: "Business Details",       desc: "Business profile completed" },
  { key: "bankFilled",        label: "Bank Details",           desc: "Bank account linked" },
  { key: "kycApproved",       label: "KYC Approved",           desc: "Identity verified by admin" },
  { key: "shopifyConnected",  label: "Shopify Connected",      desc: "Store connected via API" },
  { key: "productsImported",  label: "Products Imported",      desc: "At least one listing requested" },
  { key: "listingRequested",  label: "Listing Requested",      desc: "Marketplace listing submitted" },
  { key: "firstListingLive",  label: "First Listing Live",     desc: "Product live on marketplace" },
  { key: "firstOrderReceived",label: "First Order Received",   desc: "First sale completed" },
  { key: "firstOrderDelivered",label: "First Order Delivered", desc: "First order delivered" },
  { key: "walletActive",      label: "Wallet Active",          desc: "Settlement processed to wallet" },
] as const;

function healthColor(label: string): string {
  if (label === "Excellent") return "var(--green-500)";
  if (label === "Good") return "#3B82F6";
  if (label === "Needs Attention") return "#F59E0B";
  return "#EF4444";
}

export default function SellerActivationDetailPage({ params }: { params: Promise<{ sellerId: string }> }) {
  const { sellerId } = use(params);
  const [activation, setActivation] = useState<ActivationDetail | null>(null);
  const [seller, setSeller] = useState<SellerInfo | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/admin/activation/${sellerId}`);
    if (res.ok) {
      const d = await res.json();
      setActivation(d.activation);
      setSeller(d.seller);
      setTimeline(d.timeline ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [sellerId]);

  const forceRefresh = async () => {
    setRefreshing(true);
    await fetch(`/api/admin/activation/${sellerId}`, { method: "POST" });
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-32 rounded-xl animate-pulse" style={{ background: "var(--bg-card)" }} />
      </div>
    );
  }

  if (!activation || !seller) {
    return (
      <div className="p-6">
        <Link href="/admin/activation" className="flex items-center gap-2 text-sm mb-6" style={{ color: "var(--text-400)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Activation
        </Link>
        <p style={{ color: "var(--text-400)" }}>Seller not found.</p>
      </div>
    );
  }

  const hc = healthColor(activation.healthLabel);
  const doneCount = CHECKLIST.filter(c => (activation as unknown as Record<string, boolean>)[c.key]).length;

  return (
    <div className="p-6 space-y-6">
      {/* Back + Header */}
      <div>
        <Link href="/admin/activation" className="flex items-center gap-1.5 text-sm mb-4" style={{ color: "var(--text-400)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Activation
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-900)" }}>{seller.name ?? seller.email}</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-400)" }}>{seller.email} · Joined {new Date(seller.createdAt).toLocaleDateString("en-IN")}</p>
          </div>
          <button onClick={forceRefresh}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
            style={{ border: "1px solid var(--border)", color: "var(--text-400)" }}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Recompute
          </button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--text-400)" }}>Activation</p>
          <p className="text-3xl font-bold" style={{ color: "var(--text-900)" }}>{activation.activationPct}%</p>
          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
            <div className="h-full rounded-full" style={{ width: `${activation.activationPct}%`, background: activation.activationPct >= 80 ? "var(--green-500)" : "#3B82F6" }} />
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--text-400)" }}>Health</p>
          <p className="text-xl font-bold" style={{ color: hc }}>{activation.healthLabel}</p>
          <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--text-900)" }}>{activation.healthScore}<span className="text-sm font-normal" style={{ color: "var(--text-400)" }}>/100</span></p>
        </div>
        <div className="p-4 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--text-400)" }}>Checklist</p>
          <p className="text-2xl font-bold" style={{ color: "var(--text-900)" }}>{doneCount}<span className="text-sm font-normal" style={{ color: "var(--text-400)" }}>/{CHECKLIST.length}</span></p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-300)" }}>steps completed</p>
        </div>
        <div className="p-4 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-xs mb-1" style={{ color: "var(--text-400)" }}>Orders</p>
          <p className="text-2xl font-bold" style={{ color: "var(--text-900)" }}>{seller._count.orders}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-300)" }}>{seller._count.listingRequests} listings · {seller._count.walletTransactions} txns</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Checklist */}
        <div className="p-5 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-900)" }}>Activation Checklist</h2>
          <div className="space-y-2.5">
            {CHECKLIST.map(({ key, label, desc }) => {
              const done = (activation as unknown as Record<string, boolean>)[key];
              return (
                <div key={key} className="flex items-start gap-3">
                  {done
                    ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--green-500)" }} />
                    : <Circle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--text-300)" }} />
                  }
                  <div>
                    <p className="text-sm font-medium" style={{ color: done ? "var(--text-900)" : "var(--text-400)" }}>{label}</p>
                    <p className="text-xs" style={{ color: "var(--text-300)" }}>{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Seller Info + Timeline */}
        <div className="space-y-4">
          {/* Seller Info */}
          <div className="p-5 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-900)" }}>Seller Details</h2>
            <div className="space-y-2 text-sm">
              {[
                { label: "Brand", value: seller.brandName },
                { label: "Business", value: seller.businessName },
                { label: "Phone", value: seller.phone },
                { label: "GST", value: seller.gstNumber },
                { label: "KYC", value: seller.kycStatus },
                { label: "Account", value: seller.accountStatus },
                { label: "Shopify", value: seller.shopifyStore?.storeName },
              ].map(({ label, value }) => value && (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-20 flex-shrink-0 text-xs" style={{ color: "var(--text-400)" }}>{label}</span>
                  <span className="text-xs font-medium" style={{ color: "var(--text-900)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="p-5 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-900)" }}>
              <Activity className="w-4 h-4" style={{ color: "var(--accent)" }} />
              Timeline
            </h2>
            {timeline.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--text-300)" }}>No events yet</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {[...timeline].reverse().map((ev) => (
                  <div key={ev.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "var(--accent)" }} />
                      <div className="w-px flex-1 mt-1" style={{ background: "var(--border)" }} />
                    </div>
                    <div className="pb-3">
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
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, User, Building2, CreditCard, ShoppingCart, Receipt,
  Wallet, BanknoteIcon, ShieldCheck, Store, RefreshCw, ExternalLink,
  CheckCircle2, XCircle, Clock,
} from "lucide-react";

interface SellerDetail {
  seller: {
    id: string; name: string | null; email: string; phone: string | null;
    brandName: string | null; businessName: string | null; businessAddress: string | null;
    pincode: string | null; gstNumber: string | null; plan: string | null; planTier: string | null;
    accountStatus: string; kycStatus: string; aadhaarNumber: string | null; aadhaarDocUrl: string | null;
    onboardingDone: boolean; agreementAccepted: boolean; agreementAcceptedAt: string | null;
    paymentReference: string | null; paymentConfirmed: boolean;
    bankName: string | null; bankHolder: string | null; bankAccount: string | null; bankIfsc: string | null;
    createdAt: string;
  };
  orderSummary: { totalOrders: number; totalRevenue: number; deliveredCount: number; rtoCount: number; cancelledCount: number };
  recentOrders: { id: string; externalOrderId: string; status: string; totalAmount: number; createdAt: string; source: string }[];
  settlementSummary: { count: number; grossRevenue: number; netPayable: number; platformFee: number };
  recentSettlements: { id: string; orderId: string; status: string; sellingPrice: number; netPayable: number; createdAt: string }[];
  wallet: { balance: number; upcomingAmount: number; transactions: { id: string; type: string; amount: number; note: string | null; bankTxId: string | null; remittanceDate: string | null; createdAt: string }[] };
  withdrawals: { id: string; amount: number; status: string; adminNote: string | null; bankAccount: string; createdAt: string }[];
  shopifyStore: { storeUrl: string; storeName: string | null } | null;
}

const TABS = [
  { id: "overview",     label: "Overview",     icon: User },
  { id: "orders",       label: "Orders",       icon: ShoppingCart },
  { id: "settlements",  label: "Settlements",  icon: Receipt },
  { id: "wallet",       label: "Wallet",       icon: Wallet },
  { id: "withdrawals",  label: "Withdrawals",  icon: BanknoteIcon },
  { id: "kyc",          label: "KYC",          icon: ShieldCheck },
];

const STATUS_COLOR: Record<string, string> = {
  DELIVERED: "#00C67A", RTO: "#F59E0B", CANCELLED: "#EF4444",
  SHIPPED: "#3B82F6", IN_TRANSIT: "#8B5CF6", NEW: "#6B7280", PROCESSING: "#6B7280",
};
const SETTLEMENT_COLOR: Record<string, string> = {
  SETTLED: "#00C67A", PENDING: "#F59E0B", PROCESSING: "#3B82F6",
  DISPUTED: "#EF4444", REVERSED: "#9CA3AF",
};
const KYC_COLOR: Record<string, string> = {
  APPROVED: "#00C67A", SUBMITTED: "#3B82F6", REJECTED: "#EF4444", NOT_SUBMITTED: "#9CA3AF",
};
const ACCT_COLOR: Record<string, { bg: string; color: string }> = {
  ACTIVE:    { bg: "#F0FDF4", color: "#15803D" },
  PENDING:   { bg: "#FEF3C7", color: "#D97706" },
  SUSPENDED: { bg: "#FEF2F2", color: "#DC2626" },
};

function inr(n: number) {
  return "₹" + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 p-3 rounded-xl" style={{ background: "var(--bg-muted)", border: "1px solid var(--border)" }}>
      <span className="text-xs" style={{ color: "var(--text-400)" }}>{label}</span>
      <span className="text-sm font-semibold break-all" style={{ color: value ? "var(--text-900)" : "var(--text-300)" }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

export default function SellerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();
  const [data,    setData]    = useState<SellerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("overview");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/sellers/${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
        <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "var(--text-400)" }} />
      </div>
    );
  }

  if (!data?.seller) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
        <p style={{ color: "var(--text-400)" }}>Seller not found.</p>
      </div>
    );
  }

  const { seller, orderSummary, recentOrders, settlementSummary, recentSettlements, wallet, withdrawals, shopifyStore } = data;
  const acctStyle = ACCT_COLOR[seller.accountStatus] ?? ACCT_COLOR.PENDING;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      {/* ── Header ── */}
      <div className="px-4 md:px-8 pt-6 pb-4">
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm mb-4"
          style={{ color: "var(--text-400)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Sellers
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
              style={{ background: "var(--bg-sidebar)" }}>
              {(seller.name ?? seller.email)[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold" style={{ color: "var(--text-900)" }}>
                  {seller.brandName ?? seller.name ?? seller.email}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: acctStyle.bg, color: acctStyle.color }}>
                  {seller.accountStatus}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: "#EFF6FF", color: KYC_COLOR[seller.kycStatus] ?? "#9CA3AF" }}>
                  KYC: {seller.kycStatus.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-400)" }}>
                {seller.email} {seller.phone ? `· ${seller.phone}` : ""} · Joined {fmtDate(seller.createdAt)}
              </p>
              {shopifyStore && (
                <a href={`https://${shopifyStore.storeUrl}`} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs mt-1"
                  style={{ color: "#00C67A" }}>
                  <Store className="w-3 h-3" /> {shopifyStore.storeName ?? shopifyStore.storeUrl}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── KPI strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
          {[
            { label: "Total Orders",    value: orderSummary.totalOrders,    color: "#3B82F6" },
            { label: "Delivered",       value: orderSummary.deliveredCount,  color: "#00C67A" },
            { label: "RTO",             value: orderSummary.rtoCount,        color: "#F59E0B" },
            { label: "Wallet Balance",  value: inr(wallet.balance),          color: "#00C67A" },
            { label: "Total Settled",   value: inr(settlementSummary.netPayable), color: "#8B5CF6" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl px-4 py-3 card">
              <p className="text-xs" style={{ color: "var(--text-400)" }}>{label}</p>
              <p className="text-xl font-bold mt-0.5" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="px-4 md:px-8">
        <div className="flex items-center gap-1 border-b overflow-x-auto" style={{ borderColor: "var(--border)" }}>
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all"
                style={tab === t.id
                  ? { color: "#00C67A", borderBottom: "2px solid #00C67A" }
                  : { color: "var(--text-400)" }}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 space-y-4">

        {/* ── Overview ── */}
        {tab === "overview" && (
          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4" style={{ color: "var(--text-400)" }} />
                <h3 className="text-sm font-bold" style={{ color: "var(--text-900)" }}>Business Details</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <InfoRow label="Business Name"  value={seller.businessName} />
                <InfoRow label="Brand Name"     value={seller.brandName} />
                <InfoRow label="GST Number"     value={seller.gstNumber} />
                <InfoRow label="Phone"          value={seller.phone} />
                <InfoRow label="Address"        value={seller.businessAddress} />
                <InfoRow label="Pincode"        value={seller.pincode} />
                <InfoRow label="Plan"           value={seller.plan ?? undefined} />
                <InfoRow label="Plan Tier"      value={seller.planTier ?? undefined} />
                <InfoRow label="Payment Ref"    value={seller.paymentReference ?? undefined} />
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-4 h-4" style={{ color: "var(--text-400)" }} />
                <h3 className="text-sm font-bold" style={{ color: "var(--text-900)" }}>Bank Details</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <InfoRow label="Bank Name"    value={seller.bankName} />
                <InfoRow label="Holder Name"  value={seller.bankHolder} />
                <InfoRow label="Account No."  value={seller.bankAccount} />
                <InfoRow label="IFSC Code"    value={seller.bankIfsc} />
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4" style={{ color: "var(--text-400)" }} />
                <h3 className="text-sm font-bold" style={{ color: "var(--text-900)" }}>Onboarding Status</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <InfoRow label="Onboarding"       value={seller.onboardingDone ? "Complete ✓" : "In Progress"} />
                <InfoRow label="Agreement"        value={seller.agreementAccepted ? `Accepted ${seller.agreementAcceptedAt ? fmtDate(seller.agreementAcceptedAt) : ""}` : "Not accepted"} />
                <InfoRow label="Payment Verified" value={seller.paymentConfirmed ? "Yes ✓" : "Pending"} />
              </div>
            </div>
          </div>
        )}

        {/* ── Orders ── */}
        {tab === "orders" && (
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="text-sm font-bold" style={{ color: "var(--text-900)" }}>
                Recent Orders ({orderSummary.totalOrders} total · {inr(orderSummary.totalRevenue)} GMV)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
                    {["Order ID", "Status", "Amount", "Source", "Date"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--text-400)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {recentOrders.length === 0 ? (
                    <tr><td colSpan={5} className="py-10 text-center text-sm" style={{ color: "var(--text-400)" }}>No orders yet</td></tr>
                  ) : recentOrders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50/10">
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-900)" }}>#{o.externalOrderId}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold" style={{ color: STATUS_COLOR[o.status] ?? "#6B7280" }}>{o.status}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-xs" style={{ color: "var(--text-900)" }}>{inr(o.totalAmount)}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>{o.source}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>{fmtDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Settlements ── */}
        {tab === "settlements" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Settlements", value: settlementSummary.count.toString() },
                { label: "Gross Revenue",     value: inr(settlementSummary.grossRevenue) },
                { label: "Net Payable",       value: inr(settlementSummary.netPayable) },
                { label: "Platform Fees",     value: inr(settlementSummary.platformFee) },
              ].map(({ label, value }) => (
                <div key={label} className="card p-4">
                  <p className="text-xs" style={{ color: "var(--text-400)" }}>{label}</p>
                  <p className="text-xl font-bold mt-0.5" style={{ color: "var(--text-900)" }}>{value}</p>
                </div>
              ))}
            </div>
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="text-sm font-bold" style={{ color: "var(--text-900)" }}>Recent Settlements</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-muted)" }}>
                      {["Order ID", "Status", "Selling Price", "Net Payable", "Date"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--text-400)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {recentSettlements.length === 0 ? (
                      <tr><td colSpan={5} className="py-10 text-center text-sm" style={{ color: "var(--text-400)" }}>No settlements yet</td></tr>
                    ) : recentSettlements.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50/10">
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-900)" }}>{s.orderId.slice(-8)}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold" style={{ color: SETTLEMENT_COLOR[s.status] ?? "#6B7280" }}>{s.status}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold" style={{ color: "var(--text-900)" }}>{inr(s.sellingPrice)}</td>
                        <td className="px-4 py-3 text-xs font-semibold" style={{ color: "#00C67A" }}>{inr(s.netPayable)}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--text-400)" }}>{fmtDate(s.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Wallet ── */}
        {tab === "wallet" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4">
                <p className="text-xs" style={{ color: "var(--text-400)" }}>Available Balance</p>
                <p className="text-2xl font-bold mt-0.5" style={{ color: "#00C67A" }}>{inr(wallet.balance)}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs" style={{ color: "var(--text-400)" }}>Upcoming Payout</p>
                <p className="text-2xl font-bold mt-0.5" style={{ color: "#F59E0B" }}>{inr(wallet.upcomingAmount)}</p>
              </div>
            </div>
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="text-sm font-bold" style={{ color: "var(--text-900)" }}>Wallet Transactions</span>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {wallet.transactions.length === 0 ? (
                  <div className="py-10 text-center text-sm" style={{ color: "var(--text-400)" }}>No transactions</div>
                ) : wallet.transactions.map(t => (
                  <div key={t.id} className="px-5 py-3.5 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-900)" }}>
                        {t.note ?? (t.type === "CREDIT" ? "Credit" : "Debit")}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>{fmtDate(t.createdAt)}</p>
                    </div>
                    <p className="text-sm font-bold flex-shrink-0" style={{ color: t.type === "CREDIT" ? "#00C67A" : "#EF4444" }}>
                      {t.type === "CREDIT" ? "+" : "−"}{inr(t.amount)}
                    </p>
                    {t.bankTxId
                      ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#00C67A" }} />
                      : <Clock className="w-4 h-4 flex-shrink-0" style={{ color: "#F59E0B" }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Withdrawals ── */}
        {tab === "withdrawals" && (
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="text-sm font-bold" style={{ color: "var(--text-900)" }}>Withdrawal Requests</span>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {withdrawals.length === 0 ? (
                <div className="py-10 text-center text-sm" style={{ color: "var(--text-400)" }}>No withdrawal requests</div>
              ) : withdrawals.map(w => (
                <div key={w.id} className="px-5 py-3.5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>{inr(w.amount)}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>
                      {fmtDate(w.createdAt)} {w.adminNote ? `· ${w.adminNote}` : ""}
                    </p>
                  </div>
                  <span className="text-xs font-bold" style={{
                    color: w.status === "APPROVED" ? "#00C67A" : w.status === "REJECTED" ? "#EF4444" : "#F59E0B"
                  }}>{w.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── KYC ── */}
        {tab === "kyc" && (
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4" style={{ color: "var(--text-400)" }} />
              <h3 className="text-sm font-bold" style={{ color: "var(--text-900)" }}>KYC Details</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold ml-auto"
                style={{ background: "#EFF6FF", color: KYC_COLOR[seller.kycStatus] ?? "#9CA3AF" }}>
                {seller.kycStatus.replace("_", " ")}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <InfoRow label="Aadhaar Number" value={seller.aadhaarNumber} />
              <InfoRow label="KYC Status"     value={seller.kycStatus.replace("_", " ")} />
              <InfoRow label="GST Number"     value={seller.gstNumber} />
            </div>
            {seller.aadhaarDocUrl && (
              <a href={seller.aadhaarDocUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold"
                style={{ color: "#3B82F6" }}>
                <ExternalLink className="w-4 h-4" /> View KYC Document
              </a>
            )}
            {!seller.aadhaarDocUrl && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-400)" }}>
                <XCircle className="w-4 h-4" /> No document uploaded
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

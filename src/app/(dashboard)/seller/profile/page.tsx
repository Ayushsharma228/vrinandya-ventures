"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { User, Mail, Phone, Building2, FileText, CreditCard, Lock, Save, CheckCircle2, AlertCircle, Plug } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

const TABS = [
  { id: "personal",     label: "Personal Info",    icon: User },
  { id: "business",     label: "Business Details", icon: Building2 },
  { id: "bank",         label: "Bank Details",     icon: CreditCard },
  { id: "password",     label: "Password",         icon: Lock },
  { id: "integrations", label: "Integrations",     icon: Plug },
];

export default function SellerProfilePage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const metaStatus = searchParams.get("meta");
  const shopifyStatus = searchParams.get("shopify");
  const [activeTab, setActiveTab] = useState(
    metaStatus === "connected" || metaStatus === "denied" || metaStatus === "error" ||
    shopifyStatus === "connected" || shopifyStatus === "denied" || shopifyStatus === "error"
      ? "integrations"
      : "personal"
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [personal, setPersonal] = useState({ name: "", email: "", phone: "" });
  const [business, setBusiness] = useState({ brandName: "", gst: "" });
  const [bank, setBank] = useState({ accountHolder: "", accountNumber: "", ifsc: "", bankName: "" });
  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [metaConnected, setMetaConnected] = useState(false);
  const [metaLoading, setMetaLoading] = useState(false);
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [shopifyStore, setShopifyStore] = useState<{ storeUrl: string; storeName: string } | null>(null);
  const [shopifyLoading, setShopifyLoading] = useState(false);
  const [shopifyInput, setShopifyInput] = useState("");
  const [showShopifyInput, setShowShopifyInput] = useState(false);

  useEffect(() => {
    fetch("/api/seller/profile").then((r) => r.json()).then((d) => {
      if (d.user) {
        setPersonal({ name: d.user.name ?? "", email: d.user.email ?? "", phone: d.user.phone ?? "" });
        setBusiness({ brandName: d.user.brandName ?? "", gst: d.user.gstNumber ?? "" });
        setBank({ accountHolder: d.user.bankHolder ?? "", accountNumber: d.user.bankAccount ?? "", ifsc: d.user.bankIfsc ?? "", bankName: d.user.bankName ?? "" });
        setMetaConnected(!!d.user.metaAdAccountId);
        if (d.user.shopifyStore) {
          setShopifyConnected(true);
          setShopifyStore(d.user.shopifyStore);
        }
      }
    });
  }, []);

  async function handleMetaDisconnect() {
    setMetaLoading(true);
    await fetch("/api/seller/meta/disconnect", { method: "POST" });
    setMetaConnected(false);
    setMetaLoading(false);
  }

  async function handleShopifyDisconnect() {
    setShopifyLoading(true);
    await fetch("/api/shopify/disconnect", { method: "POST" });
    setShopifyConnected(false);
    setShopifyStore(null);
    setShopifyLoading(false);
  }

  function handleShopifyConnect() {
    const domain = shopifyInput.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!domain) return;
    window.location.href = `/api/shopify/connect?shop=${encodeURIComponent(domain)}`;
  }

  async function handleSave() {
    setSaving(true); setError(""); setSaved(false);
    let body: Record<string, unknown> = {};
    if (activeTab === "personal") body = { type: "personal", ...personal };
    else if (activeTab === "business") body = { type: "business", ...business };
    else if (activeTab === "bank") body = { type: "bank", ...bank };
    else if (activeTab === "password") body = { type: "password", ...passwords };

    const res = await fetch("/api/seller/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) {
      setSaved(true);
      if (activeTab === "password") setPasswords({ current: "", newPass: "", confirm: "" });
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(data.error || "Failed to save");
    }
    setSaving(false);
  }

  const initial = (session?.user?.name?.[0] ?? "S").toUpperCase();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero title="My Profile" subtitle="Manage your personal, business and bank details" />

      <div className="px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left — avatar + tabs */}
          <div className="space-y-4">
            <div className="card p-5 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-3"
                style={{ background: "var(--bg-sidebar)" }}>
                {initial}
              </div>
              <p className="font-semibold text-sm" style={{ color: "var(--text-900)" }}>{session?.user?.name}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>{session?.user?.email}</p>
              <span className="mt-2 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: "#F0FDF4", color: "var(--green-500)" }}>Seller</span>
            </div>

            <div className="card overflow-hidden">
              {TABS.map((t) => {
                const Icon = t.icon;
                return (
                  <button key={t.id} onClick={() => { setActiveTab(t.id); setError(""); setSaved(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left"
                    style={{
                      background: activeTab === t.id ? "rgba(13,31,19,0.05)" : "transparent",
                      color: activeTab === t.id ? "var(--bg-sidebar)" : "var(--text-400)",
                      borderLeft: activeTab === t.id ? "3px solid var(--green-500)" : "3px solid transparent",
                    }}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right — form */}
          <div className="md:col-span-3 card p-6">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4"
                style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid #FEE2E2" }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            {activeTab === "personal" && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold" style={{ color: "var(--text-900)" }}>Personal Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={User} label="Full Name" value={personal.name} onChange={v => setPersonal(p => ({ ...p, name: v }))} />
                  <Field icon={Mail} label="Email Address" value={personal.email} onChange={() => {}} type="email" disabled />
                  <Field icon={Phone} label="Phone Number" value={personal.phone} onChange={v => setPersonal(p => ({ ...p, phone: v }))} type="tel" />
                </div>
              </div>
            )}

            {activeTab === "business" && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold" style={{ color: "var(--text-900)" }}>Business Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={Building2} label="Brand / Business Name" value={business.brandName} onChange={v => setBusiness(p => ({ ...p, brandName: v }))} />
                  <Field icon={FileText} label="GST Number (optional)" value={business.gst} onChange={v => setBusiness(p => ({ ...p, gst: v }))} />
                </div>
              </div>
            )}

            {activeTab === "bank" && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold" style={{ color: "var(--text-900)" }}>Bank Details</h2>
                <p className="text-xs" style={{ color: "var(--text-400)" }}>Used for remittance payouts</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={User} label="Account Holder Name" value={bank.accountHolder} onChange={v => setBank(p => ({ ...p, accountHolder: v }))} />
                  <Field icon={CreditCard} label="Account Number" value={bank.accountNumber} onChange={v => setBank(p => ({ ...p, accountNumber: v }))} />
                  <Field icon={Building2} label="IFSC Code" value={bank.ifsc} onChange={v => setBank(p => ({ ...p, ifsc: v }))} />
                  <Field icon={Building2} label="Bank Name" value={bank.bankName} onChange={v => setBank(p => ({ ...p, bankName: v }))} />
                </div>
              </div>
            )}

            {activeTab === "integrations" && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold" style={{ color: "var(--text-900)" }}>Integrations</h2>
                <p className="text-xs" style={{ color: "var(--text-400)" }}>Connect third-party accounts to sync data automatically.</p>

                {metaStatus === "connected" && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                    style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}>
                    ✓ Meta Ads connected successfully. Your ad spend will sync daily.
                  </div>
                )}
                {(metaStatus === "denied" || metaStatus === "error") && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                    style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid #FEE2E2" }}>
                    ✗ Meta connection {metaStatus === "denied" ? "was cancelled" : "failed"}. Please try again.
                  </div>
                )}
                {shopifyStatus === "connected" && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                    style={{ background: "#F0FDF4", color: "#16A34A", border: "1px solid #BBF7D0" }}>
                    ✓ Shopify store connected successfully. Orders will sync automatically.
                  </div>
                )}
                {(shopifyStatus === "denied" || shopifyStatus === "error") && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                    style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid #FEE2E2" }}>
                    ✗ Shopify connection {shopifyStatus === "denied" ? "was cancelled" : "failed"}. Please try again.
                  </div>
                )}

                {/* Meta Ads */}
                <div className="rounded-xl p-5 flex items-center justify-between gap-4"
                  style={{ border: "1px solid var(--border)", background: "var(--bg-page)" }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                      style={{ background: "#1877F2" }}>f</div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Meta Ads</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>
                        {metaConnected ? "Ad account connected — spend syncs daily" : "Connect to sync your ad spend to the dashboard"}
                      </p>
                    </div>
                  </div>

                  {metaConnected ? (
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                        style={{ background: "#F0FDF4", color: "#16A34A" }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        Connected
                      </span>
                      <button
                        onClick={handleMetaDisconnect}
                        disabled={metaLoading}
                        className="text-xs font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                        style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid #FEE2E2" }}>
                        {metaLoading ? "Disconnecting..." : "Disconnect"}
                      </button>
                    </div>
                  ) : (
                    <a href="/api/seller/meta/connect"
                      className="text-xs font-semibold px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
                      style={{ background: "#1877F2" }}>
                      Connect
                    </a>
                  )}
                </div>

                {/* Shopify */}
                <div className="rounded-xl p-5 flex flex-col gap-4"
                  style={{ border: "1px solid var(--border)", background: "var(--bg-page)" }}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "#96BF48" }}>
                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                          <path d="M15.337 23.979l6.15-1.33S18.769 7.823 18.75 7.706c-.019-.116-.116-.194-.213-.194s-1.922-.136-1.922-.136-.504-.503-1.272-.503c-.194 0-.388.019-.582.058.019.058.039.116.058.174.58.233.97.601.97.601s-.194-.097-.407-.097c-.194 0-.368.058-.503.155-.155-1.039-.911-1.786-1.942-1.786-.039 0-.077 0-.116.001-.291-.367-.678-.581-1.058-.581-.174 0-.349.039-.504.116C11.026 4.61 9.997 3.29 8.745 3.29c-.814 0-1.551.426-2.133 1.116-.407-.116-.834-.174-1.28-.174-1.59 0-2.754 1.01-3.23 2.522C1.319 7.609.892 9.054.892 10.519c0 1.961.891 3.019 2.406 3.019.387 0 .794-.077 1.2-.213v.058c0 1.513.814 2.367 2.036 2.367.116 0 .233-.01.349-.029.155.542.407 1.048.737 1.474-.58.155-1.085.407-1.494.737l4.868 5.786 4.343-1.745zM12 4.028c-.155.638-.407 1.687-.814 2.812-.717-.426-1.551-.639-2.406-.639.019-.029.039-.077.058-.116C9.453 4.61 10.5 4.028 12 4.028z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Shopify</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>
                          {shopifyConnected
                            ? `${shopifyStore?.storeName} (${shopifyStore?.storeUrl})`
                            : "Connect to auto-sync orders from your Shopify store"}
                        </p>
                      </div>
                    </div>

                    {shopifyConnected ? (
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                          style={{ background: "#F0FDF4", color: "#16A34A" }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                          Connected
                        </span>
                        <button onClick={handleShopifyDisconnect} disabled={shopifyLoading}
                          className="text-xs font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                          style={{ background: "#FEF2F2", color: "#EF4444", border: "1px solid #FEE2E2" }}>
                          {shopifyLoading ? "Disconnecting..." : "Disconnect"}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setShowShopifyInput(v => !v)}
                        className="text-xs font-semibold px-4 py-2 rounded-xl text-white flex-shrink-0 transition-opacity hover:opacity-90"
                        style={{ background: "#96BF48" }}>
                        Connect
                      </button>
                    )}
                  </div>

                  {showShopifyInput && !shopifyConnected && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="yourstore.myshopify.com"
                        value={shopifyInput}
                        onChange={e => setShopifyInput(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleShopifyConnect()}
                        className="flex-1 px-3 py-2 text-sm rounded-xl outline-none"
                        style={{ border: "1px solid var(--border)", background: "white", color: "var(--text-900)" }}
                        onFocus={e => e.currentTarget.style.border = "1px solid #96BF48"}
                        onBlur={e => e.currentTarget.style.border = "1px solid var(--border)"}
                      />
                      <button onClick={handleShopifyConnect}
                        className="px-4 py-2 text-xs font-semibold rounded-xl text-white"
                        style={{ background: "#96BF48" }}>
                        Authorize
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "password" && (
              <div className="space-y-5">
                <h2 className="text-base font-semibold" style={{ color: "var(--text-900)" }}>Change Password</h2>
                <div className="grid grid-cols-1 gap-4 max-w-sm">
                  <Field icon={Lock} label="Current Password" value={passwords.current} onChange={v => setPasswords(p => ({ ...p, current: v }))} type="password" />
                  <Field icon={Lock} label="New Password" value={passwords.newPass} onChange={v => setPasswords(p => ({ ...p, newPass: v }))} type="password" />
                  <Field icon={Lock} label="Confirm New Password" value={passwords.confirm} onChange={v => setPasswords(p => ({ ...p, confirm: v }))} type="password" />
                </div>
              </div>
            )}

            {activeTab !== "integrations" && <div className="mt-6 pt-5 flex items-center gap-3" style={{ borderTop: "1px solid var(--border)" }}>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
                style={{ background: saved ? "#16A34A" : "var(--green-500)" }}>
                {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : saving ? "Saving..." : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value, onChange, type = "text", disabled = false }: {
  icon: React.ElementType; label: string; value: string;
  onChange: (v: string) => void; type?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-600)" }}>{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-400)" }} />
        <input type={type} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ border: "1px solid var(--border)", background: disabled ? "#F9FAFB" : "white", color: "var(--text-900)" }}
          onFocus={e => { if (!disabled) e.currentTarget.style.border = "1px solid var(--green-500)"; }}
          onBlur={e => { e.currentTarget.style.border = "1px solid var(--border)"; }}
        />
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, ExternalLink, Trash2, Loader2, ShoppingBag, Key, Info } from "lucide-react";

interface Store {
  id: string;
  storeName: string;
  storeUrl: string;
  createdAt: string;
}

export default function ShopifyConnectPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [storeUrl, setStoreUrl] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/seller/shopify/store")
      .then((r) => r.json())
      .then((d) => { setStore(d.store ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setConnecting(true);
    const shop = storeUrl.trim().replace("https://", "").replace(/\/$/, "");
    const domain = shop.includes(".myshopify.com") ? shop : `${shop}.myshopify.com`;
    const res = await fetch("/api/seller/shopify/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeUrl: domain, accessToken: accessToken.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Connection failed"); setConnecting(false); return; }
    setStore(data.store);
    setSuccess(true);
    setStoreUrl(""); setAccessToken("");
    setConnecting(false);
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect your Shopify store? Orders will stop syncing.")) return;
    setDisconnecting(true);
    await fetch("/api/seller/shopify/store", { method: "DELETE" });
    setStore(null);
    setSuccess(false);
    setDisconnecting(false);
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Connect Shopify Store</h1>
        <p className="text-sm text-gray-500 mt-0.5">Link your Shopify store to sync orders automatically</p>
      </div>

      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">Shopify store connected successfully!</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>

      ) : store ? (
        /* ── Connected state ── */
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
            <span className="text-sm font-semibold text-gray-700">Store Connected</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">{store.storeName}</h3>
                <a href={`https://${store.storeUrl}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-500 hover:underline mt-0.5">
                  {store.storeUrl} <ExternalLink className="w-3 h-3" />
                </a>
                <p className="text-xs text-gray-400 mt-1">
                  Connected {new Date(store.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {["Orders sync", "Products sync", "Inventory sync"].map((f) => (
                <div key={f} className="bg-green-50 rounded-lg px-3 py-2 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-green-700">{f}</span>
                </div>
              ))}
            </div>

            <button onClick={handleDisconnect} disabled={disconnecting}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
              <Trash2 className="w-4 h-4" />
              {disconnecting ? "Disconnecting..." : "Disconnect Store"}
            </button>
          </div>
        </div>

      ) : (
        /* ── Connect form ── */
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
          {/* Instructions */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-blue-800">How to get your Access Token</p>
              <ol className="text-xs text-blue-700 space-y-0.5 list-decimal list-inside">
                <li>Go to your Shopify Admin → Settings → Apps and sales channels</li>
                <li>Click <strong>Develop apps</strong> → Create an app</li>
                <li>Under <strong>Configuration</strong>, enable Orders (read) scope</li>
                <li>Click <strong>Install app</strong> and copy the Admin API access token</li>
              </ol>
            </div>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Store URL
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-transparent">
                <span className="px-3 py-2.5 text-sm text-gray-400 bg-gray-50 border-r border-gray-200 whitespace-nowrap">
                  https://
                </span>
                <input
                  type="text"
                  value={storeUrl}
                  onChange={(e) => setStoreUrl(e.target.value)}
                  placeholder="your-store-name"
                  required
                  className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                />
                <span className="px-3 py-2.5 text-sm text-gray-400 bg-gray-50 border-l border-gray-200 whitespace-nowrap">
                  .myshopify.com
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                e.g. if your store is <strong>mystore.myshopify.com</strong>, enter <strong>mystore</strong>
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Admin API Access Token
              </label>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 focus-within:border-transparent">
                <span className="px-3 py-2.5 bg-gray-50 border-r border-gray-200">
                  <Key className="w-4 h-4 text-gray-400" />
                </span>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="shpat_xxxxxxxxxxxxxxxxxxxx"
                  required
                  className="flex-1 px-3 py-2.5 text-sm focus:outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={connecting || !storeUrl.trim() || !accessToken.trim()}
              className="w-full py-3 font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              style={{ background: "#00C67A", color: "white" }}
            >
              {connecting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
                : <><ShoppingBag className="w-4 h-4" /> Connect Store</>
              }
            </button>
          </form>

          <p className="text-xs text-center text-gray-400">
            Your access token is encrypted and stored securely. It is only used to read orders from your store.
          </p>
        </div>
      )}
    </div>
  );
}

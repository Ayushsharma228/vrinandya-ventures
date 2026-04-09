"use client";

import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, ExternalLink, Trash2, Loader2, ShoppingBag } from "lucide-react";

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
    if (!storeUrl.trim() || !accessToken.trim()) return;
    setConnecting(true);

    const shop = storeUrl.trim().replace("https://", "").replace(/\/$/, "");
    const domain = shop.includes(".myshopify.com") ? shop : `${shop}.myshopify.com`;

    const res = await fetch("/api/seller/shopify/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeUrl: domain, accessToken: accessToken.trim() }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Connection failed");
      setConnecting(false);
      return;
    }

    setStore(data.store);
    setSuccess(true);
    setStoreUrl("");
    setAccessToken("");
    setConnecting(false);
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect your Shopify store?")) return;
    setDisconnecting(true);
    await fetch("/api/seller/shopify/store", { method: "DELETE" });
    setStore(null);
    setSuccess(false);
    setDisconnecting(false);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Connect Shopify Store</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Link your Shopify store to sync products and orders
        </p>
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
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-semibold text-gray-700">Store Connected</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">{store.storeName}</h3>
                <a
                  href={`https://${store.storeUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-500 hover:underline mt-0.5"
                >
                  {store.storeUrl} <ExternalLink className="w-3 h-3" />
                </a>
                <p className="text-xs text-gray-400 mt-1">
                  Connected {new Date(store.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {["Products sync", "Orders sync", "Inventory sync"].map((f) => (
                <div key={f} className="bg-green-50 rounded-lg px-3 py-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-green-700">{f}</span>
                </div>
              ))}
            </div>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {disconnecting ? "Disconnecting..." : "Disconnect Store"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* How to get token guide */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <p className="text-sm font-bold text-blue-800 mb-3">How to get your Access Token:</p>
            <ol className="text-sm text-blue-700 space-y-1.5 list-decimal list-inside">
              <li>Go to your Shopify Admin → <strong>Settings → Apps</strong></li>
              <li>Click <strong>Develop apps</strong> → <strong>Create an app</strong></li>
              <li>Name it anything (e.g. "Vrinandya")</li>
              <li>Click <strong>Configure Admin API scopes</strong></li>
              <li>Enable: <span className="font-mono text-xs bg-blue-100 px-1 rounded">read_products, write_products, read_orders, write_orders</span></li>
              <li>Click <strong>Save</strong> → then <strong>Install app</strong></li>
              <li>Copy the <strong>Admin API access token</strong></li>
            </ol>
          </div>

          {/* Connect Form */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Shopify Store URL
                </label>
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-400">
                  <input
                    type="text"
                    value={storeUrl}
                    onChange={(e) => setStoreUrl(e.target.value)}
                    placeholder="your-store"
                    required
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-gray-50"
                  />
                  <span className="px-3 py-2.5 text-sm text-gray-400 bg-gray-100 border-l border-gray-200">
                    .myshopify.com
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Admin API Access Token
                </label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="shpat_xxxxxxxxxxxxxxxxxxxx"
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                />
              </div>

              <button
                type="submit"
                disabled={connecting || !storeUrl.trim() || !accessToken.trim()}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {connecting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
                ) : (
                  <><ShoppingBag className="w-4 h-4" /> Connect Store</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

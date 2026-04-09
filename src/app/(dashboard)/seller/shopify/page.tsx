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
  const [shopInput, setShopInput] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") setSuccess(true);
    if (params.get("error")) setError(`Connection failed: ${params.get("error")}`);

    fetch("/api/seller/shopify/store")
      .then((r) => r.json())
      .then((d) => { setStore(d.store ?? null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (!shopInput.trim()) return;
    setConnecting(true);
    const shop = shopInput.trim().replace("https://", "").replace(".myshopify.com", "");
    window.location.href = `/api/shopify/connect?shop=${shop}`;
  }

  async function handleDisconnect() {
    if (!confirm("Disconnect your Shopify store? This will stop order syncing.")) return;
    setDisconnecting(true);
    await fetch("/api/seller/shopify/store", { method: "DELETE" });
    setStore(null);
    setDisconnecting(false);
    setSuccess(false);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Connect Shopify Store</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Link your Shopify store to sync products and orders
        </p>
      </div>

      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">Shopify store connected successfully!</p>
        </div>
      )}

      {/* Error banner */}
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
        /* Connected State */
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
                  {store.storeUrl}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <p className="text-xs text-gray-400 mt-1">
                  Connected {new Date(store.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
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
        /* Connect Form */
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Connect Your Store</h2>
              <p className="text-xs text-gray-400">Enter your Shopify store URL to get started</p>
            </div>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Shopify Store URL
              </label>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-400">
                  <input
                    type="text"
                    value={shopInput}
                    onChange={(e) => setShopInput(e.target.value)}
                    placeholder="your-store"
                    className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-gray-50"
                  />
                  <span className="px-3 py-2.5 text-sm text-gray-400 bg-gray-100 border-l border-gray-200">
                    .myshopify.com
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Example: if your store is <span className="font-mono">mystore.myshopify.com</span>, enter <span className="font-mono">mystore</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={connecting || !shopInput.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {connecting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
              ) : (
                <><ShoppingBag className="w-4 h-4" /> Connect with Shopify</>
              )}
            </button>
          </form>

          <div className="mt-5 p-4 bg-blue-50 rounded-lg">
            <p className="text-xs font-semibold text-blue-700 mb-2">What happens next:</p>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• You'll be redirected to Shopify to approve the connection</li>
              <li>• Grant access to products, orders and inventory</li>
              <li>• You'll be redirected back here automatically</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

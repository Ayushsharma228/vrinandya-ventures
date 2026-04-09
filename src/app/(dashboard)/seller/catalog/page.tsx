"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ShoppingBag, Globe, Search, Package, Loader2, Check } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
  category: string | null;
  description: string;
  images: string[];
  supplier: { name: string };
}

const MARKETPLACES = ["AMAZON", "EBAY", "ETSY", "WALMART"];

export default function SellerCatalogPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [marketplaceModal, setMarketplaceModal] = useState<string | null>(null);
  const [selectedMarketplace, setSelectedMarketplace] = useState("");

  const isMarketplace = session?.user?.plan === "MARKETPLACE";

  useEffect(() => {
    fetch("/api/seller/catalog")
      .then((r) => r.json())
      .then((d) => { setProducts(d.products || []); setLoading(false); });
  }, []);

  async function handlePushShopify(productId: string) {
    setProcessing(productId);
    const res = await fetch("/api/seller/push-shopify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.ok) setDone((prev) => ({ ...prev, [productId]: true }));
    setProcessing(null);
  }

  async function handleListMarketplace(productId: string) {
    if (!selectedMarketplace) return;
    setProcessing(productId);
    const res = await fetch("/api/seller/list-marketplace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, platform: selectedMarketplace }),
    });
    if (res.ok) {
      setDone((prev) => ({ ...prev, [`${productId}-${selectedMarketplace}`]: true }));
      setMarketplaceModal(null);
      setSelectedMarketplace("");
    }
    setProcessing(null);
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Browse approved products and {isMarketplace ? "list on marketplaces" : "push to your Shopify store"}
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name or SKU..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="w-full h-40 bg-gray-100 rounded-lg mb-3" />
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No approved products available</p>
          <p className="text-gray-400 text-sm mt-1">Products will appear here once approved by admin</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <div key={product.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Image */}
              <div className="w-full h-44 bg-gray-50 flex items-center justify-center">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-12 h-12 text-gray-200" />
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-gray-800 text-sm leading-tight">{product.name}</h3>
                  <span className="text-sm font-bold text-gray-800 ml-2 flex-shrink-0">₹{product.price.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400 mb-1">by {product.supplier.name}</p>
                {product.category && (
                  <span className="inline-block text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mb-3">
                    {product.category}
                  </span>
                )}
                <p className="text-xs text-gray-500 line-clamp-2 mb-4">{product.description}</p>

                {/* Action Button */}
                {isMarketplace ? (
                  <button
                    onClick={() => { setMarketplaceModal(product.id); setSelectedMarketplace(""); }}
                    disabled={processing === product.id}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Globe className="w-4 h-4" />
                    List on Marketplace
                  </button>
                ) : (
                  <button
                    onClick={() => handlePushShopify(product.id)}
                    disabled={processing === product.id || done[product.id]}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                      done[product.id] ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {processing === product.id ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Pushing...</>
                    ) : done[product.id] ? (
                      <><Check className="w-4 h-4" /> Pushed to Shopify</>
                    ) : (
                      <><ShoppingBag className="w-4 h-4" /> Push to Shopify</>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Marketplace Modal */}
      {marketplaceModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-1">List on Marketplace</h3>
            <p className="text-sm text-gray-400 mb-5">Select which marketplace to list this product on</p>

            <div className="grid grid-cols-2 gap-2 mb-5">
              {MARKETPLACES.map((m) => {
                const alreadyDone = done[`${marketplaceModal}-${m}`];
                return (
                  <button
                    key={m}
                    onClick={() => !alreadyDone && setSelectedMarketplace(m)}
                    disabled={alreadyDone}
                    className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      alreadyDone
                        ? "border-green-200 bg-green-50 text-green-600 cursor-default"
                        : selectedMarketplace === m
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {alreadyDone ? `✓ ${m}` : m}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setMarketplaceModal(null); setSelectedMarketplace(""); }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleListMarketplace(marketplaceModal)}
                disabled={!selectedMarketplace || processing === marketplaceModal}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {processing === marketplaceModal ? "Requesting..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

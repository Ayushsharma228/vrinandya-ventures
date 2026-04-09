"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ShoppingBag, Globe, Eye, Package, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

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

export default function SellerHomePage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [storeUrl, setStoreUrl] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);
  const [pushed, setPushed] = useState<Record<string, boolean>>({});
  const [listed, setListed] = useState<Record<string, boolean>>({});
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [marketplaceModal, setMarketplaceModal] = useState<string | null>(null);
  const [selectedMarketplace, setSelectedMarketplace] = useState("");

  const isMarketplace = session?.user?.plan === "MARKETPLACE";

  useEffect(() => {
    Promise.all([
      fetch("/api/seller/catalog").then((r) => r.json()),
      fetch("/api/seller/shopify/store").then((r) => r.json()),
    ]).then(([catalogData, storeData]) => {
      setProducts(catalogData.products || []);
      if (storeData.store) {
        setShopifyConnected(true);
        setStoreUrl(storeData.store.storeUrl);
      }
      setLoading(false);
    });
  }, []);

  function toggleSelect(id: string) {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handlePush(productId: string) {
    setProcessing(productId);
    const res = await fetch("/api/seller/push-shopify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.ok) setPushed((prev) => ({ ...prev, [productId]: true }));
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
      setListed((prev) => ({ ...prev, [`${productId}-${selectedMarketplace}`]: true }));
      setMarketplaceModal(null);
      setSelectedMarketplace("");
    }
    setProcessing(null);
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-400 mt-1">
            {isMarketplace
              ? "Browse products and list them on marketplaces"
              : "Manage and sync products to your Shopify store"}
          </p>
        </div>

        {/* Shopify connection status */}
        {!isMarketplace && (
          shopifyConnected ? (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />
              Connected to {storeUrl}
            </div>
          ) : (
            <a
              href="/seller/shopify"
              className="flex items-center gap-2 text-orange-500 text-sm font-medium hover:underline"
            >
              <AlertCircle className="w-4 h-4" />
              Connect your Shopify store
            </a>
          )
        )}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="w-full h-52 bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-20 flex flex-col items-center text-center">
          <Package className="w-14 h-14 text-gray-200 mb-4" />
          <p className="text-gray-500 font-semibold text-lg">No products available</p>
          <p className="text-gray-400 text-sm mt-1">Products approved by admin will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((product) => {
            const isPushed = pushed[product.id];
            const isProcessing = processing === product.id;
            const hasListing = Object.keys(listed).some((k) => k.startsWith(product.id));

            return (
              <div key={product.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="relative">
                  {/* Checkbox */}
                  <div className="absolute top-3 left-3 z-10">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="w-4 h-4 rounded border-gray-300 accent-blue-600 cursor-pointer"
                    />
                  </div>

                  {/* Sync Status Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    {isPushed || hasListing ? (
                      <span className="flex items-center gap-1 bg-green-500/90 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Synced
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        <AlertCircle className="w-3 h-3" /> Not Synced
                      </span>
                    )}
                  </div>

                  {/* Product Image */}
                  <div className="w-full h-52 bg-gray-50 flex items-center justify-center">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-16 h-16 text-gray-200" />
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-400 line-clamp-2 mb-3">{product.description}</p>

                  {/* Price + Buttons */}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`/seller/catalog/${product.id}`}
                        className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        View
                      </a>

                      {isMarketplace ? (
                        <button
                          onClick={() => { setMarketplaceModal(product.id); setSelectedMarketplace(""); }}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Globe className="w-3 h-3" />
                          {hasListing ? "Listed" : "List"}
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePush(product.id)}
                          disabled={isProcessing || isPushed}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 ${
                            isPushed ? "bg-green-600" : "bg-blue-600 hover:bg-blue-700"
                          }`}
                        >
                          {isProcessing ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ShoppingBag className="w-3 h-3" />
                          )}
                          {isPushed ? "Pushed" : "Push"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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
                const alreadyListed = listed[`${marketplaceModal}-${m}`];
                return (
                  <button
                    key={m}
                    onClick={() => !alreadyListed && setSelectedMarketplace(m)}
                    disabled={alreadyListed}
                    className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      alreadyListed
                        ? "border-green-200 bg-green-50 text-green-600 cursor-default"
                        : selectedMarketplace === m
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {alreadyListed ? `✓ ${m}` : m}
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
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
              >
                {processing === marketplaceModal ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

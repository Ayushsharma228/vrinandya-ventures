"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ShoppingBag, Globe, Package, Loader2, Check, Tag } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

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

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN").format(n);
}

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
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Product Catalog"
        subtitle={`${products.length} approved products available`}
        searchValue={search}
        searchPlaceholder="Search by name or SKU..."
        onSearchChange={setSearch}
      />

      <div className="px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="card animate-pulse overflow-hidden">
                <div className="w-full bg-gray-100" style={{ height: 240 }} />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-8 bg-gray-100 rounded mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card py-20 flex flex-col items-center gap-3 text-center">
            <Package className="w-14 h-14" style={{ color: "var(--border)" }} />
            <p className="font-semibold" style={{ color: "var(--text-600)" }}>
              {search ? "No products match your search" : "No approved products available"}
            </p>
            <p className="text-sm" style={{ color: "var(--text-400)" }}>
              Products approved by admin will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {filtered.map((product) => {
              const isPushed = done[product.id];
              const isProcessing = processing === product.id;
              return (
                <div key={product.id} className="card overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
                  {/* Portrait image — taller */}
                  <div className="relative w-full overflow-hidden bg-gray-50" style={{ height: 260 }}>
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12" style={{ color: "var(--border)" }} />
                      </div>
                    )}
                    {/* Pushed badge */}
                    {isPushed && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ background: "var(--green-500)" }}>
                        <Check className="w-3 h-3" /> Pushed
                      </div>
                    )}
                    {/* Category tag */}
                    {product.category && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.9)" }}>
                        <Tag className="w-2.5 h-2.5" />
                        {product.category.split(">").pop()?.trim() ?? product.category}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3.5 flex flex-col flex-1">
                    <p className="text-sm font-semibold leading-snug line-clamp-2 mb-1" style={{ color: "var(--text-900)" }}>
                      {product.name}
                    </p>
                    <p className="text-xs mb-3" style={{ color: "var(--text-400)" }}>
                      by {product.supplier.name}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-base font-bold" style={{ color: "var(--text-900)" }}>
                        ₹{fmt(product.price)}
                      </span>
                    </div>

                    {/* Action button */}
                    {isMarketplace ? (
                      <button
                        onClick={() => { setMarketplaceModal(product.id); setSelectedMarketplace(""); }}
                        disabled={isProcessing}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                        style={{ background: "#7C3AED" }}
                      >
                        <Globe className="w-4 h-4" />
                        List on Marketplace
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePushShopify(product.id)}
                        disabled={isProcessing || isPushed}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                        style={{ background: isPushed ? "var(--green-500)" : "var(--bg-sidebar)" }}
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isPushed ? (
                          <><Check className="w-4 h-4" /> Pushed to Shopify</>
                        ) : (
                          <><ShoppingBag className="w-4 h-4" /> Push to Shopify</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Marketplace Modal */}
      {marketplaceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-900)" }}>List on Marketplace</h3>
            <p className="text-sm mb-5" style={{ color: "var(--text-400)" }}>Select which marketplace to list this product on</p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {MARKETPLACES.map((m) => {
                const alreadyDone = done[`${marketplaceModal}-${m}`];
                return (
                  <button key={m} onClick={() => !alreadyDone && setSelectedMarketplace(m)} disabled={alreadyDone}
                    className="py-3 rounded-xl border-2 text-sm font-semibold transition-all"
                    style={{
                      borderColor: alreadyDone ? "#D1FAE5" : selectedMarketplace === m ? "#7C3AED" : "var(--border)",
                      background: alreadyDone ? "#F0FDF4" : selectedMarketplace === m ? "#F5F3FF" : "white",
                      color: alreadyDone ? "#00C67A" : selectedMarketplace === m ? "#7C3AED" : "var(--text-600)",
                    }}>
                    {alreadyDone ? `✓ ${m}` : m}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setMarketplaceModal(null); setSelectedMarketplace(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text-600)" }}>
                Cancel
              </button>
              <button onClick={() => handleListMarketplace(marketplaceModal)}
                disabled={!selectedMarketplace || processing === marketplaceModal}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                style={{ background: "#7C3AED" }}>
                {processing === marketplaceModal ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

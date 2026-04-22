"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ShoppingBag,
  Globe,
  ArrowLeft,
  Package,
  Play,
  Loader2,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sku: string | null;
  category: string | null;
  images: string[];
  supplier: { name: string };
}

const MARKETPLACES = ["AMAZON", "EBAY", "ETSY", "WALMART"];

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [pushed, setPushed] = useState(false);
  const [marketplaceModal, setMarketplaceModal] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState("");
  const [listed, setListed] = useState<Record<string, boolean>>({});

  const isMarketplace = session?.user?.plan === "MARKETPLACE";

  useEffect(() => {
    fetch(`/api/seller/catalog/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setProduct(d.product ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function handlePush() {
    setProcessing(true);
    const res = await fetch("/api/seller/push-shopify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id }),
    });
    if (res.ok) setPushed(true);
    setProcessing(false);
  }

  async function handleListMarketplace() {
    if (!selectedMarketplace) return;
    setProcessing(true);
    const res = await fetch("/api/seller/list-marketplace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, platform: selectedMarketplace }),
    });
    if (res.ok) {
      setListed((prev) => ({ ...prev, [selectedMarketplace]: true }));
      setMarketplaceModal(false);
      setSelectedMarketplace("");
    }
    setProcessing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center">
        <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-500">Product not found.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-500 hover:underline text-sm"
        >
          ← Go back
        </button>
      </div>
    );
  }

  const allMedia = product.images ?? [];
  const activeMedia = allMedia[activeIndex];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT — Media Gallery */}
        <div className="space-y-3">
          {/* Main media viewer */}
          <div className="w-full aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center">
            {activeMedia ? (
              activeMedia.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                <video
                  src={activeMedia}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={activeMedia}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              )
            ) : (
              <Package className="w-20 h-20 text-gray-200" />
            )}
          </div>

          {/* Thumbnails */}
          {allMedia.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allMedia.map((src, i) => {
                const isVideo = src.match(/\.(mp4|webm|ogg|mov)$/i);
                return (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      activeIndex === i
                        ? "border-blue-500"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    {isVideo ? (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 mt-2">
              <h3 className="font-semibold text-gray-800 mb-3">
                Product Description
              </h3>
              <div className="text-sm text-blue-600 space-y-2 leading-relaxed">
                {product.description.split("\n").map((line, i) =>
                  line.trim() ? <p key={i}>{line}</p> : null
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Details */}
        <div className="space-y-5">
          {/* Title + Price */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-snug">
              {product.name}
            </h1>
            <p className="text-xs text-gray-400 mt-1">Cost Price</p>
            <p className="text-3xl font-bold text-gray-900 mt-0.5">
              ₹{product.price.toLocaleString()}
            </p>
          </div>

          {/* CTA Button */}
          {isMarketplace ? (
            <button
              onClick={() => setMarketplaceModal(true)}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Globe className="w-5 h-5" />
              List on Marketplace
            </button>
          ) : (
            <button
              onClick={handlePush}
              disabled={processing || pushed}
              className={`w-full py-3.5 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${
                pushed
                  ? "bg-green-600 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {processing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ShoppingBag className="w-5 h-5" />
              )}
              {pushed ? "Pushed to Shopify ✓" : "Push To Shopify"}
            </button>
          )}

          {/* Info Grid */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Category</p>
              <p className="font-medium text-gray-800">
                {product.category ?? "General"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Supplier</p>
              <p className="font-medium text-gray-800">
                {product.supplier.name}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">SKU</p>
              <p className="font-medium text-gray-800 font-mono text-xs">
                {product.sku ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Images</p>
              <p className="font-medium text-gray-800">
                {product.images.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Marketplace Modal */}
      {marketplaceModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              List on Marketplace
            </h3>
            <p className="text-sm text-gray-400 mb-5">
              Select which marketplace to list this product on
            </p>

            <div className="grid grid-cols-2 gap-2 mb-5">
              {MARKETPLACES.map((m) => {
                const alreadyListed = listed[m];
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
                onClick={() => {
                  setMarketplaceModal(false);
                  setSelectedMarketplace("");
                }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleListMarketplace}
                disabled={!selectedMarketplace || processing}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
              >
                {processing ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

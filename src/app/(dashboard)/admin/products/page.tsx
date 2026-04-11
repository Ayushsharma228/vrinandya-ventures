"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Package, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
  category: string | null;
  description: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  supplier: { name: string; email: string };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function fetchProducts() {
    setLoading(true);
    const res = await fetch(`/api/admin/products?status=${filter}`);
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }

  useEffect(() => { fetchProducts(); }, [filter]);

  async function handleDelete(productId: string) {
    setProcessing(productId);
    const res = await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.ok) {
      fetchProducts();
      setExpanded(null);
    } else {
      const data = await res.json();
      alert(data.error || "Failed to delete product");
    }
    setProcessing(null);
    setConfirmDelete(null);
  }

  async function handleAction(productId: string, status: "APPROVED" | "REJECTED") {
    setProcessing(productId);
    const res = await fetch("/api/admin/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, status, adminNote: actionNote[productId] || "" }),
    });
    if (res.ok) {
      fetchProducts();
      setExpanded(null);
    }
    setProcessing(null);
  }

  const tabs = ["PENDING", "APPROVED", "REJECTED"];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Product Approvals"
        subtitle="Review and approve supplier product submissions"
        filters={
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }}>
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setFilter(tab)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={filter === tab
                  ? { background: "white", color: "var(--text-900)" }
                  : { color: "rgba(255,255,255,0.6)" }}>
                {tab}
              </button>
            ))}
          </div>
        }
      />

      <div className="px-8 py-6">
      {loading ? (
        <div className="card p-16 text-center">
          <p style={{ color: "var(--text-400)" }}>Loading...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="card p-16 text-center">
          <Package className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--border)" }} />
          <p className="font-medium" style={{ color: "var(--text-400)" }}>No {filter.toLowerCase()} products</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="card overflow-hidden">
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50"
                onClick={() => setExpanded(expanded === product.id ? null : product.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{product.name}</p>
                    <p className="text-xs text-gray-400">by {product.supplier.name} · SKU: {product.sku}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm font-bold text-gray-700">₹{product.price.toLocaleString()}</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    product.status === "APPROVED" ? "bg-green-50 text-green-700" :
                    product.status === "REJECTED" ? "bg-red-50 text-red-700" :
                    "bg-yellow-50 text-yellow-700"
                  }`}>
                    {product.status}
                  </span>
                  {expanded === product.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {expanded === product.id && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs mb-1">Description</p>
                      <p className="text-gray-700">{product.description}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">Category</span>
                        <span className="text-gray-700 text-xs">{product.category || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">Supplier Email</span>
                        <span className="text-gray-700 text-xs">{product.supplier.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs">Submitted</span>
                        <span className="text-gray-700 text-xs">{new Date(product.createdAt).toLocaleDateString("en-IN")}</span>
                      </div>
                    </div>
                  </div>

                  {product.status === "PENDING" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Note to Supplier (optional)</label>
                        <input
                          type="text"
                          value={actionNote[product.id] || ""}
                          onChange={(e) => setActionNote((prev) => ({ ...prev, [product.id]: e.target.value }))}
                          placeholder="Add a note for the supplier..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAction(product.id, "APPROVED")}
                          disabled={processing === product.id}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {processing === product.id ? "Processing..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleAction(product.id, "REJECTED")}
                          disabled={processing === product.id}
                          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Delete — available on all statuses */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {confirmDelete === product.id ? (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-red-600 font-medium">Remove this product permanently?</span>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={processing === product.id}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                        >
                          {processing === product.id ? "Deleting..." : "Yes, Delete"}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(product.id)}
                        className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Product
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Download, CheckSquare, Square, Loader2, RefreshCw, Package } from "lucide-react";

interface CJProduct {
  pid: string;
  productNameEn: string;
  productName: string;
  sellPrice: string;
  productPrice: string;
  productImage: string;
  categoryName: string;
  productSku: string;
}

export default function CJCatalogPage() {
  const [products, setProducts] = useState<CJProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setResult(null);
    const params = new URLSearchParams({ page: String(page) });
    if (query) params.set("q", query);
    const res = await fetch(`/api/admin/cj/products?${params}`);
    const data = await res.json();
    if (res.ok) {
      setProducts(data.products ?? []);
      setTotal(data.total ?? 0);
    } else {
      alert(data.error || "Failed to fetch CJ products");
      setProducts([]);
    }
    setLoading(false);
  }, [page, query]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setQuery(search);
    setSelected(new Set());
  }

  function toggle(pid: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(pid) ? next.delete(pid) : next.add(pid);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === products.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map((p) => p.pid)));
    }
  }

  async function handleImport() {
    if (!selected.size) return;
    setImporting(true);
    setResult(null);
    const res = await fetch("/api/admin/cj/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: Array.from(selected) }),
    });
    const data = await res.json();
    if (res.ok) {
      setResult({ imported: data.imported, skipped: data.skipped });
      setSelected(new Set());
    } else {
      alert(data.error || "Import failed");
    }
    setImporting(false);
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">CJ Dropshipping Catalog</h1>
          <p className="text-sm text-gray-500 mt-0.5">Browse and import products from CJ Dropshipping</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button onClick={handleImport} disabled={importing}
              className="flex items-center gap-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {importing ? "Importing..." : `Import ${selected.size} product${selected.size > 1 ? "s" : ""}`}
            </button>
          )}
          <button onClick={() => fetchProducts()} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 font-medium">
          Successfully imported <strong>{result.imported}</strong> product{result.imported !== 1 ? "s" : ""}.
          {result.skipped > 0 && ` (${result.skipped} already existed — skipped)`}
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search CJ products (e.g. LED light, phone case...)"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <button type="submit" className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg">
          Search
        </button>
      </form>

      {/* Product Grid */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={toggleAll} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800">
              {selected.size === products.length && products.length > 0
                ? <CheckSquare className="w-4 h-4" />
                : <Square className="w-4 h-4" />}
              {selected.size === products.length && products.length > 0 ? "Deselect All" : "Select All"}
            </button>
            <span className="text-sm text-gray-500">{total.toLocaleString()} products found</span>
          </div>
          {selected.size > 0 && (
            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
              {selected.size} selected
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm">Loading CJ catalog...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
            <Package className="w-10 h-10" />
            <span className="text-sm">No products found. Try a different search.</span>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 p-5">
            {products.map((p) => {
              const isSelected = selected.has(p.pid);
              const price = parseFloat(p.sellPrice || p.productPrice || "0");
              return (
                <div key={p.pid}
                  onClick={() => toggle(p.pid)}
                  className={`relative rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${isSelected ? "border-orange-400 bg-orange-50/30" : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <CheckSquare className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {p.productImage ? (
                      <img src={p.productImage} alt={p.productNameEn || p.productName}
                        className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">
                      {p.productNameEn || p.productName}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-orange-600">${price.toFixed(2)}</span>
                      {p.categoryName && (
                        <span className="text-xs text-gray-400 truncate ml-2 max-w-[80px]">{p.categoryName}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                Previous
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

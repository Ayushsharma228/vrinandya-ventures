"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Download, CheckSquare, Square, Loader2, RefreshCw, Package, X, IndianRupee } from "lucide-react";

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

interface ImportItem {
  pid: string;
  name: string;
  image: string;
  usdPrice: number;
  inrPrice: string;
}

const USD_TO_INR = 84;

export default function CJCatalogPage() {
  const [products, setProducts] = useState<CJProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importItems, setImportItems] = useState<ImportItem[]>([]);
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
    setSelected(selected.size === products.length ? new Set() : new Set(products.map((p) => p.pid)));
  }

  function openImportModal() {
    const selectedProducts = products.filter((p) => selected.has(p.pid));
    const items: ImportItem[] = selectedProducts.map((p) => {
      const usd = parseFloat(p.sellPrice || p.productPrice || "0");
      const suggestedInr = Math.ceil(usd * USD_TO_INR * 1.4); // 40% markup by default
      return {
        pid: p.pid,
        name: p.productNameEn || p.productName,
        image: p.productImage,
        usdPrice: usd,
        inrPrice: String(suggestedInr),
      };
    });
    setImportItems(items);
    setShowImportModal(true);
  }

  function updatePrice(pid: string, value: string) {
    setImportItems((prev) => prev.map((i) => i.pid === pid ? { ...i, inrPrice: value } : i));
  }

  async function handleImport() {
    const invalid = importItems.find((i) => !i.inrPrice || parseFloat(i.inrPrice) <= 0);
    if (invalid) return alert(`Set a valid INR price for: ${invalid.name}`);

    setImporting(true);
    const res = await fetch("/api/admin/cj/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        products: importItems.map((i) => ({
          pid: i.pid,
          inrPrice: parseFloat(i.inrPrice),
          image: i.image,
        })),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setResult({ imported: data.imported, skipped: data.skipped });
      setSelected(new Set());
      setShowImportModal(false);
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
          <p className="text-sm text-gray-500 mt-0.5">Browse CJ catalog, set your INR selling price, then import</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button onClick={openImportModal}
              className="flex items-center gap-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg">
              <Download className="w-4 h-4" />
              Import {selected.size} product{selected.size > 1 ? "s" : ""} →
            </button>
          )}
          <button onClick={fetchProducts} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 font-medium">
          Imported <strong>{result.imported}</strong> product{result.imported !== 1 ? "s" : ""} successfully.
          {result.skipped > 0 && ` (${result.skipped} already existed — skipped)`}
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search CJ products (e.g. LED strip, phone case, bag...)"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <button type="submit" className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg">
          Search
        </button>
      </form>

      {/* Grid */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={toggleAll} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800">
              {selected.size === products.length && products.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {selected.size === products.length && products.length > 0 ? "Deselect All" : "Select All"}
            </button>
            <span className="text-sm text-gray-400">{total.toLocaleString()} products</span>
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
              const usd = parseFloat(p.sellPrice || p.productPrice || "0");
              const suggestedInr = Math.ceil(usd * USD_TO_INR * 1.4);
              return (
                <div key={p.pid} onClick={() => toggle(p.pid)}
                  className={`relative rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${isSelected ? "border-orange-400 bg-orange-50/30" : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <CheckSquare className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {p.productImage
                      ? <img src={p.productImage} alt={p.productNameEn} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-gray-300" /></div>
                    }
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">
                      {p.productNameEn || p.productName}
                    </p>
                    <div className="mt-2 space-y-0.5">
                      <p className="text-xs text-gray-400">CJ Cost: <span className="font-medium text-gray-600">${usd.toFixed(2)}</span></p>
                      <p className="text-xs text-orange-600 font-semibold">Suggested: ₹{suggestedInr.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || loading}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Import Price Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="font-bold text-gray-900">Set INR Selling Prices</h2>
                <p className="text-xs text-gray-500 mt-0.5">CJ cost is in USD — set your INR price with markup for sellers</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs text-gray-500">Product</th>
                    <th className="px-4 py-3 text-right text-xs text-gray-500">CJ Cost (USD)</th>
                    <th className="px-4 py-3 text-right text-xs text-gray-500">CJ Cost (INR ~)</th>
                    <th className="px-4 py-3 text-right text-xs text-orange-600 font-semibold">Your Selling Price (INR) *</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {importItems.map((item) => {
                    const costInr = item.usdPrice * USD_TO_INR;
                    const sellingInr = parseFloat(item.inrPrice) || 0;
                    const margin = sellingInr > 0 ? ((sellingInr - costInr) / sellingInr * 100).toFixed(0) : "—";
                    return (
                      <tr key={item.pid} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {item.image && <img src={item.image} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />}
                            <span className="text-xs text-gray-700 line-clamp-2">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-gray-500">${item.usdPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-xs text-gray-500">₹{costInr.toFixed(0)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <div className="relative">
                              <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                              <input type="number" min="1" value={item.inrPrice}
                                onChange={(e) => updatePrice(item.pid, e.target.value)}
                                className="w-28 pl-6 pr-2 py-1.5 text-sm border border-orange-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400 text-right font-semibold" />
                            </div>
                            {sellingInr > 0 && (
                              <span className={`text-xs font-medium ${Number(margin) > 20 ? "text-green-600" : "text-red-500"}`}>
                                {margin}%
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-gray-50/50">
              <p className="text-xs text-gray-500">Prices pre-filled with 40% margin over CJ cost. Adjust as needed.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowImportModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100">
                  Cancel
                </button>
                <button onClick={handleImport} disabled={importing}
                  className="flex items-center gap-2 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {importing ? "Importing..." : `Import ${importItems.length} Products`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

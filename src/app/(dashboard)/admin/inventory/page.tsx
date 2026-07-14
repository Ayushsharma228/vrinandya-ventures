"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Boxes, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight,
  TrendingDown, CheckCircle2, Package, Filter,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface Supplier { id: string; name: string | null; email: string; }
interface Product  { id: string; name: string; sku: string | null; category: string | null; images: string[]; status: string; }
interface InventoryItem {
  id: string; availableQty: number; reservedQty: number; incomingQty: number;
  lowStockThreshold: number; isLowStock: boolean; updatedAt: string;
  product:  Product;
  supplier: { id: string; name: string | null; email: string };
}

interface InventoryData {
  items: InventoryItem[]; total: number; page: number; pages: number; lowStockCount: number;
}

export default function AdminInventoryPage() {
  const [data, setData]           = useState<InventoryData | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [supplierId, setSupplierId] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editing, setEditing]     = useState<string | null>(null);
  const [editVals, setEditVals]   = useState<{ availableQty: string; incomingQty: string; lowStockThreshold: string }>({ availableQty: "", incomingQty: "", lowStockThreshold: "" });
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    fetch("/api/admin/users?role=SUPPLIER").then(r => r.json()).then(d => setSuppliers(d.users ?? []));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: "50" });
    if (supplierId)  p.set("supplierId", supplierId);
    if (lowStockOnly) p.set("lowStock", "1");
    const r = await fetch(`/api/admin/inventory?${p}`);
    if (r.ok) setData(await r.json());
    setLoading(false);
  }, [page, supplierId, lowStockOnly]);

  useEffect(() => { setPage(1); }, [supplierId, lowStockOnly]);
  useEffect(() => { fetchData(); }, [fetchData]);

  function startEdit(item: InventoryItem) {
    setEditing(item.id);
    setEditVals({
      availableQty:     String(item.availableQty),
      incomingQty:      String(item.incomingQty),
      lowStockThreshold:String(item.lowStockThreshold),
    });
  }

  async function saveEdit(itemId: string) {
    setSaving(true);
    await fetch("/api/admin/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId,
        availableQty:      parseInt(editVals.availableQty)      || 0,
        incomingQty:       parseInt(editVals.incomingQty)       || 0,
        lowStockThreshold: parseInt(editVals.lowStockThreshold) || 5,
      }),
    });
    setEditing(null);
    setSaving(false);
    fetchData();
  }

  const lowStockCount = data?.lowStockCount ?? 0;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Inventory"
        subtitle="Stock levels across all supplier products"
        cards={
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total SKUs",      value: data?.total ?? "—",       color: "#00C67A" },
              { label: "Low Stock Alerts", value: lowStockCount,            color: "#F59E0B" },
              { label: "Suppliers",       value: suppliers.length,          color: "#3B82F6" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-2xl px-5 py-4"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p className="text-xs font-medium uppercase tracking-wide mb-1"
                  style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
                <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
        }
      />

      <div className="px-4 md:px-8 py-6">
        <div className="card overflow-hidden">
          {/* Filters */}
          <div className="px-5 py-3 flex items-center gap-3 flex-wrap" style={{ borderBottom: "1px solid var(--border)" }}>
            <Filter className="w-4 h-4" style={{ color: "var(--text-400)" }} />
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)}
              className="text-xs rounded-lg px-3 py-1.5 border"
              style={{ background: "var(--bg-card)", color: "var(--text-900)", borderColor: "var(--border)" }}>
              <option value="">All Suppliers</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name ?? s.email}</option>)}
            </select>
            <button onClick={() => setLowStockOnly(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={lowStockOnly
                ? { background: "#FFF7ED", color: "#D97706", border: "1px solid #FED7AA" }
                : { border: "1px solid var(--border)", color: "var(--text-400)" }}>
              <AlertTriangle className="w-3.5 h-3.5" />
              Low Stock Only
              {lowStockCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "#F59E0B", color: "white" }}>{lowStockCount}</span>
              )}
            </button>
            <span className="ml-auto text-xs" style={{ color: "var(--text-400)" }}>
              {data?.total ?? 0} items
            </span>
          </div>

          {loading ? (
            <div className="p-8 flex justify-center">
              <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "var(--text-300)" }} />
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2">
              <Boxes className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm" style={{ color: "var(--text-400)" }}>
                {lowStockOnly ? "No low-stock items" : "No inventory items yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", background: "#FAFAFA" }}>
                      {["Product", "Supplier", "Available", "Reserved", "Incoming", "Low Stock Threshold", "Status", "Updated", ""].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--text-400)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {data.items.map(item => {
                      const isEditing = editing === item.id;
                      return (
                        <tr key={item.id} className={`hover:bg-gray-50/40 ${item.isLowStock ? "bg-orange-50/30" : ""}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {item.product.images[0] ? (
                                <img src={item.product.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                                  style={{ background: "var(--bg-muted)" }}>
                                  <Package className="w-4 h-4" style={{ color: "var(--text-300)" }} />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate max-w-[160px]" style={{ color: "var(--text-900)" }}>
                                  {item.product.name}
                                </p>
                                {item.product.sku && (
                                  <p className="text-xs font-mono" style={{ color: "var(--text-400)" }}>{item.product.sku}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: "var(--text-500)" }}>
                            {item.supplier.name ?? item.supplier.email}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input type="number" value={editVals.availableQty}
                                onChange={e => setEditVals(v => ({ ...v, availableQty: e.target.value }))}
                                className="w-16 text-xs text-center rounded-lg px-2 py-1 border"
                                style={{ borderColor: "var(--border)" }} />
                            ) : (
                              <span className={`text-sm font-bold ${item.isLowStock ? "text-orange-500" : ""}`}
                                style={!item.isLowStock ? { color: "var(--text-900)" } : {}}>
                                {item.availableQty}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: "#6366F1" }}>{item.reservedQty}</td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input type="number" value={editVals.incomingQty}
                                onChange={e => setEditVals(v => ({ ...v, incomingQty: e.target.value }))}
                                className="w-16 text-xs text-center rounded-lg px-2 py-1 border"
                                style={{ borderColor: "var(--border)" }} />
                            ) : (
                              <span className="text-xs" style={{ color: "#3B82F6" }}>{item.incomingQty}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input type="number" value={editVals.lowStockThreshold}
                                onChange={e => setEditVals(v => ({ ...v, lowStockThreshold: e.target.value }))}
                                className="w-16 text-xs text-center rounded-lg px-2 py-1 border"
                                style={{ borderColor: "var(--border)" }} />
                            ) : (
                              <span className="text-xs" style={{ color: "var(--text-400)" }}>{item.lowStockThreshold}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {item.isLowStock ? (
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />
                                <span className="text-xs font-semibold" style={{ color: "#D97706" }}>Low</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#00C67A" }} />
                                <span className="text-xs" style={{ color: "#15803D" }}>OK</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: "var(--text-300)" }}>
                            {new Date(item.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => saveEdit(item.id)} disabled={saving}
                                  className="px-2 py-1 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                                  style={{ background: "#00C67A" }}>
                                  {saving ? "…" : "Save"}
                                </button>
                                <button onClick={() => setEditing(null)}
                                  className="px-2 py-1 rounded-lg text-xs"
                                  style={{ color: "var(--text-400)" }}>
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => startEdit(item)}
                                className="text-xs px-2 py-1 rounded-lg"
                                style={{ border: "1px solid var(--border)", color: "var(--text-400)" }}>
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {data.pages > 1 && (
                <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border)" }}>
                  <span className="text-xs" style={{ color: "var(--text-400)" }}>
                    Page {data.page} of {data.pages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                      className="p-1 rounded-lg disabled:opacity-30"
                      style={{ border: "1px solid var(--border)" }}>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}
                      className="p-1 rounded-lg disabled:opacity-30"
                      style={{ border: "1px solid var(--border)" }}>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

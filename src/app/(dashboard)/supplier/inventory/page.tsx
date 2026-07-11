"use client";

import { useEffect, useState, useCallback } from "react";
import { Boxes, RefreshCw, AlertTriangle, CheckCircle, Edit2, Save, X } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

type InventoryItem = {
  id: string;
  productId: string;
  availableQty: number;
  reservedQty: number;
  incomingQty: number;
  lowStockThreshold: number;
  updatedAt: string;
  product: {
    id: string; name: string; sku: string | null;
    category: string | null; images: string[]; status: string;
  };
};

export default function SupplierInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/supplier/inventory");
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.productId);
    setEditValues({
      availableQty: item.availableQty,
      incomingQty: item.incomingQty,
      lowStockThreshold: item.lowStockThreshold,
    });
  };

  const saveEdit = async (productId: string) => {
    setSaving(true);
    try {
      await fetch("/api/supplier/inventory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, ...editValues }),
      });
      setEditingId(null);
      await fetchInventory();
    } finally {
      setSaving(false);
    }
  };

  const lowStock = items.filter(
    (i) => i.availableQty <= i.lowStockThreshold && i.availableQty > 0
  ).length;
  const outOfStock = items.filter((i) => i.availableQty === 0).length;
  const totalAvailable = items.reduce((s, i) => s + i.availableQty, 0);
  const totalReserved = items.reduce((s, i) => s + i.reservedQty, 0);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Inventory"
        subtitle="Manage stock levels for your products"
        cards={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Products",       value: items.length,     icon: Boxes,         color: "#3B82F6" },
              { label: "Available Units", value: totalAvailable,  icon: CheckCircle,   color: "#00C67A" },
              { label: "Reserved",       value: totalReserved,    icon: RefreshCw,     color: "#8B5CF6" },
              { label: "Low / Out",      value: `${lowStock} / ${outOfStock}`, icon: AlertTriangle, color: "#EF4444" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl px-5 py-4"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        }
      />

      <div className="px-4 md:px-8 pt-6">
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "var(--text-300)" }} />
          </div>
        ) : items.length === 0 ? (
          <div className="card py-16 flex flex-col items-center gap-3">
            <Boxes className="w-10 h-10" style={{ color: "var(--border)" }} />
            <p className="text-sm" style={{ color: "var(--text-400)" }}>No inventory records yet</p>
            <p className="text-xs text-center max-w-xs" style={{ color: "var(--text-300)" }}>
              Inventory records are created automatically when you have approved products. Add stock quantities here.
            </p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "#FAFAFA" }}>
                    {["Product", "SKU", "Available", "Reserved", "Incoming", "Low Stock Alert", "Updated", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--text-400)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {items.map((item) => {
                    const isEditing = editingId === item.productId;
                    const isLow = item.availableQty <= item.lowStockThreshold && item.availableQty > 0;
                    const isOut = item.availableQty === 0;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {item.product.images[0] && (
                              <img src={item.product.images[0]} alt=""
                                className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                            )}
                            <div>
                              <p className="text-sm font-medium" style={{ color: "var(--text-900)" }}>{item.product.name}</p>
                              <p className="text-xs" style={{ color: "var(--text-400)" }}>{item.product.category ?? ""}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs" style={{ color: "var(--text-600)" }}>
                          {item.product.sku ?? "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          {isEditing ? (
                            <input type="number" min="0"
                              value={editValues.availableQty}
                              onChange={(e) => setEditValues((v) => ({ ...v, availableQty: parseInt(e.target.value) || 0 }))}
                              className="w-20 border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
                          ) : (
                            <span className="font-semibold text-sm"
                              style={{ color: isOut ? "#DC2626" : isLow ? "#D97706" : "var(--text-900)" }}>
                              {item.availableQty}
                              {isOut && <span className="ml-1 text-xs font-normal">(Out)</span>}
                              {isLow && !isOut && <span className="ml-1 text-xs font-normal">(Low)</span>}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-sm" style={{ color: "var(--text-600)" }}>
                          {item.reservedQty}
                        </td>
                        <td className="px-4 py-3.5">
                          {isEditing ? (
                            <input type="number" min="0"
                              value={editValues.incomingQty}
                              onChange={(e) => setEditValues((v) => ({ ...v, incomingQty: parseInt(e.target.value) || 0 }))}
                              className="w-20 border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
                          ) : (
                            <span className="text-sm" style={{ color: "var(--text-600)" }}>{item.incomingQty}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {isEditing ? (
                            <input type="number" min="0"
                              value={editValues.lowStockThreshold}
                              onChange={(e) => setEditValues((v) => ({ ...v, lowStockThreshold: parseInt(e.target.value) || 0 }))}
                              className="w-20 border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
                          ) : (
                            <span className="text-sm" style={{ color: "var(--text-400)" }}>{item.lowStockThreshold}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs" style={{ color: "var(--text-400)" }}>
                          {new Date(item.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </td>
                        <td className="px-4 py-3.5">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => saveEdit(item.productId)} disabled={saving}
                                className="p-1.5 rounded-lg text-white"
                                style={{ background: "#00C67A" }}>
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setEditingId(null)}
                                className="p-1.5 rounded-lg"
                                style={{ background: "#F3F4F6" }}>
                                <X className="w-3.5 h-3.5 text-gray-500" />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => startEdit(item)}
                              className="p-1.5 rounded-lg" style={{ background: "rgba(0,0,0,0.04)" }}>
                              <Edit2 className="w-3.5 h-3.5" style={{ color: "var(--text-400)" }} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

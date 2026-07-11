"use client";

import { useEffect, useState, useCallback } from "react";
import { ClipboardList, RefreshCw } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

type PO = {
  id: string;
  poNumber: string;
  status: string;
  supplierCost: number;
  sellingPrice: number;
  expectedDispatchDate: string | null;
  createdAt: string;
  supplier: { id: string; name: string | null; email: string };
  seller:   { id: string; name: string | null; email: string };
  order: {
    id: string; externalOrderId: string; source: string;
    customerName: string | null; totalAmount: number; status: string; createdAt: string;
  };
  items: Array<{ id: string; name: string; sku: string | null; quantity: number; unitCost: number }>;
};

const PO_STATUS: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT:      { bg: "#F3F4F6", text: "#6B7280", label: "Draft" },
  SENT:       { bg: "#FFF7ED", text: "#D97706", label: "Sent" },
  ACCEPTED:   { bg: "#EFF6FF", text: "#3B82F6", label: "Accepted" },
  REJECTED:   { bg: "#FEF2F2", text: "#DC2626", label: "Rejected" },
  PROCESSING: { bg: "#F5F3FF", text: "#7C3AED", label: "Processing" },
  PACKED:     { bg: "#F0F9FF", text: "#0369A1", label: "Packed" },
  DISPATCHED: { bg: "#F0FDF4", text: "#15803D", label: "Dispatched" },
  DELIVERED:  { bg: "#ECFDF5", text: "#047857", label: "Delivered" },
  CANCELLED:  { bg: "#F9FAFB", text: "#6B7280", label: "Cancelled" },
};

const STATUS_FILTERS = [
  { key: "", label: "All" },
  { key: "SENT", label: "Pending Acceptance" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "PROCESSING", label: "Processing" },
  { key: "DISPATCHED", label: "Dispatched" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "REJECTED", label: "Rejected" },
];

export default function AdminPurchaseOrdersPage() {
  const [pos, setPos] = useState<PO[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<PO | null>(null);

  const fetchPOs = useCallback(async () => {
    setLoading(true);
    try {
      const url = statusFilter ? `/api/admin/purchase-orders?status=${statusFilter}` : "/api/admin/purchase-orders";
      const res = await fetch(url);
      const data = await res.json();
      setPos(data.pos ?? []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchPOs(); }, [fetchPOs]);

  const counts: Record<string, number> = {};
  pos.forEach((p) => { counts[p.status] = (counts[p.status] ?? 0) + 1; });

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Purchase Orders"
        subtitle="All POs raised between AXQEN and suppliers"
        cards={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total",       value: pos.length },
              { label: "Pending",     value: counts["SENT"] ?? 0 },
              { label: "Active",      value: (counts["ACCEPTED"] ?? 0) + (counts["PROCESSING"] ?? 0) + (counts["PACKED"] ?? 0) },
              { label: "Dispatched",  value: counts["DISPATCHED"] ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl px-5 py-4"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        }
      />

      <div className="px-4 md:px-8 pt-6 space-y-4">
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: statusFilter === f.key ? "rgba(0,198,122,0.12)" : "transparent",
                color: statusFilter === f.key ? "var(--green-500)" : "var(--text-400)",
                border: statusFilter === f.key ? "1px solid rgba(0,198,122,0.3)" : "1px solid transparent",
              }}>
              {f.label}
              {f.key && (counts[f.key] ?? 0) > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                  {counts[f.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "var(--text-300)" }} />
            </div>
          ) : pos.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <ClipboardList className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm" style={{ color: "var(--text-400)" }}>No purchase orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "#FAFAFA" }}>
                    {["PO Number", "Order", "Supplier", "Seller", "Items", "Value", "Dispatch By", "Status", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--text-400)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {pos.map((po) => {
                    const badge = PO_STATUS[po.status];
                    return (
                      <tr key={po.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="font-mono text-xs font-semibold" style={{ color: "var(--green-500)" }}>{po.poNumber}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>
                            {new Date(po.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs" style={{ color: "var(--text-600)" }}>
                          #{po.order.externalOrderId}
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-medium" style={{ color: "var(--text-900)" }}>{po.supplier.name ?? po.supplier.email}</p>
                        </td>
                        <td className="px-4 py-3.5 text-xs" style={{ color: "var(--text-600)" }}>
                          {po.seller.name ?? po.seller.email}
                        </td>
                        <td className="px-4 py-3.5 text-xs" style={{ color: "var(--text-600)" }}>
                          {po.items.length}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-sm" style={{ color: "var(--text-900)" }}>
                          ₹{po.order.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5 text-xs" style={{ color: "var(--text-500)" }}>
                          {po.expectedDispatchDate
                            ? new Date(po.expectedDispatchDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                            : "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          {badge && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ background: badge.bg, color: badge.text }}>
                              {badge.label}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <button onClick={() => setSelected(po)}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg"
                            style={{ background: "rgba(0,0,0,0.04)", color: "var(--text-500)" }}>
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* PO Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 flex items-center justify-between border-b">
              <div>
                <h3 className="font-semibold text-gray-900">{selected.poNumber}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Order #{selected.order.externalOrderId} · Supplier: {selected.supplier.name ?? selected.supplier.email}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Items</p>
                <div className="space-y-2">
                  {selected.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        {item.sku && <p className="text-xs text-gray-400 font-mono">SKU: {item.sku}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">₹{item.unitCost.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-400">Supplier</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{selected.supplier.name ?? "—"}</p>
                  <p className="text-xs text-gray-400">{selected.supplier.email}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-400">Seller</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{selected.seller.name ?? "—"}</p>
                  <p className="text-xs text-gray-400">{selected.seller.email}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <p className="text-sm text-gray-500">Order Value</p>
                <p className="text-lg font-bold text-gray-900">₹{selected.order.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

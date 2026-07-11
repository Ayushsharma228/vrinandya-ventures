"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ShoppingCart, CheckCircle, XCircle, Clock, Package,
  Truck, AlertCircle, RefreshCw, ChevronRight,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

type SupplierOrderStatus =
  | "PENDING_ASSIGNMENT" | "ASSIGNED" | "ACCEPTED" | "REJECTED"
  | "PROCESSING" | "PACKED" | "READY_TO_SHIP" | "DISPATCHED";

type OrderItem = {
  id: string; name: string; sku: string | null; quantity: number; price: number;
  product: { name: string; sku: string | null; images: string[] } | null;
};

type Order = {
  id: string;
  externalOrderId: string;
  source: string;
  status: string;
  supplierStatus: SupplierOrderStatus | null;
  supplierNote: string | null;
  totalAmount: number;
  customerName: string | null;
  customerAddress: Record<string, string> | null;
  expectedDispatchDate: string | null;
  expectedDeliveryDate: string | null;
  dispatchedAt: string | null;
  createdAt: string;
  seller: { name: string | null };
  items: OrderItem[];
};

const TABS: Array<{ key: string | null; label: string; icon: React.ElementType; color: string }> = [
  { key: null,             label: "All",         icon: ShoppingCart, color: "#6B7280" },
  { key: "ASSIGNED",       label: "Pending",     icon: Clock,        color: "#F59E0B" },
  { key: "ACCEPTED",       label: "Accepted",    icon: CheckCircle,  color: "#3B82F6" },
  { key: "PROCESSING",     label: "Processing",  icon: RefreshCw,    color: "#8B5CF6" },
  { key: "PACKED",         label: "Packed",      icon: Package,      color: "#0EA5E9" },
  { key: "READY_TO_SHIP",  label: "Ready",       icon: AlertCircle,  color: "#F97316" },
  { key: "DISPATCHED",     label: "Dispatched",  icon: Truck,        color: "#00C67A" },
  { key: "REJECTED",       label: "Rejected",    icon: XCircle,      color: "#EF4444" },
];

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  ASSIGNED:      { bg: "#FFF7ED", text: "#D97706", label: "Pending Acceptance" },
  ACCEPTED:      { bg: "#EFF6FF", text: "#3B82F6", label: "Accepted" },
  PROCESSING:    { bg: "#F5F3FF", text: "#7C3AED", label: "Processing" },
  PACKED:        { bg: "#F0F9FF", text: "#0369A1", label: "Packed" },
  READY_TO_SHIP: { bg: "#FFF7ED", text: "#EA580C", label: "Ready to Ship" },
  DISPATCHED:    { bg: "#F0FDF4", text: "#15803D", label: "Dispatched" },
  REJECTED:      { bg: "#FEF2F2", text: "#DC2626", label: "Rejected" },
};

const NEXT_ACTION: Record<string, { action: string; label: string; color: string } | null> = {
  ASSIGNED:      { action: "ACCEPT",          label: "Accept",          color: "#00C67A" },
  ACCEPTED:      { action: "MARK_PROCESSING", label: "Mark Processing", color: "#8B5CF6" },
  PROCESSING:    { action: "MARK_PACKED",     label: "Mark Packed",     color: "#0EA5E9" },
  PACKED:        { action: "READY_TO_SHIP",   label: "Ready to Ship",   color: "#F97316" },
  READY_TO_SHIP: null,
  DISPATCHED:    null,
  REJECTED:      null,
};

export default function SupplierOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [selected, setSelected] = useState<Order | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [dispatchData, setDispatchData] = useState({ trackingNo: "", courier: "" });
  const [showReject, setShowReject] = useState<string | null>(null);
  const [showDispatch, setShowDispatch] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/supplier/orders");
      const data = await res.json();
      setOrders(data.orders ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const runAction = async (orderId: string, action: string, extra?: Record<string, string>) => {
    setActioning(orderId);
    try {
      const res = await fetch(`/api/supplier/orders/${orderId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (res.ok) {
        await fetchOrders();
        setSelected(null);
        setShowReject(null);
        setShowDispatch(null);
        setRejectNote("");
        setDispatchData({ trackingNo: "", courier: "" });
      }
    } finally {
      setActioning(null);
    }
  };

  const counts: Record<string, number> = {};
  orders.forEach((o) => {
    if (o.supplierStatus) counts[o.supplierStatus] = (counts[o.supplierStatus] ?? 0) + 1;
  });

  const filteredOrders = activeTab
    ? orders.filter((o) => o.supplierStatus === activeTab)
    : orders;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Order Queue"
        subtitle="Manage and fulfill your assigned orders"
        cards={
          <div className="flex flex-wrap gap-3">
            {TABS.filter((t) => t.key).map((t) => (
              <div key={t.key} className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <t.icon className="w-4 h-4" style={{ color: t.color }} />
                <span className="text-white text-sm font-bold">{counts[t.key!] ?? 0}</span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{t.label}</span>
              </div>
            ))}
          </div>
        }
      />

      <div className="px-4 md:px-8 pt-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button key={String(tab.key)} onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
                style={{
                  background: isActive ? "rgba(0,198,122,0.12)" : "transparent",
                  color: isActive ? "var(--green-500)" : "var(--text-400)",
                  border: isActive ? "1px solid rgba(0,198,122,0.3)" : "1px solid transparent",
                }}>
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.key && (counts[tab.key] ?? 0) > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      background: isActive ? "rgba(0,198,122,0.2)" : "rgba(0,0,0,0.06)",
                      color: isActive ? "var(--green-600)" : "var(--text-500)",
                    }}>
                    {counts[tab.key]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Orders table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "var(--text-300)" }} />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <ShoppingCart className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm" style={{ color: "var(--text-400)" }}>No orders in this queue</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "#FAFAFA" }}>
                    {["Order", "Customer", "Items", "Amount", "Status", "Expected Dispatch", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--text-400)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {filteredOrders.map((order) => {
                    const badge = order.supplierStatus ? STATUS_BADGE[order.supplierStatus] : null;
                    const nextAction = order.supplierStatus ? NEXT_ACTION[order.supplierStatus] : null;
                    const isActioning = actioning === order.id;
                    return (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="font-mono text-xs font-semibold" style={{ color: "var(--green-500)" }}>
                            #{order.externalOrderId}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>
                            {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-medium" style={{ color: "var(--text-900)" }}>{order.customerName ?? "—"}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>
                            {(order.customerAddress as any)?.city ?? ""}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="text-sm" style={{ color: "var(--text-900)" }}>
                            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                          </p>
                          <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-400)" }}>
                            {order.items.map((i) => i.name).join(", ")}
                          </p>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-sm" style={{ color: "var(--text-900)" }}>
                          ₹{order.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5">
                          {badge ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ background: badge.bg, color: badge.text }}>
                              {badge.label}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-xs" style={{ color: "var(--text-500)" }}>
                          {order.expectedDispatchDate
                            ? new Date(order.expectedDispatchDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                            : "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <button onClick={() => setSelected(order)}
                              className="p-1.5 rounded-lg" style={{ background: "rgba(0,0,0,0.04)" }}
                              title="View details">
                              <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--text-400)" }} />
                            </button>
                            {order.supplierStatus === "ASSIGNED" && (
                              <>
                                <button onClick={() => setShowReject(order.id)}
                                  className="px-2 py-1 rounded-lg text-xs font-semibold"
                                  style={{ background: "#FEF2F2", color: "#DC2626" }}>
                                  Reject
                                </button>
                                <button onClick={() => runAction(order.id, "ACCEPT")} disabled={isActioning}
                                  className="px-2 py-1 rounded-lg text-xs font-semibold text-white"
                                  style={{ background: "#00C67A", opacity: isActioning ? 0.6 : 1 }}>
                                  {isActioning ? "..." : "Accept"}
                                </button>
                              </>
                            )}
                            {order.supplierStatus === "READY_TO_SHIP" && (
                              <button onClick={() => setShowDispatch(order.id)} disabled={isActioning}
                                className="px-2 py-1 rounded-lg text-xs font-semibold text-white"
                                style={{ background: "#00C67A" }}>
                                Dispatch
                              </button>
                            )}
                            {nextAction && order.supplierStatus !== "ASSIGNED" && order.supplierStatus !== "READY_TO_SHIP" && (
                              <button onClick={() => runAction(order.id, nextAction.action)} disabled={isActioning}
                                className="px-2 py-1 rounded-lg text-xs font-semibold text-white"
                                style={{ background: nextAction.color, opacity: isActioning ? 0.6 : 1 }}>
                                {isActioning ? "..." : nextAction.label}
                              </button>
                            )}
                          </div>
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

      {/* Order Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 flex items-center justify-between border-b">
              <h3 className="font-semibold text-gray-900">Order #{selected.externalOrderId}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Customer</p>
                <p className="text-sm font-medium text-gray-900">{selected.customerName ?? "—"}</p>
                {selected.customerAddress && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {[(selected.customerAddress as any).address1, (selected.customerAddress as any).city,
                      (selected.customerAddress as any).province, (selected.customerAddress as any).zip]
                      .filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Items to Fulfill</p>
                <div className="space-y-2">
                  {selected.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        {item.sku && <p className="text-xs text-gray-400 font-mono">SKU: {item.sku}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">₹{item.price.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Expected Dispatch", value: selected.expectedDispatchDate },
                  { label: "Expected Delivery", value: selected.expectedDeliveryDate },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm font-medium text-gray-900 mt-0.5">
                      {value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <p className="text-sm text-gray-500">Total Order Value</p>
                <p className="text-lg font-bold text-gray-900">₹{selected.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Reject Order</h3>
            <p className="text-sm text-gray-500 mb-4">Provide a reason — the admin will be notified immediately.</p>
            <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)}
              className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
              rows={3} placeholder="e.g. Out of stock, unable to source..." />
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowReject(null); setRejectNote(""); }}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium border text-gray-600">Cancel</button>
              <button onClick={() => runAction(showReject, "REJECT", { note: rejectNote })}
                disabled={!rejectNote.trim() || actioning === showReject}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#EF4444", opacity: !rejectNote.trim() ? 0.5 : 1 }}>
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {showDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Mark as Dispatched</h3>
            <p className="text-sm text-gray-500 mb-4">Enter tracking details. Order status will update to Shipped.</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Tracking Number</label>
                <input value={dispatchData.trackingNo}
                  onChange={(e) => setDispatchData((d) => ({ ...d, trackingNo: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                  placeholder="e.g. DTDC1234567890" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Courier Partner</label>
                <input value={dispatchData.courier}
                  onChange={(e) => setDispatchData((d) => ({ ...d, courier: e.target.value }))}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                  placeholder="e.g. Delhivery, DTDC, Bluedart..." />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowDispatch(null); setDispatchData({ trackingNo: "", courier: "" }); }}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium border text-gray-600">Cancel</button>
              <button onClick={() => runAction(showDispatch, "DISPATCH", dispatchData)}
                disabled={actioning === showDispatch}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#00C67A" }}>
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

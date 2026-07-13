"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Package, Truck, CheckCircle2, Clock, XCircle,
  RotateCcw, MapPin, ShoppingBag, Search,
} from "lucide-react";

type TimelineEntry = { event: string; details: string | null; createdAt: string };

type OrderData = {
  externalOrderId: string;
  status: string;
  customerName: string | null;
  totalAmount: number;
  supplierTrackingNo: string | null;
  supplierCourier: string | null;
  expectedDispatchDate: string | null;
  expectedDeliveryDate: string | null;
  dispatchedAt: string | null;
  createdAt: string;
  items: { name: string; quantity: number; price: number }[];
  timeline: TimelineEntry[];
};

const STEPS = [
  { label: "Order Placed",     icon: ShoppingBag,  done: ["NEW","PROCESSING","SHIPPED","IN_TRANSIT","DELIVERED","RTO"] },
  { label: "Being Prepared",   icon: Package,       done: ["PROCESSING","SHIPPED","IN_TRANSIT","DELIVERED","RTO"] },
  { label: "Shipped",          icon: Truck,         done: ["SHIPPED","IN_TRANSIT","DELIVERED","RTO"] },
  { label: "Out for Delivery", icon: MapPin,        done: ["IN_TRANSIT","DELIVERED"] },
  { label: "Delivered",        icon: CheckCircle2,  done: ["DELIVERED"] },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string; desc: string }> = {
  NEW:        { label: "Order Confirmed",   color: "#3B82F6", bg: "#EFF6FF", desc: "Your order has been confirmed and is being processed." },
  PROCESSING: { label: "Being Prepared",   color: "#F59E0B", bg: "#FFFBEB", desc: "Your order is being picked and packed by our supplier." },
  SHIPPED:    { label: "Shipped",          color: "#7C3AED", bg: "#F5F3FF", desc: "Your order has been handed over to the courier." },
  IN_TRANSIT: { label: "Out for Delivery", color: "#0EA5E9", bg: "#F0F9FF", desc: "Your package is on its way to you!" },
  DELIVERED:  { label: "Delivered",        color: "#16A34A", bg: "#F0FDF4", desc: "Your order has been delivered successfully." },
  RTO:        { label: "Returned",         color: "#EF4444", bg: "#FEF2F2", desc: "The package was returned to the sender." },
  CANCELLED:  { label: "Cancelled",        color: "#6B7280", bg: "#F9FAFB", desc: "This order has been cancelled." },
};

const EVENT_LABELS: Record<string, string> = {
  ORDER_CREATED: "Order Created", ASSIGNED: "Assigned to Supplier",
  ACCEPTED: "Accepted by Supplier", PROCESSING: "Processing Started",
  PACKED: "Packed", READY_TO_SHIP: "Ready to Ship",
  DISPATCHED: "Dispatched", SHIPPED: "Shipped",
  IN_TRANSIT: "Out for Delivery", DELIVERED: "Delivered",
  RTO: "Returned to Origin", CANCELLED: "Cancelled",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}
function fmtDate(iso: string, withTime = false) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  if (withTime) { opts.hour = "2-digit"; opts.minute = "2-digit"; }
  return new Date(iso).toLocaleDateString("en-IN", opts);
}

function TrackingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryId = searchParams.get("id") ?? "";

  const [input, setInput]       = useState(queryId);
  const [order, setOrder]       = useState<OrderData | null>(null);
  const [loading, setLoading]   = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!queryId) return;
    setInput(queryId);
    lookup(queryId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryId]);

  async function lookup(id: string) {
    if (!id.trim()) return;
    setLoading(true); setNotFound(false); setOrder(null); setSearched(true);
    const res = await fetch(`/api/track?id=${encodeURIComponent(id.trim())}`);
    const d = await res.json();
    if (!res.ok || d.error) { setNotFound(true); } else { setOrder(d.order); }
    setLoading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const id = input.trim();
    if (!id) return;
    router.push(`/track?id=${encodeURIComponent(id)}`);
    lookup(id);
  }

  const meta = order ? (STATUS_META[order.status] ?? STATUS_META.NEW) : null;
  const isCancelled = order?.status === "CANCELLED";
  const isRTO       = order?.status === "RTO";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* Search form */}
      <form onSubmit={handleSubmit}
        className="bg-white rounded-2xl px-5 py-4 flex gap-3 items-center"
        style={{ border: "1px solid #E2E8F0" }}>
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter your Order ID  (e.g. 1039)"
          className="flex-1 text-sm outline-none text-gray-800 placeholder-gray-400"
        />
        <button type="submit"
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white flex-shrink-0"
          style={{ background: "#00C67A" }}>
          Track
        </button>
      </form>

      {loading && (
        <div className="py-16 flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-green-200 border-t-green-500 animate-spin" />
          <p className="text-sm text-gray-400">Looking up your order…</p>
        </div>
      )}

      {!loading && notFound && (
        <div className="py-16 flex flex-col items-center gap-3 text-center">
          <XCircle className="w-12 h-12 text-gray-300" />
          <p className="text-lg font-semibold text-gray-700">Order not found</p>
          <p className="text-sm text-gray-400 max-w-xs">
            We couldn&apos;t find order <span className="font-mono font-bold text-gray-600">#{input}</span>.
            Double-check the ID and try again.
          </p>
        </div>
      )}

      {!loading && !searched && !order && (
        <div className="py-16 flex flex-col items-center gap-3 text-center">
          <Package className="w-12 h-12 text-gray-200" />
          <p className="text-sm text-gray-400">Enter your order ID above to track your package</p>
        </div>
      )}

      {!loading && order && meta && (
        <>
          {/* Status banner */}
          <div className="rounded-2xl px-6 py-5 flex items-center gap-4"
            style={{ background: meta.bg, border: `1px solid ${meta.color}33` }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-white">
              {order.status === "DELIVERED"  && <CheckCircle2 className="w-6 h-6" style={{ color: meta.color }} />}
              {order.status === "RTO"        && <RotateCcw    className="w-6 h-6" style={{ color: meta.color }} />}
              {order.status === "CANCELLED"  && <XCircle      className="w-6 h-6" style={{ color: meta.color }} />}
              {order.status === "IN_TRANSIT" && <Truck        className="w-6 h-6" style={{ color: meta.color }} />}
              {["NEW","PROCESSING","SHIPPED"].includes(order.status) && <Clock className="w-6 h-6" style={{ color: meta.color }} />}
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Order #{order.externalOrderId}</p>
              <p className="font-bold text-lg" style={{ color: meta.color }}>{meta.label}</p>
              <p className="text-sm mt-0.5 text-gray-600">{meta.desc}</p>
            </div>
          </div>

          {/* Progress stepper */}
          {!isCancelled && !isRTO && (
            <div className="bg-white rounded-2xl px-6 py-5" style={{ border: "1px solid #E2E8F0" }}>
              <div className="flex items-start justify-between relative">
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-100 z-0">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{
                      background: "#00C67A",
                      width: `${(STEPS.findIndex((s) => s.done[0] === order.status) / (STEPS.length - 1)) * 100}%`,
                    }} />
                </div>
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const done   = step.done.includes(order.status) && STEPS[i].done[0] !== order.status;
                  const active = STEPS[i].done[0] === order.status;
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1 relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${active ? "ring-4 ring-green-200" : ""}`}
                        style={{ background: done || active ? "#00C67A" : "white", border: `2px solid ${done || active ? "#00C67A" : "#D1D5DB"}` }}>
                        {done
                          ? <CheckCircle2 className="w-4 h-4 text-white" />
                          : <Icon className="w-3.5 h-3.5" style={{ color: active ? "white" : "#9CA3AF" }} />}
                      </div>
                      <p className="text-center text-xs font-medium leading-tight"
                        style={{ color: done || active ? "#0D1F13" : "#9CA3AF" }}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AWB */}
          {order.supplierTrackingNo && (
            <div className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between"
              style={{ border: "1px solid #E2E8F0" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-green-50">
                  <Truck className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">{order.supplierCourier ?? "Courier"}</p>
                  <p className="text-sm font-bold font-mono text-gray-900">{order.supplierTrackingNo}</p>
                </div>
              </div>
              <button onClick={() => navigator.clipboard.writeText(order.supplierTrackingNo!)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium bg-green-50 text-green-700">
                Copy AWB
              </button>
            </div>
          )}

          {/* Dates */}
          {(order.dispatchedAt || order.expectedDeliveryDate) && (
            <div className="bg-white rounded-2xl px-5 py-4 grid grid-cols-2 gap-4"
              style={{ border: "1px solid #E2E8F0" }}>
              {order.dispatchedAt && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Dispatched</p>
                  <p className="text-sm font-semibold text-gray-900">{fmtDate(order.dispatchedAt)}</p>
                </div>
              )}
              {order.expectedDeliveryDate && order.status !== "DELIVERED" && order.status !== "RTO" && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Expected Delivery</p>
                  <p className="text-sm font-semibold text-green-600">{fmtDate(order.expectedDeliveryDate)}</p>
                </div>
              )}
            </div>
          )}

          {/* Items */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
            <div className="px-5 py-3.5 flex items-center gap-2 border-b border-gray-50">
              <Package className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-semibold text-gray-900">Items in this order</p>
            </div>
            <div className="divide-y divide-gray-50">
              {order.items.map((item, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">₹{fmt(item.price)}</p>
                </div>
              ))}
              <div className="px-5 py-3 flex items-center justify-between bg-gray-50">
                <p className="text-sm font-semibold text-gray-700">Order Total</p>
                <p className="text-sm font-bold text-gray-900">₹{fmt(order.totalAmount)}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          {order.timeline.length > 0 && (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
              <div className="px-5 py-3.5 flex items-center gap-2 border-b border-gray-50">
                <Clock className="w-4 h-4 text-gray-400" />
                <p className="text-sm font-semibold text-gray-900">Order Activity</p>
              </div>
              <div className="px-5 py-4 space-y-4">
                {[...order.timeline].reverse().map((t, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: i === 0 ? "#00C67A" : "#E5E7EB" }} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{EVENT_LABELS[t.event] ?? t.event}</p>
                      {t.details && <p className="text-xs text-gray-500 mt-0.5">{t.details}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{fmtDate(t.createdAt, true)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center py-2">
            <p className="text-xs text-gray-400">Need help? <a href="mailto:support@axqen.com" className="underline">Contact Support</a></p>
            <p className="text-xs text-gray-300 mt-1">Powered by AXQEN Commerce OS</p>
          </div>
        </>
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#0D1F13" }}>
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">AXQEN</span>
        </div>
        <span className="text-xs text-gray-400">Order Tracking</span>
      </div>
      <Suspense fallback={<div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-green-200 border-t-green-500 animate-spin" /></div>}>
        <TrackingContent />
      </Suspense>
    </div>
  );
}

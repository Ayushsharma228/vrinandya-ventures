"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Package, Truck, CheckCircle2, Clock, XCircle,
  RotateCcw, MapPin, ExternalLink, ShoppingBag,
} from "lucide-react";

type TimelineEntry = { event: string; details: string | null; createdAt: string; actorRole: string | null };

type OrderData = {
  id: string;
  externalOrderId: string;
  status: string;
  supplierStatus: string | null;
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
  { key: "PLACED",      label: "Order Placed",     icon: ShoppingBag,  statuses: ["NEW", "PROCESSING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "RTO", "CANCELLED"] },
  { key: "PROCESSING",  label: "Being Prepared",   icon: Package,      statuses: ["PROCESSING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "RTO"] },
  { key: "SHIPPED",     label: "Shipped",           icon: Truck,        statuses: ["SHIPPED", "IN_TRANSIT", "DELIVERED", "RTO"] },
  { key: "IN_TRANSIT",  label: "Out for Delivery",  icon: MapPin,       statuses: ["IN_TRANSIT", "DELIVERED"] },
  { key: "DELIVERED",   label: "Delivered",         icon: CheckCircle2, statuses: ["DELIVERED"] },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string; description: string }> = {
  NEW:        { label: "Order Confirmed",   color: "#3B82F6", bg: "#EFF6FF", description: "Your order has been confirmed and is being processed." },
  PROCESSING: { label: "Being Prepared",   color: "#F59E0B", bg: "#FFFBEB", description: "Your order is being picked and packed by our supplier." },
  SHIPPED:    { label: "Shipped",          color: "#7C3AED", bg: "#F5F3FF", description: "Your order has been handed over to the courier." },
  IN_TRANSIT: { label: "Out for Delivery", color: "#0EA5E9", bg: "#F0F9FF", description: "Your package is on its way to you!" },
  DELIVERED:  { label: "Delivered",        color: "#16A34A", bg: "#F0FDF4", description: "Your order has been delivered successfully." },
  RTO:        { label: "Returned",         color: "#EF4444", bg: "#FEF2F2", description: "The package was returned to the sender." },
  CANCELLED:  { label: "Cancelled",        color: "#6B7280", bg: "#F9FAFB", description: "This order has been cancelled." },
};

const EVENT_LABELS: Record<string, string> = {
  ORDER_CREATED:   "Order Created",
  ASSIGNED:        "Assigned to Supplier",
  ACCEPTED:        "Accepted by Supplier",
  PROCESSING:      "Processing Started",
  PACKED:          "Packed",
  READY_TO_SHIP:   "Ready to Ship",
  DISPATCHED:      "Dispatched",
  SHIPPED:         "Shipped",
  IN_TRANSIT:      "Out for Delivery",
  DELIVERED:       "Delivered",
  RTO:             "Returned to Origin",
  CANCELLED:       "Cancelled",
  REJECTED:        "Rejected by Supplier",
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string, withTime = false) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  if (withTime) { opts.hour = "2-digit"; opts.minute = "2-digit"; }
  return new Date(iso).toLocaleDateString("en-IN", opts);
}

export default function TrackingPage() {
  const params = useParams();
  const orderId = params.orderId as string;
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/track/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setNotFound(true); }
        else { setOrder(d.order); }
        setLoading(false);
      });
  }, [orderId]);

  const meta = order ? (STATUS_META[order.status] ?? STATUS_META.NEW) : null;

  const isTerminal = order?.status === "DELIVERED" || order?.status === "RTO" || order?.status === "CANCELLED";
  const isCancelled = order?.status === "CANCELLED";
  const isRTO       = order?.status === "RTO";

  const activeStep = STEPS.findIndex((s) => s.statuses[0] === order?.status);
  const completedUpTo = isCancelled || isRTO ? -1 : activeStep;

  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "#0D1F13" }}>
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">AXQEN</span>
        </div>
        <span className="text-xs text-gray-400 font-mono">#{orderId}</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {loading && (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-green-200 border-t-green-500 animate-spin" />
            <p className="text-sm text-gray-400">Looking up your order…</p>
          </div>
        )}

        {notFound && (
          <div className="py-20 flex flex-col items-center gap-4 text-center">
            <XCircle className="w-12 h-12 text-gray-300" />
            <p className="text-lg font-semibold text-gray-700">Order not found</p>
            <p className="text-sm text-gray-400 max-w-xs">
              We couldn&apos;t find an order with ID <span className="font-mono font-bold text-gray-600">#{orderId}</span>.
              Double-check the link or contact support.
            </p>
          </div>
        )}

        {order && meta && (
          <>
            {/* Status banner */}
            <div className="rounded-2xl px-6 py-5 flex items-center gap-4"
              style={{ background: meta.bg, border: `1px solid ${meta.color}22` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "white" }}>
                {order.status === "DELIVERED"  && <CheckCircle2 className="w-6 h-6" style={{ color: meta.color }} />}
                {order.status === "RTO"        && <RotateCcw   className="w-6 h-6" style={{ color: meta.color }} />}
                {order.status === "CANCELLED"  && <XCircle     className="w-6 h-6" style={{ color: meta.color }} />}
                {order.status === "IN_TRANSIT" && <Truck       className="w-6 h-6" style={{ color: meta.color }} />}
                {["NEW","PROCESSING","SHIPPED"].includes(order.status) && <Clock className="w-6 h-6" style={{ color: meta.color }} />}
              </div>
              <div>
                <p className="font-bold text-lg" style={{ color: meta.color }}>{meta.label}</p>
                <p className="text-sm mt-0.5 text-gray-600">{meta.description}</p>
              </div>
            </div>

            {/* Stepper */}
            {!isCancelled && !isRTO && (
              <div className="bg-white rounded-2xl px-6 py-5" style={{ border: "1px solid #E2E8F0" }}>
                <div className="flex items-start justify-between relative">
                  {/* Progress line */}
                  <div className="absolute top-4 left-4 right-4 h-0.5" style={{ background: "#E2E8F0", zIndex: 0 }}>
                    <div className="h-full transition-all duration-500 rounded-full"
                      style={{ background: "#00C67A", width: `${Math.max(0, (completedUpTo / (STEPS.length - 1))) * 100}%` }} />
                  </div>

                  {STEPS.map((step, i) => {
                    const Icon = step.icon;
                    const done = completedUpTo > i;
                    const active = completedUpTo === i;
                    return (
                      <div key={step.key} className="flex flex-col items-center gap-2 flex-1 relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${active ? "ring-4 ring-green-200" : ""}`}
                          style={{
                            background: done || active ? "#00C67A" : "white",
                            border: `2px solid ${done || active ? "#00C67A" : "#D1D5DB"}`,
                          }}>
                          {done ? (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          ) : (
                            <Icon className="w-3.5 h-3.5" style={{ color: active ? "white" : "#9CA3AF" }} />
                          )}
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

            {/* Tracking info */}
            {order.supplierTrackingNo && (
              <div className="bg-white rounded-2xl px-5 py-4 flex items-center justify-between"
                style={{ border: "1px solid #E2E8F0" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "#F0FDF4" }}>
                    <Truck className="w-4 h-4" style={{ color: "#00C67A" }} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{order.supplierCourier ?? "Courier"}</p>
                    <p className="text-sm font-bold font-mono text-gray-900">{order.supplierTrackingNo}</p>
                  </div>
                </div>
                <button onClick={() => navigator.clipboard.writeText(order.supplierTrackingNo!)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: "#F0FDF4", color: "#16A34A" }}>
                  Copy AWB
                </button>
              </div>
            )}

            {/* Dates */}
            {(order.expectedDispatchDate || order.expectedDeliveryDate || order.dispatchedAt) && (
              <div className="bg-white rounded-2xl px-5 py-4 grid grid-cols-2 gap-4"
                style={{ border: "1px solid #E2E8F0" }}>
                {order.dispatchedAt && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Dispatched</p>
                    <p className="text-sm font-semibold text-gray-900">{fmtDate(order.dispatchedAt)}</p>
                  </div>
                )}
                {order.expectedDeliveryDate && !isTerminal && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Expected Delivery</p>
                    <p className="text-sm font-semibold" style={{ color: "#00C67A" }}>
                      {fmtDate(order.expectedDeliveryDate)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Order items */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
              <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: "1px solid #F1F5F9" }}>
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
                <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <Clock className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-900">Order Activity</p>
                </div>
                <div className="px-5 py-4 space-y-4">
                  {[...order.timeline].reverse().map((t, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: i === 0 ? "#00C67A" : "#D1D5DB" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {EVENT_LABELS[t.event] ?? t.event}
                        </p>
                        {t.details && (
                          <p className="text-xs text-gray-500 mt-0.5">{t.details}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">{fmtDate(t.createdAt, true)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center py-4">
              <p className="text-xs text-gray-400">
                Need help?{" "}
                <a href="mailto:support@axqen.com" className="underline text-gray-500">Contact Support</a>
              </p>
              <p className="text-xs text-gray-300 mt-1">Powered by AXQEN Commerce OS</p>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

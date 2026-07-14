"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Package, Truck, CheckCircle2, Clock, XCircle,
  RotateCcw, MapPin, ShoppingBag, Search, Store, ArrowLeft,
} from "lucide-react";

type TimelineEntry = { event: string; details: string | null; createdAt: string };
type OrderData = {
  id: string;
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
type StoreResult = { id: string; name: string };

const STEPS = [
  { label: "Order Placed",     icon: ShoppingBag,  key: "NEW" },
  { label: "Being Prepared",   icon: Package,       key: "PROCESSING" },
  { label: "Shipped",          icon: Truck,         key: "SHIPPED" },
  { label: "Out for Delivery", icon: MapPin,        key: "IN_TRANSIT" },
  { label: "Delivered",        icon: CheckCircle2,  key: "DELIVERED" },
];
const STEP_ORDER = ["NEW","PROCESSING","SHIPPED","IN_TRANSIT","DELIVERED","RTO"];

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
  const queryId = searchParams.get("id") ?? "";

  // ── Step 1: store search ──────────────────────────────────────────────────
  const [storeQuery, setStoreQuery]       = useState("");
  const [storeResults, setStoreResults]   = useState<StoreResult[]>([]);
  const [storeLoading, setStoreLoading]   = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreResult | null>(null);
  const [showDropdown, setShowDropdown]   = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Step 2: order lookup ──────────────────────────────────────────────────
  const [orderInput, setOrderInput] = useState("");
  const [order, setOrder]           = useState<OrderData | null>(null);
  const [loading, setLoading]       = useState(false);
  const [notFound, setNotFound]     = useState(false);
  const [searched, setSearched]     = useState(false);

  // Direct CUID link (?id=...) — auto-resolve without store step
  useEffect(() => {
    if (!queryId) return;
    setLoading(true);
    setSearched(true);
    fetch(`/api/track?id=${encodeURIComponent(queryId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.order)      setOrder(d.order);
        else if (d.needsStore) { /* show store step */ }
        else              setNotFound(true);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryId]);

  // Debounced store search
  useEffect(() => {
    if (storeQuery.length < 2) { setStoreResults([]); setShowDropdown(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setStoreLoading(true);
      try {
        const res = await fetch(`/api/track/stores?q=${encodeURIComponent(storeQuery)}`);
        const d = await res.json();
        setStoreResults(d.stores ?? []);
        setShowDropdown(true);
      } finally {
        setStoreLoading(false);
      }
    }, 300);
  }, [storeQuery]);

  function selectStore(s: StoreResult) {
    setSelectedStore(s);
    setStoreQuery(s.name);
    setShowDropdown(false);
    setOrder(null);
    setNotFound(false);
    setSearched(false);
  }

  function resetStore() {
    setSelectedStore(null);
    setStoreQuery("");
    setStoreResults([]);
    setOrderInput("");
    setOrder(null);
    setNotFound(false);
    setSearched(false);
  }

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!orderInput.trim() || !selectedStore) return;
    setLoading(true); setNotFound(false); setOrder(null); setSearched(true);
    const res = await fetch(
      `/api/track?id=${encodeURIComponent(orderInput.trim())}&sellerId=${selectedStore.id}`
    );
    const d = await res.json();
    if (!res.ok || d.error) setNotFound(true);
    else setOrder(d.order);
    setLoading(false);
  }

  const meta = order ? (STATUS_META[order.status] ?? STATUS_META.NEW) : null;
  const isCancelled = order?.status === "CANCELLED";
  const isRTO       = order?.status === "RTO";
  const currentStep = order ? STEP_ORDER.indexOf(order.status) : -1;

  // ── Direct-link resolved order (no store step shown) ─────────────────────
  if (queryId && (loading || order || (searched && notFound))) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {loading && <Spinner />}
        {!loading && notFound && <NotFound id={queryId} />}
        {!loading && order && meta && (
          <OrderCard order={order} meta={meta} isCancelled={isCancelled} isRTO={isRTO} currentStep={currentStep} fmt={fmt} fmtDate={fmtDate} />
        )}
      </div>
    );
  }

  // ── 2-step tracking flow ──────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

      {/* Step 1 — Store */}
      <div className="bg-white rounded-2xl p-5 space-y-3" style={{ border: "1px solid #E2E8F0" }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: selectedStore ? "#00C67A" : "#0D1F13" }}>
            {selectedStore ? <CheckCircle2 className="w-3.5 h-3.5" /> : "1"}
          </div>
          <p className="text-sm font-semibold text-gray-800">Which store did you order from?</p>
        </div>

        {selectedStore ? (
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
            style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-800">{selectedStore.name}</span>
            </div>
            <button onClick={resetStore}
              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium">
              <ArrowLeft className="w-3 h-3" /> Change
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ border: "1px solid #E2E8F0", background: "#FAFAFA" }}>
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                value={storeQuery}
                onChange={(e) => setStoreQuery(e.target.value)}
                onFocus={() => storeResults.length > 0 && setShowDropdown(true)}
                placeholder="Type store or brand name…"
                className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
              />
              {storeLoading && (
                <div className="w-4 h-4 rounded-full border-2 border-gray-200 border-t-green-500 animate-spin flex-shrink-0" />
              )}
            </div>
            {showDropdown && storeResults.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-lg z-20 overflow-hidden"
                style={{ border: "1px solid #E2E8F0" }}>
                {storeResults.map((s) => (
                  <button key={s.id} onClick={() => selectStore(s)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "#F0FDF4" }}>
                      <Store className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-800">{s.name}</span>
                  </button>
                ))}
              </div>
            )}
            {showDropdown && storeResults.length === 0 && !storeLoading && storeQuery.length >= 2 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-lg z-20 px-4 py-3"
                style={{ border: "1px solid #E2E8F0" }}>
                <p className="text-sm text-gray-400">No stores found for &ldquo;{storeQuery}&rdquo;</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step 2 — Order ID (only shown after store selected) */}
      {selectedStore && (
        <form onSubmit={handleTrack}
          className="bg-white rounded-2xl p-5 space-y-3" style={{ border: "1px solid #E2E8F0" }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: "#0D1F13" }}>
              2
            </div>
            <p className="text-sm font-semibold text-gray-800">Enter your Order ID</p>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ border: "1px solid #E2E8F0", background: "#FAFAFA" }}>
              <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                value={orderInput}
                onChange={(e) => setOrderInput(e.target.value)}
                placeholder="e.g. 1039"
                className="flex-1 text-sm outline-none bg-transparent text-gray-800 placeholder-gray-400"
                autoFocus
              />
            </div>
            <button type="submit" disabled={!orderInput.trim() || loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex-shrink-0"
              style={{ background: "#00C67A" }}>
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : "Track"}
            </button>
          </div>
        </form>
      )}

      {/* Results */}
      {!loading && searched && notFound && (
        <div className="py-12 flex flex-col items-center gap-3 text-center">
          <XCircle className="w-12 h-12 text-gray-300" />
          <p className="text-lg font-semibold text-gray-700">Order not found</p>
          <p className="text-sm text-gray-400 max-w-xs">
            We couldn&apos;t find order <span className="font-mono font-bold text-gray-600">#{orderInput.replace(/^#/, "")}</span> in <span className="font-semibold">{selectedStore?.name}</span>.
            Double-check the order ID and try again.
          </p>
        </div>
      )}

      {!loading && order && meta && (
        <OrderCard order={order} meta={meta} isCancelled={isCancelled} isRTO={isRTO} currentStep={currentStep} fmt={fmt} fmtDate={fmtDate} />
      )}

      {!selectedStore && (
        <div className="py-10 flex flex-col items-center gap-2 text-center">
          <Package className="w-10 h-10 text-gray-200" />
          <p className="text-sm text-gray-400">Search for your store above to get started</p>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div className="py-16 flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-green-200 border-t-green-500 animate-spin" />
      <p className="text-sm text-gray-400">Looking up your order…</p>
    </div>
  );
}

function NotFound({ id }: { id: string }) {
  return (
    <div className="py-16 flex flex-col items-center gap-3 text-center">
      <XCircle className="w-12 h-12 text-gray-300" />
      <p className="text-lg font-semibold text-gray-700">Order not found</p>
      <p className="text-sm text-gray-400 max-w-xs">
        We couldn&apos;t find the order for tracking link <span className="font-mono font-bold text-gray-600">{id.slice(0, 16)}…</span>
      </p>
    </div>
  );
}

function OrderCard({ order, meta, isCancelled, isRTO, currentStep, fmt, fmtDate }: {
  order: OrderData;
  meta: { label: string; color: string; bg: string; desc: string };
  isCancelled: boolean;
  isRTO: boolean;
  currentStep: number;
  fmt: (n: number) => string;
  fmtDate: (iso: string, withTime?: boolean) => string;
}) {
  return (
    <div className="space-y-4">
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
          <p className="text-xs text-gray-500 font-medium">Order #{order.externalOrderId?.replace(/^#/, "")}</p>
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
                style={{ background: "#00C67A", width: `${Math.max(0, (currentStep / (STEPS.length - 1))) * 100}%` }} />
            </div>
            {STEPS.map((step, i) => {
              const Icon   = step.icon;
              const done   = i < currentStep;
              const active = i === currentStep;
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
        <div className="bg-white rounded-2xl px-5 py-4 grid grid-cols-2 gap-4" style={{ border: "1px solid #E2E8F0" }}>
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
    </div>
  );
}

export default function TrackPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F8FAFC" }}>
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

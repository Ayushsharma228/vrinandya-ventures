"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Package, MapPin, Phone, User, Receipt,
  Clock, Tag, ChevronRight, RefreshCw, ExternalLink, Truck, Loader2,
} from "lucide-react";

interface OrderItem { id: string; name: string; quantity: number; price: number; }
interface Timeline  { id: string; event: string; details: string | null; actorRole: string; createdAt: string; }
interface Settlement {
  id: string; status: string;
  sellingPrice: number; platformFee: number; gstOnFees: number;
  netPayable: number; shippingCharge: number; packingCharge: number;
  codFee: number; rtoCharge: number; adSpend: number;
  createdAt: string;
}
interface OrderDetail {
  id: string; externalOrderId: string; source: string; status: string;
  customerName: string | null; customerEmail: string | null;
  customerAddress: Record<string, string> | null;
  totalAmount: number; awbNumber: string | null; trackingUrl: string | null;
  courier: string | null; createdAt: string;
  items: OrderItem[];
  timeline: Timeline[];
}

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  NEW:        { bg: "#EFF6FF", color: "#2563EB" },
  PROCESSING: { bg: "#F5F3FF", color: "#7C3AED" },
  SHIPPED:    { bg: "#F0F9FF", color: "#0369A1" },
  IN_TRANSIT: { bg: "#FFFBEB", color: "#D97706" },
  DELIVERED:  { bg: "#F0FDF4", color: "#15803D" },
  CANCELLED:  { bg: "#FEF2F2", color: "#DC2626" },
  RTO:        { bg: "#FFF7ED", color: "#EA580C" },
};

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return `₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
        <Icon className="w-4 h-4" style={{ color: "var(--accent)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between py-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
      <span className="text-xs" style={{ color: "var(--text-400)" }}>{label}</span>
      <span className={`text-xs font-medium text-right max-w-[60%] ${mono ? "font-mono" : ""}`}
        style={{ color: "var(--text-900)" }}>{value ?? "—"}</span>
    </div>
  );
}

export default function SellerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router  = useRouter();

  const [order, setOrder]           = useState<OrderDetail | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [loading, setLoading]       = useState(true);
  const [awbInput, setAwbInput]     = useState("");
  const [courierInput, setCourierInput] = useState("");
  const [trackingInput, setTrackingInput] = useState("");
  const [awbSaving, setAwbSaving]   = useState(false);
  const [awbError, setAwbError]     = useState("");
  const [awbSuccess, setAwbSuccess] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/seller/orders/${id}`);
    if (r.ok) {
      const d = await r.json();
      setOrder(d.order);
      setSettlement(d.settlement ?? null);
      setAwbInput(d.order.awbNumber ?? "");
      setCourierInput(d.order.courier ?? "");
      setTrackingInput(d.order.trackingUrl ?? "");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  async function handleAwbSave() {
    if (!awbInput.trim()) { setAwbError("AWB number is required"); return; }
    setAwbSaving(true); setAwbError(""); setAwbSuccess(false);
    const r = await fetch(`/api/seller/orders/${id}/set-awb`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ awbNumber: awbInput, courier: courierInput, trackingUrl: trackingInput }),
    });
    const d = await r.json();
    if (!r.ok) { setAwbError(d.error ?? "Failed to save"); setAwbSaving(false); return; }
    setAwbSuccess(true);
    setAwbSaving(false);
    fetchOrder();
    setTimeout(() => setAwbSuccess(false), 3000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
        <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "var(--text-300)" }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
        <p className="text-sm" style={{ color: "var(--text-400)" }}>Order not found</p>
      </div>
    );
  }

  const addr  = order.customerAddress ?? {};
  const badge = STATUS_COLOR[order.status] ?? STATUS_COLOR.NEW;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      {/* Breadcrumb */}
      <div className="px-4 md:px-8 pt-6 pb-4 flex items-center gap-3 flex-wrap">
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium"
          style={{ color: "var(--text-400)" }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--text-300)" }} />
        <span className="text-sm" style={{ color: "var(--text-400)" }}>Orders</span>
        <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--text-300)" }} />
        <span className="text-sm font-semibold font-mono" style={{ color: "var(--text-900)" }}>
          #{order.externalOrderId}
        </span>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
          style={{ background: badge.bg, color: badge.color }}>
          {order.status}
        </span>
      </div>

      <div className="px-4 md:px-8 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — main content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Order details */}
          <Section title="Order Details" icon={Package}>
            <div className="grid grid-cols-2 gap-x-8">
              <div>
                <Row label="Order ID"     value={<span className="font-mono">#{order.externalOrderId}</span>} />
                <Row label="Source"       value={order.source} />
                <Row label="Date"         value={new Date(order.createdAt).toLocaleString("en-IN", {
                  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                })} />
                <Row label="Order Value"  value={<span className="font-bold" style={{ color: "#00C67A" }}>{fmt(order.totalAmount)}</span>} />
              </div>
              <div>
                <Row label="Status" value={
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: badge.bg, color: badge.color }}>
                    {order.status}
                  </span>
                } />
                <Row label="AWB"     value={order.awbNumber ?? "—"} mono />
                <Row label="Courier" value={order.courier ?? "—"} />
                {order.trackingUrl && (
                  <Row label="Tracking" value={
                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1" style={{ color: "#0369A1" }}>
                      Track <ExternalLink className="w-3 h-3" />
                    </a>
                  } />
                )}
              </div>
            </div>
          </Section>

          {/* Items */}
          <Section title={`Items (${order.items.length})`} icon={Tag}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Product", "Qty", "Unit Price", "Total"].map(h => (
                      <th key={h} className="pb-2 text-left text-xs font-semibold"
                        style={{ color: "var(--text-400)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {order.items.map(item => (
                    <tr key={item.id}>
                      <td className="py-2.5 pr-4 text-sm" style={{ color: "var(--text-900)" }}>{item.name}</td>
                      <td className="py-2.5 pr-4 text-sm text-center" style={{ color: "var(--text-500)" }}>{item.quantity}</td>
                      <td className="py-2.5 pr-4 text-sm" style={{ color: "var(--text-500)" }}>{fmt(item.price)}</td>
                      <td className="py-2.5 text-sm font-semibold" style={{ color: "var(--text-900)" }}>
                        {fmt(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* Settlement */}
          {settlement && (
            <Section title="Settlement Breakdown" icon={Receipt}>
              <div className="grid grid-cols-2 gap-x-8">
                <div>
                  <Row label="Selling Price"    value={<span style={{ color: "#00C67A" }}>{fmt(settlement.sellingPrice)}</span>} />
                  <Row label="Platform Fee"     value={fmt(settlement.platformFee)} />
                  <Row label="GST on Fee (18%)" value={fmt(settlement.gstOnFees)} />
                  <Row label="Shipping"         value={fmt(settlement.shippingCharge)} />
                  <Row label="Packing"          value={fmt(settlement.packingCharge)} />
                  <Row label="COD Fee"          value={fmt(settlement.codFee)} />
                  <Row label="RTO Charge"       value={fmt(settlement.rtoCharge)} />
                  <Row label="Ad Spend"         value={fmt(settlement.adSpend)} />
                </div>
                <div>
                  <Row label="Net Payable to You" value={
                    <span className="text-sm font-bold" style={{ color: "#7C3AED" }}>
                      {fmt(settlement.netPayable)}
                    </span>
                  } />
                  <Row label="Settlement Status" value={
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: "#F0FDF4", color: "#15803D" }}>
                      {settlement.status}
                    </span>
                  } />
                  <Row label="Settled On" value={new Date(settlement.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric"
                  })} />
                </div>
              </div>
            </Section>
          )}

          {/* Timeline */}
          {order.timeline.length > 0 && (
            <Section title="Order Timeline" icon={Clock}>
              <div className="space-y-0">
                {order.timeline.map((event, idx) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                        style={{ background: idx === order.timeline.length - 1 ? "#00C67A" : "var(--border)" }} />
                      {idx < order.timeline.length - 1 && (
                        <div className="w-px flex-1 min-h-[24px]" style={{ background: "var(--border)" }} />
                      )}
                    </div>
                    <div className="pb-4 flex-1">
                      <span className="text-xs font-semibold" style={{ color: "var(--text-900)" }}>
                        {event.event.replace(/_/g, " ")}
                      </span>
                      {event.details && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-500)" }}>{event.details}</p>
                      )}
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-300)" }}>
                        {new Date(event.createdAt).toLocaleString("en-IN", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Right — customer */}
        <div className="space-y-5">
          <Section title="Customer" icon={MapPin}>
            <div className="space-y-2.5">
              {order.customerName && (
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-300)" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--text-900)" }}>{order.customerName}</span>
                </div>
              )}
              {addr.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-300)" }} />
                  <span className="text-sm" style={{ color: "var(--text-500)" }}>{addr.phone}</span>
                </div>
              )}
              {order.customerEmail && (
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-300)" }} />
                  <span className="text-sm" style={{ color: "var(--text-500)" }}>{order.customerEmail}</span>
                </div>
              )}
              {(addr.address || addr.address1) && (
                <div className="flex gap-2 mt-1">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "var(--text-300)" }} />
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-500)" }}>{addr.address ?? addr.address1}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>
                      {[addr.city, addr.state ?? addr.province, addr.pincode ?? addr.zip].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Quick tracking card if AWB set */}
          {order.awbNumber && (
            <div className="card p-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-400)" }}>
                Shipment
              </p>
              <p className="text-sm font-bold font-mono" style={{ color: "var(--text-900)" }}>
                {order.awbNumber}
              </p>
              {order.courier && (
                <p className="text-xs" style={{ color: "var(--text-400)" }}>{order.courier}</p>
              )}
              {order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold mt-2"
                  style={{ color: "#0369A1" }}>
                  Track Shipment <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {/* AWB input — shown for non-terminal orders */}
          {!["DELIVERED", "CANCELLED", "RTO"].includes(order.status) && (
            <div className="card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4" style={{ color: "var(--accent)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>
                  {order.awbNumber ? "Update Tracking" : "Add Tracking Info"}
                </p>
              </div>

              {awbSuccess && (
                <p className="text-xs font-medium px-3 py-2 rounded-lg"
                  style={{ background: "#F0FDF4", color: "#15803D" }}>
                  Tracking saved — order marked as Shipped
                </p>
              )}
              {awbError && (
                <p className="text-xs px-3 py-2 rounded-lg"
                  style={{ background: "#FEF2F2", color: "#DC2626" }}>{awbError}</p>
              )}

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-400)" }}>
                    AWB / Tracking No. *
                  </label>
                  <input value={awbInput} onChange={e => setAwbInput(e.target.value)}
                    placeholder="Enter AWB number"
                    className="w-full px-3 py-2 text-xs rounded-lg border outline-none"
                    style={{ borderColor: "var(--border)", background: "var(--bg-muted)", color: "var(--text-900)" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-400)" }}>
                    Courier
                  </label>
                  <input value={courierInput} onChange={e => setCourierInput(e.target.value)}
                    placeholder="e.g. Delhivery, Bluedart"
                    className="w-full px-3 py-2 text-xs rounded-lg border outline-none"
                    style={{ borderColor: "var(--border)", background: "var(--bg-muted)", color: "var(--text-900)" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-400)" }}>
                    Tracking URL (optional)
                  </label>
                  <input value={trackingInput} onChange={e => setTrackingInput(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs rounded-lg border outline-none"
                    style={{ borderColor: "var(--border)", background: "var(--bg-muted)", color: "var(--text-900)" }} />
                </div>
              </div>

              <button onClick={handleAwbSave} disabled={awbSaving}
                className="w-full py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-1.5"
                style={{ background: "var(--green-500)" }}>
                {awbSaving
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                  : <><Truck className="w-3.5 h-3.5" /> {order.awbNumber ? "Update" : "Save & Mark Shipped"}</>
                }
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

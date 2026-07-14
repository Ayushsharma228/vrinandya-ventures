"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Package, User, Truck, Receipt, Clock,
  CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  MapPin, Phone, Tag, ChevronRight, UserCheck, Loader2,
} from "lucide-react";

interface OrderItem { id: string; name: string; quantity: number; price: number; productId: string | null; }
interface Timeline { id: string; event: string; details: string | null; metadata: unknown; actorRole: string; createdAt: string; }
interface PurchaseOrder { id: string; poNumber: string; status: string; dispatchedAt: string | null; createdAt: string; }
interface SupplierPayment { id: string; amount: number; status: string; paidAt: string | null; referenceNo: string | null; }
interface Settlement {
  id: string; status: string; sellingPrice: number; platformFee: number; gstOnFees: number;
  netPayable: number; supplierPayable: number | null; platformEarnings: number | null;
  shippingCharge: number; packingCharge: number; codFee: number; adSpend: number;
  grossProfit: number | null; netProfit: number | null; createdAt: string;
}
interface OrderDetail {
  id: string; externalOrderId: string; source: string; status: string;
  supplierStatus: string | null; supplierNote: string | null;
  customerName: string | null; customerEmail: string | null;
  customerAddress: Record<string, string> | null;
  totalAmount: number; awbNumber: string | null; trackingUrl: string | null;
  courier: string | null; supplierTrackingNo: string | null; supplierCourier: string | null;
  dispatchedAt: string | null; expectedDispatchDate: string | null; expectedDeliveryDate: string | null;
  productCost: number | null; shippingCharge: number | null; packingCharge: number | null;
  createdAt: string; updatedAt: string;
  seller:   { id: string; name: string | null; email: string; brandName: string | null; phone: string | null };
  supplier: { id: string; name: string | null; email: string; phone: string | null } | null;
  items: OrderItem[];
  purchaseOrder: PurchaseOrder | null;
  timeline: Timeline[];
  supplierPayment: SupplierPayment | null;
}

const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  NEW:        { bg: "#F3F4F6", color: "#4B5563" },
  PROCESSING: { bg: "#F5F3FF", color: "#7C3AED" },
  SHIPPED:    { bg: "#EFF6FF", color: "#2563EB" },
  IN_TRANSIT: { bg: "#FFFBEB", color: "#D97706" },
  DELIVERED:  { bg: "#F0FDF4", color: "#15803D" },
  CANCELLED:  { bg: "#FEF2F2", color: "#DC2626" },
  RTO:        { bg: "#FFF7ED", color: "#EA580C" },
};

const SUPPLIER_STATUS_LABELS: Record<string, string> = {
  ASSIGNED: "Assigned", ACCEPTED: "Accepted", REJECTED: "Rejected",
  PROCESSING: "Processing", PACKED: "Packed", READY_TO_SHIP: "Ready to Ship",
  DISPATCHED: "Dispatched",
};

const VALID_STATUSES = ["NEW", "PROCESSING", "SHIPPED", "IN_TRANSIT", "DELIVERED", "CANCELLED", "RTO"];

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

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder]           = useState<OrderDetail | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [loading, setLoading]       = useState(true);
  const [statusChanging, setStatusChanging] = useState(false);
  const [newStatus, setNewStatus]   = useState("");

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/orders/${id}`);
    if (r.ok) {
      const d = await r.json();
      setOrder(d.order);
      setSettlement(d.settlement ?? null);
      setNewStatus(d.order.status);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  async function handleStatusChange() {
    if (!order || newStatus === order.status) return;
    setStatusChanging(true);
    const r = await fetch("/api/admin/orders/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, status: newStatus }),
    });
    if (r.ok) fetchOrder();
    setStatusChanging(false);
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

  const addr   = order.customerAddress ?? {};
  const badge  = STATUS_COLOR[order.status] ?? STATUS_COLOR.NEW;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      {/* Top bar */}
      <div className="px-4 md:px-8 pt-6 pb-4 flex items-center gap-4">
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium"
          style={{ color: "var(--text-400)" }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--text-300)" }} />
        <span className="text-sm" style={{ color: "var(--text-400)" }}>Orders</span>
        <ChevronRight className="w-3.5 h-3.5" style={{ color: "var(--text-300)" }} />
        <span className="text-sm font-semibold font-mono" style={{ color: "var(--text-900)" }}>
          {order.externalOrderId}
        </span>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold ml-2"
          style={{ background: badge.bg, color: badge.color }}>
          {order.status}
        </span>
      </div>

      <div className="px-4 md:px-8 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Order summary */}
          <Section title="Order Details" icon={Package}>
            <div className="grid grid-cols-2 gap-x-8">
              <div>
                <Row label="Order ID"       value={<span className="font-mono">{order.externalOrderId}</span>} />
                <Row label="Source"         value={order.source} />
                <Row label="Order Date"     value={new Date(order.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} />
                <Row label="Total Amount"   value={<span className="font-bold text-green-600">{fmt(order.totalAmount)}</span>} />
                <Row label="Product Cost"   value={fmt(order.productCost)} />
                <Row label="Shipping"       value={fmt(order.shippingCharge)} />
                <Row label="AWB"            value={order.awbNumber ?? "—"} mono />
                <Row label="Courier"        value={order.courier ?? "—"} />
              </div>
              <div>
                <Row label="Status" value={
                  <div className="flex items-center gap-2">
                    <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
                      className="text-xs rounded-lg px-2 py-1 border"
                      style={{ background: "var(--bg-muted)", color: "var(--text-900)", borderColor: "var(--border)" }}>
                      {VALID_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {newStatus !== order.status && (
                      <button onClick={handleStatusChange} disabled={statusChanging}
                        className="px-2 py-1 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                        style={{ background: "#00C67A" }}>
                        {statusChanging ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                      </button>
                    )}
                  </div>
                } />
                <Row label="Supplier Status" value={order.supplierStatus ? SUPPLIER_STATUS_LABELS[order.supplierStatus] ?? order.supplierStatus : "—"} />
                <Row label="Supplier Tracking" value={order.supplierTrackingNo ?? "—"} mono />
                <Row label="Supplier Courier"  value={order.supplierCourier ?? "—"} />
                <Row label="Expected Dispatch" value={order.expectedDispatchDate ? new Date(order.expectedDispatchDate).toLocaleDateString("en-IN") : "—"} />
                <Row label="Expected Delivery" value={order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString("en-IN") : "—"} />
                <Row label="Dispatched At"     value={order.dispatchedAt ? new Date(order.dispatchedAt).toLocaleDateString("en-IN") : "—"} />
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
                      <td className="py-2.5 text-sm font-semibold" style={{ color: "var(--text-900)" }}>{fmt(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

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
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold" style={{ color: "var(--text-900)" }}>
                          {event.event.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background: "var(--bg-muted)", color: "var(--text-400)" }}>
                          {event.actorRole}
                        </span>
                      </div>
                      {event.details && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-500)" }}>{event.details}</p>
                      )}
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-300)" }}>
                        {new Date(event.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Settlement */}
          {settlement && (
            <Section title="Settlement Breakdown" icon={Receipt}>
              <div className="grid grid-cols-2 gap-x-8">
                <div>
                  <Row label="Selling Price"   value={<span style={{ color: "#00C67A" }}>{fmt(settlement.sellingPrice)}</span>} />
                  <Row label="Platform Fee"    value={fmt(settlement.platformFee)} />
                  <Row label="GST on Fee (18%)"value={fmt(settlement.gstOnFees)} />
                  <Row label="Shipping"        value={fmt(settlement.shippingCharge)} />
                  <Row label="Packing"         value={fmt(settlement.packingCharge)} />
                  <Row label="COD Fee"         value={fmt(settlement.codFee)} />
                  <Row label="Ad Spend"        value={fmt(settlement.adSpend)} />
                </div>
                <div>
                  <Row label="Net Payable (Seller)" value={<span style={{ color: "#A78BFA" }}>{fmt(settlement.netPayable)}</span>} />
                  <Row label="Supplier Payable"     value={fmt(settlement.supplierPayable)} />
                  <Row label="Platform Earnings"    value={fmt(settlement.platformEarnings)} />
                  <Row label="Gross Profit"         value={fmt(settlement.grossProfit)} />
                  <Row label="Net Profit"           value={
                    <span style={{ color: (settlement.netProfit ?? 0) >= 0 ? "#00C67A" : "#EF4444" }}>
                      {fmt(settlement.netProfit)}
                    </span>
                  } />
                  <Row label="Status" value={
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: "#F0FDF4", color: "#15803D" }}>
                      {settlement.status}
                    </span>
                  } />
                  <Row label="Settlement Date" value={new Date(settlement.createdAt).toLocaleDateString("en-IN")} />
                </div>
              </div>
            </Section>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Customer */}
          <Section title="Customer" icon={MapPin}>
            <div className="space-y-2">
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
              {(addr.address || addr.address1) && (
                <div className="flex gap-2">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "var(--text-300)" }} />
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-500)" }}>{addr.address ?? addr.address1}</p>
                    {(addr.city || addr.province || addr.state) && (
                      <p className="text-xs" style={{ color: "var(--text-400)" }}>
                        {[addr.city, addr.state ?? addr.province, addr.pincode ?? addr.zip].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Seller */}
          <Section title="Seller" icon={User}>
            <Row label="Name"  value={order.seller.brandName ?? order.seller.name ?? "—"} />
            <Row label="Email" value={order.seller.email} />
            <Row label="Phone" value={order.seller.phone ?? "—"} />
          </Section>

          {/* Supplier */}
          {order.supplier ? (
            <Section title="Supplier" icon={UserCheck}>
              <Row label="Name"   value={order.supplier.name ?? "—"} />
              <Row label="Email"  value={order.supplier.email} />
              <Row label="Phone"  value={order.supplier.phone ?? "—"} />
              <Row label="Status" value={order.supplierStatus ? SUPPLIER_STATUS_LABELS[order.supplierStatus] ?? order.supplierStatus : "—"} />
              {order.supplierNote && (
                <p className="mt-2 text-xs p-2 rounded-lg" style={{ background: "var(--bg-muted)", color: "var(--text-500)" }}>
                  {order.supplierNote}
                </p>
              )}
              {order.supplierPayment && (
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <Row label="Supplier Payment" value={fmt(order.supplierPayment.amount)} />
                  <Row label="Payment Status" value={
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: order.supplierPayment.status === "PAID" ? "#F0FDF4" : "#FFF7ED",
                               color:      order.supplierPayment.status === "PAID" ? "#15803D"  : "#D97706" }}>
                      {order.supplierPayment.status}
                    </span>
                  } />
                  {order.supplierPayment.referenceNo && (
                    <Row label="Reference" value={order.supplierPayment.referenceNo} mono />
                  )}
                </div>
              )}
            </Section>
          ) : (
            <div className="card p-5 flex flex-col items-center gap-2 text-center">
              <UserCheck className="w-6 h-6" style={{ color: "var(--text-300)" }} />
              <p className="text-xs" style={{ color: "var(--text-400)" }}>No supplier assigned</p>
              <p className="text-xs" style={{ color: "var(--text-300)" }}>
                Use the Orders list to assign a supplier
              </p>
            </div>
          )}

          {/* Purchase Order */}
          {order.purchaseOrder && (
            <Section title="Purchase Order" icon={Truck}>
              <Row label="PO Number"  value={order.purchaseOrder.poNumber} mono />
              <Row label="Status"     value={order.purchaseOrder.status} />
              <Row label="Created"    value={new Date(order.purchaseOrder.createdAt).toLocaleDateString("en-IN")} />
              {order.purchaseOrder.dispatchedAt && (
                <Row label="Dispatched" value={new Date(order.purchaseOrder.dispatchedAt).toLocaleDateString("en-IN")} />
              )}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

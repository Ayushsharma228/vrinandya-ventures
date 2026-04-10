"use client";

import { useState, useEffect, useCallback } from "react";
import { IndianRupee, CheckSquare, Square, Calculator, Send, ChevronDown, ChevronRight, History } from "lucide-react";

interface Seller { id: string; name: string | null; email: string; }

interface Order {
  id: string;
  externalOrderId: string;
  status: string;
  courier: string | null;
  customerName: string | null;
  totalAmount: number;
  productCost: number | null;
  shippingCharge: number | null;
  packingCharge: number | null;
  rtoCharge: number | null;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

interface ChargeRow {
  orderId: string;
  productCost: string;
  shippingCharge: string;
  packingCharge: string;
  rtoCharge: string;
  include: boolean;
}

interface HistoryOrder {
  id: string;
  externalOrderId: string;
  customerName: string | null;
  courier: string | null;
  totalAmount: number;
  productCost: number | null;
  shippingCharge: number | null;
  packingCharge: number | null;
  rtoCharge: number | null;
}

interface HistoryEntry {
  transaction: {
    id: string;
    type: string;
    amount: number;
    note: string | null;
    remittanceDate: string | null;
    createdAt: string;
  };
  orders: HistoryOrder[];
}

function fmt(n: number) { return `₹${n.toFixed(2)}`; }

function netForHistoryOrder(o: HistoryOrder) {
  const isRTO = o.courier?.includes("RTO") || false;
  const pc = o.productCost ?? 0;
  const sc = o.shippingCharge ?? 0;
  const pac = o.packingCharge ?? 0;
  const rtc = o.rtoCharge ?? 0;
  return isRTO ? -(pc + rtc + pac) : o.totalAmount - pc - sc - pac;
}

export default function AdminRemittancePage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [sellerId, setSellerId] = useState("");
  const [tab, setTab] = useState<"pending" | "history">("pending");

  // Pending state
  const [orders, setOrders] = useState<Order[]>([]);
  const [charges, setCharges] = useState<Record<string, ChargeRow>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [remittanceDate, setRemittanceDate] = useState("");
  const [note, setNote] = useState("");
  const [success, setSuccess] = useState<{ total: number } | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/sellers").then((r) => r.json()).then((d) => setSellers(d.sellers ?? []));
  }, []);

  const fetchPending = useCallback(async () => {
    if (!sellerId) return;
    setLoading(true);
    setSuccess(null);
    const res = await fetch(`/api/admin/remittance?sellerId=${sellerId}`);
    const data = await res.json();
    const fetched: Order[] = data.orders ?? [];
    setOrders(fetched);
    const rows: Record<string, ChargeRow> = {};
    fetched.forEach((o) => {
      rows[o.id] = {
        orderId: o.id,
        productCost: o.productCost?.toString() ?? "",
        shippingCharge: o.shippingCharge?.toString() ?? "",
        packingCharge: o.packingCharge?.toString() ?? "",
        rtoCharge: o.rtoCharge?.toString() ?? "",
        include: true,
      };
    });
    setCharges(rows);
    setLoading(false);
  }, [sellerId]);

  const fetchHistory = useCallback(async () => {
    if (!sellerId) return;
    setHistoryLoading(true);
    const res = await fetch(`/api/admin/remittance?sellerId=${sellerId}&mode=history`);
    const data = await res.json();
    setHistory(data.history ?? []);
    setHistoryLoading(false);
  }, [sellerId]);

  useEffect(() => {
    if (!sellerId) return;
    fetchPending();
    fetchHistory();
  }, [sellerId, fetchPending, fetchHistory]);

  function isRTO(order: Order) { return order.courier?.includes("RTO") || false; }

  function netForOrder(order: Order) {
    const row = charges[order.id];
    if (!row || !row.include) return null;
    const pc = parseFloat(row.productCost) || 0;
    const sc = parseFloat(row.shippingCharge) || 0;
    const pac = parseFloat(row.packingCharge) || 0;
    const rtc = parseFloat(row.rtoCharge) || 0;
    return isRTO(order) ? -(pc + rtc + pac) : order.totalAmount - pc - sc - pac;
  }

  const selectedOrders = orders.filter((o) => charges[o.id]?.include);
  const totalNet = selectedOrders.reduce((sum, o) => sum + (netForOrder(o) ?? 0), 0);
  const totalOrderAmt = selectedOrders.filter((o) => !isRTO(o)).reduce((s, o) => s + o.totalAmount, 0);
  const totalProductCost = selectedOrders.reduce((s, o) => s + (parseFloat(charges[o.id]?.productCost) || 0), 0);
  const totalShipping = selectedOrders.filter((o) => !isRTO(o)).reduce((s, o) => s + (parseFloat(charges[o.id]?.shippingCharge) || 0), 0);
  const totalPacking = selectedOrders.reduce((s, o) => s + (parseFloat(charges[o.id]?.packingCharge) || 0), 0);
  const totalRTO = selectedOrders.filter((o) => isRTO(o)).reduce((s, o) => s + (parseFloat(charges[o.id]?.rtoCharge) || 0), 0);
  const allSelected = orders.length > 0 && orders.every((o) => charges[o.id]?.include);

  function setCharge(orderId: string, field: keyof ChargeRow, value: string | boolean) {
    setCharges((p) => ({ ...p, [orderId]: { ...p[orderId], [field]: value } }));
  }

  function toggleAll() {
    setCharges((p) => {
      const next = { ...p };
      orders.forEach((o) => { next[o.id] = { ...next[o.id], include: !allSelected }; });
      return next;
    });
  }

  async function handleSubmit() {
    if (!sellerId || selectedOrders.length === 0) return;
    if (!remittanceDate) return alert("Please set the remittance date");
    setSubmitting(true);

    const payload = {
      sellerId, remittanceDate, note,
      orders: orders.map((o) => ({
        id: o.id,
        orderAmount: o.totalAmount,
        isRTO: isRTO(o),
        include: charges[o.id]?.include ?? false,
        productCost: charges[o.id]?.productCost ?? "0",
        shippingCharge: charges[o.id]?.shippingCharge ?? "0",
        packingCharge: charges[o.id]?.packingCharge ?? "0",
        rtoCharge: charges[o.id]?.rtoCharge ?? "0",
      })),
    };

    const res = await fetch("/api/admin/remittance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok) {
      setSuccess({ total: data.totalRemittance });
      setNote("");
      setRemittanceDate("");
      await fetchPending();
      await fetchHistory();
    } else {
      alert(data.error || "Failed to create remittance");
    }
    setSubmitting(false);
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Remittance</h1>
        <p className="text-sm text-gray-500 mt-0.5">Calculate and generate remittance for sellers</p>
      </div>

      {/* Seller select */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Select Seller</label>
        <select value={sellerId} onChange={(e) => { setSellerId(e.target.value); setTab("pending"); }}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">— choose a seller —</option>
          {sellers.map((s) => <option key={s.id} value={s.id}>{s.name || s.email} ({s.email})</option>)}
        </select>
        {sellerId && (
          <div className="flex border border-gray-200 rounded-lg overflow-hidden text-sm">
            <button onClick={() => setTab("pending")}
              className={`px-4 py-2 transition-colors ${tab === "pending" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
              Pending
            </button>
            <button onClick={() => setTab("history")}
              className={`px-4 py-2 border-l border-gray-200 flex items-center gap-1.5 transition-colors ${tab === "history" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
              <History className="w-3.5 h-3.5" />
              History
            </button>
          </div>
        )}
      </div>

      {success && (
        <div className={`rounded-xl p-4 text-sm font-semibold border ${success.total >= 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          Remittance created! Net {fmt(Math.abs(success.total))} {success.total >= 0 ? "credited" : "debited"} to seller wallet.
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {sellerId && tab === "history" && (
        historyLoading ? (
          <div className="py-12 text-center text-gray-400 text-sm">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 text-sm">
            No remittance history for this seller yet
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => {
              const isOpen = expanded === entry.transaction.id;
              const hasOrders = entry.orders.length > 0;
              const entryNet = entry.transaction.type === "CREDIT" ? entry.transaction.amount : -entry.transaction.amount;
              return (
                <div key={entry.transaction.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {/* Header row */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : entry.transaction.id)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      {hasOrders
                        ? (isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />)
                        : <span className="w-4" />}
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">
                          {entry.transaction.note || "Remittance"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Created: {new Date(entry.transaction.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          {entry.transaction.remittanceDate && (
                            <> · Remittance date: {new Date(entry.transaction.remittanceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</>
                          )}
                        </p>
                        {hasOrders && (
                          <p className="text-xs text-gray-400">{entry.orders.length} order(s)</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-lg font-bold ${entryNet >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {entryNet >= 0 ? "+" : ""}{fmt(entryNet)}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${entry.transaction.type === "CREDIT" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                        {entry.transaction.type}
                      </span>
                    </div>
                  </button>

                  {/* Expanded order breakdown */}
                  {isOpen && hasOrders && (
                    <div className="border-t border-gray-100">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-50/60 border-b border-gray-100">
                              <th className="px-4 py-2 text-left text-gray-500">Order #</th>
                              <th className="px-4 py-2 text-left text-gray-500">Type</th>
                              <th className="px-4 py-2 text-left text-gray-500">Customer</th>
                              <th className="px-4 py-2 text-right text-gray-500">Order Amt</th>
                              <th className="px-4 py-2 text-right text-purple-600">Product</th>
                              <th className="px-4 py-2 text-right text-blue-600">Shipping</th>
                              <th className="px-4 py-2 text-right text-orange-500">Packing</th>
                              <th className="px-4 py-2 text-right text-red-500">RTO</th>
                              <th className="px-4 py-2 text-right text-green-600">Net</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {entry.orders.map((o) => {
                              const rto = o.courier?.includes("RTO") || false;
                              const net = netForHistoryOrder(o);
                              return (
                                <tr key={o.id} className="hover:bg-gray-50/50">
                                  <td className="px-4 py-2 font-mono text-blue-600">{o.externalOrderId}</td>
                                  <td className="px-4 py-2">
                                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${rto ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"}`}>
                                      {rto ? "RTO" : "Delivered"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2 text-gray-600">{o.customerName || "—"}</td>
                                  <td className="px-4 py-2 text-right font-semibold text-gray-700">
                                    {rto ? <span className="text-gray-400">—</span> : fmt(o.totalAmount)}
                                  </td>
                                  <td className="px-4 py-2 text-right text-purple-700">{o.productCost != null ? fmt(o.productCost) : "—"}</td>
                                  <td className="px-4 py-2 text-right text-blue-700">{o.shippingCharge != null ? fmt(o.shippingCharge) : "—"}</td>
                                  <td className="px-4 py-2 text-right text-orange-600">{o.packingCharge != null ? fmt(o.packingCharge) : "—"}</td>
                                  <td className="px-4 py-2 text-right text-red-600">{o.rtoCharge != null ? fmt(o.rtoCharge) : "—"}</td>
                                  <td className="px-4 py-2 text-right font-bold">
                                    <span className={net >= 0 ? "text-green-600" : "text-red-500"}>{fmt(net)}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-50 border-t border-gray-200">
                              <td colSpan={8} className="px-4 py-2 text-right font-semibold text-gray-600">Total Net</td>
                              <td className="px-4 py-2 text-right font-bold text-sm">
                                <span className={entryNet >= 0 ? "text-green-600" : "text-red-500"}>{fmt(entryNet)}</span>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Manual transaction (no linked orders) */}
                  {isOpen && !hasOrders && (
                    <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-400">
                      Manual wallet adjustment — no order breakdown available
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── PENDING TAB ── */}
      {sellerId && tab === "pending" && (
        <>
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 text-sm">
              No pending orders to remit for this seller
            </div>
          ) : (
            <>
              {/* Orders Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-sm text-gray-900">Orders Pending Remittance ({orders.length})</span>
                  </div>
                  <button onClick={toggleAll} className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800">
                    {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    {allSelected ? "Deselect All" : "Select All"}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/60 border-b border-gray-100">
                        <th className="px-3 py-3 w-8"></th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">Order #</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">Type</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500">Customer</th>
                        <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500">Order Amt</th>
                        <th className="px-3 py-3 text-right text-xs font-semibold text-purple-600">Product Cost</th>
                        <th className="px-3 py-3 text-right text-xs font-semibold text-blue-600">Shipping</th>
                        <th className="px-3 py-3 text-right text-xs font-semibold text-orange-500">Packing</th>
                        <th className="px-3 py-3 text-right text-xs font-semibold text-red-500">RTO</th>
                        <th className="px-3 py-3 text-right text-xs font-semibold text-green-600">Net</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {orders.map((order) => {
                        const row = charges[order.id];
                        const rto = isRTO(order);
                        const net = netForOrder(order);
                        return (
                          <tr key={order.id} className={`hover:bg-gray-50/50 ${!row?.include ? "opacity-40" : ""}`}>
                            <td className="px-3 py-2 text-center">
                              <button onClick={() => setCharge(order.id, "include", !row?.include)}>
                                {row?.include ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className="w-4 h-4 text-gray-300" />}
                              </button>
                            </td>
                            <td className="px-3 py-2 font-mono text-xs text-blue-600 whitespace-nowrap">{order.externalOrderId}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rto ? "bg-orange-50 text-orange-600" : "bg-green-50 text-green-600"}`}>
                                {rto ? "RTO" : "Delivered"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">{order.customerName || "—"}</td>
                            <td className="px-3 py-2 text-right font-semibold text-gray-800 whitespace-nowrap">
                              {rto ? <span className="text-gray-400 text-xs">N/A</span> : fmt(order.totalAmount)}
                            </td>
                            <td className="px-3 py-2">
                              <input type="number" min="0" placeholder="0" value={row?.productCost ?? ""}
                                onChange={(e) => setCharge(order.id, "productCost", e.target.value)}
                                className="w-20 text-right px-2 py-1 text-xs border border-purple-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-400" />
                            </td>
                            <td className="px-3 py-2">
                              <input type="number" min="0" placeholder="0" value={row?.shippingCharge ?? ""}
                                onChange={(e) => setCharge(order.id, "shippingCharge", e.target.value)}
                                disabled={rto}
                                className="w-20 text-right px-2 py-1 text-xs border border-blue-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-400" />
                            </td>
                            <td className="px-3 py-2">
                              <input type="number" min="0" placeholder="0" value={row?.packingCharge ?? ""}
                                onChange={(e) => setCharge(order.id, "packingCharge", e.target.value)}
                                className="w-20 text-right px-2 py-1 text-xs border border-orange-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-400" />
                            </td>
                            <td className="px-3 py-2">
                              <input type="number" min="0" placeholder="0" value={row?.rtoCharge ?? ""}
                                onChange={(e) => setCharge(order.id, "rtoCharge", e.target.value)}
                                disabled={!rto}
                                className="w-20 text-right px-2 py-1 text-xs border border-red-200 rounded-md focus:outline-none focus:ring-1 focus:ring-red-400 disabled:bg-gray-50 disabled:text-gray-400" />
                            </td>
                            <td className="px-3 py-2 text-right font-bold whitespace-nowrap">
                              {net === null ? <span className="text-gray-300 text-xs">—</span>
                                : <span className={net >= 0 ? "text-green-600" : "text-red-500"}>{fmt(net)}</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-gray-500" />
                  Remittance Summary ({selectedOrders.length} orders selected)
                </h2>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Total Order Amount</p>
                    <p className="font-bold text-gray-800 mt-0.5">{fmt(totalOrderAmt)}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-purple-600">Total Product Cost</p>
                    <p className="font-bold text-purple-700 mt-0.5">- {fmt(totalProductCost)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-600">Total Shipping</p>
                    <p className="font-bold text-blue-700 mt-0.5">- {fmt(totalShipping)}</p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <p className="text-xs text-orange-500">Total Packing</p>
                    <p className="font-bold text-orange-600 mt-0.5">- {fmt(totalPacking)}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-red-500">Total RTO Charges</p>
                    <p className="font-bold text-red-600 mt-0.5">- {fmt(totalRTO)}</p>
                  </div>
                  <div className={`rounded-lg p-3 ${totalNet >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                    <p className={`text-xs font-semibold ${totalNet >= 0 ? "text-green-600" : "text-red-500"}`}>Net Remittance</p>
                    <p className={`text-xl font-bold mt-0.5 ${totalNet >= 0 ? "text-green-700" : "text-red-600"}`}>{fmt(totalNet)}</p>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Remittance Date *</label>
                    <input type="date" value={remittanceDate} onChange={(e) => setRemittanceDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Note (optional)</label>
                    <input type="text" placeholder="e.g. Week 1 remittance" value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>
                <button onClick={handleSubmit} disabled={submitting || selectedOrders.length === 0 || !remittanceDate}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
                  <Send className="w-4 h-4" />
                  {submitting ? "Creating..." : `Generate Remittance — ${fmt(totalNet)}`}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

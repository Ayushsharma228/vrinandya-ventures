"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ChevronDown, ChevronRight, CheckSquare, Square,
  IndianRupee, CheckCircle2, Clock, AlertCircle,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface SupplierInfo {
  id: string; name: string | null; email: string;
  businessName: string | null; phone: string | null;
}

interface Payment {
  id: string; amount: number; status: string;
  dueDate: string | null; paidAt: string | null;
  bankTxId: string | null; referenceNo: string | null; notes: string | null;
  createdAt: string;
  order: {
    externalOrderId: string; totalAmount: number;
    status: string; createdAt: string; customerName: string | null;
  };
}

interface SupplierGroup {
  supplier: SupplierInfo;
  totalPending: number;
  totalPaid:    number;
  payments:     Payment[];
}

function fmt(n: number) { return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_OPTIONS = [
  { value: "PENDING",  label: "Pending" },
  { value: "PAID",     label: "Paid" },
  { value: "all",      label: "All" },
];

export default function SupplierPayablesPage() {
  const [groups,       setGroups]       = useState<SupplierGroup[]>([]);
  const [grandPending, setGrandPending] = useState(0);
  const [grandPaid,    setGrandPaid]    = useState(0);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [loading,      setLoading]      = useState(true);
  const [expanded,     setExpanded]     = useState<Set<string>>(new Set());
  const [selected,     setSelected]     = useState<Set<string>>(new Set());

  // Pay modal
  const [payModal,     setPayModal]     = useState(false);
  const [bankTxId,     setBankTxId]     = useState("");
  const [referenceNo,  setReferenceNo]  = useState("");
  const [payNotes,     setPayNotes]     = useState("");
  const [paying,       setPaying]       = useState(false);
  const [payError,     setPayError]     = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/admin/supplier-payables?status=${statusFilter}`);
      const data = await res.json();
      setGroups(data.suppliers ?? []);
      setGrandPending(data.grandPending ?? 0);
      setGrandPaid(data.grandPaid ?? 0);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function toggleExpand(sid: string) {
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(sid) ? n.delete(sid) : n.add(sid);
      return n;
    });
  }

  function togglePayment(pid: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(pid) ? n.delete(pid) : n.add(pid);
      return n;
    });
  }

  function selectAll(payments: Payment[]) {
    const pending = payments.filter((p) => p.status === "PENDING" || p.status === "APPROVED");
    setSelected((prev) => {
      const n = new Set(prev);
      const allSelected = pending.every((p) => n.has(p.id));
      pending.forEach((p) => allSelected ? n.delete(p.id) : n.add(p.id));
      return n;
    });
  }

  async function handleMarkPaid() {
    if (!bankTxId.trim() && !referenceNo.trim()) {
      setPayError("Enter a bank transaction ID or reference number.");
      return;
    }
    setPaying(true);
    setPayError("");
    try {
      const res = await fetch("/api/admin/supplier-payables", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIds: Array.from(selected),
          bankTxId, referenceNo, notes: payNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setPayError(data.error || "Failed"); return; }
      setPayModal(false);
      setBankTxId(""); setReferenceNo(""); setPayNotes("");
      setSelected(new Set());
      await fetchData();
    } finally {
      setPaying(false);
    }
  }

  const selectedAmount = groups
    .flatMap((g) => g.payments)
    .filter((p) => selected.has(p.id))
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <PageHero
        title="Supplier Payables"
        subtitle="Track and settle amounts owed to suppliers for delivered orders"
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Pending Payables", value: grandPending, color: "#f97316", icon: Clock },
          { label: "Total Paid",        value: grandPaid,    color: "#00C67A", icon: CheckCircle2 },
          { label: "Suppliers",         value: groups.length, color: "#6366f1", icon: AlertCircle, isCount: true },
        ].map(({ label, value, color, icon: Icon, isCount }) => (
          <div key={label} className="rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} style={{ color }} />
              <span className="text-xs" style={{ color: "var(--text-400)" }}>{label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: "var(--text-900)" }}>
              {isCount ? value : fmt(value as number)}
            </div>
          </div>
        ))}
      </div>

      {/* Filters + bulk action */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setStatusFilter(opt.value); setSelected(new Set()); }}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                background: statusFilter === opt.value ? "var(--accent)" : "var(--bg-card)",
                color:      statusFilter === opt.value ? "#fff"          : "var(--text-400)",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <button
            onClick={() => setPayModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "#00C67A", color: "#fff" }}
          >
            <CheckCircle2 size={15} />
            Mark {selected.size} payment{selected.size > 1 ? "s" : ""} paid · {fmt(selectedAmount)}
          </button>
        )}
      </div>

      {/* Groups */}
      {loading ? (
        <div className="text-center py-16" style={{ color: "var(--text-400)" }}>Loading…</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-400)" }}>
          No {statusFilter !== "all" ? statusFilter.toLowerCase() : ""} payables found.
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const isOpen   = expanded.has(g.supplier.id);
            const pending  = g.payments.filter((p) => p.status === "PENDING" || p.status === "APPROVED");
            const allSel   = pending.length > 0 && pending.every((p) => selected.has(p.id));

            return (
              <div key={g.supplier.id} className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                {/* Header row */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none"
                  onClick={() => toggleExpand(g.supplier.id)}
                >
                  {isOpen ? <ChevronDown size={16} style={{ color: "var(--text-400)" }} /> : <ChevronRight size={16} style={{ color: "var(--text-400)" }} />}

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm" style={{ color: "var(--text-900)" }}>
                      {g.supplier.businessName || g.supplier.name || g.supplier.email}
                    </div>
                    {g.supplier.businessName && g.supplier.name && (
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-400)" }}>
                        {g.supplier.name} · {g.supplier.email}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <div className="text-xs mb-0.5" style={{ color: "var(--text-400)" }}>Pending</div>
                      <div className="font-bold" style={{ color: g.totalPending > 0 ? "#f97316" : "var(--text-900)" }}>
                        {fmt(g.totalPending)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs mb-0.5" style={{ color: "var(--text-400)" }}>Paid</div>
                      <div className="font-semibold" style={{ color: "#00C67A" }}>{fmt(g.totalPaid)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs mb-0.5" style={{ color: "var(--text-400)" }}>Orders</div>
                      <div className="font-semibold" style={{ color: "var(--text-900)" }}>{g.payments.length}</div>
                    </div>
                  </div>
                </div>

                {/* Expanded table */}
                {isOpen && (
                  <div className="border-t overflow-x-auto" style={{ borderColor: "var(--border)" }}>
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: "var(--bg-muted)" }}>
                          <th className="px-4 py-2 text-left">
                            {pending.length > 0 && (
                              <button onClick={(e) => { e.stopPropagation(); selectAll(g.payments); }}>
                                {allSel
                                  ? <CheckSquare size={14} style={{ color: "var(--accent)" }} />
                                  : <Square size={14} style={{ color: "var(--text-400)" }} />
                                }
                              </button>
                            )}
                          </th>
                          <th className="px-4 py-2 text-left" style={{ color: "var(--text-400)" }}>Order #</th>
                          <th className="px-4 py-2 text-left" style={{ color: "var(--text-400)" }}>Customer</th>
                          <th className="px-4 py-2 text-left" style={{ color: "var(--text-400)" }}>Order Date</th>
                          <th className="px-4 py-2 text-left" style={{ color: "var(--text-400)" }}>Due Date</th>
                          <th className="px-4 py-2 text-right" style={{ color: "var(--text-400)" }}>Amount</th>
                          <th className="px-4 py-2 text-center" style={{ color: "var(--text-400)" }}>Status</th>
                          <th className="px-4 py-2 text-left" style={{ color: "var(--text-400)" }}>Ref / Bank ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.payments.map((p) => {
                          const isPending = p.status === "PENDING" || p.status === "APPROVED";
                          const isSel     = selected.has(p.id);
                          return (
                            <tr
                              key={p.id}
                              style={{
                                background: isSel ? "rgba(0,198,122,0.06)" : undefined,
                                borderTop:  "1px solid var(--border)",
                              }}
                            >
                              <td className="px-4 py-2.5">
                                {isPending && (
                                  <button onClick={() => togglePayment(p.id)}>
                                    {isSel
                                      ? <CheckSquare size={14} style={{ color: "var(--accent)" }} />
                                      : <Square size={14} style={{ color: "var(--text-400)" }} />
                                    }
                                  </button>
                                )}
                              </td>
                              <td className="px-4 py-2.5 font-mono" style={{ color: "#6366f1" }}>
                                {p.order.externalOrderId}
                              </td>
                              <td className="px-4 py-2.5" style={{ color: "var(--text-400)" }}>
                                {p.order.customerName || "—"}
                              </td>
                              <td className="px-4 py-2.5" style={{ color: "var(--text-400)" }}>
                                {fmtDate(p.order.createdAt)}
                              </td>
                              <td className="px-4 py-2.5" style={{ color: "var(--text-400)" }}>
                                {fmtDate(p.dueDate)}
                              </td>
                              <td className="px-4 py-2.5 text-right font-semibold" style={{ color: "var(--text-900)" }}>
                                {fmt(p.amount)}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  p.status === "PAID"     ? "bg-green-50 text-green-700" :
                                  p.status === "PENDING"  ? "bg-orange-50 text-orange-600" :
                                  p.status === "APPROVED" ? "bg-blue-50 text-blue-600" :
                                  "bg-gray-100 text-gray-500"
                                }`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 font-mono text-xs" style={{ color: "var(--text-400)" }}>
                                {p.bankTxId || p.referenceNo || (p.status === "PAID" ? "—" : "")}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mark Paid Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div>
              <div className="font-bold text-lg mb-0.5" style={{ color: "var(--text-900)" }}>
                Mark {selected.size} Payment{selected.size > 1 ? "s" : ""} as Paid
              </div>
              <div className="text-sm" style={{ color: "var(--text-400)" }}>
                Total: <span className="font-semibold" style={{ color: "#00C67A" }}>{fmt(selectedAmount)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-400)" }}>Bank Transaction ID</label>
                <input
                  value={bankTxId}
                  onChange={(e) => setBankTxId(e.target.value)}
                  placeholder="e.g. UTR1234567890"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-900)" }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-400)" }}>Reference No</label>
                <input
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="Optional internal reference"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                  style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-900)" }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1 font-medium" style={{ color: "var(--text-400)" }}>Notes (optional)</label>
                <textarea
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  rows={2}
                  placeholder="Any remarks…"
                  className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
                  style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--text-900)" }}
                />
              </div>
            </div>

            {payError && (
              <div className="text-xs text-red-500">{payError}</div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setPayModal(false); setPayError(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: "var(--bg-muted)", color: "var(--text-400)", border: "1px solid var(--border)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleMarkPaid}
                disabled={paying}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: "#00C67A", color: "#fff", opacity: paying ? 0.7 : 1 }}
              >
                <IndianRupee size={14} />
                {paying ? "Saving…" : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

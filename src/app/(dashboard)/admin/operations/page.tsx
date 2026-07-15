"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RefreshCw, AlertTriangle, Clock, Package, TrendingDown, Wallet, Users, Truck } from "lucide-react";

interface OperationsData {
  summary: {
    awaitingAssignment:    number;
    nonRespondingSuppliers: number;
    inventoryAlerts:       number;
    delayedOrders:         number;
    pendingSettlements:    number;
    pendingWithdrawals:    number;
    highRtoSellers:        number;
    highRtoSuppliers:      number;
    slaBreaches:           number;
  };
  awaitingAssignment:    { id: string; externalOrderId: string; createdAt: string; seller?: { name?: string } }[];
  nonRespondingSuppliers: { id: string; externalOrderId: string; updatedAt: string; supplierId?: string; supplier?: { name?: string; email?: string } }[];
  lowInventoryItems:     { id: string; availableQty: number; product?: { name?: string }; supplier?: { name?: string; email?: string } }[];
  delayedOrders:         { id: string; assignmentBreached?: boolean; acceptanceBreached?: boolean; packingBreached?: boolean; dispatchBreached?: boolean; order?: { id?: string; externalOrderId?: string; status?: string; seller?: { name?: string } } }[];
  pendingSettlements:    { id: string; externalOrderId: string; updatedAt: string; seller?: { name?: string } }[];
  pendingWithdrawals:    { id: string; amount: number; createdAt: string; seller?: { name?: string } }[];
  highRtoSellers:        { seller_id: string; name?: string; total: number; rto: number; rto_rate: number }[];
  highRtoSuppliers:      { supplier_id: string; name?: string; total: number; rto: number; rto_rate: number }[];
}

const inr = (v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const hoursAgo = (d: string) => Math.round((Date.now() - new Date(d).getTime()) / 3600000);

const KPI_DEFS = [
  { key: "awaitingAssignment",     label: "Awaiting Assignment",    icon: Package,      color: "#f59e0b" },
  { key: "nonRespondingSuppliers", label: "Non-Responding Suppliers", icon: Truck,       color: "#ef4444" },
  { key: "inventoryAlerts",        label: "Inventory Alerts",        icon: AlertTriangle, color: "#f97316" },
  { key: "slaBreaches",            label: "SLA Breaches",            icon: Clock,        color: "#dc2626" },
  { key: "pendingSettlements",     label: "Pending Settlements",     icon: TrendingDown, color: "#8b5cf6" },
  { key: "pendingWithdrawals",     label: "Pending Withdrawals",     icon: Wallet,       color: "#06b6d4" },
  { key: "highRtoSellers",         label: "High RTO Sellers",        icon: Users,        color: "#ef4444" },
  { key: "highRtoSuppliers",       label: "High RTO Suppliers",      icon: Truck,        color: "#f43f5e" },
] as const;

export default function OperationsDashboard() {
  const [data, setData]       = useState<OperationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<string>("awaiting");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/operations");
      if (r.ok) setData(await r.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tabs = [
    { id: "awaiting",    label: "Awaiting Assignment" },
    { id: "suppliers",   label: "Non-Responding Suppliers" },
    { id: "inventory",   label: "Inventory Alerts" },
    { id: "sla",         label: "SLA Breaches" },
    { id: "settlements", label: "Pending Settlements" },
    { id: "withdrawals", label: "Pending Withdrawals" },
    { id: "rto",         label: "High RTO" },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: 1400 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-900)", margin: 0 }}>Operations Dashboard</h1>
          <p style={{ color: "var(--text-400)", margin: "4px 0 0", fontSize: 14 }}>Live view of operational alerts and issues</p>
        </div>
        <button onClick={load} disabled={loading}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
                   background: "var(--bg-card)", border: "1px solid var(--border)", cursor: "pointer",
                   color: "var(--text-900)", fontSize: 14 }}>
          <RefreshCw size={14} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          Refresh
        </button>
      </div>

      {/* KPI Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
        {KPI_DEFS.map(({ key, label, icon: Icon, color }) => (
          <div key={key} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10,
                                   padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Icon size={14} style={{ color }} />
              <span style={{ fontSize: 11, color: "var(--text-400)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: data?.summary[key] ? color : "var(--text-300)" }}>
              {loading ? "—" : (data?.summary[key] ?? 0)}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", marginBottom: 20, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "8px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 13,
                     fontWeight: tab === t.id ? 600 : 400,
                     color: tab === t.id ? "var(--accent)" : "var(--text-400)",
                     borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
                     whiteSpace: "nowrap" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "awaiting" && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-400)" }}>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Order</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Seller</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Created</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Age</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {(data?.awaitingAssignment ?? []).map(o => (
              <tr key={o.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px" }}>
                  <Link href={`/admin/orders/${o.id}`} style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                    {o.externalOrderId ?? o.id.slice(-8)}
                  </Link>
                </td>
                <td style={{ padding: "10px", color: "var(--text-400)" }}>{o.seller?.name ?? "—"}</td>
                <td style={{ padding: "10px", color: "var(--text-400)" }}>{fmtDate(o.createdAt)}</td>
                <td style={{ padding: "10px" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 4,
                                 background: hoursAgo(o.createdAt) > 6 ? "#fee2e2" : "#fef9c3",
                                 color:      hoursAgo(o.createdAt) > 6 ? "#dc2626" : "#b45309",
                                 fontSize: 12, fontWeight: 600 }}>
                    {hoursAgo(o.createdAt)}h ago
                  </span>
                </td>
                <td style={{ padding: "10px" }}>
                  <Link href={`/admin/orders/${o.id}`}
                    style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>
                    Assign →
                  </Link>
                </td>
              </tr>
            ))}
            {!loading && (data?.awaitingAssignment?.length ?? 0) === 0 && (
              <tr><td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "var(--text-400)" }}>
                All orders assigned
              </td></tr>
            )}
          </tbody>
        </table>
      )}

      {tab === "suppliers" && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-400)" }}>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Order</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Supplier</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Assigned</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Waiting</th>
            </tr>
          </thead>
          <tbody>
            {(data?.nonRespondingSuppliers ?? []).map(o => (
              <tr key={o.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px" }}>
                  <Link href={`/admin/orders/${o.id}`} style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                    {o.externalOrderId ?? o.id.slice(-8)}
                  </Link>
                </td>
                <td style={{ padding: "10px" }}>
                  <div style={{ fontWeight: 500 }}>{o.supplier?.name ?? "—"}</div>
                  <div style={{ fontSize: 11, color: "var(--text-400)" }}>{o.supplier?.email}</div>
                </td>
                <td style={{ padding: "10px", color: "var(--text-400)" }}>{fmtDate(o.updatedAt)}</td>
                <td style={{ padding: "10px" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 4, background: "#fee2e2", color: "#dc2626",
                                 fontSize: 12, fontWeight: 600 }}>
                    {hoursAgo(o.updatedAt)}h
                  </span>
                </td>
              </tr>
            ))}
            {!loading && (data?.nonRespondingSuppliers?.length ?? 0) === 0 && (
              <tr><td colSpan={4} style={{ padding: "24px", textAlign: "center", color: "var(--text-400)" }}>
                No non-responding suppliers
              </td></tr>
            )}
          </tbody>
        </table>
      )}

      {tab === "inventory" && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-400)" }}>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Product</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Supplier</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Available Qty</th>
            </tr>
          </thead>
          <tbody>
            {(data?.lowInventoryItems ?? []).map(item => (
              <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px", fontWeight: 500 }}>{item.product?.name ?? "—"}</td>
                <td style={{ padding: "10px", color: "var(--text-400)" }}>
                  <div>{item.supplier?.name ?? "—"}</div>
                  <div style={{ fontSize: 11 }}>{item.supplier?.email}</div>
                </td>
                <td style={{ padding: "10px" }}>
                  <span style={{ padding: "2px 8px", borderRadius: 4,
                                 background: item.availableQty === 0 ? "#fee2e2" : "#fef9c3",
                                 color:      item.availableQty === 0 ? "#dc2626" : "#b45309",
                                 fontSize: 12, fontWeight: 600 }}>
                    {item.availableQty} units
                  </span>
                </td>
              </tr>
            ))}
            {!loading && (data?.lowInventoryItems?.length ?? 0) === 0 && (
              <tr><td colSpan={3} style={{ padding: "24px", textAlign: "center", color: "var(--text-400)" }}>
                No inventory alerts
              </td></tr>
            )}
          </tbody>
        </table>
      )}

      {tab === "sla" && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-400)" }}>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Order</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Seller</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Status</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Breaches</th>
            </tr>
          </thead>
          <tbody>
            {(data?.delayedOrders ?? []).map(sla => (
              <tr key={sla.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px" }}>
                  <Link href={`/admin/orders/${sla.order?.id}`} style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                    {sla.order?.externalOrderId ?? sla.order?.id?.slice(-8) ?? "—"}
                  </Link>
                </td>
                <td style={{ padding: "10px", color: "var(--text-400)" }}>{sla.order?.seller?.name ?? "—"}</td>
                <td style={{ padding: "10px" }}>
                  <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4,
                                 background: "var(--bg-muted)", color: "var(--text-400)" }}>
                    {sla.order?.status ?? "—"}
                  </span>
                </td>
                <td style={{ padding: "10px", display: "flex", gap: 4 }}>
                  {sla.assignmentBreached && <span style={{ padding: "2px 6px", borderRadius: 4, background: "#fee2e2", color: "#dc2626", fontSize: 11 }}>Assignment</span>}
                  {sla.acceptanceBreached && <span style={{ padding: "2px 6px", borderRadius: 4, background: "#fee2e2", color: "#dc2626", fontSize: 11 }}>Acceptance</span>}
                  {sla.packingBreached    && <span style={{ padding: "2px 6px", borderRadius: 4, background: "#fee2e2", color: "#dc2626", fontSize: 11 }}>Packing</span>}
                  {sla.dispatchBreached   && <span style={{ padding: "2px 6px", borderRadius: 4, background: "#fee2e2", color: "#dc2626", fontSize: 11 }}>Dispatch</span>}
                </td>
              </tr>
            ))}
            {!loading && (data?.delayedOrders?.length ?? 0) === 0 && (
              <tr><td colSpan={4} style={{ padding: "24px", textAlign: "center", color: "var(--text-400)" }}>
                No SLA breaches
              </td></tr>
            )}
          </tbody>
        </table>
      )}

      {tab === "settlements" && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-400)" }}>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Order</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Seller</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Delivered At</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {(data?.pendingSettlements ?? []).map(o => (
              <tr key={o.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px" }}>
                  <Link href={`/admin/orders/${o.id}`} style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                    {o.externalOrderId ?? o.id.slice(-8)}
                  </Link>
                </td>
                <td style={{ padding: "10px", color: "var(--text-400)" }}>{o.seller?.name ?? "—"}</td>
                <td style={{ padding: "10px", color: "var(--text-400)" }}>{o.updatedAt ? fmtDate(o.updatedAt) : "—"}</td>
                <td style={{ padding: "10px" }}>
                  <Link href="/admin/finance" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>
                    Settle →
                  </Link>
                </td>
              </tr>
            ))}
            {!loading && (data?.pendingSettlements?.length ?? 0) === 0 && (
              <tr><td colSpan={4} style={{ padding: "24px", textAlign: "center", color: "var(--text-400)" }}>
                All settlements generated
              </td></tr>
            )}
          </tbody>
        </table>
      )}

      {tab === "withdrawals" && (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-400)" }}>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Seller</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Amount</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Requested</th>
              <th style={{ textAlign: "left", padding: "8px 10px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {(data?.pendingWithdrawals ?? []).map(w => (
              <tr key={w.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "10px", fontWeight: 500 }}>{w.seller?.name ?? "—"}</td>
                <td style={{ padding: "10px", fontWeight: 700, color: "var(--accent)" }}>{inr(w.amount)}</td>
                <td style={{ padding: "10px", color: "var(--text-400)" }}>{fmtDate(w.createdAt)}</td>
                <td style={{ padding: "10px" }}>
                  <Link href="/admin/wallet" style={{ fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>
                    Process →
                  </Link>
                </td>
              </tr>
            ))}
            {!loading && (data?.pendingWithdrawals?.length ?? 0) === 0 && (
              <tr><td colSpan={4} style={{ padding: "24px", textAlign: "center", color: "var(--text-400)" }}>
                No pending withdrawals
              </td></tr>
            )}
          </tbody>
        </table>
      )}

      {tab === "rto" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* High RTO Sellers */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--text-900)" }}>High RTO Sellers</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-400)" }}>
                  <th style={{ textAlign: "left", padding: "6px 8px" }}>Seller</th>
                  <th style={{ textAlign: "right", padding: "6px 8px" }}>Orders</th>
                  <th style={{ textAlign: "right", padding: "6px 8px" }}>RTO%</th>
                </tr>
              </thead>
              <tbody>
                {(data?.highRtoSellers ?? []).map(s => (
                  <tr key={s.seller_id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px" }}>{s.name ?? s.seller_id.slice(-8)}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "var(--text-400)" }}>{s.total}</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>
                      <span style={{ padding: "2px 6px", borderRadius: 4, background: "#fee2e2", color: "#dc2626", fontWeight: 600, fontSize: 12 }}>
                        {s.rto_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && (data?.highRtoSellers?.length ?? 0) === 0 && (
                  <tr><td colSpan={3} style={{ padding: "16px", textAlign: "center", color: "var(--text-400)" }}>None</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* High RTO Suppliers */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--text-900)" }}>High RTO Suppliers</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-400)" }}>
                  <th style={{ textAlign: "left", padding: "6px 8px" }}>Supplier</th>
                  <th style={{ textAlign: "right", padding: "6px 8px" }}>Orders</th>
                  <th style={{ textAlign: "right", padding: "6px 8px" }}>RTO%</th>
                </tr>
              </thead>
              <tbody>
                {(data?.highRtoSuppliers ?? []).map(s => (
                  <tr key={s.supplier_id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px" }}>{s.name ?? s.supplier_id.slice(-8)}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: "var(--text-400)" }}>{s.total}</td>
                    <td style={{ padding: "8px", textAlign: "right" }}>
                      <span style={{ padding: "2px 6px", borderRadius: 4, background: "#fee2e2", color: "#dc2626", fontWeight: 600, fontSize: 12 }}>
                        {s.rto_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && (data?.highRtoSuppliers?.length ?? 0) === 0 && (
                  <tr><td colSpan={3} style={{ padding: "16px", textAlign: "center", color: "var(--text-400)" }}>None</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

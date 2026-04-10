"use client";

import { useState, useEffect } from "react";
import { IndianRupee, Plus, Trash2, Copy } from "lucide-react";

interface Seller { id: string; name: string | null; email: string; balance: number; }
interface Transaction {
  id: string;
  type: string;
  amount: number;
  note: string | null;
  orderId: string | null;
  remittanceDate: string | null;
  createdAt: string;
}

export default function AdminWalletPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selected, setSelected] = useState<Seller | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [form, setForm] = useState({ type: "CREDIT", amount: "", note: "", orderId: "", remittanceDate: "" });
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { fetchSellers(); }, []);

  async function fetchSellers() {
    const res = await fetch("/api/admin/wallet");
    const data = await res.json();
    setSellers(data.sellers ?? []);
  }

  async function fetchTransactions(sellerId: string) {
    const res = await fetch(`/api/admin/wallet/${sellerId}`);
    const data = await res.json();
    setTransactions(data.transactions ?? []);
    setBalance(data.balance ?? 0);
  }

  function handleSelect(seller: Seller) {
    setSelected(seller);
    fetchTransactions(seller.id);
  }

  async function handleAdd() {
    if (!selected || !form.amount) return;
    setSaving(true);
    await fetch("/api/admin/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId: selected.id, ...form }),
    });
    setForm({ type: "CREDIT", amount: "", note: "", orderId: "", remittanceDate: "" });
    await fetchTransactions(selected.id);
    await fetchSellers();
    setSaving(false);
  }

  async function handleDelete(txId: string) {
    if (!selected || !confirm("Delete this transaction?")) return;
    await fetch(`/api/admin/wallet/${selected.id}?txId=${txId}`, { method: "DELETE" });
    await fetchTransactions(selected.id);
    await fetchSellers();
  }

  function copyTxId(id: string) {
    navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Wallet Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage seller balances and transactions</p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Sellers List */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden col-span-1">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-700">Sellers</div>
          {sellers.length === 0 ? (
            <p className="p-4 text-sm text-gray-400">No sellers found</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {sellers.map((s) => (
                <button key={s.id} onClick={() => handleSelect(s)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selected?.id === s.id ? "bg-blue-50" : ""}`}>
                  <p className="text-sm font-medium text-gray-800">{s.name || s.email}</p>
                  <p className="text-xs text-gray-400">{s.email}</p>
                  <p className={`text-sm font-bold mt-0.5 ${s.balance >= 0 ? "text-green-600" : "text-red-500"}`}>
                    ₹{s.balance.toFixed(2)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Transactions */}
        <div className="col-span-2 space-y-4">
          {!selected ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 text-sm">
              Select a seller to manage their wallet
            </div>
          ) : (
            <>
              {/* Balance + Add Form */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Balance — {selected.name || selected.email}</p>
                    <p className={`text-3xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-500"}`}>
                      ₹{balance.toFixed(2)}
                    </p>
                  </div>
                  <IndianRupee className="w-8 h-8 text-gray-200" />
                </div>

                {/* Add Transaction */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Add Transaction</p>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                      className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
                      <option value="CREDIT">Credit (+)</option>
                      <option value="DEBIT">Debit (-)</option>
                    </select>
                    <input type="number" placeholder="Amount (₹)" value={form.amount}
                      onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                      className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <input type="text" placeholder="Note (optional)" value={form.note}
                      onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                      className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <input type="text" placeholder="Order ID (optional)" value={form.orderId}
                      onChange={(e) => setForm((p) => ({ ...p, orderId: e.target.value }))}
                      className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Expected Remittance Date</label>
                      <input type="date" value={form.remittanceDate}
                        onChange={(e) => setForm((p) => ({ ...p, remittanceDate: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                  </div>
                  <button onClick={handleAdd} disabled={saving || !form.amount}
                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
                    <Plus className="w-4 h-4" /> {saving ? "Saving..." : "Add Transaction"}
                  </button>
                </div>
              </div>

              {/* Transaction History */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-700">
                  Transaction History ({transactions.length})
                </div>
                {transactions.length === 0 ? (
                  <p className="p-8 text-center text-sm text-gray-400">No transactions yet</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {transactions.map((t) => (
                      <div key={t.id} className="px-4 py-3 hover:bg-gray-50">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${t.type === "CREDIT" ? "bg-green-500" : "bg-red-500"}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700">{t.note || (t.type === "CREDIT" ? "Credit" : "Debit")}</p>
                              {t.orderId && <p className="text-xs text-gray-400">Order: {t.orderId}</p>}
                              <p className="text-xs text-gray-400">
                                {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                              </p>
                              {t.remittanceDate && (
                                <p className="text-xs text-blue-500 mt-0.5">
                                  Remittance by: {new Date(t.remittanceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                                </p>
                              )}
                              {/* Transaction ID */}
                              <button onClick={() => copyTxId(t.id)}
                                className="flex items-center gap-1 mt-1 text-xs text-gray-400 hover:text-gray-600 transition-colors font-mono">
                                <span>Tx: {t.id.slice(0, 12)}…</span>
                                <Copy className="w-3 h-3" />
                                {copied === t.id && <span className="text-green-500 font-sans font-medium">Copied!</span>}
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`font-bold text-sm ${t.type === "CREDIT" ? "text-green-600" : "text-red-500"}`}>
                              {t.type === "CREDIT" ? "+" : "-"}₹{t.amount.toFixed(2)}
                            </span>
                            <button onClick={() => handleDelete(t.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

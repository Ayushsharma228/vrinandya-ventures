"use client";

import { useState, useEffect } from "react";
import { Plus, X, Warehouse, CheckCircle, Clock, XCircle } from "lucide-react";

interface WarehouseData {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  pincode: string;
  city: string;
  state: string;
  email: string | null;
  targetPanel: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
}

const PANEL_OPTIONS = [
  { value: "BOTH",    label: "Both Panels (Panel 1 & Panel 2)" },
  { value: "PANEL_1", label: "Panel 1 Only" },
  { value: "PANEL_2", label: "Panel 2 Only" },
];

const PANEL_LABEL: Record<string, string> = {
  BOTH: "Both Panels", PANEL_1: "Panel 1", PANEL_2: "Panel 2",
};

const STATUS_STYLE: Record<string, { color: string; icon: React.ElementType }> = {
  PENDING:  { color: "bg-yellow-50 text-yellow-700", icon: Clock },
  APPROVED: { color: "bg-green-50 text-green-700",  icon: CheckCircle },
  REJECTED: { color: "bg-red-50 text-red-700",      icon: XCircle },
};

const EMPTY_FORM = {
  name: "", contactName: "", phone: "", addressLine1: "",
  addressLine2: "", pincode: "", city: "", state: "", email: "", targetPanel: "BOTH",
};

export function WarehouseTab() {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function fetchWarehouses() {
    try {
      const res = await fetch("/api/supplier/warehouse");
      const data = await res.json();
      setWarehouses(data.warehouses || []);
    } catch { setWarehouses([]); }
    setLoading(false);
  }

  useEffect(() => { fetchWarehouses(); }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/supplier/warehouse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to submit request");
      setSubmitting(false);
      return;
    }

    setShowModal(false);
    setForm(EMPTY_FORM);
    fetchWarehouses();
    setSubmitting(false);
  }

  const approvedWarehouses = warehouses.filter((w) => w.status === "APPROVED");
  const requests = warehouses.filter((w) => w.status !== "APPROVED");

  return (
    <div className="space-y-5">
      {/* My Pickup Warehouses */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">My Pickup Warehouses</h3>
            <p className="text-sm text-blue-500 mt-0.5">Your pickup addresses</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Request Warehouse
          </button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-gray-400 text-sm">Loading...</div>
        ) : approvedWarehouses.length === 0 ? (
          <div className="py-12 flex flex-col items-center text-center">
            <Warehouse className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No warehouse configured</p>
            <p className="text-sm text-gray-400 mt-1">Add your pickup address to enable shipping</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvedWarehouses.map((w) => (
              <div key={w.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-gray-800">{w.name}</p>
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
                </div>
                <p className="text-sm text-gray-600">{w.addressLine1}{w.addressLine2 ? `, ${w.addressLine2}` : ""}</p>
                <p className="text-sm text-gray-600">{w.city}, {w.state} - {w.pincode}</p>
                <p className="text-xs text-gray-400 mt-2">{w.contactName} · {w.phone}</p>
                <p className="text-xs text-gray-400 mt-0.5">Panel: {PANEL_LABEL[w.targetPanel]}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Warehouse Requests */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-0.5">My Warehouse Requests</h3>
        <p className="text-xs text-orange-500 mb-4">
          Shown once you submit a request. Admin reviews per panel.
        </p>

        {requests.length === 0 ? (
          <p className="text-sm text-red-400">No requests yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((w) => {
              const s = STATUS_STYLE[w.status] || STATUS_STYLE.PENDING;
              const Icon = s.icon;
              return (
                <div key={w.id} className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{w.name}</p>
                    <p className="text-xs text-gray-400">{w.city}, {w.state} · {PANEL_LABEL[w.targetPanel]}</p>
                    {w.adminNote && <p className="text-xs text-gray-500 mt-1 italic">{w.adminNote}</p>}
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>
                    <Icon className="w-3 h-3" />
                    {w.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add Your Warehouse</h3>
                <p className="text-sm text-gray-400 mt-0.5">This is where your shipments will be picked up from</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">{error}</div>
              )}

              {/* Warehouse Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Name <span className="text-red-500">*</span></label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="My Warehouse"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              {/* Contact + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name <span className="text-red-500">*</span></label>
                  <input name="contactName" value={form.contactName} onChange={handleChange} required placeholder="Your Name"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                  <input name="phone" value={form.phone} onChange={handleChange} required placeholder="9876543210"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>

              {/* Address Line 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 <span className="text-red-500">*</span></label>
                <input name="addressLine1" value={form.addressLine1} onChange={handleChange} required placeholder="123 Main Street"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              {/* Address Line 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                <input name="addressLine2" value={form.addressLine2} onChange={handleChange} placeholder="Near Landmark"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
              </div>

              {/* Pincode + City */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode <span className="text-red-500">*</span></label>
                  <input name="pincode" value={form.pincode} onChange={handleChange} required placeholder="110001"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                  <input name="city" value={form.city} onChange={handleChange} required placeholder="New Delhi"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>

              {/* State + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State Name</label>
                  <input name="state" value={form.state} onChange={handleChange} placeholder="Delhi"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input name="email" value={form.email} onChange={handleChange} type="email" placeholder="you@example.com"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>

              {/* Target Panel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Panel <span className="text-red-500">*</span></label>
                <select name="targetPanel" value={form.targetPanel} onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                  {PANEL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Select which panel this warehouse is for.</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

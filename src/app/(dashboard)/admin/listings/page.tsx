"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  Search,
  ListChecks,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Package,
  ExternalLink,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface ListingRequest {
  id: string;
  platform: string;
  status: string;
  adminNote: string | null;
  listedUrl: string | null;
  createdAt: string;
  seller: { id: string; name: string; email: string };
  product: { id: string; name: string; sku: string | null; images: string[]; price: number };
}

interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  listed: number;
  failed: number;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-200",
  LISTED: "bg-green-50 text-green-700 border-green-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  LISTED: "Listed",
  FAILED: "Failed",
};

const PLATFORM_COLOR: Record<string, string> = {
  AMAZON: "bg-orange-50 text-orange-700",
  EBAY: "bg-blue-50 text-blue-700",
  ETSY: "bg-pink-50 text-pink-700",
  WALMART: "bg-sky-50 text-sky-700",
  SHOPIFY: "bg-green-50 text-green-700",
};

const PLATFORMS = ["ALL", "AMAZON", "EBAY", "ETSY", "WALMART", "SHOPIFY"];
const STATUSES = ["ALL", "PENDING", "IN_PROGRESS", "LISTED", "FAILED"];

export default function AdminListingsPage() {
  const [listings, setListings] = useState<ListingRequest[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, inProgress: 0, listed: 0, failed: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionModal, setActionModal] = useState<ListingRequest | null>(null);
  const [actionStatus, setActionStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [listedUrl, setListedUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchListings = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (platformFilter !== "ALL") params.set("platform", platformFilter);
      const res = await fetch(`/api/admin/listings?${params}`);
      const data = await res.json();
      setListings(data.listings ?? []);
      if (data.stats) setStats(data.stats);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, statusFilter, platformFilter]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  function openModal(listing: ListingRequest) {
    setActionModal(listing);
    setActionStatus(listing.status);
    setAdminNote(listing.adminNote ?? "");
    setListedUrl(listing.listedUrl ?? "");
  }

  async function handleUpdate() {
    if (!actionModal) return;
    setSubmitting(true);
    const res = await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: actionModal.id,
        status: actionStatus,
        adminNote,
        listedUrl,
      }),
    });
    if (res.ok) {
      setActionModal(null);
      fetchListings(true);
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Listing Requests"
        subtitle="Manage marketplace listing requests from sellers"
        searchValue={search}
        searchPlaceholder="Search seller, product..."
        onSearchChange={setSearch}
        onSearchSubmit={() => fetchListings()}
        actions={
          <button onClick={() => fetchListings(true)} disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
            style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
        filters={
          <div className="flex items-center gap-2">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl text-white outline-none"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
              {STATUSES.map((s) => <option key={s} value={s} className="text-gray-900 bg-white">{s === "ALL" ? "All Statuses" : STATUS_LABEL[s]}</option>)}
            </select>
            <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl text-white outline-none"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
              {PLATFORMS.map((p) => <option key={p} value={p} className="text-gray-900 bg-white">{p === "ALL" ? "All Platforms" : p}</option>)}
            </select>
          </div>
        }
        cards={
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: "Total",       value: stats.total,      icon: ListChecks,  color: "#7C3AED" },
              { label: "Pending",     value: stats.pending,    icon: Clock,       color: "#F59E0B" },
              { label: "In Progress", value: stats.inProgress, icon: Loader2,     color: "#3B82F6" },
              { label: "Listed",      value: stats.listed,     icon: CheckCircle, color: "#00C67A" },
              { label: "Failed",      value: stats.failed,     icon: XCircle,     color: "#EF4444" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl px-4 py-4 flex items-center gap-3"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.1)" }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
                  <p className="text-xl font-bold text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
        }
      />

      <div className="px-8 py-6">
      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-semibold text-sm" style={{ color: "var(--text-900)" }}>
            Listing Requests ({listings.length})
          </h2>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
        ) : listings.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <ListChecks className="w-12 h-12 text-gray-200 mx-auto" />
            <p className="text-sm text-gray-400">No listing requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {["Product", "Seller", "Platform", "Status", "Requested", "Actions"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                    {/* Product */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                          {listing.product.images?.[0] ? (
                            <img src={listing.product.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-gray-300 m-auto mt-2.5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 max-w-[160px] truncate">
                            {listing.product.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {listing.product.sku ?? "—"} · ₹{listing.product.price}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Seller */}
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-800">{listing.seller.name}</p>
                      <p className="text-xs text-gray-400">{listing.seller.email}</p>
                    </td>

                    {/* Platform */}
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PLATFORM_COLOR[listing.platform] ?? "bg-gray-100 text-gray-600"}`}>
                        {listing.platform}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLOR[listing.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABEL[listing.status] ?? listing.status}
                      </span>
                      {listing.listedUrl && (
                        <a
                          href={listing.listedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-500 hover:underline mt-1"
                        >
                          <ExternalLink className="w-3 h-3" /> View listing
                        </a>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(listing.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3">
                      <button
                        onClick={() => openModal(listing)}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Update Listing Request</h3>
            <p className="text-sm text-gray-400 mb-5">
              {actionModal.product.name} · {actionModal.platform} ·{" "}
              <span className="font-medium text-gray-600">{actionModal.seller.name}</span>
            </p>

            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["PENDING", "IN_PROGRESS", "LISTED", "FAILED"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setActionStatus(s)}
                      className={`py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                        actionStatus === s
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Listed URL (show when LISTED) */}
              {actionStatus === "LISTED" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Live Listing URL
                  </label>
                  <input
                    type="url"
                    value={listedUrl}
                    onChange={(e) => setListedUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              )}

              {/* Admin Note */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Note to Seller <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                  placeholder="Add a note for the seller..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setActionModal(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={submitting}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

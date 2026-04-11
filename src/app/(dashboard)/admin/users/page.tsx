"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Trash2, RefreshCw, Users, Store, Package, Eye, EyeOff } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string | null;
  createdAt: string;
}

const ROLE_COLOR: Record<string, string> = {
  SELLER: "bg-blue-50 text-blue-700 border-blue-200",
  SUPPLIER: "bg-green-50 text-green-700 border-green-200",
};

const PLAN_COLOR: Record<string, string> = {
  DROPSHIPPING: "bg-indigo-50 text-indigo-700",
  MARKETPLACE: "bg-purple-50 text-purple-700",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "SELLER",
    plan: "DROPSHIPPING",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users ?? []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (form.password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        plan: form.role === "SELLER" ? form.plan : null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFormError(data.error || "Something went wrong");
      setSubmitting(false);
      return;
    }
    setShowModal(false);
    setForm({ name: "", email: "", password: "", role: "SELLER", plan: "DROPSHIPPING" });
    fetchUsers(true);
    setSubmitting(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    setDeleting(id);
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeleting(null);
    fetchUsers(true);
  }

  const sellers = users.filter((u) => u.role === "SELLER").length;
  const suppliers = users.filter((u) => u.role === "SUPPLIER").length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="User Management"
        subtitle="Create and manage sellers & suppliers"
        searchValue={search}
        searchPlaceholder="Search by name or email..."
        onSearchChange={setSearch}
        onSearchSubmit={() => fetchUsers()}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => fetchUsers(true)} disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "var(--green-500)" }}>
              <Plus className="w-4 h-4" /> Create User
            </button>
          </div>
        }
        filters={
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl text-white outline-none"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <option value="ALL" className="text-gray-900 bg-white">All Roles</option>
            <option value="SELLER" className="text-gray-900 bg-white">Sellers</option>
            <option value="SUPPLIER" className="text-gray-900 bg-white">Suppliers</option>
          </select>
        }
        cards={
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Users", value: users.length, icon: Users,   color: "#7C3AED" },
              { label: "Sellers",     value: sellers,      icon: Store,   color: "#3B82F6" },
              { label: "Suppliers",   value: suppliers,    icon: Package, color: "#00C67A" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl px-5 py-4"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        }
      />

      <div className="px-8 py-6">
      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="font-semibold text-sm" style={{ color: "var(--text-900)" }}>Users ({users.length})</h2>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400 text-sm">Loading...</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Users className="w-12 h-12 text-gray-200 mx-auto" />
            <p className="text-sm text-gray-400">No users found. Create one to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Name", "Email", "Role", "Plan", "Created", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
                        {user.name?.[0]?.toUpperCase() ?? "U"}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{user.email}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${ROLE_COLOR[user.role] ?? "bg-gray-100 text-gray-600"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {user.plan ? (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PLAN_COLOR[user.plan] ?? "bg-gray-100 text-gray-600"}`}>
                        {user.plan}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {new Date(user.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={deleting === user.id}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Create New User</h3>
            <p className="text-sm text-gray-400 mb-5">Add a new seller or supplier to the platform</p>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-lg mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {["SELLER", "SUPPLIER"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm({ ...form, role: r })}
                      className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                        form.role === r
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plan — only for sellers */}
              {form.role === "SELLER" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Plan</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["DROPSHIPPING", "MARKETPLACE"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm({ ...form, plan: p })}
                        className={`py-2.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                          form.plan === p
                            ? "border-purple-500 bg-purple-50 text-purple-700"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setFormError(""); }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Package, CheckCircle, Clock, XCircle,
  Plus, ArrowRight, AlertCircle, User, Layers,
} from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

export default async function SupplierDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [totalProducts, pendingProducts, approvedProducts, rejectedProducts, listedCount] =
    await Promise.all([
      prisma.product.count({ where: { supplierId: session.user.id } }),
      prisma.product.count({ where: { supplierId: session.user.id, status: "PENDING" } }),
      prisma.product.count({ where: { supplierId: session.user.id, status: "APPROVED" } }),
      prisma.product.count({ where: { supplierId: session.user.id, status: "REJECTED" } }),
      prisma.listingRequest.count({
        where: { product: { supplierId: session.user.id }, status: "LISTED" },
      }),
    ]);

  const recentProducts = await prisma.product.findMany({
    where: { supplierId: session.user.id },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  const rejectedWithNotes = recentProducts.filter(p => p.status === "REJECTED" && p.adminNote);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title={`Welcome back, ${session.user.name?.split(" ")[0] || "Supplier"}`}
        subtitle="Overview of your products and listings"
        actions={
          <Link
            href="/supplier/products/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "var(--green-500)" }}
          >
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        }
        cards={
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Products", value: totalProducts,   icon: Package,     color: "#3B82F6" },
              { label: "Pending Review", value: pendingProducts,  icon: Clock,       color: "#F59E0B" },
              { label: "Approved",       value: approvedProducts, icon: CheckCircle, color: "#00C67A" },
              { label: "Rejected",       value: rejectedProducts, icon: XCircle,     color: "#EF4444" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl px-5 py-4 flex items-center gap-4"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.1)" }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</p>
                  <p className="text-2xl font-bold text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
        }
      />

      <div className="px-4 md:px-8 pt-6 space-y-6">

        {/* Rejection alert */}
        {rejectedWithNotes.length > 0 && (
          <div className="flex items-start gap-3 px-5 py-4 rounded-2xl"
            style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700">
                {rejectedWithNotes.length} product{rejectedWithNotes.length > 1 ? "s" : ""} rejected — review admin feedback
              </p>
              <ul className="mt-1.5 space-y-1">
                {rejectedWithNotes.slice(0, 3).map(p => (
                  <li key={p.id} className="text-xs text-red-600">
                    <span className="font-medium">{p.name}:</span> {p.adminNote}
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/supplier/products"
              className="flex-shrink-0 text-xs font-semibold text-red-600 underline">
              View all
            </Link>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4" style={{ color: "var(--green-500)" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Add New Product",  sub: "Submit a product for review",        href: "/supplier/products/new", icon: Plus,    bg: "#F0FDF4", text: "#16A34A" },
              { label: "My Products",      sub: `${totalProducts} total · ${approvedProducts} approved`, href: "/supplier/products", icon: Package, bg: "#EFF6FF", text: "#3B82F6" },
              { label: "Listed on Platform", sub: `${listedCount} product${listedCount !== 1 ? "s" : ""} live`, href: "/supplier/profile", icon: User, bg: "#F5F3FF", text: "#7C3AED" },
            ].map(({ label, sub, href, icon: Icon, bg, text }) => (
              <Link key={href} href={href}
                className="card flex items-center gap-4 px-5 py-4 hover:shadow-md transition-shadow group">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: bg }}>
                  <Icon className="w-5 h-5" style={{ color: text }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>{label}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-400)" }}>{sub}</p>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-400)" }} />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent products */}
        <div className="card overflow-hidden pb-6">
          <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" style={{ color: "var(--text-400)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Recent Products</h2>
            </div>
            <Link href="/supplier/products" className="flex items-center gap-1 text-xs font-medium"
              style={{ color: "var(--green-500)" }}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentProducts.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <Package className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm" style={{ color: "var(--text-400)" }}>No products yet</p>
              <Link href="/supplier/products/new"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: "var(--green-500)" }}>
                Add Your First Product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "#FAFAFA" }}>
                  {["Product", "SKU", "Price", "Category", "Status", "Added"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      style={{ color: "var(--text-400)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {recentProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-sm" style={{ color: "var(--text-900)" }}>{p.name}</p>
                      {p.status === "REJECTED" && p.adminNote ? (
                        <p className="text-xs mt-0.5 text-red-500">{p.adminNote}</p>
                      ) : (
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-400)" }}>{p.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs" style={{ color: "var(--text-600)" }}>{p.sku || "—"}</td>
                    <td className="px-5 py-3.5 font-semibold text-sm" style={{ color: "var(--text-900)" }}>₹{p.price.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-600)" }}>{p.category || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: p.status === "APPROVED" ? "#F0FDF4" : p.status === "REJECTED" ? "#FEF2F2" : "#FFF7ED",
                          color:      p.status === "APPROVED" ? "#16A34A" : p.status === "REJECTED" ? "#DC2626" : "#D97706",
                        }}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-400)" }}>
                      {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>

      </div>
    </div>
  );
}

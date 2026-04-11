import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Package, CheckCircle, Clock, XCircle, Plus, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

export default async function SupplierDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [totalProducts, pendingProducts, approvedProducts, rejectedProducts] =
    await Promise.all([
      prisma.product.count({ where: { supplierId: session.user.id } }),
      prisma.product.count({ where: { supplierId: session.user.id, status: "PENDING" } }),
      prisma.product.count({ where: { supplierId: session.user.id, status: "APPROVED" } }),
      prisma.product.count({ where: { supplierId: session.user.id, status: "REJECTED" } }),
    ]);

  const recentProducts = await prisma.product.findMany({
    where: { supplierId: session.user.id },
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  const statCards = [
    { label: "Total Products", value: totalProducts,   icon: Package,      color: "#3B82F6" },
    { label: "Pending Review", value: pendingProducts,  icon: Clock,        color: "#F59E0B" },
    { label: "Approved",       value: approvedProducts, icon: CheckCircle,  color: "#00C67A" },
    { label: "Rejected",       value: rejectedProducts, icon: XCircle,      color: "#EF4444" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="Supplier Dashboard"
        subtitle="Overview of your products and performance"
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
          <div className="grid grid-cols-4 gap-4">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="rounded-2xl px-5 py-4"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {label}
                  </p>
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
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-900)" }}>Recent Products</h2>
            <Link
              href="/supplier/products"
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: "var(--green-500)" }}
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentProducts.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <Package className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm" style={{ color: "var(--text-400)" }}>No products yet</p>
              <Link
                href="/supplier/products/new"
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: "var(--green-500)" }}
              >
                Add Your First Product
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "#FAFAFA" }}>
                  {["Product", "SKU", "Price", "Category", "Status", "Date"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-400)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {recentProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-sm" style={{ color: "var(--text-900)" }}>{p.name}</p>
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-400)" }}>{p.description}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs" style={{ color: "var(--text-600)" }}>{p.sku || "—"}</td>
                    <td className="px-5 py-3.5 font-semibold text-sm" style={{ color: "var(--text-900)" }}>₹{p.price.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-600)" }}>{p.category || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: p.status === "APPROVED" ? "#F0FDF4" : p.status === "REJECTED" ? "#FEF2F2" : "#FFF7ED",
                          color:      p.status === "APPROVED" ? "#00C67A" : p.status === "REJECTED" ? "#EF4444" : "#F59E0B",
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-400)" }}>
                      {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

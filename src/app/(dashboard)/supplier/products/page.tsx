import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Package, Clock, CheckCircle, XCircle } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";

export default async function MyProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const products = await prisma.product.findMany({
    where: { supplierId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const counts = {
    total:    products.length,
    pending:  products.filter((p) => p.status === "PENDING").length,
    approved: products.filter((p) => p.status === "APPROVED").length,
    rejected: products.filter((p) => p.status === "REJECTED").length,
  };

  const statCards = [
    { label: "Total",    value: counts.total,    icon: Package,     color: "#3B82F6" },
    { label: "Pending",  value: counts.pending,  icon: Clock,       color: "#F59E0B" },
    { label: "Approved", value: counts.approved, icon: CheckCircle, color: "#00C67A" },
    { label: "Rejected", value: counts.rejected, icon: XCircle,     color: "#EF4444" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>
      <PageHero
        title="My Products"
        subtitle="Manage your submitted products"
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

      <div className="px-4 md:px-8 py-6">
        <div className="card overflow-hidden">
          {products.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <Package className="w-10 h-10" style={{ color: "var(--border)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text-400)" }}>No products yet</p>
              <p className="text-xs" style={{ color: "var(--text-400)" }}>Start by listing your first product</p>
              <Link
                href="/supplier/products/new"
                className="mt-1 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: "var(--green-500)" }}
              >
                Add Product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
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
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium" style={{ color: "var(--text-900)" }}>{p.name}</p>
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-400)" }}>{p.description}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs" style={{ color: "var(--text-600)" }}>{p.sku || "—"}</td>
                    <td className="px-5 py-3.5 font-semibold" style={{ color: "var(--text-900)" }}>₹{p.price.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-600)" }}>{p.category || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background: p.status === "APPROVED" ? "#F0FDF4" : p.status === "REJECTED" ? "#FEF2F2" : "#FFF7ED",
                          color:      p.status === "APPROVED" ? "#00C67A" : p.status === "REJECTED" ? "#EF4444" : "#F59E0B",
                        }}
                      >
                        {p.status === "APPROVED" && <CheckCircle className="w-3 h-3" />}
                        {p.status === "REJECTED" && <XCircle className="w-3 h-3" />}
                        {p.status === "PENDING"  && <Clock className="w-3 h-3" />}
                        {p.status}
                      </span>
                      {p.adminNote && (
                        <p className="text-xs mt-1 italic" style={{ color: "var(--text-400)" }}>{p.adminNote}</p>
                      )}
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

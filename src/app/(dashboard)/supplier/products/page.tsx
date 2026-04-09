import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Package, Clock, CheckCircle, XCircle } from "lucide-react";

export default async function MyProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const products = await prisma.product.findMany({
    where: { supplierId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const counts = {
    total: products.length,
    pending: products.filter((p) => p.status === "PENDING").length,
    approved: products.filter((p) => p.status === "APPROVED").length,
    rejected: products.filter((p) => p.status === "REJECTED").length,
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your submitted products</p>
        </div>
        <Link
          href="/supplier/products/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> List New Product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: counts.total, icon: Package, color: "text-blue-600 bg-blue-50" },
          { label: "Pending", value: counts.pending, icon: Clock, color: "text-yellow-600 bg-yellow-50" },
          { label: "Approved", value: counts.approved, icon: CheckCircle, color: "text-green-600 bg-green-50" },
          { label: "Rejected", value: counts.rejected, icon: XCircle, color: "text-red-600 bg-red-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-100">
        {products.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No products yet</p>
            <p className="text-gray-400 text-sm mt-1">Start by listing your first product</p>
            <Link
              href="/supplier/products/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> List Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Product</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">SKU</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Price</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">{product.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{product.description}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600 font-mono text-xs">{product.sku}</td>
                    <td className="px-5 py-4 text-gray-800 font-semibold">₹{product.price.toLocaleString()}</td>
                    <td className="px-5 py-4 text-gray-500">{product.category || "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        product.status === "APPROVED" ? "bg-green-50 text-green-700" :
                        product.status === "REJECTED" ? "bg-red-50 text-red-700" :
                        "bg-yellow-50 text-yellow-700"
                      }`}>
                        {product.status === "APPROVED" && <CheckCircle className="w-3 h-3" />}
                        {product.status === "REJECTED" && <XCircle className="w-3 h-3" />}
                        {product.status === "PENDING" && <Clock className="w-3 h-3" />}
                        {product.status}
                      </span>
                      {product.adminNote && (
                        <p className="text-xs text-gray-400 mt-1 italic">{product.adminNote}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {new Date(product.createdAt).toLocaleDateString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

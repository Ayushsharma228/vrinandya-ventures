import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/layout/topbar";
import { Package, CheckCircle, Clock, XCircle, TrendingUp } from "lucide-react";

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

  const stats = [
    { label: "Total Products", value: totalProducts, icon: Package, color: "bg-blue-500" },
    { label: "Pending Review", value: pendingProducts, icon: Clock, color: "bg-yellow-500" },
    { label: "Approved", value: approvedProducts, icon: CheckCircle, color: "bg-green-500" },
    { label: "Rejected", value: rejectedProducts, icon: XCircle, color: "bg-red-500" },
  ];

  const recentProducts = await prisma.product.findMany({
    where: { supplierId: session.user.id },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <Topbar title="Supplier Dashboard" />
      <div className="p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <a
              href="/supplier/products/new"
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              + Add New Product
            </a>
            <a
              href="/supplier/products"
              className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              View All Products
            </a>
          </div>
        </div>

        {/* Recent Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Recent Products</h3>
            <a href="/supplier/products" className="text-sm text-purple-600 hover:underline">View all</a>
          </div>
          <div className="divide-y divide-gray-50">
            {recentProducts.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-medium">No products yet</p>
                <p className="text-xs text-gray-400 mt-1">Start by adding your first product</p>
                <a
                  href="/supplier/products/new"
                  className="mt-4 inline-block px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add Product
                </a>
              </div>
            ) : (
              recentProducts.map((product) => (
                <div key={product.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{product.name}</p>
                    <p className="text-xs text-gray-400">₹{product.price} · SKU: {product.sku || "N/A"}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    product.status === "APPROVED" ? "bg-green-100 text-green-700" :
                    product.status === "REJECTED" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {product.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

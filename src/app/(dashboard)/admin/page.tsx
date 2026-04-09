import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Topbar } from "@/components/layout/topbar";
import {
  Package,
  Users,
  ShoppingCart,
  ListChecks,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [
    totalProducts,
    pendingProducts,
    approvedProducts,
    totalSellers,
    totalSuppliers,
    totalOrders,
    pendingListings,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "PENDING" } }),
    prisma.product.count({ where: { status: "APPROVED" } }),
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.user.count({ where: { role: "SUPPLIER" } }),
    prisma.order.count(),
    prisma.listingRequest.count({ where: { status: "PENDING" } }),
  ]);

  const stats = [
    { label: "Total Products", value: totalProducts, icon: Package, color: "bg-blue-500" },
    { label: "Pending Approval", value: pendingProducts, icon: Clock, color: "bg-yellow-500" },
    { label: "Approved Products", value: approvedProducts, icon: CheckCircle, color: "bg-green-500" },
    { label: "Total Sellers", value: totalSellers, icon: Users, color: "bg-purple-500" },
    { label: "Total Suppliers", value: totalSuppliers, icon: Users, color: "bg-indigo-500" },
    { label: "Total Orders", value: totalOrders, icon: ShoppingCart, color: "bg-pink-500" },
    { label: "Pending Listings", value: pendingListings, icon: ListChecks, color: "bg-orange-500" },
  ];

  const recentProducts = await prisma.product.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { supplier: { select: { name: true } } },
  });

  const recentListings = await prisma.listingRequest.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      seller: { select: { name: true } },
      product: { select: { name: true } },
    },
  });

  return (
    <div>
      <Topbar title="Admin Dashboard" />
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Products */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Recent Product Submissions</h3>
              <a href="/admin/products" className="text-sm text-purple-600 hover:underline">View all</a>
            </div>
            <div className="divide-y divide-gray-50">
              {recentProducts.length === 0 ? (
                <p className="p-5 text-sm text-gray-400">No products yet</p>
              ) : (
                recentProducts.map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{p.name}</p>
                      <p className="text-xs text-gray-400">by {p.supplier.name}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.status === "APPROVED" ? "bg-green-100 text-green-700" :
                      p.status === "REJECTED" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Listing Requests */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Listing Requests</h3>
              <a href="/admin/listings" className="text-sm text-purple-600 hover:underline">View all</a>
            </div>
            <div className="divide-y divide-gray-50">
              {recentListings.length === 0 ? (
                <p className="p-5 text-sm text-gray-400">No listing requests yet</p>
              ) : (
                recentListings.map((l) => (
                  <div key={l.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{l.product.name}</p>
                      <p className="text-xs text-gray-400">{l.seller.name} → {l.platform}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      l.status === "LISTED" ? "bg-green-100 text-green-700" :
                      l.status === "FAILED" ? "bg-red-100 text-red-700" :
                      l.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {l.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

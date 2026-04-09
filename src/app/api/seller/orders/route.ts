import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SELLER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const search = searchParams.get("search");
    const productFilter = searchParams.get("product");

    const orders = await prisma.order.findMany({
      where: {
        sellerId: session.user.id,
        ...(from && to ? { createdAt: { gte: new Date(from), lte: new Date(to) } } : {}),
        ...(search ? {
          OR: [
            { externalOrderId: { contains: search, mode: "insensitive" } },
            { customerName: { contains: search, mode: "insensitive" } },
            { customerEmail: { contains: search, mode: "insensitive" } },
          ],
        } : {}),
        ...(productFilter ? { items: { some: { name: { contains: productFilter, mode: "insensitive" } } } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    const totalItems = orders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0);

    // Top product by quantity
    const productCounts: Record<string, number> = {};
    orders.forEach((o) => o.items.forEach((i) => {
      productCounts[i.name] = (productCounts[i.name] || 0) + i.quantity;
    }));
    const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    return NextResponse.json({ orders, stats: { totalOrders: orders.length, totalRevenue, totalItems, topProduct } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

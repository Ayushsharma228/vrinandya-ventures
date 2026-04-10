import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const sellerId = searchParams.get("sellerId") ?? "";

  const orders = await prisma.order.findMany({
    where: {
      ...(sellerId ? { sellerId } : {}),
      ...(status ? { status: status as never } : {}),
      ...(search ? {
        OR: [
          { externalOrderId: { contains: search, mode: "insensitive" } },
          { customerName: { contains: search, mode: "insensitive" } },
          { awbNumber: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      seller: { select: { name: true, email: true } },
      items: { select: { name: true, quantity: true } },
    },
  });

  return NextResponse.json({ orders });
}

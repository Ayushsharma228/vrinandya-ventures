import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search   = searchParams.get("search") ?? "";
  const status   = searchParams.get("status") ?? "";
  const sellerId = searchParams.get("sellerId") ?? "";

  const orders = await prisma.order.findMany({
    where: {
      ...(sellerId ? { sellerId } : {}),
      ...(status ? { status: status as never } : {}),
      ...(search ? {
        OR: [
          { externalOrderId: { contains: search, mode: "insensitive" } },
          { customerName:    { contains: search, mode: "insensitive" } },
          { awbNumber:       { contains: search, mode: "insensitive" } },
          { items: { some: { name: { contains: search, mode: "insensitive" } } } },
        ],
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      seller: { select: { name: true, email: true } },
      items:  { select: { name: true, quantity: true } },
    },
  });

  return NextResponse.json({ orders });
}

// PATCH — bulk date update
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderIds, orderDate } = await req.json() as { orderIds: string[]; orderDate: string };
  if (!orderIds?.length) return NextResponse.json({ error: "No order IDs provided" }, { status: 400 });
  if (!orderDate) return NextResponse.json({ error: "orderDate required" }, { status: 400 });

  const { count } = await prisma.order.updateMany({
    where: { id: { in: orderIds } },
    data: { createdAt: new Date(orderDate) },
  });
  return NextResponse.json({ updated: count });
}

// DELETE — single or bulk
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderIds } = await req.json() as { orderIds: string[] };
  if (!orderIds?.length) return NextResponse.json({ error: "No order IDs provided" }, { status: 400 });

  const { count } = await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  return NextResponse.json({ deleted: count });
}

// POST — manually create an order
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    sellerId, externalOrderId, customerName, customerPhone,
    customerAddress, totalAmount, status, items, orderDate,
  } = body;

  if (!sellerId || !externalOrderId || !totalAmount) {
    return NextResponse.json({ error: "sellerId, externalOrderId and totalAmount are required" }, { status: 400 });
  }

  try {
    const order = await prisma.order.create({
      data: {
        sellerId,
        externalOrderId,
        source: "OTHER",
        status: (status || "NEW") as never,
        customerName: customerName || null,
        customerAddress: customerPhone
          ? { phone: customerPhone, address: customerAddress || "" }
          : customerAddress
            ? { address: customerAddress }
            : Prisma.JsonNull,
        totalAmount: parseFloat(totalAmount),
        createdAt: orderDate ? new Date(orderDate) : new Date(),
        items: {
          create: (items ?? []).map((item: { name: string; quantity: number; price: number }) => ({
            name:     item.name,
            quantity: Number(item.quantity) || 1,
            price:    Number(item.price)    || 0,
          })),
        },
      },
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error("Manual order creation error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

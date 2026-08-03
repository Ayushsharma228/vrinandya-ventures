import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sellerId = session.user.id;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      seller:   { select: { id: true } },
      items:    { select: { id: true, name: true, quantity: true, price: true } },
      timeline: {
        orderBy: { createdAt: "asc" },
        select:  { id: true, event: true, details: true, actorRole: true, createdAt: true },
      },
    },
  });

  if (!order || order.seller.id !== sellerId)
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Identify customer by email (preferred) or phone (fallback)
  const orderPhone = (order.customerAddress as Record<string, string> | null)?.phone?.replace(/\s+/g, "") ?? null;

  const [settlement, allCustomerOrders] = await Promise.all([
    prisma.settlement.findUnique({
      where: { orderId: id },
      select: {
        id: true, status: true,
        sellingPrice: true, platformFee: true, gstOnFees: true,
        netPayable: true, shippingCharge: true, packingCharge: true,
        codFee: true, rtoCharge: true, adSpend: true,
        createdAt: true,
      },
    }),
    order.customerEmail
      ? prisma.order.findMany({
          where: { sellerId, customerEmail: order.customerEmail, id: { not: id } },
          orderBy: { createdAt: "desc" },
          select: {
            id: true, externalOrderId: true, status: true,
            totalAmount: true, createdAt: true, customerAddress: true,
            items: { select: { name: true, quantity: true }, take: 1 },
          },
        })
      : orderPhone
        ? prisma.order.findMany({
            where: { sellerId, customerEmail: null, id: { not: id } },
            orderBy: { createdAt: "desc" },
            select: {
              id: true, externalOrderId: true, status: true,
              totalAmount: true, createdAt: true, customerAddress: true,
              items: { select: { name: true, quantity: true }, take: 1 },
            },
          })
        : Promise.resolve([]),
  ]);

  // Filter by phone if we used phone-based lookup, then cap at 5
  const customerHistory = (order.customerEmail
    ? allCustomerOrders
    : allCustomerOrders.filter((o) => {
        const p = (o.customerAddress as Record<string, string> | null)?.phone?.replace(/\s+/g, "");
        return p === orderPhone;
      })
  ).slice(0, 5);

  const customerOrderCount = customerHistory.length + 1;

  return NextResponse.json({ order, settlement, customerHistory, customerOrderCount });
}

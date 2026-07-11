import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SUPPLIER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.inventoryItem.findMany({
    where: { supplierId: session.user.id },
    include: {
      product: {
        select: { id: true, name: true, sku: true, category: true, images: true, status: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SUPPLIER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId, availableQty, incomingQty, lowStockThreshold } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  // Verify supplier owns this product
  const product = await prisma.product.findFirst({
    where: { id: productId, supplierId: session.user.id },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const item = await prisma.inventoryItem.upsert({
    where: { productId },
    create: {
      productId,
      supplierId: session.user.id,
      availableQty: availableQty ?? 0,
      incomingQty: incomingQty ?? 0,
      lowStockThreshold: lowStockThreshold ?? 5,
    },
    update: {
      availableQty: availableQty ?? undefined,
      incomingQty: incomingQty ?? undefined,
      lowStockThreshold: lowStockThreshold ?? undefined,
    },
    include: { product: { select: { name: true, sku: true } } },
  });

  // Keep product.stock in sync
  await prisma.product.update({
    where: { id: productId },
    data: { stock: item.availableQty },
  });

  return NextResponse.json({ item });
}

export async function PATCH(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SUPPLIER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId, availableQty, incomingQty, lowStockThreshold } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const existing = await prisma.inventoryItem.findFirst({
    where: { productId, supplierId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Inventory record not found" }, { status: 404 });

  const updated = await prisma.inventoryItem.update({
    where: { productId },
    data: {
      ...(availableQty !== undefined && { availableQty }),
      ...(incomingQty !== undefined && { incomingQty }),
      ...(lowStockThreshold !== undefined && { lowStockThreshold }),
    },
    include: { product: { select: { name: true, sku: true } } },
  });

  await prisma.product.update({
    where: { id: productId },
    data: { stock: updated.availableQty },
  });

  return NextResponse.json({ item: updated });
}

import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page       = Math.max(1, parseInt(searchParams.get("page")       ?? "1"));
  const limit      = Math.min(100, parseInt(searchParams.get("limit")    ?? "50"));
  const supplierId = searchParams.get("supplierId") ?? "";
  const lowStock   = searchParams.get("lowStock")   === "1";

  const where = {
    ...(supplierId ? { supplierId } : {}),
    ...(lowStock   ? { availableQty: { lte: prisma.inventoryItem.fields.lowStockThreshold } } : {}),
  };

  // Can't use field reference in Prisma filter directly — use raw comparison
  const whereClean = {
    ...(supplierId ? { supplierId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: supplierId ? { supplierId } : {},
      orderBy: { updatedAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        product:  { select: { id: true, name: true, sku: true, category: true, images: true, status: true } },
        supplier: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.inventoryItem.count({ where: supplierId ? { supplierId } : {} }),
  ]);

  // Flag low stock client-side info
  const enriched = items.map(item => ({
    ...item,
    isLowStock: item.availableQty <= item.lowStockThreshold,
  }));

  const lowStockCount = enriched.filter(i => i.isLowStock).length;

  return NextResponse.json({
    items: lowStock ? enriched.filter(i => i.isLowStock) : enriched,
    total: lowStock ? lowStockCount : total,
    page,
    pages: Math.ceil((lowStock ? lowStockCount : total) / limit),
    lowStockCount,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { itemId, availableQty, reservedQty, incomingQty, lowStockThreshold } = await req.json() as {
    itemId: string;
    availableQty?: number;
    reservedQty?: number;
    incomingQty?: number;
    lowStockThreshold?: number;
  };

  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });

  const updated = await prisma.inventoryItem.update({
    where: { id: itemId },
    data: {
      ...(availableQty       !== undefined ? { availableQty }       : {}),
      ...(reservedQty        !== undefined ? { reservedQty }        : {}),
      ...(incomingQty        !== undefined ? { incomingQty }        : {}),
      ...(lowStockThreshold  !== undefined ? { lowStockThreshold }  : {}),
    },
  });

  return NextResponse.json({ item: updated });
}

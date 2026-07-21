import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Prefer products that have at least one image and a suggestedPrice (MRP)
    const products = await prisma.product.findMany({
      where: { status: "APPROVED" },
      orderBy: [
        { suggestedPrice: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      take: 6,
      select: {
        id:             true,
        name:           true,
        images:         true,
        price:          true,   // what supplier charges us = dropshipper cost
        suggestedPrice: true,   // MRP = what dropshipper can sell at
        category:       true,
      },
    });

    const shaped = products.map((p) => ({
      id:           p.id,
      name:         p.name,
      image:        p.images?.[0] ?? null,
      sellingPrice: p.suggestedPrice ?? Math.round(p.price * 2.5),
      supplierCost: p.price,
      category:     p.category,
    }));

    return NextResponse.json({ products: shaped });
  } catch {
    return NextResponse.json({ products: [] });
  }
}

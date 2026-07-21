import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit    = parseInt(searchParams.get("limit") ?? "6");
    const search   = searchParams.get("search")   ?? "";
    const category = searchParams.get("category") ?? "";

    const products = await prisma.product.findMany({
      where: {
        status: "APPROVED",
        ...(search   ? { name: { contains: search, mode: "insensitive" } } : {}),
        ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
      },
      orderBy: [
        { suggestedPrice: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      ...(limit > 0 ? { take: limit } : {}),
      select: {
        id:             true,
        name:           true,
        images:         true,
        price:          true,
        suggestedPrice: true,
        category:       true,
      },
    });

    const shaped = products.map((p) => ({
      id:           p.id,
      name:         p.name,
      image:        p.images?.[0] ?? null,
      sellingPrice: p.suggestedPrice ?? Math.round(p.price * 2.5),
      supplierCost: p.price,
      category:     p.category ?? null,
    }));

    // Return unique categories for filter chips (only on full fetch)
    const categories = limit === 0
      ? [...new Set(shaped.map((p) => p.category).filter(Boolean) as string[])]
      : [];

    return NextResponse.json({ products: shaped, categories });
  } catch {
    return NextResponse.json({ products: [], categories: [] });
  }
}

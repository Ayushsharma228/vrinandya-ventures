import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ stores: [] });

  const users = await prisma.user.findMany({
    where: {
      role: "SELLER",
      accountStatus: "ACTIVE",
      OR: [
        { brandName:    { contains: q, mode: "insensitive" } },
        { businessName: { contains: q, mode: "insensitive" } },
        { name:         { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, brandName: true, businessName: true, name: true },
    take: 6,
  });

  return NextResponse.json({
    stores: users.map((u) => ({
      id:   u.id,
      name: u.brandName ?? u.businessName ?? u.name ?? "Unknown Store",
    })),
  });
}

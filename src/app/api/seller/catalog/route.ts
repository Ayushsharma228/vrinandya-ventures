import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getRouteSession(req);
    if (!session || session.user.role !== "SELLER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      include: { supplier: { select: { name: true } } },
    });

    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

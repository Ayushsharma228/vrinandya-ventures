import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ensureSellerActivation, updateActivation } from "@/lib/activation/engine";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sellerId = session.user.id;
  await ensureSellerActivation(sellerId);

  const [activation, timeline] = await Promise.all([
    prisma.sellerActivation.findUnique({ where: { sellerId } }),
    prisma.sellerTimeline.findMany({
      where:   { activation: { sellerId } },
      orderBy: { createdAt: "asc" },
      take:    30,
    }),
  ]);

  return NextResponse.json({ activation, timeline });
}

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSellerActivation(session.user.id);
  await updateActivation(session.user.id);

  const activation = await prisma.sellerActivation.findUnique({ where: { sellerId: session.user.id } });
  return NextResponse.json({ activation });
}

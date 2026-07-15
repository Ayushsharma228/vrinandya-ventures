import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status") ?? "PENDING";

  const requests = await prisma.withdrawalRequest.findMany({
    where:   { status: status as never },
    include: { seller: { select: { id: true, name: true, email: true, brandName: true } } },
    orderBy: { createdAt: "desc" },
  });

  const counts = await prisma.withdrawalRequest.groupBy({
    by:     ["status"],
    _count: { id: true },
  });

  return NextResponse.json({ requests, counts });
}

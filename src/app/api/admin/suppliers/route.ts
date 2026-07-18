import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suppliers = await prisma.user.findMany({
    where: { role: "SUPPLIER" },
    select: { id: true, name: true, email: true, phone: true, businessName: true, accountStatus: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ suppliers });
}

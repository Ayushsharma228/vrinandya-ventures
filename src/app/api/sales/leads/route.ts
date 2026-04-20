import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest)(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SALES") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const stage  = searchParams.get("stage") || undefined;
  const search = searchParams.get("search") || undefined;
  const ni     = searchParams.get("ni") === "true";

  const leads = await prisma.lead.findMany({
    where: {
      assignedToId: session.user.id,
      ...(stage  ? { stage: stage as never } : {}),
      ...(ni     ? { isNI: true } : { isNI: false }),
      ...(search ? {
        OR: [
          { name:  { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" } },
          { city:  { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: [{ followUpDate: "asc" }, { updatedAt: "desc" }],
    include: {
      _count: { select: { activities: true } },
    },
  });

  return NextResponse.json({ leads });
}

import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await params;

  const content = await prisma.listingContent.findUnique({
    where:  { productId },
    select: { id: true },
  });
  if (!content) return NextResponse.json({ versions: [] });

  const versions = await prisma.listingContentVersion.findMany({
    where:   { listingContentId: content.id },
    include: { createdBy: { select: { name: true, email: true } } },
    orderBy: { version: "desc" },
  });

  return NextResponse.json({ versions });
}

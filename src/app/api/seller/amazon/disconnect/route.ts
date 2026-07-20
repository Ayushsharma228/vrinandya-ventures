import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || !["SELLER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const urlSellerId = req.nextUrl.searchParams.get("sellerId");
    const sellerId = session.user.role === "ADMIN" && urlSellerId ? urlSellerId : session.user.id;

    await prisma.marketplaceAccount.deleteMany({
      where: { sellerId, platform: "AMAZON" },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[amazon/disconnect]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

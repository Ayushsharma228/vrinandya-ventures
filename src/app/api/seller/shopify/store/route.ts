import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "SELLER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const store = await prisma.shopifyStore.findUnique({
      where: { sellerId: session.user.id },
      select: { id: true, storeName: true, storeUrl: true, createdAt: true },
    });

    return NextResponse.json({ store });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await prisma.shopifyStore.deleteMany({ where: { sellerId: session.user.id } });
  return NextResponse.json({ success: true });
}

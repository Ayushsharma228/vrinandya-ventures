import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { type: "GENERAL", data: { path: ["adminSent"], equals: true } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { id: true, name: true, email: true, brandName: true } } },
  });

  return NextResponse.json({ notifications });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { target, sellerId, category, title, message } = await req.json();
  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
  }

  const data = { adminSent: true, category: category || "General" };

  if (target === "all") {
    const sellers = await prisma.user.findMany({
      where: { role: "SELLER" },
      select: { id: true },
    });
    await prisma.notification.createMany({
      data: sellers.map(s => ({
        userId: s.id,
        type: "GENERAL" as const,
        title: title.trim(),
        message: message.trim(),
        data,
      })),
    });
    return NextResponse.json({ sent: sellers.length });
  }

  if (!sellerId) {
    return NextResponse.json({ error: "sellerId required when target is not 'all'" }, { status: 400 });
  }

  await prisma.notification.create({
    data: { userId: sellerId, type: "GENERAL", title: title.trim(), message: message.trim(), data },
  });

  return NextResponse.json({ sent: 1 });
}

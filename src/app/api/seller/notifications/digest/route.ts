import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { mergePrefs } from "../preferences/route";
import { emailDigest } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sellerId = session.user.id;
  const { preview } = await req.json().catch(() => ({ preview: true }));

  const user = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { email: true, name: true, notificationPrefs: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const prefs = mergePrefs(user.notificationPrefs);
  const isDaily = prefs.digestFrequency === "daily";
  const period = isDaily ? "Daily" : "Weekly";
  const since = new Date(Date.now() - (isDaily ? 1 : 7) * 24 * 60 * 60 * 1000);

  const [orders, txns, unreadCount] = await Promise.all([
    prisma.order.findMany({
      where: { sellerId, createdAt: { gte: since } },
      select: { status: true, totalAmount: true },
    }),
    prisma.walletTransaction.findMany({
      where: { userId: sellerId },
      select: { type: true, amount: true },
    }),
    prisma.notification.count({
      where: { userId: sellerId, isRead: false },
    }),
  ]);

  const totalOrders = orders.length;
  const delivered   = orders.filter((o) => o.status === "DELIVERED").length;
  const rto         = orders.filter((o) => o.status === "RTO").length;
  const revenue     = orders
    .filter((o) => o.status === "DELIVERED")
    .reduce((s, o) => s + (o.totalAmount ?? 0), 0);
  const balance     = txns.reduce((acc, t) =>
    t.type === "CREDIT" ? acc + t.amount : acc - t.amount, 0);

  const summary = { period, totalOrders, delivered, rto, revenue, balance, unreadNotifs: unreadCount };

  if (!preview) {
    await emailDigest({
      to:   user.email,
      name: user.name ?? "Seller",
      ...summary,
    });
    // Update last sent
    const updated = { ...prefs, digestLastSent: new Date().toISOString() };
    await prisma.user.update({
      where: { id: sellerId },
      data: { notificationPrefs: updated as object },
    });
  }

  return NextResponse.json({ summary, sent: !preview });
}

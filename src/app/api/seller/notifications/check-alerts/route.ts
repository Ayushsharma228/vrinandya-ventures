import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { mergePrefs } from "../preferences/route";

const COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 hours between repeat alerts

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sellerId = session.user.id;
  const now = Date.now();

  const user = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { notificationPrefs: true },
  });

  const prefs = mergePrefs(user?.notificationPrefs);
  const triggered: string[] = [];
  const checked: string[] = [];
  const prefsUpdate: Partial<typeof prefs> = {};

  // ── RTO rate alert ────────────────────────────────────────────────────────
  if (prefs.alertRtoEnabled) {
    checked.push("rto");
    const since = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const orders = await prisma.order.findMany({
      where: { sellerId, status: { in: ["DELIVERED", "RTO"] }, createdAt: { gte: since } },
      select: { status: true },
    });

    const total    = orders.length;
    const rtoCount = orders.filter((o) => o.status === "RTO").length;
    const rtoRate  = total > 0 ? Math.round((rtoCount / total) * 100) : 0;

    const lastTriggered = prefs.alertRtoLastTriggered
      ? new Date(prefs.alertRtoLastTriggered).getTime()
      : 0;
    const cooldownPassed = now - lastTriggered > COOLDOWN_MS;

    if (rtoRate >= prefs.alertRtoThreshold && cooldownPassed && total >= 5) {
      triggered.push("rto");
      prefsUpdate.alertRtoLastTriggered = new Date(now).toISOString();

      await prisma.notification.create({
        data: {
          userId: sellerId,
          type: "GENERAL",
          title: `RTO Alert — Rate is ${rtoRate}%`,
          message: `Your RTO rate over the last 30 days is ${rtoRate}%, which has crossed your alert threshold of ${prefs.alertRtoThreshold}%. Review your top-RTO products in the Catalog.`,
          data: { category: "Order Alert" },
        },
      });
    }
  }

  // ── Low balance alert ─────────────────────────────────────────────────────
  if (prefs.alertLowBalanceEnabled) {
    checked.push("balance");
    const txns = await prisma.walletTransaction.findMany({
      where: { userId: sellerId },
      select: { type: true, amount: true },
    });

    const balance = txns.reduce((acc, t) => {
      return t.type === "CREDIT" ? acc + t.amount : acc - t.amount;
    }, 0);

    const lastTriggered = prefs.alertLowBalanceLastTriggered
      ? new Date(prefs.alertLowBalanceLastTriggered).getTime()
      : 0;
    const cooldownPassed = now - lastTriggered > COOLDOWN_MS;

    if (balance < prefs.alertLowBalanceAmount && cooldownPassed) {
      triggered.push("balance");
      prefsUpdate.alertLowBalanceLastTriggered = new Date(now).toISOString();

      await prisma.notification.create({
        data: {
          userId: sellerId,
          type: "GENERAL",
          title: `Low Wallet Balance — ₹${Math.round(balance)}`,
          message: `Your wallet balance (₹${Math.round(balance)}) has dropped below your alert threshold of ₹${prefs.alertLowBalanceAmount}. Request a withdrawal or check your pending settlements.`,
          data: { category: "Payment Reminder" },
        },
      });
    }
  }

  // Persist updated timestamps
  if (Object.keys(prefsUpdate).length > 0) {
    const updated = { ...prefs, ...prefsUpdate };
    await prisma.user.update({
      where: { id: sellerId },
      data: { notificationPrefs: updated as object },
    });
  }

  return NextResponse.json({ checked, triggered });
}

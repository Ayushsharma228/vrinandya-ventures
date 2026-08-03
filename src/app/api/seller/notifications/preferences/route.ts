import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export interface NotificationPrefs {
  // Per-event email
  emailOnNewOrder: boolean;
  emailOnRto: boolean;
  emailOnDelivered: boolean;
  emailOnSettlement: boolean;
  // Digest
  digestFrequency: "none" | "daily" | "weekly";
  digestLastSent: string | null;
  // Alert rules
  alertRtoEnabled: boolean;
  alertRtoThreshold: number;       // percent, 1-100
  alertRtoLastTriggered: string | null;
  alertLowBalanceEnabled: boolean;
  alertLowBalanceAmount: number;   // INR
  alertLowBalanceLastTriggered: string | null;
}

export const DEFAULT_PREFS: NotificationPrefs = {
  emailOnNewOrder: false,
  emailOnRto: true,
  emailOnDelivered: false,
  emailOnSettlement: true,
  digestFrequency: "none",
  digestLastSent: null,
  alertRtoEnabled: false,
  alertRtoThreshold: 20,
  alertRtoLastTriggered: null,
  alertLowBalanceEnabled: false,
  alertLowBalanceAmount: 500,
  alertLowBalanceLastTriggered: null,
};

export function mergePrefs(raw: unknown): NotificationPrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_PREFS };
  const src = raw as Partial<NotificationPrefs>;
  return { ...DEFAULT_PREFS, ...src };
}

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPrefs: true },
  });

  return NextResponse.json({ prefs: mergePrefs(user?.notificationPrefs) });
}

export async function PATCH(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPrefs: true },
  });

  const current = mergePrefs(user?.notificationPrefs);
  const updated: NotificationPrefs = { ...current, ...body };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { notificationPrefs: updated as object },
  });

  return NextResponse.json({ prefs: updated });
}

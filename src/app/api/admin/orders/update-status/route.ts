import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, status } = await req.json();
  if (!orderId || !status) {
    return NextResponse.json({ error: "orderId and status required" }, { status: 400 });
  }

  const isRTO = status === "RTO";

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: (isRTO ? "SHIPPED" : status) as never,
      ...(isRTO ? { courier: "Delhivery (RTO)" } : {}),
    },
  });

  return NextResponse.json({ success: true });
}

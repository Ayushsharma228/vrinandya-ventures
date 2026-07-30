import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SALES")
    return NextResponse.json({ unread: 0 });

  // Conversations assigned to this rep where the last message is from the lead (USER role)
  const conversations = await prisma.wAConversation.findMany({
    where: { lead: { assignedToId: session.user.id } },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const unread = conversations.filter(c => c.messages[0]?.role === "USER").length;
  return NextResponse.json({ unread });
}

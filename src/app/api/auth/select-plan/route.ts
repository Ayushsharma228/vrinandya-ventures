import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Plan } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan } = await req.json();

    if (!plan || !Object.values(Plan).includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { plan: plan as Plan },
    });

    return NextResponse.json({ message: "Plan selected successfully", plan });
  } catch (error) {
    console.error("Select plan error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

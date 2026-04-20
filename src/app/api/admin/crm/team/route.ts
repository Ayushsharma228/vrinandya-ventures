import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email, password, salesTitle, salesTarget } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name, email, password: hashed,
      role: "SALES",
      salesTitle: salesTitle || null,
      salesTarget: salesTarget ? parseInt(salesTarget) : null,
      accountStatus: "ACTIVE",
    },
    select: { id: true, name: true, email: true, salesTitle: true, salesTarget: true },
  });

  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, salesTitle, salesTarget, password } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const data: Record<string, unknown> = {
    salesTitle: salesTitle ?? undefined,
    salesTarget: salesTarget !== undefined ? parseInt(salesTarget) : undefined,
  };
  if (password?.trim()) {
    data.password = await bcrypt.hash(password.trim(), 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, salesTitle: true, salesTarget: true },
  });

  return NextResponse.json({ user });
}

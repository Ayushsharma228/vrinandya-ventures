import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true, brandName: true, gstNumber: true, bankHolder: true, bankAccount: true, bankIfsc: true, bankName: true },
  });
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { type } = body;

  if (type === "personal") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: body.name?.trim() || undefined, phone: body.phone?.trim() || null },
    });
    return NextResponse.json({ success: true });
  }

  if (type === "business") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { brandName: body.brandName?.trim() || null, gstNumber: body.gst?.trim() || null },
    });
    return NextResponse.json({ success: true });
  }

  if (type === "bank") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        bankHolder: body.accountHolder?.trim() || null,
        bankAccount: body.accountNumber?.trim() || null,
        bankIfsc: body.ifsc?.trim() || null,
        bankName: body.bankName?.trim() || null,
      },
    });
    return NextResponse.json({ success: true });
  }

  if (type === "password") {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const valid = await bcrypt.compare(body.current, user.password);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    if (body.newPass !== body.confirm) return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    if (body.newPass.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    const hashed = await bcrypt.hash(body.newPass, 10);
    await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashOtp, isExpired } from "@/lib/otp";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { otp } = await req.json() as { otp?: string };
  if (!otp || otp.trim().length !== 6) {
    return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { emailOtp: true, emailOtpExpiry: true, emailVerified: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ ok: true });

  if (!user.emailOtp || !user.emailOtpExpiry) {
    return NextResponse.json({ error: "No OTP found. Please request a new code." }, { status: 400 });
  }
  if (isExpired(user.emailOtpExpiry)) {
    return NextResponse.json({ error: "OTP has expired. Please request a new code." }, { status: 400 });
  }
  if (hashOtp(otp.trim()) !== user.emailOtp) {
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { emailVerified: new Date(), emailOtp: null, emailOtpExpiry: null },
  });

  return NextResponse.json({ ok: true });
}

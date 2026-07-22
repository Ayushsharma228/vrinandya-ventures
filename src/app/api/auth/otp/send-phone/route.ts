import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOtp, hashOtp, otpExpiry, normalisePhone } from "@/lib/otp";
import { sendTextMessage } from "@/lib/whatsapp/client";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phone } = await req.json() as { phone?: string };
  if (!phone) return NextResponse.json({ error: "Phone number is required." }, { status: 400 });

  const normalised = normalisePhone(phone);
  if (normalised.length < 10) {
    return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
  }

  // Rate-limit: no resend within 60s
  const existing = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { phoneOtpExpiry: true, phoneVerified: true },
  });
  if (existing?.phoneVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }
  if (existing?.phoneOtpExpiry) {
    const sentAt = new Date(existing.phoneOtpExpiry.getTime() - 10 * 60 * 1000);
    if (Date.now() - sentAt.getTime() < 60_000) {
      return NextResponse.json({ error: "Please wait before requesting another OTP." }, { status: 429 });
    }
  }

  const otp    = generateOtp();
  const hashed = hashOtp(otp);
  const expiry = otpExpiry(10);

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { phone: phone.trim(), phoneOtp: hashed, phoneOtpExpiry: expiry },
  });

  if (!process.env.WHATSAPP_ACCESS_TOKEN) {
    console.log(`[DEV] Phone OTP for ${normalised}: ${otp}`);
    return NextResponse.json({ ok: true });
  }

  const message = `Your *Axiqen* verification code is:\n\n*${otp}*\n\nValid for 10 minutes. Do not share this code with anyone.`;
  const sent = await sendTextMessage(normalised, message);
  if (!sent) {
    return NextResponse.json({ error: "Failed to send WhatsApp message. Check your number." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

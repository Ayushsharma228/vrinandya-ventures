import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOtp, hashOtp, otpExpiry, normalisePhone } from "@/lib/otp";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phone } = await req.json() as { phone?: string };
  if (!phone) return NextResponse.json({ error: "Phone number is required." }, { status: 400 });

  const digits10 = phone.replace(/\D/g, "").slice(-10); // Indian 10-digit
  if (digits10.length !== 10) {
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

  // Dev fallback — log OTP if Fast2SMS not configured
  if (!process.env.FAST2SMS_API_KEY) {
    console.log(`[DEV] Phone OTP for ${digits10}: ${otp}`);
    return NextResponse.json({ ok: true });
  }

  // Fast2SMS OTP route — no DLT/template needed
  const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization:  process.env.FAST2SMS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      variables_values: otp,
      route:            "otp",
      numbers:          digits10,
    }),
  });

  const data = await res.json() as { return?: boolean; message?: string[] };
  if (!data.return) {
    console.error("[Fast2SMS] send failed", data);
    return NextResponse.json({ error: "Failed to send OTP. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

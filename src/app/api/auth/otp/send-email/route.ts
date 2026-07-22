import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOtp, hashOtp, otpExpiry } from "@/lib/otp";
import { Resend } from "resend";

const FROM = "Axiqen <noreply@vrinandyaventures.in>";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { email: true, emailVerified: true, emailOtpExpiry: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ ok: true, alreadyVerified: true });

  // Rate-limit: don't resend if last OTP sent <60s ago
  if (user.emailOtpExpiry) {
    const sentAt = new Date(user.emailOtpExpiry.getTime() - 10 * 60 * 1000);
    if (Date.now() - sentAt.getTime() < 60_000) {
      return NextResponse.json({ error: "Please wait before requesting another OTP." }, { status: 429 });
    }
  }

  const otp    = generateOtp();
  const hashed = hashOtp(otp);
  const expiry = otpExpiry(10);

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { emailOtp: hashed, emailOtpExpiry: expiry },
  });

  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_your")) {
    console.log(`[DEV] Email OTP for ${user.email}: ${otp}`);
    return NextResponse.json({ ok: true });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from:    FROM,
    to:      user.email,
    subject: `${otp} — Your Axiqen verification code`,
    html: `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
<tr><td style="background:#0048DF;padding:24px 32px;text-align:center">
  <span style="color:#fff;font-weight:900;font-size:20px;letter-spacing:-0.5px">Axiqen</span>
</td></tr>
<tr><td style="padding:36px 32px;text-align:center">
  <p style="margin:0 0 8px;font-size:14px;color:#6b7280">Your email verification code is</p>
  <div style="margin:16px auto;display:inline-block;background:#f3f4f6;border-radius:12px;padding:16px 36px">
    <span style="font-size:36px;font-weight:900;letter-spacing:8px;color:#0048DF;font-family:monospace">${otp}</span>
  </div>
  <p style="margin:16px 0 0;font-size:13px;color:#9ca3af">Valid for <strong>10 minutes</strong>. Do not share this code.</p>
</td></tr>
<tr><td style="padding:16px 32px;background:#f8f8f8;border-top:1px solid #eee;text-align:center">
  <p style="margin:0;font-size:11px;color:#9ca3af">Axiqen by Vrinandya Ventures Pvt Ltd · connect@vrinandyaventures.in</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`,
  });

  return NextResponse.json({ ok: true });
}

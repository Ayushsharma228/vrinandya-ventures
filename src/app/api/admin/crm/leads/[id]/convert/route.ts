import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getResend, FROM_EMAIL } from "@/lib/resend";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Plan } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { plan, sendEmail = true } = await req.json();

  if (!plan || !["DROPSHIPPING", "MARKETPLACE"].includes(plan)) {
    return NextResponse.json({ error: "plan must be DROPSHIPPING or MARKETPLACE" }, { status: 400 });
  }

  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  // Check if a seller account already exists for this email
  if (lead.email) {
    const existing = await prisma.user.findUnique({ where: { email: lead.email } });
    if (existing) {
      return NextResponse.json(
        { error: "A seller account already exists for this email", existingUserId: existing.id },
        { status: 409 }
      );
    }
  }

  // Generate a temporary password
  const tempPassword = crypto.randomBytes(6).toString("hex"); // 12-char hex
  const hashedPassword = await bcrypt.hash(tempPassword, 12);

  // Derive a username from the lead name
  const baseUsername = (lead.name || "seller")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 16);
  const username = `${baseUsername}${Date.now().toString().slice(-4)}`;

  // Create the seller account
  const seller = await prisma.user.create({
    data: {
      name: lead.name,
      email: lead.email || `${username}@placeholder.axqen`,
      phone: lead.phone !== "—" ? lead.phone : undefined,
      username,
      password: hashedPassword,
      role: "SELLER",
      plan: plan as Plan,
      accountStatus: "ACTIVE",
      onboardingDone: false,
    },
  });

  // Log activity on the lead
  await prisma.leadActivity.create({
    data: {
      leadId: id,
      userId: session.user.id,
      type: "CONVERTED",
      content: `Converted to seller account (ID: ${seller.id}, Plan: ${plan})`,
    },
  });

  // Update lead stage to CLIENT if not already
  await prisma.lead.update({
    where: { id },
    data: { pipelineStage: "CLIENT", stage: "ONBOARDED" },
  });

  // Send welcome email
  if (sendEmail && lead.email) {
    try {
      const resend = getResend();
      await resend.emails.send({
        from: FROM_EMAIL,
        to: lead.email,
        subject: "Welcome to AXQEN — Your Seller Account is Ready",
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
            <h2 style="color:#00C67A">Welcome to AXQEN, ${lead.name}!</h2>
            <p>Your seller account has been created. Here are your login credentials:</p>
            <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
              <p style="margin:4px 0"><strong>Login URL:</strong> ${process.env.NEXTAUTH_URL}/login</p>
              <p style="margin:4px 0"><strong>Email:</strong> ${lead.email}</p>
              <p style="margin:4px 0"><strong>Temporary Password:</strong> <code style="background:#e0e0e0;padding:2px 6px;border-radius:4px">${tempPassword}</code></p>
            </div>
            <p>Please log in and change your password immediately from your profile settings.</p>
            <p>Your plan: <strong>${plan === "DROPSHIPPING" ? "Dropshipping" : "Marketplace"}</strong></p>
            <p style="color:#888;font-size:13px">If you have any questions, reply to this email or contact your account manager.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      // Don't fail the conversion if email fails — account is created
      console.error("Welcome email failed:", emailErr);
    }
  }

  return NextResponse.json({
    success: true,
    sellerId: seller.id,
    username: seller.username,
    emailSent: sendEmail && !!lead.email,
    tempPassword: sendEmail ? undefined : tempPassword, // only return if email not sent
  });
}

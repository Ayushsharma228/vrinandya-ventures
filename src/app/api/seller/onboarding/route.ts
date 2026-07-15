import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { emailOnboardingComplete } from "@/lib/email";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true, email: true, phone: true, brandName: true,
      businessName: true, businessAddress: true, pincode: true,
      gstNumber: true, bankName: true, bankHolder: true,
      bankAccount: true, bankIfsc: true, aadhaarNumber: true,
      agreementAccepted: true, kycStatus: true, onboardingDone: true,
    },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "SELLER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { step } = body;

  if (step === "agreement") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { agreementAccepted: true, agreementAcceptedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  if (step === "business") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        businessName: body.businessName || null,
        brandName:    body.brandName    || null,
        gstNumber:    body.gstNumber    || null,
        phone:        body.phone        || null,
        businessAddress: body.businessAddress || null,
        pincode:      body.pincode      || null,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (step === "bank") {
    if (!body.bankAccount || !body.bankIfsc || !body.bankHolder)
      return NextResponse.json({ error: "Account number, IFSC, and holder name are required" }, { status: 400 });
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        bankName:    body.bankName    || null,
        bankHolder:  body.bankHolder,
        bankAccount: body.bankAccount,
        bankIfsc:    body.bankIfsc.toUpperCase(),
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (step === "kyc") {
    if (!body.aadhaarNumber)
      return NextResponse.json({ error: "Aadhaar number is required" }, { status: 400 });
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        aadhaarNumber: body.aadhaarNumber,
        aadhaarDocUrl: body.aadhaarDocUrl || null,
        kycStatus:     "SUBMITTED",
        onboardingDone: true,
      },
      select: { name: true, email: true },
    });
    emailOnboardingComplete({
      to:   updated.email,
      name: updated.name ?? "Seller",
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown step" }, { status: 400 });
}

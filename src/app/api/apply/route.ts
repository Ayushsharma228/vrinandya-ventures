import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, phone, store, budget, niche } = await req.json();

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    const notes = [
      store  ? `Store: ${store}`   : null,
      budget ? `Budget: ${budget}` : null,
      niche  ? `Niche: ${niche}`   : null,
    ].filter(Boolean).join(" · ");

    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) return NextResponse.json({ error: "Platform not ready" }, { status: 503 });

    // Upsert by phone to avoid duplicates from double submits
    const existing = await prisma.lead.findFirst({ where: { phone: phone.trim() } });

    if (existing) {
      await prisma.lead.update({
        where: { id: existing.id },
        data: { name: name.trim(), notes: notes || undefined, source: "WEBSITE" },
      });
    } else {
      await prisma.lead.create({
        data: {
          name: name.trim(),
          phone: phone.trim(),
          stage: "LEAD",
          source: "WEBSITE",
          notes: notes || undefined,
          createdById: admin.id,
        },
      });
    }

    // Notify admin
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: "LISTING_REQUEST",
        title: "New Website Lead",
        message: `${name.trim()} (${phone.trim()}) applied via the website.${notes ? " " + notes : ""}`,
        data: { phone: phone.trim(), store, budget, niche },
      },
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Apply error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

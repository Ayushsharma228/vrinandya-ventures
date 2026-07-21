import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type QA = { q: string; a: string };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, city, category, answers } = body as {
      name:     string;
      phone:    string;
      city?:    string;
      category?: string;
      answers?:  QA[];
    };

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    const noteLines: string[] = [];
    if (category)       noteLines.push(`Service: ${category}`);
    if (city?.trim())   noteLines.push(`City: ${city.trim()}`);
    if (answers?.length) {
      answers.forEach(({ q, a }) => {
        if (a) noteLines.push(`${q}: ${a}`);
      });
    }
    const notes = noteLines.join(" | ");

    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) return NextResponse.json({ error: "Platform not ready" }, { status: 503 });

    const existing = await prisma.lead.findFirst({ where: { phone: phone.trim() } });

    if (existing) {
      await prisma.lead.update({
        where: { id: existing.id },
        data:  { name: name.trim(), notes: notes || undefined, source: "WEBSITE" },
      });
    } else {
      await prisma.lead.create({
        data: {
          name:        name.trim(),
          phone:       phone.trim(),
          stage:       "LEAD",
          source:      "WEBSITE",
          notes:       notes || undefined,
          createdById: admin.id,
        },
      });
    }

    const plan = answers?.[0]?.a ?? "";
    const preview = [category, plan].filter(Boolean).join(" · ");

    await prisma.notification.create({
      data: {
        userId:  admin.id,
        type:    "LISTING_REQUEST",
        title:   "New Website Lead",
        message: `${name.trim()} (${phone.trim()}) applied via the website${preview ? ` — ${preview}` : ""}.`,
        data:    { phone: phone.trim(), category, plan, city, answers },
      },
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Apply error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

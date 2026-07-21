import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type QA = { q: string; a: string };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, city, timeToContact, category, answers } = body as {
      name:           string;
      phone:          string;
      email?:         string;
      city?:          string;
      timeToContact?: string;
      category?:      string;
      answers?:       QA[];
    };

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    const selectedPlan = answers?.[0]?.a ?? null;

    // Store all Q&A in notes for full context
    const noteLines: string[] = [];
    if (answers?.length) {
      answers.forEach(({ q, a }) => {
        if (a) noteLines.push(`${q}: ${a}`);
      });
    }
    const notes = noteLines.join(" | ");

    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!admin) return NextResponse.json({ error: "Platform not ready" }, { status: 503 });

    const existing = await prisma.lead.findFirst({ where: { phone: phone.trim() } });

    const coreData = {
      name:            name.trim(),
      email:           email?.trim()        || null,
      city:            city?.trim()         || null,
      source:          "WEBSITE",
      notes:           notes                || null,
      businessStage:   category             || null,
      recommendedPlan: selectedPlan         || null,
      timeline:        timeToContact        || null,
    };

    if (existing) {
      await prisma.lead.update({
        where: { id: existing.id },
        data:  coreData,
      });
    } else {
      await prisma.lead.create({
        data: {
          ...coreData,
          phone:       phone.trim(),
          stage:       "LEAD",
          createdById: admin.id,
        },
      });
    }

    const preview = [category, selectedPlan].filter(Boolean).join(" · ");

    await prisma.notification.create({
      data: {
        userId:  admin.id,
        type:    "LISTING_REQUEST",
        title:   "New Website Lead",
        message: `${name.trim()} (${phone.trim()}) applied via the website${preview ? ` — ${preview}` : ""}.`,
        data:    { phone: phone.trim(), category, plan: selectedPlan, email, city, timeToContact, answers },
      },
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Apply error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

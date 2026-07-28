import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const STAGE_CONTEXT: Record<string, string> = {
  LEAD:             "First contact needed — just collected their info",
  CALL_NOT_PICKED:  "Called but didn't pick up",
  BUSY:             "Said they're busy, needs rescheduling",
  SCHEDULE_MEETING: "Agreed to a call/meeting",
  NOT_INTERESTED:   "Initially declined",
  PROSPECT:         "Showing interest, needs more qualification",
  INTERESTED:       "Interested, moving toward a decision",
  WILL_PAY:         "Ready to pay, finalising details",
  PAID:             "Paid, onboarding in progress",
  ONBOARDED:        "Fully onboarded",
  WEBSITE_DONE:     "Website is live",
  ENGAGEMENT_LIVE:  "Engagement campaigns running",
  ADS_LIVE:         "Ads are live",
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRouteSession(req);
  if (!session || (session.user.role !== "SALES" && session.user.role !== "ADMIN"))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const lead = await prisma.lead.findFirst({
    where: session.user.role === "SALES" ? { id, assignedToId: session.user.id } : { id },
    select: {
      name: true, city: true, investment: true, stage: true,
      notes: true, followUpDate: true, createdAt: true,
      businessStage: true, source: true, timeline: true,
      activities: {
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { type: true, content: true, createdAt: true },
      },
    },
  });

  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });

  const daysSinceCreated = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 86400000);

  const activitySummary = lead.activities.length
    ? lead.activities
        .map(a => `- ${a.type}: ${a.content ?? "(no notes)"} (${new Date(a.createdAt).toLocaleDateString("en-IN")})`)
        .join("\n")
    : "No activities logged yet";

  const prompt = `You are Arya, a sharp sales coach for Vrinandya Ventures — we help Indian entrepreneurs launch and scale profitable dropshipping/eCommerce businesses.

Lead: ${lead.name} | ${lead.city ?? "Unknown city"} | Budget: ₹${lead.investment?.toLocaleString("en-IN") ?? "not specified"} | Source: ${lead.source}
Stage: ${lead.stage} — ${STAGE_CONTEXT[lead.stage] ?? ""}
In pipeline: ${daysSinceCreated} days${lead.timeline ? ` | Best call time: ${lead.timeline}` : ""}
Business interest: ${lead.businessStage ?? "Not specified"}
Notes: ${lead.notes ?? "None"}
Recent activity:
${activitySummary}

Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "insight": "One sharp 1-sentence observation about this lead — what motivates them or what the key unlock is",
  "openingScript": "Natural 2-3 sentence opening for a call or WhatsApp message, personalised to their city/budget/stage. Sound human, not salesy.",
  "talkingPoints": ["specific point 1", "specific point 2", "specific point 3"],
  "objections": [
    { "o": "most likely objection they will raise", "r": "concise response to handle it" },
    { "o": "second likely objection", "r": "concise response" }
  ],
  "suggestedFollowUpDays": 2,
  "suggestedFollowUpNote": "10-15 word note to auto-log after this follow-up"
}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.65,
      max_tokens: 700,
    }),
  });

  if (!res.ok) return NextResponse.json({ error: "AI service unavailable" }, { status: 502 });

  const data = await res.json();
  const raw = (data.choices?.[0]?.message?.content ?? "").trim();

  let suggestion;
  try {
    const cleaned = raw.replace(/^```(?:json)?/m, "").replace(/```$/m, "").trim();
    suggestion = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: "Could not parse AI response" }, { status: 500 });
  }

  return NextResponse.json({ suggestion });
}

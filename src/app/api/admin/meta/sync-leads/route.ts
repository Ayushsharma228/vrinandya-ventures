import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const FORM_IDS = ["1179279493990165", "892027506701838", "2253800491697371"];

interface MetaLead {
  id: string;
  created_time: string;
  field_data: { name: string; values: string[] }[];
}

function extractField(fields: { name: string; values: string[] }[], key: string): string {
  return fields.find(f => f.name === key)?.values?.[0] ?? "";
}

function buildNotes(fields: { name: string; values: string[] }[]): string {
  const parts: string[] = [];
  const goal = extractField(fields, "what_is_your_main_goal_with_dropshipping?");
  const exp  = extractField(fields, "are_you_new_to_dropshipping?");
  const help = extractField(fields, "what_kind_of_help_are_you_looking_for?");
  const when = extractField(fields, "when_would_you_like_to_start?");
  if (goal) parts.push(`Goal: ${goal.replace(/_/g, " ")}`);
  if (exp)  parts.push(`Experience: ${exp.replace(/_/g, " ")}`);
  if (help) parts.push(`Help needed: ${help.replace(/_/g, " ")}`);
  if (when) parts.push(`Start: ${when.replace(/_/g, " ")}`);
  return parts.join(" | ");
}

async function fetchAllLeads(formId: string, pageToken: string): Promise<MetaLead[]> {
  const leads: MetaLead[] = [];
  let url = `https://graph.facebook.com/v18.0/${formId}/leads?fields=id,created_time,field_data&limit=100&access_token=${pageToken}`;

  while (url) {
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) break;
    leads.push(...(data.data ?? []));
    url = data.paging?.next ?? null;
  }
  return leads;
}

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pageToken = process.env.META_PAGE_TOKEN;
  if (!pageToken) {
    return NextResponse.json({ error: "META_PAGE_TOKEN not configured" }, { status: 500 });
  }

  let imported = 0;
  let skipped = 0;

  for (const formId of FORM_IDS) {
    const leads = await fetchAllLeads(formId, pageToken);

    for (const lead of leads) {
      const name  = extractField(lead.field_data, "full_name") || "Unknown";
      const phone = extractField(lead.field_data, "phone_number");
      const email = extractField(lead.field_data, "email") || null;
      const notes = buildNotes(lead.field_data) || null;

      if (!phone) { skipped++; continue; }

      try {
        await prisma.lead.create({
          data: {
            metaLeadId:  lead.id,
            name,
            phone,
            email,
            notes,
            source:      "META_ADS",
            createdById: session.user.id,
            createdAt:   new Date(lead.created_time),
          },
        });
        imported++;
      } catch {
        // unique constraint on metaLeadId → already imported
        skipped++;
      }
    }
  }

  return NextResponse.json({ imported, skipped });
}

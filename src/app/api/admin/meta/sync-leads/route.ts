import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const FORM_IDS = ["1179279493990165", "892027506701838", "2253800491697371"];

interface MetaLead {
  id: string;
  created_time: string;
  field_data: { name: string; values: string[] }[];
}

function extractField(fields: { name: string; values: string[] }[], ...keys: string[]): string {
  for (const key of keys) {
    const val = fields.find(f => f.name === key)?.values?.[0];
    if (val) return val;
  }
  return "";
}

function buildNotes(fields: { name: string; values: string[] }[]): string {
  const parts: string[] = [];
  // Map known Meta form field names to readable labels
  const MAP: [string, string][] = [
    ["what_is_your_main_goal_with_dropshipping?", "Goal"],
    ["are_you_new_to_dropshipping?",              "Experience"],
    ["what_kind_of_help_are_you_looking_for?",    "Help needed"],
    ["when_would_you_like_to_start?",             "Start"],
    ["business_stage",                             "Business Stage"],
    ["investment_budget",                          "Budget"],
    ["timeline",                                   "Timeline"],
    ["marketplace",                                "Marketplace"],
    ["biggest_challenge",                          "Challenge"],
  ];
  for (const [key, label] of MAP) {
    const val = extractField(fields, key);
    if (val) parts.push(`${label}: ${val.replace(/_/g, " ")}`);
  }
  return parts.join(" | ");
}

async function fetchAllLeads(formId: string, pageToken: string): Promise<{ leads: MetaLead[]; error?: string }> {
  const leads: MetaLead[] = [];
  let url = `https://graph.facebook.com/v18.0/${formId}/leads?fields=id,created_time,field_data&limit=100&access_token=${pageToken}`;

  while (url) {
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) return { leads, error: `Form ${formId}: ${data.error.message}` };
    leads.push(...(data.data ?? []));
    url = data.paging?.next ?? null;
  }
  return { leads };
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
  const errors: string[] = [];
  let sampleFields: string[] = [];

  for (const formId of FORM_IDS) {
    const { leads, error } = await fetchAllLeads(formId, pageToken);
    if (error) { errors.push(error); continue; }

    for (const lead of leads) {
      // Capture field names from first lead for debugging
      if (sampleFields.length === 0 && lead.field_data?.length) {
        sampleFields = lead.field_data.map(f => f.name);
      }

      const name  = extractField(lead.field_data, "full_name", "name") || "Unknown";
      // Try every common phone field name Meta might use
      const phone = extractField(lead.field_data, "phone_number", "phone", "mobile", "mobile_number", "contact_number") || "—";
      const email = extractField(lead.field_data, "email", "email_address") || null;
      const notes = buildNotes(lead.field_data) || null;

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

  return NextResponse.json({ imported, skipped, errors, sampleFields });
}

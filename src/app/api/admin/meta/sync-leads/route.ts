import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const FORM_IDS = ["2038602106739692"]; // 10 July form

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

async function fetchAllLeads(
  formId: string,
  pageToken: string,
  since?: number
): Promise<{ leads: MetaLead[]; error?: string; tokenExpired?: boolean }> {
  const leads: MetaLead[] = [];
  const sinceParam = since ? `&since=${since}` : "";
  let url = `https://graph.facebook.com/v18.0/${formId}/leads?fields=id,created_time,field_data&limit=100${sinceParam}&access_token=${pageToken}`;

  while (url) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10000);
    let res: Response;
    try {
      res = await fetch(url, { signal: controller.signal });
    } catch {
      clearTimeout(t);
      return { leads, error: "Meta API did not respond within 10 seconds" };
    }
    clearTimeout(t);
    const data = await res.json();
    if (data.error) {
      // code 190 = token expired/invalid; other OAuthExceptions = permission issues
      const isTokenExpired = data.error.code === 190;
      return { leads, error: `[${data.error.code}] ${data.error.message}`, tokenExpired: isTokenExpired };
    }
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

  const { searchParams } = new URL(req.url);
  const full = searchParams.get("full") === "true";
  const since = full ? undefined : Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);

  // Fetch all forms in parallel instead of sequentially
  const formResults = await Promise.all(
    FORM_IDS.map(formId => fetchAllLeads(formId, pageToken, since))
  );

  // Check for token expiry on any form before processing
  if (formResults.some(r => r.tokenExpired)) {
    return NextResponse.json(
      { imported: 0, skipped: 0, found: 0, errors: [], tokenExpired: true },
      { status: 401 }
    );
  }

  let imported = 0;
  let skipped = 0;
  let found = 0;
  const errors: string[] = [];
  let sampleFields: string[] = [];

  for (let i = 0; i < FORM_IDS.length; i++) {
    const { leads, error } = formResults[i];
    if (error) { errors.push(`Form ${FORM_IDS[i]}: ${error}`); continue; }

    found += leads.length;

    for (const lead of leads) {
      if (sampleFields.length === 0 && lead.field_data?.length) {
        sampleFields = lead.field_data.map(f => f.name);
      }

      const name  = extractField(lead.field_data, "full_name", "name") || "Unknown";
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
        // unique constraint on metaLeadId → already exists
        skipped++;
      }
    }
  }

  return NextResponse.json({ imported, skipped, found, errors, sampleFields });
}

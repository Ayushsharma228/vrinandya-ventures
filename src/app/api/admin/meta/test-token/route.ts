import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const DEFAULT_FORM_IDS = ["2038602106739692"]; // 10 July form

async function metaGet(url: string): Promise<{ data: Record<string, unknown>; timedOut?: boolean }> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(t);
    return { data: await res.json() };
  } catch {
    clearTimeout(t);
    return { data: {}, timedOut: true };
  }
}

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [dbToken, dbExpiry, dbFormIds] = await Promise.all([
    prisma.platformConfig.findUnique({ where: { key: "META_PAGE_TOKEN_DB" } }),
    prisma.platformConfig.findUnique({ where: { key: "META_USER_TOKEN_EXPIRES" } }),
    prisma.platformConfig.findUnique({ where: { key: "META_FORM_IDS" } }),
  ]);
  const FORM_IDS: string[] = dbFormIds?.value ? JSON.parse(dbFormIds.value) : DEFAULT_FORM_IDS;
  const token = dbToken?.value || process.env.META_PAGE_TOKEN;
  const usingDb = !!dbToken?.value;
  const expiresAt = dbExpiry?.value ? new Date(dbExpiry.value) : null;
  const daysUntilExpiry = expiresAt
    ? Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  if (!token) {
    return NextResponse.json({ ok: false, reason: "No Meta page token found — set one via the Token Manager in CRM" });
  }

  // Step 1: validate token
  const { data: me, timedOut: meTimeout } = await metaGet(
    `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${token}`
  );

  if (meTimeout) {
    return NextResponse.json({ ok: false, reason: "Meta API timed out — Vercel cannot reach graph.facebook.com" });
  }
  if ((me as { error?: { code: number; message: string } }).error) {
    const err = (me as { error: { code: number; message: string } }).error;
    return NextResponse.json({
      ok: false,
      reason: err.code === 190
        ? "Token expired — update META_PAGE_TOKEN in Vercel and redeploy"
        : `Meta error ${err.code}: ${err.message}`,
    });
  }

  const pageName = (me as { name?: string }).name ?? "Unknown";

  // Step 2: check leads_retrieval permission on first form
  const { data: formCheck, timedOut: formTimeout } = await metaGet(
    `https://graph.facebook.com/v18.0/${FORM_IDS[0]}/leads?limit=1&access_token=${token}`
  );

  if (formTimeout) {
    return NextResponse.json({
      ok: false,
      page: pageName,
      reason: "Token OK but form leads endpoint timed out — may be a permissions issue or Meta is slow",
    });
  }

  const formErr = (formCheck as { error?: { code: number; message: string } }).error;
  if (formErr) {
    return NextResponse.json({
      ok: false,
      page: pageName,
      reason: `Token OK but cannot access lead forms — error ${formErr.code}: ${formErr.message}`,
    });
  }

  const leadCount = ((formCheck as { data?: unknown[] }).data ?? []).length;
  return NextResponse.json({
    ok: true,
    page: pageName,
    formLeadsAccessible: true,
    sampleLeadsFound: leadCount,
    formCount: FORM_IDS.length,
    usingDb,
    daysUntilExpiry,
    expiringSoon: daysUntilExpiry !== null && daysUntilExpiry <= 7,
    userTokenExpiresAt: expiresAt?.toISOString() ?? null,
  });
}

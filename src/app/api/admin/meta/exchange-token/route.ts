import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const META_PAGE_ID = "923804890815777"; // Vrinandya Ventures

async function metaFetch(url: string) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(t);
    return await res.json();
  } catch {
    clearTimeout(t);
    throw new Error("Meta API timed out or is unreachable");
  }
}

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userToken } = await req.json() as { userToken?: string };
  if (!userToken?.trim()) {
    return NextResponse.json({ error: "userToken is required" }, { status: 400 });
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret || appSecret === "REPLACE_WITH_NEW_SECRET_AFTER_RESET") {
    return NextResponse.json(
      { error: "META_APP_ID or META_APP_SECRET not configured in Vercel environment variables" },
      { status: 500 }
    );
  }

  // Step 1: Exchange short-lived user token → long-lived user token (valid 60 days)
  const exchangeUrl =
    `https://graph.facebook.com/v19.0/oauth/access_token` +
    `?grant_type=fb_exchange_token` +
    `&client_id=${appId}` +
    `&client_secret=${appSecret}` +
    `&fb_exchange_token=${encodeURIComponent(userToken.trim())}`;

  let longLivedData: { access_token?: string; expires_in?: number; error?: { code: number; message: string } };
  try {
    longLivedData = await metaFetch(exchangeUrl);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }

  if (longLivedData.error) {
    return NextResponse.json({
      error: `Token exchange failed — [${longLivedData.error.code}] ${longLivedData.error.message}`,
    }, { status: 400 });
  }

  const longLivedToken = longLivedData.access_token;
  const expiresIn = longLivedData.expires_in ?? 5184000; // 60 days in seconds
  if (!longLivedToken) {
    return NextResponse.json({ error: "No access_token in Meta exchange response" }, { status: 502 });
  }

  const userTokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

  // Step 2: Get page access token for Vrinandya Ventures page using the long-lived user token.
  // A page token derived from a long-lived user token never expires.
  const pageUrl =
    `https://graph.facebook.com/v19.0/${META_PAGE_ID}` +
    `?fields=access_token,name` +
    `&access_token=${longLivedToken}`;

  let pageData: { access_token?: string; name?: string; error?: { code: number; message: string } };
  try {
    pageData = await metaFetch(pageUrl);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }

  if (pageData.error) {
    return NextResponse.json({
      error:
        `Could not get page token — [${pageData.error.code}] ${pageData.error.message}. ` +
        `Make sure the Meta user is an admin of the Vrinandya Ventures page.`,
    }, { status: 400 });
  }

  const pageToken = pageData.access_token;
  if (!pageToken) {
    return NextResponse.json(
      { error: "Meta returned no page access_token — confirm the user is an admin of the Vrinandya Ventures page." },
      { status: 400 }
    );
  }

  // Step 3: Persist tokens in PlatformConfig.
  // The page token is permanent (never expires) since it was derived from a long-lived user token.
  await Promise.all([
    prisma.platformConfig.upsert({
      where:  { key: "META_PAGE_TOKEN_DB" },
      update: { value: pageToken, label: `Meta Page Token (Vrinandya Ventures) — refreshed ${new Date().toISOString()}` },
      create: { key: "META_PAGE_TOKEN_DB", value: pageToken, label: "Meta Page Token (Vrinandya Ventures)" },
    }),
    prisma.platformConfig.upsert({
      where:  { key: "META_USER_TOKEN_EXPIRES" },
      update: { value: userTokenExpiresAt.toISOString(), label: "Meta User Token Expiry" },
      create: { key: "META_USER_TOKEN_EXPIRES", value: userTokenExpiresAt.toISOString(), label: "Meta User Token Expiry" },
    }),
  ]);

  const daysUntilExpiry = Math.floor((userTokenExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return NextResponse.json({
    ok: true,
    pageName: pageData.name ?? "Vrinandya Ventures",
    userTokenExpiresAt: userTokenExpiresAt.toISOString(),
    daysUntilExpiry,
    message:
      `Page token stored permanently. Refresh again before ${userTokenExpiresAt.toLocaleDateString("en-IN")} ` +
      `(${daysUntilExpiry} days from now) so the user token stays active.`,
  });
}

// GET — returns current token status from DB
export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [dbToken, dbExpiry] = await Promise.all([
    prisma.platformConfig.findUnique({ where: { key: "META_PAGE_TOKEN_DB" } }),
    prisma.platformConfig.findUnique({ where: { key: "META_USER_TOKEN_EXPIRES" } }),
  ]);

  const hasDbToken = !!dbToken?.value;
  const expiresAt = dbExpiry?.value ? new Date(dbExpiry.value) : null;
  const daysUntilExpiry = expiresAt
    ? Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return NextResponse.json({
    hasDbToken,
    usingEnvFallback: !hasDbToken && !!process.env.META_PAGE_TOKEN,
    userTokenExpiresAt: expiresAt?.toISOString() ?? null,
    daysUntilExpiry,
    expiringSoon: daysUntilExpiry !== null && daysUntilExpiry <= 7,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.META_PAGE_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, reason: "META_PAGE_TOKEN is not set in Vercel environment variables" });
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${token}`,
      { signal: controller.signal }
    );
    clearTimeout(t);
    const data = await res.json();

    if (data.error) {
      const isExpired = data.error.code === 190;
      return NextResponse.json({
        ok: false,
        reason: isExpired
          ? `Token expired — update META_PAGE_TOKEN in Vercel and redeploy`
          : `Meta error ${data.error.code}: ${data.error.message}`,
        metaError: data.error,
      });
    }

    return NextResponse.json({ ok: true, page: data.name, id: data.id });
  } catch (err: unknown) {
    clearTimeout(t);
    const isAbort = err instanceof Error && err.name === "AbortError";
    return NextResponse.json({
      ok: false,
      reason: isAbort
        ? "Meta API did not respond in 8 seconds — Vercel cannot reach graph.facebook.com"
        : `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

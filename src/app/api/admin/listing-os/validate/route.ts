import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import { validateListing } from "@/lib/listing/validation";

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.productId || !body?.platform) {
    return NextResponse.json({ error: "productId and platform required" }, { status: 400 });
  }

  const result = await validateListing({
    productId:  body.productId,
    platform:   body.platform,
    imageUrls:  body.imageUrls,
  });

  return NextResponse.json(result);
}

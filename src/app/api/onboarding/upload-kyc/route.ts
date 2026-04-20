import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  const session = await getRouteSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG or PDF files are allowed" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be under 5 MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop();
    const filename = `kyc/${session.user.id}-aadhaar.${ext}`;

    const blob = await put(filename, file, { access: "public", addRandomSuffix: false });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("KYC upload error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("BLOB_READ_WRITE_TOKEN") || msg.includes("token")) {
      return NextResponse.json({ error: "File storage not configured. Please contact support or skip this step." }, { status: 500 });
    }
    return NextResponse.json({ error: `Upload failed: ${msg}` }, { status: 500 });
  }
}

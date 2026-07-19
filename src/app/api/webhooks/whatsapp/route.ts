import { NextRequest, NextResponse } from "next/server";
import { handleIncomingMessage } from "@/lib/whatsapp/agent";
import { markAsRead } from "@/lib/whatsapp/client";

// GET — Meta webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST — Incoming messages from Meta
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // Process synchronously — setImmediate is killed by Vercel after response
  try {
    await processWebhook(body);
  } catch (err) {
    console.error("[WA Webhook] processing error:", err);
  }

  return NextResponse.json({ status: "ok" });
}

async function processWebhook(body: unknown): Promise<void> {
  const payload = body as Record<string, unknown>;
  if (payload.object !== "whatsapp_business_account") return;

  const entries = (payload.entry as unknown[]) ?? [];

  for (const entry of entries) {
    const e = entry as Record<string, unknown>;
    const changes = (e.changes as unknown[]) ?? [];

    for (const change of changes) {
      const c = change as Record<string, unknown>;
      if (c.field !== "messages") continue;

      const value = c.value as Record<string, unknown>;
      const messages = (value.messages as unknown[]) ?? [];
      const contacts = (value.contacts as unknown[]) ?? [];

      for (const message of messages) {
        const msg = message as Record<string, unknown>;

        // Only handle text messages for now
        if (msg.type !== "text") continue;

        const waId      = msg.from as string;
        const msgId     = msg.id as string;
        const textBody  = ((msg.text as Record<string, unknown>)?.body as string) ?? "";
        const contact   = (contacts[0] as Record<string, unknown>) ?? {};
        const profile   = (contact.profile as Record<string, unknown>) ?? {};
        const senderName = profile.name as string | undefined;
        const phoneNumber = waId.startsWith("91") ? `+${waId}` : `+91${waId}`;

        if (!textBody.trim()) continue;

        // Mark as read
        await markAsRead(msgId);

        // Process with Arya
        await handleIncomingMessage(waId, phoneNumber, senderName, textBody, msgId);
      }
    }
  }
}

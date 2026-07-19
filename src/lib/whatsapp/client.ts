const BASE = "https://graph.facebook.com/v21.0";

function getToken() {
  return process.env.WHATSAPP_ACCESS_TOKEN ?? "";
}
function getPhoneNumberId() {
  return process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
}

export async function sendTextMessage(to: string, text: string): Promise<string | null> {
  const res = await fetch(`${BASE}/${getPhoneNumberId()}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: text },
    }),
  });
  if (!res.ok) {
    console.error("[WA] sendTextMessage failed", await res.text());
    return null;
  }
  const data = await res.json();
  return data?.messages?.[0]?.id ?? null;
}

export async function markAsRead(messageId: string): Promise<void> {
  await fetch(`${BASE}/${getPhoneNumberId()}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    }),
  }).catch(() => {});
}

export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string = "en",
  bodyParams: string[] = [],
): Promise<string | null> {
  const components = bodyParams.length > 0
    ? [{ type: "body", parameters: bodyParams.map(p => ({ type: "text", text: p })) }]
    : [];

  const res = await fetch(`${BASE}/${getPhoneNumberId()}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(components.length > 0 ? { components } : {}),
      },
    }),
  });

  if (!res.ok) {
    console.error("[WA] sendTemplateMessage failed", await res.text());
    return null;
  }
  const data = await res.json();
  return data?.messages?.[0]?.id ?? null;
}

export function isWhatsAppConfigured(): boolean {
  return !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

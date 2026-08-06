import { NextRequest, NextResponse } from "next/server";
import { getRouteSession } from "@/lib/session";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const session = await getRouteSession(req);
    if (!session || !["SELLER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sku, title, asin, price, quantity, status } = await req.json() as {
      sku: string; title?: string; asin?: string;
      price?: number; quantity?: number; status?: string[];
    };

    if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });

    const prompt = `You are an Amazon listing optimization expert for the Indian marketplace (Amazon.in).

Analyze this Amazon listing and provide detailed optimization feedback:

SKU: ${sku}
ASIN: ${asin ?? "N/A"}
Current Title: "${title}"
Price: ${price ? `₹${price}` : "N/A"}
Stock: ${quantity ?? "N/A"} units
Status: ${status?.join(", ") ?? "N/A"}

Respond with a JSON object (no markdown, no code blocks) with this exact structure:
{
  "healthScore": <number 0-100>,
  "grade": "<A|B|C|D|F>",
  "issues": ["<issue1>", "<issue2>"],
  "optimizedTitle": "<improved title, max 200 chars>",
  "titleTips": ["<tip1>", "<tip2>", "<tip3>"],
  "keywordSuggestions": ["<kw1>", "<kw2>", "<kw3>", "<kw4>", "<kw5>"],
  "summary": "<2-sentence summary of listing health>"
}

Scoring criteria:
- Title length 100-200 chars: +20 pts
- Title has brand name: +10 pts
- Title has key features/specs: +15 pts
- Title has size/variant info: +10 pts
- Title has relevant keywords: +15 pts
- Price set: +10 pts
- Stock > 0: +10 pts
- Status BUYABLE: +10 pts`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const analysis = JSON.parse(text);

    return NextResponse.json(analysis);
  } catch (err) {
    console.error("[listings/analyze]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";

const ROAST_SYSTEM = `You are the world's most savage AI roast machine. Analyze the photo and deliver a brutally funny, edgy roast based on appearance, vibe, expression, style, and energy.

Rules:
- 2-3 sentences MAX. Short. Punchy. Devastating.
- Be specific — reference what you actually see
- Comedy Central Roast energy — savage but not cruel
- No racism, no disability references
- End with a killer punchline
- Write in second person ("You look like...", "Your vibe says...")

Respond with ONLY the roast text. Nothing else.`;

export async function POST(req: NextRequest) {
  const { image } = await req.json();
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 300,
      system: ROAST_SYSTEM,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
          { type: "text", text: "Roast this person. Be savage." },
        ],
      }],
    }),
  });
  const data = await response.json();
  const roast = data.content?.[0]?.text || "Even AI is speechless. That's new.";
  return NextResponse.json({ roast });
}

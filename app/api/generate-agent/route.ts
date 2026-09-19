import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildAgentGenerationPrompt, BusinessInfo } from "@/lib/prompt";
import { logLead } from "@/lib/supabase";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Very lightweight in-memory rate limit: caps how many agent configs can be
// generated per minute across all visitors, since each call costs money.
// This resets whenever the server restarts/redeploys - it's a speed bump,
// not real abuse protection. For real protection, move this to a database
// or a service like Upstash and key it by email/IP.
let requestsThisMinute = 0;
let windowStart = Date.now();
const MAX_PER_MINUTE = 20;

function rateLimited(): boolean {
  const now = Date.now();
  if (now - windowStart > 60_000) {
    windowStart = now;
    requestsThisMinute = 0;
  }
  requestsThisMinute += 1;
  return requestsThisMinute > MAX_PER_MINUTE;
}

export async function POST(req: NextRequest) {
  if (rateLimited()) {
    return NextResponse.json(
      { error: "Too many demo requests right now, try again in a minute." },
      { status: 429 }
    );
  }

  try {
    const body = (await req.json()) as BusinessInfo & { email?: string };

    const required: (keyof BusinessInfo)[] = [
      "businessName",
      "industry",
      "whatAgentHandles",
      "tone",
      "keyInfo",
    ];
    const missing = required.filter((k) => !body[k]);
    if (missing.length) {
      return NextResponse.json(
        { error: `Missing fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }
    if (!body.email) {
      return NextResponse.json(
        { error: "Email is required to start a demo." },
        { status: 400 }
      );
    }

    const prompt = buildAgentGenerationPrompt(body);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "";

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) {
        return NextResponse.json(
          { error: "Could not parse AI response", raw },
          { status: 502 }
        );
      }
      parsed = JSON.parse(match[0]);
    }

    // Log the lead before returning, so you have a record of everyone who
    // tried the demo - even if they never book a call. Fire-and-forget:
    // this never blocks or fails the response to the visitor.
    await logLead({
      email: body.email,
      business_name: body.businessName,
      industry: body.industry,
      what_agent_handles: body.whatAgentHandles,
      tone: body.tone,
      key_info: body.keyInfo,
    });

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("generate-agent error", err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

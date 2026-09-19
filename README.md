# Meet Your AI Agent

A self-serve demo tool: a visitor describes their business, Claude turns
that into a voice AI agent's system prompt, and they call it live in their
browser (no phone number, no signup beyond an email) via Vapi. After the
call, a Calendly CTA invites them to book time with you.

## Stack

- Next.js (App Router) — deploys straight to Vercel, same as the listing tool
- Anthropic API — writes the agent's system prompt + opening line from the form
- Vapi Web SDK (`@vapi-ai/web`) — runs the live browser voice call, no phone
  number or pre-created "assistant" needed: the full agent config (system
  prompt, first message, voice) is passed at call-time as a transient
  assistant object

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

Pages:
- `/` — the business-info form
- `/demo` — the live call widget + Calendly CTA (reached after submitting the form)

## Vapi setup (once)

1. Create an account at vapi.ai.
2. Get your **Public Key** (Settings → API Keys) and put it in
   `NEXT_PUBLIC_VAPI_PUBLIC_KEY`. This key is meant to be exposed client-side.
3. In the Vapi dashboard, add your LLM provider credentials (OpenAI, used by
   `CallWidget.tsx`'s `model.provider: "openai"`) under Settings → Provider
   Keys, so Vapi can actually run the model during calls. You can swap the
   provider/model in `components/CallWidget.tsx` if you'd rather use a
   different one Vapi supports.
4. Optionally pick a different voice: the default in `CallWidget.tsx` is an
   11labs voice ID — browse Vapi's voice library and swap `voiceId`.

## Cost & abuse protection — read before sharing the link publicly

Every call costs real money (Vapi + LLM + TTS usage), so this is built with
two guardrails already in place, and you should treat both as a starting
point, not a finished job:

- **Hard call cap**: `CallWidget.tsx` auto-ends any call at 3 minutes
  (`MAX_CALL_SECONDS`).
- **Basic rate limit**: `app/api/generate-agent/route.ts` caps agent
  generation to 20/minute across all visitors. This is in-memory and resets
  on every deploy — fine for a small test batch, not for a public launch.
  Before sharing this link widely (e.g. on Instagram), swap this for a real
  rate limit keyed by email or IP (a service like Upstash Redis is a common
  choice), and consider requiring email verification before the call starts.

## Lead capture (Supabase)

Every time someone builds an agent, their email + business info is logged
to a Supabase table called `leads`, so you have a record of everyone who
tried the demo - not just the ones who book a call.

Setup (one time, ~5 minutes):

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase dashboard, go to the **SQL Editor** and run:
   ```sql
   create table leads (
     id uuid primary key default gen_random_uuid(),
     created_at timestamptz default now(),
     email text not null,
     business_name text not null,
     industry text not null,
     what_agent_handles text not null,
     tone text not null,
     key_info text not null
   );
   ```
3. Go to **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (not the `anon` key - this one bypasses row
     security so the server can insert freely) → `SUPABASE_SERVICE_ROLE_KEY`
4. Add both to `.env.local` (and to your Vercel project's environment
   variables, then redeploy).

To see your leads, open the Supabase dashboard → **Table Editor** →
`leads`. Every submission shows up as a new row, newest first.

If these two env vars aren't set, lead logging is silently skipped (a
warning is printed to the server logs) - the demo itself still works either
way, so this is safe to add later without breaking anything.

## Not yet built (intentionally)

- No real abuse protection beyond the basics above.
- No admin view of past demo submissions beyond Supabase's own table
  editor (fine for a lead list you check occasionally; a proper CRM export
  would take more work).

## Deploying

Same as the listing tool: push to GitHub, import into Vercel, add the env
vars from `.env.example`, deploy.

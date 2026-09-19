import { createClient } from "@supabase/supabase-js";

// Server-side only client, used to log leads. Uses the service role key so
// it can insert regardless of row-level-security policies - never import
// this file into a "use client" component or expose the service key to the
// browser.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export interface LeadRecord {
  email: string;
  business_name: string;
  industry: string;
  what_agent_handles: string;
  tone: string;
  key_info: string;
}

// Best-effort: a lead capture failure should never block someone from
// trying the demo, so this only logs a warning instead of throwing.
export async function logLead(lead: LeadRecord) {
  if (!supabase) {
    console.warn(
      "Supabase isn't configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing) - skipping lead capture."
    );
    return;
  }
  const { error } = await supabase.from("leads").insert(lead);
  if (error) {
    console.error("Failed to log lead to Supabase:", error.message);
  }
}

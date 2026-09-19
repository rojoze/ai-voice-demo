"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BusinessInfo } from "@/lib/prompt";

const empty: BusinessInfo & { email: string } = {
  email: "",
  businessName: "",
  industry: "",
  whatAgentHandles: "",
  tone: "",
  keyInfo: "",
};

export default function LandingPage() {
  const router = useRouter();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function generateAndGo() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/generate-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      // Stash the generated agent config for the /demo page to pick up.
      sessionStorage.setItem(
        "agentConfig",
        JSON.stringify({
          businessName: form.businessName,
          systemPrompt: data.systemPrompt,
          firstMessage: data.firstMessage,
        })
      );
      router.push("/demo");
    } catch (e) {
      setError("Something went wrong generating your agent.");
    } finally {
      setLoading(false);
    }
  }

  const fields: {
    key: keyof typeof form;
    label: string;
    placeholder: string;
    textarea?: boolean;
  }[] = [
    { key: "email", label: "Your email", placeholder: "you@example.com" },
    { key: "businessName", label: "Business name", placeholder: "Acme Dental" },
    { key: "industry", label: "Industry", placeholder: "Dental clinic" },
    {
      key: "whatAgentHandles",
      label: "What should the agent handle?",
      placeholder: "Book appointments, answer FAQs about pricing and hours",
    },
    {
      key: "tone",
      label: "Tone",
      placeholder: "Friendly and warm, professional but not stiff",
    },
    {
      key: "keyInfo",
      label: "Key info the agent should know",
      placeholder: "Hours: Mon-Fri 9-5. Services: cleanings, whitening, checkups. New patients welcome.",
      textarea: true,
    },
  ];

  return (
    <main className="max-w-2xl mx-auto px-6 py-14">
      <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[var(--brand-cyan)] mb-3">
        For any business
      </span>
      <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-3 text-[var(--brand-text)]">
        Hear your own AI agent, live
      </h1>
      <p className="text-[var(--brand-muted)] mb-8 max-w-lg">
        Tell us about your business below. We'll build a voice AI agent for
        it on the spot, then you can call it right here in your browser and
        hear exactly how it sounds.
      </p>

      <div className="bg-[var(--brand-panel)] border border-[var(--brand-border)] rounded-xl p-6 flex flex-col gap-4">
        {fields.map((f) => (
          <div key={f.key} className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--brand-text)]">
              {f.label}
            </label>
            {f.textarea ? (
              <textarea
                value={form[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="bg-[var(--brand-bg)] border border-[var(--brand-border)] rounded-md px-3 py-2 min-h-[90px] text-[var(--brand-text)] placeholder:text-[var(--brand-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-cyan)]"
              />
            ) : (
              <input
                value={form[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="bg-[var(--brand-bg)] border border-[var(--brand-border)] rounded-md px-3 py-2 text-[var(--brand-text)] placeholder:text-[var(--brand-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-cyan)]"
              />
            )}
          </div>
        ))}

        <button
          onClick={generateAndGo}
          disabled={loading}
          className="mt-2 bg-[var(--brand-cyan)] text-[var(--brand-bg)] rounded-md px-5 py-2.5 font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {loading ? "Building your agent..." : "Build my AI agent"}
        </button>

        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    </main>
  );
}

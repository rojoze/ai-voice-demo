"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CallWidget from "@/components/CallWidget";

interface AgentConfig {
  businessName: string;
  systemPrompt: string;
  firstMessage: string;
}

export default function DemoPage() {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("agentConfig");
    if (!raw) {
      setNotFound(true);
      return;
    }
    setConfig(JSON.parse(raw));
  }, []);

  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL;

  if (notFound) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-14 text-center">
        <p className="text-[var(--brand-muted)] mb-4">
          We couldn't find a generated agent for this session.
        </p>
        <Link href="/" className="text-[var(--brand-cyan)] underline">
          Go build one
        </Link>
      </main>
    );
  }

  if (!config) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-14 text-center text-[var(--brand-muted)]">
        Loading your agent...
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-14">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold mb-2 text-[var(--brand-text)]">
        {config.businessName}'s AI agent is ready
      </h1>
      <p className="text-[var(--brand-muted)] mb-8">
        Talk to it just like a real caller would.
      </p>

      <CallWidget config={config} />

      {calendlyUrl && (
        <div className="mt-10 bg-[var(--brand-panel)] border border-[var(--brand-border)] rounded-xl p-6 text-center">
          <p className="text-[var(--brand-text)] font-medium mb-3">
            Like what you heard? Let's set this up for your business for
            real.
          </p>
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[var(--brand-cyan)] text-[var(--brand-bg)] rounded-md px-5 py-2.5 font-semibold hover:opacity-90 transition-opacity"
          >
            Book a call
          </a>
        </div>
      )}
    </main>
  );
}

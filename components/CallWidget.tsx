"use client";

import { useEffect, useRef, useState } from "react";
import Vapi from "@vapi-ai/web";

interface AgentConfig {
  businessName: string;
  systemPrompt: string;
  firstMessage: string;
}

const MAX_CALL_SECONDS = 180; // hard cap so a demo can't run (and cost) forever

type CallState = "idle" | "connecting" | "active" | "ended";

export default function CallWidget({ config }: { config: AgentConfig }) {
  const [state, setState] = useState<CallState>("idle");
  const [secondsLeft, setSecondsLeft] = useState(MAX_CALL_SECONDS);
  const vapiRef = useRef<Vapi | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!publicKey) return;
    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      setState("active");
      setSecondsLeft(MAX_CALL_SECONDS);
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            vapi.stop();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    });

    vapi.on("call-end", () => {
      setState("ended");
      if (timerRef.current) clearInterval(timerRef.current);
    });

    vapi.on("error", (e: any) => {
      console.error("vapi error", e);
      setState("ended");
      if (timerRef.current) clearInterval(timerRef.current);
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      vapi.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCall() {
    if (!vapiRef.current) return;
    setState("connecting");
    vapiRef.current.start({
      name: `${config.businessName} demo agent`,
      firstMessage: config.firstMessage,
      model: {
        provider: "openai",
        model: "gpt-4o",
        messages: [{ role: "system", content: config.systemPrompt }],
      },
      voice: {
        provider: "11labs",
        voiceId: "21m00Tcm4TlvDq8ikWAM", // default 11labs voice - swap for your preferred one in the Vapi dashboard
      },
    } as any);
  }

  function endCall() {
    vapiRef.current?.stop();
  }

  const missingKey = !process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

  if (missingKey) {
    return (
      <div className="bg-[var(--brand-panel)] border border-[var(--brand-border)] rounded-xl p-6 text-sm text-red-400">
        NEXT_PUBLIC_VAPI_PUBLIC_KEY isn't set, so the call widget can't
        start. Add it to your environment variables.
      </div>
    );
  }

  return (
    <div className="bg-[var(--brand-panel)] border border-[var(--brand-border)] rounded-xl p-8 flex flex-col items-center text-center gap-4">
      {state === "idle" && (
        <>
          <p className="text-[var(--brand-muted)] text-sm">
            Click below, allow mic access, and start talking to{" "}
            {config.businessName}'s AI agent.
          </p>
          <button
            onClick={startCall}
            className="bg-[var(--brand-cyan)] text-[var(--brand-bg)] rounded-full px-6 py-3 font-semibold hover:opacity-90 transition-opacity"
          >
            🎙️ Call your AI agent
          </button>
        </>
      )}

      {state === "connecting" && (
        <p className="text-[var(--brand-cyan)] text-sm animate-pulse">
          Connecting...
        </p>
      )}

      {state === "active" && (
        <>
          <div className="w-3 h-3 rounded-full bg-[var(--brand-cyan)] animate-pulse" />
          <p className="text-sm text-[var(--brand-muted)]">
            Live &mdash; {Math.floor(secondsLeft / 60)}:
            {String(secondsLeft % 60).padStart(2, "0")} left
          </p>
          <button
            onClick={endCall}
            className="border border-[var(--brand-border)] rounded-full px-5 py-2 text-sm hover:bg-[var(--brand-bg)] transition-colors"
          >
            End call
          </button>
        </>
      )}

      {state === "ended" && (
        <p className="text-sm text-[var(--brand-muted)]">
          Call ended. Like what you heard?
        </p>
      )}
    </div>
  );
}

export default function Navbar() {
  return (
    <header className="border-b border-[var(--brand-border)] bg-[var(--brand-bg)]">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-2">
        <span className="text-xl">🎙️</span>
        <span className="font-display text-lg font-semibold text-[var(--brand-text)]">
          Meet Your AI Agent
        </span>
        <span className="text-xs text-[var(--brand-cyan)] font-medium ml-1 tracking-wide uppercase">
          by EveryDigitalAgency
        </span>
      </div>
    </header>
  );
}

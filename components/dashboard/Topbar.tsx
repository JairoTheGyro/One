export function Topbar() {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <p className="font-mono text-xs text-muted">workspace / default</p>
      <p className="text-[10px] uppercase tracking-wider text-muted">
        Self-hosted · Local-first
      </p>
    </header>
  );
}

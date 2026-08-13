import { ModelSelector } from "./ModelSelector";

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-panel px-4">
      <h1 className="text-sm font-semibold tracking-tight text-foreground">
        One <span className="font-normal text-foreground/50">/ AI Dashboard</span>
      </h1>
      <ModelSelector />
    </header>
  );
}

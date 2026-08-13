"use client";

import { Cpu } from "lucide-react";
import clsx from "clsx";
import { useDashboardStore } from "@/lib/store/useDashboardStore";

export function StatusIndicator() {
  const models = useDashboardStore((s) => s.models);
  const ollama = models.find((m) => m.provider === "ollama");
  const connected = Boolean(ollama?.connected);

  return (
    <div className="flex items-center gap-2.5 rounded-md border border-border bg-panel-elevated px-3 py-2">
      <Cpu size={14} className={connected ? "text-sovereign" : "text-muted"} />
      <div className="flex flex-1 flex-col leading-tight">
        <span className="text-xs font-medium text-foreground">Local GPU / Ollama</span>
        <span className="font-mono text-[10px] text-muted">
          {ollama?.baseUrl ?? "http://localhost:11434"}
        </span>
      </div>
      <span
        className={clsx(
          "h-2 w-2 shrink-0 rounded-full",
          connected
            ? "bg-sovereign shadow-[0_0_8px_rgba(34,197,94,0.7)]"
            : "bg-muted/40"
        )}
        title={connected ? "Connected" : "Disconnected"}
      />
    </div>
  );
}

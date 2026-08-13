"use client";

import { Plus, MessageSquare } from "lucide-react";
import clsx from "clsx";
import { useDashboardStore } from "@/lib/store/useDashboardStore";
import { ModelSwitcher } from "./ModelSwitcher";
import { StatusIndicator } from "./StatusIndicator";

export function Sidebar() {
  const sessions = useDashboardStore((s) => s.sessions);
  const activeSessionId = useDashboardStore((s) => s.activeSessionId);
  const selectedModelId = useDashboardStore((s) => s.selectedModelId);
  const createSession = useDashboardStore((s) => s.createSession);
  const setActiveSession = useDashboardStore((s) => s.setActiveSession);

  return (
    <aside className="flex h-full w-72 flex-col border-r border-border bg-panel">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/20 font-mono text-xs font-semibold text-accent">
          1
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-foreground">One</p>
          <p className="text-[10px] uppercase tracking-wider text-muted">
            Sovereign AI Dashboard
          </p>
        </div>
      </div>

      <div className="space-y-3 border-b border-border px-4 pb-4">
        <ModelSwitcher />
        <StatusIndicator />
      </div>

      <div className="p-3">
        <button
          onClick={() => createSession("general", selectedModelId)}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-panel-elevated px-3 py-2 text-sm font-medium text-foreground transition hover:border-accent/50 hover:text-accent"
        >
          <Plus size={16} />
          New thread
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        <p className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted">
          Threads
        </p>
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setActiveSession(session.id)}
            className={clsx(
              "flex w-full items-center gap-2 truncate rounded-md px-3 py-2 text-left text-sm transition",
              session.id === activeSessionId
                ? "bg-accent/15 text-foreground"
                : "text-foreground/70 hover:bg-panel-elevated"
            )}
          >
            <MessageSquare size={14} className="shrink-0 text-muted" />
            <span className="truncate">{session.title}</span>
          </button>
        ))}
        {sessions.length === 0 && (
          <p className="px-3 py-2 text-xs text-muted">No threads yet. Start one above.</p>
        )}
      </nav>
    </aside>
  );
}

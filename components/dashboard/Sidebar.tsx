"use client";

import { Plus, MessageSquare } from "lucide-react";
import clsx from "clsx";
import { useDashboardStore } from "@/lib/store/useDashboardStore";

export function Sidebar() {
  const sessions = useDashboardStore((s) => s.sessions);
  const activeSessionId = useDashboardStore((s) => s.activeSessionId);
  const createSession = useDashboardStore((s) => s.createSession);
  const setActiveSession = useDashboardStore((s) => s.setActiveSession);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-panel">
      <div className="p-3">
        <button
          onClick={() => createSession("general")}
          className="flex w-full items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent/10"
        >
          <Plus size={16} />
          New chat
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setActiveSession(session.id)}
            className={clsx(
              "flex w-full items-center gap-2 truncate rounded-md px-3 py-2 text-left text-sm",
              session.id === activeSessionId
                ? "bg-accent/20 text-foreground"
                : "text-foreground/70 hover:bg-accent/10"
            )}
          >
            <MessageSquare size={14} className="shrink-0" />
            <span className="truncate">{session.title}</span>
          </button>
        ))}
        {sessions.length === 0 && (
          <p className="px-3 py-2 text-xs text-foreground/50">
            No chats yet. Start a new one.
          </p>
        )}
      </nav>
    </aside>
  );
}

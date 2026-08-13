"use client";

import { FormEvent, useState } from "react";
import { nanoid } from "nanoid";
import { Send } from "lucide-react";
import { useDashboardStore } from "@/lib/store/useDashboardStore";
import { ChatMessage } from "@/lib/models/types";

export function ChatWindow() {
  const [input, setInput] = useState("");
  const activeSessionId = useDashboardStore((s) => s.activeSessionId);
  const sessions = useDashboardStore((s) => s.sessions);
  const addMessage = useDashboardStore((s) => s.addMessage);
  const isSending = useDashboardStore((s) => s.isSending);
  const setSending = useDashboardStore((s) => s.setSending);
  const createSession = useDashboardStore((s) => s.createSession);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;

    const sessionId = activeSessionId ?? createSession("general");
    const session = sessions.find((s) => s.id === sessionId);
    const agentId = session?.agentId ?? "general";

    const userMessage: ChatMessage = {
      id: nanoid(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    addMessage(sessionId, userMessage);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentId,
          messages: [...(session?.messages ?? []), userMessage],
        }),
      });
      const data = await res.json();
      if (data.reply) addMessage(sessionId, data.reply);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-6">
        {!activeSession || activeSession.messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-foreground/40">
            Start a conversation to see it here.
          </div>
        ) : (
          activeSession.messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-auto max-w-lg rounded-2xl bg-accent px-4 py-2 text-sm text-white"
                  : "mr-auto max-w-lg rounded-2xl bg-panel px-4 py-2 text-sm text-foreground"
              }
            >
              {message.content}
            </div>
          ))
        )}
        {isSending && (
          <div className="mr-auto max-w-lg rounded-2xl bg-panel px-4 py-2 text-sm text-foreground/50">
            Thinking...
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message your assistant..."
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={isSending}
          className="flex items-center justify-center rounded-lg bg-accent p-2 text-white disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

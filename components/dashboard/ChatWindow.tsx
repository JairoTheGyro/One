"use client";

import { FormEvent, useState } from "react";
import { nanoid } from "nanoid";
import { Send, Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useDashboardStore } from "@/lib/store/useDashboardStore";
import { ChatMessage } from "@/lib/models/types";

export function ChatWindow() {
  const [input, setInput] = useState("");
  const activeSessionId = useDashboardStore((s) => s.activeSessionId);
  const sessions = useDashboardStore((s) => s.sessions);
  const selectedModelId = useDashboardStore((s) => s.selectedModelId);
  const addMessage = useDashboardStore((s) => s.addMessage);
  const updateMessage = useDashboardStore((s) => s.updateMessage);
  const renameSession = useDashboardStore((s) => s.renameSession);
  const isSending = useDashboardStore((s) => s.isSending);
  const setSending = useDashboardStore((s) => s.setSending);
  const createSession = useDashboardStore((s) => s.createSession);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;

    const sessionId = activeSessionId ?? createSession("general", selectedModelId);
    // Read fresh state: `sessions` from the render closure won't include a
    // session created just above in this same call.
    const session = useDashboardStore.getState().sessions.find((s) => s.id === sessionId);
    const agentId = session?.agentId ?? "general";
    const modelId = session?.modelId ?? selectedModelId;

    if (session && session.messages.length === 0) {
      renameSession(sessionId, text.slice(0, 48));
    }

    const userMessage: ChatMessage = {
      id: nanoid(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    addMessage(sessionId, userMessage);
    setInput("");
    setSending(true);

    const assistantMessageId = nanoid();
    addMessage(sessionId, {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    });

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentId,
          modelId,
          messages: [...(session?.messages ?? []), userMessage],
        }),
      });

      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let separatorIndex;
        while ((separatorIndex = buffer.indexOf("\n\n")) >= 0) {
          const rawEvent = buffer.slice(0, separatorIndex);
          buffer = buffer.slice(separatorIndex + 2);

          const dataLine = rawEvent.split("\n").find((line) => line.startsWith("data:"));
          if (!dataLine) continue;

          const event = JSON.parse(dataLine.slice(5).trim());
          if (event.type === "chunk") {
            full += event.delta;
            updateMessage(sessionId, assistantMessageId, full);
          } else if (event.type === "error") {
            updateMessage(sessionId, assistantMessageId, `⚠️ ${event.error}`);
          }
        }
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
        {!activeSession || activeSession.messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <Sparkles size={20} className="text-accent" />
            <p className="text-sm text-muted">
              Start a conversation with your local or cloud model.
            </p>
          </div>
        ) : (
          activeSession.messages.map((message) => (
            <div
              key={message.id}
              className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
            >
              <div className="flex max-w-2xl items-start gap-2">
                {message.role === "assistant" && (
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Sparkles size={12} />
                  </div>
                )}
                <div
                  className={
                    message.role === "user"
                      ? "rounded-2xl rounded-tr-sm bg-accent px-4 py-2.5 text-sm text-white"
                      : "rounded-2xl rounded-tl-sm border border-border bg-panel px-4 py-2.5 text-sm text-foreground"
                  }
                >
                  {message.role === "assistant" ? (
                    message.content ? (
                      <div className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-pre:bg-panel-elevated prose-pre:text-foreground">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <span className="text-muted">{isSending ? "…" : ""}</span>
                    )
                  ) : (
                    message.content
                  )}
                </div>
                {message.role === "user" && (
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-panel-elevated text-muted">
                    <User size={12} />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border bg-background px-6 py-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message your assistant..."
          className="flex-1 rounded-lg border border-border bg-panel px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={isSending}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-white transition hover:opacity-90 disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

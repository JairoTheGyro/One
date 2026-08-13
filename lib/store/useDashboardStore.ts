import { create } from "zustand";
import { nanoid } from "nanoid";
import { ChatMessage, ModelConfig } from "@/lib/models/types";

export interface ChatSession {
  id: string;
  title: string;
  agentId: string;
  messages: ChatMessage[];
  createdAt: number;
}

interface DashboardState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  models: ModelConfig[];
  isSending: boolean;

  setModels: (models: ModelConfig[]) => void;
  createSession: (agentId: string) => string;
  setActiveSession: (sessionId: string) => void;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  updateMessage: (sessionId: string, messageId: string, content: string) => void;
  setSending: (isSending: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  sessions: [],
  activeSessionId: null,
  models: [],
  isSending: false,

  setModels: (models) => set({ models }),

  createSession: (agentId) => {
    const id = nanoid();
    const session: ChatSession = {
      id,
      title: "New chat",
      agentId,
      messages: [],
      createdAt: Date.now(),
    };
    set((state) => ({
      sessions: [session, ...state.sessions],
      activeSessionId: id,
    }));
    return id;
  },

  setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),

  addMessage: (sessionId, message) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s
      ),
    })),

  updateMessage: (sessionId, messageId, content) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: s.messages.map((m) =>
                m.id === messageId ? { ...m, content } : m
              ),
            }
          : s
      ),
    })),

  setSending: (isSending) => set({ isSending }),
}));

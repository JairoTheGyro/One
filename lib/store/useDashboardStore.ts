import { create } from "zustand";
import { nanoid } from "nanoid";
import { ChatMessage, ModelConfig } from "@/lib/models/types";

export interface ChatSession {
  id: string;
  title: string;
  agentId: string;
  modelId: string;
  messages: ChatMessage[];
  createdAt: number;
}

export interface DocumentRef {
  id: string;
  name: string;
}

export interface MemoryNote {
  id: string;
  text: string;
  createdAt: number;
}

interface DashboardState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  models: ModelConfig[];
  selectedModelId: string;
  isSending: boolean;
  documents: DocumentRef[];
  notes: MemoryNote[];

  setModels: (models: ModelConfig[]) => void;
  setSelectedModel: (modelId: string) => void;
  createSession: (agentId: string, modelId: string) => string;
  setActiveSession: (sessionId: string) => void;
  renameSession: (sessionId: string, title: string) => void;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  updateMessage: (sessionId: string, messageId: string, content: string) => void;
  setSending: (isSending: boolean) => void;
  addDocument: (name: string) => void;
  removeDocument: (id: string) => void;
  addNote: (text: string) => void;
  removeNote: (id: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  sessions: [],
  activeSessionId: null,
  models: [],
  selectedModelId: "local-llama",
  isSending: false,
  documents: [],
  notes: [],

  setModels: (models) => set({ models }),

  setSelectedModel: (modelId) => set({ selectedModelId: modelId }),

  createSession: (agentId, modelId) => {
    const id = nanoid();
    const session: ChatSession = {
      id,
      title: "New thread",
      agentId,
      modelId,
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

  renameSession: (sessionId, title) =>
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, title } : s)),
    })),

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

  addDocument: (name) =>
    set((state) => ({
      documents: [...state.documents, { id: nanoid(), name }],
    })),

  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
    })),

  addNote: (text) =>
    set((state) => ({
      notes: [{ id: nanoid(), text, createdAt: Date.now() }, ...state.notes],
    })),

  removeNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
    })),
}));

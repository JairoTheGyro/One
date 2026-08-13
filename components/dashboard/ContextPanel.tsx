"use client";

import { FormEvent, useState } from "react";
import { ChevronsLeft, ChevronsRight, FileText, Plus, StickyNote, X } from "lucide-react";
import { useDashboardStore } from "@/lib/store/useDashboardStore";

export function ContextPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  const documents = useDashboardStore((s) => s.documents);
  const notes = useDashboardStore((s) => s.notes);
  const addDocument = useDashboardStore((s) => s.addDocument);
  const removeDocument = useDashboardStore((s) => s.removeDocument);
  const addNote = useDashboardStore((s) => s.addNote);
  const removeNote = useDashboardStore((s) => s.removeNote);

  function handleAddDocument() {
    const name = window.prompt("Document name")?.trim();
    if (name) addDocument(name);
  }

  function handleAddNote(e: FormEvent) {
    e.preventDefault();
    const text = noteDraft.trim();
    if (!text) return;
    addNote(text);
    setNoteDraft("");
  }

  if (collapsed) {
    return (
      <aside className="flex h-full w-12 flex-col items-center gap-4 border-l border-border bg-panel py-4">
        <button
          onClick={() => setCollapsed(false)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted transition hover:bg-panel-elevated hover:text-foreground"
          title="Expand context panel"
        >
          <ChevronsLeft size={16} />
        </button>
        <FileText size={16} className="text-muted" />
        <StickyNote size={16} className="text-muted" />
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-80 flex-col border-l border-border bg-panel">
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <p className="text-sm font-semibold text-foreground">Context</p>
        <button
          onClick={() => setCollapsed(true)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:bg-panel-elevated hover:text-foreground"
          title="Collapse context panel"
        >
          <ChevronsRight size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <section className="border-b border-border px-4 py-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
              <FileText size={12} />
              Active documents
            </h3>
            <button
              onClick={handleAddDocument}
              className="flex h-6 w-6 items-center justify-center rounded text-muted transition hover:bg-panel-elevated hover:text-accent"
              title="Attach document"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-1.5">
            {documents.length === 0 && (
              <p className="text-xs text-muted">No documents attached.</p>
            )}
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group flex items-center justify-between rounded-md bg-panel-elevated px-2.5 py-1.5 text-xs text-foreground"
              >
                <span className="truncate">{doc.name}</span>
                <button
                  onClick={() => removeDocument(doc.id)}
                  className="text-muted opacity-0 transition group-hover:opacity-100 hover:text-danger"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 py-4">
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted">
            <StickyNote size={12} />
            Persistent memory
          </h3>
          <form onSubmit={handleAddNote} className="mb-3 flex gap-1.5">
            <input
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Remember something..."
              className="flex-1 rounded-md border border-border bg-panel-elevated px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/20 text-accent transition hover:bg-accent/30"
            >
              <Plus size={14} />
            </button>
          </form>
          <div className="space-y-1.5">
            {notes.length === 0 && (
              <p className="text-xs text-muted">No memory notes yet.</p>
            )}
            {notes.map((note) => (
              <div
                key={note.id}
                className="group flex items-start justify-between gap-2 rounded-md bg-panel-elevated px-2.5 py-1.5 text-xs text-foreground"
              >
                <span>{note.text}</span>
                <button
                  onClick={() => removeNote(note.id)}
                  className="shrink-0 text-muted opacity-0 transition group-hover:opacity-100 hover:text-danger"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

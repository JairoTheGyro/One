"use client";

import { useEffect, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useDashboardStore } from "@/lib/store/useDashboardStore";

export function ModelSwitcher() {
  const models = useDashboardStore((s) => s.models);
  const setModels = useDashboardStore((s) => s.setModels);
  const selectedModelId = useDashboardStore((s) => s.selectedModelId);
  const setSelectedModel = useDashboardStore((s) => s.setSelectedModel);

  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => setModels(data.models ?? []))
      .catch(() => setModels([]));
  }, [setModels]);

  useEffect(() => {
    if (models.length === 0) return;
    if (models.some((m) => m.id === selectedModelId)) return;
    const preferred = models.find((m) => m.connected) ?? models[0];
    setSelectedModel(preferred.id);
  }, [models, selectedModelId, setSelectedModel]);

  const localModels = useMemo(() => models.filter((m) => m.provider === "ollama"), [models]);
  const cloudModels = useMemo(() => models.filter((m) => m.provider !== "ollama"), [models]);

  return (
    <div className="space-y-1.5">
      <label className="px-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">
        Active model
      </label>
      <div className="relative">
        <select
          value={selectedModelId}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full appearance-none rounded-md border border-border bg-panel-elevated px-3 py-2 pr-8 text-sm text-foreground outline-none focus:border-accent"
        >
          {localModels.length > 0 && (
            <optgroup label="Local · Ollama">
              {localModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                  {!model.connected ? " (offline)" : ""}
                </option>
              ))}
            </optgroup>
          )}
          {cloudModels.length > 0 && (
            <optgroup label="Cloud · Claude">
              {cloudModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                  {!model.connected ? " (not configured)" : ""}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import clsx from "clsx";
import { useDashboardStore } from "@/lib/store/useDashboardStore";

export function ModelSelector() {
  const models = useDashboardStore((s) => s.models);
  const setModels = useDashboardStore((s) => s.setModels);

  useEffect(() => {
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => setModels(data.models ?? []))
      .catch(() => setModels([]));
  }, [setModels]);

  return (
    <div className="flex items-center gap-2">
      {models.map((model) => (
        <span
          key={model.id}
          title={model.connected ? "Connected" : "Not configured"}
          className={clsx(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
            model.connected
              ? "border-accent/40 text-foreground"
              : "border-border text-foreground/40"
          )}
        >
          <span
            className={clsx(
              "h-1.5 w-1.5 rounded-full",
              model.connected ? "bg-emerald-500" : "bg-foreground/30"
            )}
          />
          {model.label}
        </span>
      ))}
    </div>
  );
}

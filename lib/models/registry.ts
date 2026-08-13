import { ModelConfig } from "./types";

/**
 * Static registry of models available to the dashboard. In a real deployment
 * this could be persisted (DB/file) and mutated as users connect providers.
 */
export const modelRegistry: ModelConfig[] = [
  {
    id: "claude-sonnet",
    provider: "anthropic",
    label: "Claude Sonnet",
    apiModel: "claude-sonnet-5",
    connected: Boolean(process.env.ANTHROPIC_API_KEY),
  },
  {
    id: "gpt-4o",
    provider: "openai",
    label: "GPT-4o",
    apiModel: "gpt-4o",
    connected: Boolean(process.env.OPENAI_API_KEY),
  },
  {
    id: "local-llama",
    provider: "ollama",
    label: "Llama (local)",
    apiModel: "llama3",
    baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    connected: Boolean(process.env.OLLAMA_BASE_URL),
  },
];

export function getModel(modelId: string): ModelConfig | undefined {
  return modelRegistry.find((m) => m.id === modelId);
}

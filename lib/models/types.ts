export type ModelProvider = "anthropic" | "openai" | "ollama";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
}

export interface ModelConfig {
  id: string;
  provider: ModelProvider;
  label: string;
  /** Model identifier sent to the provider API, e.g. "claude-sonnet-5" */
  apiModel: string;
  /** Base URL override, used for local/self-hosted providers like Ollama */
  baseUrl?: string;
  connected: boolean;
}

export interface CompletionRequest {
  modelId: string;
  messages: ChatMessage[];
}

export interface CompletionResult {
  content: string;
}

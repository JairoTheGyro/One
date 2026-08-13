import { ChatMessage } from "@/lib/models/types";

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  /** Model the agent runs on, by registry id */
  modelId: string;
  systemPrompt: string;
}

export interface AgentRunResult {
  agentId: string;
  reply: ChatMessage;
}

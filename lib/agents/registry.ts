import { AgentDefinition } from "./types";

export const agentRegistry: AgentDefinition[] = [
  {
    id: "general",
    name: "General Assistant",
    description: "A helpful, general-purpose chat assistant.",
    modelId: "claude-sonnet",
    systemPrompt: "You are a helpful, concise assistant.",
  },
  {
    id: "researcher",
    name: "Researcher",
    description: "Digs into a topic and summarizes findings with sources.",
    modelId: "claude-sonnet",
    systemPrompt:
      "You are a research assistant. Be thorough, cite reasoning, and stay factual.",
  },
];

export function getAgent(agentId: string): AgentDefinition | undefined {
  return agentRegistry.find((a) => a.id === agentId);
}

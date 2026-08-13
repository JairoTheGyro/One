import { ChatMessage } from "@/lib/models/types";
import { getModel } from "@/lib/models/registry";
import { providers } from "@/lib/models/providers";
import { getAgent } from "./registry";
import { AgentRunResult } from "./types";
import { nanoid } from "nanoid";

export async function runAgent(
  agentId: string,
  messages: ChatMessage[]
): Promise<AgentRunResult> {
  const agent = getAgent(agentId);
  if (!agent) throw new Error(`Unknown agent: ${agentId}`);

  const model = getModel(agent.modelId);
  if (!model) throw new Error(`Unknown model: ${agent.modelId}`);

  const provider = providers[model.provider];
  const systemMessage: ChatMessage = {
    id: "system",
    role: "system",
    content: agent.systemPrompt,
    createdAt: Date.now(),
  };

  const result = await provider.complete(model, [systemMessage, ...messages]);

  return {
    agentId: agent.id,
    reply: {
      id: nanoid(),
      role: "assistant",
      content: result.content,
      createdAt: Date.now(),
    },
  };
}

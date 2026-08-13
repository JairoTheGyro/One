import { NextRequest } from "next/server";
import { generateStream } from "@/lib/models/router";
import { getAgent } from "@/lib/agents/registry";
import { ChatMessage } from "@/lib/models/types";

interface StreamRequestBody {
  agentId: string;
  messages: ChatMessage[];
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as StreamRequestBody;

  if (!body?.agentId || !Array.isArray(body?.messages)) {
    return new Response(
      JSON.stringify({ error: "Request must include agentId and messages[]" }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  const agent = getAgent(body.agentId);
  if (!agent) {
    return new Response(JSON.stringify({ error: `Unknown agent: ${body.agentId}` }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const systemMessage: ChatMessage = {
    id: "system",
    role: "system",
    content: agent.systemPrompt,
    createdAt: Date.now(),
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generateStream(agent.modelId, [
          systemMessage,
          ...body.messages,
        ])) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          if (chunk.type === "done" || chunk.type === "error") break;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", error: message })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}

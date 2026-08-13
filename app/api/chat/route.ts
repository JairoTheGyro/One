import { NextRequest, NextResponse } from "next/server";
import { runAgent } from "@/lib/agents/runAgent";
import { ChatMessage } from "@/lib/models/types";

interface ChatRequestBody {
  agentId: string;
  messages: ChatMessage[];
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ChatRequestBody;

  if (!body?.agentId || !Array.isArray(body?.messages)) {
    return NextResponse.json(
      { error: "Request must include agentId and messages[]" },
      { status: 400 }
    );
  }

  try {
    const result = await runAgent(body.agentId, body.messages);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

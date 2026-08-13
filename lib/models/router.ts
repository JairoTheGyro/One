import { ChatMessage, ModelConfig } from "./types";
import { getModel } from "./registry";

/**
 * Unified streaming chunk shape emitted by every provider, so the frontend
 * only ever has to understand one format regardless of which model answered.
 */
export type StreamChunk =
  | { type: "chunk"; delta: string }
  | { type: "done"; content: string }
  | { type: "error"; error: string };

/**
 * Routes a chat completion to the right provider (local Ollama or cloud
 * Anthropic) and yields a stream of unified chunks.
 */
export async function* generateStream(
  modelId: string,
  messages: ChatMessage[]
): AsyncGenerator<StreamChunk> {
  const model = getModel(modelId);
  if (!model) {
    yield { type: "error", error: `Unknown model: ${modelId}` };
    return;
  }

  switch (model.provider) {
    case "anthropic":
      yield* streamAnthropic(model, messages);
      return;
    case "ollama":
      yield* streamOllama(model, messages);
      return;
    default:
      yield {
        type: "error",
        error: `Streaming is not supported for provider: ${model.provider}`,
      };
  }
}

async function* streamAnthropic(
  model: ModelConfig,
  messages: ChatMessage[]
): AsyncGenerator<StreamChunk> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    yield { type: "error", error: "ANTHROPIC_API_KEY is not configured" };
    return;
  }

  const systemPrompt = messages.find((m) => m.role === "system")?.content;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model.apiModel,
      max_tokens: 1024,
      stream: true,
      system: systemPrompt,
      messages: messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok || !res.body) {
    yield {
      type: "error",
      error: `Anthropic API error: ${res.status} ${await res.text()}`,
    };
    return;
  }

  let full = "";
  for await (const event of parseSSE(res.body)) {
    if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
      const delta: string = event.delta.text ?? "";
      if (!delta) continue;
      full += delta;
      yield { type: "chunk", delta };
    } else if (event.type === "error") {
      yield { type: "error", error: event.error?.message ?? "Anthropic stream error" };
      return;
    }
  }
  yield { type: "done", content: full };
}

async function* streamOllama(
  model: ModelConfig,
  messages: ChatMessage[]
): AsyncGenerator<StreamChunk> {
  const baseUrl = model.baseUrl ?? "http://localhost:11434";

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: model.apiModel,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    }),
  });

  if (!res.ok || !res.body) {
    yield {
      type: "error",
      error: `Ollama error: ${res.status} ${await res.text()}`,
    };
    return;
  }

  let full = "";
  for await (const line of readNdjsonLines(res.body)) {
    const delta: string = line.message?.content ?? "";
    if (delta) {
      full += delta;
      yield { type: "chunk", delta };
    }
    if (line.done) {
      yield { type: "done", content: full };
      return;
    }
  }
  yield { type: "done", content: full };
}

/** Parses a Server-Sent Events body (used by Anthropic) into JSON payloads. */
async function* parseSSE(body: ReadableStream<Uint8Array>): AsyncGenerator<any> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let separatorIndex;
    while ((separatorIndex = buffer.indexOf("\n\n")) >= 0) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);

      const dataLine = rawEvent.split("\n").find((line) => line.startsWith("data:"));
      if (!dataLine) continue;

      const jsonStr = dataLine.slice(5).trim();
      if (!jsonStr || jsonStr === "[DONE]") continue;

      try {
        yield JSON.parse(jsonStr);
      } catch {
        // ignore malformed/partial event
      }
    }
  }
}

/** Parses newline-delimited JSON (used by Ollama) into JSON payloads. */
async function* readNdjsonLines(body: ReadableStream<Uint8Array>): AsyncGenerator<any> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex;
    while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (!line) continue;

      try {
        yield JSON.parse(line);
      } catch {
        // ignore malformed/partial line
      }
    }
  }
}

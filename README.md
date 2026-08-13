# One

An open-source, self-hosted AI dashboard for chatting with and orchestrating multiple LLMs and agents — inspired by [Odysseus](https://github.com/odysseus-dev/odysseus).

## Stack

- **Next.js (App Router) + TypeScript** — frontend and API routes in one project
- **Tailwind CSS** — styling
- **Zustand** — lightweight state management for chat sessions and connected models
- Provider-agnostic model layer supporting Anthropic, OpenAI, and self-hosted Ollama models

## Getting started

```bash
npm install
cp .env.example .env.local   # add your provider API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/
  api/
    chat/route.ts       # POST endpoint that runs an agent against a model
    models/route.ts      # GET endpoint listing configured/connected models
  layout.tsx
  page.tsx
components/
  dashboard/
    Header.tsx
    Sidebar.tsx
    ChatWindow.tsx
    ModelSelector.tsx
lib/
  models/                # model registry + provider adapters (Anthropic/OpenAI/Ollama)
  agents/                 # agent definitions + orchestration
  store/                  # Zustand store for sessions & connected models
```

## Adding a model

Edit `lib/models/registry.ts` to add a new `ModelConfig`, and implement/extend its provider adapter in `lib/models/providers.ts`.

## Adding an agent

Edit `lib/agents/registry.ts` to add a new `AgentDefinition` with a system prompt and backing model.

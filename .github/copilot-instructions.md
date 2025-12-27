# GenTel™ AI Coding Instructions

## Architecture Overview
GenTel™ is a Next.js 15 (App Router) application built on the **OpenAI Responses API** for real-time streaming.
- **AI Engine**: Uses `openai.responses.create` with `stream: true` in [app/api/turn_response/route.ts](../app/api/turn_response/route.ts).
- **State Management**: Zustand stores in [stores/](../stores/). `useConversationStore` separates `chatMessages` (UI display) from `conversationItems` (API payload).
- **Styling**: Tailwind CSS with a "Midnight" dark theme. Use `dark:` classes sparingly as the app is dark-mode by default.

## Critical Patterns

### 1. Adding a New Tool (Function Calling)
Follow this 4-step sequence to add a new capability:
1. **Define**: Add the tool schema to `toolsList` in [config/tools-list.ts](../config/tools-list.ts).
2. **Map**: Add an async implementation function and update `functionsMap` in [config/functions.ts](../config/functions.ts).
3. **Implement**: Create a corresponding API route in [app/api/functions/](../app/api/functions/) to handle the logic.
4. **Handle**: Ensure [lib/tools/tools-handling.ts](../lib/tools/tools-handling.ts) correctly routes the call.

### 2. Streaming & SSE
The backend emits Server-Sent Events (SSE).
- **Backend**: [app/api/turn_response/route.ts](../app/api/turn_response/route.ts) uses `ReadableStream` to pipe OpenAI events.
- **Frontend**: [lib/assistant.ts](../lib/assistant.ts) handles the stream, parsing partial JSON and updating the Zustand store.

### 3. OAuth & Security
- **State Signing**: Always use `signState` and `verifyState` from [lib/oauth.ts](../lib/oauth.ts) for OAuth flows to prevent CSRF.
- **PKCE**: Required for Google integration. Use `generateCodeVerifier` and `generateCodeChallenge`.
- **Logging**: Use structured logging via `logRequest` or `logError` in [lib/logger.ts](../lib/logger.ts). Avoid plain `console.log` in production code.

## Directory Map
- [app/api/functions/](../app/api/functions/): Internal tool implementations.
- [components/](../components/): UI components (Radix UI + Tailwind).
- [lib/tools/](../lib/tools/): Core tool orchestration logic.
- [config/](../config/): Centralized constants and tool definitions.

## Development Workflow
- **Build**: `npm run build` (Next.js standalone build).
- **Environment**: Managed via `.env`. Key secrets: `OAUTH_STATE_SECRET`, `OPENAI_API_KEY`.
- **Icons**: Use `lucide-react`.

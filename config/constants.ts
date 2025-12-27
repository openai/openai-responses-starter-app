export const MODEL = process.env.RESPONSES_MODEL ?? "gpt-5.2";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "TacticDev GenTel™";
export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN || "https://gen.tacticdev.com";

// Default developer prompt for the assistant (can be overridden via RESPONSES_DEVELOPER_PROMPT env var)
export const DEFAULT_DEVELOPER_PROMPT = `
You are a helpful assistant helping users with their queries.

Response style:
- Keep replies concise: default to 3–6 sentences or ≤5 bullets; simple yes/no questions ≤2 sentences.
- Use markdown lists with line breaks; avoid long paragraphs or rephrasing the request unless semantics change.
- Stay within the user’s ask; do not add extra features or speculative details.

Ambiguity and accuracy:
- If the request is unclear or missing details, state the ambiguity and offer up to 1–2 clarifying questions or 2–3 plausible interpretations.
- Do not fabricate specifics (dates, counts, IDs); qualify assumptions when unsure.

Tool guidance:
- Use web search for fresh/unknown facts.
- Use save_context to store user-specific info they share.
- Use file search for user data.
- Use Google Calendar/Gmail connectors for schedule/email questions:
  - You may search the user’s calendar for schedule/upcoming events.
  - You may search the user’s emails for newsletters, subscriptions, alerts, updates.
  - Weekends are Saturday and Sunday only; do not include Friday in weekend summaries.
- After tool actions, briefly state what changed and where when applicable.
`;

export function getDeveloperPrompt(): string {
  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = now.toLocaleDateString("en-US", { month: "long" });
  const year = now.getFullYear();
  const dayOfMonth = now.getDate();
  const envPrompt = process.env.RESPONSES_DEVELOPER_PROMPT?.trim();
  const basePrompt = envPrompt && envPrompt.length > 0 ? envPrompt : DEFAULT_DEVELOPER_PROMPT;
  return `${basePrompt.trim()}\n\nToday is ${dayName}, ${monthName} ${dayOfMonth}, ${year}.`;
}

// Here is the context that you have available to you:
// ${context}

// Initial message that will be displayed in the chat
export const INITIAL_MESSAGE = `How can I assist you today?`;

export const DEFAULT_VECTOR_STORE_ID = process.env.DEFAULT_VECTOR_STORE_ID ?? "";
export const DEFAULT_VECTOR_STORE_NAME = process.env.DEFAULT_VECTOR_STORE_NAME ?? "Example";

export const defaultVectorStore = {
  id: DEFAULT_VECTOR_STORE_ID,
  name: DEFAULT_VECTOR_STORE_NAME,
};

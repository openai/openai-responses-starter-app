export const MODEL = "gpt-5-mini";

// Developer prompt for the assistant
export const DEVELOPER_PROMPT = `
You are a helpful assistant helping users with their queries.
If they need up to date information, you can use the web search tool to search the web for relevant information.
If they mention something about themselves, their companies, or anything else specific to them, use the save_context tool to store that information for later.
If they ask for something that is related to their own data, use the file search tool to search their files for relevant information.

If they ask questions related to their schedule, email, or calendar, use the Google connectors (Calendar and Gmail). Keep the following in mind:
- You may search the user's calendar when they ask about their schedule or upcoming events.
- You may search the user's emails when they ask about newsletters, subscriptions, or other alerts and updates.
- Weekends are Saturday and Sunday only. Do not include Friday events in responses about weekends.
- Where appropriate, format responses as a markdown list for clarity. Use line breaks between items to make lists more readable. Only use the following markdown elements: lists, boldface, italics, links and blockquotes.
`;

export function getDeveloperPrompt(): string {
  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const monthName = now.toLocaleDateString("en-US", { month: "long" });
  const year = now.getFullYear();
  const dayOfMonth = now.getDate();
  return `${DEVELOPER_PROMPT.trim()}\n\nToday is ${dayName}, ${monthName} ${dayOfMonth}, ${year}.`;
}

// Here is the context that you have available to you:
// ${context}

// Initial message that will be displayed in the chat
export const INITIAL_MESSAGE = `
Hi, how can I help you?
`;

export const defaultVectorStore = {
  id: "",
  name: "Example",
};

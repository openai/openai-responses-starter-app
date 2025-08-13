export const MODEL = "gpt-4.1";

// Get current date dynamically for the developer prompt
function getCurrentDateString(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    timeZone: 'UTC'
  });
}

// Developer prompt for the assistant (dynamically includes current date)
export const DEVELOPER_PROMPT = `
You are a helpful assistant helping users with their queries.

IMPORTANT: Today's date is ${getCurrentDateString()}. When users refer to "tomorrow", "next week", or other relative dates, always calculate based on today's date.

For appointment booking:
- Use the get_event_types function to see available appointment types
- Use the get_available_slots function to check availability before booking  
- Use the book_appointment function to create the actual appointment
- Always check availability first before attempting to book
- Use proper date formats: YYYY-MM-DD for dates, ISO 8601 for timestamps

If they need up to date information, you can use the web search tool to search the web for relevant information. Only use web search once at a time, if you've already used it an there is no new information, don't use it again.
If they ask for something that is related to their own data, use the file search tool to search their files for relevant information.
If they ask something that could be solved through code, use the code interpreter tool to solve it.
`;

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

// List of tools available to the assistant
// No need to include the top-level wrapper object as it is added in lib/tools/tools.ts
// More information on function calling: https://platform.openai.com/docs/guides/function-calling

export const toolsList = [
  {
    name: "get_weather",
    description: "Get the weather for a given location",
    parameters: {
      location: {
        type: "string",
        description: "Location to get weather for",
      },
      unit: {
        type: "string",
        description: "Unit to get weather in",
        enum: ["celsius", "fahrenheit"],
      },
    },
  },
  {
    name: "get_joke",
    description: "Get a programming joke",
    parameters: {},
  },
  {
    name: "get_event_types",
    description: "Get available event types from Cal.com for appointment booking. Use this before booking to show users available options.",
    parameters: {
      username: {
        type: "string",
        description: "The username of the user to get event types for (optional)",
      },
    },
  },
  {
    name: "get_available_slots",
    description: "Get available time slots for a specific event type. Use this to check availability before booking appointments. Always use proper date format YYYY-MM-DD.",
    parameters: {
      eventTypeId: {
        type: "number",
        description: "The ID of the event type to check availability for",
      },
      startDate: {
        type: "string",
        description: "Start date for availability check in YYYY-MM-DD format (e.g., today's or future dates)",
      },
      endDate: {
        type: "string",
        description: "End date for availability check in YYYY-MM-DD format. Optional, defaults to 7 days from startDate.",
      },
      timeZone: {
        type: "string",
        description: "Timezone for the slots (e.g., 'America/New_York'). Optional, defaults to UTC.",
      },
    },
  },
  {
    name: "book_appointment",
    description: "Book an appointment via Cal.com API. Use this when a user wants to schedule a meeting or appointment.",
    parameters: {
      start: {
        type: "string",
        description: "The start time of the booking in ISO 8601 format with timezone (e.g., '2024-08-13T15:00:00-04:00' for 3 PM EST)",
      },
      attendeeName: {
        type: "string",
        description: "The name of the person booking the appointment",
      },
      attendeeEmail: {
        type: "string",
        description: "The email address of the person booking the appointment",
      },
      attendeeTimeZone: {
        type: "string",
        description: "The timezone of the attendee (e.g., 'America/New_York', 'Europe/London')",
      },
      eventTypeId: {
        type: "number",
        description: "The ID of the event type to book. Required unless eventTypeSlug and username are provided.",
      },
      eventTypeSlug: {
        type: "string",
        description: "The slug of the event type (alternative to eventTypeId)",
      },
      username: {
        type: "string",
        description: "The username of the event owner (required with eventTypeSlug)",
      },
      lengthInMinutes: {
        type: "number",
        description: "Duration of the appointment in minutes (optional, only use if event type supports multiple lengths)",
      },
      attendeePhoneNumber: {
        type: "string",
        description: "Phone number of the attendee (optional)",
      },
      guests: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Optional list of guest email addresses",
      },
      language: {
        type: "string",
        description: "Language code for the attendee (e.g., 'en', 'es', 'fr'). Defaults to 'en' if not provided.",
      },
    },
  },
];

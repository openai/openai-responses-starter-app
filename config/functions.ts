// Functions mapping to tool calls
// Define one function per tool call - each tool call should have a matching function
// Parameters for a tool call are passed as an object to the corresponding function

export const get_weather = async ({
  location,
  unit,
}: {
  location: string;
  unit: string;
}) => {
  console.log("location", location);
  console.log("unit", unit);
  const res = await fetch(
    `/api/functions/get_weather?location=${location}&unit=${unit}`
  ).then((res) => res.json());

  console.log("executed get_weather function", res);

  return res;
};

export const get_joke = async () => {
  const res = await fetch(`/api/functions/get_joke`).then((res) => res.json());
  return res;
};

export const get_event_types = async ({
  username,
}: {
  username?: string;
} = {}) => {
  console.log("Getting event types with parameters:", { username });

  const params = new URLSearchParams();
  // Only add username if it's provided and looks like a valid Cal.com username
  if (username && username.includes('-')) {
    params.append('username', username);
  }
  // If no username provided, the API will use the default from environment variables

  const url = `/api/functions/get_event_types${params.toString() ? '?' + params.toString() : ''}`;
  
  const res = await fetch(url).then((res) => res.json());

  console.log("Event types result:", res);

  return res;
};

export const get_available_slots = async ({
  eventTypeId,
  startDate,
  endDate,
  timeZone = "UTC",
}: {
  eventTypeId: number;
  startDate: string;
  endDate?: string;
  timeZone?: string;
}) => {
  console.log("Getting available slots with parameters:", { eventTypeId, startDate, endDate, timeZone });

  const params = new URLSearchParams();
  params.append('eventTypeId', eventTypeId.toString());
  params.append('startDate', startDate);
  if (endDate) {
    params.append('endDate', endDate);
  }
  params.append('timeZone', timeZone);

  const url = `/api/functions/get_available_slots?${params.toString()}`;
  
  const res = await fetch(url).then((res) => res.json());

  console.log("Available slots result:", res);

  return res;
};

export const book_appointment = async ({
  start,
  attendeeName,
  attendeeEmail,
  attendeeTimeZone,
  eventTypeId,
  eventTypeSlug,
  username,
  lengthInMinutes,
  attendeePhoneNumber,
  guests,
  language = "en",
}: {
  start: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeeTimeZone: string;
  eventTypeId?: number;
  eventTypeSlug?: string;
  username?: string;
  lengthInMinutes?: number;
  attendeePhoneNumber?: string;
  guests?: string[];
  language?: string;
}) => {
  console.log("Booking appointment with parameters:", {
    start,
    attendeeName,
    attendeeEmail,
    attendeeTimeZone,
    eventTypeId,
    eventTypeSlug,
    username,
    lengthInMinutes,
    attendeePhoneNumber,
    guests,
    language,
  });

  const res = await fetch(`/api/functions/book_appointment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      start,
      attendeeName,
      attendeeEmail,
      attendeeTimeZone,
      eventTypeId,
      eventTypeSlug,
      username,
      lengthInMinutes,
      attendeePhoneNumber,
      guests,
      language,
    }),
  }).then((res) => res.json());

  console.log("Appointment booking result:", res);

  return res;
};

export const functionsMap = {
  get_weather: get_weather,
  get_joke: get_joke,
  get_event_types: get_event_types,
  get_available_slots: get_available_slots,
  book_appointment: book_appointment,
};

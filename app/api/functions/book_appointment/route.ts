import { NextResponse } from "next/server";
import { parseDateTime } from "@/lib/dateUtils";

export async function POST(request: Request) {
  try {
    const {
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
    } = await request.json();

    // Get Cal.com API key and default username from environment variables
    const calApiKey = process.env.CAL_API_KEY;
    const defaultUsername = process.env.CAL_USERNAME;
    
    if (!calApiKey) {
      return NextResponse.json(
        { error: "Cal.com API key not configured" },
        { status: 500 }
      );
    }

    // Validate required parameters
    if (!start || !attendeeName || !attendeeEmail || !attendeeTimeZone) {
      return NextResponse.json(
        { error: "Missing required parameters: start, attendeeName, attendeeEmail, attendeeTimeZone" },
        { status: 400 }
      );
    }

    // Use provided username or fall back to default
    const targetUsername = username || defaultUsername;

    if (!eventTypeId && (!eventTypeSlug || !targetUsername)) {
      return NextResponse.json(
        { error: "Either eventTypeId or both eventTypeSlug and username must be provided" },
        { status: 400 }
      );
    }

    // Parse and convert start time to UTC format (Cal.com requires UTC without timezone offset)
    let utcStartTime;
    try {
      console.log("Original start time received:", start);
      
      // Try to parse the start time - it might be in ISO format or need parsing
      if (start.includes('T')) {
        // If it's already in ISO format, parse it properly considering timezone
        const inputDate = new Date(start);
        console.log("Parsed input date:", inputDate);
        
        // Extract date and time components
        const year = inputDate.getFullYear();
        const month = inputDate.getMonth();
        const day = inputDate.getDate();
        const hours = inputDate.getHours();
        const minutes = inputDate.getMinutes();
        
        console.log("Date components:", { year, month, day, hours, minutes });
        
        const currentYear = new Date().getFullYear();
        const currentDate = new Date();
        console.log("Current year:", currentYear, "Current date:", currentDate);
        
        // If the parsed date has wrong year or is in the past, correct it
        if (year < currentYear || inputDate < currentDate) {
          console.log("Date appears to be wrong/past, correcting...");
          
          // Calculate tomorrow's date with the desired time
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(hours, minutes, 0, 0);
          
          console.log("Corrected to tomorrow:", tomorrow);
          utcStartTime = tomorrow.toISOString();
        } else {
          console.log("Using original date");
          utcStartTime = inputDate.toISOString();
        }
      } else {
        // Parse natural language (e.g., "tomorrow", "10 AM")
        console.log("Parsing as natural language");
        const parsed = parseDateTime("tomorrow", start, attendeeTimeZone);
        utcStartTime = parsed.utcDateTime;
      }
      
      console.log("Final UTC start time:", utcStartTime);
    } catch (error) {
      console.error("Date parsing error:", error);
      return NextResponse.json(
        { error: "Invalid start time format. Please provide a valid date/time." },
        { status: 400 }
      );
    }

    // Prepare the booking request body
    const bookingData: any = {
      start: utcStartTime,
      attendee: {
        name: attendeeName,
        email: attendeeEmail,
        timeZone: attendeeTimeZone,
        language: language,
      },
      metadata: {},
    };

    // Add optional attendee phone number
    if (attendeePhoneNumber) {
      bookingData.attendee.phoneNumber = attendeePhoneNumber;
    }

    // Add event type identification
    if (eventTypeId) {
      bookingData.eventTypeId = eventTypeId;
    } else {
      bookingData.eventTypeSlug = eventTypeSlug;
      bookingData.username = targetUsername;
    }

    // Don't include lengthInMinutes - Cal.com rejects this for fixed-length events
    // and most event types have fixed lengths

    if (guests && guests.length > 0) {
      bookingData.guests = guests;
    }

    console.log("Sending booking request to Cal.com:", bookingData);

    // Make the request to Cal.com API
    const response = await fetch("https://api.cal.com/v2/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${calApiKey}`,
        "cal-api-version": "2024-08-13",
      },
      body: JSON.stringify(bookingData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Cal.com API error:", result);
      return NextResponse.json(
        {
          error: "Failed to create booking",
          details: result.error || result.message || "Unknown error",
          status: response.status,
        },
        { status: response.status }
      );
    }

    console.log("Cal.com booking successful:", result);

    // Return the booking details
    return NextResponse.json({
      success: true,
      booking: {
        id: result.data.id,
        uid: result.data.uid,
        title: result.data.title,
        start: result.data.start,
        end: result.data.end,
        duration: result.data.duration,
        status: result.data.status,
        meetingUrl: result.data.meetingUrl || result.data.location,
        attendees: result.data.attendees,
        hosts: result.data.hosts,
      },
      message: "Appointment booked successfully!",
    });

  } catch (error) {
    console.error("Error booking appointment:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
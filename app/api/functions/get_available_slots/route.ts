import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventTypeId = searchParams.get('eventTypeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const timeZone = searchParams.get('timeZone') || 'UTC';

    console.log("get_available_slots called with parameters:", { 
      eventTypeId, 
      startDate, 
      endDate, 
      timeZone 
    });

    // Get Cal.com API key from environment variables
    const calApiKey = process.env.CAL_API_KEY;
    if (!calApiKey) {
      return NextResponse.json(
        { error: "Cal.com API key not configured. Please add CAL_API_KEY to your environment variables." },
        { status: 500 }
      );
    }

    // Validate required parameters
    if (!eventTypeId || !startDate) {
      return NextResponse.json(
        { error: "Missing required parameters: eventTypeId and startDate are required" },
        { status: 400 }
      );
    }

    // Validate date format (should be YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate)) {
      console.error("Invalid startDate format:", startDate);
      return NextResponse.json(
        { error: `Invalid startDate format. Expected YYYY-MM-DD, got: ${startDate}` },
        { status: 400 }
      );
    }

    if (endDate && !dateRegex.test(endDate)) {
      console.error("Invalid endDate format:", endDate);
      return NextResponse.json(
        { error: `Invalid endDate format. Expected YYYY-MM-DD, got: ${endDate}` },
        { status: 400 }
      );
    }

    // Check if the date is in the past
    const requestedDate = new Date(startDate + 'T00:00:00Z');
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today
    
    if (requestedDate < today) {
      console.error("Date appears to be in the past:", startDate, "Today:", today.toISOString().split('T')[0]);
      return NextResponse.json(
        { error: `Date appears to be in the past. Got: ${startDate}, today is: ${today.toISOString().split('T')[0]}` },
        { status: 400 }
      );
    }

    // Calculate end date if not provided (default to 7 days from start)
    let finalEndDate = endDate;
    if (!finalEndDate) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      finalEndDate = end.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    }

    // Build the URL for Cal.com Slots API
    const params = new URLSearchParams({
      eventTypeId: eventTypeId,
      start: startDate,
      end: finalEndDate,
      timeZone: timeZone,
      format: 'range' // Get start and end times for each slot
    });

    const apiUrl = `https://api.cal.com/v2/slots?${params.toString()}`;
    
    console.log("Fetching available slots from Cal.com:", apiUrl);

    // Make the request to Cal.com API
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${calApiKey}`,
        "cal-api-version": "2024-09-04",
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Cal.com API error:", result);
      return NextResponse.json(
        {
          error: "Failed to fetch available slots",
          details: result.error || result.message || "Unknown error",
          status: response.status,
        },
        { status: response.status }
      );
    }

    console.log("Cal.com slots fetched successfully:", result);

    // Format the slots for easier use
    const formattedSlots: { [date: string]: any[] } = {};
    let totalSlots = 0;

    if (result.data) {
      Object.keys(result.data).forEach(date => {
        const daySlots = result.data[date];
        if (daySlots && daySlots.length > 0) {
          formattedSlots[date] = daySlots.map((slot: any) => ({
            start: slot.start,
            end: slot.end,
            date: date,
            timeDisplay: new Date(slot.start).toLocaleTimeString('en-US', {
              timeZone: timeZone,
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
          }));
          totalSlots += daySlots.length;
        }
      });
    }

    // Return the formatted slots
    return NextResponse.json({
      success: true,
      slots: formattedSlots,
      totalSlots,
      dateRange: {
        start: startDate,
        end: finalEndDate,
        timeZone: timeZone
      },
      message: totalSlots > 0 
        ? `Found ${totalSlots} available slot(s) between ${startDate} and ${finalEndDate}` 
        : `No available slots found between ${startDate} and ${finalEndDate}`,
    });

  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    // Get Cal.com API key and default username from environment variables
    const calApiKey = process.env.CAL_API_KEY;
    const defaultUsername = process.env.CAL_USERNAME;
    
    if (!calApiKey) {
      return NextResponse.json(
        { error: "Cal.com API key not configured. Please add CAL_API_KEY to your environment variables." },
        { status: 500 }
      );
    }

    // Use provided username or fall back to default username from env
    const targetUsername = username || defaultUsername;

    // Build the URL for Cal.com API
    let apiUrl = "https://api.cal.com/v2/event-types";
    const params = new URLSearchParams();
    
    if (targetUsername) {
      params.append('username', targetUsername);
    }

    if (params.toString()) {
      apiUrl += '?' + params.toString();
    }

    console.log("Fetching event types from Cal.com:", apiUrl);

    // Make the request to Cal.com API
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${calApiKey}`,
        "cal-api-version": "2024-06-14",
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Cal.com API error:", result);
      return NextResponse.json(
        {
          error: "Failed to fetch event types",
          details: result.error || result.message || "Unknown error",
          status: response.status,
        },
        { status: response.status }
      );
    }

    console.log("Cal.com event types fetched successfully:", result);

    // Format the event types for easier selection
    const eventTypes = result.data.map((eventType: any) => ({
      id: eventType.id,
      title: eventType.title,
      slug: eventType.slug,
      description: eventType.description,
      lengthInMinutes: eventType.lengthInMinutes,
      lengthOptions: eventType.lengthInMinutesOptions,
      price: eventType.price,
      currency: eventType.currency,
      locations: eventType.locations,
      ownerId: eventType.ownerId,
      users: eventType.users,
    }));

    // Return the formatted event types
    return NextResponse.json({
      success: true,
      eventTypes,
      count: eventTypes.length,
      message: eventTypes.length > 0 
        ? `Found ${eventTypes.length} available event type(s)` 
        : "No event types found",
    });

  } catch (error) {
    console.error("Error fetching event types:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
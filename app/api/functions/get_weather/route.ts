export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const unit = searchParams.get("unit");

    // 1. Get coordinates for the city
    const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${location}&format=json`);
    const geoData = await geoRes.json();

    if (!geoData.length) {
      return new Response(JSON.stringify({ error: "Invalid location" }), {
        status: 404,
      });
    }

    const { lat, lon } = geoData[0];

    // 2. Fetch weather data from Open-Meteo
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&temperature_unit=${
        unit ?? "celsius"
      }`,
    );

    if (!weatherRes.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const weather = await weatherRes.json();

    // 3. Get current UTC time in ISO format
    const now = new Date();
    const currentHourISO = now.toISOString().slice(0, 13) + ":00";

    // 4. Get current temperature
    const index = weather.hourly.time.indexOf(currentHourISO);
    const currentTemperature = index !== -1 ? weather.hourly.temperature_2m[index] : null;

    if (currentTemperature === null) {
      return new Response(JSON.stringify({ error: "Temperature data unavailable" }), { status: 500 });
    }

    return new Response(JSON.stringify({ temperature: currentTemperature }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error getting weather:", error);
    return new Response(JSON.stringify({ error: "Error getting weather" }), {
      status: 500,
    });
  }
}

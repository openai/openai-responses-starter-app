export async function GET() {
  try {
    // Fetch a programming joke
    const jokeRes = await fetch("https://v2.jokeapi.dev/joke/Programming");
    if (!jokeRes.ok) throw new Error("Failed to fetch joke");

    const jokeData = await jokeRes.json();

    // Format joke response based on its type
    const joke = jokeData.type === "twopart" ? `${jokeData.setup} - ${jokeData.delivery}` : jokeData.joke;

    return new Response(JSON.stringify({ joke }), { status: 200 });
  } catch (error) {
    console.error("Error fetching joke:", error);
    return new Response(JSON.stringify({ error: "Could not fetch joke" }), {
      status: 500,
    });
  }
}

import { ChromaClient } from 'chromadb';

const client = new ChromaClient();

export async function POST(request: Request) {
  const { name } = await request.json();
  try {
    const collection = await client.createCollection({
      name: name,
    });
    return new Response(JSON.stringify({ name: name, message: "Collection created successfully" }), { status: 200 });
  } catch (error) {
    console.error("Error creating collection:", error);
    return new Response("Error creating collection", { status: 500 });
  }
}

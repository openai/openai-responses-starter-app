import { getOpenAIClient } from "@/lib/openai";

export async function POST(request: Request) {
  const { vectorStoreId, fileId } = await request.json();
  const openai = getOpenAIClient();

  if (!openai) {
    return new Response(
      JSON.stringify({ error: "OPENAI_API_KEY is not configured" }),
      { status: 500 }
    );
  }

  try {
    const vectorStore = await openai.vectorStores.files.create(
      vectorStoreId,
      {
        file_id: fileId,
      }
    );
    return new Response(JSON.stringify(vectorStore), { status: 200 });
  } catch (error) {
    console.error("Error adding file:", error);
    return new Response("Error adding file", { status: 500 });
  }
}

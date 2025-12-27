export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("file_id");
  const containerId = searchParams.get("container_id");
  const filename = searchParams.get("filename");
  if (!fileId) {
    return new Response(JSON.stringify({ error: "Missing file_id" }), {
      status: 400,
    });
  }
  try {
    const url = containerId
      ? `https://api.openai.com/v1/containers/${containerId}/files/${fileId}/content`
      : `https://api.openai.com/v1/container-files/${fileId}/content`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY is not configured" }),
        { status: 500 }
      );
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (!res.ok) throw new Error(`Failed to fetch file: ${res.status}`);
    const blob = await res.blob();
    return new Response(blob, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "application/octet-stream",
        "Content-Disposition": `attachment; filename=${filename ?? fileId}`,
      },
    });
  } catch (err) {
    console.error("Error fetching container file", err);
    return new Response(JSON.stringify({ error: "Failed to fetch file" }), {
      status: 500,
    });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getGithubAccessToken } from "@/lib/connectors-auth";

export async function POST(request: NextRequest) {
  const token = await getGithubAccessToken();
  if (!token) {
    return NextResponse.json({ error: "GitHub not connected" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { owner, repo, path, content, message } = body;

    // First, check if the file exists to get the SHA (for updates)
    const getFileResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "TacticDev-Gen-Intel",
        },
      }
    );

    let sha: string | undefined;
    if (getFileResponse.ok) {
      const fileData = await getFileResponse.json();
      sha = fileData.sha;
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": "TacticDev-Gen-Intel",
        },
        body: JSON.stringify({
          message,
          content: Buffer.from(content).toString("base64"),
          sha,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("GitHub Create File Error:", error);
    return NextResponse.json({ error: "Failed to create/update file" }, { status: 500 });
  }
}

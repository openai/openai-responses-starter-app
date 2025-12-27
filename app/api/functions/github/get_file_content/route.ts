import { NextRequest, NextResponse } from "next/server";
import { getGithubAccessToken } from "@/lib/connectors-auth";

export async function GET(request: NextRequest) {
  const token = await getGithubAccessToken();
  if (!token) {
    return NextResponse.json({ error: "GitHub not connected" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const path = searchParams.get("path");

    if (!owner || !repo || !path) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "TacticDev-Gen-Intel",
        },
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Decode base64 content
    if (data.content) {
      data.decodedContent = Buffer.from(data.content, "base64").toString("utf-8");
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("GitHub Get File Content Error:", error);
    return NextResponse.json({ error: "Failed to get file content" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getGithubAccessToken } from "@/lib/connectors-auth";
import { logRequest, logError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const token = await getGithubAccessToken();
  if (!token) {
    await logRequest("warn", "GitHub Get File Content: No token found");
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

    const rateLimitLimit = response.headers.get("x-ratelimit-limit");
    const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
    const rateLimitReset = response.headers.get("x-ratelimit-reset");

    const context = {
      status: response.status,
      rateLimit: {
        limit: rateLimitLimit,
        remaining: rateLimitRemaining,
        reset: rateLimitReset,
      }
    };

    const data = await response.json();
    if (!response.ok) {
      await logRequest("error", "GitHub Get File Content: Upstream Error", {
        ...context,
        upstreamError: data
      });
      return NextResponse.json(data, { status: response.status });
    }

    // Decode base64 content
    if (data.content) {
      data.decodedContent = Buffer.from(data.content, "base64").toString("utf-8");
    }

    await logRequest("info", "GitHub Get File Content: Success", context);
    return NextResponse.json(data);
  } catch (error) {
    await logError("GitHub Get File Content: Internal Error", error);
    return NextResponse.json({ error: "Failed to get file content" }, { status: 500 });
  }
}

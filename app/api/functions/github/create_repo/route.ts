import { NextRequest, NextResponse } from "next/server";
import { getGithubAccessToken } from "@/lib/connectors-auth";
import { logRequest, logError } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const token = await getGithubAccessToken();
  if (!token) {
    await logRequest("warn", "GitHub Create Repo: No token found");
    return NextResponse.json({ error: "GitHub not connected" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const response = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "TacticDev-Gen-Intel",
      },
      body: JSON.stringify({
        name: body.name,
        description: body.description,
        private: body.private ?? false,
      }),
    });

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
      await logRequest("error", "GitHub Create Repo: Upstream Error", {
        ...context,
        upstreamError: data
      });
      return NextResponse.json(data, { status: response.status });
    }

    await logRequest("info", "GitHub Create Repo: Success", context);
    return NextResponse.json(data);
  } catch (error) {
    await logError("GitHub Create Repo: Internal Error", error);
    return NextResponse.json({ error: "Failed to create repository" }, { status: 500 });
  }
}

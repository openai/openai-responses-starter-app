import { NextResponse } from "next/server";
import { getGithubAccessToken } from "@/lib/connectors-auth";
import { logRequest, logError } from "@/lib/logger";

export async function GET() {
  const token = await getGithubAccessToken();
  if (!token) {
    await logRequest("warn", "GitHub List Repos: No token found");
    return NextResponse.json({ error: "GitHub not connected" }, { status: 401 });
  }

  try {
    const start = Date.now();
    const response = await fetch("https://api.github.com/user/repos?sort=updated", {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "TacticDev-Gen-Intel",
      },
    });
    const duration = Date.now() - start;

    const rateLimitLimit = response.headers.get("x-ratelimit-limit");
    const rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
    const rateLimitReset = response.headers.get("x-ratelimit-reset");

    const context = {
      status: response.status,
      duration,
      rateLimit: {
        limit: rateLimitLimit,
        remaining: rateLimitRemaining,
        reset: rateLimitReset,
      }
    };

    if (!response.ok) {
      const data = await response.json();
      await logRequest("error", "GitHub List Repos: Upstream Error", {
        ...context,
        upstreamError: data
      });
      return NextResponse.json(data, { status: response.status });
    }

    const data = await response.json();
    await logRequest("info", "GitHub List Repos: Success", context);
    return NextResponse.json(data);
  } catch (error) {
    await logError("GitHub List Repos: Internal Error", error);
    return NextResponse.json({ error: "Failed to list repositories" }, { status: 500 });
  }
}

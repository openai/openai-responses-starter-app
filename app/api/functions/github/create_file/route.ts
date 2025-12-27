import { NextRequest, NextResponse } from "next/server";
import { getGithubAccessToken } from "@/lib/connectors-auth";
import { logRequest, logError } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const token = await getGithubAccessToken();
  if (!token) {
    await logRequest("warn", "GitHub Create File: No token found");
    return NextResponse.json({ error: "GitHub not connected" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { owner, repo, path, content, message } = body;

    await logRequest("info", "GitHub Create File: Checking existence", { owner, repo, path });

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
      await logRequest("info", "GitHub Create File: File exists, updating", { sha });
    } else if (getFileResponse.status !== 404) {
       // Log unexpected error during check, but continue to try creating (might fail there too)
       await logRequest("warn", "GitHub Create File: Check failed", { status: getFileResponse.status });
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
      await logRequest("error", "GitHub Create File: Upstream Error", {
        ...context,
        upstreamError: data
      });
      return NextResponse.json(data, { status: response.status });
    }

    await logRequest("info", "GitHub Create File: Success", context);
    return NextResponse.json(data);
  } catch (error) {
    await logError("GitHub Create File: Internal Error", error);
    return NextResponse.json({ error: "Failed to create/update file" }, { status: 500 });
  }
}

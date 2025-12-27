import { NextRequest, NextResponse } from "next/server";
import { getGithubAccessToken } from "@/lib/connectors-auth";

export async function POST(request: NextRequest) {
  const token = await getGithubAccessToken();
  if (!token) {
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

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("GitHub Create Repo Error:", error);
    return NextResponse.json({ error: "Failed to create repository" }, { status: 500 });
  }
}

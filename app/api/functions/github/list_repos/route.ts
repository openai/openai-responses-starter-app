import { NextResponse } from "next/server";
import { getGithubAccessToken } from "@/lib/connectors-auth";

export async function GET() {
  const token = await getGithubAccessToken();
  if (!token) {
    return NextResponse.json({ error: "GitHub not connected" }, { status: 401 });
  }

  try {
    const response = await fetch("https://api.github.com/user/repos?sort=updated", {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "TacticDev-Gen-Intel",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("GitHub List Repos Error:", error);
    return NextResponse.json({ error: "Failed to list repositories" }, { status: 500 });
  }
}

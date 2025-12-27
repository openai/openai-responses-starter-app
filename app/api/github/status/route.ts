import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const jar = await cookies();
  const accessToken = jar.get("gh_access_token")?.value;
  
  const githubConfigured = Boolean(
    process.env.GITHUB_CLIENT_ID && 
    process.env.GITHUB_CLIENT_SECRET
  );

  return NextResponse.json({
    connected: Boolean(accessToken),
    oauthConfigured: githubConfigured,
  });
}

import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import {
  randomState,
  buildAuthorizationUrl,
} from "openid-client";
import {
  getGithubClient,
  getGithubRedirectUri,
  GITHUB_SCOPES,
} from "@/lib/connectors-auth";
import { getOrCreateSessionId } from "@/lib/session";

const STATE_COOKIE = "gh_oauth_state";

export async function GET() {
  try {
    const config = await getGithubClient();
    const jar = await cookies();
    const host = (await headers()).get("host") || undefined;

    // Ensure we have a session id cookie set
    await getOrCreateSessionId();

    const state = randomState();

    // Store state in httpOnly cookies for the callback
    const cookieOptions = {
      httpOnly: true as const,
      sameSite: "lax" as const,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60, // 10 minutes
    };

    jar.set(STATE_COOKIE, state, cookieOptions);

    const redirectUri = getGithubRedirectUri(host);

    const authorizationUrl = buildAuthorizationUrl(config, {
      redirect_uri: redirectUri,
      scope: GITHUB_SCOPES.join(" "),
      state,
    });

    return NextResponse.redirect(authorizationUrl.toString());
  } catch (error) {
    console.error("GitHub Auth Error:", error);
    return NextResponse.json({ error: "Failed to initialize GitHub auth" }, { status: 500 });
  }
}

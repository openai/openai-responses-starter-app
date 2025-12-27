import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authorizationCodeGrant } from "openid-client";
import { getGithubClient } from "@/lib/connectors-auth";
import { getSessionId, saveTokenSet, OAuthTokens } from "@/lib/session";

const STATE_COOKIE = "gh_oauth_state";

export async function GET(request: NextRequest) {
  try {
    const config = await getGithubClient();
    const jar = await cookies();

    const stateCookie = jar.get(STATE_COOKIE)?.value;
    const sessionId = await getSessionId();

    // Clear the one-time cookies regardless of outcome
    jar.delete(STATE_COOKIE);

    if (!sessionId) {
      return NextResponse.redirect(new URL("/?error=no-session", request.url));
    }

    const url = new URL(request.url);
    const returnedState = url.searchParams.get("state") || undefined;
    const hasCode = url.searchParams.has("code");

    if (!stateCookie || !hasCode || returnedState !== stateCookie) {
      return NextResponse.redirect(new URL("/?error=invalid_state", request.url));
    }

    const tokenResponse = await authorizationCodeGrant(config, url, {
      expectedState: stateCookie,
    });

    const now = Date.now();
    const tokens: OAuthTokens = {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      token_type: tokenResponse.token_type,
      scope: tokenResponse.scope,
      expires_at:
        tokenResponse.expires_in != null
          ? now + tokenResponse.expires_in * 1000
          : undefined,
    };

    // Save tokens in memory (demo)
    // Note: We might want a separate storage for GitHub tokens if we want to support both simultaneously
    // For now, let's assume we can store them in cookies with a different prefix
    saveTokenSet(sessionId + "_github", tokens);

    const cookieOptions = {
      httpOnly: true as const,
      sameSite: "lax" as const,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };
    if (tokens.access_token)
      jar.set("gh_access_token", tokens.access_token, cookieOptions);
    if (tokens.refresh_token)
      jar.set("gh_refresh_token", tokens.refresh_token, cookieOptions);
    if (tokens.expires_at)
      jar.set("gh_expires_at", String(tokens.expires_at), cookieOptions);

    return NextResponse.redirect(new URL("/?github_connected=1", request.url));
  } catch (error) {
    console.error("GitHub Callback Error:", error);
    return NextResponse.redirect(new URL("/?error=oauth_failed", request.url));
  }
}

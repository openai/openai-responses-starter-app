import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { authorizationCodeGrant } from "openid-client";
import { getGoogleClient } from "@/lib/connectors-auth";
import { getSessionId, saveTokenSet, OAuthTokens } from "@/lib/session";

const STATE_COOKIE = "gc_oauth_state";
const VERIFIER_COOKIE = "gc_oauth_verifier";

export async function GET(request: NextRequest) {
  const config = await getGoogleClient();
  const jar = await cookies();

  const stateCookie = jar.get(STATE_COOKIE)?.value;
  const verifier = jar.get(VERIFIER_COOKIE)?.value;
  const sessionId = await getSessionId();

  // Clear the one-time cookies regardless of outcome
  jar.delete(STATE_COOKIE);
  jar.delete(VERIFIER_COOKIE);

  if (!sessionId) {
    return NextResponse.redirect(new URL("/?error=no-session", request.url));
  }

  const url = new URL(request.url);
  const returnedState = url.searchParams.get("state") || undefined;
  const hasCode = url.searchParams.has("code");

  if (!stateCookie || !verifier || !hasCode || returnedState !== stateCookie) {
    return NextResponse.redirect(new URL("/?error=invalid_state", request.url));
  }

  try {
    const tokenResponse = await authorizationCodeGrant(config, url, {
      expectedState: stateCookie,
      pkceCodeVerifier: verifier,
    });

    const now = Date.now();
    const tokens: OAuthTokens = {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      id_token: tokenResponse.id_token,
      token_type: tokenResponse.token_type,
      scope: tokenResponse.scope,
      expires_at:
        tokenResponse.expires_in != null
          ? now + tokenResponse.expires_in * 1000
          : undefined,
    };

    // Save tokens in memory (demo)
    saveTokenSet(sessionId, tokens);

    // Also persist tokens in httpOnly cookies so other route handlers can read
    // them even if they don't share the same in-memory module instance.
    const cookieOptions = {
      httpOnly: true as const,
      sameSite: "lax" as const,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };
    if (tokens.access_token)
      jar.set("gc_access_token", tokens.access_token, cookieOptions);
    if (tokens.refresh_token)
      jar.set("gc_refresh_token", tokens.refresh_token, cookieOptions);
    if (tokens.id_token) jar.set("gc_id_token", tokens.id_token, cookieOptions);
    if (tokens.expires_at)
      jar.set("gc_expires_at", String(tokens.expires_at), cookieOptions);

    return NextResponse.redirect(new URL("/?connected=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/?error=oauth_failed", request.url));
  }
}

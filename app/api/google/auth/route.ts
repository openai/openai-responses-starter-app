import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import {
  randomPKCECodeVerifier,
  calculatePKCECodeChallenge,
  randomState,
  buildAuthorizationUrl,
} from "openid-client";
import {
  getGoogleClient,
  getRedirectUri,
  GOOGLE_SCOPES,
} from "@/lib/connectors-auth";
import { getOrCreateSessionId } from "@/lib/session";

const STATE_COOKIE = "gc_oauth_state";
const VERIFIER_COOKIE = "gc_oauth_verifier";

export async function GET() {
  const config = await getGoogleClient();
  const jar = await cookies();
  const host = (await headers()).get("host") || undefined;

  // Ensure we have a session id cookie set
  await getOrCreateSessionId();

  const state = randomState();
  const codeVerifier = randomPKCECodeVerifier();
  const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);

  // Store state and verifier in httpOnly cookies for the callback
  const cookieOptions = {
    httpOnly: true as const,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60, // 10 minutes
  };

  jar.set(STATE_COOKIE, state, cookieOptions);
  jar.set(VERIFIER_COOKIE, codeVerifier, cookieOptions);

  const redirectUri = getRedirectUri(host);

  const authorizationUrl = buildAuthorizationUrl(config, {
    redirect_uri: redirectUri,
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });

  return NextResponse.redirect(authorizationUrl.toString());
}

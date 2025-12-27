import { NextRequest, NextResponse } from "next/server";
import { cookies, headers as nextHeaders } from "next/headers";
import { 
  getProviderConfig, 
  verifyState 
} from "@/lib/oauth";
import { getSessionId, saveTokenSet, OAuthTokens } from "@/lib/session";
import { logRequest, logError } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const host = (await nextHeaders()).get("host") || undefined;
  const jar = await cookies();
  
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    await logRequest("error", `OAuth Callback Error (${provider})`, { error });
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
  }

  const cookieState = jar.get("oauth_state")?.value;
  jar.delete("oauth_state");

  if (!returnedState || !cookieState || returnedState !== cookieState) {
    await logRequest("warn", `OAuth Callback: Invalid State (${provider})`, { returnedState, cookieState });
    return NextResponse.redirect(new URL("/?error=invalid_state", request.url));
  }

  const payload = verifyState(returnedState);
  if (!payload) {
    await logRequest("warn", `OAuth Callback: Invalid Signature (${provider})`);
    return NextResponse.redirect(new URL("/?error=invalid_signature", request.url));
  }

  const sessionId = await getSessionId();
  if (!sessionId) {
    await logRequest("warn", `OAuth Callback: No Session (${provider})`);
    return NextResponse.redirect(new URL("/?error=no_session", request.url));
  }

  try {
    const cfg = getProviderConfig(provider, host);
    await logRequest("info", `OAuth Callback: Config (${provider})`, { 
      clientId: cfg.clientId ? `${cfg.clientId.substring(0, 5)}...` : "missing",
      redirectUri: cfg.redirectUri,
      host
    });

    const verifier = jar.get("oauth_pkce_verifier")?.value;
    jar.delete("oauth_pkce_verifier");

    const tokenParams: Record<string, string> = {
      client_id: cfg.clientId,
      grant_type: "authorization_code",
      code: code || "",
      redirect_uri: cfg.redirectUri,
    };

    if (cfg.clientSecret) {
      tokenParams.client_secret = cfg.clientSecret;
    }

    if (verifier) {
      tokenParams.code_verifier = verifier;
    }

    const tokenResponse = await fetch(cfg.tokenUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json" 
      },
      body: new URLSearchParams(tokenParams).toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      await logRequest("error", `OAuth Callback: Token Exchange Failed (${provider})`, { status: tokenResponse.status, errorData });
      throw new Error(`Token exchange failed: ${errorData}`);
    }

    const data = await tokenResponse.json();
    await logRequest("info", `OAuth Callback: Token Exchange Success (${provider})`, { 
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      scope: data.scope
    });
    
    const now = Date.now();
    const tokens: OAuthTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      id_token: data.id_token,
      token_type: data.token_type,
      scope: data.scope,
      expires_at: data.expires_in ? now + data.expires_in * 1000 : undefined,
    };

    // Save tokens with provider-specific key
    saveTokenSet(`${sessionId}_${provider}`, tokens);

    // Persist in cookies for server-side access in other routes
    const cookieOptions = {
      httpOnly: true as const,
      sameSite: "lax" as const,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };

    const prefix = provider === "github" ? "gh" : provider === "google" ? "gc" : provider;
    
    if (tokens.access_token) jar.set(`${prefix}_access_token`, tokens.access_token, cookieOptions);
    if (tokens.refresh_token) jar.set(`${prefix}_refresh_token`, tokens.refresh_token, cookieOptions);
    if (tokens.expires_at) jar.set(`${prefix}_expires_at`, String(tokens.expires_at), cookieOptions);

    const redirectUrl = new URL(payload.return_to || "/");
    redirectUrl.searchParams.set(provider === "github" ? "github_connected" : "connected", "1");

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error: any) {
    await logError(error, `OAuth Callback Error (${provider})`, { host });
    return NextResponse.redirect(new URL("/?error=oauth_failed", request.url));
  }
}

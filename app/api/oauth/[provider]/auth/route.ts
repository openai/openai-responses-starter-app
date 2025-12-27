import { NextRequest, NextResponse } from "next/server";
import { cookies, headers as nextHeaders } from "next/headers";
import { 
  getProviderConfig, 
  signState, 
  generateCodeVerifier, 
  generateCodeChallenge, 
  generateNonce 
} from "@/lib/oauth";
import { logRequest, logError } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const host = (await nextHeaders()).get("host") || undefined;
  
  try {
    const cfg = getProviderConfig(provider, host);
    await logRequest("info", `OAuth Start: Config (${provider})`, { 
      clientId: cfg.clientId ? `${cfg.clientId.substring(0, 5)}...` : "missing",
      redirectUri: cfg.redirectUri,
      host
    });

    const jar = await cookies();

    const searchParams = request.nextUrl.searchParams;
    const return_to = searchParams.get("return_to") || `https://${host}/`;

    // Security: Validate return_to (basic check, can be expanded)
    if (host && !return_to.includes(host) && !process.env.OAUTH_RETURN_ALLOWLIST?.includes(return_to)) {
      // If it's a dev environment, we might be more lenient or check against a specific list
      const isDev = host.includes("localhost") || host.includes("github.dev") || host.includes("hostingersite.com");
      if (!isDev) {
        await logRequest("warn", `OAuth Start: Invalid return_to (${provider})`, { return_to, host });
        return NextResponse.json({ error: "Invalid return_to URL" }, { status: 400 });
      }
    }

    const state = signState({ 
      provider, 
      return_to, 
      nonce: generateNonce() 
    });

    const cookieOptions = {
      httpOnly: true as const,
      sameSite: "lax" as const,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 600, // 10 minutes
    };

    jar.set("oauth_state", state, cookieOptions);

    const authParams = new URLSearchParams({
      client_id: cfg.clientId,
      redirect_uri: cfg.redirectUri,
      response_type: "code",
      scope: cfg.scope || "",
      state,
    });

    if (cfg.usesPkce) {
      const verifier = generateCodeVerifier();
      const challenge = generateCodeChallenge(verifier);
      jar.set("oauth_pkce_verifier", verifier, cookieOptions);
      authParams.set("code_challenge", challenge);
      authParams.set("code_challenge_method", "S256");
    }

    // Provider specific tweaks
    if (provider === "google") {
      authParams.set("access_type", "offline");
      authParams.set("prompt", "consent");
    }

    const authorizationUrl = `${cfg.authorizeUrl}?${authParams.toString()}`;
    return NextResponse.redirect(authorizationUrl);
  } catch (error: any) {
    await logError(error, `OAuth Auth Error (${provider})`, { host });
    return NextResponse.json({ error: error.message || "Failed to initialize auth" }, { status: 500 });
  }
}

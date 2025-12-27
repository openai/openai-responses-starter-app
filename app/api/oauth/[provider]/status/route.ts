import { NextRequest, NextResponse } from "next/server";
import { cookies as nextCookies, headers as nextHeaders } from "next/headers";
import { getProviderConfig } from "@/lib/oauth";

/**
 * Generic status endpoint to check if a provider is connected and configured.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const host = (await nextHeaders()).get("host") || undefined;
  const jar = await nextCookies();

  try {
    // Check if configured
    const config = getProviderConfig(provider, host);
    const isConfigured = Boolean(config.clientId && config.clientSecret);

    // Check if connected (token exists in cookies)
    // We use the provider-specific cookie name convention
    const cookieName = `${provider}_access_token`;
    const accessToken = jar.get(cookieName)?.value;

    return NextResponse.json({
      connected: Boolean(accessToken),
      oauthConfigured: isConfigured,
      provider,
    });
  } catch {
    return NextResponse.json({
      connected: false,
      oauthConfigured: false,
      provider,
      error: "Provider not supported or misconfigured",
    }, { status: 200 }); // Return 200 so UI doesn't crash
  }
}

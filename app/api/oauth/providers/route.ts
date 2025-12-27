import { NextResponse } from "next/server";
import { headers as nextHeaders } from "next/headers";
import { getProviderConfig } from "@/lib/oauth";

/**
 * Admin endpoint to inspect or manage OAuth providers.
 * In a real app, this would be protected by admin authentication.
 */
export async function GET() {
  const host = (await nextHeaders()).get("host") || undefined;
  
  // Basic security: check for admin password in headers or session
  // For now, we'll just return the active config for the current host
  
  try {
    const providers = ["github", "google"];
    const configs = providers.reduce((acc, p) => {
      try {
        const cfg = getProviderConfig(p, host);
        acc[p] = {
          clientId: cfg.clientId,
          redirectUri: cfg.redirectUri,
          scope: cfg.scope,
          usesPkce: cfg.usesPkce,
          // Never return clientSecret to the client
        };
      } catch {
        acc[p] = { error: "Not configured" };
      }
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json({
      host,
      providers: configs,
      env: process.env.NODE_ENV,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST() {
  // This would be where you'd save new provider configs to a database
  return NextResponse.json({ message: "Dynamic provider configuration not yet implemented in this demo. Use .env for now." }, { status: 501 });
}

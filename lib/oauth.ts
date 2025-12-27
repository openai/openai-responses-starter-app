import crypto from "crypto";

export type ProviderConfig = {
  clientId: string;
  clientSecret?: string;
  authorizeUrl: string;
  tokenUrl: string;
  scope?: string;
  redirectUri: string;
  usesPkce?: boolean;
};

const STATE_SECRET = process.env.OAUTH_STATE_SECRET || "dev-secret-change-me-at-least-32-chars";

/**
 * Retrieves provider configuration based on the provider name and current host.
 * Supports dynamic switching between production and development credentials.
 */
export function getProviderConfig(provider: string, host?: string): ProviderConfig {
  const isDevHost = !!host && (host.includes("github.dev") || host.includes("hostingersite.com") || host.includes("localhost"));
  
  switch (provider) {
    case "github":
      return {
        clientId: (isDevHost ? process.env.GITHUB_CLIENT_ID_DEV : process.env.GITHUB_CLIENT_ID) || process.env.GITHUB_CLIENT_ID || "",
        clientSecret: (isDevHost ? process.env.GITHUB_CLIENT_SECRET_DEV : process.env.GITHUB_CLIENT_SECRET) || process.env.GITHUB_CLIENT_SECRET,
        authorizeUrl: "https://github.com/login/oauth/authorize",
        tokenUrl: "https://github.com/login/oauth/access_token",
        scope: "repo,user,workflow",
        redirectUri: (isDevHost ? process.env.GITHUB_REDIRECT_URI_DEV : process.env.GITHUB_REDIRECT_URI) || process.env.GITHUB_REDIRECT_URI || "",
        usesPkce: false,
      };
    case "google":
      return {
        clientId: (isDevHost ? process.env.GOOGLE_CLIENT_ID_DEV : process.env.GOOGLE_CLIENT_ID) || process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: (isDevHost ? process.env.GOOGLE_CLIENT_SECRET_DEV : process.env.GOOGLE_CLIENT_SECRET) || process.env.GOOGLE_CLIENT_SECRET,
        authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scope: "openid email profile https://www.googleapis.com/auth/calendar.events.readonly https://www.googleapis.com/auth/gmail.readonly",
        redirectUri: (isDevHost ? process.env.GOOGLE_REDIRECT_URI_DEV : process.env.GOOGLE_REDIRECT_URI) || process.env.GOOGLE_REDIRECT_URI || "",
        usesPkce: true,
      };
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Signs a state payload using HMAC-SHA256.
 */
export function signState(payload: Record<string, any>): string {
  const json = JSON.stringify({ ...payload, iat: Date.now() });
  const b64json = Buffer.from(json).toString("base64url");
  const sig = crypto.createHmac("sha256", STATE_SECRET).update(b64json).digest("base64url");
  return `${b64json}.${sig}`;
}

/**
 * Verifies and decodes a signed state token.
 */
export function verifyState(token: string): Record<string, any> | null {
  try {
    const [b64json, sig] = token.split(".");
    if (!b64json || !sig) return null;
    
    const expected = crypto.createHmac("sha256", STATE_SECRET).update(b64json).digest("base64url");
    
    // Use timingSafeEqual to prevent timing attacks
    const expectedBuf = Buffer.from(expected);
    const sigBuf = Buffer.from(sig);
    if (expectedBuf.length !== sigBuf.length || !crypto.timingSafeEqual(expectedBuf, sigBuf)) {
      return null;
    }
    
    const json = Buffer.from(b64json, "base64url").toString("utf8");
    const payload = JSON.parse(json);
    
    // Optional: check expiration (e.g., 10 minutes)
    if (Date.now() - payload.iat > 10 * 60 * 1000) {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

/**
 * Generates a random string for PKCE code verifier.
 */
export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Generates a SHA256 code challenge from a verifier.
 */
export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

/**
 * Generates a random nonce.
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const SESSION_COOKIE = "responses_starter_session_id";

// Simple in-memory storage for demo purposes only.
// In production, replace with a persistent/session store.
export interface OAuthTokens {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  token_type?: string;
  scope?: string;
  // epoch milliseconds when the access token expires
  expires_at?: number;
}

const sessionStore = new Map<string, OAuthTokens>();

export async function getOrCreateSessionId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  const sessionId = randomBytes(16).toString("hex");
  // Set httpOnly cookie for session id
  jar.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return sessionId;
}

export async function getSessionId(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(SESSION_COOKIE)?.value;
}

export function saveTokenSet(sessionId: string, tokenSet: OAuthTokens) {
  sessionStore.set(sessionId, tokenSet);
}

export function getTokenSet(sessionId?: string): OAuthTokens | undefined {
  if (!sessionId) return undefined;
  return sessionStore.get(sessionId);
}

export function clearSession(sessionId?: string) {
  if (!sessionId) return;
  sessionStore.delete(sessionId);
}

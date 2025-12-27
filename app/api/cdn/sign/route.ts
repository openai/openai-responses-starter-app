import { NextResponse } from "next/server";
import crypto from "crypto";
import { readCdnConfig } from "@/lib/cdn";

function signUrl(originalUrl: string, secret: string, expiresAt: number) {
  // Simple HMAC signature: hex(HMAC_SHA256(secret, `${url}|${expires}`))
  const h = crypto.createHmac("sha256", secret);
  h.update(`${originalUrl}|${expiresAt}`);
  return h.digest("hex");
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const original = url.searchParams.get("url") || "";
    const ttlParam = url.searchParams.get("ttl");
    if (!original) return NextResponse.json({ error: "url required" }, { status: 400 });

    const cfg = await readCdnConfig();
    if (!cfg.signingEnabled) {
      return NextResponse.json({ signedUrl: original });
    }
    const ttl = ttlParam ? parseInt(ttlParam, 10) : cfg.defaultTTL || 3600;
    const expiresAt = Math.floor(Date.now() / 1000) + ttl;
    const sig = signUrl(original, cfg.signingSecret, expiresAt);
    // Return signed url format: original + exp & sig
    const signed = `${original}${original.includes("?") ? "&" : "?"}exp=${expiresAt}&sig=${sig}`;
    return NextResponse.json({ signedUrl: signed });
  } catch {
    return NextResponse.json({ error: "signing failed" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { readCdnConfig, writeCdnConfig } from "@/lib/cdn";

export async function GET() {
  const cfg = await readCdnConfig();
  // Don't return signingSecret to clients
  const publicCfg: any = { ...cfg };
  delete publicCfg.signingSecret;
  return NextResponse.json(publicCfg);
}

export async function POST(request: Request) {
  // Protected: require admin session (cookie) or admin header
  try {
    const adminHeader = request.headers.get("x-admin-key");
    const ADMIN_AUTH_TOKEN = process.env.ADMIN_AUTH_TOKEN ?? "";
    const ADMIN_KEY = process.env.ADMIN_KEY ?? "";

    const cookie = request.headers.get("cookie") || "";
    const hasCookie = ADMIN_AUTH_TOKEN && cookie.includes(`admin_auth=${ADMIN_AUTH_TOKEN}`);
    const hasHeader = ADMIN_KEY && adminHeader === ADMIN_KEY;
    if (!hasCookie && !hasHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const allowed = ["baseUrl", "host", "signingEnabled", "defaultTTL"];
    const patch: any = {};
    for (const k of allowed) {
      if (k in body) patch[k] = body[k];
    }
    const updated = await writeCdnConfig(patch);
    const publicCfg: any = { ...updated };
    delete publicCfg.signingSecret;
    return NextResponse.json(publicCfg);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
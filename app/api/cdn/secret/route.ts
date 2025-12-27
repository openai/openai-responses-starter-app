import { NextResponse } from "next/server";
import { writeCdnConfig } from "@/lib/cdn";

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

    const { signingSecret } = await request.json();
    if (typeof signingSecret !== "string") {
      return NextResponse.json({ error: "signingSecret required" }, { status: 400 });
    }
    const updated = await writeCdnConfig({ signingSecret });
    const publicCfg: any = { ...updated };
    delete publicCfg.signingSecret;
    return NextResponse.json(publicCfg);
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
}
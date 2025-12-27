import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logRequest } from "@/lib/logger";

export async function GET() {
  const ADMIN_AUTH_TOKEN = process.env.ADMIN_AUTH_TOKEN ?? "";
  try {
    const jar = await cookies();
    const c = jar.get("admin_auth")?.value;
    if (c && ADMIN_AUTH_TOKEN && c === ADMIN_AUTH_TOKEN) {
      return NextResponse.json({ ok: true });
    }
    await logRequest("warn", "Admin Check: Unauthorized", { hasCookie: !!c, hasToken: !!ADMIN_AUTH_TOKEN });
    return NextResponse.json({ ok: false }, { status: 401 });
  } catch {
    await logRequest("error", "Admin Check: Error");
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const ADMIN_AUTH_TOKEN = process.env.ADMIN_AUTH_TOKEN ?? "";
  try {
    const jar = await cookies();
    const c = jar.get("admin_auth")?.value;
    if (c && ADMIN_AUTH_TOKEN && c === ADMIN_AUTH_TOKEN) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}

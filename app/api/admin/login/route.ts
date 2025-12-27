import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = body?.password;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
    const ADMIN_AUTH_TOKEN = process.env.ADMIN_AUTH_TOKEN ?? "";
    if (!password || password !== ADMIN_PASSWORD || !ADMIN_AUTH_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    // Set HttpOnly cookie for admin session (8 hours)
    res.headers.set(
      "Set-Cookie",
      `admin_auth=${ADMIN_AUTH_TOKEN}; Path=/; HttpOnly; Max-Age=${60 * 60 * 8}; SameSite=Strict; ${process.env.NODE_ENV === "production" ? "Secure;" : ""}`
    );
    return res;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
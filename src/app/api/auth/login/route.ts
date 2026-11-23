import { NextResponse } from "next/server";
import { findUserByEmail } from "@/data/store";
import { SESSION_COOKIE, sessionCookieValue } from "@/lib/auth";
import type { SessionUser } from "@/lib/types";

export async function POST(req: Request) {
  const body = (await req.json()) as { email?: string; password?: string };
  if (!body.email || !body.password) {
    return NextResponse.json({ error: "email and password required" }, { status: 400 });
  }

  const user = findUserByEmail(body.email);
  if (!user || user.password !== body.password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const session: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const res = NextResponse.json({ user: session });
  res.cookies.set(SESSION_COOKIE, sessionCookieValue(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}

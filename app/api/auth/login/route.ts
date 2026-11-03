import { NextResponse } from "next/server";
import { createSessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";

  if (!process.env.AUTH_PASSWORD) {
    return NextResponse.json(
      { error: "Login não configurado no servidor." },
      { status: 500 },
    );
  }

  if (password !== process.env.AUTH_PASSWORD) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const token = await createSessionToken(password);
  if (!token) {
    return NextResponse.json(
      { error: "Login não configurado no servidor." },
      { status: 500 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("baba_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 60,
  });
  return response;
}

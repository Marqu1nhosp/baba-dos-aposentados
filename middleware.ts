import { NextRequest, NextResponse } from "next/server";
import { isValidSessionToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("baba_session")?.value;
  if (await isValidSessionToken(token)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/",
    "/resultado/:path*",
    "/jogadores/:path*",
    "/api/players/:path*",
  ],
};

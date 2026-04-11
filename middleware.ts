import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

function getBaseUrl() {
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

export default auth((req) => {
  const { nextUrl, auth } = req;
  const isLoggedIn = !!auth;
  const isAuthPage = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
  const isProtected = nextUrl.pathname.startsWith("/dashboard") || nextUrl.pathname.startsWith("/wallets") || nextUrl.pathname.startsWith("/settings");

  const baseUrl = getBaseUrl();

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", baseUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*))"],
};

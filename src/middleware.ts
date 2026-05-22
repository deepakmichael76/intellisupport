import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessTokenEdge } from "@/lib/auth-edge";

const protectedRoutes = ["/chat", "/admin"];
const authRoutes = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token =
    request.cookies.get("accessToken")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  const user = token ? await verifyAccessTokenEdge(token) : null;

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && user) {
    const dest = user.role === "admin" || user.role === "support-agent" ? "/admin" : "/chat";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (pathname.startsWith("/admin") && user && user.role === "user") {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/admin/:path*", "/login", "/signup"],
};

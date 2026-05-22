import { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import type { JwtPayload } from "@/types";
import type { UserRole } from "@/types";

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return req.cookies.get("accessToken")?.value ?? null;
}

export function authenticateRequest(req: NextRequest): JwtPayload | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyAccessToken(token);
}

export function requireAuth(req: NextRequest): JwtPayload | Response {
  const user = authenticateRequest(req);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}

export function requireRole(
  user: JwtPayload,
  roles: UserRole[]
): Response | null {
  if (!roles.includes(user.role)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

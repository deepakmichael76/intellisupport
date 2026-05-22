import jwt, { type SignOptions } from "jsonwebtoken";
import type { JwtPayload, UserRole } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";

const accessOptions: SignOptions = { expiresIn: "15m" };
const refreshOptions: SignOptions = { expiresIn: "7d" };

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, accessOptions);
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, refreshOptions);
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function hasRole(role: UserRole, allowed: UserRole[]): boolean {
  return allowed.includes(role);
}

export const ADMIN_ROLES: UserRole[] = ["admin"];
export const AGENT_ROLES: UserRole[] = ["admin", "support-agent"];

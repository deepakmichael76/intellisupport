import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authenticateRequest, requireRole } from "@/middleware/auth";
import { ADMIN_ROLES } from "@/lib/auth";
import { getAnalyticsSummary } from "@/services/analytics.service";

export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const forbidden = requireRole(user, ADMIN_ROLES);
  if (forbidden) return forbidden;

  try {
    await connectDB();
    const summary = await getAnalyticsSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

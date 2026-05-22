import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authenticateRequest, requireRole } from "@/middleware/auth";
import { ADMIN_ROLES, AGENT_ROLES } from "@/lib/auth";
import { Conversation } from "@/models/Conversation";

export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const forbidden = requireRole(user, [...ADMIN_ROLES, ...AGENT_ROLES]);
  if (forbidden) return forbidden;

  try {
    await connectDB();
    const conversations = await Conversation.find({ status: "escalated" })
      .populate("userId", "name email")
      .sort({ escalatedAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Admin conversations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

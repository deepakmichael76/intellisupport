import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authenticateRequest, requireRole } from "@/middleware/auth";
import { ADMIN_ROLES } from "@/lib/auth";
import { User } from "@/models/User";

export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const forbidden = requireRole(user, ADMIN_ROLES);
  if (forbidden) return forbidden;

  try {
    await connectDB();
    const users = await User.find()
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authUser = authenticateRequest(req);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const forbidden = requireRole(authUser, ADMIN_ROLES);
  if (forbidden) return forbidden;

  try {
    const { userId, role } = await req.json();
    if (!userId || !role) {
      return NextResponse.json({ error: "userId and role required" }, { status: 400 });
    }

    await connectDB();
    const updated = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password -refreshToken");

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

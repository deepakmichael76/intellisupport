import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authenticateRequest, requireRole } from "@/middleware/auth";
import { ADMIN_ROLES } from "@/lib/auth";
import { Intent } from "@/models/Intent";

export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const forbidden = requireRole(user, ADMIN_ROLES);
  if (forbidden) return forbidden;

  try {
    await connectDB();
    const intents = await Intent.find().sort({ usageCount: -1 }).lean();
    return NextResponse.json({ intents });
  } catch (error) {
    console.error("Admin intents error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const forbidden = requireRole(user, ADMIN_ROLES);
  if (forbidden) return forbidden;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await connectDB();
    await Intent.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete intent error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

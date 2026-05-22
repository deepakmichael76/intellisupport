import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { intentSchema } from "@/lib/validators";
import { authenticateRequest, requireRole } from "@/middleware/auth";
import { ADMIN_ROLES } from "@/lib/auth";
import { Intent } from "@/models/Intent";

export async function POST(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const forbidden = requireRole(user, ADMIN_ROLES);
  if (forbidden) return forbidden;

  try {
    const body = await req.json();
    const parsed = intentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await connectDB();
    const intent = await Intent.findOneAndUpdate(
      { intentName: parsed.data.intentName },
      parsed.data,
      { upsert: true, new: true }
    );

    return NextResponse.json({ intent });
  } catch (error) {
    console.error("Intent error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const intents = await Intent.find().sort({ intentName: 1 }).lean();
    return NextResponse.json({ intents });
  } catch (error) {
    console.error("Intent list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

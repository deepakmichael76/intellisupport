import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { authenticateRequest } from "@/middleware/auth";
import { Conversation } from "@/models/Conversation";

export async function GET(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        userId: user.userId,
      }).lean();
      if (!conversation) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ conversation });
    }

    const filter: Record<string, unknown> = { userId: user.userId };
    if (q) {
      filter.$text = { $search: q };
    }

    const conversations = await Conversation.find(filter)
      .sort({ updatedAt: -1 })
      .select("title status messages updatedAt createdAt escalatedAt")
      .limit(50)
      .lean();

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("History error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

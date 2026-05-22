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
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId required" }, { status: 400 });
    }

    await connectDB();
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: user.userId,
    }).lean();

    if (!conversation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const text = conversation.messages
      .map(
        (m) =>
          `[${new Date(m.timestamp).toISOString()}] ${m.sender}: ${m.content}`
      )
      .join("\n");

    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="chat-${conversationId}.txt"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

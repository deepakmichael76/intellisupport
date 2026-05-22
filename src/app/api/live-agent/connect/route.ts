import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { liveAgentSchema } from "@/lib/validators";
import { authenticateRequest } from "@/middleware/auth";
import { Conversation } from "@/models/Conversation";
import { trackEvent } from "@/services/analytics.service";

export async function POST(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = liveAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await connectDB();
    const conversation = await Conversation.findOneAndUpdate(
      { _id: parsed.data.conversationId, userId: user.userId },
      { status: "escalated", escalatedAt: new Date() },
      { new: true }
    );

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    await trackEvent({
      eventType: "escalation",
      userId: user.userId,
      conversationId: conversation._id.toString(),
    });

    return NextResponse.json({
      conversationId: conversation._id.toString(),
      status: conversation.status,
      socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL,
    });
  } catch (error) {
    console.error("Live agent connect error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

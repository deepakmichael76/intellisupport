import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { chatSchema } from "@/lib/validators";
import { authenticateRequest } from "@/middleware/auth";
import { handleChatMessage } from "@/services/chat.service";

export async function POST(req: NextRequest) {
  const user = authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await rateLimit(user.userId, "chat");
  if (!limited.success) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: limited.retryAfter },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const parsed = chatSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const detail = Object.entries(fieldErrors)
        .flatMap(([k, v]) => (v ?? []).map((msg) => `${k}: ${msg}`))
        .join("; ");
      return NextResponse.json(
        { error: detail || "Invalid request body" },
        { status: 400 }
      );
    }

    await connectDB();
    const result = await handleChatMessage(
      user.userId,
      parsed.data.message,
      parsed.data.conversationId
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { Conversation } from "@/models/Conversation";
import { Intent } from "@/models/Intent";
import type { NlpResult } from "@/types";
import mongoose from "mongoose";
import { getConfidenceThreshold, processMessage } from "./nlp.service";
import { trackEvent } from "./analytics.service";

export async function handleChatMessage(
  userId: string,
  message: string,
  conversationId?: string
) {
  const start = Date.now();
  let conversation = conversationId
    ? await Conversation.findOne({ _id: conversationId, userId })
    : null;

  if (!conversation) {
    conversation = await Conversation.create({
      userId: new mongoose.Types.ObjectId(userId),
      title: message.slice(0, 50),
      messages: [],
      status: "active",
      searchText: message,
    });
    await trackEvent({
      eventType: "chat_started",
      userId,
      conversationId: conversation._id.toString(),
    });
  }

  conversation.messages.push({
    sender: "user",
    content: message,
    timestamp: new Date(),
  });
  conversation.searchText += ` ${message}`;

  let nlpResult: NlpResult;
  let escalated = false;

  if (conversation.status === "escalated") {
    nlpResult = {
      intent: "live_agent",
      confidence: 1,
      entities: {},
      response: "Your conversation is with a live agent. They will respond shortly.",
      source: "local",
    };
  } else {
    nlpResult = await processMessage(message);
    const threshold = getConfidenceThreshold();

    if (nlpResult.confidence < threshold || nlpResult.intent === "nlu_fallback") {
      await trackEvent({
        eventType: "intent_failed",
        userId,
        conversationId: conversation._id.toString(),
        intent: nlpResult.intent,
        confidence: nlpResult.confidence,
      });
      conversation.status = "escalated";
      conversation.escalatedAt = new Date();
      escalated = true;
      await trackEvent({
        eventType: "escalation",
        userId,
        conversationId: conversation._id.toString(),
      });
      nlpResult.response +=
        " I'm connecting you with a support agent who can help further.";
    } else {
      await Intent.findOneAndUpdate(
        { intentName: nlpResult.intent },
        { $inc: { usageCount: 1 } }
      );
      await trackEvent({
        eventType: "intent_detected",
        userId,
        conversationId: conversation._id.toString(),
        intent: nlpResult.intent,
        confidence: nlpResult.confidence,
      });
    }
  }

  conversation.messages.push({
    sender: escalated ? "system" : "bot",
    content: nlpResult.response,
    intent: nlpResult.intent,
    confidenceScore: nlpResult.confidence,
    timestamp: new Date(),
  });

  await conversation.save();

  const responseTimeMs = Date.now() - start;
  await trackEvent({
    eventType: "response_generated",
    userId,
    conversationId: conversation._id.toString(),
    responseTimeMs,
  });

  return {
    conversationId: conversation._id.toString(),
    message: nlpResult.response,
    intent: nlpResult.intent,
    confidence: nlpResult.confidence,
    escalated,
    source: nlpResult.source,
    messages: conversation.messages,
  };
}

import { Analytics, type IAnalytics } from "@/models/Analytics";
import { Conversation } from "@/models/Conversation";
import { User } from "@/models/User";
import type { AnalyticsSummary } from "@/types";
import mongoose from "mongoose";

export async function trackEvent(data: {
  eventType: IAnalytics["eventType"];
  userId?: string;
  conversationId?: string;
  intent?: string;
  confidence?: number;
  responseTimeMs?: number;
  metadata?: Record<string, unknown>;
}) {
  await Analytics.create({
    ...data,
    userId: data.userId ? new mongoose.Types.ObjectId(data.userId) : undefined,
    conversationId: data.conversationId
      ? new mongoose.Types.ObjectId(data.conversationId)
      : undefined,
  });
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalChats,
    failedIntents,
    responseEvents,
    escalations,
    activeUsers,
    dailyAgg,
    intentAgg,
    successIntents,
  ] = await Promise.all([
    Conversation.countDocuments(),
    Analytics.countDocuments({ eventType: "intent_failed" }),
    Analytics.find({ eventType: "response_generated", responseTimeMs: { $exists: true } })
      .select("responseTimeMs")
      .lean(),
    Analytics.countDocuments({ eventType: "escalation" }),
    User.countDocuments({
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }),
    Analytics.aggregate([
      { $match: { eventType: "chat_started", createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Analytics.aggregate([
      { $match: { eventType: "intent_detected", intent: { $exists: true } } },
      { $group: { _id: "$intent", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Analytics.countDocuments({
      eventType: "intent_detected",
      confidence: { $gte: 0.6 },
    }),
  ]);

  const totalIntentEvents = await Analytics.countDocuments({ eventType: "intent_detected" });
  const avgTime =
    responseEvents.length > 0
      ? responseEvents.reduce((s, e) => s + (e.responseTimeMs || 0), 0) / responseEvents.length
      : 0;

  return {
    totalChats,
    failedIntents,
    averageResponseTime: Math.round(avgTime),
    escalationRate: totalChats > 0 ? Math.round((escalations / totalChats) * 100) : 0,
    activeUsers,
    dailyChats: dailyAgg.map((d: { _id: string; count: number }) => ({
      date: d._id,
      count: d.count,
    })),
    topIntents: intentAgg.map((i: { _id: string; count: number }) => ({
      intent: i._id,
      count: i.count,
    })),
    aiAccuracy:
      totalIntentEvents > 0 ? Math.round((successIntents / totalIntentEvents) * 100) : 0,
  };
}

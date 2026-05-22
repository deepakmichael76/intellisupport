import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IAnalytics extends Document {
  eventType:
    | "chat_started"
    | "message_sent"
    | "intent_detected"
    | "intent_failed"
    | "escalation"
    | "response_generated";
  userId?: mongoose.Types.ObjectId;
  conversationId?: mongoose.Types.ObjectId;
  intent?: string;
  confidence?: number;
  responseTimeMs?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    eventType: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
    intent: String,
    confidence: Number,
    responseTimeMs: Number,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AnalyticsSchema.index({ createdAt: -1 });

export const Analytics: Model<IAnalytics> =
  mongoose.models.Analytics ||
  mongoose.model<IAnalytics>("Analytics", AnalyticsSchema);

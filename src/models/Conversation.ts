import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { MessageSender } from "@/types";

export interface IMessage {
  sender: MessageSender;
  content: string;
  intent?: string;
  confidenceScore?: number;
  timestamp: Date;
  attachments?: string[];
}

export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: IMessage[];
  status: "active" | "escalated" | "closed";
  assignedAgentId?: mongoose.Types.ObjectId;
  escalatedAt?: Date;
  searchText: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: { type: String, enum: ["user", "bot", "agent", "system"], required: true },
    content: { type: String, required: true },
    intent: String,
    confidenceScore: Number,
    timestamp: { type: Date, default: Date.now },
    attachments: [String],
  },
  { _id: true }
);

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New conversation" },
    messages: [MessageSchema],
    status: {
      type: String,
      enum: ["active", "escalated", "closed"],
      default: "active",
    },
    assignedAgentId: { type: Schema.Types.ObjectId, ref: "User" },
    escalatedAt: Date,
    searchText: { type: String, default: "", index: "text" },
  },
  { timestamps: true }
);

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", ConversationSchema);

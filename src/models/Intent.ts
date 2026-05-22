import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IIntent extends Document {
  intentName: string;
  examples: string[];
  responses: string[];
  usageCount: number;
  failCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const IntentSchema = new Schema<IIntent>(
  {
    intentName: { type: String, required: true, unique: true, trim: true },
    examples: [{ type: String }],
    responses: [{ type: String }],
    usageCount: { type: Number, default: 0 },
    failCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Intent: Model<IIntent> =
  mongoose.models.Intent || mongoose.model<IIntent>("Intent", IntentSchema);

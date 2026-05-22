import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { UserRole } from "@/types";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isOnline: boolean;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "admin", "support-agent"],
      default: "user",
    },
    isOnline: { type: Boolean, default: false },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

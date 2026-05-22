export type UserRole = "user" | "admin" | "support-agent";

export type MessageSender = "user" | "bot" | "agent" | "system";

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface ChatMessage {
  _id?: string;
  sender: MessageSender;
  content: string;
  intent?: string;
  confidenceScore?: number;
  timestamp: Date;
  attachments?: string[];
}

export interface NlpResult {
  intent: string;
  confidence: number;
  entities: Record<string, string>;
  response: string;
  source: "rasa" | "db" | "local" | "openai";
}

export interface AnalyticsSummary {
  totalChats: number;
  failedIntents: number;
  averageResponseTime: number;
  escalationRate: number;
  activeUsers: number;
  dailyChats: { date: string; count: number }[];
  topIntents: { intent: string; count: number }[];
  aiAccuracy: number;
}

export interface SocketUser {
  id: string;
  name: string;
  role: UserRole;
}

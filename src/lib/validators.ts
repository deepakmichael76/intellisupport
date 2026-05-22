import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["user", "admin", "support-agent"]).optional().default("user"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const chatSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z
    .string()
    .nullish()
    .transform((v) => v ?? undefined),
});

export const intentSchema = z.object({
  intentName: z.string().min(2).max(100),
  examples: z.array(z.string().min(1)).min(1),
  responses: z.array(z.string().min(1)).min(1),
});

export const liveAgentSchema = z.object({
  conversationId: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

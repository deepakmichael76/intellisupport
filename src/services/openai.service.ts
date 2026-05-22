import OpenAI from "openai";
import { isOpenAiEnabled } from "@/lib/nlp-config";
import type { NlpResult } from "@/types";

function getOpenAiClient(): OpenAI | null {
  if (!isOpenAiEnabled()) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

const SYSTEM_PROMPT = `You are a helpful customer support AI assistant for an e-commerce platform.
Detect the user's intent from: greet, order_status, refund, complaint, pricing, support, or unknown.
Respond concisely and professionally in 2-4 sentences.
Return JSON only: {"intent":"...","confidence":0.0-1.0,"response":"..."}`;

export async function queryOpenAI(message: string): Promise<NlpResult | null> {
  const openai = getOpenAiClient();
  if (!openai) return null;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: message },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const content = completion.choices[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        intent: "support",
        confidence: 0.7,
        entities: {},
        response: content,
        source: "openai",
      };
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      intent: string;
      confidence: number;
      response: string;
    };

    return {
      intent: parsed.intent || "support",
      confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.7)),
      entities: {},
      response: parsed.response || content,
      source: "openai",
    };
  } catch {
    return null;
  }
}

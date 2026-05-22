import type { NlpResult } from "@/types";

const RASA_URL = process.env.RASA_URL || "http://localhost:5005";

export async function queryRasa(message: string): Promise<NlpResult | null> {
  try {
    const res = await fetch(`${RASA_URL}/webhooks/rest/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sender: "user", message }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as Array<{ text?: string; custom?: Record<string, unknown> }>;
    const text = data.map((d) => d.text).filter(Boolean).join("\n") || "";

    const parseRes = await fetch(`${RASA_URL}/model/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);

    let intent = "nlu_fallback";
    let confidence = 0.5;
    const entities: Record<string, string> = {};

    if (parseRes?.ok) {
      const parsed = (await parseRes.json()) as {
        intent?: { name: string; confidence: number };
        entities?: Array<{ entity: string; value: string }>;
      };
      intent = parsed.intent?.name || intent;
      confidence = parsed.intent?.confidence ?? confidence;
      parsed.entities?.forEach((e) => {
        entities[e.entity] = e.value;
      });
    }

    return {
      intent,
      confidence,
      entities,
      response: text || "I received your message. How else can I help?",
      source: "rasa",
    };
  } catch {
    return null;
  }
}

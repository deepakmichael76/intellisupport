import { Intent } from "@/models/Intent";
import {
  getMinIntentConfidence,
  getNlpMode,
  isOpenAiEnabled,
} from "@/lib/nlp-config";
import type { NlpResult } from "@/types";
import { queryRasa } from "./rasa.service";
import { queryOpenAI } from "./openai.service";

const FALLBACK_RESPONSES: Record<string, string> = {
  greet: "Hello! Welcome to our support. How can I assist you today?",
  order_status:
    "I can help track your order. Please share your order number, or check your email for tracking details.",
  refund:
    "Refunds are processed within 5-7 business days. Would you like to start a refund request?",
  complaint:
    "I'm sorry to hear that. Please describe the issue and we'll escalate to a specialist if needed.",
  pricing:
    "Our pricing varies by product. Visit our pricing page or tell me which product you're interested in.",
  support:
    "I'm here to help! Describe your issue and I'll do my best to assist or connect you with an agent.",
  nlu_fallback:
    "I'm not sure I understood that. Could you rephrase, or would you like to speak with a live agent?",
};

function simpleIntentMatch(message: string): NlpResult {
  const lower = message.toLowerCase();
  const rules: Array<{ intent: string; keywords: string[]; confidence: number }> = [
    { intent: "greet", keywords: ["hello", "hi", "hey", "good morning"], confidence: 0.85 },
    {
      intent: "order_status",
      keywords: ["track", "order", "package", "shipping", "delivery", "where is"],
      confidence: 0.82,
    },
    { intent: "refund", keywords: ["refund", "money back", "return"], confidence: 0.8 },
    { intent: "complaint", keywords: ["complaint", "angry", "terrible", "broken", "damaged"], confidence: 0.78 },
    { intent: "pricing", keywords: ["price", "cost", "how much", "plan"], confidence: 0.75 },
    { intent: "support", keywords: ["help", "support", "agent", "assist"], confidence: 0.7 },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((k) => lower.includes(k))) {
      return {
        intent: rule.intent,
        confidence: rule.confidence,
        entities: {},
        response: FALLBACK_RESPONSES[rule.intent],
        source: "local",
      };
    }
  }

  return {
    intent: "nlu_fallback",
    confidence: 0.3,
    entities: {},
    response: FALLBACK_RESPONSES.nlu_fallback,
    source: "local",
  };
}

async function matchFromDb(message: string): Promise<NlpResult | null> {
  const intents = await Intent.find().lean();
  const lower = message.toLowerCase().trim();

  for (const intent of intents) {
    const matched = intent.examples.some((ex) => {
      const example = ex.toLowerCase().trim();
      return lower.includes(example) || example.includes(lower);
    });
    if (matched) {
      const response =
        intent.responses[Math.floor(Math.random() * intent.responses.length)] ||
        FALLBACK_RESPONSES.support;
      return {
        intent: intent.intentName,
        confidence: 0.88,
        entities: {},
        response,
        source: "db",
      };
    }
  }
  return null;
}

async function tryRasa(message: string): Promise<NlpResult | null> {
  const rasaResult = await queryRasa(message);
  const minConf = getMinIntentConfidence();
  if (rasaResult && rasaResult.confidence >= minConf && rasaResult.intent !== "nlu_fallback") {
    return rasaResult;
  }
  return null;
}

/** DB intents, then built-in keyword rules (no external APIs) */
async function runDbPipeline(message: string): Promise<NlpResult> {
  const dbResult = await matchFromDb(message);
  if (dbResult) return dbResult;
  return simpleIntentMatch(message);
}

/** Rasa first, then DB + local if Rasa is down or low confidence */
async function runRasaPipeline(message: string): Promise<NlpResult> {
  const rasaResult = await tryRasa(message);
  if (rasaResult) return rasaResult;
  return runDbPipeline(message);
}

/** Rasa → DB → optional OpenAI → local */
async function runHybridPipeline(message: string): Promise<NlpResult> {
  const rasaResult = await tryRasa(message);
  if (rasaResult) return rasaResult;

  const dbResult = await matchFromDb(message);
  if (dbResult) return dbResult;

  if (isOpenAiEnabled()) {
    const openaiResult = await queryOpenAI(message);
    if (openaiResult) return openaiResult;
  }

  return simpleIntentMatch(message);
}

export async function processMessage(message: string): Promise<NlpResult> {
  const mode = getNlpMode();

  switch (mode) {
    case "db":
      return runDbPipeline(message);
    case "rasa":
      return runRasaPipeline(message);
    case "hybrid":
    default:
      return runHybridPipeline(message);
  }
}

export function getConfidenceThreshold(): number {
  return parseFloat(process.env.AI_CONFIDENCE_THRESHOLD || "0.6");
}

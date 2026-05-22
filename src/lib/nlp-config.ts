export type NlpMode = "db" | "rasa" | "hybrid";

/** Recommended default: `db` — no API keys, uses MongoDB intents + local rules */
export function getNlpMode(): NlpMode {
  const raw = (process.env.NLP_MODE || "db").toLowerCase();
  if (raw === "rasa" || raw === "hybrid" || raw === "db") return raw;
  return "db";
}

/** Minimum confidence to accept a Rasa intent (before falling back) */
export function getMinIntentConfidence(): number {
  const v = parseFloat(process.env.RASA_MIN_CONFIDENCE || "0.5");
  return Number.isFinite(v) ? v : 0.5;
}

export function isOpenAiEnabled(): boolean {
  if (process.env.USE_OPENAI_FALLBACK !== "true") return false;
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return false;
  if (key.startsWith("sk-your")) return false;
  return true;
}

export function getNlpPipelineDescription(): string {
  const mode = getNlpMode();
  const openai = isOpenAiEnabled();

  if (mode === "db") {
    return "MongoDB intents → local keyword rules";
  }
  if (mode === "rasa") {
    return "Rasa NLU + responses → MongoDB intents → local keyword rules";
  }
  return openai
    ? "Rasa → MongoDB intents → OpenAI (optional) → local keyword rules"
    : "Rasa → MongoDB intents → local keyword rules";
}

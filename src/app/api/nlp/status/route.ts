import { NextResponse } from "next/server";
import {
  getNlpMode,
  getNlpPipelineDescription,
  isOpenAiEnabled,
} from "@/lib/nlp-config";
import { getConfidenceThreshold } from "@/services/nlp.service";

/** Public health check for NLP configuration (no secrets exposed) */
export async function GET() {
  return NextResponse.json({
    mode: getNlpMode(),
    pipeline: getNlpPipelineDescription(),
    openAiEnabled: isOpenAiEnabled(),
    confidenceThreshold: getConfidenceThreshold(),
    rasaUrl: process.env.RASA_URL || "http://localhost:5005",
  });
}

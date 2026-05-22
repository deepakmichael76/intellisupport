import { connectDB } from "../src/lib/db";
import { getNlpMode, getNlpPipelineDescription } from "../src/lib/nlp-config";
import { processMessage } from "../src/services/nlp.service";

async function main() {
  console.log("NLP_MODE:", getNlpMode());
  console.log("Pipeline:", getNlpPipelineDescription());
  await connectDB();

  const samples = ["hello", "track my order", "I want a refund", "asdfgh random"];
  for (const msg of samples) {
    const r = await processMessage(msg);
    console.log(`"${msg}" → intent=${r.intent} source=${r.source} confidence=${r.confidence.toFixed(2)}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

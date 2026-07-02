import { z } from "zod";
import { getLlmClient, getLlmModel, isLlmEnabled } from "./client";
import { buildEnrichmentPrompt, LlmEnrichmentSchema } from "./build-prompt";
import type { CampaignInput } from "@/lib/schemas/campaign";
import type { AnalysisResult } from "@/lib/schemas/analysis-result";
import type { PersonasFile } from "@/types";

const enrichmentResponseSchema = LlmEnrichmentSchema;

export async function enrichAnalysis(
  campaign: CampaignInput,
  rulesResult: AnalysisResult,
  personasFile: PersonasFile,
): Promise<z.infer<typeof enrichmentResponseSchema> | null> {
  if (!isLlmEnabled()) {
    return null;
  }

  const client = getLlmClient();
  if (!client) {
    return null;
  }

  const prompt = buildEnrichmentPrompt(campaign, rulesResult, personasFile);

  try {
    const response = await client.chat.completions.create({
      model: getLlmModel(),
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return null;
    }

    const parsed = JSON.parse(content) as unknown;
    const validated = enrichmentResponseSchema.safeParse(parsed);
    return validated.success ? validated.data : null;
  } catch {
    return null;
  }
}

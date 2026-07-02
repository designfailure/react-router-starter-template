import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { CampaignInput } from "@/lib/schemas/campaign";
import type { AnalysisResult } from "@/lib/schemas/analysis-result";
import type { PersonasFile } from "@/types";

let cachedSystemPrompt: string | null = null;

function getSystemPrompt(): string {
  if (cachedSystemPrompt) {
    return cachedSystemPrompt;
  }

  const filePath = path.join(process.cwd(), "prompts", "gtm-resonance-v1.md");
  cachedSystemPrompt = fs.readFileSync(filePath, "utf8");
  return cachedSystemPrompt;
}

export function buildEnrichmentPrompt(
  campaign: CampaignInput,
  rulesResult: AnalysisResult,
  personasFile: PersonasFile,
): { system: string; user: string } {
  const personaSummaries = personasFile.personas.map((persona) => {
    const score = rulesResult.persona_scores.find((item) => item.persona_id === persona.id);
    return {
      persona_id: persona.id,
      name: persona.name,
      goals: persona.goals.slice(0, 3),
      barriers: persona.barriers.slice(0, 3),
      appeal_index: score?.appeal_index,
      content_acceptance: score?.content_acceptance,
      predicted_ctr_pct: score?.predicted_ctr_pct,
      predicted_cvr_pct: score?.predicted_cvr_pct,
      fit_rationale: score?.fit_rationale ?? [],
      risks: score?.risks ?? [],
    };
  });

  const user = {
    instructions:
      "Vrni izključno veljaven JSON. Ne spreminjaj številk. Dopolni le fit_rationale, risks, recommendations, message_decomposition, optimization_playbook in executive_summary_sl.",
    campaign,
    persona_summaries: personaSummaries,
    rules_result: {
      campaign_summary: rulesResult.campaign_summary,
      aggregate: rulesResult.aggregate,
      assumptions: rulesResult.assumptions,
      message_decomposition: rulesResult.message_decomposition,
      optimization_playbook: rulesResult.optimization_playbook,
    },
  };

  return {
    system: getSystemPrompt(),
    user: JSON.stringify(user, null, 2),
  };
}

export const LlmEnrichmentSchema = z
  .object({
    persona_scores: z
      .array(
        z
          .object({
            persona_id: z.enum(["PA-01", "PA-02", "PA-03", "PA-04", "PA-05", "PA-06"]),
            fit_rationale: z.array(z.string()).optional(),
            risks: z.array(z.string()).optional(),
            recommendations: z.array(z.string()).optional(),
          })
          .strict(),
      )
      .optional(),
    message_decomposition: z
      .object({
        detected_tone: z.string().optional(),
        detected_hooks: z.array(z.string()).optional(),
        detected_barriers: z.array(z.string()).optional(),
        trust_signals_found: z.array(z.string()).optional(),
        missing_elements: z.array(z.string()).optional(),
      })
      .optional(),
    optimization_playbook: z
      .array(
        z
          .object({
            priority: z.number().int().positive(),
            change: z.string(),
            expected_impact: z.string(),
          })
          .strict(),
      )
      .optional(),
    executive_summary_sl: z.array(z.string()).optional(),
  })
  .strict();

export type LlmEnrichment = z.infer<typeof LlmEnrichmentSchema>;

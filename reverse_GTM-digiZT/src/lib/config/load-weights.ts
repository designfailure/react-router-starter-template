import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { z } from "zod";

const formatRatesSchema = z
  .object({
    static: z.number().min(0),
    carousel: z.number().min(0),
    video: z.number().min(0),
    story: z.number().min(0),
    landing_page: z.number().min(0),
  })
  .strict();

const weightsSchema = z
  .object({
    version: z.string(),
    cas_weights: z
      .object({
        channel_fit: z.number().min(0),
        tone_fit: z.number().min(0),
        push_tolerance: z.number().min(0),
        language_clarity: z.number().min(0),
        relevance: z.number().min(0),
      })
      .strict(),
    appeal_weights: z
      .object({
        goal_alignment: z.number().min(0),
        motivation_match: z.number().min(0),
        concern_resolution: z.number().min(0),
        trust_alignment: z.number().min(0),
      })
      .strict(),
    base_ctr: z
      .object({
        meta: formatRatesSchema,
        google: formatRatesSchema,
        email: formatRatesSchema,
        display: formatRatesSchema,
        vet_partnership: formatRatesSchema,
        organic: formatRatesSchema,
      })
      .strict(),
    ctr_modifiers: z
      .object({
        headline_hook: z.number().min(0),
        cta_clarity: z.number().min(0),
        visual_audience_match: z.number().min(0),
        offer_specificity: z.number().min(0),
        total_cap: z.number().min(0),
      })
      .strict(),
    cvr_modifiers: z
      .object({
        hidden_price: z.object({
          "PA-01": z.number().min(0),
          "PA-02": z.number().min(0),
          "PA-03": z.number().min(0),
          "PA-04": z.number().min(0),
          "PA-05": z.number().min(0),
          "PA-06": z.number().min(0),
        }),
        vet_trust: z.object({
          "PA-01": z.number().min(0),
          "PA-02": z.number().min(0),
          "PA-03": z.number().min(0),
          "PA-04": z.number().min(0),
          "PA-05": z.number().min(0),
          "PA-06": z.number().min(0),
        }),
        family_messaging: z.object({
          "PA-01": z.number().min(0),
          "PA-02": z.number().min(0),
          "PA-03": z.number().min(0),
          "PA-04": z.number().min(0),
          "PA-05": z.number().min(0),
          "PA-06": z.number().min(0),
        }),
        urgency_without_proof_all: z.number().min(0),
        pa03_unsimplified_penalty: z.number().min(0),
      })
      .strict(),
    verdict_thresholds: z
      .object({
        strong: z.number().min(0),
        moderate: z.number().min(0),
      })
      .strict(),
  })
  .strict();

export type ScoringWeights = z.infer<typeof weightsSchema>;

let cachedWeights: ScoringWeights | null = null;

export function loadWeights(): ScoringWeights {
  if (cachedWeights) {
    return cachedWeights;
  }

  const filePath = path.join(process.cwd(), "config", "scoring_weights.yaml");
  const file = fs.readFileSync(filePath, "utf8");
  const parsed = yaml.load(file) as unknown;
  const validated = weightsSchema.parse(parsed);
  cachedWeights = validated;
  return validated;
}

export function resetWeightsCache(): void {
  cachedWeights = null;
}

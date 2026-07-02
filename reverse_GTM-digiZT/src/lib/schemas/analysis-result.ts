import { z } from "zod";

const personaScoreSchema = z
  .object({
    persona_id: z.enum(["PA-01", "PA-02", "PA-03", "PA-04", "PA-05", "PA-06"]),
    persona_name: z.string().min(1),
    content_acceptance: z.number().finite().min(0).max(100),
    appeal_index: z.number().finite().min(0).max(100),
    predicted_ctr_pct: z.number().finite().min(0),
    predicted_cvr_pct: z.number().finite().min(0),
    funnel: z
      .object({
        impression_to_click: z.number().finite().min(0),
        click_to_engagement: z.number().finite().min(0),
        engagement_to_intent: z.number().finite().min(0),
        intent_to_conversion: z.number().finite().min(0),
      })
      .strict(),
    fit_rationale: z.array(z.string().min(1)),
    risks: z.array(z.string().min(1)),
    recommendations: z.array(z.string().min(1)),
  })
  .strict();

const aggregateSchema = z
  .object({
    weighted_appeal: z.number().finite().min(0).max(100),
    weighted_ctr_pct: z.number().finite().min(0),
    weighted_cvr_pct: z.number().finite().min(0),
    best_persona: z.enum(["PA-01", "PA-02", "PA-03", "PA-04", "PA-05", "PA-06"]),
    worst_persona: z.enum(["PA-01", "PA-02", "PA-03", "PA-04", "PA-05", "PA-06"]),
    primary_conversion_leak: z.string().min(1),
  })
  .strict();

const decompositionSchema = z
  .object({
    detected_tone: z.string().min(1),
    detected_hooks: z.array(z.string().min(1)),
    detected_barriers: z.array(z.string().min(1)),
    trust_signals_found: z.array(z.string().min(1)),
    missing_elements: z.array(z.string().min(1)),
  })
  .strict();

const playbookSchema = z
  .object({
    priority: z.number().int().positive(),
    change: z.string().min(1),
    expected_impact: z.string().min(1),
  })
  .strict();

export const AnalysisResultSchema = z
  .object({
    campaign_summary: z
      .object({
        name: z.string().min(1),
        objective: z.string().min(1),
        channel: z.string().min(1),
        overall_verdict: z.enum(["strong", "moderate", "weak"]),
      })
      .strict(),
    persona_scores: z.array(personaScoreSchema).length(6),
    aggregate: aggregateSchema,
    message_decomposition: decompositionSchema,
    optimization_playbook: z.array(playbookSchema),
    assumptions: z.array(z.string().min(1)),
    executive_summary_sl: z.array(z.string().min(1)).length(5),
    meta: z
      .object({
        mode: z.enum(["full", "rules_only"]),
        llm_used: z.boolean(),
        config_version: z.string().min(1),
        warnings: z.array(z.string().min(1)),
      })
      .strict(),
  })
  .strict();

export type PersonaScoreResult = z.infer<typeof personaScoreSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type AnalysisMeta = AnalysisResult["meta"];
export type AnalysisAggregate = AnalysisResult["aggregate"];

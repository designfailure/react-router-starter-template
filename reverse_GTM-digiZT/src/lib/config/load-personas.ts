import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { PersonasFile } from "@/types";

const scoringPreferencesSchema = z
  .object({
    channel_preferences: z.record(
      z.enum(["meta", "google", "email", "display", "vet_partnership", "organic"]),
      z.number().min(0).max(1),
    ),
    preferred_tones: z.array(z.enum(["emotional", "rational", "friendly", "authoritative", "urgent"])),
    push_tolerance: z.enum(["low", "medium", "high"]),
    jargon_tolerance: z.enum(["low", "medium", "high"]),
    goal_keywords: z.array(z.string()),
    motivation_keywords: z.array(z.string()),
    concern_keywords: z.array(z.string()),
    trust_keywords: z.array(z.string()),
  })
  .strict();

const personaSchema = z
  .object({
    id: z.enum(["PA-01", "PA-02", "PA-03", "PA-04", "PA-05", "PA-06"]),
    name: z.string(),
    template_column: z.string(),
    age_range: z.string(),
    income_range: z.string(),
    goals: z.array(z.string()),
    motivations: z.array(z.string()),
    concerns: z.array(z.string()),
    channels: z.array(z.enum(["meta", "google", "email", "display", "vet_partnership", "organic"])),
    decision_model: z.string(),
    messaging_hooks: z.array(z.string()),
    barriers: z.array(z.string()),
    funnel_multipliers: z
      .object({
        landing_engagement: z.number().min(0).max(1),
        intent: z.number().min(0).max(1),
        completion: z.number().min(0).max(1),
      })
      .strict(),
    segment_weight: z.number().min(0).max(1),
    scoring: scoringPreferencesSchema,
  })
  .strict();

const personasFileSchema = z
  .object({
    version: z.string(),
    source: z.string(),
    default_segment_weights: z.record(
      z.enum(["PA-01", "PA-02", "PA-03", "PA-04", "PA-05", "PA-06"]),
      z.number().min(0).max(1),
    ),
    personas: z.array(personaSchema).length(6),
  })
  .strict();

let cachedPersonas: PersonasFile | null = null;

export function loadPersonas(): PersonasFile {
  if (cachedPersonas) {
    return cachedPersonas;
  }

  const filePath = path.join(process.cwd(), "data", "personas.json");
  const file = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(file) as unknown;
  const validated = personasFileSchema.parse(parsed);
  cachedPersonas = validated;
  return validated;
}

export function resetPersonasCache(): void {
  cachedPersonas = null;
}

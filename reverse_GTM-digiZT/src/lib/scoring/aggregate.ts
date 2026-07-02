import { round } from "./utils";
import type { PersonasFile } from "@/types";
import type { PersonaScoreResult } from "@/lib/schemas/analysis-result";

export interface AggregateInput {
  personasFile: PersonasFile;
  personaScores: PersonaScoreResult[];
}

export function aggregateScores({ personasFile, personaScores }: AggregateInput) {
  const weights = personasFile.default_segment_weights;
  const weightedAppeal = round(
    personaScores.reduce((sum, item) => sum + item.appeal_index * (weights[item.persona_id] ?? 0), 0),
    2,
  );
  const weightedCtrPct = round(
    personaScores.reduce((sum, item) => sum + item.predicted_ctr_pct * (weights[item.persona_id] ?? 0), 0),
    2,
  );
  const weightedCvrPct = round(
    personaScores.reduce((sum, item) => sum + item.predicted_cvr_pct * (weights[item.persona_id] ?? 0), 0),
    2,
  );

  const bestPersona = personaScores.reduce((best, item) => (item.appeal_index > best.appeal_index ? item : best));
  const worstPersona = personaScores.reduce((worst, item) => (item.appeal_index < worst.appeal_index ? item : worst));
  const funnel = bestPersona.funnel;
  const drops = [
    { stage: "klikom in angažmajem", value: 1 - funnel.click_to_engagement, start: funnel.impression_to_click, end: funnel.click_to_engagement },
    { stage: "angažmajem in namenom", value: 1 - funnel.engagement_to_intent, start: funnel.click_to_engagement, end: funnel.engagement_to_intent },
    { stage: "namenom in konverzijo", value: 1 - funnel.intent_to_conversion, start: funnel.engagement_to_intent, end: funnel.intent_to_conversion },
  ];
  const primaryDrop = drops.reduce((best, item) => (item.value > best.value ? item : best));

  return {
    weighted_appeal: weightedAppeal,
    weighted_ctr_pct: weightedCtrPct,
    weighted_cvr_pct: weightedCvrPct,
    best_persona: bestPersona.persona_id,
    worst_persona: worstPersona.persona_id,
    primary_conversion_leak: `Največji odtok je med ${primaryDrop.stage} pri ${bestPersona.persona_id} (${primaryDrop.start.toFixed(2)} → ${primaryDrop.end.toFixed(2)}).`,
  };
}

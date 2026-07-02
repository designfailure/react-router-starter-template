import { clamp, round } from "./utils";
import { detectHookSignals, visualAudienceMatchScore } from "./heuristics";
import type { CampaignInput } from "@/lib/schemas/campaign";
import type { Persona } from "@/types";
import type { ScoringWeights } from "@/lib/config/load-weights";
import type { ContentAcceptanceResult } from "./content-acceptance";
import type { AppealIndexResult } from "./appeal-index";

export interface CtrResult {
  ctrPct: number;
  modifierDetails: {
    headlineHook: number;
    ctaClarity: number;
    visualAudienceMatch: number;
    offerSpecificity: number;
    total: number;
  };
}

function signedModifier(score: number, cap: number): number {
  return clamp((score - 0.5) * 2 * cap, -cap, cap);
}

export function predictCtr(
  campaign: CampaignInput,
  persona: Persona,
  weights: ScoringWeights,
  appeal: AppealIndexResult,
  acceptance: ContentAcceptanceResult,
  visualMatchSignal?: number,
): CtrResult {
  const hooks = detectHookSignals(campaign, visualMatchSignal);
  const baseCtr = weights.base_ctr[campaign.channel][campaign.format];
  const headlineHook = signedModifier(hooks.headlineHookStrength, weights.ctr_modifiers.headline_hook);
  const ctaClarity = signedModifier(hooks.ctaClarityStrength, weights.ctr_modifiers.cta_clarity);
  const visualAudienceMatch = signedModifier(
    visualAudienceMatchScore(campaign, visualMatchSignal),
    weights.ctr_modifiers.visual_audience_match,
  );
  const offerSpecificity = signedModifier(hooks.offerSpecificityStrength, weights.ctr_modifiers.offer_specificity);

  const total = clamp(
    headlineHook + ctaClarity + visualAudienceMatch + offerSpecificity,
    -weights.ctr_modifiers.total_cap,
    weights.ctr_modifiers.total_cap,
  );

  const ctrPct =
    baseCtr *
    (0.5 + appeal.score / 200) *
    (0.5 + acceptance.score / 200) *
    (1 + total);

  return {
    ctrPct: round(Math.max(0, ctrPct), 2),
    modifierDetails: {
      headlineHook: round(headlineHook, 3),
      ctaClarity: round(ctaClarity, 3),
      visualAudienceMatch: round(visualAudienceMatch, 3),
      offerSpecificity: round(offerSpecificity, 3),
      total: round(total, 3),
    },
  };
}

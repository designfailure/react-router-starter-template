import { clamp, round } from "./utils";
import type { CampaignInput } from "@/lib/schemas/campaign";
import type { Persona } from "@/types";
import type { ScoringWeights } from "@/lib/config/load-weights";
import type { CtrResult } from "./ctr-predictor";
import { detectHookSignals } from "./heuristics";

export interface CvrResult {
  cvrPct: number;
  funnel: {
    impression_to_click: number;
    click_to_engagement: number;
    engagement_to_intent: number;
    intent_to_conversion: number;
  };
}

export function predictCvr(
  campaign: CampaignInput,
  persona: Persona,
  weights: ScoringWeights,
  ctr: CtrResult,
): CvrResult {
  const hooks = detectHookSignals(campaign);
  const baseStages = { ...persona.funnel_multipliers };
  const hasVetTrust = hooks.hasVetTrust || (campaign.trust_signals ?? []).some((signal) => /veteran|vet|veterinars/i.test(signal));
  const hasFamilyMessaging = hooks.hasFamilyMessaging;
  const urgencyWithoutProof = hooks.urgencyWithoutProof;
  const simplifiedLanding = campaign.landing_url_type === "education" || campaign.landing_url_type === "quote";

  const hiddenPriceFactor =
    campaign.price_signal === "hidden" ? weights.cvr_modifiers.hidden_price[persona.id] ?? 1 : 1;
  const vetTrustFactor = hasVetTrust ? weights.cvr_modifiers.vet_trust[persona.id] ?? 1 : 1;
  const familyMessagingFactor = hasFamilyMessaging ? weights.cvr_modifiers.family_messaging[persona.id] ?? 1 : 1;
  const urgencyFactor = urgencyWithoutProof ? weights.cvr_modifiers.urgency_without_proof_all : 1;
  const pa03Penalty = persona.id === "PA-03" && !(simplifiedLanding && hasVetTrust) ? weights.cvr_modifiers.pa03_unsimplified_penalty : 1;

  const clickToEngagement = clamp(baseStages.landing_engagement, 0, 1);
  const engagementToIntent = clamp(baseStages.intent * hiddenPriceFactor * familyMessagingFactor, 0, 1.5);
  const intentToConversion = clamp(baseStages.completion * vetTrustFactor * urgencyFactor * pa03Penalty, 0, 1.5);

  const impressionToClick = clamp(ctr.ctrPct / 100, 0, 1.5);
  const cvrPct = impressionToClick * clickToEngagement * engagementToIntent * intentToConversion * 100;

  return {
    cvrPct: round(Math.max(0, cvrPct), 2),
    funnel: {
      impression_to_click: round(impressionToClick, 4),
      click_to_engagement: round(clickToEngagement, 4),
      engagement_to_intent: round(engagementToIntent, 4),
      intent_to_conversion: round(intentToConversion, 4),
    },
  };
}

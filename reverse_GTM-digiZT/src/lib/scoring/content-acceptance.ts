import { clamp } from "./utils";
import { hasPolicyJargon, relevanceScore } from "./heuristics";
import type { CampaignInput } from "@/lib/schemas/campaign";
import type { Persona } from "@/types";

export interface ContentAcceptanceResult {
  score: number;
  details: {
    channelFit: number;
    toneFit: number;
    pushTolerance: number;
    languageClarity: number;
    relevance: number;
  };
}

const pushOrder = { low: 0, medium: 1, high: 2 } as const;

function pushToleranceScore(personaTolerance: Persona["scoring"]["push_tolerance"], campaignPush: NonNullable<CampaignInput["push_intensity"] | CampaignInput["frequency_cap"]>): number {
  const toleranceLevel = pushOrder[personaTolerance];
  const campaignLevel = pushOrder[campaignPush];
  if (campaignLevel <= toleranceLevel) {
    return 1;
  }
  if (campaignLevel === toleranceLevel + 1) {
    return 0.65;
  }
  return 0.35;
}

function languageClarityScore(persona: Persona, campaign: CampaignInput): number {
  const copy = `${campaign.headline} ${campaign.primary_text} ${campaign.cta} ${campaign.offer}`;
  const jargon = hasPolicyJargon(copy);
  if (!jargon) {
    return 1;
  }

  switch (persona.scoring.jargon_tolerance) {
    case "high":
      return 0.9;
    case "medium":
      return 0.65;
    case "low":
      return 0.35;
  }
}

function toneFitScore(persona: Persona, campaign: CampaignInput): number {
  if (persona.scoring.preferred_tones.includes(campaign.tone)) {
    return 1;
  }
  if (persona.scoring.preferred_tones.includes("rational") && campaign.tone === "authoritative") {
    return 0.75;
  }
  if (persona.scoring.preferred_tones.includes("friendly") && campaign.tone === "emotional") {
    return 0.7;
  }
  return 0.4;
}

function channelFitScore(persona: Persona, campaign: CampaignInput): number {
  return clamp(persona.scoring.channel_preferences[campaign.channel] ?? 0, 0, 1);
}

export function scoreContentAcceptance(
  campaign: CampaignInput,
  persona: Persona,
): ContentAcceptanceResult {
  const pushIntensity = campaign.push_intensity ?? campaign.frequency_cap ?? "medium";
  const details = {
    channelFit: channelFitScore(persona, campaign),
    toneFit: toneFitScore(persona, campaign),
    pushTolerance: pushToleranceScore(persona.scoring.push_tolerance, pushIntensity),
    languageClarity: languageClarityScore(persona, campaign),
    relevance: relevanceScore(campaign),
  };

  const score =
    100 *
    (0.25 * details.channelFit +
      0.2 * details.toneFit +
      0.15 * details.pushTolerance +
      0.2 * details.languageClarity +
      0.2 * details.relevance);

  return {
    score: clamp(score, 0, 100),
    details,
  };
}

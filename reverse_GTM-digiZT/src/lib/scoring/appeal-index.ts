import { clamp, keywordOverlapScore } from "./utils";
import type { CampaignInput } from "@/lib/schemas/campaign";
import type { Persona } from "@/types";

export interface AppealIndexResult {
  score: number;
  details: {
    goalAlignment: number;
    motivationMatch: number;
    concernResolution: number;
    trustAlignment: number;
  };
}

function trustSignalText(campaign: CampaignInput): string {
  return [campaign.primary_text, campaign.headline, campaign.cta, campaign.offer, ...(campaign.trust_signals ?? [])].join(" ");
}

export function scoreAppealIndex(campaign: CampaignInput, persona: Persona): AppealIndexResult {
  const trustText = trustSignalText(campaign);
  const details = {
    goalAlignment: keywordOverlapScore(persona.scoring.goal_keywords, `${campaign.headline} ${campaign.primary_text} ${campaign.offer}`),
    motivationMatch: keywordOverlapScore(persona.scoring.motivation_keywords, `${campaign.primary_text} ${campaign.offer}`),
    concernResolution: keywordOverlapScore(persona.scoring.concern_keywords, `${campaign.headline} ${campaign.primary_text} ${campaign.offer}`),
    trustAlignment: clamp(
      Math.min(
        1,
        keywordOverlapScore(persona.scoring.trust_keywords, trustText) +
          keywordOverlapScore(persona.scoring.trust_keywords, campaign.trust_signals?.join(" ") ?? "") * 0.3,
      ),
      0,
      1,
    ),
  };

  const score =
    100 *
    (0.3 * details.goalAlignment +
      0.25 * details.motivationMatch +
      0.25 * details.concernResolution +
      0.2 * details.trustAlignment);

  return {
    score: clamp(score, 0, 100),
    details,
  };
}

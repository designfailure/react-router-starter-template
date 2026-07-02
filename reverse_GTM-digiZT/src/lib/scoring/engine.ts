import type { CampaignInput } from "@/lib/schemas/campaign";
import type { AnalysisResult, PersonaScoreResult } from "@/lib/schemas/analysis-result";
import { loadPersonas } from "@/lib/config/load-personas";
import { loadWeights } from "@/lib/config/load-weights";
import { scoreContentAcceptance } from "./content-acceptance";
import { scoreAppealIndex } from "./appeal-index";
import { predictCtr } from "./ctr-predictor";
import { predictCvr } from "./cvr-predictor";
import { aggregateScores } from "./aggregate";
import { detectHookSignals, detectMessageDecomposition } from "./heuristics";

export interface EngineOptions {
  visualMatchSignal?: number;
}

export type EngineResult = AnalysisResult;

function verdictFromAppeal(weightedAppeal: number, thresholds: { strong: number; moderate: number }): "strong" | "moderate" | "weak" {
  if (weightedAppeal >= thresholds.strong) {
    return "strong";
  }
  if (weightedAppeal >= thresholds.moderate) {
    return "moderate";
  }
  return "weak";
}

function buildPersonaFeedback(
  campaign: CampaignInput,
  personaId: PersonaScoreResult["persona_id"],
  acceptanceScore: number,
  appealScore: number,
  hooks: ReturnType<typeof detectHookSignals>,
): Pick<PersonaScoreResult, "fit_rationale" | "risks" | "recommendations"> {
  const reasons: string[] = [];
  const risks: string[] = [];
  const recommendations: string[] = [];
  if (acceptanceScore >= 70) {
    reasons.push("Sporočilo je dobro usklajeno s kanalom in tonom.");
  } else {
    reasons.push("Kanalski ali tonski fit je omejen.");
  }
  if (appealScore >= 60) {
    reasons.push("Naslavlja ključne motivacije in skrbi osebe.");
  }
  if (hooks.hasVetTrust) {
    reasons.push("Prisoten je veterinarski signal zaupanja.");
  } else {
    risks.push("Manjka jasen veterinarski signal zaupanja.");
    recommendations.push("Dodaj veterinarja, pregled ali lokalno strokovno referenco.");
  }
  if (hooks.hasFamilyMessaging) {
    reasons.push("Sporočilo vključuje družinski okvir.");
  }
  if (campaign.price_signal === "hidden" && (personaId === "PA-01" || personaId === "PA-03" || personaId === "PA-04")) {
    risks.push("Skrita cena lahko zniža konverzijo.");
  }
  if (hooks.urgencyWithoutProof) {
    risks.push("Nujnost brez dokazov lahko zniža zaupanje.");
    recommendations.push("Dodaj dokaz, referenco ali konkreten primer.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Okrepi jasnost ponudbe in CTA.");
  }
  return {
    fit_rationale: reasons,
    risks,
    recommendations,
  };
}

function buildPlaybook(campaign: CampaignInput): Array<{ priority: number; change: string; expected_impact: string }> {
  const playbook: Array<{ priority: number; change: string; expected_impact: string }> = [];
  playbook.push({
    priority: 1,
    change: "Dodaj bolj jasen veterinarski ali zaupanja vreden dokaz.",
    expected_impact: "Višji Appeal Index in manjši odtok pri konverziji.",
  });
  playbook.push({
    priority: 2,
    change: "Poenostavi CTA in prvo poved z več konkretike.",
    expected_impact: "Boljši CTR zaradi jasnejšega hooka.",
  });
  if (campaign.price_signal === "hidden") {
    playbook.push({
      priority: 3,
      change: "Razkrij cenovni signal ali dodaj primerjavo vrednosti.",
      expected_impact: "Manjši padec pri občutljivih segmentih.",
    });
  }
  return playbook;
}

function buildExecutiveSummary(personaScores: PersonaScoreResult[], aggregate: ReturnType<typeof aggregateScores>): string[] {
  const best = personaScores.find((item) => item.persona_id === aggregate.best_persona);
  const worst = personaScores.find((item) => item.persona_id === aggregate.worst_persona);
  return [
    `Najmočnejši segment je ${best?.persona_name ?? aggregate.best_persona}.`,
    `Najšibkejši segment je ${worst?.persona_name ?? aggregate.worst_persona}.`,
    `Skupna privlačnost je ocenjena na ${aggregate.weighted_appeal.toFixed(2)} / 100.`,
    `Največji odtok je: ${aggregate.primary_conversion_leak}`,
    "Ocene so modelirane in primerne za pred-launch optimizacijo.",
  ];
}

export function analyzeCampaign(campaign: CampaignInput, options: EngineOptions = {}): AnalysisResult {
  const personasFile = loadPersonas();
  const weights = loadWeights();
  const personaScores = personasFile.personas.map((persona) => {
    const acceptance = scoreContentAcceptance(campaign, persona, weights);
    const appeal = scoreAppealIndex(campaign, persona, weights);
    const ctr = predictCtr(campaign, persona, weights, appeal, acceptance, options.visualMatchSignal);
    const cvr = predictCvr(campaign, persona, weights, ctr);
    const hooks = detectHookSignals(campaign, options.visualMatchSignal);
    const feedback = buildPersonaFeedback(campaign, persona.id, acceptance.score, appeal.score, hooks);
    return {
      persona_id: persona.id,
      persona_name: persona.name,
      content_acceptance: Math.round(acceptance.score),
      appeal_index: Math.round(appeal.score),
      predicted_ctr_pct: ctr.ctrPct,
      predicted_cvr_pct: cvr.cvrPct,
      funnel: cvr.funnel,
      fit_rationale: feedback.fit_rationale,
      risks: feedback.risks,
      recommendations: feedback.recommendations,
    };
  });

  const aggregate = aggregateScores({ personasFile, personaScores });
  const verdict = verdictFromAppeal(aggregate.weighted_appeal, weights.verdict_thresholds);
  const hooks = detectHookSignals(campaign, options.visualMatchSignal);
  const decomposition = detectMessageDecomposition(campaign, hooks);

  return {
    campaign_summary: {
      name: campaign.campaign_name,
      objective: campaign.objective,
      channel: campaign.channel,
      overall_verdict: verdict,
    },
    persona_scores: personaScores,
    aggregate,
    message_decomposition: {
      detected_tone: decomposition.detectedTone,
      detected_hooks: decomposition.detectedHooks,
      detected_barriers: decomposition.detectedBarriers,
      trust_signals_found: decomposition.trustSignalsFound,
      missing_elements: decomposition.missingElements,
    },
    optimization_playbook: buildPlaybook(campaign),
    assumptions: ["Uporabljene so privzete segmentne uteži (Lead_segments.xlsx ni naložen).", "Vse ocene so prediktivne in modelirane."],
    executive_summary_sl: buildExecutiveSummary(personaScores, aggregate),
    meta: {
      mode: "rules_only",
      llm_used: false,
      config_version: weights.version,
      warnings: [],
    },
  };
}

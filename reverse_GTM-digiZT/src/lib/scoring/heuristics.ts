import { clamp, countKeywordMatches, firstSentence, keywordOverlapScore, normalizeText, wordCount } from "./utils";
import type { CampaignInput } from "@/lib/schemas/campaign";

const ctaVerbs = ["preveri", "zahtevaj", "kontaktiraj", "naroci", "izracunaj", "preizkusi", "poklici", "prijavi"];
const vetTrustRoots = ["veterinar", "veterinarska", "veterinarski", "pregled", "klinika", "strokovn"];
const familyRoots = ["druzin", "otrok", "skupaj", "druzinski", "familij", "partner"];
const priceRoots = ["cena", "popust", "brezplac", "brezpla", "strosek", "cenov", "ugodno"];
const proofRoots = [
  "dokaz",
  "mnenj",
  "ocen",
  "certifikat",
  "referenc",
  "garancij",
  "primerjav",
  "študij",
  "studij",
  "raziskav",
];
const petHealthRoots = ["ljubljenck", "peth", "zdravj", "nega", "skrb", "bolezn", "veterinar", "druzba"];
const policyJargonRoots = ["zavarovalna premija", "fransiza", "kritje", "zavarovaln", "odskodn", "odgovornost"];

export interface HookSignals {
  headlineHookStrength: number;
  ctaClarityStrength: number;
  visualAudienceMatch: number;
  offerSpecificityStrength: number;
  hooks: string[];
  barriers: string[];
  trustSignalsFound: string[];
  hasVetTrust: boolean;
  hasFamilyMessaging: boolean;
  hasPriceMention: boolean;
  urgencyWithoutProof: boolean;
}

export interface MessageDecompositionSignals {
  detectedTone: string;
  detectedHooks: string[];
  detectedBarriers: string[];
  trustSignalsFound: string[];
  missingElements: string[];
}

function toneLabel(tone: CampaignInput["tone"]): string {
  switch (tone) {
    case "emotional":
      return "čustven";
    case "rational":
      return "racionalen";
    case "friendly":
      return "prijazen";
    case "authoritative":
      return "avtoritativen";
    case "urgent":
      return "nujnosten";
  }
}

function detectFirstSentenceHook(headline: string, primaryText: string): number {
  const sentence = firstSentence(`${headline} ${primaryText}`);
  const lengthScore = clamp(1 - Math.abs(wordCount(sentence) - 9) / 12, 0, 1);
  return lengthScore;
}

function hasQuestionMark(text: string): boolean {
  return text.includes("?");
}

function hasDigits(text: string): boolean {
  return /\d/.test(text);
}

export function getCopyCopy(campaign: CampaignInput): string {
  return [campaign.headline, campaign.primary_text, campaign.cta, campaign.offer].join(" ");
}

export function detectHookSignals(campaign: CampaignInput, visualMatchSignal?: number): HookSignals {
  const copy = getCopyCopy(campaign);
  const trustSignals = [
    ...((campaign.trust_signals ?? []).filter(Boolean)),
    ...(countKeywordMatches(vetTrustRoots, copy) > 0 ? ["veterinarski signal"] : []),
  ];

  const hasVetTrust = countKeywordMatches(vetTrustRoots, copy) > 0 || trustSignals.some((signal) => {
    const normalized = normalizeText(signal);
    return normalized.includes("veterinar") || normalized.includes("zavarovaln");
  });
  const hasFamilyMessaging = countKeywordMatches(familyRoots, copy) > 0;
  const hasPriceMention = countKeywordMatches(priceRoots, copy) > 0;
  const hasProofKeyword = countKeywordMatches(proofRoots, copy) > 0;
  const hasEvidenceDigits = hasDigits(copy) || copy.includes("%");
  const noProof = !hasProofKeyword && !hasEvidenceDigits;
  const urgencyWithoutProof = campaign.tone === "urgent" && noProof && (campaign.trust_signals ?? []).length === 0;

  const hooks: string[] = [];
  if (detectFirstSentenceHook(campaign.headline, campaign.primary_text) >= 0.6) {
    hooks.push("kratek uvodni stavek");
  }
  if (hasQuestionMark(copy)) {
    hooks.push("vprašanje v sporočilu");
  }
  if (hasDigits(copy)) {
    hooks.push("številke ali konkretika");
  }
  if (countKeywordMatches(petHealthRoots, copy) > 0) {
    hooks.push("zdravje ljubljenčka");
  }
  if (hasVetTrust) {
    hooks.push("veterinarski dokaz");
  }
  if (hasFamilyMessaging) {
    hooks.push("družinski okvir");
  }
  if (hasPriceMention) {
    hooks.push("cena ali popust");
  }

  const barriers: string[] = [];
  if (campaign.price_signal === "hidden") {
    barriers.push("skrita cena");
  }
  if (!hasVetTrust && urgencyWithoutProof) {
    barriers.push("nujnost brez dokazov");
  }
  if (!hasFamilyMessaging && countKeywordMatches(["družin", "partner", "otro"], copy) === 0) {
    barriers.push("manjkajoča družinska relevantnost");
  }

  return {
    headlineHookStrength: clamp(detectFirstSentenceHook(campaign.headline, campaign.primary_text), 0, 1),
    ctaClarityStrength: clamp(countKeywordMatches(ctaVerbs, `${campaign.cta} ${campaign.primary_text}`) / 2, 0, 1),
    visualAudienceMatch: clamp(
      visualMatchSignal ?? keywordOverlapScore(["pes", "mačka", "ljubljenček", "veterinar", "družina", "otrok", "skrb"], campaign.visual_description ?? copy),
      -1,
      1,
    ),
    offerSpecificityStrength: clamp(
      keywordOverlapScore(["brezpla", "popust", "10", "20", "pregled", "cena", "paket", "košar"], campaign.offer),
      0,
      1,
    ),
    hooks,
    barriers,
    trustSignalsFound: trustSignals,
    hasVetTrust,
    hasFamilyMessaging,
    hasPriceMention,
    urgencyWithoutProof,
  };
}

export function detectMessageDecomposition(campaign: CampaignInput, hooks: HookSignals): MessageDecompositionSignals {
  const copy = getCopyCopy(campaign);
  const missingElements: string[] = [];

  if (!hooks.hasVetTrust) {
    missingElements.push("manjka veterinarski signal zaupanja");
  }
  if (!hooks.hasFamilyMessaging && countKeywordMatches(familyRoots, copy) === 0) {
    missingElements.push("manjka družinski kot");
  }
  if (!hooks.hasPriceMention && campaign.price_signal !== "none") {
    missingElements.push("manjka jasnost cene");
  }
  if (campaign.objective !== "awareness" && hooks.headlineHookStrength < 0.4) {
    missingElements.push("šibek takojšnji hook");
  }
  if (campaign.format === "landing_page" && !campaign.visual_description) {
    missingElements.push("ni vizualnega opisa za landing");
  }

  return {
    detectedTone: toneLabel(campaign.tone),
    detectedHooks: hooks.hooks,
    detectedBarriers: hooks.barriers,
    trustSignalsFound: hooks.trustSignalsFound,
    missingElements,
  };
}

export function hasPolicyJargon(text: string): boolean {
  return countKeywordMatches(policyJargonRoots, text) > 0;
}

export function relevanceScore(campaign: CampaignInput): number {
  const copy = getCopyCopy(campaign);
  const petScore = keywordOverlapScore(petHealthRoots, copy);
  const familyScore = keywordOverlapScore(familyRoots, copy);
  const vetScore = keywordOverlapScore(vetTrustRoots, copy);
  const insuranceScore = keywordOverlapScore(policyJargonRoots, copy);
  return clamp(0.45 * petScore + 0.25 * familyScore + 0.25 * vetScore - 0.2 * insuranceScore, 0, 1);
}

export function visualAudienceMatchScore(campaign: CampaignInput, visualMatchSignal?: number): number {
  const visualText = campaign.visual_description ?? "";
  const base = keywordOverlapScore(["pes", "mačka", "ljubljen", "veterinar", "družina", "otrok", "skrb"], visualText);
  if (typeof visualMatchSignal === "number") {
    return clamp((base + clamp((visualMatchSignal + 1) / 2, 0, 1)) / 2, 0, 1);
  }
  return clamp(base, 0, 1);
}

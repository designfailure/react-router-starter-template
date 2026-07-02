import { NextResponse } from "next/server";
import { z } from "zod";
import { CampaignInputSchema } from "@/lib/schemas/campaign";
import type { AnalysisResult } from "@/lib/schemas/analysis-result";
import { analyzeCampaign } from "@/lib/scoring";
import { analyzeImage } from "@/lib/llm/analyze-image";
import { enrichAnalysis } from "@/lib/llm/enrich-analysis";
import { isLlmEnabled } from "@/lib/llm/client";
import { loadPersonas } from "@/lib/config/load-personas";

export const runtime = "nodejs";

const MAX_IMAGE_BASE64_LENGTH = 7_000_000;
const allowedImageMimeTypes = z.enum(["image/jpeg", "image/png", "image/webp"]);

const requestSchema = z
  .object({
    campaign: CampaignInputSchema,
    image_base64: z.string().min(1).max(MAX_IMAGE_BASE64_LENGTH, "Slika je prevelika; največja dovoljena dolžina je približno 7.000.000 znakov.").optional(),
    image_mime: allowedImageMimeTypes.optional(),
    mode: z.enum(["full", "rules_only"]).optional(),
  })
  .strict();

const requestsByIp = new Map<string, { count: number; windowStartMs: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function isRateLimited(request: Request): boolean {
  // Best-effort, per-instance limiter; durable shared limiting is future work.
  const ip = getClientIp(request);
  const now = Date.now();
  const entry = requestsByIp.get(ip);
  if (!entry || now - entry.windowStartMs >= RATE_LIMIT_WINDOW_MS) {
    requestsByIp.set(ip, { count: 1, windowStartMs: now });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count += 1;
  return false;
}

function mergeAnalysis(base: AnalysisResult, enrichment: Awaited<ReturnType<typeof enrichAnalysis>>): AnalysisResult {
  if (!enrichment) {
    return base;
  }

  const personaScores = base.persona_scores.map((score) => {
    const enriched = enrichment.persona_scores?.find((item) => item.persona_id === score.persona_id);
    return {
      ...score,
      fit_rationale: enriched?.fit_rationale ?? score.fit_rationale,
      risks: enriched?.risks ?? score.risks,
      recommendations: enriched?.recommendations ?? score.recommendations,
    };
  });

  return {
    ...base,
    persona_scores: personaScores,
    message_decomposition: enrichment.message_decomposition
      ? {
          detected_tone:
            enrichment.message_decomposition.detected_tone ?? base.message_decomposition.detected_tone,
          detected_hooks: enrichment.message_decomposition.detected_hooks ?? base.message_decomposition.detected_hooks,
          detected_barriers:
            enrichment.message_decomposition.detected_barriers ?? base.message_decomposition.detected_barriers,
          trust_signals_found:
            enrichment.message_decomposition.trust_signals_found ??
            base.message_decomposition.trust_signals_found,
          missing_elements:
            enrichment.message_decomposition.missing_elements ?? base.message_decomposition.missing_elements,
        }
      : base.message_decomposition,
    optimization_playbook: enrichment.optimization_playbook ?? base.optimization_playbook,
    executive_summary_sl: enrichment.executive_summary_sl ?? base.executive_summary_sl,
  };
}

export async function POST(request: Request) {
  try {
    if (isRateLimited(request)) {
      return NextResponse.json({ error: "Preveč zahtev. Poskusite znova čez minuto." }, { status: 429 });
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Neveljaven vhod", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { campaign, image_base64, image_mime, mode = "full" } = parsed.data;
    const warnings: string[] = [];
    const personasFile = loadPersonas();

    let visualMatchSignal: number | undefined;
    const analysisCampaign = { ...campaign };

    if (mode === "full" && image_base64) {
      if (isLlmEnabled()) {
        const imageAnalysis = await analyzeImage(image_base64, image_mime ?? "image/png");
        if (imageAnalysis) {
          analysisCampaign.visual_description = analysisCampaign.visual_description
            ? `${analysisCampaign.visual_description}. ${imageAnalysis.visual_description}`
            : imageAnalysis.visual_description;
          visualMatchSignal = imageAnalysis.visual_match_signal;
        } else {
          warnings.push("Analiza slike ni uspela; uporabljene so le tekstovne ocene.");
        }
      } else {
        warnings.push("LLM ni omogočen, zato analiza slike ni bila izvedena.");
      }
    }

    const rulesResult = analyzeCampaign(analysisCampaign, { visualMatchSignal });
    let finalResult = rulesResult;
    let llmUsed = false;
    let resultMode: "full" | "rules_only" = mode;

    if (mode === "full" && isLlmEnabled()) {
      const enrichment = await enrichAnalysis(analysisCampaign, rulesResult, personasFile);
      if (enrichment) {
        finalResult = mergeAnalysis(rulesResult, enrichment);
        llmUsed = true;
      } else {
        warnings.push("LLM obogatitev ni uspela; prikazane so modelirane ocene.");
        resultMode = "rules_only";
      }
    } else if (mode === "full" && !isLlmEnabled()) {
      warnings.push("LLM ni omogočen; prikazane so le modelirane ocene.");
      resultMode = "rules_only";
    }

    const response: AnalysisResult = {
      ...finalResult,
      meta: {
        mode: resultMode,
        llm_used: llmUsed,
        config_version: finalResult.meta.config_version,
        warnings: [...finalResult.meta.warnings, ...warnings],
      },
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "Pri analizi je prišlo do napake." },
      { status: 500 },
    );
  }
}

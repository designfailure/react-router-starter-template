import { z } from "zod";

const objectiveSchema = z.enum(["awareness", "consideration", "conversion"]);
const channelSchema = z.enum([
  "meta",
  "google",
  "email",
  "display",
  "vet_partnership",
  "organic",
]);
const formatSchema = z.enum(["static", "carousel", "video", "story", "landing_page"]);
const toneSchema = z.enum(["emotional", "rational", "friendly", "authoritative", "urgent"]);
const priceSignalSchema = z.enum(["none", "low", "mid", "premium", "hidden"]);
const languageSchema = z.literal("sl").default("sl");
const landingUrlTypeSchema = z.enum(["quote", "education", "checkout"]);
const pushIntensitySchema = z.enum(["low", "medium", "high"]);
const targetSegmentHintSchema = z.enum(["PA-01", "PA-02", "PA-03", "PA-04", "PA-05", "PA-06"]);

export const CampaignInputSchema = z
  .object({
    campaign_name: z.string().min(1),
    objective: objectiveSchema,
    channel: channelSchema,
    format: formatSchema,
    headline: z.string().min(1),
    primary_text: z.string().min(1),
    cta: z.string().min(1),
    offer: z.string().min(1),
    tone: toneSchema,
    price_signal: priceSignalSchema,
    language: languageSchema,
    trust_signals: z.array(z.string().min(1)).optional(),
    target_segment_hint: targetSegmentHintSchema.optional(),
    visual_description: z.string().min(1).optional(),
    landing_url_type: landingUrlTypeSchema.optional(),
    frequency_cap: pushIntensitySchema.optional(),
    push_intensity: pushIntensitySchema.optional(),
  })
  .strict();

export type CampaignInput = z.infer<typeof CampaignInputSchema>;

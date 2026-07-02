export type CampaignObjective = "awareness" | "consideration" | "conversion";
export type CampaignChannel =
  | "meta"
  | "google"
  | "email"
  | "display"
  | "vet_partnership"
  | "organic";
export type CampaignFormat =
  | "static"
  | "carousel"
  | "video"
  | "story"
  | "landing_page";
export type CampaignTone =
  | "emotional"
  | "rational"
  | "friendly"
  | "authoritative"
  | "urgent";
export type PriceSignal = "none" | "low" | "mid" | "premium" | "hidden";
export type LandingUrlType = "quote" | "education" | "checkout";
export type PushIntensity = "low" | "medium" | "high";
export type TargetSegmentHint = "PA-01" | "PA-02" | "PA-03" | "PA-04" | "PA-05" | "PA-06";
export type CampaignLanguage = "sl";

export interface CampaignInput {
  campaign_name: string;
  objective: CampaignObjective;
  channel: CampaignChannel;
  format: CampaignFormat;
  headline: string;
  primary_text: string;
  cta: string;
  offer: string;
  tone: CampaignTone;
  price_signal: PriceSignal;
  language: CampaignLanguage;
  trust_signals?: string[];
  target_segment_hint?: TargetSegmentHint;
  visual_description?: string;
  landing_url_type?: LandingUrlType;
  frequency_cap?: PushIntensity;
  push_intensity?: PushIntensity;
}

export interface PersonaScoring {
  channel_preferences: Record<CampaignChannel, number>;
  preferred_tones: CampaignTone[];
  push_tolerance: PushIntensity;
  jargon_tolerance: "low" | "medium" | "high";
  goal_keywords: string[];
  motivation_keywords: string[];
  concern_keywords: string[];
  trust_keywords: string[];
}

export interface Persona {
  id: TargetSegmentHint;
  name: string;
  template_column: string;
  age_range: string;
  income_range: string;
  goals: string[];
  motivations: string[];
  concerns: string[];
  channels: CampaignChannel[];
  decision_model: string;
  messaging_hooks: string[];
  barriers: string[];
  funnel_multipliers: {
    landing_engagement: number;
    intent: number;
    completion: number;
  };
  segment_weight: number;
  scoring: PersonaScoring;
}

export interface PersonasFile {
  version: string;
  source: string;
  default_segment_weights: Record<TargetSegmentHint, number>;
  personas: Persona[];
}

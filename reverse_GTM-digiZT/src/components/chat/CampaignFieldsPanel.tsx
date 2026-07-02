"use client";

import { type ChangeEvent } from "react";
import type { CampaignInput } from "@/lib/schemas/campaign";
import { CampaignInputSchema } from "@/lib/schemas/campaign";

type DraftState = {
  campaign_name: string;
  objective: CampaignInput["objective"] | "";
  channel: CampaignInput["channel"] | "";
  format: CampaignInput["format"] | "";
  headline: string;
  primary_text: string;
  cta: string;
  offer: string;
  tone: CampaignInput["tone"] | "";
  price_signal: CampaignInput["price_signal"] | "";
  language: "sl";
  trust_signals: string;
  target_segment_hint: CampaignInput["target_segment_hint"] | "";
  visual_description: string;
  landing_url_type: CampaignInput["landing_url_type"] | "";
  frequency_cap: CampaignInput["frequency_cap"] | "";
  push_intensity: CampaignInput["push_intensity"] | "";
};

interface CampaignFieldsPanelProps {
  draft: DraftState;
  onChange: (next: DraftState) => void;
  onAnalyze: () => void;
  disabled?: boolean;
}

const selectClass =
  "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

function setField<K extends keyof DraftState>(draft: DraftState, key: K, value: DraftState[K]): DraftState {
  return { ...draft, [key]: value };
}

export function CampaignFieldsPanel({ draft, onChange, onAnalyze, disabled }: CampaignFieldsPanelProps) {
  const handleText = (key: keyof DraftState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    onChange(setField(draft, key, event.target.value as DraftState[typeof key]));
  };

  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" open>
      <summary className="cursor-pointer list-none text-lg font-semibold text-slate-900">
        Strukturni obrazec kampanje
      </summary>
      <p className="mt-2 text-sm text-slate-600">
        To je zanesljiva pot za analizo. Vsa zahtevana polja so v slovenščini ali angleških oznakah, kjer je to določeno.
      </p>
      <div className="mt-4 grid gap-4">
        <label className="block text-sm font-medium text-slate-700">
          Ime kampanje
          <input className={selectClass} value={draft.campaign_name} onChange={handleText("campaign_name")} />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Objektiv
            <select className={selectClass} value={draft.objective} onChange={handleText("objective")}>
              <option value="">Izberi ...</option>
              <option value="awareness">awareness</option>
              <option value="consideration">consideration</option>
              <option value="conversion">conversion</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Kanal
            <select className={selectClass} value={draft.channel} onChange={handleText("channel")}>
              <option value="">Izberi ...</option>
              <option value="meta">meta</option>
              <option value="google">google</option>
              <option value="email">email</option>
              <option value="display">display</option>
              <option value="vet_partnership">vet_partnership</option>
              <option value="organic">organic</option>
            </select>
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Format
            <select className={selectClass} value={draft.format} onChange={handleText("format")}>
              <option value="">Izberi ...</option>
              <option value="static">static</option>
              <option value="carousel">carousel</option>
              <option value="video">video</option>
              <option value="story">story</option>
              <option value="landing_page">landing_page</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Ton
            <select className={selectClass} value={draft.tone} onChange={handleText("tone")}>
              <option value="">Izberi ...</option>
              <option value="emotional">emotional</option>
              <option value="rational">rational</option>
              <option value="friendly">friendly</option>
              <option value="authoritative">authoritative</option>
              <option value="urgent">urgent</option>
            </select>
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Cenovni signal
            <select className={selectClass} value={draft.price_signal} onChange={handleText("price_signal")}>
              <option value="">Izberi ...</option>
              <option value="none">none</option>
              <option value="low">low</option>
              <option value="mid">mid</option>
              <option value="premium">premium</option>
              <option value="hidden">hidden</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Ciljni segment
            <select className={selectClass} value={draft.target_segment_hint} onChange={handleText("target_segment_hint")}>
              <option value="">Ni nastavljen</option>
              <option value="PA-01">PA-01</option>
              <option value="PA-02">PA-02</option>
              <option value="PA-03">PA-03</option>
              <option value="PA-04">PA-04</option>
              <option value="PA-05">PA-05</option>
              <option value="PA-06">PA-06</option>
            </select>
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Naslov
          <input className={selectClass} value={draft.headline} onChange={handleText("headline")} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Glavno besedilo
          <textarea className={selectClass} value={draft.primary_text} onChange={handleText("primary_text")} />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            CTA
            <input className={selectClass} value={draft.cta} onChange={handleText("cta")} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Ponudba
            <input className={selectClass} value={draft.offer} onChange={handleText("offer")} />
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Trust signali
          <input className={selectClass} value={draft.trust_signals} onChange={handleText("trust_signals")} placeholder="veterinar, certifikat, mnenja" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Opis vizuala
          <textarea className={selectClass} value={draft.visual_description} onChange={handleText("visual_description")} />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Landing URL tip
            <select className={selectClass} value={draft.landing_url_type} onChange={handleText("landing_url_type")}>
              <option value="">Ni nastavljen</option>
              <option value="quote">quote</option>
              <option value="education">education</option>
              <option value="checkout">checkout</option>
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Push intenzivnost
            <select className={selectClass} value={draft.push_intensity} onChange={handleText("push_intensity")}>
              <option value="">Ni nastavljen</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </label>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">Shranjeno kot osnutek, nato se pošlje v analizo prek API-ja.</p>
          <button
            type="button"
            onClick={onAnalyze}
            disabled={disabled}
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Analiziraj
          </button>
        </div>
      </div>
    </details>
  );
}

export function buildCampaignInputFromDraft(draft: DraftState): CampaignInput | null {
  const trustSignals = draft.trust_signals
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const parsed = CampaignInputSchema.safeParse({
    campaign_name: draft.campaign_name,
    objective: draft.objective,
    channel: draft.channel,
    format: draft.format,
    headline: draft.headline,
    primary_text: draft.primary_text,
    cta: draft.cta,
    offer: draft.offer,
    tone: draft.tone,
    price_signal: draft.price_signal,
    language: draft.language,
    trust_signals: trustSignals.length > 0 ? trustSignals : undefined,
    target_segment_hint: draft.target_segment_hint || undefined,
    visual_description: draft.visual_description || undefined,
    landing_url_type: draft.landing_url_type || undefined,
    frequency_cap: draft.frequency_cap || undefined,
    push_intensity: draft.push_intensity || undefined,
  });

  return parsed.success ? parsed.data : null;
}

export type { DraftState as CampaignDraftState };

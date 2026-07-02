"use client";

import { useMemo, useState } from "react";
import type { CampaignInput } from "@/lib/schemas/campaign";
import type { AnalysisResult } from "@/lib/schemas/analysis-result";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ImageDropzone } from "@/components/chat/ImageDropzone";
import {
  CampaignFieldsPanel,
  buildCampaignInputFromDraft,
  type CampaignDraftState,
} from "@/components/chat/CampaignFieldsPanel";
import { ScoreCards } from "@/components/results/ScoreCards";
import { PersonaTable } from "@/components/results/PersonaTable";
import { FunnelChart } from "@/components/results/FunnelChart";
import { MessageDecomposition } from "@/components/results/MessageDecomposition";
import { OptimizationPlaybook } from "@/components/results/OptimizationPlaybook";

type ChatMessage = { role: "user" | "assistant"; content: string };

function createInitialDraft(): CampaignDraftState {
  return {
    campaign_name: "",
    objective: "",
    channel: "",
    format: "",
    headline: "",
    primary_text: "",
    cta: "",
    offer: "",
    tone: "",
    price_signal: "",
    language: "sl",
    trust_signals: "",
    target_segment_hint: "",
    visual_description: "",
    landing_url_type: "",
    frequency_cap: "",
    push_intensity: "",
  };
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const index = trimmed.search(/[.!?]/);
  return index >= 0 ? trimmed.slice(0, index + 1) : trimmed;
}

function buildDraftFromBrief(brief: string, current: CampaignDraftState): CampaignDraftState {
  const headline = firstSentence(brief).slice(0, 120);
  const offerMatch = brief.match(/(brezpla[^\s,.!?]*(?:\s+[^\s,.!?]+){0,3}|popust[^\s,.!?]*(?:\s+[^\s,.!?]+){0,3}|cena[^\s,.!?]*(?:\s+[^\s,.!?]+){0,3})/i);
  const offer = offerMatch?.[0] ?? current.offer ?? "zavarovanje ljubljenčka";
  return {
    ...current,
    campaign_name: current.campaign_name || `Brief ${headline.slice(0, 24)}`,
    objective: current.objective || "consideration",
    channel: current.channel || "meta",
    format: current.format || "static",
    headline: current.headline || headline,
    primary_text: current.primary_text || brief,
    cta: current.cta || "Preveri zdaj",
    offer: current.offer || offer,
    tone: current.tone || "friendly",
    price_signal: current.price_signal || "none",
    language: "sl",
  };
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Pozdravljeni. Vnesite kampanjo v pogovor ali odprite stranski obrazec za natančno analizo.",
    },
  ]);
  const [brief, setBrief] = useState("");
  const [draft, setDraft] = useState<CampaignDraftState>(createInitialDraft());
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  const targetSegmentHint = draft.target_segment_hint || undefined;
  const canAnalyze = useMemo(
    () =>
      Boolean(
        draft.headline &&
          draft.primary_text &&
          draft.cta &&
          draft.offer &&
          draft.objective &&
          draft.channel &&
          draft.format &&
          draft.tone &&
          draft.price_signal,
      ),
    [draft],
  );

  const postAnalyze = async (campaign: CampaignInput) => {
    setLoading(true);
    setError(null);
    setStatus("Analiza poteka ...");
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaign,
          image_base64: imageBase64 ?? undefined,
          image_mime: imageMime ?? undefined,
          mode: "full",
        }),
      });
      const data = (await response.json()) as unknown;
      if (!response.ok) {
        const message =
          data && typeof data === "object" && "error" in data
            ? String((data as { error: string }).error)
            : "Analiza ni uspela.";
        throw new Error(message);
      }
      setAnalysis(data as AnalysisResult);
      setStatus("Analiza je pripravljena.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pri analizi je prišlo do napake.");
      setStatus("");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    const campaign = buildCampaignInputFromDraft(draft);
    if (!campaign) {
      setError("Prosimo izpolnite zahtevana polja v stranskem obrazcu.");
      return;
    }
    await postAnalyze(campaign);
  };

  const handleSendBrief = () => {
    const text = brief.trim();
    if (!text) {
      return;
    }
    setMessages((current) => [...current, { role: "user", content: text }]);
    setDraft((current) => buildDraftFromBrief(text, current));
    setMessages((current) => [
      ...current,
      { role: "assistant", content: "Brief je dodan. Preverite in po potrebi dopolnite obrazec na desni strani." },
    ]);
    setBrief("");
  };

  const handleCopySummary = async () => {
    if (!analysis) {
      return;
    }
    await navigator.clipboard.writeText(analysis.executive_summary_sl.join("\n"));
    setStatus("Povzetek je kopiran v odložišče.");
  };

  const handleDownloadJson = () => {
    if (!analysis) {
      return;
    }
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${analysis.campaign_summary.name || "analysis"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 lg:px-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">digiZT GTM Resonance & Response Analytics Engine</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Orodje za modelirano ocenjevanje resonančnosti sporočila, persona fit-a in funnel potenciala za kampanje v
          slovenščini.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
        <div className="space-y-4">
          <ChatPanel messages={messages} value={brief} onChange={setBrief} onSend={handleSendBrief} disabled={loading} />
          <ImageDropzone
            imagePreviewUrl={imagePreviewUrl}
            fileName={imageFileName}
            onChange={(payload) => {
              if (!payload) {
                setImageBase64(null);
                setImageMime(null);
                setImagePreviewUrl(null);
                setImageFileName(null);
                return;
              }
              setImageBase64(payload.base64);
              setImageMime(payload.mime);
              setImagePreviewUrl(payload.previewUrl);
              setImageFileName(payload.fileName);
            }}
          />
          <CampaignFieldsPanel draft={draft} onChange={setDraft} onAnalyze={handleAnalyze} disabled={loading || !canAnalyze} />
        </div>

        <div className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
              {error}
            </div>
          ) : null}
          <div aria-live="polite" className="text-sm text-slate-600">
            {loading ? "Analiza poteka ..." : status}
          </div>

          {analysis ? (
            <div className="space-y-4">
              <ScoreCards result={analysis} onCopySummary={handleCopySummary} onDownloadJson={handleDownloadJson} />
              <PersonaTable result={analysis} targetSegmentHint={targetSegmentHint} />
              <FunnelChart result={analysis} />
              <MessageDecomposition result={analysis} />
              <OptimizationPlaybook result={analysis} />
            </div>
          ) : (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Rezultati se bodo prikazali tukaj</h2>
              <p className="mt-2 text-sm text-slate-600">
                Izpolnite obrazec in kliknite <span className="font-medium">Analiziraj</span>, da dobite persona
                ocene, funnel in priporočila.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

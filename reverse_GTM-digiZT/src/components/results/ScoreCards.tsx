"use client";

import type { AnalysisResult } from "@/lib/schemas/analysis-result";

interface ScoreCardsProps {
  result: AnalysisResult;
  onCopySummary: () => void;
  onDownloadJson: () => void;
}

function verdictLabel(verdict: AnalysisResult["campaign_summary"]["overall_verdict"]): string {
  switch (verdict) {
    case "strong":
      return "Močan";
    case "moderate":
      return "Srednji";
    case "weak":
      return "Šibek";
  }
}

export function ScoreCards({ result, onCopySummary, onDownloadJson }: ScoreCardsProps) {
  const rulesOnly = result.meta.mode === "rules_only";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Rezultati analize</h2>
            <p className="text-sm text-slate-600">Vse metrike so napovedane / modelirane.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCopySummary}
              className="rounded-full border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Kopiraj povzetek
            </button>
            <button
              type="button"
              onClick={onDownloadJson}
              className="rounded-full bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Prenesi JSON
            </button>
          </div>
        </div>

        {rulesOnly ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Prikazane so le modelirane ocene; omogočite LLM za analizo slike in vpogled v besedilo.
          </div>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Verdikt</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{verdictLabel(result.campaign_summary.overall_verdict)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Utežena privlačnost</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{result.aggregate.weighted_appeal.toFixed(2)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Utežen CTR / CVR</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {result.aggregate.weighted_ctr_pct.toFixed(2)}% / {result.aggregate.weighted_cvr_pct.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Izvršni povzetek</h3>
          <ul className="mt-2 space-y-2 text-sm text-slate-700">
            {result.executive_summary_sl.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

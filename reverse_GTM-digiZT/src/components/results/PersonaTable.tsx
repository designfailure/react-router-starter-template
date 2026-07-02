"use client";

import type { AnalysisResult } from "@/lib/schemas/analysis-result";

interface PersonaTableProps {
  result: AnalysisResult;
  targetSegmentHint?: AnalysisResult["persona_scores"][number]["persona_id"];
}

export function PersonaTable({ result, targetSegmentHint }: PersonaTableProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Persona pregled</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-2 text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2">Persona</th>
              <th className="px-3 py-2">CAS</th>
              <th className="px-3 py-2">Appeal</th>
              <th className="px-3 py-2">pCTR</th>
              <th className="px-3 py-2">pCVR</th>
            </tr>
          </thead>
          <tbody>
            {result.persona_scores.map((score) => {
              const isTarget = targetSegmentHint === score.persona_id;
              const isBest = score.persona_id === result.aggregate.best_persona;
              const isWorst = score.persona_id === result.aggregate.worst_persona;
              return (
                <tr
                  key={score.persona_id}
                  className={`rounded-xl ${
                    isTarget ? "bg-indigo-50" : isBest ? "bg-emerald-50" : isWorst ? "bg-rose-50" : "bg-slate-50"
                  }`}
                >
                  <td className="rounded-l-xl px-3 py-3 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{score.persona_id}</span>
                      <span className="text-slate-500">{score.persona_name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">{score.content_acceptance}</td>
                  <td className="px-3 py-3">{score.appeal_index}</td>
                  <td className="px-3 py-3">{score.predicted_ctr_pct.toFixed(2)}%</td>
                  <td className="rounded-r-xl px-3 py-3">{score.predicted_cvr_pct.toFixed(2)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

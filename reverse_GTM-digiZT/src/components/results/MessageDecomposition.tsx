"use client";

import type { AnalysisResult } from "@/lib/schemas/analysis-result";

interface MessageDecompositionProps {
  result: AnalysisResult;
}

function renderList(items: string[]) {
  return (
    <ul className="mt-2 space-y-1 text-sm text-slate-700">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden>•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function MessageDecomposition({ result }: MessageDecompositionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Razčlenitev sporočila</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Hooki</h3>
          {renderList(result.message_decomposition.detected_hooks)}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Ovire</h3>
          {renderList(result.message_decomposition.detected_barriers)}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Zaupanja vredni signali</h3>
          {renderList(result.message_decomposition.trust_signals_found)}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Manjkajoči elementi</h3>
          {renderList(result.message_decomposition.missing_elements)}
        </div>
      </div>
    </section>
  );
}

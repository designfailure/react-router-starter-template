"use client";

import type { AnalysisResult } from "@/lib/schemas/analysis-result";

interface OptimizationPlaybookProps {
  result: AnalysisResult;
}

export function OptimizationPlaybook({ result }: OptimizationPlaybookProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Optimizacijski playbook</h2>
      <ol className="mt-4 space-y-3">
        {result.optimization_playbook
          .slice()
          .sort((a, b) => a.priority - b.priority)
          .map((item) => (
            <li key={`${item.priority}-${item.change}`} className="rounded-xl bg-slate-50 p-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {item.priority}
                </span>
                <p className="font-medium text-slate-900">{item.change}</p>
              </div>
              <p className="mt-2 text-sm text-slate-600">{item.expected_impact}</p>
            </li>
          ))}
      </ol>
    </section>
  );
}

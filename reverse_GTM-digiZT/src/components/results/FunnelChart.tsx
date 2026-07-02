"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  FunnelChart as RechartsFunnelChart,
  Funnel,
  LabelList,
  Tooltip,
} from "recharts";
import type { AnalysisResult } from "@/lib/schemas/analysis-result";

interface FunnelChartProps {
  result: AnalysisResult;
}

export function FunnelChart({ result }: FunnelChartProps) {
  const [personaId, setPersonaId] = useState<AnalysisResult["persona_scores"][number]["persona_id"]>(
    result.aggregate.best_persona,
  );
  const selected = result.persona_scores.find((item) => item.persona_id === personaId) ?? result.persona_scores[0];

  useEffect(() => {
    setPersonaId(result.aggregate.best_persona);
  }, [result]);

  const data = useMemo(
    () => [
      { name: "Impression → klik", value: selected.funnel.impression_to_click * 100 },
      { name: "Klik → angažma", value: selected.funnel.click_to_engagement * 100 },
      { name: "Angažma → namen", value: selected.funnel.engagement_to_intent * 100 },
      { name: "Namen → konverzija", value: selected.funnel.intent_to_conversion * 100 },
    ],
    [selected],
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Funnel za izbrano persono</h2>
        <label className="text-sm text-slate-600">
          Persona{" "}
          <select
            className="ml-2 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
            value={personaId}
            onChange={(event) => setPersonaId(event.target.value as typeof personaId)}
          >
            {result.persona_scores.map((persona) => (
              <option key={persona.persona_id} value={persona.persona_id}>
                {persona.persona_id}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsFunnelChart>
            <Tooltip />
            <Funnel dataKey="value" data={data} isAnimationActive={false}>
              <LabelList position="right" fill="#0f172a" dataKey="name" />
            </Funnel>
          </RechartsFunnelChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

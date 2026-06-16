import { useMemo, lazy, Suspense } from "react"
import type { EnergyData } from "../hooks/useEnergySocket"

const PlotlyChart = lazy(() => import("@/components/PlotlyChart"))

interface PhaseImbalanceProps {
  data: EnergyData
  mode?: "current" | "voltage"
}

const PLOTLY_LAYOUT: Record<string, unknown> = {
  margin: { l: 48, r: 48, t: 8, b: 48 },
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  polar: {
    radialaxis: {
      visible: true,
      tickfont: { size: 9, color: "#64748b" },
      gridcolor: "#f1f5f9",
      linecolor: "#e2e8f0",
    },
  },
  legend: { orientation: "h", y: 1.08, font: { size: 10 } },
}

const PLOTLY_CONFIG = { displayModeBar: false, responsive: true }

export const PhaseImbalance = ({ data, mode = "current" }: PhaseImbalanceProps) => {
  const trace = useMemo(() => {
    const isCurrent = mode === "current"
    const values = isCurrent
      ? [data.ia, data.ib, data.ic]
      : [data.va, data.vb, data.vc]
    const labels = isCurrent ? ["IA", "IB", "IC"] : ["VA", "VB", "VC"]
    const unit = isCurrent ? "A" : "V"

    return {
      type: "scatterpolar" as const,
      mode: "lines+markers" as const,
      name: `${mode === "current" ? "Corrientes" : "Voltajes"}`,
      fill: "toself" as const,
      fillcolor: "rgba(0, 85, 79, 0.15)",
      line: { color: "#00554f", width: 2 },
      marker: { color: "#00554f", size: 6 },
      theta: labels,
      r: values,
      hovertemplate: `%{theta}: %{r} ${unit}<extra></extra>`,
    }
  }, [data, mode])

  return (
    <div className="rounded-[12px] border border-black/10 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-[#64748b] mb-3">
        Radar de {mode === "current" ? "Corrientes" : "Voltajes"} — Desbalance de Fases
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-[300px]">
          <Suspense fallback={<div className="w-full h-full bg-[#f1f5f9] rounded-lg animate-pulse" />}>
            <PlotlyChart data={[trace]} layout={PLOTLY_LAYOUT} config={PLOTLY_CONFIG} style={{ width: "100%", height: "100%" }} />
          </Suspense>
        </div>
        <div className="flex flex-col justify-center gap-3">
          <PhaseDetail label="Fase A - Corriente" value={data.ia} unit="A" max={Math.max(data.ia, data.ib, data.ic)} />
          <PhaseDetail label="Fase B - Corriente" value={data.ib} unit="A" max={Math.max(data.ia, data.ib, data.ic)} />
          <PhaseDetail label="Fase C - Corriente" value={data.ic} unit="A" max={Math.max(data.ia, data.ib, data.ic)} />
        </div>
      </div>
    </div>
  )
}

const PhaseDetail = ({ label, value, unit, max }: { label: string; value: number; unit: string; max: number }) => {
  const pct = max > 0 ? (value / max) * 100 : 0
  const barColor = pct > 95 ? "bg-red-500" : pct > 85 ? "bg-amber-500" : "bg-emerald-500"

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-[#64748b]">{label}</span>
        <span className="font-semibold text-[#1e293b]">{value.toFixed(1)} {unit}</span>
      </div>
      <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

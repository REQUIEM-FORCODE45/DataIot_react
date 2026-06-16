import { useMemo, lazy, Suspense } from "react"
import type { EnergyData } from "../hooks/useEnergySocket"

const PlotlyChart = lazy(() => import("@/components/PlotlyChart"))

interface PowerSummaryProps {
  data: EnergyData
}

const PLOTLY_LAYOUT: Record<string, unknown> = {
  margin: { l: 48, r: 12, t: 8, b: 36 },
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  xaxis: {
    showgrid: false,
    tickfont: { size: 9, color: "#64748b" },
    linecolor: "#e2e8f0",
  },
  yaxis: {
    showgrid: true,
    gridcolor: "#f1f5f9",
    tickfont: { size: 9, color: "#64748b" },
    linecolor: "#e2e8f0",
    title: { text: "kVA / kW / kVAR", font: { size: 10, color: "#64748b" } },
  },
  barmode: "group" as const,
  legend: { orientation: "h", y: 1.08, font: { size: 10 } },
}

const PLOTLY_CONFIG = { displayModeBar: false, responsive: true }

export const PowerSummary = ({ data }: PowerSummaryProps) => {
  const trace = useMemo(() => [
    {
      type: "bar" as const,
      name: "Aparente (ST)",
      x: ["Potencia"],
      y: [data.st],
      marker: { color: "#00554f" },
    },
    {
      type: "bar" as const,
      name: "Activa (PT)",
      x: ["Potencia"],
      y: [data.pt],
      marker: { color: "#22c55e" },
    },
    {
      type: "bar" as const,
      name: "Reactiva (QT)",
      x: ["Potencia"],
      y: [data.qt],
      marker: { color: "#eab308" },
    },
  ], [data])

  return (
    <div className="rounded-[12px] border border-black/10 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-[#64748b] mb-3">Triángulo de Potencias</p>
      <div className="h-[220px]">
        <Suspense fallback={<div className="w-full h-full bg-[#f1f5f9] rounded-lg animate-pulse" />}>
          <PlotlyChart data={trace} layout={PLOTLY_LAYOUT} config={PLOTLY_CONFIG} style={{ width: "100%", height: "100%" }} />
        </Suspense>
      </div>
    </div>
  )
}

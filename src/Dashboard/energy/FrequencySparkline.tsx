import { useMemo, lazy, Suspense } from "react"
import type { EnergyPoint } from "../hooks/useEnergySocket"

const PlotlyChart = lazy(() => import("@/components/PlotlyChart"))

interface FrequencySparklineProps {
  history: EnergyPoint[]
  currentFrequency: number
}

const PLOTLY_LAYOUT: Record<string, unknown> = {
  margin: { l: 8, r: 8, t: 4, b: 8 },
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  xaxis: {
    showgrid: false,
    showticklabels: false,
    zeroline: false,
    linecolor: "transparent",
  },
  yaxis: {
    showgrid: false,
    showticklabels: false,
    zeroline: false,
    range: [59.8, 60.2],
    linecolor: "transparent",
  },
  font: { color: "#64748b" },
}

const PLOTLY_CONFIG = { displayModeBar: false, responsive: true }

export const FrequencySparkline = ({ history, currentFrequency }: FrequencySparklineProps) => {
  const trace = useMemo(() => {
    if (history.length < 2) return null
    return {
      type: "scatter" as const,
      mode: "lines" as const,
      line: { color: "#00554f", width: 2, shape: "spline" as const },
      x: history.map((p) => p.time),
      y: history.map((p) => p.frequency),
      fill: "tozeroy" as const,
      fillcolor: "rgba(0, 85, 79, 0.06)",
    }
  }, [history])

  const statusColor = currentFrequency >= 59.9 && currentFrequency <= 60.1 ? "text-emerald-600" : "text-amber-600"

  return (
    <div className="rounded-[12px] border border-black/10 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Frecuencia de Red</p>
          <p className={`text-2xl font-bold ${statusColor}`}>{currentFrequency.toFixed(2)} <span className="text-sm font-normal text-[#64748b]">Hz</span></p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${currentFrequency >= 59.9 && currentFrequency <= 60.1 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
          {currentFrequency >= 59.9 && currentFrequency <= 60.1 ? "Estable" : "Fuera de rango"}
        </span>
      </div>
      <div className="h-[80px]">
        {trace ? (
          <Suspense fallback={<div className="w-full h-full bg-[#f1f5f9] rounded-lg animate-pulse" />}>
            <PlotlyChart data={[trace]} layout={PLOTLY_LAYOUT} config={PLOTLY_CONFIG} style={{ width: "100%", height: "100%" }} />
          </Suspense>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-[#64748b]">Esperando datos...</div>
        )}
      </div>
    </div>
  )
}

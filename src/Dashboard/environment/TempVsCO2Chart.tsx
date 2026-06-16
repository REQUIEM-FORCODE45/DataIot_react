import { useMemo, lazy, Suspense } from "react"
import type { EnvPoint } from "../hooks/useEnvironmentSocket"

const PlotlyChart = lazy(() => import("@/components/PlotlyChart"))

interface TempVsCO2ChartProps {
  history: EnvPoint[]
}

const PLOTLY_LAYOUT: Record<string, unknown> = {
  margin: { l: 48, r: 48, t: 8, b: 36 },
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
    title: { text: "°C", font: { size: 10, color: "#00554f" } },
  },
  yaxis2: {
    overlaying: "y",
    side: "right",
    showgrid: false,
    tickfont: { size: 9, color: "#64748b" },
    title: { text: "CO₂ ppm", font: { size: 10, color: "#eab308" } },
  },
  legend: { orientation: "h", y: 1.08, font: { size: 10 } },
}

const PLOTLY_CONFIG = { displayModeBar: false, responsive: true }

export const TempVsCO2Chart = ({ history }: TempVsCO2ChartProps) => {
  const traces = useMemo(() => {
    if (history.length < 2) return null
    const validPoints = history.filter((p) => p.temp > 0 && p.co2 > 0)
    if (validPoints.length < 2) return null
    return [
      {
        type: "scatter" as const,
        mode: "lines" as const,
        name: "Temperatura",
        line: { color: "#00554f", width: 2 },
        x: validPoints.map((p) => p.time),
        y: validPoints.map((p) => p.temp),
        yaxis: "y" as const,
      },
      {
        type: "scatter" as const,
        mode: "lines" as const,
        name: "CO₂",
        line: { color: "#eab308", width: 2 },
        x: validPoints.map((p) => p.time),
        y: validPoints.map((p) => p.co2),
        yaxis: "y2" as const,
      },
    ]
  }, [history])

  return (
    <div className="rounded-[12px] border border-black/10 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-[#64748b] mb-3">Correlación Temperatura vs CO₂</p>
      <div className="h-[260px]">
        {traces ? (
          <Suspense fallback={<div className="w-full h-full bg-[#f1f5f9] rounded-lg animate-pulse" />}>
            <PlotlyChart data={traces} layout={PLOTLY_LAYOUT} config={PLOTLY_CONFIG} style={{ width: "100%", height: "100%" }} />
          </Suspense>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-[#64748b]">
            {history.length === 0 ? "Sin datos históricos" : "Datos insuficientes para graficar"}
          </div>
        )}
      </div>
    </div>
  )
}

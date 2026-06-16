import { useMemo, lazy, Suspense } from "react"
import type { TempPoint } from "../hooks/useTemperatureSocket"

const PlotlyChart = lazy(() => import("@/components/PlotlyChart"))

interface TempHistoryChartProps {
  history: TempPoint[]
}

const BASE_LAYOUT: Record<string, unknown> = {
  margin: { l: 48, r: 12, t: 8, b: 36 },
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  xaxis: {
    showgrid: false,
    tickfont: { size: 9, color: "#64748b" },
    linecolor: "#e2e8f0",
    title: { text: "", font: { size: 10 } },
  },
  yaxis: {
    showgrid: true,
    gridcolor: "#f1f5f9",
    tickfont: { size: 9, color: "#64748b" },
    linecolor: "#e2e8f0",
    title: { text: "°C", font: { size: 10, color: "#64748b" } },
  },
  shapes: [
    { type: "rect", xref: "paper", yref: "y", x0: 0, x1: 1, y0: 2, y1: 4, fillcolor: "rgba(34, 197, 94, 0.08)", line: { width: 0 }, layer: "below" },
    { type: "rect", xref: "paper", yref: "y", x0: 0, x1: 1, y0: 4, y1: 6, fillcolor: "rgba(234, 179, 8, 0.08)", line: { width: 0 }, layer: "below" },
    { type: "line", xref: "paper", x0: 0, x1: 1, y0: 2, y1: 2, line: { color: "#22c55e", width: 1, dash: "dash" } },
    { type: "line", xref: "paper", x0: 0, x1: 1, y0: 6, y1: 6, line: { color: "#ef4444", width: 1, dash: "dash" } },
  ],
}

const PLOTLY_CONFIG = { displayModeBar: false, responsive: true }

const PAD = 0.15

export const TempHistoryChart = ({ history }: TempHistoryChartProps) => {
  const layout = useMemo(() => {
    const temps = history.map((p) => p.temp)
    const dataMin = temps.length ? Math.min(...temps) : 0
    const dataMax = temps.length ? Math.max(...temps) : 10
    const range = dataMax - dataMin || 1
    const yMin = Math.max(0, dataMin - range * PAD)
    const yMax = dataMax + range * PAD
    return { ...BASE_LAYOUT, yaxis: { ...(BASE_LAYOUT.yaxis as Record<string, unknown>), range: [yMin, yMax] } }
  }, [history])

  const trace = useMemo(() => {
    if (history.length < 2) return null
    return {
      type: "scatter" as const,
      mode: "lines" as const,
      line: { color: "#00554f", width: 2 },
      fill: "tozeroy" as const,
      fillcolor: "rgba(0, 85, 79, 0.08)",
      x: history.map((p) => p.time),
      y: history.map((p) => p.temp),
    }
  }, [history])

  return (
    <div className="rounded-[12px] border border-black/10 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-[#64748b] mb-3">Histórico Temperatura — Últimas 12h</p>
      <div className="h-[220px]">
        {trace ? (
          <Suspense fallback={<div className="w-full h-full bg-[#f1f5f9] rounded-lg animate-pulse" />}>
            <PlotlyChart data={[trace]} layout={layout} config={PLOTLY_CONFIG} style={{ width: "100%", height: "100%" }} />
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

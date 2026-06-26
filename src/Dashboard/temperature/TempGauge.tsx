import { useMemo } from "react"
import { GaugeMeter } from "../components/GaugeMeter"

interface TempGaugeProps {
  value: number
  min?: number
  max?: number
}

const getThresholds = (max: number) => [
  { min: 0, max: +(max * 0.2).toFixed(1), color: "#3b82f6" },
  { min: +(max * 0.2).toFixed(1), max: +(max * 0.4).toFixed(1), color: "#22c55e" },
  { min: +(max * 0.4).toFixed(1), max: +(max * 0.6).toFixed(1), color: "#eab308" },
  { min: +(max * 0.6).toFixed(1), max: max, color: "#ef4444" },
]

export const TempGauge = ({ value, min = 0, max = 100 }: TempGaugeProps) => {
  const thresholds = useMemo(() => getThresholds(max), [max])
  return (
    <div className="rounded-[12px] border border-black/10 bg-white p-4 flex items-center justify-center">
      <GaugeMeter
        value={value}
        min={min}
        max={max}
        thresholds={thresholds}
        label="Temperatura Tanque"
        unit="°C"
        size={200}
      />
    </div>
  )
}

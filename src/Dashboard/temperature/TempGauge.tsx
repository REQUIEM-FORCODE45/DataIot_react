import { GaugeMeter } from "../components/GaugeMeter"

interface TempGaugeProps {
  value: number
}

const THRESHOLDS = [
  { min: 0, max: 2, color: "#3b82f6" },
  { min: 2, max: 4, color: "#22c55e" },
  { min: 4, max: 6, color: "#eab308" },
  { min: 6, max: 10, color: "#ef4444" },
]

export const TempGauge = ({ value }: TempGaugeProps) => {
  return (
    <div className="rounded-[12px] border border-black/10 bg-white p-4 flex items-center justify-center">
      <GaugeMeter
        value={value}
        min={0}
        max={10}
        thresholds={THRESHOLDS}
        label="Temperatura Tanque"
        unit="°C"
        size={200}
      />
    </div>
  )
}

import { GaugeMeter } from "../components/GaugeMeter"
import type { EnergyData } from "../hooks/useEnergySocket"

interface EfficiencyGaugeProps {
  data: EnergyData
}

const FP_THRESHOLDS = [
  { min: 0, max: 0.85, color: "#ef4444" },
  { min: 0.85, max: 0.92, color: "#eab308" },
  { min: 0.92, max: 1, color: "#22c55e" },
]

const MiniFPCard = ({ label, value }: { label: string; value: number }) => {
  const color = value >= 0.92 ? "text-emerald-600" : value >= 0.85 ? "text-amber-600" : "text-red-600"
  return (
    <div className="rounded-lg border border-black/10 bg-[#f8fafc] px-3 py-2 text-center">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#64748b]">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value.toFixed(2)}</p>
    </div>
  )
}

export const EfficiencyGauge = ({ data }: EfficiencyGaugeProps) => {
  return (
    <div className="rounded-[12px] border border-black/10 bg-white p-4 flex flex-col items-center gap-4">
      <p className="text-xs uppercase tracking-[0.3em] text-[#64748b] self-start">Factor de Potencia Total</p>

      <GaugeMeter
        value={data.fpt}
        min={0.5}
        max={1}
        thresholds={FP_THRESHOLDS}
        unit="FPT"
        size={160}
      />

      <div className="grid grid-cols-3 gap-2 w-full">
        <MiniFPCard label="Fase A" value={data.fpa} />
        <MiniFPCard label="Fase B" value={data.fpb} />
        <MiniFPCard label="Fase C" value={data.fpc} />
      </div>
    </div>
  )
}

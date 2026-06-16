import { Wind } from "lucide-react"

interface CO2IndicatorProps {
  co2: number
}

const getLevel = (co2: number) => {
  if (co2 < 800) return { label: "Excelente", color: "text-emerald-600", bg: "bg-emerald-100", border: "border-emerald-300", accent: "#22c55e" }
  if (co2 < 1000) return { label: "Moderado", color: "text-amber-600", bg: "bg-amber-100", border: "border-amber-300", accent: "#eab308" }
  return { label: "Requiere ventilación", color: "text-red-600", bg: "bg-red-100", border: "border-red-300", accent: "#ef4444" }
}

export const CO2Indicator = ({ co2 }: CO2IndicatorProps) => {
  const level = getLevel(co2)

  return (
    <div className={`rounded-[12px] border ${level.border} ${level.bg} p-4 flex flex-col gap-2`} style={{ borderTopColor: level.accent, borderTopWidth: 2 }}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">CO₂</p>
        <Wind size={18} className="text-[#64748b]" />
      </div>
      <p className="text-3xl font-bold text-[#1e293b]">{co2} <span className="text-sm font-normal text-[#64748b]">ppm</span></p>
      <span className={`inline-flex self-start rounded-full px-2 py-0.5 text-[11px] font-semibold ${level.color} ${level.bg}`}>
        {level.label}
      </span>
    </div>
  )
}

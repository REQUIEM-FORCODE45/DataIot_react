import { TrendingDown, TrendingUp, Minus } from "lucide-react"

interface CoolingRateProps {
  rate: number
  status: "stable" | "cooling" | "heating"
}

export const CoolingRate = ({ rate, status }: CoolingRateProps) => {
  const isCooling = status === "cooling"
  const isHeating = status === "heating"
  const color = isCooling ? "text-emerald-600" : isHeating ? "text-red-600" : "text-[#64748b]"

  const Icon = isCooling ? TrendingDown : isHeating ? TrendingUp : Minus

  return (
    <div className="rounded-[12px] border border-black/10 bg-white p-4 flex flex-col gap-2">
      <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Tasa de Enfriamiento</p>
      <div className="flex items-center gap-3">
        <Icon className={color} size={28} strokeWidth={2.5} />
        <div>
          <p className={`text-2xl font-bold ${color}`}>
            {rate > 0 ? "+" : ""}{Number.isFinite(rate) ? rate : 0} °C/h
          </p>
          <p className="text-[11px] text-[#64748b]">
            {isCooling ? "Enfriando correctamente" : isHeating ? "Calentando" : "Estable"}
          </p>
        </div>
      </div>
    </div>
  )
}

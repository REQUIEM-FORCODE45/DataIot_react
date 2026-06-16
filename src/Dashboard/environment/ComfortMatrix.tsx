import { Thermometer, Droplets } from "lucide-react"
import type { EnvironmentData } from "../hooks/useEnvironmentSocket"

interface ComfortMatrixProps {
  temperature: number
  humidity: number
  comfortLevel: EnvironmentData["comfortLevel"]
}

const COMFORT_LABELS: Record<string, { label: string; color: string; bg: string; description: string }> = {
  ideal: { label: "Confort Ideal", color: "text-emerald-700", bg: "bg-emerald-100", description: "Temperatura y humedad en rango óptimo" },
  stuffiness: { label: "Bochorno", color: "text-amber-700", bg: "bg-amber-100", description: "Alta temperatura y humedad" },
  dry: { label: "Seco", color: "text-orange-700", bg: "bg-orange-100", description: "Humedad por debajo del 40%" },
  hot: { label: "Caluroso", color: "text-red-700", bg: "bg-red-100", description: "Temperatura superior a 28°C" },
  cold: { label: "Frío", color: "text-blue-700", bg: "bg-blue-100", description: "Temperatura inferior a 18°C" },
}

export const ComfortMatrix = ({ temperature, humidity, comfortLevel }: ComfortMatrixProps) => {
  const info = COMFORT_LABELS[comfortLevel] ?? COMFORT_LABELS.ideal

  return (
    <div className="rounded-[12px] border border-black/10 bg-white p-4 flex flex-col gap-3">
      <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Confort Térmico</p>

      <span className={`inline-flex self-start rounded-full px-3 py-1 text-xs font-semibold ${info.color} ${info.bg}`}>
        {info.label}
      </span>

      <p className="text-[11px] text-[#64748b]">{info.description}</p>

      <div className="flex gap-4 mt-1">
        <div className="flex items-center gap-2">
          <Thermometer size={16} className="text-[#00554f]" />
          <div>
            <p className="text-[11px] text-[#64748b]">Temperatura</p>
            <p className="text-sm font-semibold text-[#1e293b]">{temperature.toFixed(1)}°C</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Droplets size={16} className="text-[#00554f]" />
          <div>
            <p className="text-[11px] text-[#64748b]">Humedad</p>
            <p className="text-sm font-semibold text-[#1e293b]">{humidity.toFixed(0)}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}

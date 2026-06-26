import { Leaf } from "lucide-react"
import { SectionHeader } from "../components/SectionHeader"
import { StatCard } from "../components/StatCard"
import { useEnvironmentSocket } from "../hooks/useEnvironmentSocket"
import { CO2Indicator } from "./CO2Indicator"
import { ComfortMatrix } from "./ComfortMatrix"
import { TempVsCO2Chart } from "./TempVsCO2Chart"
import type { SensorOption } from "../DashboardLayout"

interface EnvironmentDashboardProps {
  sensorId: string | null
  sensorOptions: SensorOption[]
  onSelectSensor: (id: string) => void
}

export const EnvironmentDashboard = ({ sensorId, sensorOptions, onSelectSensor }: EnvironmentDashboardProps) => {
  const { co2, temperature, humidity, comfortLevel, minCo2, maxCo2, avgCo2, chartHistory, isConnected } =
    useEnvironmentSocket(sensorId)

  if (!sensorId) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Ambiente" subtitle="Calidad del Aire" icon={<Leaf size={22} />} />
        <div className="rounded-[12px] border border-dashed border-black/10 bg-white p-8 text-center text-[#64748b]">
          No hay sensores de ambiente disponibles para tu entidad.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Ambiente"
        subtitle="Calidad del Aire"
        icon={<Leaf size={22} />}
        rightContent={
          <div className="flex items-center gap-3">
            {sensorOptions.length > 1 && (
              <select
                value={sensorId}
                onChange={(e) => onSelectSensor(e.target.value)}
                className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#00554f]/20"
              >
                {sensorOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.id}</option>
                ))}
              </select>
            )}
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                isConnected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {isConnected ? "En vivo" : "Sin conexión"}
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="CO₂ Min" value={`${minCo2} ppm`} />
        <StatCard label="CO₂ Promedio" value={`${avgCo2} ppm`} />
        <StatCard label="CO₂ Máx" value={`${maxCo2} ppm`} />
        <StatCard label="Temp. Ambiente" value={`${temperature.toFixed(1)} °C`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CO2Indicator co2={co2} />
        <ComfortMatrix temperature={temperature} humidity={humidity} comfortLevel={comfortLevel} />
      </div>

      <TempVsCO2Chart history={chartHistory} />
    </div>
  )
}

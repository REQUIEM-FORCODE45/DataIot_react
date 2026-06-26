import { useState } from "react"
import { Thermometer } from "lucide-react"
import { SectionHeader } from "../components/SectionHeader"
import { useTemperatureSocket } from "../hooks/useTemperatureSocket"
import { TempGauge } from "./TempGauge"
import { ThermalExcursion } from "./ThermalExcursion"
import { CoolingRate } from "./CoolingRate"
import { TempHistoryChart } from "./TempHistoryChart"
import type { SensorOption } from "../DashboardLayout"

interface TemperatureDashboardProps {
  sensorId: string | null
  sensorOptions: SensorOption[]
  onSelectSensor: (id: string) => void
}

export const TemperatureDashboard = ({ sensorId, sensorOptions, onSelectSensor }: TemperatureDashboardProps) => {
  const { currentTemp, coolingRate, excursionTime, isOutOfRange, status, chartHistory, isConnected } =
    useTemperatureSocket(sensorId)
  const [tempMax, setTempMax] = useState(100)

  if (!sensorId) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Temperatura" subtitle="Tanque de Leche — Cadena de Frío" icon={<Thermometer size={22} />} />
        <div className="rounded-[12px] border border-dashed border-black/10 bg-white p-8 text-center text-[#64748b]">
          No hay sensores de temperatura disponibles para tu entidad.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Temperatura"
        subtitle="Tanque de Leche — Cadena de Frío"
        icon={<Thermometer size={22} />}
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
            <div className="flex items-center gap-1.5 border-l border-black/10 pl-3">
              <label className="text-[10px] uppercase tracking-[0.1em] text-[#64748b]">Máx:</label>
              <input
                type="number"
                value={tempMax}
                onChange={(e) => setTempMax(Math.max(1, Number(e.target.value)))}
                className="w-16 rounded-md border border-black/10 bg-white px-2 py-1 text-xs text-center text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#00554f]/20"
              />
              <span className="text-[10px] text-[#64748b]">°C</span>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TempGauge value={currentTemp} max={tempMax} />
        <ThermalExcursion seconds={excursionTime} isActive={isOutOfRange} />
        <CoolingRate rate={coolingRate} status={status} />
      </div>

      <TempHistoryChart history={chartHistory} />
    </div>
  )
}

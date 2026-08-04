import { useState } from "react"
import { Thermometer } from "lucide-react"
import { SectionHeader } from "../components/SectionHeader"
import { useTemperatureSocket } from "../hooks/useTemperatureSocket"
import { TempGauge } from "../temperature/TempGauge"
import { ThermalExcursion } from "../temperature/ThermalExcursion"
import { CoolingRate } from "../temperature/CoolingRate"
import { TempHistoryChart } from "../temperature/TempHistoryChart"
import { TEMP_WIDGETS } from "./widgetDefs"

interface TemperatureSensorSectionProps {
  sensorId: string
  label?: string
  enabledWidgets: Set<string>
  onToggleWidget: (widgetId: string) => void
}

export const TemperatureSensorSection = ({
  sensorId,
  label,
  enabledWidgets,
  onToggleWidget,
}: TemperatureSensorSectionProps) => {
  const { currentTemp, coolingRate, excursionTime, isOutOfRange, status, chartHistory, isConnected } =
    useTemperatureSocket(sensorId)
  const [tempMax, setTempMax] = useState(100)

  const showGauge = enabledWidgets.has("gauge")
  const showCooling = enabledWidgets.has("cooling")
  const showExcursion = enabledWidgets.has("excursion")
  const showHistory = enabledWidgets.has("history")

  const inlineWidgets = [showGauge, showCooling, showExcursion].filter(Boolean)
  const inlineCount = inlineWidgets.length

  return (
    <section className="space-y-4">
      <SectionHeader
        title={sensorId}
        subtitle={label ?? "Tanque de Leche — Cadena de Frío"}
        icon={<Thermometer size={22} />}
        rightContent={
          <div className="flex items-center gap-3">
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

      <div className="flex flex-wrap gap-1.5">
        {TEMP_WIDGETS.map((w) => {
          const active = enabledWidgets.has(w.id)
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => onToggleWidget(w.id)}
              className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                active
                  ? "bg-[#003d3a] text-white"
                  : "bg-[#f1f5f9] text-[#64748b] border border-black/10 hover:bg-[#e2e8f0]"
              }`}
            >
              {w.label}
            </button>
          )
        })}
      </div>

      {inlineCount > 0 && (
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: inlineCount === 1
              ? "1fr"
              : inlineCount === 2
                ? "repeat(2, 1fr)"
                : "repeat(3, 1fr)",
          }}
        >
          {showGauge && <TempGauge value={currentTemp} max={tempMax} />}
          {showCooling && <CoolingRate rate={coolingRate} status={status} />}
          {showExcursion && <ThermalExcursion seconds={excursionTime} isActive={isOutOfRange} />}
        </div>
      )}

      {showHistory && <TempHistoryChart history={chartHistory} />}
    </section>
  )
}

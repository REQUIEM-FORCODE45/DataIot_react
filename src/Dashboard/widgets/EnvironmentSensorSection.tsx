import { Leaf } from "lucide-react"
import { SectionHeader } from "../components/SectionHeader"
import { StatCard } from "../components/StatCard"
import { useEnvironmentSocket } from "../hooks/useEnvironmentSocket"
import { CO2Indicator } from "../environment/CO2Indicator"
import { ComfortMatrix } from "../environment/ComfortMatrix"
import { TempVsCO2Chart } from "../environment/TempVsCO2Chart"
import { ENV_WIDGETS } from "./widgetDefs"

interface EnvironmentSensorSectionProps {
  sensorId: string
  label?: string
  enabledWidgets: Set<string>
  onToggleWidget: (widgetId: string) => void
}

export const EnvironmentSensorSection = ({
  sensorId,
  label,
  enabledWidgets,
  onToggleWidget,
}: EnvironmentSensorSectionProps) => {
  const { co2, temperature, humidity, comfortLevel, minCo2, maxCo2, avgCo2, chartHistory, isConnected } =
    useEnvironmentSocket(sensorId)

  const showCO2 = enabledWidgets.has("co2")
  const showComfort = enabledWidgets.has("comfort")
  const showCorrelation = enabledWidgets.has("correlation")

  return (
    <section className="space-y-4">
      <SectionHeader
        title={sensorId}
        subtitle={label ?? "Calidad del Aire"}
        icon={<Leaf size={22} />}
        rightContent={
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              isConnected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            }`}
          >
            {isConnected ? "En vivo" : "Sin conexión"}
          </span>
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {ENV_WIDGETS.map((w) => {
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="CO₂ Min" value={`${minCo2} ppm`} />
        <StatCard label="CO₂ Promedio" value={`${avgCo2} ppm`} />
        <StatCard label="CO₂ Máx" value={`${maxCo2} ppm`} />
        <StatCard label="Temp. Ambiente" value={`${temperature.toFixed(1)} °C`} />
      </div>

      {(showCO2 || showComfort) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {showCO2 && <CO2Indicator co2={co2} />}
          {showComfort && (
            <ComfortMatrix temperature={temperature} humidity={humidity} comfortLevel={comfortLevel} />
          )}
        </div>
      )}

      {showCorrelation && <TempVsCO2Chart history={chartHistory} />}
    </section>
  )
}

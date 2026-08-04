import { Zap } from "lucide-react"
import { SectionHeader } from "../components/SectionHeader"
import { StatCard } from "../components/StatCard"
import { useEnergySocket } from "../hooks/useEnergySocket"
import { PowerSummary } from "../energy/PowerSummary"
import { EfficiencyGauge } from "../energy/EfficiencyGauge"
import { PhaseImbalance } from "../energy/PhaseImbalance"
import { FrequencySparkline } from "../energy/FrequencySparkline"
import { ENERGY_WIDGETS } from "./widgetDefs"

interface EnergySensorSectionProps {
  sensorId: string
  label?: string
  enabledWidgets: Set<string>
  onToggleWidget: (widgetId: string) => void
}

export const EnergySensorSection = ({
  sensorId,
  label,
  enabledWidgets,
  onToggleWidget,
}: EnergySensorSectionProps) => {
  const { st, pt, qt, fpt, fpa, fpb, fpc, ia, ib, ic, va, vb, vc, frequency, frequencyHistory, isConnected } =
    useEnergySocket(sensorId)

  const energyData = { st, pt, qt, fpt, fpa, fpb, fpc, ia, ib, ic, va, vb, vc, frequency }

  const showPowers = enabledWidgets.has("powers")
  const showEfficiency = enabledWidgets.has("efficiency")
  const showImbalance = enabledWidgets.has("imbalance")
  const showFrequency = enabledWidgets.has("frequency")

  return (
    <section className="space-y-4">
      <SectionHeader
        title={sensorId}
        subtitle={label ?? "Analizador Trifásico"}
        icon={<Zap size={22} />}
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
        {ENERGY_WIDGETS.map((w) => {
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
        <StatCard label="Potencia Aparente (ST)" value={`${st.toFixed(1)} kVA`} />
        <StatCard label="Potencia Activa (PT)" value={`${pt.toFixed(1)} kW`} />
        <StatCard label="Potencia Reactiva (QT)" value={`${qt.toFixed(1)} kVAR`} />
        <StatCard
          label="Factor de Potencia"
          value={fpt.toFixed(2)}
          trend={{
            direction: fpt >= 0.92 ? "up" : "down",
            value: "Total",
            color: fpt >= 0.92 ? "text-emerald-500" : "text-amber-500",
          }}
        />
      </div>

      {showPowers && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PowerSummary data={energyData} />
          {showEfficiency && <EfficiencyGauge data={energyData} />}
        </div>
      )}

      {!showPowers && showEfficiency && (
        <EfficiencyGauge data={energyData} />
      )}

      {showImbalance && <PhaseImbalance data={energyData} />}

      {showFrequency && (
        <FrequencySparkline history={frequencyHistory} currentFrequency={frequency} />
      )}
    </section>
  )
}

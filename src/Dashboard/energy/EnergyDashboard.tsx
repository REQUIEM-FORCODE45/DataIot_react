import { useState } from "react"
import { Zap } from "lucide-react"
import { SectionHeader } from "../components/SectionHeader"
import { StatCard } from "../components/StatCard"
import { useEnergySocket } from "../hooks/useEnergySocket"
import { PowerSummary } from "./PowerSummary"
import { EfficiencyGauge } from "./EfficiencyGauge"
import { PhaseImbalance } from "./PhaseImbalance"
import { FrequencySparkline } from "./FrequencySparkline"
import type { SensorOption } from "../DashboardLayout"

interface EnergyDashboardProps {
  sensorId: string | null
  sensorOptions: SensorOption[]
  onSelectSensor: (id: string) => void
}

const TABS = [
  { id: "powers", label: "Potencias" },
  { id: "imbalance", label: "Desbalance" },
  { id: "quality", label: "Calidad" },
] as const

type TabId = (typeof TABS)[number]["id"]

export const EnergyDashboard = ({ sensorId, sensorOptions, onSelectSensor }: EnergyDashboardProps) => {
  const [activeTab, setActiveTab] = useState<TabId>("powers")
  const { st, pt, qt, fpt, fpa, fpb, fpc, ia, ib, ic, va, vb, vc, frequency, frequencyHistory, loading, isConnected } =
    useEnergySocket(sensorId)

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Energía" subtitle="Analizador Trifásico" icon={<Zap size={22} />} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-[12px] border border-black/10 bg-white p-4 animate-pulse h-32" />
          ))}
        </div>
        <div className="rounded-[12px] border border-black/10 bg-white p-4 animate-pulse h-64" />
      </div>
    )
  }

  if (!sensorId) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Energía" subtitle="Analizador Trifásico" icon={<Zap size={22} />} />
        <div className="rounded-[12px] border border-dashed border-black/10 bg-white p-8 text-center text-[#64748b]">
          No hay sensores de energía disponibles para tu entidad.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Energía"
        subtitle="Analizador Trifásico"
        icon={<Zap size={22} />}
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
        <StatCard label="Potencia Aparente (ST)" value={`${st.toFixed(1)} kVA`} />
        <StatCard label="Potencia Activa (PT)" value={`${pt.toFixed(1)} kW`} />
        <StatCard label="Potencia Reactiva (QT)" value={`${qt.toFixed(1)} kVAR`} />
        <StatCard label="Factor de Potencia" value={fpt.toFixed(2)} trend={{ direction: fpt >= 0.92 ? "up" : "down", value: "Total", color: fpt >= 0.92 ? "text-emerald-500" : "text-amber-500" }} />
      </div>

      <div className="flex gap-1 border-b border-black/10 pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? "bg-white border border-black/10 border-b-white text-[#00554f] -mb-px"
                : "text-[#64748b] hover:text-[#1e293b] hover:bg-[#f8fafc]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "powers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PowerSummary data={{ st, pt, qt, fpt, fpa, fpb, fpc, ia, ib, ic, va, vb, vc, frequency }} />
          <EfficiencyGauge data={{ st, pt, qt, fpt, fpa, fpb, fpc, ia, ib, ic, va, vb, vc, frequency }} />
        </div>
      )}

      {activeTab === "imbalance" && (
        <PhaseImbalance data={{ st, pt, qt, fpt, fpa, fpb, fpc, ia, ib, ic, va, vb, vc, frequency }} />
      )}

      {activeTab === "quality" && (
        <FrequencySparkline history={frequencyHistory} currentFrequency={frequency} />
      )}
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from "react"
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom"
import { Thermometer, Leaf, Zap, LayoutDashboard } from "lucide-react"
import { apiEntidades } from "@/api/Sedes"
import { usePermissions } from "@/hooks/usePermissions"
import type { Entidad } from "@/types/entidad"
import { TemperatureDashboard } from "./temperature/TemperatureDashboard"
import { EnvironmentDashboard } from "./environment/EnvironmentDashboard"
import { EnergyDashboard } from "./energy/EnergyDashboard"

export interface SensorOption {
  id: string
  label: string
}

type DomainKey = "temp" | "ambiente" | "energy"

type DomainSensors = Record<DomainKey, SensorOption[]>
type SelectedIds = Record<DomainKey, string | null>

const NAV_ITEMS = [
  { id: "temperatura", domainKey: "temp" as const, label: "Temperatura", icon: Thermometer, color: "text-[#00554f]" },
  { id: "ambiente", domainKey: "ambiente" as const, label: "Ambiente", icon: Leaf, color: "text-emerald-600" },
  { id: "energia", domainKey: "energy" as const, label: "Energía Trifásica", icon: Zap, color: "text-amber-600" },
] as const

export const DashboardLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { filterEntitiesByAccess } = usePermissions()
  const filterRef = useRef(filterEntitiesByAccess)
  filterRef.current = filterEntitiesByAccess
  const [domainSensors, setDomainSensors] = useState<DomainSensors>({ temp: [], ambiente: [], energy: [] })
  const [selectedIds, setSelectedIds] = useState<SelectedIds>({ temp: null, ambiente: null, energy: null })
  const [loadingDomains, setLoadingDomains] = useState(true)

  const currentTab = NAV_ITEMS.find((item) => location.pathname.includes(item.id))?.id ?? "temperatura"

  const discoverDomains = useCallback(async () => {
    setLoadingDomains(true)
    try {
      const data = await apiEntidades.getAll()
      const filtered = filterRef.current(data)
      const seen = { temp: new Set<string>(), ambiente: new Set<string>(), energy: new Set<string>() }
      const sensors: DomainSensors = { temp: [], ambiente: [], energy: [] }

      filtered.forEach((entity: Entidad) => {
        entity.sedes?.forEach((sede) => {
          sede.areas?.forEach((area) => {
            area.modulos?.forEach((modulo) => {
              const sensorId = modulo.id_modulo ?? modulo._id ?? modulo.modulo ?? ""
              if (!sensorId) return

              const domain = sensorId.startsWith("MT") ? "temp" : sensorId.startsWith("MA") ? "ambiente" : sensorId.startsWith("ME") ? "energy" : "ambiente"
              if (seen[domain].has(sensorId)) return
              seen[domain].add(sensorId)

              const label = modulo.modulo ?? modulo.id_modulo ?? sensorId
              sensors[domain].push({ id: sensorId, label })
            })
          })
        })
      })

      setDomainSensors(sensors)
      setSelectedIds({
        temp: sensors.temp[0]?.id ?? null,
        ambiente: sensors.ambiente[0]?.id ?? null,
        energy: sensors.energy[0]?.id ?? null,
      })
    } catch {
      console.warn("No se pudieron descubrir los dominios")
    } finally {
      setLoadingDomains(false)
    }
  }, [])

  useEffect(() => {
    discoverDomains()
  }, [discoverDomains])

  const handleSelectSensor = useCallback((domainKey: DomainKey, sensorId: string) => {
    setSelectedIds((prev) => ({ ...prev, [domainKey]: sensorId }))
  }, [])

  const handleNavigate = useCallback((id: string) => {
    navigate(`/dashboard/${id}`)
  }, [navigate])

  if (loadingDomains) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <LayoutDashboard size={22} className="text-[#00554f]" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Dashboard</p>
            <h1 className="text-xl font-semibold text-[#1e293b]">Cargando sensores...</h1>
          </div>
        </div>
        <div className="rounded-[12px] border border-black/10 bg-white p-8 animate-pulse">
          <div className="h-64 flex items-center justify-center text-[#64748b]">Descubriendo módulos disponibles...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard size={22} className="text-[#00554f]" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Dashboard</p>
            <h1 className="text-xl font-semibold text-[#1e293b]">Panel de Monitoreo</h1>
          </div>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = currentTab === item.id
          const Icon = item.icon
          const count = domainSensors[item.domainKey].length
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#00554f] text-white shadow-sm"
                  : "bg-white border border-black/10 text-[#64748b] hover:bg-[#f8fafc] hover:text-[#1e293b]"
              }`}
            >
              <Icon size={16} className={isActive ? "text-white" : item.color} />
              <span>{item.label}</span>
              {count > 0 && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  isActive ? "bg-white/20 text-white" : "bg-[#f1f5f9] text-[#64748b]"
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="temperatura" replace />} />
        <Route
          path="temperatura"
          element={
            <TemperatureDashboard
              sensorId={selectedIds.temp}
              sensorOptions={domainSensors.temp}
              onSelectSensor={(id) => handleSelectSensor("temp", id)}
            />
          }
        />
        <Route
          path="ambiente"
          element={
            <EnvironmentDashboard
              sensorId={selectedIds.ambiente}
              sensorOptions={domainSensors.ambiente}
              onSelectSensor={(id) => handleSelectSensor("ambiente", id)}
            />
          }
        />
        <Route
          path="energia"
          element={
            <EnergyDashboard
              sensorId={selectedIds.energy}
              sensorOptions={domainSensors.energy}
              onSelectSensor={(id) => handleSelectSensor("energy", id)}
            />
          }
        />
      </Routes>
    </div>
  )
}

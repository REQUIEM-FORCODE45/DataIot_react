import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { apiEntidades } from "@/api/Sedes"
import { usePermissions } from "@/hooks/usePermissions"
import type { Entidad, Modulo } from "@/types/entidad"
import {
  LayoutDashboard,
  Building2,
  Layers,
  Cpu,
  ChevronDown,
  Thermometer,
  Zap,
  Leaf,
  Play,
} from "lucide-react"

type DomainKey = "temp" | "ambiente" | "energy"

interface SensorItem {
  id: string
  label: string
  domain: DomainKey
  areaName: string
  sedeName: string
}

interface SensorGroup {
  groupId: string
  areaName: string
  sedeName?: string
  sensors: SensorItem[]
}

const DOMAIN_META = {
  temp: { icon: Thermometer, color: "text-[#00554f]", label: "Temperatura" },
  ambiente: { icon: Leaf, color: "text-emerald-600", label: "Ambiente" },
  energy: { icon: Zap, color: "text-amber-600", label: "Energía" },
} as const

const hasPrefix = (lower: string, prefix: string): boolean =>
  lower.startsWith(prefix) || lower.includes(`_${prefix}`)

const classifyDomain = (sensorId: string): DomainKey => {
  const lower = sensorId.toLowerCase()
  if (hasPrefix(lower, "mt")) return "temp"
  if (hasPrefix(lower, "amb")) return "ambiente"
  if (hasPrefix(lower, "ma")) return "ambiente"
  if (hasPrefix(lower, "me")) return "energy"
  return "ambiente"
}

const getModuleId = (module: Modulo, fallback: string): string =>
  module.id_modulo ?? module._id ?? module.modulo ?? fallback

const getModuleLabel = (module: Modulo, id: string): string =>
  module.modulo ?? module.id_modulo ?? id

export const DashboardSetup = () => {
  const navigate = useNavigate()
  const { filterEntitiesByAccess } = usePermissions()
  const filterRef = useRef(filterEntitiesByAccess)
  filterRef.current = filterEntitiesByAccess

  const [entities, setEntities] = useState<Entidad[]>([])
  const [loadingEntities, setLoadingEntities] = useState(true)
  const [selectedEntityId, setSelectedEntityId] = useState<string>("")
  const [selectedSensorIds, setSelectedSensorIds] = useState<Set<string>>(new Set())
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())

  const selectedEntity = useMemo(
    () => entities.find((e) => e._id === selectedEntityId) ?? null,
    [entities, selectedEntityId]
  )

  const sensorGroups = useMemo<SensorGroup[]>(() => {
    if (!selectedEntity) return []
    const groups: SensorGroup[] = []

    selectedEntity.sedes?.forEach((sede) => {
      sede.areas?.forEach((area) => {
        const sensors: SensorItem[] = []
        area.modulos?.forEach((modulo, idx) => {
          const id = getModuleId(modulo, `${sede._id ?? sede.name}-${area._id ?? area.name}-${idx}`)
          if (!id) return
          const domain = classifyDomain(id)
          sensors.push({
            id,
            label: getModuleLabel(modulo, id),
            domain,
            areaName: area.name,
            sedeName: sede.name,
          })
        })
        if (sensors.length > 0) {
          groups.push({
            groupId: `${sede._id ?? sede.name}-${area._id ?? area.name}`,
            areaName: area.name,
            sedeName: sede.name,
            sensors,
          })
        }
      })
    })

    return groups
  }, [selectedEntity])

  const allSensors = useMemo(() => sensorGroups.flatMap((g) => g.sensors), [sensorGroups])

  useEffect(() => {
    const load = async () => {
      setLoadingEntities(true)
      try {
        const data = await apiEntidades.getAll()
        const filtered = filterRef.current(data)
        setEntities(filtered)
        if (filtered.length > 0 && !selectedEntityId) {
          setSelectedEntityId(filtered[0]._id)
        }
      } finally {
        setLoadingEntities(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    setSelectedSensorIds(new Set())
    setOpenGroups(new Set())
  }, [selectedEntityId])

  useEffect(() => {
    setOpenGroups(new Set())
  }, [sensorGroups])

  const toggleSensor = useCallback((sensorId: string) => {
    setSelectedSensorIds((prev) => {
      const next = new Set(prev)
      if (next.has(sensorId)) {
        next.delete(sensorId)
      } else {
        next.add(sensorId)
      }
      return next
    })
  }, [])

  const toggleGroup = useCallback((groupId: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedSensorIds(new Set(allSensors.map((s) => s.id)))
  }, [allSensors])

  const deselectAll = useCallback(() => {
    setSelectedSensorIds(new Set())
  }, [])

  const handleLaunch = useCallback(() => {
    const selected = allSensors.filter((s) => selectedSensorIds.has(s.id))
    navigate("/dashboard/view", { state: { sensors: selected } })
  }, [navigate, allSensors, selectedSensorIds])

  const totalSedes = selectedEntity?.sedes?.length ?? 0
  const totalAreas = sensorGroups.length
  const totalSensors = allSensors.length
  const selectedCount = selectedSensorIds.size

  const selectedByDomain = useMemo(() => {
    const counts: Record<DomainKey, number> = { temp: 0, ambiente: 0, energy: 0 }
    allSensors.forEach((s) => {
      if (selectedSensorIds.has(s.id)) {
        counts[s.domain]++
      }
    })
    return counts
  }, [allSensors, selectedSensorIds])

  return (
    <div className="w-full max-w-[1400px] mx-auto px-2 min-w-0 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard size={22} className="text-[#00554f]" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Dashboard</p>
            <h1 className="text-xl font-semibold text-[#1e293b]">Configurar Panel</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={deselectAll}
            disabled={selectedCount === 0}
            variant="outline"
            size="sm"
            className="h-8 text-xs border-[#003d3a] text-[#003d3a] hover:bg-[#003d3a]/10"
          >
            Limpiar
          </Button>
          <Button
            onClick={handleLaunch}
            disabled={selectedCount === 0}
            size="sm"
            className="h-8 gap-2 bg-[#003d3a] hover:bg-[#002f2d] text-white"
          >
            <Play size={14} />
            Iniciar Dashboard
          </Button>
        </div>
      </div>

      {loadingEntities ? (
        <div className="space-y-4">
          <Skeleton className="h-12 rounded-[12px]" />
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-[12px]" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-[12px]" />
        </div>
      ) : (
        <>
          <Card className="rounded-[12px] border border-black/10">
            <CardHeader className="space-y-2">
              <CardTitle className="text-base text-[#1e293b]">Entidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-[11px] uppercase tracking-[0.3em] text-[#64748b]">Seleccionar</label>
                  <select
                    value={selectedEntityId}
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                    className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm"
                  >
                    {entities.length === 0 && <option>Sin entidades</option>}
                    {entities.map((entity) => (
                      <option key={entity._id} value={entity._id}>
                        {entity.name}
                      </option>
                    ))}
                  </select>
                </div>
                <article className="rounded-[12px] border border-black/10 bg-[#f8fafc] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Sedes</p>
                  <div className="flex items-center gap-2 text-2xl font-semibold text-[#00554f]">
                    <Building2 size={20} />
                    <span>{totalSedes}</span>
                  </div>
                </article>
                <article className="rounded-[12px] border border-black/10 bg-[#f8fafc] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Áreas</p>
                  <div className="flex items-center gap-2 text-2xl font-semibold text-[#00554f]">
                    <Layers size={20} />
                    <span>{totalAreas}</span>
                  </div>
                </article>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-[12px] border border-black/10 bg-[#e7ecf2] px-6 py-4 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-4">
              <article className="rounded-[12px] border border-black/10 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Sensores</p>
                <div className="flex items-center gap-2 text-2xl font-semibold text-[#00554f]">
                  <Cpu size={20} />
                  <span>{totalSensors}</span>
                </div>
              </article>
              {(["temp", "ambiente", "energy"] as DomainKey[]).map((domain) => {
                const meta = DOMAIN_META[domain]
                const Icon = meta.icon
                return (
                  <article key={domain} className="rounded-[12px] border border-black/10 bg-white px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">{meta.label}</p>
                    <div className="flex items-center gap-2 text-2xl font-semibold">
                      <Icon size={20} className={meta.color} />
                      <span>{selectedByDomain[domain]}</span>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>

          {sensorGroups.length === 0 ? (
            <Card className="rounded-[12px] border border-dashed border-black/10 p-8 text-center text-[#64748b]">
              No hay sensores registrados para esta entidad.
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#1e293b]">
                  Sensores seleccionados: {selectedCount} de {totalSensors}
                </h2>
                <Button
                  onClick={selectAll}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-[#00554f] hover:bg-[#00554f]/10"
                >
                  Seleccionar todos
                </Button>
              </div>

              {sensorGroups.map((group) => (
                <section key={group.groupId} className="rounded-[12px] border border-black/10 bg-white p-4">
                  <div
                    className="flex items-center justify-between gap-4 cursor-pointer hover:bg-[#f8fafc] rounded-lg -mx-2 px-2 py-1 transition-colors"
                    onClick={() => toggleGroup(group.groupId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        toggleGroup(group.groupId)
                      }
                    }}
                  >
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Área</p>
                      <h3 className="text-base font-semibold text-[#1e293b]">{group.areaName}</h3>
                      {group.sedeName && (
                        <p className="text-[11px] text-[#94a3b8]">Sede: {group.sedeName}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#64748b]">{group.sensors.length} sensores</span>
                      <ChevronDown
                        size={16}
                        className={
                          openGroups.has(group.groupId)
                            ? "rotate-180 transition-transform"
                            : "transition-transform"
                        }
                      />
                    </div>
                  </div>
                  {openGroups.has(group.groupId) && (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {group.sensors.map((sensor) => {
                        const meta = DOMAIN_META[sensor.domain]
                        const Icon = meta.icon
                        const checked = selectedSensorIds.has(sensor.id)
                        return (
                          <label
                            key={sensor.id}
                            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition ${
                              checked
                                ? "bg-[#00554f]/10 border-[#00554f]/30"
                                : "bg-[#f8fafc] border-black/5 hover:bg-[#f1f5f9]"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSensor(sensor.id)}
                              className="h-4 w-4 accent-[#00554f]"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <Icon size={14} className={meta.color} />
                                <p className="truncate font-semibold text-[#1e293b]">{sensor.id}</p>
                              </div>
                              <p className="text-[11px] text-[#64748b] truncate font-medium">{sensor.label}</p>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

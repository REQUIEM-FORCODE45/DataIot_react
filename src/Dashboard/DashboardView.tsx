import { useCallback, useState } from "react"
import { useLocation, Navigate } from "react-router-dom"
import { ArrowLeft, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SensorSocketProvider } from "./contexts/SensorSocketProvider"
import { TemperatureSensorSection } from "./widgets/TemperatureSensorSection"
import { EnergySensorSection } from "./widgets/EnergySensorSection"
import { EnvironmentSensorSection } from "./widgets/EnvironmentSensorSection"
import { ALL_WIDGET_IDS_BY_DOMAIN } from "./widgets/widgetDefs"

type DomainKey = "temp" | "ambiente" | "energy"

interface SensorConfig {
  id: string
  label: string
  domain: DomainKey
  areaName: string
  sedeName: string
}

export const DashboardView = () => {
  const location = useLocation()
  const sensors: SensorConfig[] = (location.state as { sensors?: SensorConfig[] })?.sensors ?? []

  const [widgetConfig, setWidgetConfig] = useState<Map<string, Set<string>>>(() => {
    const map = new Map<string, Set<string>>()
    sensors.forEach((s) => {
      const allIds = ALL_WIDGET_IDS_BY_DOMAIN[s.domain] ?? []
      map.set(s.id, new Set(allIds))
    })
    return map
  })

  const toggleWidget = useCallback((sensorId: string, widgetId: string) => {
    setWidgetConfig((prev) => {
      const next = new Map(prev)
      const current = next.get(sensorId) ?? new Set()
      const updated = new Set(current)
      if (updated.has(widgetId)) {
        updated.delete(widgetId)
      } else {
        updated.add(widgetId)
      }
      next.set(sensorId, updated)
      return next
    })
  }, [])

  if (!sensors || sensors.length === 0) {
    return <Navigate to="/dashboard" replace />
  }

  const allSensorIds = sensors.map((s) => s.id)

  const tempSensors = sensors.filter((s) => s.domain === "temp")
  const energySensors = sensors.filter((s) => s.domain === "energy")
  const envSensors = sensors.filter((s) => s.domain === "ambiente")

  return (
    <SensorSocketProvider sensorIds={allSensorIds}>
      <div className="w-full max-w-[1400px] mx-auto px-2 min-w-0 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings2 size={22} className="text-[#00554f]" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Dashboard</p>
              <h1 className="text-xl font-semibold text-[#1e293b]">
                Panel de Monitoreo — {sensors.length} sensor{sensors.length !== 1 ? "es" : ""}
              </h1>
            </div>
          </div>
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            size="sm"
            className="h-8 gap-2 text-xs border-[#003d3a] text-[#003d3a] hover:bg-[#003d3a]/10"
          >
            <ArrowLeft size={14} />
            Volver
          </Button>
        </div>

        <div className="rounded-[12px] border border-black/10 bg-[#e7ecf2] px-6 py-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] uppercase tracking-[0.3em] text-[#64748b]">Sensores activos:</span>
            {sensors.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-medium text-[#1e293b]"
              >
                {s.id}
                {s.areaName && (
                  <span className="text-[#94a3b8]">· {s.areaName}</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {tempSensors.map((sensor) => (
          <TemperatureSensorSection
            key={sensor.id}
            sensorId={sensor.id}
            label={sensor.label}
            enabledWidgets={widgetConfig.get(sensor.id) ?? new Set()}
            onToggleWidget={(widgetId) => toggleWidget(sensor.id, widgetId)}
          />
        ))}

        {energySensors.map((sensor) => (
          <EnergySensorSection
            key={sensor.id}
            sensorId={sensor.id}
            label={sensor.label}
            enabledWidgets={widgetConfig.get(sensor.id) ?? new Set()}
            onToggleWidget={(widgetId) => toggleWidget(sensor.id, widgetId)}
          />
        ))}

        {envSensors.map((sensor) => (
          <EnvironmentSensorSection
            key={sensor.id}
            sensorId={sensor.id}
            label={sensor.label}
            enabledWidgets={widgetConfig.get(sensor.id) ?? new Set()}
            onToggleWidget={(widgetId) => toggleWidget(sensor.id, widgetId)}
          />
        ))}
      </div>
    </SensorSocketProvider>
  )
}

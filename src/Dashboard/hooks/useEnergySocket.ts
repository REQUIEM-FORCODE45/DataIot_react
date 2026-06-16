import { useCallback, useEffect, useState } from "react"
import { apiCommands } from "@/api/Commands"
import { useSensorSocket, type SensorRealtimePayload } from "@/hooks/useSensorSocket"
import { getColombiaTimestamp } from "./useColombiaTimestamp"

export interface EnergyPoint {
  time: string
  frequency: number
}

export interface EnergyData {
  st: number
  pt: number
  qt: number
  fpt: number
  fpa: number
  fpb: number
  fpc: number
  ia: number
  ib: number
  ic: number
  va: number
  vb: number
  vc: number
  frequency: number
}

const initialState: EnergyData = {
  st: 0, pt: 0, qt: 0,
  fpt: 1, fpa: 1, fpb: 1, fpc: 1,
  ia: 0, ib: 0, ic: 0,
  va: 0, vb: 0, vc: 0,
  frequency: 60,
}

const parseNumeric = (val: unknown, fallback: number): number =>
  typeof val === "number" ? val : typeof val === "string" ? Number(val) : fallback

const parseEnergyPayload = (p: Record<string, unknown>): Partial<EnergyData> => ({
  st: parseNumeric(p.st, 0),
  pt: parseNumeric(p.pt, 0),
  qt: parseNumeric(p.qt, 0),
  fpt: parseNumeric(p.fpt, 1),
  fpa: parseNumeric(p.fpa, 1),
  fpb: parseNumeric(p.fpb, 1),
  fpc: parseNumeric(p.fpc, 1),
  ia: parseNumeric(p.ia, 0),
  ib: parseNumeric(p.ib, 0),
  ic: parseNumeric(p.ic, 0),
  va: parseNumeric(p.va, 0),
  vb: parseNumeric(p.vb, 0),
  vc: parseNumeric(p.vc, 0),
  frequency: parseNumeric(p.fre, 60),
})

export const useEnergySocket = (sensorId: string | null) => {
  const [data, setData] = useState<EnergyData>(initialState)
  const [frequencyHistory, setFrequencyHistory] = useState<EnergyPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sensorIds = sensorId ? [sensorId] : []

  useEffect(() => {
    setFrequencyHistory([])

    if (!sensorId) {
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchInitial = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await apiCommands.getSensorHistory(sensorId, 28)
        if (!cancelled) {
          const records = res.data.data ?? []
          if (records.length > 0) {
            const last = records[records.length - 1]
            const st = parseNumeric(last.st ?? last.value1, 0)
            const pt = parseNumeric(last.pt ?? last.value2, 0)
            const qt = parseNumeric(last.qt ?? last.value3, 0)
            setData((prev) => ({ ...prev, st, pt, qt }))
          }
        }
      } catch {
        if (!cancelled) setError("Error al cargar histórico de energía")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchInitial()
    return () => { cancelled = true }
  }, [sensorId])

  const handleUpdate = useCallback((payload: SensorRealtimePayload) => {
    if (payload.type_sensor !== "energy") return
    const p = payload.payload as Record<string, unknown> | undefined
    if (!p) return

    const timestamp = getColombiaTimestamp()
    const parsed = parseEnergyPayload(p)

    setData((prev) => ({ ...prev, ...parsed }))

    if (parsed.frequency && parsed.frequency > 0) {
      setFrequencyHistory((prev) => {
        const next = [...prev, { time: timestamp, frequency: parsed.frequency! }]
        return next.length > 200 ? next.slice(-200) : next
      })
    }
  }, [])

  const { isConnected } = useSensorSocket({ sensorIds, onSensorUpdate: handleUpdate })

  return { ...data, frequencyHistory, loading, error, isConnected }
}

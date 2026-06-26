import { useCallback, useEffect, useRef, useState } from "react"
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
  st: parseNumeric(p.ST, 0),
  pt: parseNumeric(p.PT, 0),
  qt: parseNumeric(p.QT, 0),
  fpt: parseNumeric(p.FPT, 1),
  fpa: parseNumeric(p.FPA, 1),
  fpb: parseNumeric(p.FPB, 1),
  fpc: parseNumeric(p.FPC, 1),
  ia: parseNumeric(p.IA, 0),
  ib: parseNumeric(p.IB, 0),
  ic: parseNumeric(p.IC, 0),
  va: parseNumeric(p.VA, 0),
  vb: parseNumeric(p.VB, 0),
  vc: parseNumeric(p.VC, 0),
  frequency: parseNumeric(p.Fre, 60),
})

export const useEnergySocket = (sensorId: string | null) => {
  const [data, setData] = useState<EnergyData>(initialState)
  const [frequencyHistory, setFrequencyHistory] = useState<EnergyPoint[]>([])

  const sensorIdRef = useRef(sensorId)

  useEffect(() => {
    sensorIdRef.current = sensorId
  })

  const sensorIds = sensorId ? [sensorId] : []

  const handleUpdate = useCallback((payload: SensorRealtimePayload) => {
    if (payload.type_sensor !== "energy") return
    if (payload.id_sensor !== sensorIdRef.current) return
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

  return { ...data, frequencyHistory, isConnected }
}

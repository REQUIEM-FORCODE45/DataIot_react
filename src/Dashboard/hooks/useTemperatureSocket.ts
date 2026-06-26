import { useCallback, useEffect, useRef, useState } from "react"
import { useSensorSocket, type SensorRealtimePayload } from "@/hooks/useSensorSocket"
import { getColombiaTimestamp } from "./useColombiaTimestamp"

export interface TempPoint {
  time: string
  temp: number
}

export interface TemperatureData {
  currentTemp: number
  coolingRate: number
  excursionTime: number
  isOutOfRange: boolean
  status: "stable" | "cooling" | "heating"
  minTemp: number
  maxTemp: number
  avgTemp: number
}

const RANGE_LOW = 2
const RANGE_HIGH = 6

const initialState: TemperatureData = {
  currentTemp: 4,
  coolingRate: 0,
  excursionTime: 0,
  isOutOfRange: false,
  status: "stable",
  minTemp: 4,
  maxTemp: 4,
  avgTemp: 4,
}

const calcWsRate = (history: TempPoint[]): number => {
  if (history.length < 2) return 0
  const first = history[0]
  const last = history[history.length - 1]
  const diffMs = new Date(last.time).getTime() - new Date(first.time).getTime()
  if (diffMs <= 0) return 0
  const raw = (last.temp - first.temp) / (diffMs / (1000 * 60 * 60))
  return Number.isFinite(raw) ? Number(raw.toFixed(2)) : 0
}

export const useTemperatureSocket = (sensorId: string | null) => {
  const [data, setData] = useState<TemperatureData>(initialState)
  const [chartHistory, setChartHistory] = useState<TempPoint[]>([])
  const excursionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const historyRef = useRef<TempPoint[]>([])
  const sensorIdRef = useRef(sensorId)

  useEffect(() => {
    sensorIdRef.current = sensorId
  })

  const sensorIds = sensorId ? [sensorId] : []

  useEffect(() => {
    if (excursionIntervalRef.current) clearInterval(excursionIntervalRef.current)
    if (data.isOutOfRange) {
      excursionIntervalRef.current = setInterval(() => {
        setData((prev) => ({ ...prev, excursionTime: prev.excursionTime + 1 }))
      }, 1000)
    }
    return () => {
      if (excursionIntervalRef.current) clearInterval(excursionIntervalRef.current)
    }
  }, [data.isOutOfRange])

  const handleUpdate = useCallback((payload: SensorRealtimePayload) => {
    if (payload.id_sensor !== sensorIdRef.current) return
    const p = payload.payload as Record<string, unknown> | undefined
    if (!p) return
    const temp = typeof p.Temperatura === "number" ? p.Temperatura : typeof p.temp === "number" ? p.temp : typeof p.value2 === "number" ? p.value2 : typeof p.value1 === "number" ? p.value1 : null
    if (temp === null) return

    const timestamp = getColombiaTimestamp()
    const point: TempPoint = { time: timestamp, temp }

    setChartHistory((prev) => {
      const next = [...prev, point]
      return next.length > 200 ? next.slice(-200) : next
    })

    historyRef.current = [...historyRef.current, point].slice(-200)

    const rate = calcWsRate(historyRef.current)
    const outOfRange = temp < RANGE_LOW || temp > RANGE_HIGH

    setData((prev) => ({
      ...prev,
      currentTemp: temp,
      coolingRate: rate,
      isOutOfRange: outOfRange,
      status: rate < -0.5 ? "cooling" : rate > 0.5 ? "heating" : "stable",
      minTemp: Math.min(prev.minTemp, temp),
      maxTemp: Math.max(prev.maxTemp, temp),
    }))
  }, [])

  const { isConnected } = useSensorSocket({ sensorIds, onSensorUpdate: handleUpdate })

  return { ...data, chartHistory, isConnected }
}
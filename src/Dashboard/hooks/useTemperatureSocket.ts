import { useCallback, useEffect, useRef, useState } from "react"
import { apiCommands } from "@/api/Commands"
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

const parseRecords = (records: { createAt?: string; createdAt?: string; temp?: number; value1?: number; value2?: number }[]): TempPoint[] => {
  return records
    .map((r) => ({
      time: r.createAt ?? r.createdAt ?? "",
      temp: r.temp ?? r.value2 ?? r.value1 ?? 0,
    }))
    .filter((p) => p.time && p.temp > 0)
    .sort((a, b) => a.time.localeCompare(b.time))
}

const recalcFromPoints = (points: TempPoint[]): TemperatureData => {
  if (!points.length) return initialState
  const latest = points[points.length - 1]
  const prev = points.length > 1 ? points[points.length - 2] : latest
  const diffMs = new Date(latest.time).getTime() - new Date(prev.time).getTime()
  const raw = diffMs > 0
    ? Number(((latest.temp - prev.temp) / (diffMs / (1000 * 60 * 60))).toFixed(2))
    : 0
  const rate = Number.isFinite(raw) ? raw : 0
  const outOfRange = latest.temp < RANGE_LOW || latest.temp > RANGE_HIGH
  const temps = points.map((p) => p.temp)

  return {
    currentTemp: latest.temp,
    coolingRate: rate,
    excursionTime: points.filter((p) => p.temp < RANGE_LOW || p.temp > RANGE_HIGH).length * 5,
    isOutOfRange: outOfRange,
    status: rate < -0.5 ? "cooling" : rate > 0.5 ? "heating" : "stable",
    minTemp: Math.min(...temps),
    maxTemp: Math.max(...temps),
    avgTemp: Number((temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(2)),
  }
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const excursionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const historyRef = useRef<TempPoint[]>([])

  const sensorIds = sensorId ? [sensorId] : []

  useEffect(() => {
    setChartHistory([])
    historyRef.current = []
    setData(initialState)

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
        const records = res.data.data ?? []
        const points = parseRecords(records)
        if (!cancelled) {
          setData(recalcFromPoints(points))
        }
      } catch {
        if (!cancelled) setError("Error al cargar histórico de temperatura")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchInitial()
    return () => { cancelled = true }
  }, [sensorId])

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
    if (payload.type_sensor !== "temp") return
    const p = payload.payload as Record<string, unknown> | undefined
    if (!p) return
    const temp = typeof p.temp === "number" ? p.temp : typeof p.value2 === "number" ? p.value2 : typeof p.value1 === "number" ? p.value1 : null
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

  return { ...data, chartHistory, loading, error, isConnected }
}
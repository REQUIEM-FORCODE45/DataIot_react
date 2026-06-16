import { useCallback, useEffect, useState } from "react"
import { apiCommands } from "@/api/Commands"
import { useSensorSocket, type SensorRealtimePayload } from "@/hooks/useSensorSocket"
import { getColombiaTimestamp } from "./useColombiaTimestamp"

export interface EnvPoint {
  time: string
  temp: number
  co2: number
  humidity: number
}

export interface EnvironmentData {
  co2: number
  temperature: number
  humidity: number
  comfortLevel: "ideal" | "stuffiness" | "dry" | "hot" | "cold"
  minCo2: number
  maxCo2: number
  avgCo2: number
}

const initialState: EnvironmentData = {
  co2: 600,
  temperature: 24,
  humidity: 50,
  comfortLevel: "ideal",
  minCo2: 600,
  maxCo2: 600,
  avgCo2: 600,
}

const calcComfort = (temp: number, hum: number): EnvironmentData["comfortLevel"] => {
  if (temp >= 22 && temp <= 26 && hum >= 40 && hum <= 60) return "ideal"
  if (temp > 26 && hum > 60) return "stuffiness"
  if (hum < 40) return "dry"
  if (temp > 28) return "hot"
  if (temp < 18) return "cold"
  return "ideal"
}

const parseRecords = (records: { createAt?: string; createdAt?: string; value1?: number; value2?: number; value4?: number; temp?: number }[]): EnvPoint[] => {
  return records
    .map((r) => ({
      time: r.createAt ?? r.createdAt ?? "",
      co2: r.value1 ?? 0,
      temp: r.value2 ?? r.temp ?? 0,
      humidity: r.value4 ?? 0,
    }))
    .filter((p) => p.time && (p.co2 > 0 || p.temp > 0))
}

const recalcFromPoints = (points: EnvPoint[]): EnvironmentData => {
  if (!points.length) return initialState
  const latest = points[points.length - 1]
  const co2Values = points.filter((p) => p.co2 > 0).map((p) => p.co2)

  return {
    co2: latest.co2 || initialState.co2,
    temperature: latest.temp || initialState.temperature,
    humidity: latest.humidity || initialState.humidity,
    comfortLevel: calcComfort(latest.temp || initialState.temperature, latest.humidity || initialState.humidity),
    minCo2: co2Values.length ? Math.min(...co2Values) : initialState.minCo2,
    maxCo2: co2Values.length ? Math.max(...co2Values) : initialState.maxCo2,
    avgCo2: co2Values.length ? Number((co2Values.reduce((a, b) => a + b, 0) / co2Values.length).toFixed(0)) : initialState.avgCo2,
  }
}

export const useEnvironmentSocket = (sensorId: string | null) => {
  const [data, setData] = useState<EnvironmentData>(initialState)
  const [chartHistory, setChartHistory] = useState<EnvPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sensorIds = sensorId ? [sensorId] : []

  useEffect(() => {
    setChartHistory([])

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
        if (!cancelled) setError("Error al cargar histórico de ambiente")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchInitial()
    return () => { cancelled = true }
  }, [sensorId])

  const handleUpdate = useCallback((payload: SensorRealtimePayload) => {
    if (payload.type_sensor !== "ambiente") return
    const p = payload.payload as Record<string, unknown> | undefined
    if (!p) return

    const timestamp = getColombiaTimestamp()
    const co2 = typeof p.value1 === "number" ? p.value1 : typeof p.co2 === "number" ? p.co2 : null
    const temp = typeof p.value2 === "number" ? p.value2 : typeof p.temp === "number" ? p.temp : null
    const humidity = typeof p.value4 === "number" ? p.value4 : typeof p.humidity === "number" ? p.humidity : null
    if (co2 === null && temp === null) return

    const point: EnvPoint = {
      time: timestamp,
      co2: co2 ?? data.co2,
      temp: temp ?? data.temperature,
      humidity: humidity ?? data.humidity,
    }

    setChartHistory((prev) => {
      const next = [...prev, point]
      return next.length > 200 ? next.slice(-200) : next
    })

    if (co2 !== null) {
      setData((prev) => ({
        ...prev,
        co2,
        minCo2: Math.min(prev.minCo2, co2),
        maxCo2: Math.max(prev.maxCo2, co2),
        avgCo2: Math.round((prev.avgCo2 * 0.9 + co2 * 0.1)),
      }))
    }
    if (temp !== null) {
      setData((prev) => ({ ...prev, temperature: temp }))
    }
    if (humidity !== null) {
      setData((prev) => ({
        ...prev,
        humidity,
        comfortLevel: calcComfort(temp ?? prev.temperature, humidity),
      }))
    }
    if (temp !== null && humidity !== null) {
      setData((prev) => ({ ...prev, comfortLevel: calcComfort(temp, humidity) }))
    }
  }, [data])

  const { isConnected } = useSensorSocket({ sensorIds, onSensorUpdate: handleUpdate })

  return { ...data, chartHistory, loading, error, isConnected }
}

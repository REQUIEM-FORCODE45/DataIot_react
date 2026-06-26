import { useCallback, useEffect, useRef, useState } from "react"
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

export const useEnvironmentSocket = (sensorId: string | null) => {
  const [data, setData] = useState<EnvironmentData>(initialState)
  const [chartHistory, setChartHistory] = useState<EnvPoint[]>([])

  const sensorIdRef = useRef(sensorId)

  useEffect(() => {
    sensorIdRef.current = sensorId
  })

  const sensorIds = sensorId ? [sensorId] : []

  const handleUpdate = useCallback((payload: SensorRealtimePayload) => {
    if (payload.type_sensor !== "ambiente") return
    if (payload.id_sensor !== sensorIdRef.current) return
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

  return { ...data, chartHistory, isConnected }
}

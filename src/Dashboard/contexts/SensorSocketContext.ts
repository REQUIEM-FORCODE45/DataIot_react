import { createContext, useContext } from "react"
import type { SensorRealtimePayload } from "@/hooks/useSensorSocket"

type UpdateCallback = (payload: SensorRealtimePayload) => void

export interface SensorSocketContextValue {
  isConnected: boolean
  subscribe: (callback: UpdateCallback) => () => void
}

export const SensorSocketCtx = createContext<SensorSocketContextValue | null>(null)

export const useSharedSocket = () => useContext(SensorSocketCtx)

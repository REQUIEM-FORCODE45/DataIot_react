import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { io, type Socket } from "socket.io-client"
import type { SensorRealtimePayload } from "@/hooks/useSensorSocket"
import { SensorSocketCtx, type SensorSocketContextValue } from "./SensorSocketContext"

type UpdateCallback = (payload: SensorRealtimePayload) => void

export const SensorSocketProvider = ({ children, sensorIds }: { children: ReactNode; sensorIds: string[] }) => {
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const joinedRef = useRef<string[]>([])
  const subscribersRef = useRef<Set<UpdateCallback>>(new Set())
  const isConnectedRef = useRef(false)

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_BASE_URL
    const socket = socketUrl
      ? io(socketUrl, { transports: ["websocket"], withCredentials: true })
      : io({ transports: ["websocket"], withCredentials: true })
    socketRef.current = socket

    const onConnect = () => {
      isConnectedRef.current = true
      setIsConnected(true)
    }
    const onDisconnect = () => {
      isConnectedRef.current = false
      setIsConnected(false)
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.close()
    }
  }, [])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    const onUpdate = (payload: SensorRealtimePayload) => {
      subscribersRef.current.forEach((cb) => cb(payload))
    }

    socket.on("sensor:update", onUpdate)
    return () => {
      socket.off("sensor:update", onUpdate)
    }
  }, [])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return

    const join = () => {
      joinedRef.current.forEach((id) => {
        try { socket.emit("leaveSensor", id) } catch { /* ignore */ }
      })
      sensorIds.forEach((id) => {
        try { socket.emit("joinSensor", id) } catch { /* ignore */ }
      })
      joinedRef.current = [...sensorIds]
    }

    if (isConnectedRef.current || socket.connected) {
      join()
    } else {
      socket.once("connect", join)
    }

    return () => {
      socket.off("connect", join)
      joinedRef.current.forEach((id) => {
        try { socket.emit("leaveSensor", id) } catch { /* ignore */ }
      })
      joinedRef.current = []
    }
  }, [sensorIds])

  const subscribe = useCallback((callback: UpdateCallback) => {
    subscribersRef.current.add(callback)
    return () => {
      subscribersRef.current.delete(callback)
    }
  }, [])

  const value = useMemo<SensorSocketContextValue>(
    () => ({ isConnected, subscribe }),
    [isConnected, subscribe]
  )

  return (
    <SensorSocketCtx.Provider value={value}>
      {children}
    </SensorSocketCtx.Provider>
  )
}

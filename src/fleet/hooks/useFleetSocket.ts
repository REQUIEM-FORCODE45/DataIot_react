import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import type { SensorUpdatePayload } from "@/types/fleet";

interface UseFleetSocketOptions {
  onTrackingUpdate?: (data: SensorUpdatePayload) => void;
  enabled?: boolean;
}

export function useFleetSocket({ onTrackingUpdate, enabled = true }: UseFleetSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const joinedPlacas = useRef<Set<string>>(new Set());
  const onTrackingUpdateRef = useRef(onTrackingUpdate);

  useEffect(() => {
    onTrackingUpdateRef.current = onTrackingUpdate;
  }, [onTrackingUpdate]);

  useEffect(() => {
    if (!enabled) return;
    const socketUrl = import.meta.env.VITE_SOCKET_BASE_URL;
    if (!socketUrl) return;

    const joined = joinedPlacas.current;
    const socket = io(socketUrl, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      joined.forEach((placa) => {
        socket.emit("joinSensor", placa);
      });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("sensor:update", (data: SensorUpdatePayload) => {
      onTrackingUpdateRef.current?.(data);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("sensor:update");
      socket.disconnect();
      socketRef.current = null;
      joined.clear();
    };
  }, [enabled]);

  const joinVehicle = useCallback((placa: string) => {
    if (joinedPlacas.current.has(placa)) return;
    joinedPlacas.current.add(placa);
    if (socketRef.current?.connected) {
      socketRef.current.emit("joinSensor", placa);
    }
  }, []);

  const joinMultipleVehicles = useCallback((placas: string[]) => {
    for (const placa of placas) {
      if (joinedPlacas.current.has(placa)) continue;
      joinedPlacas.current.add(placa);
      if (socketRef.current?.connected) {
        socketRef.current.emit("joinSensor", placa);
      }
    }
  }, []);

  const leaveVehicle = useCallback((placa: string) => {
    if (!joinedPlacas.current.has(placa)) return;
    joinedPlacas.current.delete(placa);
    if (socketRef.current?.connected) {
      socketRef.current.emit("leaveSensor", placa);
    }
  }, []);

  const emit = useCallback((event: string, data: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { isConnected, joinVehicle, joinMultipleVehicles, leaveVehicle, emit };
}

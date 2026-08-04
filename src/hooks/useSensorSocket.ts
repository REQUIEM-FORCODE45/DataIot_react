import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useSharedSocket } from "@/Dashboard/contexts/SensorSocketContext";

export type SensorRealtimePayload = {
  id_sensor: string;
  type_sensor?: string;
  payload?: unknown;
  timestamp?: string;
};

interface UseSensorSocketProps {
  sensorIds: string[];
  onSensorUpdate?: (payload: SensorRealtimePayload) => void;
}

const createSocket = (): Socket => {
  const socketUrl = import.meta.env.VITE_SOCKET_BASE_URL;
  return socketUrl
    ? io(socketUrl, { transports: ["websocket"], withCredentials: true })
    : io({ transports: ["websocket"], withCredentials: true });
};

export const useSensorSocket = ({ sensorIds, onSensorUpdate }: UseSensorSocketProps) => {
  const sharedCtx = useSharedSocket();
  const onSensorUpdateRef = useRef(onSensorUpdate);

  useEffect(() => {
    onSensorUpdateRef.current = onSensorUpdate;
  }, [onSensorUpdate]);

  // ---- Shared socket mode ----
  useEffect(() => {
    if (!sharedCtx) return;
    const unsub = sharedCtx.subscribe((payload) => {
      onSensorUpdateRef.current?.(payload);
    });
    return unsub;
  }, [sharedCtx]);

  // ---- Own socket mode ----
  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const joinedSensorIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (sharedCtx) return;
    const socket = createSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      setIsConnected(true);
      setSocketError(null);
    };
    const handleDisconnect = () => setIsConnected(false);
    const handleError = (error: unknown) => {
      setSocketError(typeof error === "string" ? error : "Error de conexión");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleError);
      socket.close();
    };
  }, [sharedCtx]);

  useEffect(() => {
    if (sharedCtx) return;
    const socket = socketRef.current;
    if (!socket) return;

    const cleanupRooms = () => {
      joinedSensorIdsRef.current.forEach((id) => socket.emit("leaveSensor", id));
      joinedSensorIdsRef.current = [];
    };

    const joinRooms = () => {
      cleanupRooms();
      if (!sensorIds.length) return;
      sensorIds.forEach((id) => socket.emit("joinSensor", id));
      joinedSensorIdsRef.current = [...sensorIds];
    };

    if (socket.connected) {
      joinRooms();
    } else {
      socket.once("connect", joinRooms);
    }

    return () => {
      socket.off("connect", joinRooms);
      cleanupRooms();
    };
  }, [sensorIds, sharedCtx]);

  useEffect(() => {
    if (sharedCtx) return;
    const socket = socketRef.current;
    if (!socket) return;

    const handleUpdate = (payload: SensorRealtimePayload) => {
      console.log("[WS-RAW]", JSON.parse(JSON.stringify(payload)));
      onSensorUpdateRef.current?.(payload);
    };

    socket.on("sensor:update", handleUpdate);
    return () => {
      socket.off("sensor:update", handleUpdate);
    };
  }, [sharedCtx]);

  if (sharedCtx) {
    return { isConnected: sharedCtx.isConnected, socketError: null };
  }

  return {
    isConnected,
    socketError,
  };
};

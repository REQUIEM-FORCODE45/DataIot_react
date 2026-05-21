/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import type { Options } from "uplot";
import uPlot from "uplot";
import { apiEntidades } from "@/api/Sedes";
import { usePermissions } from "@/hooks/usePermissions";
import type { Entidad, Modulo } from "@/types/entidad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Cpu, LineChart, RefreshCw, SignalHigh, Wifi, WifiOff } from "lucide-react";
import "uplot/dist/uPlot.min.css";

type SensorOption = {
  id: string;
  label: string;
  areaName: string;
  sedeName?: string;
  module: Modulo;
};

type SensorGroup = {
  groupId: string;
  areaName: string;
  sedeName?: string;
  sensors: SensorOption[];
};

type SensorUpdatePayload = {
  id_sensor: string;
  type_sensor?: string;
  payload?: unknown;
  timestamp?: string;
};

const VALUE_KEY_LABELS: Record<string, string> = {
  value1: "CO2",
  value2: "Temperatura",
  value3: "Temp-CO2",
  value4: "Humedad",
  temp: "Temperatura",
  payload: "Valor",
};

const formatTimestampParts = (value?: string) => {
  if (!value) {
    return { date: "—", time: "", formatted: "Sin registro" };
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return { date: value, time: "", formatted: value };
  }

  const formatterDate = new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formatterTime = new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const date = formatterDate.format(new Date(parsed));
  const time = formatterTime.format(new Date(parsed));
  const formatted = `${date} ${time}`;
  return { date, time, formatted };
};

  const LABEL_FOR_METRIC = (valueKey: string) => VALUE_KEY_LABELS[valueKey] ?? valueKey;

  const formatTickTime = (value: number | null | undefined) => {
    if (!value || Number.isNaN(value)) return "";
    return new Intl.DateTimeFormat("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  };

const getModuleId = (module: Modulo, groupId: string, idx: number): string =>
  module.id_modulo ?? module._id ?? module.modulo ?? `${groupId}-${idx}`;

const MAX_POINTS = 120;
const DEFAULT_METRIC = "payload";

const normalizePayload = (payload: unknown): [string, number][] => {
  if (payload == null) return [];

  if (typeof payload === "number" && !Number.isNaN(payload)) {
    return [[DEFAULT_METRIC, payload]];
  }

  if (typeof payload === "string") {
    const numeric = Number(payload);
    if (!Number.isNaN(numeric)) {
      return [[DEFAULT_METRIC, numeric]];
    }
    return [];
  }

  if (typeof payload === "object") {
    return Object.entries(payload as Record<string, unknown>)
      .map(([key, value]) => {
        if (typeof value === "number" && !Number.isNaN(value)) {
          return [key, value] as [string, number];
        }
        if (typeof value === "string") {
          const numeric = Number(value);
          if (!Number.isNaN(numeric)) {
            return [key, numeric] as [string, number];
          }
        }
        return null;
      })
      .filter(Boolean) as [string, number][];
  }

  return [];
};

export const EntityChartsLive = () => {
  const { filterEntitiesByAccess, user } = usePermissions();
  const filterEntitiesRef = useRef(filterEntitiesByAccess);
  useEffect(() => {
    filterEntitiesRef.current = filterEntitiesByAccess;
  }, [filterEntitiesByAccess]);
  const [entities, setEntities] = useState<Entidad[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [availableMetrics, setAvailableMetrics] = useState<string[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [lastPayload, setLastPayload] = useState<unknown>(null);
  const [lastType, setLastType] = useState<string | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [joinedGlobal, setJoinedGlobal] = useState(false);
  const [openAreas, setOpenAreas] = useState<Set<string>>(new Set());
  const toggleArea = useCallback((groupId: string) => {
    setOpenAreas((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);
  const [activeValue, setActiveValue] = useState<number | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const plotRef = useRef<uPlot | null>(null);
  const metricStoreRef = useRef<Record<string, { times: number[]; values: number[] }>>({});
  const selectedMetricRef = useRef<string | null>(null);
  const prettyPayload = useMemo(() => {
    if (lastPayload == null) return "—";
    if (typeof lastPayload === "string") return lastPayload;
    try {
      return JSON.stringify(lastPayload, null, 2);
    } catch {
      return String(lastPayload);
    }
  }, [lastPayload]);

  const entityOptions = useMemo(() => entities ?? [], [entities]);
  const selectedEntity = useMemo(() => entities.find((ent) => ent._id === selectedEntityId) ?? null, [entities, selectedEntityId]);

  const sensorsByArea = useMemo<SensorGroup[]>(() => {
    if (!selectedEntity) return [];
    const grouped: SensorGroup[] = [];
    selectedEntity.sedes?.forEach((sede) => {
      sede.areas?.forEach((area) => {
        const sensors = area.modulos.map((module, idx) => ({
          id: getModuleId(module, `${sede._id ?? sede.name}-${area._id ?? area.name}`, idx),
          label: module.modulo ?? module.id_modulo ?? "Sensor",
          areaName: area.name,
          sedeName: sede.name,
          module,
        }));
        grouped.push({
          groupId: `${sede._id ?? sede.name}-${area._id ?? area.name}`,
          areaName: area.name,
          sedeName: sede.name,
          sensors,
        });
      });
    });
    return grouped;
  }, [selectedEntity]);

  const allSensors = useMemo(() => sensorsByArea.flatMap((group) => group.sensors), [sensorsByArea]);
  const sensorMap = useMemo(() => {
    const map = new Map<string, SensorOption>();
    allSensors.forEach((sensor) => map.set(sensor.id, sensor));
    return map;
  }, [allSensors]);

  const selectedSensor = selectedSensorId ? sensorMap.get(selectedSensorId) ?? null : null;
  const totalAreas = sensorsByArea.length;
  const totalSensors = allSensors.length;
  const lastTimestampParts = useMemo(() => formatTimestampParts(lastUpdate ?? undefined), [lastUpdate]);

  const accessKey = `${user?.entidad_id ?? ""}-${user?.rol ?? ""}`;
  useEffect(() => {
    let active = true;
    setLoadingEntities(true);
    apiEntidades
      .getAll()
      .then((data) => {
        if (!active) return;
        const filtered = filterEntitiesRef.current(data);
        setEntities(filtered);
        if (filtered.length > 0) {
          setSelectedEntityId((prev) => prev || filtered[0]._id);
        }
      })
      .finally(() => {
        if (!active) return;
        setLoadingEntities(false);
      });
    return () => {
      active = false;
    };
  }, [accessKey]);

  useEffect(() => {
    setSelectedSensorId(null);
    setAvailableMetrics([]);
    setSelectedMetric(null);
    metricStoreRef.current = {};
    setLastUpdate(null);
    setLastPayload(null);
    setLastType(undefined);
  }, [selectedEntityId]);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_BASE_URL || "";
    const socket = socketUrl ? io(socketUrl, { transports: ["websocket"], withCredentials: true }) : io({ transports: ["websocket"], withCredentials: true });
    socketRef.current = socket;

    const handleConnect = () => {
      setIsConnected(true);
      setSocketError(null);
    };
    const handleDisconnect = () => {
      setIsConnected(false);
    };
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
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const joinRoom = () => {
      if (selectedSensorId) {
        socket.emit("joinSensor", selectedSensorId);
      }
    };

    const leaveRoom = () => {
      if (selectedSensorId) {
        socket.emit("leaveSensor", selectedSensorId);
      }
    };

    if (selectedSensorId && socket.connected) {
      joinRoom();
    } else if (selectedSensorId) {
      socket.once("connect", joinRoom);
    }

    return () => {
      leaveRoom();
    };
  }, [selectedSensorId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const joinGlobal = () => {
      socket.emit("joinSensorsAll");
    };
    const leaveGlobal = () => {
      socket.emit("leaveSensorsAll");
    };

    if (joinedGlobal) {
      if (socket.connected) {
        joinGlobal();
      } else {
        socket.once("connect", joinGlobal);
      }
    }

    return () => {
      if (joinedGlobal) {
        leaveGlobal();
      }
    };
  }, [joinedGlobal]);

  useEffect(() => {
    selectedMetricRef.current = selectedMetric;
  }, [selectedMetric]);

  useEffect(() => {
    if (!selectedMetric) {
      setActiveValue(null);
      return;
    }
    const entry = metricStoreRef.current[selectedMetric];
    const latest = entry?.values[entry.values.length - 1] ?? null;
    setActiveValue(latest);
  }, [selectedMetric]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleSensorUpdate = (payload: SensorUpdatePayload) => {
      if (!selectedSensorId || payload.id_sensor !== selectedSensorId) return;

      const timestamp = payload.timestamp ? Date.parse(payload.timestamp) : Date.now();
      if (Number.isNaN(timestamp)) return;

      const metrics = normalizePayload(payload.payload);
      if (metrics.length === 0) return;

      setLastUpdate(payload.timestamp ?? new Date(timestamp).toISOString());
      setLastPayload(payload.payload ?? null);
      setLastType(payload.type_sensor);

      setAvailableMetrics((prev) => {
        const next = [...prev];
        metrics.forEach(([key]) => {
          if (!next.includes(key)) next.push(key);
        });
        return next;
      });

      setSelectedMetric((prev) => prev ?? metrics[0]![0]);

      metrics.forEach(([key, value]) => {
        const store = metricStoreRef.current;
        if (!store[key]) {
          store[key] = { times: [], values: [] };
        }
        const entry = store[key];
        entry.times.push(timestamp);
        entry.values.push(value);
        if (entry.times.length > MAX_POINTS) {
          entry.times.shift();
          entry.values.shift();
        }
      });

      const activeKey = selectedMetricRef.current ?? metrics[0]?.[0];
      const activeData = activeKey ? metricStoreRef.current[activeKey] : undefined;
      if (activeKey) {
        const latestValue = activeData?.values[activeData.values.length - 1] ?? null;
        setActiveValue(latestValue);
      } else {
        setActiveValue(null);
      }
      if (activeData && activeData.times.length > 0) {
        plotRef.current?.setData([activeData.times, activeData.values]);
      }
    };

    socket.on("sensor:update", handleSensorUpdate);
    return () => {
      socket.off("sensor:update", handleSensorUpdate);
    };
  }, [selectedSensorId]);

  useEffect(() => {
    const container = chartRef.current;
    if (!container) return;

    const metricLabel = selectedMetric ? LABEL_FOR_METRIC(selectedMetric) : "Valor";
    const options: Options = {
      width: container.clientWidth || 640,
      height: 320,
      scales: {
        x: { time: true },
        y: { 
          auto: true,
          // Añade un 10% de margen arriba y abajo para que la línea no toque los bordes (estilo Plotly)
          range: (_u, min, max) => {
            const padding = (max - min) * 0.1;
            return [min - padding, max + padding];
          }
        },
      },
      series: [
        { label: "Tiempo" },
        {
          label: metricLabel,
          stroke: "#0f766e",
          width: 2,
          fill: "rgba(15, 118, 110, 0.15)",
          spanGaps: true,
        },
      ],
      axes: [
        {
          stroke: "#64748b", // Color del texto un poco más oscuro
          font: "12px sans-serif",
          grid: { stroke: "#f1f5f9", width: 1 }, // Grid más sutil
          size: 40,  // Altura del eje X para que respiren las etiquetas
          space: 80, // 👈 LA SOLUCIÓN AL SOLAPAMIENTO: Mínimo 80px entre cada hora
          label: "Hora",
          labelFont: "bold 12px sans-serif",
          labelSize: 20,
          values: (_u, vals) => {
            return vals.map((value) => formatTickTime(value));
          },
        },
        {
          stroke: "#64748b",
          font: "12px sans-serif",
          grid: { stroke: "#f1f5f9", width: 1 },
          size: 50, // Ancho del eje Y
          label: "Valor",
          labelFont: "bold 12px sans-serif",
          labelSize: 20,
        },
      ],
      cursor: { 
        x: true, 
        y: true, // Crosshair en cruz como Plotly
        points: {
          // Estilo del punto que aparece al hacer hover sobre la línea
          size: 8,
          fill: "#ffffff",
          stroke: "#0f766e",
          width: 2,
        }
      },
      focus: { alpha: 0.3 },
      legend: { show: false },
      padding: [16, 24, 16, 16], // [top, right, bottom, left] - Mejores márgenes
    };

    plotRef.current?.destroy();
    plotRef.current = new uPlot(options, [[], []], container);

    const activeData = selectedMetric ? metricStoreRef.current[selectedMetric] : undefined;
    if (activeData && activeData.times.length > 0) {
      plotRef.current.setData([activeData.times, activeData.values]);
    }

    const handleResize = () => {
      if (!plotRef.current || !container) return;
      plotRef.current.setSize({ width: container.clientWidth, height: 320 });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      plotRef.current?.destroy();
      plotRef.current = null;
    };
  }, [selectedMetric]);

  const clearChart = () => {
    metricStoreRef.current = {};
    setAvailableMetrics([]);
    setSelectedMetric(null);
    plotRef.current?.setData([[], []]);
    setLastUpdate(null);
    setLastPayload(null);
    setLastType(undefined);
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-2 min-w-0 space-y-6">
      <div className="flex items-center gap-3">
        <LineChart size={22} className="text-[#0f766e]" />
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Gráficas</p>
          <h1 className="text-xl font-semibold text-[#0f172a]">Sensores en vivo</h1>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-3 border border-black/10 bg-gradient-to-br from-[#ecfeff] to-white shadow-sm">
          <Building2 size={24} className="text-[#0f766e]" />
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#64748b]">Entidades</p>
            <p className="text-2xl font-semibold text-[#0f766e]">{entityOptions.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 border border-black/10 bg-gradient-to-br from-white to-[#f0fdfa] shadow-sm">
          <Cpu size={24} className="text-[#0f766e]" />
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#64748b]">Áreas</p>
            <p className="text-2xl font-semibold text-[#0f766e]">{totalAreas}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 border border-black/10 bg-gradient-to-br from-[#f0fdfa] to-white shadow-sm">
          <SignalHigh size={24} className="text-[#0f766e]" />
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#64748b]">Sensores</p>
            <p className="text-2xl font-semibold text-[#0f766e]">{totalSensors}</p>
          </div>
        </Card>
      </div>

      <Card className="rounded-[14px] border border-black/10">
        <CardHeader className="space-y-3">
          <CardTitle className="text-base text-[#0f172a]">Filtros de transmisión</CardTitle>
          <form className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1 text-[11px] uppercase tracking-[0.3em] text-[#64748b]">
              Entidad
              <select
                value={selectedEntityId}
                onChange={(event) => setSelectedEntityId(event.target.value)}
                className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm"
              >
                {loadingEntities && <option>Cargando...</option>}
                {!loadingEntities && entityOptions.length === 0 && <option>Sin datos</option>}
                {!loadingEntities &&
                  entityOptions.map((entity) => (
                    <option key={entity._id} value={entity._id}>
                      {entity.name}
                    </option>
                  ))}
              </select>
            </label>
            <div className="space-y-1 text-[11px] uppercase tracking-[0.3em] text-[#64748b]">
              <p className="text-xs font-semibold">Sala global</p>
              <Button
                variant={joinedGlobal ? "outline" : "ghost"}
                size="sm"
                onClick={() => setJoinedGlobal((prev) => !prev)}
                className="gap-2 border-[#0f766e] text-[#0f766e]"
              >
                {joinedGlobal ? "Desconectar" : "Conectar"}
                <Wifi className="text-[#0f766e]" size={16} />
              </Button>
            </div>
            <div className="space-y-1 text-[11px] uppercase tracking-[0.3em] text-[#64748b]">
              <p className="text-xs font-semibold">Estado socket</p>
              <div className="flex items-center gap-2 text-sm">
                {isConnected ? (
                  <SignalHigh className="text-[#0f766e]" size={16} />
                ) : (
                  <WifiOff className="text-red-500" size={16} />
                )}
                <span>{isConnected ? "Conectado" : "Desconectado"}</span>
              </div>
              {socketError && <p className="text-xs text-red-500">{socketError}</p>}
            </div>
          </form>
        </CardHeader>
      </Card>

      {loadingEntities ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="h-32 animate-pulse" />
          ))}
        </div>
      ) : sensorsByArea.length === 0 ? (
        <Card className="rounded-[14px] border border-dashed border-black/10 p-8 text-center text-[#64748b]">
          No hay sensores disponibles en esta entidad.
        </Card>
      ) : (
        <div className="space-y-4">
          {sensorsByArea.map((group) => {
            const isOpen = openAreas.has(group.groupId);
            return (
              <Card key={group.groupId} className="rounded-[14px] border border-black/10 bg-white">
                <CardHeader
                  className={`flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors ${
                    isOpen ? "bg-[#f8fafc]" : "bg-white"
                  } hover:bg-[#f8fafc]`}
                  onClick={() => toggleArea(group.groupId)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                >
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-[#64748b]">Área</p>
                    <h3 className="text-base font-semibold text-[#0f172a]">{group.areaName}</h3>
                    {group.sedeName && <p className="text-xs text-[#94a3b8]">Sede: {group.sedeName}</p>}
                  </div>
                </CardHeader>
                {isOpen && (
                  <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 pt-0">
                    {group.sensors.map((sensor) => (
                      <label
                        key={sensor.id}
                        className={`flex flex-col gap-1 rounded-[10px] border px-3 py-2 text-sm transition ${
                          selectedSensorId === sensor.id
                            ? "border-[#0f766e]/70 bg-[#0f766e]/10"
                            : "border-black/10 bg-[#f8fafc] hover:border-[#0f766e]/50"
                        }`}
                      >
                        <span className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Sensor</span>
                        <strong className="text-sm text-[#0f172a]">{sensor.id}</strong>
                        <span className="text-[11px] text-[#475569]">{sensor.label}</span>
                        <input
                          type="radio"
                          name="live-sensor"
                          checked={selectedSensorId === sensor.id}
                          onChange={() => setSelectedSensorId(sensor.id)}
                          className="mt-auto h-4 w-4 accent-[#0f766e]"
                        />
                      </label>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Card className="rounded-[14px] border border-black/10">
        <CardHeader className="flex flex-wrap items-center gap-4">
          <div>
            <CardTitle className="text-base text-[#0f172a]">Panel en vivo</CardTitle>
            <p className="text-xs text-[#64748b]">
              {selectedSensor ? `${selectedSensor.id} • ${selectedSensor.label}` : "Selecciona un sensor"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-[#64748b]">Último valor:</span>
            <strong className="text-sm text-[#0f766e]">{activeValue?.toFixed?.(2) ?? "—"}</strong>
            <Button size="sm" variant="outline" onClick={clearChart} className="text-xs gap-2">
              <RefreshCw size={14} />
              Limpiar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedMetric ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748b]">
              {availableMetrics.map((metric) => (
                <Button
                  key={metric}
                  size="sm"
                  variant={selectedMetric === metric ? "default" : "outline"}
                  onClick={() => setSelectedMetric(metric)}
                  className="gap-1 text-[#0f766e]"
                >
                  {LABEL_FOR_METRIC(metric)}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#64748b]">No hay métricas detectadas aún.</p>
          )}
          <div className="relative">
            <div ref={chartRef} className="min-h-[320px] rounded-[16px] border border-dashed border-black/10 bg-white" />
            {!selectedMetric && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-[#94a3b8]">Esperando datos en vivo</p>
              </div>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border border-black/10 bg-[#f8fafc] p-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#64748b]">Última actualización</p>
              <p className="text-sm font-semibold text-[#0f172a]">{lastTimestampParts.date}</p>
              <p className="text-xs text-[#64748b]">{lastTimestampParts.time}</p>
            </Card>
            <Card className="border border-black/10 bg-[#f8fafc] p-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#64748b]">Tipo detectado</p>
              <p className="text-sm text-[#0f172a]">{lastType ?? "—"}</p>
            </Card>
            <Card className="border border-black/10 bg-[#f8fafc] p-3">
              <p className="text-[11px] uppercase tracking-[0.3em] text-[#64748b]">Paquete</p>
              <pre className="mt-1 text-[11px] leading-relaxed text-[#0f172a] whitespace-pre-wrap break-words max-h-24 overflow-y-auto">{prettyPayload}</pre>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

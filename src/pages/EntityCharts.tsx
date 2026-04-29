import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiCommands } from "@/api/Commands";
import { apiEntidades } from "@/api/Sedes";
import type { Entidad, Modulo } from "@/types/entidad";
import type { SensorHistoryRecord } from "@/types/sensor";
import { usePermissions } from "@/hooks/usePermissions";
import { Building2, Cpu, Layers, LineChart, RefreshCw, ChevronDown, Download } from "lucide-react";

const PlotlyChart = lazy(() => import("@/components/PlotlyChart"));

type SensorOption = {
  id: string;
  label: string;
  areaName?: string;
  sedeName?: string;
  module: Modulo;
};

type SensorGroup = {
  groupId: string;
  areaName: string;
  sedeName?: string;
  sensors: SensorOption[];
};

type ChartItem = {
  id: string;
  sensorId: string;
  sensorLabel: string;
  valueKey: string;
  initDate: string;
  endDate: string;
  records: SensorHistoryRecord[];
};

const COMMON_VALUE_KEYS = ["value1", "value2", "value3", "value4", "temp"] as const;

const VALUE_KEY_LABELS: Record<string, string> = {
  value1: "CO2",
  value2: "Temperatura",
  value3: "Temp-CO2",
  value4: "Humedad",
  temp: "Temperatura",
};

const getValueLabel = (valueKey: string): string => VALUE_KEY_LABELS[valueKey] ?? valueKey;

const detectAvailableValueKeys = (records: SensorHistoryRecord[]): string[] => {
  const valueKeysSet = new Set<string>();
  
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (key === "createAt" || key === "createdAt") continue;
      const value = record[key];
      if (typeof value === "number" || (!isNaN(Number(value)) && value !== null && value !== "")) {
        valueKeysSet.add(key);
      }
    }
  }
  
  return Array.from(valueKeysSet).sort((a, b) => {
    const aIdx = COMMON_VALUE_KEYS.indexOf(a as typeof COMMON_VALUE_KEYS[number]);
    const bIdx = COMMON_VALUE_KEYS.indexOf(b as typeof COMMON_VALUE_KEYS[number]);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.localeCompare(b);
  });
};

const getModuleId = (module: Modulo, groupId: string, idx: number): string =>
  module.id_modulo ?? module._id ?? module.modulo ?? `${groupId}-${idx}`;

const toLocalInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toApiDate = (localValue: string) => {
  if (!localValue) return "";
  const [datePart, timePart] = localValue.split("T");
  if (!datePart || !timePart) return localValue;
  return `${datePart} ${timePart}:00`;
};

const formatTimestamp = (value?: string) => {
  if (!value) return "Sin registro";
  const parts = value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  return parts ? value.replace("T", " ") : value;
};

const PLOTLY_LAYOUT = {
  margin: { l: 40, r: 12, t: 8, b: 36 },
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  xaxis: {
    showgrid: false,
    tickfont: { size: 9, color: "#64748b" },
    linecolor: "#e2e8f0",
  },
  yaxis: {
    showgrid: true,
    gridcolor: "#f1f5f9",
    tickfont: { size: 9, color: "#64748b" },
    linecolor: "#e2e8f0",
  },
};

const PLOTLY_CONFIG = { displayModeBar: false, responsive: true };

const generateCSV = (
  records: SensorHistoryRecord[],
  valueKeys: string[]
): string => {
  const headers = ["fecha", ...valueKeys.map(getValueLabel)];
  const rows = records.map((record) => {
    const fecha = record.createAt ?? record.createdAt ?? "";
    const values = valueKeys.map((key) => {
      const val = record[key as keyof SensorHistoryRecord];
      return typeof val === "number" ? val : "";
    });
    return [fecha, ...values].join(",");
  });
  return [headers.join(","), ...rows].join("\n");
};

const downloadCSV = (csv: string, filename: string): void => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const ChartSkeleton = () => (
  <div className="w-full h-[240px] rounded-lg animate-pulse bg-[#f1f5f9]" />
);

const SensorValueChart = ({
  sensorId,
  sensorLabel,
  valueKey,
  initDate,
  endDate,
  records,
  onRemove,
  onDownload,
}: ChartItem & { onRemove: () => void; onDownload: () => void }) => {
  const points = useMemo<{ x: string; y: number }[]>(() => {
    return records
      .map((record) => ({
        x: record.createAt ?? record.createdAt,
        y: record[valueKey as keyof SensorHistoryRecord],
      }))
      .filter((point): point is { x: string; y: number } =>
        typeof point.y === "number" && typeof point.x === "string"
      );
  }, [records, valueKey]);

  const chartTrace = useMemo(() => {
    if (points.length < 2) return null;
    return {
      type: "scatter" as const,
      mode: "lines" as const,
      line: { color: "#00554f", width: 2 },
      fill: "tozeroy" as const,
      fillcolor: "rgba(0, 85, 79, 0.08)",
      x: points.map((p) => p.x),
      y: points.map((p) => p.y as number),
    };
  }, [points]);

  const lastPoint = points[points.length - 1];

  return (
    <Card className="min-h-[280px] border border-border bg-card/90 shadow-sm transition hover:shadow-md">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Sensor</p>
            <CardTitle className="text-lg leading-tight">{sensorId}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border/70 px-2 py-1 text-[11px] font-semibold text-muted-foreground">
              {getValueLabel(valueKey)}
            </span>
            <Button size="sm" variant="ghost" onClick={onDownload} className="text-[#003d3a] hover:bg-[#003d3a]/10">
              <Download size={14} />
            </Button>
            <Button size="sm" variant="ghost" onClick={onRemove} className="text-[#003d3a] hover:bg-[#003d3a]/10">
              Eliminar
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{sensorLabel}</p>
        <p className="text-[11px] text-muted-foreground">
          {initDate} → {endDate}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {chartTrace ? (
          <Suspense fallback={<ChartSkeleton />}>
            <PlotlyChart
              data={[chartTrace]}
              layout={PLOTLY_LAYOUT}
              config={PLOTLY_CONFIG}
              style={{ width: "100%", height: "240px" }}
            />
          </Suspense>
        ) : (
          <p className="text-sm text-muted-foreground">
            {points.length === 0 ? "Sin lecturas" : "Sin suficientes lecturas"}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {lastPoint?.x ? `Última lectura: ${formatTimestamp(String(lastPoint.x))}` : "Sin fecha de lectura"}
        </p>
      </CardContent>
    </Card>
  );
};

export const EntityCharts = () => {
  const [entities, setEntities] = useState<Entidad[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());
  const [chartItems, setChartItems] = useState<ChartItem[]>([]);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [detectedValueKeys, setDetectedValueKeys] = useState<string[]>([]);
  const [detectingValues, setDetectingValues] = useState(false);
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);
  const { filterEntitiesByAccess } = usePermissions();

  const now = useMemo(() => new Date(), []);
  const [initDate, setInitDate] = useState(() => {
    const start = new Date(now);
    start.setHours(start.getHours() - 24);
    return toLocalInputValue(start);
  });
  const [endDate, setEndDate] = useState(() => toLocalInputValue(now));

  const selectedEntity = useMemo(
    () => entities.find((entity) => entity._id === selectedEntityId) ?? null,
    [entities, selectedEntityId]
  );

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

  const allSensors = useMemo(
    () => sensorsByArea.flatMap((group) => group.sensors),
    [sensorsByArea]
  );

  const sensorMap = useMemo(() => {
    const map = new Map<string, SensorOption>();
    allSensors.forEach((sensor) => map.set(sensor.id, sensor));
    return map;
  }, [allSensors]);

  useEffect(() => {
    const fetchEntities = async () => {
      setLoadingEntities(true);
      try {
        const data = await apiEntidades.getAll();
        const filtered = filterEntitiesByAccess(data);
        setEntities(filtered);
        if (filtered.length > 0 && !selectedEntityId) {
          setSelectedEntityId(filtered[0]._id);
        }
      } finally {
        setLoadingEntities(false);
      }
    };

    fetchEntities();
  }, [selectedEntityId]);

  useEffect(() => {
    setSelectedSensorId(null);
    setSelectedValues(new Set());
    setDetectedValueKeys([]);
  }, [selectedEntityId]);

  useEffect(() => {
    setOpenGroups(new Set());
  }, [sensorsByArea]);

  const selectSensor = useCallback((sensorId: string) => {
    setSelectedSensorId((prev) => (prev === sensorId ? null : sensorId));
  }, []);

  const toggleValue = useCallback((valueKey: string) => {
    setSelectedValues((prev) => {
      const next = new Set(prev);
      if (next.has(valueKey)) {
        next.delete(valueKey);
      } else {
        next.add(valueKey);
      }
      return next;
    });
  }, []);

  const invertSelection = useCallback(() => {
    const allKeys = detectedValueKeys.length > 0 ? detectedValueKeys : Array.from(COMMON_VALUE_KEYS);
    setSelectedValues((prev) => {
      const next = new Set<string>();
      allKeys.forEach((key) => {
        if (!prev.has(key)) {
          next.add(key);
        }
      });
      return next;
    });
  }, [detectedValueKeys]);

  const toggleGroup = useCallback((groupId: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const detectAndSetValues = useCallback(async (sensorId: string) => {
    if (!sensorId) {
      return;
    }
    setDetectingValues(true);
    setHistoryError(null);
    try {
      const response = await apiCommands.getSensorHistory(sensorId, 0);
      const records = response.data?.data ?? [];
      const availableKeys = detectAvailableValueKeys(records);
      
      if (availableKeys.length === 0) {
        setHistoryError("No se encontraron variables con datos.");
      } else {
        setDetectedValueKeys(availableKeys);
        setSelectedValues(new Set(availableKeys));
      }
    } catch {
      setHistoryError("No fue posible detectar las variables.");
    } finally {
      setDetectingValues(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSensorId) {
      detectAndSetValues(selectedSensorId);
    } else {
      setDetectedValueKeys([]);
      setSelectedValues(new Set());
    }
  }, [selectedSensorId, detectAndSetValues]);

  const addCharts = useCallback(async () => {
    if (!selectedSensorId || selectedValues.size === 0 || !initDate || !endDate) {
      setHistoryError("Selecciona sensor y variables.");
      return;
    }
    setLoadingHistory(true);
    setHistoryError(null);
    setPollingStatus("Creando job...");
    try {
      const sensorId = selectedSensorId;
      const sensor = sensorMap.get(sensorId);
      if (!sensor) {
        setLoadingHistory(false);
        return;
      }
      
      const apiInit = toApiDate(initDate);
      const apiEnd = toApiDate(endDate);
      
      const jobResponse = await apiCommands.getSensorsRangeAsync([sensorId], apiInit, apiEnd);
      const jobId = jobResponse.data?.jobId;
      
      if (!jobId) {
        setHistoryError("No se pudo iniciar el procesamiento.");
        setLoadingHistory(false);
        setPollingStatus(null);
        return;
      }
      
      setPollingStatus("Procesando...");
      const startTime = Date.now();
      const TIMEOUT = 2 * 60 * 1000;
      const INTERVAL = 2000;
      
      let result: Record<string, { data: SensorHistoryRecord[] }> | undefined;
      
      while (true) {
        await new Promise((resolve) => setTimeout(resolve, INTERVAL));
        
        const statusResponse = await apiCommands.getJobStatus(jobId);
        const status = statusResponse.data?.status;
        
        if (status === "completed") {
          result = statusResponse.data?.result;
          break;
        }
        
        if (status === "failed") {
          setHistoryError(statusResponse.data?.error ?? "Error en el procesamiento.");
          setLoadingHistory(false);
          setPollingStatus(null);
          return;
        }
        
        if (Date.now() - startTime > TIMEOUT) {
          setHistoryError("Tiempo de espera agotado. Intenta con un rango menor.");
          setLoadingHistory(false);
          setPollingStatus(null);
          return;
        }
        
        setPollingStatus(`Procesando... ${Math.round((Date.now() - startTime) / 1000)}s`);
      }
      
      const additions: ChartItem[] = [];
      const records = result?.[sensorId]?.data ?? [];
      
      selectedValues.forEach((valueKey) => {
        const validRecords = records.filter((r: SensorHistoryRecord) => {
          const val = r[valueKey as keyof SensorHistoryRecord];
          return typeof val === "number" && !isNaN(val);
        });
        if (validRecords.length > 0) {
          additions.push({
            id: `${sensorId}-${valueKey}-${apiInit}-${apiEnd}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            sensorId,
            sensorLabel: sensor.label,
            valueKey,
            initDate: apiInit,
            endDate: apiEnd,
            records: validRecords,
          });
        }
      });
      
      if (additions.length === 0) {
        setHistoryError("No se encontraron datos para las variables seleccionadas.");
      } else {
        setChartItems((prev) => [...prev, ...additions]);
      }
    } catch {
      setHistoryError("No fue posible cargar el histórico.");
    } finally {
      setLoadingHistory(false);
      setPollingStatus(null);
    }
  }, [selectedSensorId, selectedValues, initDate, endDate, sensorMap]);

  const removeChart = useCallback((id: string) => {
    setChartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const downloadSingleCSV = useCallback((item: ChartItem) => {
    const csv = generateCSV(item.records, [item.valueKey]);
    const filename = `${item.sensorId}_${item.valueKey}_${item.initDate.replace(/\s|T/g, "-")}_${item.endDate.replace(/\s|T/g, "-")}.csv`;
    downloadCSV(csv, filename);
  }, []);

  const downloadAllCSV = useCallback(() => {
    const valueKeys = [...new Set(chartItems.map((item) => item.valueKey))];
    const allRecords = chartItems.flatMap((item) => item.records);
    allRecords.sort((a, b) => {
      const dateA = a.createAt ?? a.createdAt ?? "";
      const dateB = b.createAt ?? b.createdAt ?? "";
      return dateA.localeCompare(dateB);
    });
    const uniqueRecords = allRecords.filter((record, idx, arr) => {
      const date = record.createAt ?? record.createdAt;
      return idx === 0 || (arr[idx - 1].createAt ?? arr[idx - 1].createdAt) !== date;
    });
    const csv = generateCSV(uniqueRecords, valueKeys);
    const filename = `historico_${selectedEntityId}_${initDate.replace(/\s|T/g, "-")}_${endDate.replace(/\s|T/g, "-")}.csv`;
    downloadCSV(csv, filename);
  }, [chartItems, selectedEntityId, initDate, endDate]);

  const totalSedes = selectedEntity?.sedes?.length ?? 0;
  const totalAreas = sensorsByArea.length;
  const totalSensors = allSensors.length;

  return (
    <div className="w-full max-w-[1400px] mx-auto px-2 min-w-0 space-y-6">
      <div className="flex items-center gap-3">
        <LineChart size={22} className="text-[#00554f]" />
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Gráficas</p>
          <h1 className="text-xl font-semibold text-[#1e293b]">Histórico por entidad</h1>
        </div>
      </div>

      <div className="rounded-[12px] border border-black/10 bg-[#e7ecf2] px-6 py-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-[12px] border border-black/10 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Sedes</p>
            <div className="flex items-center gap-2 text-2xl font-semibold text-[#00554f]">
              <Building2 size={20} />
              <span>{totalSedes}</span>
            </div>
          </article>
          <article className="rounded-[12px] border border-black/10 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Áreas</p>
            <div className="flex items-center gap-2 text-2xl font-semibold text-[#00554f]">
              <Layers size={20} />
              <span>{totalAreas}</span>
            </div>
          </article>
          <article className="rounded-[12px] border border-black/10 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Sensores</p>
            <div className="flex items-center gap-2 text-2xl font-semibold text-[#00554f]">
              <Cpu size={20} />
              <span>{totalSensors}</span>
            </div>
          </article>
        </div>
      </div>

      <Card className="rounded-[12px] border border-black/10">
        <CardHeader className="space-y-2">
          <CardTitle className="text-base text-[#1e293b]">Filtros</CardTitle>
          <p className="text-xs text-[#64748b]">Selecciona entidad, sensores y variables para comparar.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.3em] text-[#64748b]">Entidad</label>
              <select
                value={selectedEntityId}
                onChange={(event) => setSelectedEntityId(event.target.value)}
                className="w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm"
              >
                {loadingEntities && <option>Cargando...</option>}
                {!loadingEntities && entities.length === 0 && <option>Sin entidades</option>}
                {!loadingEntities &&
                  entities.map((entity) => (
                    <option key={entity._id} value={entity._id}>
                      {entity.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.3em] text-[#64748b]">Inicio</label>
              <Input
                type="datetime-local"
                value={initDate}
                onChange={(event) => setInitDate(event.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.3em] text-[#64748b]">Fin</label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] uppercase tracking-[0.3em] text-[#64748b]">Variables</span>
            {detectedValueKeys.length > 0 ? (
              detectedValueKeys.map((valueKey) => (
                <label key={valueKey} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedValues.has(valueKey)}
                    onChange={() => toggleValue(valueKey)}
                    className="h-4 w-4 accent-[#00554f]"
                  />
                  <span className="font-medium">{getValueLabel(valueKey)}</span>
                </label>
              ))
            ) : (
              <>
                {Array.from(COMMON_VALUE_KEYS).map((valueKey) => (
                  <label key={valueKey} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedValues.has(valueKey)}
                      onChange={() => toggleValue(valueKey)}
                      className="h-4 w-4 accent-[#00554f]"
                    />
<span className="font-medium">{getValueLabel(valueKey)}</span>
                  </label>
                ))}
              </>
            )}
            <Button type="button" variant="outline" size="sm" onClick={invertSelection} className="h-7 text-xs border-[#003d3a] text-[#003d3a] hover:bg-[#003d3a] hover:text-white">
              Alternar
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {detectingValues && (
              <span className="text-xs text-[#64748b]">Detectando variables...</span>
            )}
            {pollingStatus && (
              <span className="text-xs text-[#00554f] animate-pulse">{pollingStatus}</span>
            )}
            <Button type="button" onClick={addCharts} disabled={!selectedSensorId || selectedValues.size === 0 || !!pollingStatus} className="bg-[#003d3a] hover:bg-[#002f2d] text-white gap-2">
              <RefreshCw size={16} />
              Agregar gráfica
            </Button>
            {loadingHistory && <span className="text-xs text-[#64748b]">Cargando histórico...</span>}
            {historyError && <span className="text-xs text-red-500">{historyError}</span>}
          </div>
        </CardContent>
      </Card>

      {loadingEntities ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-[12px]" />
          ))}
        </div>
      ) : sensorsByArea.length === 0 ? (
        <Card className="rounded-[12px] border border-dashed border-black/10 p-8 text-center text-[#64748b]">
          No hay sensores registrados para esta entidad.
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            {sensorsByArea.map((group) => (
              <section key={group.groupId} className="rounded-[12px] border border-black/10 bg-white p-4">
                <div 
                  className="flex items-center justify-between gap-4 cursor-pointer hover:bg-[#f8fafc] rounded-lg -mx-2 px-2 py-1 transition-colors"
                  onClick={() => toggleGroup(group.groupId)}
                  role="button"
                  tabIndex={0}
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Área</p>
                    <h3 className="text-base font-semibold text-[#1e293b] line-clamp-1" title={group.areaName}>
                      {group.areaName}
                    </h3>
                    {group.sedeName && (
                      <p className="text-[11px] text-[#94a3b8]">Sede: {group.sedeName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#64748b]">{group.sensors.length} sensores</span>
                    <ChevronDown
                      size={16}
                      className={openGroups.has(group.groupId) ? "rotate-180 transition-transform" : "transition-transform"}
                    />
                  </div>
                </div>
                {openGroups.has(group.groupId) && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {group.sensors.map((sensor) => (
                      <label
                        key={sensor.id}
                        className={`flex items-center gap-2 rounded-md border border-black/5 px-3 py-2 text-sm cursor-pointer transition ${
                          selectedSensorId === sensor.id 
                            ? "bg-[#00554f]/10 border-[#00554f]/30" 
                            : "bg-[#f8fafc] hover:bg-[#f1f5f9]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="sensor-select"
                          checked={selectedSensorId === sensor.id}
                          onChange={() => selectSensor(sensor.id)}
                          className="h-4 w-4 accent-[#00554f]"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[#0f172a]">{sensor.id}</p>
                          <p className="text-[11px] text-[#94a3b8] truncate">{sensor.label}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-[#1e293b]">Gráficas seleccionadas</h2>
              <div className="flex items-center gap-2">
                {chartItems.length > 0 && (
                  <Button size="sm" variant="outline" onClick={downloadAllCSV} className="h-7 text-xs border-[#003d3a] text-[#003d3a] hover:bg-[#003d3a] hover:text-white gap-1">
                    <Download size={14} />
                    CSV
                  </Button>
                )}
                <span className="text-xs text-[#64748b]">{chartItems.length} gráficas</span>
              </div>
            </div>
            {chartItems.length === 0 ? (
              <Card className="rounded-[12px] border border-dashed border-black/10 p-8 text-center text-[#64748b]">
                Selecciona sensores y variables para ver gráficas.
              </Card>
            ) : (
              <div className="grid gap-4">
                {chartItems.map((item) => (
                  <SensorValueChart
                    key={item.id}
                    {...item}
                    onRemove={() => removeChart(item.id)}
                    onDownload={() => downloadSingleCSV(item)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

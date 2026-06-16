import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiCommands } from "@/api/Commands";
import { apiEntidades } from "@/api/Sedes";
import { generatePDF, downloadPDF, ReportError } from "@/api/reports";
import type { Entidad, Modulo } from "@/types/entidad";
import type { SensorHistoryRecord } from "@/types/sensor";
import type { ReportDocument, PageConfig, ChartDataPoint } from "@/types/reports";
import { usePermissions } from "@/hooks/usePermissions";
import { FileText, Loader2, ChevronDown } from "lucide-react";

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

const formatDateShort = (value: string): string => {
  const [datePart, timePart] = value.split(" ");
  return `${datePart.split("-").reverse().join("/")}${timePart ? ` ${timePart.slice(0, 5)}` : ""}`;
};

const round2 = (n: number): number => Math.round(n * 100) / 100;

const computeStats = (values: number[]) => {
  if (values.length === 0) return { avg: 0, stddev: 0, max: 0, min: 0, count: 0 };
  const avg = round2(values.reduce((a, b) => a + b, 0) / values.length);
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  const stddev = round2(Math.sqrt(variance));
  const max = round2(Math.max(...values));
  const min = round2(Math.min(...values));
  return { avg, stddev, max, min, count: values.length };
};

const computeTimeDiff = (start: string, end: string): string => {
  const s = new Date(start.replace(" ", "T"));
  const e = new Date(end.replace(" ", "T"));
  const diffMs = e.getTime() - s.getTime();
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `${days} dias y ${hours} horas`;
  return `${hours} horas`;
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

const sensorLabel = (sensor: SensorOption): string => {
  return sensor.module.modulo ?? sensor.module.id_modulo ?? sensor.id;
};

const buildReportPage = (
  entityName: string,
  sensor: SensorOption,
  valueKey: string,
  records: SensorHistoryRecord[],
  chartData: ChartDataPoint[]
): PageConfig => {
  const stats = computeStats(chartData.map((p) => p.y));
  const sortedRecords = [...records].sort((a, b) => {
    const dateA = (a.createAt ?? a.createdAt ?? "").replace("T", " ");
    const dateB = (b.createAt ?? b.createdAt ?? "").replace("T", " ");
    return dateA.localeCompare(dateB);
  });
  const firstRecord = sortedRecords[0];
  const lastRecord = sortedRecords[sortedRecords.length - 1];
  const firstTs = (firstRecord?.createAt ?? firstRecord?.createdAt ?? "").replace("T", " ");
  const lastTs = (lastRecord?.createAt ?? lastRecord?.createdAt ?? "").replace("T", " ");
  const firstVal = firstRecord ? (firstRecord[valueKey as keyof SensorHistoryRecord] as number) : 0;
  const lastVal = lastRecord ? (lastRecord[valueKey as keyof SensorHistoryRecord] as number) : 0;
  const timeDiff = computeTimeDiff(firstTs, lastTs);
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

  const label = sensorLabel(sensor);
  const year = now.getFullYear();
  const displayName = getValueLabel(valueKey);

  const page: PageConfig = {
    width: "1200px",
    height: "1600px",
    margins: { top: "60px", right: "60px", bottom: "60px", left: "60px" },
    components: [
      {
        id: "header-section",
        type: "container",
        x: "60px",
        y: "60px",
        width: "1080px",
        height: "120px",
        style: {
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "3px solid #00554f",
          paddingBottom: "20px",
        },
        children: [
          {
            id: "header-institution",
            type: "container",
            x: "0",
            y: "0",
            width: "420px",
            height: "85px",
            style: { display: "flex", flexDirection: "column" },
            children: [
              {
                id: "institution-name",
                type: "title",
                x: "0",
                y: "0",
                width: "100%",
                height: "44px",
                style: { fontSize: "26px", fontWeight: "700", color: "#0f172a" },
                children: [entityName],
              },

            ],
          },
        {
            id: "header-meta-box", // Cambiamos de table a container manual
            type: "container",
            x: "560px", 
            y: "0",
            width: "520px", // Ancho fijo garantizado
            height: "110px",
            style: {
              backgroundColor: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
            },
            children: [
              // Fila 1
              { id: "m-1", type: "text", x: "20px", y: "16px", width: "240px", height: "20px", style: { fontSize: "11px", color: "#334155" }, children: [`VERSION: 01`] },
              { id: "m-2", type: "text", x: "260px", y: "16px", width: "240px", height: "20px", style: { fontSize: "11px", color: "#334155" }, children: [`CODIGO: ${sensor.id}`] },
              
              // Fila 2
              { id: "m-3", type: "text", x: "20px", y: "46px", width: "240px", height: "20px", style: { fontSize: "11px", color: "#334155" }, children: [`FECHA: ${dateStr}`] },
              { id: "m-4", type: "text", x: "260px", y: "46px", width: "240px", height: "20px", style: { fontSize: "11px", color: "#334155" }, children: [`DATO: ${displayName}`] },
              
              // Fila 3 (El sensor toma todo el ancho de abajo para que nunca se corte)
              { id: "m-5", type: "text", x: "20px", y: "80px", width: "480px", height: "20px", style: { fontSize: "11px", color: "#334155", fontWeight: "600" }, children: [`SENSOR: ${label}`] },
              { id: "sep-v", type: "text", x: "200px", y: "6px", width: "2px", height: "60px", style: { backgroundColor: "#e2e8f0" }, children: [""] },
              { id: "sep-h1", type: "text", x: "20px", y: "35px", width: "480px", height: "1px", style: { backgroundColor: "#e2e8f0" }, children: [""] },
              { id: "sep-h2", type: "text", x: "20px", y: "65px", width: "480px", height: "1px", style: { backgroundColor: "#e2e8f0" }, children: [""] },
            ],
          },
        ],
      },
      {
        id: "report-title-section",
        type: "container",
        x: "60px",
        y: "200px",
        width: "1080px",
        height: "70px",
        style: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          borderTop: "3px solid #00554f",
          borderBottom: "1px solid #e2e8f0",
          paddingTop: "14px",
          paddingBottom: "14px",
        },
        children: [
          {
            id: "main-title",
            type: "title",
            x: "0",
            y: "10",
            width: "100%",
            height: "42px",
            style: { fontSize: "19px", fontWeight: "700", color: "#00554f", letterSpacing: "0.5px" },
            children: [`REGISTRO CONTROL DE ${displayName.toUpperCase()} — ${entityName.toUpperCase()}`],
          },
        ],
      },
      {
        id: "chart-section",
        type: "chart",
        x: "60px",
        y: "300px",
        width: "1080px",
        height: "380px",
        style: {
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "20px",
        },
        position: { layout: "block" },
        chartType: "line",
        series: [
          {
            name: `${displayName}`,
            color: "#00554f",
            fill: "rgba(0, 85, 79, 0.08)",
            data: [...chartData].reverse(),
          },
        ],
        children: [],
      },
      {
        id: "summary-section",
        type: "container",
        x: "60px",
        y: "720px",
        width: "520px",
        height: "500px",
        style: { display: "flex", flexDirection: "column", backgroundColor: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0" },
        children: [
          {
            id: "summary-title",
            type: "subtitle",
            x: "0",
            y: "0",
            width: "100%",
            height: "40px",
            style: {
              fontSize: "15px",
              fontWeight: "700",
              color: "#0f172a",
              borderBottom: "2px solid #00554f",
              paddingBottom: "8px",
              paddingLeft: "16px",
              paddingRight: "16px",
              paddingTop: "16px",
            },
            children: [`RESUMEN ${displayName.toUpperCase()}`],
          },
          {
            id: "summary-table",
            type: "table",
            x: "0",
            y: "60px",
            width: "100%",
            height: "420px",
            style: { fontSize: "13px", color: "#334155" },
            columns: ["Metrica", "Valor", "Timestamp"],
            children: [
              { id: "s-r1", type: "text", x: "0", y: "0",   width: "100%", height: "50px", style: { borderBottom: "1px solid #f1f5f9", padding: "10px 12px" }, children: [`Diferencial:`, `${timeDiff}`, ""] },
              { id: "s-r2", type: "text", x: "0", y: "50px",  width: "100%", height: "50px", style: { borderBottom: "1px solid #f1f5f9", padding: "10px 12px" }, children: [`Promedio:`, `${stats.avg}`, ""] },
              { id: "s-r3", type: "text", x: "0", y: "100px", width: "100%", height: "50px", style: { borderBottom: "1px solid #f1f5f9", padding: "10px 12px" }, children: [`Desviacion Estandar:`, `${stats.stddev}`, ""] },
              { id: "s-r4", type: "text", x: "0", y: "150px", width: "100%", height: "50px", style: { borderBottom: "1px solid #f1f5f9", padding: "10px 12px", fontWeight: "600", color: "#dc2626" }, children: [`Maximo:`, `${stats.max}`, `${formatDateShort(lastTs)}`] },
              { id: "s-r5", type: "text", x: "0", y: "200px", width: "100%", height: "50px", style: { borderBottom: "1px solid #f1f5f9", padding: "10px 12px", fontWeight: "600", color: "#0369a1" }, children: [`Minimo:`, `${stats.min}`, `${formatDateShort(firstTs)}`] },
              { id: "s-r6", type: "text", x: "0", y: "250px", width: "100%", height: "50px", style: { borderBottom: "1px solid #f1f5f9", padding: "10px 12px" }, children: [`Dato mas reciente:`, `${lastVal}`, `${formatDateShort(lastTs)}`] },
              { id: "s-r7", type: "text", x: "0", y: "300px", width: "100%", height: "50px", style: { borderBottom: "1px solid #f1f5f9", padding: "10px 12px" }, children: [`Dato mas antiguo:`, `${firstVal}`, `${formatDateShort(firstTs)}`] },
              { id: "s-r8", type: "text", x: "0", y: "350px", width: "100%", height: "50px", style: { padding: "10px 12px", fontWeight: "700" }, children: [`Total datos:`, `${stats.count}`, ""] },
            ],
          },
        ],
      },
      {
        id: "equipment-section",
        type: "container",
        x: "620px",
        y: "720px",
        width: "520px",
        height: "500px",
        style: { display: "flex", flexDirection: "column", backgroundColor: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0" },
        children: [
          {
            id: "equipment-title",
            type: "subtitle",
            x: "0",
            y: "0",
            width: "100%",
            height: "40px",
            style: {
              fontSize: "15px",
              fontWeight: "700",
              color: "#0f172a",
              borderBottom: "2px solid #00554f",
              paddingBottom: "8px",
              paddingLeft: "16px",
              paddingRight: "16px",
              paddingTop: "16px",
            },
            children: ["INFORMACION DEL SENSOR"],
          },
          {
            id: "equipment-table",
            type: "table",
            x: "0",
            y: "60px",
            width: "100%",
            height: "420px",
            style: { fontSize: "13px", color: "#334155" },
            columns: ["Propiedad", "Valor"],
            children: [
              { id: "e-r1", type: "text", x: "0", y: "0",   width: "100%", height: "50px", style: { borderBottom: "1px solid #f1f5f9", padding: "10px 12px" }, children: [`ID`, sensor.id] },
              { id: "e-r2", type: "text", x: "0", y: "50px",  width: "100%", height: "50px", style: { borderBottom: "1px solid #f1f5f9", padding: "10px 12px" }, children: [`Tipo`, sensor.module.type_modulo ?? "Sensor"] },
              { id: "e-r3", type: "text", x: "0", y: "100px", width: "100%", height: "50px", style: { borderBottom: "1px solid #f1f5f9", padding: "10px 12px" }, children: [`Ubicacion`, sensor.module.ubicacion ?? "-"] },
              { id: "e-r4", type: "text", x: "0", y: "150px", width: "100%", height: "50px", style: { borderBottom: "1px solid #f1f5f9", padding: "10px 12px" }, children: [`Host`, sensor.module.host ?? "-"] },
              { id: "e-r5", type: "text", x: "0", y: "200px", width: "100%", height: "50px", style: { borderBottom: "1px solid #f1f5f9", padding: "10px 12px" }, children: [`Area`, sensor.areaName ?? "-"] },
              { id: "e-r6", type: "text", x: "0", y: "250px", width: "100%", height: "50px", style: { borderBottom: "1px solid #f1f5f9", padding: "10px 12px" }, children: [`Sede`, sensor.sedeName ?? "-"] },
              { id: "e-r7", type: "text", x: "0", y: "300px", width: "100%", height: "50px", style: { borderBottom: "1px solid #f1f5f9", padding: "10px 12px" }, children: [`Entidad`, entityName] },
              { id: "e-r8", type: "text", x: "0", y: "350px", width: "100%", height: "50px", style: { padding: "10px 12px", fontWeight: "700" }, children: [`Fecha reporte`, dateStr] },
            ],
          },
        ],
      },
      {
        id: "footer-section",
        type: "container",
        x: "60px",
        y: "1520px",
        width: "1080px",
        height: "50px",
        style: { borderTop: "2px solid #00554f", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" },
        children: [
          {
            id: "footer-left",
            type: "text",
            x: "0",
            y: "0",
            width: "50%",
            height: "20px",
            style: { fontSize: "11px", color: "#64748b", fontWeight: "500" },
            children: [`DataIoT © ${year}`],
          },
          {
            id: "footer-right",
            type: "text",
            x: "0",
            y: "0",
            width: "50%",
            height: "20px",
            style: { fontSize: "11px", color: "#94a3b8", textAlign: "right" },
            children: ["Generado automaticamente"],
          },
        ],
      },
    ],
  };

  return page;
};

export const Reports = () => {
  const [entities, setEntities] = useState<Entidad[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [detectedValueKeys, setDetectedValueKeys] = useState<string[]>([]);
  const [selectedValueKey, setSelectedValueKey] = useState<string | null>(null);
  const [detectingValues, setDetectingValues] = useState(false);
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
  }, [selectedEntityId]);

  useEffect(() => {
    setOpenGroups(new Set());
  }, [sensorsByArea]);

  useEffect(() => {
    if (!selectedSensorId) {
      setDetectedValueKeys([]);
      setSelectedValueKey(null);
      return;
    }
    const detect = async () => {
      setDetectingValues(true);
      setError(null);
      try {
        const response = await apiCommands.getSensorHistory(selectedSensorId, 0);
        const records = response.data?.data ?? [];
        const keys = detectAvailableValueKeys(records);
        setDetectedValueKeys(keys);
        setSelectedValueKey(keys[0] ?? null);
      } catch {
        setError("No fue posible detectar las variables.");
      } finally {
        setDetectingValues(false);
      }
    };
    detect();
  }, [selectedSensorId]);

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

  const handleGenerate = useCallback(async () => {
    if (!selectedSensorId || !initDate || !endDate || !selectedEntity) {
      setError("Selecciona entidad, sensor y rango de fechas.");
      return;
    }

    setGenerating(true);
    setError(null);
    setStatusMessage("Obteniendo datos...");

    try {
      const apiInit = toApiDate(initDate);
      const apiEnd = toApiDate(endDate);

      const jobResponse = await apiCommands.getSensorsRangeAsync([selectedSensorId], apiInit, apiEnd);
      const jobId = jobResponse.data?.jobId;

      if (!jobId) {
        setError("No se pudo iniciar el procesamiento de datos.");
        setGenerating(false);
        setStatusMessage(null);
        return;
      }

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
          setError(statusResponse.data?.error ?? "Error en el procesamiento de datos.");
          setGenerating(false);
          setStatusMessage(null);
          return;
        }

        if (Date.now() - startTime > TIMEOUT) {
          setError("Tiempo de espera agotado. Intenta con un rango menor.");
          setGenerating(false);
          setStatusMessage(null);
          return;
        }

        setStatusMessage(`Procesando datos... ${Math.round((Date.now() - startTime) / 1000)}s`);
      }

      setStatusMessage("Construyendo reporte...");

      const records = result?.[selectedSensorId]?.data ?? [];

      if (records.length === 0) {
        setError("No se encontraron datos para el sensor y rango seleccionados.");
        setGenerating(false);
        setStatusMessage(null);
        return;
      }

      const realKeys = detectAvailableValueKeys(records);
      const valueKey = selectedValueKey && realKeys.includes(selectedValueKey)
        ? selectedValueKey
        : realKeys[0];

      if (!valueKey) {
        setError("No se encontraron variables con datos en este rango.");
        setGenerating(false);
        setStatusMessage(null);
        return;
      }

      const keyRecords = records.filter((r) => {
        const val = r[valueKey as keyof SensorHistoryRecord];
        return (typeof val === "number" && !isNaN(val)) ||
               (typeof val === "string" && val !== "" && !isNaN(Number(val)));
      });

      if (keyRecords.length === 0) {
        setError("No hay datos suficientes para la variable seleccionada.");
        setGenerating(false);
        setStatusMessage(null);
        return;
      }

      const chartData: ChartDataPoint[] = keyRecords
        .map((r) => ({
          x: formatDateShort((r.createAt ?? r.createdAt ?? "").replace("T", " ")),
          y: Number(r[valueKey as keyof SensorHistoryRecord]),
        }))
        .filter((p) => !isNaN(p.y));

      const sensorOption = sensorsByArea
        .flatMap((g) => g.sensors)
        .find((s) => s.id === selectedSensorId);

      if (!sensorOption || !selectedEntity) {
        setError("No se encontro la informacion del sensor.");
        setGenerating(false);
        setStatusMessage(null);
        return;
      }

      const page = buildReportPage(
        selectedEntity.name,
        sensorOption,
        valueKey,
        keyRecords,
        chartData
      );

      const { components, ...pageSettings } = page;
      const document: ReportDocument = { page: pageSettings, components };

      setStatusMessage("Generando PDF...");

      console.log("Enviando documento JSON:", JSON.stringify(document, null, 2));

      const blob = await generatePDF(document);

      console.log("PDF recibido, tipo:", blob.type, "tamano:", blob.size);

      const dateLabel = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const filename = `reporte_${dateLabel}.pdf`;

      downloadPDF(blob, filename);
      setStatusMessage(null);
    } catch (err: unknown) {
      console.error("Error al generar PDF:", err);
      if (err instanceof ReportError) {
        let parsed: string = err.body;
        try {
          const json = JSON.parse(err.body);
          parsed = json.error ?? json.msg ?? err.body;
        } catch {
          /* no es json */
        }
        setError(`Backend (${err.status}): ${parsed}`);
      } else {
        const axiosErr = err as { response?: { status?: number; data?: unknown }; message?: string };
        if (axiosErr.response?.status === 401) {
          setError("Sesion expirada. Inicia sesion nuevamente.");
        } else {
          setError(axiosErr.message ?? "Error al generar el PDF. Intenta de nuevo.");
        }
      }
    } finally {
      setGenerating(false);
      setStatusMessage(null);
    }
  }, [selectedSensorId, initDate, endDate, selectedEntity, sensorsByArea, selectedValueKey]);

  return (
    <div className="w-full max-w-[1400px] mx-auto px-2 min-w-0 space-y-6">
      <div className="flex items-center gap-3">
        <FileText size={22} className="text-[#00554f]" />
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Reportes</p>
          <h1 className="text-xl font-semibold text-[#1e293b]">Generacion de Informes PDF</h1>
        </div>
      </div>

      <Card className="rounded-[12px] border border-black/10">
        <CardHeader className="space-y-2">
          <CardTitle className="text-base text-[#1e293b]">Parametros del Reporte</CardTitle>
          <p className="text-xs text-[#64748b]">Selecciona entidad, sensor y rango de fechas para generar el informe.</p>
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

          {sensorsByArea.length === 0 && selectedEntity && !loadingEntities && (
            <p className="text-xs text-[#64748b]">No hay sensores registrados para esta entidad.</p>
          )}

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
                    <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Area</p>
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
                          onChange={() => setSelectedSensorId(sensor.id)}
                          className="h-4 w-4 accent-[#00554f]"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#1e293b]">{sensor.id}</p>
                          <p className="text-[11px] text-[#64748b] truncate font-medium">{sensorLabel(sensor)}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] uppercase tracking-[0.3em] text-[#64748b]">Variable</span>
            {detectingValues && (
              <span className="text-xs text-[#64748b]">Detectando...</span>
            )}
            {!detectingValues && detectedValueKeys.length > 0 &&
              detectedValueKeys.map((valueKey) => (
                <label key={valueKey} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="value-select"
                    checked={selectedValueKey === valueKey}
                    onChange={() => setSelectedValueKey(valueKey)}
                    className="h-4 w-4 accent-[#00554f]"
                  />
                  <span className="font-medium">{getValueLabel(valueKey)}</span>
                </label>
              ))
            }
            {!detectingValues && detectedValueKeys.length === 0 && selectedSensorId && (
              <span className="text-xs text-[#64748b]">Sin variables detectadas</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={!selectedSensorId || generating}
              className="bg-[#003d3a] hover:bg-[#002f2d] text-white gap-2"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              {generating ? "Generando..." : "Generar PDF"}
            </Button>
            {statusMessage && (
              <span className="text-xs text-[#00554f] animate-pulse">{statusMessage}</span>
            )}
            {error && (
              <span className="text-xs text-red-500">{error}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

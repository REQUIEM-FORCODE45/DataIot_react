import { lazy, Suspense, useEffect, useMemo, useState, memo } from "react";
import type { FC } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Modulo } from "@/types/entidad";
import type { SensorHistoryRecord } from "@/types/sensor";
import { Wrench } from "lucide-react";

const PlotlyChart = lazy(() => import("@/components/PlotlyChart"));

interface SensorCardProps {
  module: Modulo;
  history?: SensorHistoryRecord[];
  areaId?: string;
}

const formatTimestamp = (value?: string) => {
  if (!value) return "Sin registro";
  const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!parts) return "Fecha inválida";
  return `${parts[3]}/${parts[2]}/${parts[1]} ${parts[4]}:${parts[5]}`;
};

const numericKeysFrom = (records: SensorHistoryRecord[]): string[] => {
  if (!records.length) return [];
  const keys = new Set<string>();
  for (const record of records) {
    for (const [key, value] of Object.entries(record)) {
      if (["_id", "createAt", "createdAt"].includes(key)) continue;
      if (typeof value === "number") keys.add(key);
    }
  }
  return Array.from(keys);
};

const PLOTLY_DATA_BASE = {
  type: "scatter" as const,
  mode: "lines" as const,
  line: { color: "#00554f", width: 2 },
  fill: "tozeroy" as const,
  fillcolor: "rgba(0, 85, 79, 0.08)",
};

const PLOTLY_LAYOUT = {
  margin: { l: 36, r: 12, t: 8, b: 36 },
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

const ChartSkeleton = () => (
  <div className="w-full h-[200px] rounded-lg animate-pulse bg-[#f1f5f9]" />
);

export const SensorCard: FC<SensorCardProps> = memo(({ module, history, areaId }) => {
  const navigate = useNavigate();
  const title = module.modulo ?? module.id_modulo ?? "Sensor";
  const keys = useMemo(() => numericKeysFrom(history ?? []), [history]);
  const [selectedKey, setSelectedKey] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!selectedKey || !keys.includes(selectedKey)) {
      setSelectedKey(keys[0]);
    }
  }, [keys, selectedKey]);

  const lastRecord = history?.[0];
  const timestamp = lastRecord?.createAt ?? lastRecord?.createdAt;

  const todayHistory = useMemo(() => {
    if (!history?.length) return [];
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return history.filter((r) => {
      const ts = r.createAt ?? r.createdAt ?? "";
      return ts.startsWith(todayStr);
    });
  }, [history]);

  const chartTrace = useMemo(() => {
    if (!selectedKey || todayHistory.length < 2) return null;
    const xData = todayHistory.map((r) => r.createAt ?? r.createdAt).filter((v): v is string => Boolean(v));
    const yData = todayHistory.map((r) => r[selectedKey] as number);
    if (xData.length < 2) return null;
    return {
      ...PLOTLY_DATA_BASE,
      x: xData,
      y: yData,
    };
  }, [todayHistory, selectedKey]);

  return (
    <Card className={cn("min-h-[240px] border border-border bg-card/90 shadow-sm transition hover:shadow-md")}>
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Sensor</p>
            <CardTitle className="text-lg leading-tight">{module.id_modulo}</CardTitle>
          </div>
          <span className="rounded-full border border-border/70 px-2 py-1 text-[11px] text-muted-foreground">
            {title }
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{module.ubicacion || "Sin ubicación"}</p>
        {areaId && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 text-[#00554f] border-[#00554f] hover:bg-[#00554f] hover:text-white gap-1"
            onClick={() => navigate(`/mantenimiento/${areaId}/${module.id_modulo || module.id_modulo}`)}
          >
            <Wrench size={14} />
            Mantenimiento
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {keys.length > 1 && (
          <div className="flex items-center gap-2">
            <label className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Variable</label>
            <select
              value={selectedKey ?? ""}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="rounded-md border border-border bg-muted/50 px-2 py-1 text-xs"
            >
              {keys.map((key) => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
          </div>
        )}
        {keys.length === 0 && <p className="text-sm text-muted-foreground">Sin histórico disponible</p>}
        {selectedKey && chartTrace ? (
          <Suspense fallback={<ChartSkeleton />}>
            <PlotlyChart
              data={[chartTrace]}
              layout={PLOTLY_LAYOUT}
              config={PLOTLY_CONFIG}
              style={{ width: "100%", height: "200px" }}
            />
          </Suspense>
        ) : (
          keys.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {todayHistory.length === 0 ? "Sin lecturas hoy" : "Sin suficientes lecturas"}
            </p>
          )
        )}
        <p className="text-xs text-muted-foreground">
          {timestamp ? `Última lectura: ${formatTimestamp(timestamp)}` : "Sin fecha de lectura"}
        </p>
      </CardContent>
    </Card>
  );
});

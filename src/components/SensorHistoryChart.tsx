import type { SensorHistoryRecord } from "@/types/sensor";
import { getPrimaryValue } from "@/lib/sensor-utils";

interface SensorHistoryChartProps {
  records: SensorHistoryRecord[];
  label?: string;
}

const GRAPH_WIDTH = 520;
const GRAPH_HEIGHT = 160;

export const SensorHistoryChart = ({ records, label }: SensorHistoryChartProps) => {
  const values = records
    .map((record) => getPrimaryValue(record))
    .filter((value): value is number => typeof value === "number");

  if (values.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/70 bg-card/60 p-6 text-center text-sm text-muted-foreground">
        Sin datos históricos disponibles.
      </div>
    );
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  const step = GRAPH_WIDTH / Math.max(values.length - 1, 1);

  const pathData = values
    .map((value, index) => {
      const normalized = (value - min) / range;
      const x = index * step;
      const y = GRAPH_HEIGHT - normalized * GRAPH_HEIGHT;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const areaPath = `${pathData} L${GRAPH_WIDTH} ${GRAPH_HEIGHT} L0 ${GRAPH_HEIGHT} Z`;
  const lastValue = values[values.length - 1];
  const firstValue = values[0];

  return (
    <div className="flex flex-col gap-3 rounded-[32px] border border-border bg-gradient-to-br from-primary/10 to-card/80 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
      <div className="flex items-center justify-between text-sm font-semibold">
        <span>{label ?? "Tendencia histórica"}</span>
        <span className="text-[12px] text-muted-foreground">{values.length} puntos</span>
      </div>
      <div className="relative h-40 w-full">
        <svg
          viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
          className="h-full w-full"
          role="img"
          aria-label={`Histórico de ${values.length} lecturas`}
        >
          <defs>
            <linearGradient id="historyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(59,130,246,0.6)" />
              <stop offset="100%" stopColor="rgba(59,130,246,0)" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#historyGradient)" stroke="none" />
          <path d={pathData} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="grid grid-cols-3 text-xs text-muted-foreground">
        <div>
          <p className="text-[11px] uppercase tracking-wide">Inicio</p>
          <p className="text-base text-foreground">{firstValue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide">Último</p>
          <p className="text-base text-foreground">{lastValue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide">Rango</p>
          <p className="text-base text-foreground">{(max - min).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

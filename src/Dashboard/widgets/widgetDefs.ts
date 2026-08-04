export interface WidgetDef {
  id: string
  label: string
}

export const TEMP_WIDGETS: WidgetDef[] = [
  { id: "gauge", label: "Medidor" },
  { id: "cooling", label: "Enfriamiento" },
  { id: "excursion", label: "Excursión" },
  { id: "history", label: "Histórico" },
]

export const ENERGY_WIDGETS: WidgetDef[] = [
  { id: "powers", label: "Potencias" },
  { id: "efficiency", label: "Eficiencia" },
  { id: "imbalance", label: "Desbalance" },
  { id: "frequency", label: "Frecuencia" },
]

export const ENV_WIDGETS: WidgetDef[] = [
  { id: "co2", label: "CO₂" },
  { id: "comfort", label: "Confort" },
  { id: "correlation", label: "Correlación" },
]

export const ALL_WIDGET_IDS_BY_DOMAIN: Record<"temp" | "energy" | "ambiente", string[]> = {
  temp: TEMP_WIDGETS.map((w) => w.id),
  energy: ENERGY_WIDGETS.map((w) => w.id),
  ambiente: ENV_WIDGETS.map((w) => w.id),
}

import type { SensorHistoryRecord, SensorLatestData, SensorLatestRecord } from "@/types/sensor";

const valuePriorities: Array<keyof SensorLatestRecord> = ["value1", "value2", "value3", "value4"];

export const getPrimaryValue = (record?: SensorLatestRecord | SensorHistoryRecord): number | undefined => {
  if (!record) {
    return undefined;
  }

  for (const key of valuePriorities) {
    const value = record[key];
    if (typeof value === "number") {
      return value;
    }
  }

  const numericValue = Object.values(record).find((value): value is number => typeof value === "number");
  return numericValue;
};

export const getSensorDisplayName = (sensor: SensorLatestData) => {
  return (
    sensor.config?.alias ||
    sensor.alias ||
    sensor.label ||
    sensor.module ||
    sensor.modulo_id ||
    sensor.id_sensor ||
    "Sensor"
  );
};

export const formatSensorTimestamp = (value?: string) => {
  if (!value) {
    return "Sin lectura reciente";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Fecha inválida";
  }

  return date.toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  });
};

export const getLastSeenLabel = (value?: string) => {
  if (!value) {
    return "Sin registro";
  }

  const diff = Date.now() - new Date(value).getTime();
  if (diff < 0) {
    return "Momento futuro";
  }

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Hace segundos";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
};

import axios from "axios";

import type { ModuleReading, MultiSensorHistoryResponse, SensorHistoryResponse } from "@/types/sensor";

const commandBaseUrl = import.meta.env.VITE_COMMAND_BASE_URL;

if (!commandBaseUrl) {
  throw new Error("Missing VITE_COMMAND_BASE_URL in environment");
}

const commandApi = axios.create({
  baseURL: commandBaseUrl,
  withCredentials: true,
});

commandApi.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  config.headers["x-token"] = localStorage.getItem("token") || "";
  return config;
});

type CommandModulesResponse = { success: boolean } &
  ({ data: ModuleReading[] } | { data?: ModuleReading[] });

export interface SensorConfig {
  id: string;
  value: string;
  minimo: number;
  maximo: number;
  alert: boolean;
  observacion?: string;
}

export interface SensorConfigResponse {
  success: boolean;
  data: SensorConfig[];
}

export interface SetConfigBody {
  id_sensor: string;
  maximo: number;
  minimo: number;
  alert: boolean;
  value: string;
  observacion?: string;
}

export interface AlertHistoryItem {
  id_sensor: string;
  configValue: string;
  value: number;
  limit: number;
  alertType: "maximo" | "minimo";
  createAt: string;
  detectedAt: string;
}

export interface AlertHistoryResponse {
  success: boolean;
  count: number;
  data: AlertHistoryItem[];
}

export const apiCommands = {
  getLastModules: () => commandApi.get<CommandModulesResponse>("/modules/last-data"),
  getLastModulesFast: () => commandApi.get<CommandModulesResponse>("/modules/last-data-fast"),
  getSensorHistory: (id_sensor: string, length = 28) => commandApi.get<SensorHistoryResponse>(`/get/${id_sensor}/${length}/data`),
  getSensorConfig: (id_sensor: string) => commandApi.get(`/get/${id_sensor}/config`),
  getSensorsRange: (sensorIds: string[], init: string, end: string) => {
    const sensorsParam = encodeURIComponent(sensorIds.join(","));
    const initParam = encodeURIComponent(init);
    const endParam = encodeURIComponent(end);
    return commandApi.get<MultiSensorHistoryResponse>(`/gets/${sensorsParam}/${initParam}/${endParam}/data`);
  },
  getSensorConfigs: (moduloId: string) => commandApi.get<SensorConfigResponse>(`/configs/module/${moduloId}`),
  setSensorConfig: (data: SetConfigBody) => commandApi.post("/setConfig", data),
  getAlertHistory: (id_sensor?: string, limit = 50) => {
    const path = id_sensor ? `/alerts/${id_sensor}` : "/alerts";
    return commandApi.get<AlertHistoryResponse>(`${path}?limit=${limit}`);
  },
  getAllAlerts: (limit = 10) => {
    return commandApi.get<AlertHistoryResponse>(`/alerts?limit=${limit}`);
  },
};

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

};

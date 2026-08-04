import axios from "axios";
import type { BackendVehicle } from "@/types/fleet";

const vehiclesBaseUrl = import.meta.env.VITE_VEHICLES_BASE_URL;

if (!vehiclesBaseUrl) {
  throw new Error("Missing VITE_VEHICLES_BASE_URL in environment");
}

const vehiclesApi = axios.create({
  baseURL: vehiclesBaseUrl,
  withCredentials: true,
});

vehiclesApi.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  config.headers["x-token"] = localStorage.getItem("token") || "";
  return config;
});

export interface CreateVehiclePayload {
  entidad_id: string;
  sede_id: string;
  area_id: string;
  vin: string;
  placa: string;
  marca?: string;
  modelo?: string;
  año?: number;
  color?: string;
  tipo?: string;
  combustible?: string;
  num_motor?: string;
  num_chasis?: string;
  capacidad_carga?: number;
  kilometraje_inicial?: number;
  conductor?: string;
  activo?: boolean;
}

export interface UpdateVehiclePayload {
  vin?: string;
  placa?: string;
  marca?: string;
  modelo?: string;
  año?: number;
  color?: string;
  tipo?: string;
  combustible?: string;
  num_motor?: string;
  num_chasis?: string;
  capacidad_carga?: number;
  kilometraje_inicial?: number;
  conductor?: string;
  activo?: boolean;
}

export interface VehicleResponse {
  success: boolean;
  message: string;
  vehicle: BackendVehicle;
}

export const apiVehicles = {
  create: (data: CreateVehiclePayload) =>
    vehiclesApi.post<VehicleResponse>("", data),

  getAll: () =>
    vehiclesApi.get<BackendVehicle[]>(""),

  getById: (id: string) =>
    vehiclesApi.get<BackendVehicle>(`/${id}`),

  update: (id: string, data: UpdateVehiclePayload) =>
    vehiclesApi.put<VehicleResponse>(`/${id}`, data),

  delete: (id: string) =>
    vehiclesApi.delete<VehicleResponse>(`/${id}`),
};

export default vehiclesApi;

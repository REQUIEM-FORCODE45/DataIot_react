import axios from "axios";

const sensorBaseUrl = import.meta.env.VITE_SENSOR_BASE_URL;

if (!sensorBaseUrl) {
  throw new Error("Missing VITE_SENSOR_BASE_URL in environment");
}

const sensorApi = axios.create({
  baseURL: sensorBaseUrl,
  withCredentials: true,
});

sensorApi.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  config.headers["x-token"] = localStorage.getItem("token") || "";
  return config;
});

export interface Mantenimiento {
  _id: string;
  fecha: string;
  frecuencia: string;
  observaciones: string;
  imagen?: string;
  createdAt?: string;
}

export interface MantenimientoResponse {
  sensor: {
    mantenimientos: Mantenimiento[];
  };
}

export const apiSensor = {
  getMantenimientos: async (areaId: string, moduloId: string): Promise<MantenimientoResponse> => {
    const response = await sensorApi.get<MantenimientoResponse>(`/api/getData/${areaId}/${moduloId}/modulo`);
    return response.data;
  },

  addMantenimiento: async (
    areaId: string,
    moduloId: string,
    data: {
      fechaMantenimiento: string;
      frecuenciaMantenimiento: string;
      observacionesMantenimiento: string;
    }
  ) => {
    const response = await sensorApi.post(`/api/mantenimiento/${areaId}/${moduloId}/modulo`, data);
    return response.data;
  },

  uploadImage: async (areaId: string, moduloId: string, file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await sensorApi.post(`/api/upload/${areaId}/${moduloId}/image`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};

export default sensorApi;

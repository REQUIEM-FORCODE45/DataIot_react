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

export interface HojaVida {
  nombre: string;
  marca: string;
  modelo: string;
  serie: string;
  area: string;
  fechaInstalacion: string;
  responsable: string;
  fechaVerificacion: string;
  image?: string;
}

export interface GetHojaVida {
  nombre: string;
  marca: string;
  modelo: string;
  serial: string;
  area: string;
  instalacion: string;
  responsable: string;
  verificacion: string;
  image?: string;
}

export interface Mantenimiento {
  _id: string;
  fecha: string;
  frecuencia: string;
  observaciones: string;
  imagen?: string;
  createdAt?: string;
}

export interface SensorData {
  sensor: {
    _id: string;
    modulo_id: string;
    area_id: string;
    ubicacion?: string;
    hv?: HojaVida;
    mantenimientos?: Mantenimiento[];
    createdAt?: string;
    updatedAt?: string;
  };
  message?: string;
}

export interface MantenimientoResponse {
  sensor: {
    mantenimientos: Mantenimiento[];
  };
}

export const SENSOR_BASE_URL = sensorBaseUrl;

export const getSensorImageUrl = (filename: string): string => {
  return `${sensorBaseUrl}/api/image/${filename}`;
};

export const apiSensor = {
  getSensor: async (areaId: string, moduloId: string): Promise<SensorData> => {
    const response = await sensorApi.get<SensorData>(`/api/getData/${areaId}/${moduloId}/modulo`);
    return response.data;
  },

  updateHojaVida: async (
    areaId: string,
    moduloId: string,
    hvData: Partial<HojaVida>
  ) => {
    console.log("Actualizando hoja de vida...", hvData);
    const response = await sensorApi.post(`/api/updateData/${areaId}/${moduloId}/modulo`, hvData );
    return response.data;
  },

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

  checkModuloId: async (moduloId: string): Promise<boolean> => {
    const response = await sensorApi.get<boolean>(`/check/${moduloId}`);
    return response.data;
  },

  deleteModulo: async (moduloId: string): Promise<boolean> => {
    const response = await sensorApi.delete<{ deleted: boolean }>(`/${moduloId}`);
    return response.data.deleted;
  },

  deleteSensorModule: async (moduloId: string): Promise<{ message: string; sensor: unknown }> => {
    const response = await sensorApi.delete<{ message: string; sensor: unknown }>(`/update/${moduloId}`);
    console.log("DELETE response:", response.data);
    return response.data;
  },

  updateSensorModule: async (moduloId: string, data: any): Promise<any> => {
    const response = await sensorApi.put(`/update/${moduloId}`, data);
    return response.data;
  },
};

export default sensorApi;

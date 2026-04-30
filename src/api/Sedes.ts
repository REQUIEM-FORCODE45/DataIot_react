import axios from "axios";
import type { Entidad, Sede, Area, Modulo } from "@/types/entidad"; 

const entidadBaseUrl = import.meta.env.VITE_ENTIDAD_BASE_URL;

if (!entidadBaseUrl) {
  throw new Error("Missing VITE_ENTIDAD_BASE_URL in environment");
}

const apiClient = axios.create({
  baseURL: entidadBaseUrl,
  withCredentials: true,
});

apiClient.interceptors.request.use(config => {
  config.headers = config.headers || {};
  config.headers['x-token'] = localStorage.getItem('token') || '';
  return config;
});

export const apiEntidades = {
  
  getAll: async (): Promise<Entidad[]> => {
    const response = await apiClient.get<Entidad[]>("/getall");
    return response.data;
  },
  
  register: async (data: Partial<Entidad>) => {
    const response = await apiClient.post("/register", data);
    return response.data;
  },

  getSedes: async (id_entidad: string): Promise<Sede[]> => {
    const response = await apiClient.get<Sede[]>(`/get/${id_entidad}/sede`);
    return response.data;
  },

  getEntidad: async (id_entidad: string) => {
    const response = await apiClient.get(`/get/${id_entidad}`);
    return response.data;
  },

  addSede: async (id_entidad: string, data: Partial<Sede>) => {
    const response = await apiClient.post(`/add/${id_entidad}/sede`, data);
    return response.data;
  },

  addArea: async (id_entidad: string, id_sede: string, data: Partial<Area>) => {
    const response = await apiClient.post(`/add/${id_entidad}/${id_sede}/area`, data);
    return response.data;
  },

  addHost: async (id_entidad: string, id_sede: string, data: { host: string }) => {
    const response = await apiClient.post(`/add/${id_entidad}/${id_sede}/host`, data);
    return response.data;
  },

  addModulo: async (id_entidad: string, id_sede: string, id_area: string, data: Partial<Modulo>) => {
    const response = await apiClient.post(`/add/${id_entidad}/${id_sede}/${id_area}/modulo`, data);
    console.log("ADD response:", response);
    return response.data;
  },

  updateEntidad: async (id: string, data: Partial<Entidad>) => {
    const response = await apiClient.put(`/update/${id}`, data);
    return response.data;
  },

  deleteEntidad: async (id: string) => {
    const response = await apiClient.delete(`/delete/${id}`);
    return response.data;
  },
};

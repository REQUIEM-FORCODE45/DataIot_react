import axios from "axios";
// Asegúrate de que la ruta a tus tipos sea correcta
// Asegúrate de que la ruta a tus tipos sea correcta
import type { Entidad, Sede, Area, Modulo } from "@/types/entidad"; 

// 1. Creamos la instancia de Axios (renombrada a apiClient para uso interno)
const apiClient = axios.create({
  baseURL: "http://localhost:5000/entidad", // Nota: Como ya incluye /entidad, las rutas de abajo son más cortas
  withCredentials: true,
});

// 2. Interceptor para el Token
apiClient.interceptors.request.use( config => {
    // Es buena práctica inicializar los headers si no existen
    config.headers = config.headers || {};
    
    // Inyectamos el token. OJO: Verifica que al hacer login guardes el token 
    // en localStorage usando exactamente la clave 'token' (o cámbialo a 'x-token' si usas ese nombre)
    config.headers['x-token'] = localStorage.getItem('token') || '';
    
    return config;
});

// 3. Exportamos el objeto con las funciones que el componente React va a consumir
export const apiEntidades = {
  
  // type: GET | DESC: Consulta todas las entidades
  getAll: async (): Promise<Entidad[]> => {
    // Como baseURL es /entidad, solo llamamos a /getall
    const response = await apiClient.get<Entidad[]>("/getall");
    return response.data;
  },
  
  // type: POST | DESC: Registro nueva entidad
  register: async (data: Partial<Entidad>) => {
    const response = await apiClient.post("/register", data);
    return response.data;
  },

  // type: GET | DESC: Consulta todas las sedes de la entidad registradas
  getSedes: async (id_entidad: string): Promise<Sede[]> => {
    const response = await apiClient.get<Sede[]>(`/get/${id_entidad}/sede`);
    return response.data;
  },

  // type: POST | DESC: Agregar sede a la entidad
  addSede: async (id_entidad: string, data: Partial<Sede>) => {
    const response = await apiClient.post(`/add/${id_entidad}/sede`, data);
    return response.data;
  },

  // type: POST | DESC: Agregar área a la sede
  addArea: async (id_entidad: string, id_sede: string, data: Partial<Area>) => {
    const response = await apiClient.post(`/add/${id_entidad}/${id_sede}/area`, data);
    return response.data;
  },

  // type: POST | DESC: Agregar host a la sede
  addHost: async (id_entidad: string, id_sede: string, data: { host: string }) => {
    const response = await apiClient.post(`/add/${id_entidad}/${id_sede}/host`, data);
    return response.data;
  },

  // type: POST | DESC: Agregar módulo al área
  addModulo: async (id_entidad: string, id_sede: string, id_area: string, data: Partial<Modulo>) => {
    const response = await apiClient.post(`/add/${id_entidad}/${id_sede}/${id_area}/modulo`, data);
    return response.data;
  }
};
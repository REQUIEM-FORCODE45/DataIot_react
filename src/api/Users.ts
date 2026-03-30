import axios from "axios";

// --- INTERFACES DE TYPESCRIPT ---
export interface UserProfile {
  name: string;
  identification_type: string;
  identification: string;
  phone?: string;
  address?: string;
}

export interface UserArea {
  _id?: string;
  name: string;
  id_area?: string;
}

export interface UserSede {
  _id?: string;
  name: string;
  id_sede?: string;
  areas: UserArea[];
}

export interface UserData {
  _id: string;
  entidad_id: string;
  rol: string;
  state: string;
  registro: { email: string };
  profile: UserProfile;
  sedes: UserSede[];
}

// 1. Creamos la instancia de Axios
const userBaseUrl = import.meta.env.VITE_USER_BASE_URL;

if (!userBaseUrl) {
  throw new Error("Missing VITE_USER_BASE_URL in environment");
}

const apiUser = axios.create({
  baseURL: userBaseUrl, // Nota: Ya incluye /user, así que las rutas son más cortas
  withCredentials: true,
});

// 2. Interceptor para el Token
apiUser.interceptors.request.use( config => {
    // Es buena práctica inicializar los headers si no existen
    config.headers = config.headers || {};
    
    // Inyectamos el token. OJO: Verifica que al hacer login guardes el token 
    // en localStorage usando exactamente la clave 'token' (o cámbialo a 'x-token' si usas ese nombre)
    config.headers['x-token'] = localStorage.getItem('token') || '';
    
    return config;
});

// 3. Exportamos el objeto con las llamadas a la API
export const apiUsuarios = {
  
  // type: GET | DESC: Obtener todos los usuarios según los permisos del solicitante
  getAll: async (): Promise<UserData[]> => {
    const response = await apiUser.get<UserData[]>("/getall");
    return response.data;
  },
  
  // type: POST | DESC: Registrar un nuevo usuario
  register: async (data: any) => {
    const response = await apiUser.post("/register", data);
    return response.data;
  },

  // type: PUT | DESC: Modificar el rol de un usuario existente
  updateRol: async (id_user: string, rol: string) => {
    const response = await apiUser.put(`/update/${id_user}/rol`, { rol });
    return response.data;
  },

  // type: PUT | DESC: Modificar el estado (active/inactive) de un usuario
  updateState: async (id_user: string, state: string) => {
    const response = await apiUser.put(`/update/${id_user}/state`, { state });
    return response.data;
  },

  updateUser: async (id_user: string, data: {
    profile?: Partial<UserProfile>;
    password?: string;
    entidad_id?: string;
    state?: string;
    rol?: string;
    permisos?: { view?: boolean; write?: boolean; edit?: boolean; delete?: boolean };
    sedes?: UserSede[];
  }) => {
    const response = await apiUser.put(`/update/${id_user}`, data);
    return response.data;
  },

  addUserArea: async (id_user: string, data: { id_sede: string; name: string; id_area?: string }) => {
    const response = await apiUser.put(`/update/${id_user}/area`, data);
    return response.data;
  },

  deleteUserArea: async (id_user: string, data: { id_sede: string; id_area: string }) => {
    const response = await apiUser.delete(`/update/${id_user}/area`, { data });
    return response.data;
  },

  updateUserSedes: async (id_user: string, sedes: { id_sede: string; name: string; areas: { id_area: string; name: string }[] }[]) => {
    const response = await apiUser.put(`/update/${id_user}/sedes`, { sedes });
    return response.data;
  },
};

export default apiUser;

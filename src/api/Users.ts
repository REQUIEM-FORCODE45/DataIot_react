import axios from "axios";

// --- INTERFACES DE TYPESCRIPT ---
export interface UserProfile {
  name: string;
  identification_type: string;
  identification: string;
  phone?: string;
  address?: string;
}

export interface UserData {
  _id: string;
  entidad_id: string;
  rol: string;
  state: string;
  registro: { email: string };
  profile: UserProfile;
  sedes: any[]; // Puedes definir una interfaz más estricta si manejas sub-sedes aquí
}

// 1. Creamos la instancia de Axios
const apiUser = axios.create({
  baseURL: "http://localhost:5000/user", // Nota: Ya incluye /user, así que las rutas son más cortas
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
  }
};

export default apiUser;
import axios from "axios";



const authBaseUrl = import.meta.env.VITE_AUTH_BASE_URL;

if (!authBaseUrl) {
  throw new Error("Missing VITE_AUTH_BASE_URL in environment");
}

const authApi = axios.create({
  baseURL: authBaseUrl,
  withCredentials: true,
});

authApi.interceptors.request.use( config => {

    config.headers = config.headers || {};
    
    config.headers['x-token'] = localStorage.getItem('token') || '';
    
    return config;
});

export default authApi;

import { useDispatch, useSelector } from "react-redux";
import authApi from "../api/auth";
import type { AppDispatch } from "../store/store";
import type { RootState } from "../store/store";
import { onLogin, onLogout } from "../store/auth/authSlice"; // Asegúrate de importar tus acciones

// Interfaz de respuesta esperada del login
interface LoginResponse {
    ok: boolean;
    token: string;
    user: {
        rol: string;
        entidad_id: string;
        email: string;
    };
}

export const useAuthStore = () => {

    const { status, user, errorMessage } = useSelector((state: RootState) => state.auth);


    const dispatch: AppDispatch = useDispatch();

    const startLogin = async (email: string, password: string) => {
        try {
          
            const { data } = await authApi.post("/login", { email, password });
            localStorage.setItem("token", data.token);
            dispatch(onLogin(data.user));

        } catch (error: any) {
            console.error("Error en login:", error);
            const message =
                error?.response?.data?.message ||
                error?.message ||
                "Error de autenticación";
            dispatch(onLogout(message));
        }
    };

    const checkAuthToken = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            dispatch(onLogout());
            return;
        }

        try {
            const { data } = await authApi.get<LoginResponse>("/renew");
            console.log("Token renovado:", data);
            localStorage.setItem("token", data.token);
            dispatch(onLogin(data.user));
        } catch (error) {
            console.error("Error al renovar token:", error);
            localStorage.removeItem("token");
            dispatch(onLogout());
        }
    }

    return {
        status,
        user,
        errorMessage,
        startLogin,
        checkAuthToken
    };
};
import { useDispatch, useSelector } from "react-redux";
import authApi from "../api/auth";
import type { AppDispatch } from "../store/store";
import type { RootState } from "../store/store";
import { onLogin, onLogout } from "../store/auth/authSlice"; // Asegúrate de importar tus acciones

// Interfaz de respuesta esperada del login
interface LoginResponse {
    ok: boolean;
    token: string;
    name?: string;
    uid?: string;
    user?: {
        _id?: string;
        name?: string;
        rol?: string;
        entidad_id?: string;
        registro?: { email?: string };
        email?: string;
        sedes?: Array<{ id_sede?: string; _id?: string; areas?: Array<{ id_area?: string; _id?: string }> }>;
        profile?: { name?: string };
    };
    rol?: string;
    entidad_id?: string;
    email?: string;
    sedes?: Array<{ id_sede?: string; _id?: string; areas?: Array<{ id_area?: string; _id?: string }> }>;
}

const resolveUserPayload = (data: LoginResponse) => {
    const baseUser = data.user ?? {};
    return {
        name:
            baseUser.profile?.name ||
            baseUser.name ||
            data.name ||
            baseUser.email ||
            baseUser.registro?.email ||
            data.email ||
            "Usuario",
        usuario_id: data.uid || baseUser._id || "",
        rol: baseUser.rol || data.rol,
        entidad_id: baseUser.entidad_id || data.entidad_id,
        email: baseUser.registro?.email || baseUser.email || data.email,
        sedes: baseUser.sedes || data.sedes || [],
    };
};

export const useAuthStore = () => {

    const { status, user, errorMessage } = useSelector((state: RootState) => state.auth);


    const dispatch: AppDispatch = useDispatch();

    const startLogin = async (email: string, password: string) => {
        try {
          
            const { data } = await authApi.post<LoginResponse>("/login", { email, password });
            localStorage.setItem("token", data.token);
            dispatch(onLogin(resolveUserPayload(data)));

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
            dispatch(onLogin(resolveUserPayload(data)));
        } catch (error) {
            console.error("Error al renovar token:", error);
            localStorage.removeItem("token");
            dispatch(onLogout());
        }
    }

    const startLogout = () => {
        localStorage.removeItem("token");
        dispatch(onLogout());
    };

    return {
        status,
        user,
        errorMessage,
        startLogin,
        checkAuthToken,
        startLogout,
    };
};

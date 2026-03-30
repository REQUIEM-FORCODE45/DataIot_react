import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface UserSedeAccess {
    id_sede?: string;
    _id?: string;
    areas?: Array<{ id_area?: string; _id?: string }>;
}

interface User {
    name: string;
    usuario_id: string;
    rol?: string;
    entidad_id?: string;
    email?: string;
    sedes?: UserSedeAccess[];
}

interface AuthState {
    status: "checking" | "authenticated" | "not-authenticated";
    user: User | null;
    errorMessage: string | null;
}

const initialState: AuthState = {
    status: "not-authenticated",
    user: null,
    errorMessage: null,
};

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        onLogin: (state, action: PayloadAction<User>) => {
            state.status = "authenticated";
            state.user = action.payload;
            state.errorMessage = null;
        },
        onLogout: (state, action: PayloadAction<string | undefined>) => {
            state.status = "not-authenticated";
            state.user = null;
            state.errorMessage = action.payload || null;
        },
        clearErrorMessage: (state) => {
            state.errorMessage = null;
        },
    },
});

export const { onLogin, onLogout, clearErrorMessage } = authSlice.actions;
export default authSlice.reducer;

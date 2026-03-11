import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

interface User {
    rol: string;
    entidad_id: string;
    email: string;
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
import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthPage } from "../auth/pages/authPage";
import { useAuthStore } from "../hooks/useAuthStore";
import { HomeRouter } from "./HomeRouter";

export const AppRouter = () => {
    const { status, checkAuthToken } = useAuthStore();

    useEffect(() => {
        checkAuthToken();
    }, [status]);

    if (status === "checking") {
        return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
            <h2>Cargando...</h2>
        </div>;
    }

    return (
        <Routes>
            {
                (status === "not-authenticated") ? (
                    <>
                        <Route path="/login" element={<AuthPage />} />
                        <Route path="/*" element={<Navigate to="/login" />} />
                    </>
                ) : (
                    <>                         
                        <Route path="/*" element={<HomeRouter />} />
                    </>
                )
            }
        </Routes>
    );
};
import React, { useState } from "react";
import { useAuthStore } from "../../hooks/useAuthStore";

export const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);  
  const { startLogin } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await startLogin(email, password);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "98vh",
      background: "#e5e8ec",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: "2.5rem 2rem",
          borderRadius: "18px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          width: "100%",
          maxWidth: "380px",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem"
        }}
      >
        {/* LOGO COMPUESTO */}
        <div style={{
          position: "relative",
          width: "100%",
          height: "100px",
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "0.5rem"
        }}>
          <img
            src="/img/fondo.jpg"
            alt="Background"
            style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}
          />
          <img
            src="/img/DataIOT-White.png"
            alt="DataIOT Logo"
            style={{ position: "relative", width: "80%", height: "auto", zIndex: 2, filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.3))" }}
          />
        </div>

        {error && (
          <div style={{
            color: "#721c24",
            backgroundColor: "#f8d7da",
            padding: "10px",
            borderRadius: "8px",
            fontSize: "0.9rem",
            textAlign: "center",
            border: "1px solid #f5c6cb"
          }}>
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Correo Electrónico"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={loading}
          style={{
            padding: "0.9rem",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontSize: "1rem",
            outline: "none",
            opacity: loading ? 0.7 : 1
          }}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          disabled={loading}
          style={{
            padding: "0.9rem",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontSize: "1rem",
            outline: "none",
            opacity: loading ? 0.7 : 1
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading 
              ? "#ccc" 
              : "linear-gradient(90deg,#0c616c 60%,#1e9eab 100%)",
            color: "#fff",
            fontWeight: 600,
            padding: "0.9rem",
            borderRadius: "8px",
            border: "none",
            fontSize: "1rem",
            letterSpacing: "1px",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease"
          }}
        >
          {loading ? "CARGANDO..." : "INICIAR SESIÓN"}
        </button>
      </form>
    </div>
  );
};
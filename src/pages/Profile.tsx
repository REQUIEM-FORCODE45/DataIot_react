import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/hooks/useAuthStore";
import { apiAuth } from "@/api/auth";
import { User2, Save, ArrowLeft, Eye, EyeOff } from "lucide-react";

export const Profile = () => {
  const navigate = useNavigate();
  const { user, checkAuthToken } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    currentPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    if (user?.name) {
      setFormData((prev) => ({ ...prev, name: user.name || "" }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSend: { name?: string; password?: string } = {};
      if (formData.name.trim()) {
        dataToSend.name = formData.name.trim();
      }
      if (formData.newPassword.trim()) {
        dataToSend.password = formData.newPassword;
      }
      if (Object.keys(dataToSend).length === 0) return;
      
      const res = await apiAuth.updateProfile(dataToSend);
      if (res.success) {
        await checkAuthToken();
        setFormData((prev) => ({ ...prev, currentPassword: "", newPassword: "" }));
        alert("Perfil actualizado");
      }
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-[#00554f] hover:text-[#00554f] hover:bg-[#f1f5f9] rounded-[10px]"
        >
          <ArrowLeft size={18} />
        </Button>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Cuenta</p>
          <h1 className="text-xl font-semibold text-[#1e293b]">Mi perfil</h1>
        </div>
      </div>

      <Card className="rounded-[12px] border border-black/10 bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User2 size={20} className="text-[#00554f]" />
            Información personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[#64748b]">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Tu nombre"
                className="rounded-[10px] border border-black/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#64748b]">Correo</Label>
              <Input
                id="email"
                value={user?.email || ""}
                disabled
                className="rounded-[10px] border border-black/10 bg-[#f1f5f9]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-[#64748b]">Contraseña actual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Ingresa tu contraseña actual"
                className="rounded-[10px] border border-black/10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-[#64748b]">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Dejar vacío para mantener actual"
                  className="rounded-[10px] border border-black/10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#1e293b]"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00554f] hover:bg-[#004a45] text-white rounded-[10px]"
            >
              {loading ? (
                "Guardando..."
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Guardar cambios
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
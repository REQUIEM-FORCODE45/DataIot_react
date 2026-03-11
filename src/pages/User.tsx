import React, { useEffect, useState } from "react";
import { UserPlus, Shield, Activity, Mail, Phone, Fingerprint, Building2, MapPin, Layers } from "lucide-react";

import { apiUsuarios, type UserData } from "@/api/Users"; // Ajusta tus rutas
import { apiEntidades } from "@/api/Sedes"; // Necesitamos importar la API de entidades
import type { Entidad, Sede } from "@/types/entidad";

// Eliminamos los imports de Card y dejamos solo lo necesario
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const User = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [entidades, setEntidades] = useState<Entidad[]>([]); 
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    identification_type: "CC",
    identification: "",
    phone: "",
    address: "",
    rol: "user",
    entidad_id: "", 
    sedes: [] as { id_sede: string; areas: any[] }[] 
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, entidadesData] = await Promise.all([
        apiUsuarios.getAll(),
        apiEntidades.getAll()
      ]);
      setUsers(usersData);
      setEntidades(entidadesData);
    } catch (error) {
      console.error("Error al obtener datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEntidadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ 
      ...prev, 
      entidad_id: e.target.value,
      sedes: [] 
    }));
  };

  const handleSedeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      sedes: e.target.value ? [{ id_sede: e.target.value, areas: [] }] : []
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.entidad_id) return alert("Debes seleccionar una Entidad");
    
    setIsSubmitting(true);
    try {
      await apiUsuarios.register(formData);
      setIsModalOpen(false);
      setFormData({ ...formData, name: "", email: "", identification: "", phone: "", address: "", entidad_id: "", sedes: [] });
      fetchData(); 
    } catch (error) {
      console.error("Error al registrar usuario:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStateChange = async (userId: string, currentState: string) => {
    const newState = currentState === 'active' ? 'inactive' : 'active';
    try {
      await apiUsuarios.updateState(userId, newState);
      fetchData(); 
    } catch (error) {
      console.error("Error al actualizar estado:", error);
    }
  };

  const entidadSeleccionadaEnForm = entidades.find(e => e._id === formData.entidad_id);
  const idSedeSeleccionada = formData.sedes.length > 0 ? formData.sedes[0].id_sede : "";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">Administra el personal y sus asignaciones a entidades y sedes.</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2"><UserPlus size={18} /> Nuevo Usuario</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registrar Personal</DialogTitle></DialogHeader>
            <form onSubmit={handleRegister} className="space-y-4 py-4">
              
              {/* Formulario mantenido intacto */}
              <div className="p-4 bg-muted/30 rounded-lg border border-primary/20 space-y-4 mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-primary">
                  <Building2 size={16} /> Asignación de Permisos
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entidad_id">Entidad Principal</Label>
                    <select id="entidad_id" name="entidad_id" value={formData.entidad_id} onChange={handleEntidadChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">-- Seleccionar Entidad --</option>
                      {entidades.map(ent => (
                        <option key={ent._id} value={ent._id}>{ent.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="rol">Rol del Usuario</Label>
                    <select id="rol" name="rol" value={formData.rol} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="user">Usuario Regular</option>
                      <option value="sedeAdmin">Admin de Sede</option>
                      <option value="entidadAdmin">Admin de Entidad</option>
                    </select>
                  </div>
                </div>

                {entidadSeleccionadaEnForm && formData.rol !== 'entidadAdmin' && (
                  <div className="space-y-2 pt-2 border-t border-dashed">
                    <Label htmlFor="sede_id">Asignar a Sede Específica</Label>
                    <select id="sede_id" value={idSedeSeleccionada} onChange={handleSedeChange} required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="">-- Seleccionar Sede --</option>
                      {entidadSeleccionadaEnForm.sedes.map((sede: Sede) => (
                        <option key={sede._id} value={sede._id}>{sede.name} ({sede.city})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre Completo</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 space-y-2">
                  <Label htmlFor="identification_type">Tipo Doc.</Label>
                  <select id="identification_type" name="identification_type" value={formData.identification_type} onChange={handleInputChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="NIT">NIT</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="identification">Número de Identificación</Label>
                  <Input id="identification" name="identification" value={formData.identification} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Registrando..." : "Guardar Usuario"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40"><p className="text-muted-foreground animate-pulse">Cargando datos...</p></div>
      ) : (
        <div className="flex flex-col space-y-4">
          {users.map((user) => {
            const userEntidad = entidades.find(e => e._id === user.entidad_id);
            const userSede = userEntidad?.sedes?.find(s => s._id === user.sedes?.[0]?.id_sede);
            const idArea = user.sedes?.[0]?.areas?.[0]?.id_area;
            const userArea = userSede?.areas?.find(a => a._id === idArea);

            return (
              <div 
                key={user._id} 
                className={`flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-card border rounded-lg shadow-sm gap-4 transition-all ${user.state === 'inactive' ? 'opacity-70 grayscale-[30%] bg-muted/40' : 'hover:shadow-md'}`}
              >
                {/* 1. INFORMACIÓN PERSONAL */}
                <div className="flex-1 space-y-1 w-full md:w-auto">
                  <h3 className="text-lg font-semibold">{user.profile?.name || "Sin nombre"}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Fingerprint size={14}/> {user.profile?.identification_type} {user.profile?.identification}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail size={14} /> {user.registro?.email}
                    </span>
                    {user.profile?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={14} /> {user.profile.phone}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* 2. JERARQUÍA / ASIGNACIÓN */}
                <div className="flex-1 w-full md:w-auto md:border-l md:px-6 space-y-1.5 py-2 md:py-0 border-y md:border-y-0">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 size={16} className="text-primary" />
                    <span className="font-medium">{userEntidad?.name || "Entidad no encontrada"}</span>
                  </div>
                  {userSede && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin size={16} className="text-orange-500" />
                      <span>{userSede.name}</span>
                    </div>
                  )}
                  {userArea && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Layers size={16} className="text-blue-500" />
                      <span>{userArea.name}</span>
                    </div>
                  )}
                </div>

                {/* 3. CONTROLES (ESTADO Y ROL) */}
                <div className="flex flex-row md:flex-col items-center justify-between md:items-end md:justify-center gap-3 w-full md:w-auto md:border-l md:pl-6">
                  
                  {/* Selector de Rol */}
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-muted-foreground"/>
                    <select 
                      className="text-sm bg-background border rounded px-2 py-1 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                      value={user.rol}
                      onChange={async (e) => {
                        await apiUsuarios.updateRol(user._id, e.target.value);
                        fetchData();
                      }}
                    >
                      <option value="user">Usuario</option>
                      <option value="sedeAdmin">Admin Sede</option>
                      <option value="entidadAdmin">Admin Entidad</option>
                      <option value="superAdmin">Super Admin</option>
                    </select>
                  </div>

                  {/* Botón de Activo/Inactivo */}
                  <button 
                    onClick={() => handleStateChange(user._id, user.state)}
                    title={user.state === 'active' ? 'Clic para suspender' : 'Clic para activar'}
                    className={`px-3 py-1 text-xs font-bold uppercase rounded-full border cursor-pointer transition-colors w-full md:w-auto text-center ${
                      user.state === 'active' 
                        ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
                        : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                    }`}
                  >
                    {user.state === 'active' ? 'Activo' : 'Inactivo'}
                  </button>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
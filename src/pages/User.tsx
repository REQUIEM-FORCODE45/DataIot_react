import React, { useEffect, useState } from "react";
import { UserPlus, Shield, Mail, Phone, Fingerprint, Building2, MapPin, Layers, Pencil, Plus, Trash2 } from "lucide-react";

import { apiUsuarios, type UserData, type UserSede } from "@/api/Users";
import { apiEntidades } from "@/api/Sedes";
import type { Entidad, Sede } from "@/types/entidad";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/hooks/usePermissions";

export const User = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [entidades, setEntidades] = useState<Entidad[]>([]); 
  const [loading, setLoading] = useState(true);
  const { canViewUsers, canEditUsers, filterEntitiesByAccess } = usePermissions();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
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

  const [editFormData, setEditFormData] = useState({
    profile: {
      name: "",
      phone: "",
      address: "",
    },
    entidad_id: "",
    rol: "user",
    state: "active",
    sedes: [] as UserSede[],
  });

  const [newAreaData, setNewAreaData] = useState({ id_sede: "", name: "" });
  const [newSedeData, setNewSedeData] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, entidadesData] = await Promise.all([
        apiUsuarios.getAll(),
        apiEntidades.getAll()
      ]);
      setUsers(canViewUsers ? usersData : []);
      setEntidades(filterEntitiesByAccess(entidadesData));
    } catch (error) {
      console.error("Error al obtener datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [canViewUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "entidad_id" || name === "rol" || name === "state") {
      setEditFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      setEditFormData((prev) => ({ ...prev, profile: { ...prev.profile, [name]: value } }));
    }
  };

  const handleEntidadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ 
      ...prev, 
      entidad_id: e.target.value,
      sedes: [] 
    }));
  };

  const handleEditEntidadChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const entidadId = e.target.value;
    setEditFormData((prev) => ({ 
      ...prev, 
      entidad_id: entidadId,
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
      setFormData({ name: "", email: "", identification_type: "CC", identification: "", phone: "", address: "", rol: "user", entidad_id: "", sedes: [] });
      fetchData(); 
    } catch (error) {
      console.error("Error al registrar usuario:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStateChange = async (userId: string, currentState: string) => {
    if (!canEditUsers) return;
    const newState = currentState === 'active' ? 'inactive' : 'active';
    try {
      await apiUsuarios.updateState(userId, newState);
      fetchData(); 
    } catch (error) {
      console.error("Error al actualizar estado:", error);
    }
  };

  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    setEditFormData({
      profile: {
        name: user.profile?.name || "",
        phone: user.profile?.phone || "",
        address: user.profile?.address || "",
      },
      entidad_id: user.entidad_id || "",
      rol: user.rol || "user",
      state: user.state || "active",
      sedes: user.sedes || [],
    });
    setNewAreaData({ id_sede: "", name: "" });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser || !canEditUsers) return;
    setIsSubmitting(true);
    try {
      await apiUsuarios.updateUser(editingUser._id, {
        profile: editFormData.profile,
        entidad_id: editFormData.entidad_id,
        rol: editFormData.rol,
        state: editFormData.state,
      });
      
      if (editFormData.entidad_id) {
        const formattedSedes = editFormData.sedes
          .filter(s => s.id_sede)
          .map(sede => ({
            id_sede: sede.id_sede || "",
            name: sede.name || "",
            areas: (sede.areas || []).map(a => ({
              id_area: a.id_area || a._id || "",
              name: a.name
            }))
          }));
        
        if (formattedSedes.length > 0) {
          await apiUsuarios.updateUserSedes(editingUser._id, formattedSedes);
        }
      }
      
      setIsEditModalOpen(false);
      setEditingUser(null);
      fetchData();
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddArea = async () => {
    if (!editingUser || !newAreaData.id_sede || !newAreaData.name) return;
    setIsSubmitting(true);
    try {
      const entidad = entidades.find(e => e._id === editFormData.entidad_id);
      const sede = entidad?.sedes.find(s => s._id === newAreaData.id_sede);
      const area = sede?.areas.find(a => a.name === newAreaData.name);
      
      const areaData = {
        id_sede: newAreaData.id_sede,
        name: newAreaData.name,
        ...(area ? { id_area: area._id } : {})
      };
      
      await apiUsuarios.addUserArea(editingUser._id, areaData);
      
      const updatedSedes = [...editFormData.sedes];
      const sedeIndex = updatedSedes.findIndex(s => s.id_sede === newAreaData.id_sede);
      if (sedeIndex >= 0) {
        updatedSedes[sedeIndex].areas.push({ name: newAreaData.name, id_area: area?._id });
      } else {
        updatedSedes.push({ 
          name: sede?.name || "", 
          id_sede: newAreaData.id_sede, 
          areas: [{ name: newAreaData.name, id_area: area?._id }] 
        });
      }
      setEditFormData(prev => ({ ...prev, sedes: updatedSedes }));
      setNewAreaData({ id_sede: "", name: "" });
      fetchData();
    } catch (error) {
      console.error("Error al agregar área:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteArea = async (sedeId: string, areaId: string) => {
    if (!editingUser || !canEditUsers) return;
    setIsSubmitting(true);
    try {
      await apiUsuarios.deleteUserArea(editingUser._id, { id_sede: sedeId, id_area: areaId });
      const updatedSedes = editFormData.sedes.map(sede => {
        if (sede.id_sede === sedeId) {
          return { ...sede, areas: sede.areas.filter(a => a.id_area !== areaId && a._id !== areaId) };
        }
        return sede;
      }).filter(s => s.areas.length > 0);
      setEditFormData(prev => ({ ...prev, sedes: updatedSedes }));
      fetchData();
    } catch (error) {
      console.error("Error al eliminar área:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const entidadSeleccionadaEnForm = entidades.find(e => e._id === formData.entidad_id);
  const editEntidadSeleccionada = entidades.find(e => e._id === editFormData.entidad_id);
  const idSedeSeleccionada = formData.sedes.length > 0 ? formData.sedes[0].id_sede : "";

  if (!canViewUsers) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="rounded-[12px] border border-dashed border-black/10 p-8 text-center text-[#64748b]">
          No tienes permisos para gestionar usuarios.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#00554f] font-medium">Administración</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b] mt-1">Gestión de Usuarios</h1>
          <p className="text-[#64748b] mt-1">Administra el personal y sus asignaciones a entidades y sedes.</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-[#00554f] hover:bg-[#004a45] text-white rounded-[10px]"><UserPlus size={18} /> Nuevo Usuario</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registrar Personal</DialogTitle></DialogHeader>
            <form onSubmit={handleRegister} className="space-y-4 py-4">
              
              {/* Formulario mantenido intacto */}
              <div className="p-4 bg-muted/30 rounded-lg border border-[#00554f]/20 space-y-4 mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-[#00554f]">
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
                  <Button type="submit" disabled={isSubmitting} className="bg-[#00554f] hover:bg-[#004a45] text-white">
                    {isSubmitting ? "Registrando..." : "Guardar Usuario"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="text-[#1e293b]">Editar Usuario</DialogTitle></DialogHeader>
            {editingUser && (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-muted/30 rounded-lg border border-[#00554f]/20 space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-[#00554f]">
                    <Building2 size={16} /> Información Personal
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_name">Nombre Completo</Label>
                      <Input id="edit_name" name="name" value={editFormData.profile.name} onChange={handleEditInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit_phone">Teléfono</Label>
                      <Input id="edit_phone" name="phone" value={editFormData.profile.phone} onChange={handleEditInputChange} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit_address">Dirección</Label>
                    <Input id="edit_address" name="address" value={editFormData.profile.address} onChange={handleEditInputChange} />
                  </div>
                </div>

                {canEditUsers && (
                  <div className="p-4 bg-muted/30 rounded-lg border border-[#00554f]/20 space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-[#00554f]">
                      <Shield size={16} /> Configuración de Acceso
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit_entidad_id">Entidad</Label>
                        <select id="edit_entidad_id" name="entidad_id" value={editFormData.entidad_id} onChange={handleEditEntidadChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option value="">-- Seleccionar --</option>
                          {entidades.map(ent => (
                            <option key={ent._id} value={ent._id}>{ent.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_rol">Rol</Label>
                        <select id="edit_rol" name="rol" value={editFormData.rol} onChange={handleEditInputChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option value="user">Usuario Regular</option>
                          <option value="sedeAdmin">Admin de Sede</option>
                          <option value="entidadAdmin">Admin de Entidad</option>
                          <option value="superAdmin">Super Admin</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit_state">Estado</Label>
                        <select id="edit_state" name="state" value={editFormData.state} onChange={handleEditInputChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                          <option value="active">Activo</option>
                          <option value="inactive">Inactivo</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {canEditUsers && editEntidadSeleccionada && (
                  <div className="p-4 bg-muted/30 rounded-lg border border-[#00554f]/20 space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-[#00554f]">
                      <MapPin size={16} /> Sedes Asignadas
                    </h3>
                    
                    {editFormData.sedes.length > 0 ? (
                      <div className="space-y-2">
                        {editFormData.sedes.map((sede, sedeIdx) => (
                          <div key={sedeIdx} className="flex items-center justify-between bg-white border rounded-md px-3 py-2">
                            <span className="text-sm font-medium">{sede.name || sede.id_sede}</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              onClick={() => {
                                const updatedSedes = editFormData.sedes.filter((_, idx) => idx !== sedeIdx);
                                setEditFormData(prev => ({ ...prev, sedes: updatedSedes }));
                              }}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay sedes asignadas</p>
                    )}

                    <div className="flex gap-2">
                      <select 
                        value={newSedeData} 
                        onChange={(e) => setNewSedeData(e.target.value)}
                        className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">-- Agregar Sede --</option>
                        {editEntidadSeleccionada.sedes
                          .filter(s => !editFormData.sedes.some(us => us.id_sede === s._id))
                          .map((sede) => (
                            <option key={sede._id} value={sede._id}>{sede.name}</option>
                          ))}
                      </select>
                      <Button 
                        type="button" 
                        onClick={() => {
                          if (!newSedeData) return;
                          const sede = editEntidadSeleccionada.sedes.find(s => s._id === newSedeData);
                          if (sede) {
                            setEditFormData(prev => ({ 
                              ...prev, 
                              sedes: [...prev.sedes, { id_sede: sede._id, name: sede.name, areas: [] }] 
                            }));
                            setNewSedeData("");
                          }
                        }}
                        disabled={!newSedeData}
                        className="bg-[#00554f] hover:bg-[#004a45] text-white"
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>
                )}

                {canEditUsers && editEntidadSeleccionada && editFormData.sedes.length > 0 && (
                  <div className="p-4 bg-muted/30 rounded-lg border border-[#00554f]/20 space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-[#00554f]">
                      <Layers size={16} /> Áreas Asignadas
                    </h3>
                    
                    {editFormData.sedes.map((sede, sedeIdx) => (
                      <div key={sedeIdx} className="border rounded-md p-3 bg-white">
                        <p className="text-xs font-semibold text-[#00554f] mb-2">
                          {editEntidadSeleccionada.sedes.find(s => s._id === sede.id_sede)?.name || sede.id_sede}
                        </p>
                        <div className="space-y-1">
                          {sede.areas.map((area, areaIdx) => (
                            <div key={areaIdx} className="flex items-center justify-between bg-muted/30 rounded px-2 py-1">
                              <span className="text-sm">{area.name}</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteArea(sede.id_sede!, area.id_area || area._id || "")}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="flex gap-2 items-end">
                      <div className="flex-1 space-y-1">
                        <Label htmlFor="new_area_sede">Sede</Label>
                        <select 
                          id="new_area_sede" 
                          value={newAreaData.id_sede} 
                          onChange={(e) => setNewAreaData(prev => ({ ...prev, id_sede: e.target.value, name: "" }))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">-- Seleccionar Sede --</option>
                          {editEntidadSeleccionada.sedes.map((sede: Sede) => (
                            <option key={sede._id} value={sede._id}>{sede.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label htmlFor="new_area_name">Área</Label>
                        <select 
                          id="new_area_name" 
                          value={newAreaData.name} 
                          onChange={(e) => setNewAreaData(prev => ({ ...prev, name: e.target.value }))}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          disabled={!newAreaData.id_sede}
                        >
                          <option value="">-- Seleccionar Área --</option>
                          {newAreaData.id_sede && editEntidadSeleccionada.sedes.find(s => s._id === newAreaData.id_sede)?.areas.map((area) => (
                            <option key={area._id} value={area.name}>{area.name}</option>
                          ))}
                        </select>
                      </div>
                      <Button 
                        type="button" 
                        onClick={handleAddArea}
                        disabled={!newAreaData.id_sede || !newAreaData.name || isSubmitting}
                        className="bg-[#00554f] hover:bg-[#004a45] text-white"
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                  <Button type="button" onClick={handleSaveEdit} disabled={isSubmitting} className="bg-[#00554f] hover:bg-[#004a45] text-white">
                    {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

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
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{user.profile?.name || "Sin nombre"}</h3>
                    {canEditUsers && (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-[#00554f]" onClick={() => openEditModal(user)}>
                        <Pencil size={14} />
                      </Button>
                    )}
                  </div>
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
                    <Building2 size={16} className="text-[#00554f]" />
                    <span className="font-medium">{userEntidad?.name || "Entidad no encontrada"}</span>
                  </div>
                  {userSede && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin size={16} className="text-[#00554f]" />
                      <span>{userSede.name}</span>
                    </div>
                  )}
                  {userArea && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Layers size={16} className="text-[#00554f]" />
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
                      className="text-sm bg-background border rounded px-2 py-1 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#00554f]"
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

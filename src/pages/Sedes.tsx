import React, { useEffect, useState } from "react";
import { Building2, PlusCircle, Mail, Phone, MapPin, Pencil } from "lucide-react";
import { apiEntidades } from "@/api/Sedes";
import type { Entidad } from "@/types/entidad";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";

export const Sedes = () => {
  const navigate = useNavigate();
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deleteEntidad, setDeleteEntidad] = useState<Entidad | null>(null);
  const { filterEntitiesByAccess, isSuperAdmin, canEditSites } = usePermissions();

  const [formData, setFormData] = useState({
    name: "",
    nit: "",
    verif: "",
    email: "",
    phone: "",
  });
  const [editingEntidad, setEditingEntidad] = useState<Entidad | null>(null);

  const fetchEntidades = async () => {
    setLoading(true);
    try {
      const data = await apiEntidades.getAll();
      setEntidades(filterEntitiesByAccess(data));
    } catch (error) {
      console.error("Error al obtener entidades:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntidades();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiEntidades.register(formData);
      setIsModalOpen(false);
      setFormData({ name: "", nit: "", verif: "", email: "", phone: "" });
      fetchEntidades();
    } catch (error) {
      console.error("Error al registrar la entidad:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteEntidad?._id) return;
    try {
      await apiEntidades.deleteEntidad(deleteEntidad._id);
      setEntidades(entidades.filter(e => e._id !== deleteEntidad._id));
      setDeleteEntidad(null);
    } catch (error) {
      console.error("Error al eliminar entidad:", error);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntidad?._id) return;
    setIsSubmitting(true);
    try {
      await apiEntidades.updateEntidad(editingEntidad._id, formData);
      setIsModalOpen(false);
      setEditingEntidad(null);
      setFormData({ name: "", nit: "", verif: "", email: "", phone: "" });
      fetchEntidades();
    } catch (error) {
      console.error("Error al actualizar entidad:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#00554f] font-medium">Administración</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b] mt-1">Entidades y Sedes</h1>
          <p className="text-[#64748b] mt-1">Gestiona las entidades registradas y administra sus sedes, áreas y módulos.</p>
        </div>

{isSuperAdmin && (
          <Dialog open={isModalOpen} onOpenChange={(open) => {
            if (!open) {
              setEditingEntidad(null);
              setFormData({ name: "", nit: "", verif: "", email: "", phone: "" });
            }
            setIsModalOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-[#00554f] hover:bg-[#004a45] text-white rounded-[10px]">
                <PlusCircle size={18} />
                Nueva Entidad
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-[#1e293b]">
                  {editingEntidad ? "Editar Entidad" : "Registrar Nueva Entidad"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={editingEntidad ? handleEdit : handleRegister} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre de la Entidad</Label>
                  <Input id="name" name="name" placeholder="Ej. Sensotic SAS" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3 space-y-2">
                    <Label htmlFor="nit">NIT</Label>
                    <Input id="nit" name="nit" placeholder="900123456" value={formData.nit} onChange={handleInputChange} required />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label htmlFor="verif">D.V.</Label>
                    <Input id="verif" name="verif" placeholder="8" value={formData.verif} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input id="email" name="email" type="email" placeholder="contacto@empresa.com" value={formData.email} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono de contacto</Label>
                  <Input id="phone" name="phone" placeholder="310 000 0000" value={formData.phone} onChange={handleInputChange} />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsModalOpen(false);
                    setEditingEntidad(null);
                    setFormData({ name: "", nit: "", verif: "", email: "", phone: "" });
                  }}>Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-[#00554f] hover:bg-[#004a45] text-white">
                    {isSubmitting ? "Guardando..." : editingEntidad ? "Actualizar" : "Guardar Entidad"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-muted-foreground animate-pulse">Cargando entidades...</p>
        </div>
      ) : entidades.length === 0 ? (
        <div className="text-center p-10 border border-dashed rounded-lg bg-muted/20">
          <Building2 className="mx-auto h-12 w-12 text-[#00554f] opacity-50 mb-4" />
          <h3 className="text-lg font-medium text-[#1e293b]">No hay entidades registradas</h3>
          <p className="text-sm text-[#64748b] mt-1">Comienza agregando una nueva entidad al sistema.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {entidades.map((entidad) => (
            <Card key={entidad._id} className="hover:shadow-md transition-all flex flex-col group">
              <CardHeader className="pb-3 border-b relative">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#e7ecf2] flex items-center justify-center text-[#00554f]">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-lg leading-tight line-clamp-1 text-[#1e293b]" title={entidad.name}>{entidad.name}</CardTitle>
                    <p className="text-xs text-[#64748b] mt-1">NIT: {entidad.nit}-{entidad.verif}</p>
                  </div>
                </div>
                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      setEditingEntidad(entidad);
                      setFormData({
                        name: entidad.name || "",
                        nit: entidad.nit || "",
                        verif: entidad.verif || "",
                        email: entidad.email || "",
                        phone: entidad.phone || "",
                      });
                      setIsModalOpen(true);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-blue-100 text-blue-600 transition-opacity"
                    title="Editar entidad"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </CardHeader>
              <CardContent className="pt-4 flex-grow space-y-3">
                <div className="flex items-center gap-2 text-sm text-[#64748b]">
                  <Mail size={16} className="text-[#00554f]" />
                  <span className="truncate" title={entidad.email}>{entidad.email}</span>
                </div>
                {entidad.phone && (
                  <div className="flex items-center gap-2 text-sm text-[#64748b]">
                    <Phone size={16} className="text-[#00554f]" />
                    <span>{entidad.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-[#64748b]">
                  <MapPin size={16} className="text-[#00554f]" />
                  <span>{entidad.sedes?.length || 0} Sedes registradas</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0 pb-4 flex flex-col gap-2">
                {canEditSites && (
                  <Button className="w-full bg-[#00554f] hover:bg-[#004a45] text-white" onClick={() => navigate(`/entidades/${entidad._id}/sedes`)}>Administrar Sedes</Button>
                )}
                {isSuperAdmin && (
                  <Button variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50" onClick={() => setDeleteEntidad(entidad)}>Eliminar Entidad</Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!deleteEntidad} onOpenChange={(open) => !open && setDeleteEntidad(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Eliminar Entidad</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de eliminar la entidad <strong>"{deleteEntidad?.name}"</strong>? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteEntidad(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
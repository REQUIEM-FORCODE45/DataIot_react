import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Asumiendo react-router-dom
import { Building, MapPin, PlusCircle, ArrowLeft, Network } from "lucide-react";

 // Ajusta la ruta a tu archivo sedes.ts
import { apiEntidades } from "@/api/Sedes";
import type { Sede } from "@/types/entidad";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";




export const AdminSedes = () => {
  const { id_entidad } = useParams<{ id_entidad: string }>();
  const navigate = useNavigate();

  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para el formulario de la nueva sede
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    department_code: "",
    city: "",
    city_code: "",
    address: "",
  });

  const fetchSedes = async () => {
    if (!id_entidad) return;
    setLoading(true);
    try {
      const data = await apiEntidades.getSedes(id_entidad);
      setSedes(data);
    } catch (error) {
      console.error("Error al obtener las sedes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSedes();
  }, [id_entidad]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSede = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id_entidad) return;
    
    setIsSubmitting(true);
    try {
      await apiEntidades.addSede(id_entidad, formData);
      setIsModalOpen(false);
      setFormData({ name: "", department: "", department_code: "", city: "", city_code: "", address: "" });
      fetchSedes(); // Recargamos la lista
    } catch (error) {
      console.error("Error al registrar la sede:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Botón para regresar y Encabezado */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Administrar Sedes</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las ubicaciones físicas de esta entidad.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Listado de Sedes</h2>

        {/* Modal para Nueva Sede */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle size={18} />
              Agregar Sede
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Sede</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddSede} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Sede</Label>
                <Input id="name" name="name" placeholder="Ej. Sede Principal" value={formData.name} onChange={handleInputChange} required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Input id="department" name="department" placeholder="Cundinamarca" value={formData.department} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department_code">Cód. Depto</Label>
                  <Input id="department_code" name="department_code" placeholder="11" value={formData.department_code} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad</Label>
                  <Input id="city" name="city" placeholder="Bogotá" value={formData.city} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city_code">Cód. Ciudad</Label>
                  <Input id="city_code" name="city_code" placeholder="11001" value={formData.city_code} onChange={handleInputChange} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" name="address" placeholder="Calle 123 #45-67" value={formData.address} onChange={handleInputChange} required />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar Sede"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid de Sedes */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-muted-foreground animate-pulse">Cargando sedes...</p>
        </div>
      ) : sedes.length === 0 ? (
        <div className="text-center p-10 border border-dashed rounded-lg bg-muted/20">
          <Building className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-medium">No hay sedes registradas</h3>
          <p className="text-sm text-muted-foreground mt-1">Registra la primera sede para esta entidad.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sedes.map((sede) => (
            <Card key={sede._id} className="hover:shadow-md transition-all">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin size={18} className="text-primary" />
                  {sede.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Ubicación:</strong> {sede.city}, {sede.department}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Dirección:</strong> {sede.address}
                </p>
                <div className="flex gap-4 mt-4 pt-2 border-t text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Network size={14} />
                    <span>{sede.host?.length || 0} Hosts</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Building size={14} />
                    <span>{sede.areas?.length || 0} Áreas</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 pb-4">
                <Button variant="secondary" className="w-full" onClick={() => navigate(`/entidades/${id_entidad}/sedes/${sede._id}`)}>
                  Administrar Áreas y Hosts
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
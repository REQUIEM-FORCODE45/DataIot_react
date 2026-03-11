import React, { useEffect, useState } from "react";
import { Building2, PlusCircle, Mail, Phone, MapPin } from "lucide-react";

// Importa tu servicio y tipos (ajusta las rutas según la estructura de tu proyecto)
import { apiEntidades } from "@/api/Sedes";
import type { Entidad } from "@/types/entidad";

// Componentes de Shadcn UI (ajusta las rutas según tu alias '@')
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";



export const Sedes = () => {
  const navigate = useNavigate();
  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Estado para el formulario de nueva entidad
  const [formData, setFormData] = useState({
    name: "",
    nit: "",
    verif: "",
    email: "",
    phone: "",
  });

  // Función para cargar las entidades desde el backend
  const fetchEntidades = async () => {
    setLoading(true);
    try {
      const data = await apiEntidades.getAll();
      setEntidades(data);
    } catch (error) {
      console.error("Error al obtener entidades:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntidades();
  }, []);

  // Manejador de cambios en los inputs del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Función para enviar el formulario y registrar la entidad
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiEntidades.register(formData);
      setIsModalOpen(false); // Cierra el modal si es exitoso
      setFormData({ name: "", nit: "", verif: "", email: "", phone: "" }); // Limpia el formulario
      fetchEntidades(); // Recarga la lista
    } catch (error) {
      console.error("Error al registrar la entidad:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Encabezado y Botón de Nueva Entidad */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entidades y Sedes</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las entidades registradas y administra sus sedes, áreas y módulos.
          </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <PlusCircle size={18} />
              Nueva Entidad
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Entidad</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleRegister} className="space-y-4 py-4">
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
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar Entidad"}
                </Button>
              </div>
            </form>

          </DialogContent>
        </Dialog>
      </div>

      {/* Grid de Entidades */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-muted-foreground animate-pulse">Cargando entidades...</p>
        </div>
      ) : entidades.length === 0 ? (
        <div className="text-center p-10 border border-dashed rounded-lg bg-muted/20">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-medium">No hay entidades registradas</h3>
          <p className="text-sm text-muted-foreground mt-1">Comienza agregando una nueva entidad al sistema.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {entidades.map((entidad) => (
            <Card key={entidad._id} className="hover:shadow-md transition-all flex flex-col">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-lg leading-tight line-clamp-1" title={entidad.name}>
                      {entidad.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      NIT: {entidad.nit}-{entidad.verif}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-grow space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail size={16} className="text-primary/70" />
                  <span className="truncate" title={entidad.email}>{entidad.email}</span>
                </div>
                {entidad.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone size={16} className="text-primary/70" />
                    <span>{entidad.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin size={16} className="text-primary/70" />
                  <span>{entidad.sedes?.length || 0} Sedes registradas</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0 pb-4">
              
                <Button variant="secondary" className="w-full" onClick={() => navigate(`/entidades/${entidad._id}/sedes`)}>
                    Administrar Sedes
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
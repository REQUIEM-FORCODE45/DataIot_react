import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Network, Layers, PlusCircle, Server, Cpu } from "lucide-react";

import { apiEntidades } from "@/api/Sedes";
import type { Sede, Area } from "@/types/entidad";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const AdminAreasHosts = () => {
  const { id_entidad, id_sede } = useParams<{ id_entidad: string; id_sede: string }>();
  const navigate = useNavigate();

  const [sede, setSede] = useState<Sede | null>(null);
  const [loading, setLoading] = useState(true);

  // Estados para modales
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [isModuloModalOpen, setIsModuloModalOpen] = useState(false);
  
  // Estado para saber a qué área le estamos agregando un módulo
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  // Estados para formularios
  const [hostData, setHostData] = useState({ host: "" });
  const [areaData, setAreaData] = useState({ name: "" });
  const [moduloData, setModuloData] = useState({
    ubicacion: "",
    host: "",
    type_modulo: "",
    modulo: "",
    id_modulo: "",
  });

  // Cargar datos de la sede actual
  const fetchSedeData = async () => {
    if (!id_entidad || !id_sede) return;
    setLoading(true);
    try {
      // Como el backend trae todas las sedes, filtramos la que necesitamos
      const sedes = await apiEntidades.getSedes(id_entidad);
      const sedeActual = sedes.find(s => s._id === id_sede);
      setSede(sedeActual || null);
    } catch (error) {
      console.error("Error al obtener detalles de la sede:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSedeData();
  }, [id_entidad, id_sede]);

  // Manejadores de envío (Submits)
  const handleAddHost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id_entidad || !id_sede) return;
    try {
      await apiEntidades.addHost(id_entidad, id_sede, hostData);
      setIsHostModalOpen(false);
      setHostData({ host: "" });
      fetchSedeData();
    } catch (error) {
      console.error("Error al registrar host:", error);
    }
  };

  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id_entidad || !id_sede) return;
    try {
      await apiEntidades.addArea(id_entidad, id_sede, areaData);
      setIsAreaModalOpen(false);
      setAreaData({ name: "" });
      fetchSedeData();
    } catch (error) {
      console.error("Error al registrar área:", error);
    }
  };

  const handleAddModulo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id_entidad || !id_sede || !selectedAreaId) return;
    try {
      await apiEntidades.addModulo(id_entidad, id_sede, selectedAreaId, moduloData);
      setIsModuloModalOpen(false);
      setModuloData({ ubicacion: "", host: "", type_modulo: "", modulo: "", id_modulo: "" });
      fetchSedeData();
    } catch (error) {
      console.error("Error al registrar módulo:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-muted-foreground animate-pulse">Cargando detalles de la sede...</p>
      </div>
    );
  }

  if (!sede) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold">Sede no encontrada</h2>
        <Button className="mt-4" onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Encabezado */}
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{sede.name}</h1>
          <p className="text-muted-foreground mt-1">
            {sede.address} | {sede.city}, {sede.department}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: GESTIÓN DE HOSTS */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Network size={20} className="text-primary" /> Hosts Autorizados
            </h2>
            
            <Dialog open={isHostModalOpen} onOpenChange={setIsHostModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex gap-2">
                  <PlusCircle size={16} /> Añadir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar Host</DialogTitle></DialogHeader>
                <form onSubmit={handleAddHost} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="host">Dirección IP o Dominio</Label>
                    <Input id="host" placeholder="Ej. 192.168.1.100" value={hostData.host} onChange={(e) => setHostData({ host: e.target.value })} required />
                  </div>
                  <Button type="submit" className="w-full">Guardar Host</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-4 space-y-2">
              {sede.host && sede.host.length > 0 ? (
                sede.host.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border text-sm">
                    <Server size={14} className="text-muted-foreground" /> {h}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No hay hosts registrados.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA DERECHA: GESTIÓN DE ÁREAS Y MÓDULOS */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Layers size={20} className="text-primary" /> Áreas y Módulos
            </h2>
            
            <Dialog open={isAreaModalOpen} onOpenChange={setIsAreaModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex gap-2">
                  <PlusCircle size={16} /> Nueva Área
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Crear Área</DialogTitle></DialogHeader>
                <form onSubmit={handleAddArea} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="areaName">Nombre del Área</Label>
                    <Input id="areaName" placeholder="Ej. Cuarto de Servidores" value={areaData.name} onChange={(e) => setAreaData({ name: e.target.value })} required />
                  </div>
                  <Button type="submit" className="w-full">Guardar Área</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {sede.areas && sede.areas.length > 0 ? (
              sede.areas.map((area: Area) => (
                <Card key={area._id} className="border shadow-sm">
                  <CardHeader className="bg-muted/20 py-3 border-b flex flex-row justify-between items-center">
                    <CardTitle className="text-lg">{area.name}</CardTitle>
                    
                    {/* Botón que abre el modal de Módulos guardando el ID del Área seleccionada */}
                    <Button variant="outline" size="sm" onClick={() => { setSelectedAreaId(area._id!); setIsModuloModalOpen(true); }}>
                      <PlusCircle size={14} className="mr-1" /> Añadir Sensor/Módulo
                    </Button>
                  </CardHeader>
                  
                  <CardContent className="p-4">
                    {area.modulos && area.modulos.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {area.modulos.map((mod, idx) => (
                          <div key={idx} className="p-3 border rounded-md flex items-start gap-3 bg-card">
                            <Cpu className="text-primary mt-1" size={18} />
                            <div>
                              <p className="font-medium text-sm">{mod.modulo} <span className="text-xs text-muted-foreground">({mod.id_modulo})</span></p>
                              <p className="text-xs text-muted-foreground mt-1">Tipo: {mod.type_modulo}</p>
                              <p className="text-xs text-muted-foreground">Ubicación: {mod.ubicacion}</p>
                              <p className="text-xs font-mono mt-1 px-1 bg-muted inline-block rounded">{mod.host}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-2">No hay módulos registrados en esta área.</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center p-8 border border-dashed rounded-lg bg-muted/20">
                <Layers className="mx-auto h-10 w-10 text-muted-foreground opacity-50 mb-3" />
                <p className="text-sm text-muted-foreground">No hay áreas registradas. Crea una para comenzar a añadir sensores.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL GLOBAL PARA AÑADIR MÓDULO (Sensor) */}
      <Dialog open={isModuloModalOpen} onOpenChange={setIsModuloModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Registrar Sensor/Módulo</DialogTitle></DialogHeader>
          <form onSubmit={handleAddModulo} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="modulo">Nombre del Módulo</Label>
              <Input id="modulo" placeholder="Ej. Sensor_Hum_01" value={moduloData.modulo} onChange={(e) => setModuloData({...moduloData, modulo: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id_modulo">ID Hardware (id_modulo)</Label>
                <Input id="id_modulo" placeholder="Ej. MOD-001" value={moduloData.id_modulo} onChange={(e) => setModuloData({...moduloData, id_modulo: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type_modulo">Tipo de Módulo</Label>
                <Input id="type_modulo" placeholder="Ej. Temperatura" value={moduloData.type_modulo} onChange={(e) => setModuloData({...moduloData, type_modulo: e.target.value})} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicación Específica</Label>
              <Input id="ubicacion" placeholder="Ej. Pasillo Norte" value={moduloData.ubicacion} onChange={(e) => setModuloData({...moduloData, ubicacion: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mod_host">Host Asignado</Label>
              <Input id="mod_host" placeholder="Ej. 192.168.1.100" value={moduloData.host} onChange={(e) => setModuloData({...moduloData, host: e.target.value})} required />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit">Guardar Sensor</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
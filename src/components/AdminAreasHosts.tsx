import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Network, Layers, PlusCircle, Server, Cpu, Trash2 } from "lucide-react";

import { Pencil } from "lucide-react";
import { apiEntidades } from "@/api/Sedes";
import { apiSensor } from "@/api/sensor";
import type { Sede, Area } from "@/types/entidad";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/hooks/usePermissions";

export const AdminAreasHosts = () => {
  const { id_entidad, id_sede } = useParams<{ id_entidad: string; id_sede: string }>();
  const navigate = useNavigate();

  const [sede, setSede] = useState<Sede | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [entidadName, setEntidadName] = useState("");
  const { canEditSites, canAccessEntity, allowedSedeIds, isSuperAdmin, isEntidadAdmin } = usePermissions();

  const [selectedTipoSensor, setSelectedTipoSensor] = useState<"MT" | "MA" | "ME">("MT");

  const tipoSensorMap = { MT: "Temperatura", MA: "Ambiente", ME: "Energía" };

  const generateUniqueIdModulo = async (tipo: string, entidad: string): Promise<string> => {
    const siglas = entidad.split(/\s+/).map(w => w[0]).join("").slice(0, 5).toUpperCase();
    let counter = 1;
    let id = `${tipo}_${siglas}_${String(counter).padStart(3, "0")}`;
    
    while (await apiSensor.checkModuloId(id)) {
      counter++;
      id = `${tipo}_${siglas}_${String(counter).padStart(3, "0")}`;
    }
    
    return id;
  };

  // Estados para modales
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [isModuloModalOpen, setIsModuloModalOpen] = useState(false);
  
  // Estado para saber a qué área le estamos agregando un módulo
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  // Estado para edición de módulo
  const [editingModulo, setEditingModulo] = useState<null | { id_modulo: string; modulo: string; ubicacion: string; host: string; type_modulo: string }>(null);

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
      if (!canEditSites || !canAccessEntity(id_entidad)) {
        setAccessDenied(true);
        setSede(null);
        return;
      }
      if (!isSuperAdmin && !isEntidadAdmin && !allowedSedeIds.includes(id_sede)) {
        setAccessDenied(true);
        setSede(null);
        return;
      }
      // Como el backend trae todas las sedes, filtramos la que necesitamos
      const [sedes, entidad] = await Promise.all([
        apiEntidades.getSedes(id_entidad),
        apiEntidades.getEntidad(id_entidad),
      ]);
      const sedeActual = sedes.find(s => s._id === id_sede);
      setSede(sedeActual || null);
      setEntidadName(entidad.name);
      setAccessDenied(false);
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

  const handleDeleteModulo = async (moduloId: string) => {
    if (!id_entidad || !id_sede || !selectedAreaId) return;
    try {
      const response = await apiSensor.deleteModulo(moduloId);
      console.log("Respuesta al eliminar módulo:", response);
      fetchSedeData();
    } catch (error) {
      console.error("Error al eliminar módulo:", error);
    }
  };

  const handleOpenEditModulo = (areaId: string, mod: { id_modulo: string; modulo: string; ubicacion: string; host: string; type_modulo: string }) => {
    setSelectedAreaId(areaId);
    setEditingModulo(mod);
    setModuloData({
      ubicacion: mod.ubicacion,
      host: mod.host || "0.0.0.0",
      type_modulo: mod.type_modulo,
      modulo: mod.modulo,
      id_modulo: mod.id_modulo,
    });
    setIsModuloModalOpen(true);
  };

  const handleEditModulo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModulo) return;
    try {
      const response = await apiSensor.updateSensorModule(editingModulo.id_modulo, {
        module: moduloData.modulo,
        ubicacion: moduloData.ubicacion,
        host: moduloData.host,
        tipo: moduloData.type_modulo,
      });
      console.log("Respuesta al editar módulo:", response);
      setIsModuloModalOpen(false);
      setEditingModulo(null);
      setModuloData({ ubicacion: "", host: "", type_modulo: "", modulo: "", id_modulo: "" });
      fetchSedeData();
    } catch (error) {
      console.error("Error al editar módulo:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-[#64748b] animate-pulse">Cargando detalles de la sede...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-[#1e293b]">No tienes permisos para esta sede</h2>
        <Button className="mt-4 bg-[#00554f] hover:bg-[#004a45] text-white" onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  if (!sede) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-[#1e293b]">Sede no encontrada</h2>
        <Button className="mt-4 bg-[#00554f] hover:bg-[#004a45] text-white" onClick={() => navigate(-1)}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Encabezado */}
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="text-[#00554f] hover:text-[#00554f]">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#00554f] font-medium">Administración</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#1e293b] mt-1">{sede.name}</h1>
          <p className="text-[#64748b] mt-1">
            {sede.address} | {sede.city}, {sede.department}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: GESTIÓN DE HOSTS */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-[#1e293b]">
              <Network size={20} className="text-[#00554f]" /> Hosts Autorizados
            </h2>
            
            <Dialog open={isHostModalOpen} onOpenChange={setIsHostModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex gap-2 text-[#00554f] border-[#00554f] hover:bg-[#00554f] hover:text-white">
                  <PlusCircle size={16} /> Añadir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="text-[#1e293b]">Registrar Host</DialogTitle></DialogHeader>
                <form onSubmit={handleAddHost} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="host" className="text-[#64748b]">Dirección IP o Dominio</Label>
                    <Input id="host" placeholder="Ej. 192.168.1.100" value={hostData.host} onChange={(e) => setHostData({ host: e.target.value })} required />
                  </div>
                  <Button type="submit" className="w-full bg-[#00554f] hover:bg-[#004a45] text-white">Guardar Host</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-[#00554f]/20">
            <CardContent className="p-4 space-y-2">
              {sede.host && sede.host.length > 0 ? (
                sede.host.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border text-sm">
                    <Server size={14} className="text-[#00554f]" /> <span className="text-[#1e293b]">{h}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#64748b] text-center py-4">No hay hosts registrados.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA DERECHA: GESTIÓN DE ÁREAS Y MÓDULOS */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-[#1e293b]">
              <Layers size={20} className="text-[#00554f]" /> Áreas y Módulos
            </h2>
            
            <Dialog open={isAreaModalOpen} onOpenChange={setIsAreaModalOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex gap-2 bg-[#00554f] hover:bg-[#004a45] text-white">
                  <PlusCircle size={16} /> Nueva Área
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="text-[#1e293b]">Crear Área</DialogTitle></DialogHeader>
                <form onSubmit={handleAddArea} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="areaName" className="text-[#64748b]">Nombre del Área</Label>
                    <Input id="areaName" placeholder="Ej. Cuarto de Servidores" value={areaData.name} onChange={(e) => setAreaData({ name: e.target.value })} required />
                  </div>
                  <Button type="submit" className="w-full bg-[#00554f] hover:bg-[#004a45] text-white">Guardar Área</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {sede.areas && sede.areas.length > 0 ? (
              sede.areas.map((area: Area) => (
                <Card key={area._id} className="border border-[#00554f]/20 shadow-sm">
                  <CardHeader className="bg-[#f8fafc] py-3 border-b flex flex-row justify-between items-center">
                    <CardTitle className="text-lg text-[#1e293b]">{area.name}</CardTitle>
                    
                    <Button variant="outline" size="sm" className="border-[#00554f] text-[#00554f] hover:bg-[#00554f] hover:text-white" onClick={async () => { 
                      setSelectedAreaId(area._id!);
                      setSelectedTipoSensor("MT");
                      const newId = await generateUniqueIdModulo("MT", entidadName);
                      setModuloData({
                        ubicacion: "",
                        host: "0.0.0.0",
                        type_modulo: tipoSensorMap.MT,
                        modulo: "",
                        id_modulo: newId,
                      });
                      setIsModuloModalOpen(true);
                    }}>
                      <PlusCircle size={14} className="mr-1" /> Añadir Sensor/Módulo
                    </Button>
                  </CardHeader>
                  
                  <CardContent className="p-4">
                    {area.modulos && area.modulos.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {area.modulos.map((mod, idx) => (
                          <div key={idx} className="p-3 border rounded-md flex items-start gap-3 bg-card relative group">
                            <Cpu className="text-[#00554f] mt-1" size={18} />
                            <div className="flex-1">
                              <p className="font-medium text-sm text-[#1e293b]">{mod.modulo} <span className="text-xs text-[#64748b]">({mod.id_modulo})</span></p>
                              <p className="text-xs text-[#64748b] mt-1">Tipo: {mod.type_modulo}</p>
                              <p className="text-xs text-[#64748b]">Ubicación: {mod.ubicacion}</p>
                              <p className="text-xs font-mono mt-1 px-1 bg-muted inline-block rounded">{mod.host}</p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedAreaId(area._id!);
                                handleDeleteModulo(mod.id_modulo);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-100 text-red-600 transition-opacity"
                              title="Eliminar módulo"
                            >
                              <Trash2 size={14} />
                            </button>
                            <button
                              onClick={() => handleOpenEditModulo(area._id!, mod)}
                              className="absolute top-2 right-10 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-blue-100 text-blue-600 transition-opacity"
                              title="Editar módulo"
                            >
                              <Pencil size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#64748b] text-center py-2">No hay módulos registrados en esta área.</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center p-8 border border-dashed rounded-lg bg-muted/20">
                <Layers className="mx-auto h-10 w-10 text-[#00554f] opacity-50 mb-3" />
                <p className="text-sm text-[#64748b]">No hay áreas registradas. Crea una para comenzar a añadir sensores.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL GLOBAL PARA AÑADIR/EDITAR MÓDULO (Sensor) */}
      <Dialog open={isModuloModalOpen} onOpenChange={(open) => {
        setIsModuloModalOpen(open);
        if (!open) {
          setEditingModulo(null);
          setModuloData({ ubicacion: "", host: "", type_modulo: "", modulo: "", id_modulo: "" });
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle className="text-[#1e293b]">{editingModulo ? "Editar Sensor/Módulo" : "Registrar Sensor/Módulo"}</DialogTitle></DialogHeader>
          <form onSubmit={editingModulo ? handleEditModulo : handleAddModulo} className="space-y-4 py-4">
            {!editingModulo && (
              <div className="space-y-2">
                <Label htmlFor="tipo_sensor" className="text-[#64748b]">Tipo de Sensor</Label>
                <select
                  id="tipo_sensor"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedTipoSensor}
                  onChange={async (e) => {
                    const tipo = e.target.value as "MT" | "MA" | "ME";
                    setSelectedTipoSensor(tipo);
                    const newId = await generateUniqueIdModulo(tipo, entidadName);
                    setModuloData(prev => ({
                      ...prev,
                      type_modulo: tipoSensorMap[tipo],
                      id_modulo: newId,
                    }));
                  }}
                >
                  <option value="MT">MT - Temperatura</option>
                  <option value="MA">MA - Ambiente</option>
                  <option value="ME">ME - Energía</option>
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id_modulo" className="text-[#64748b]">ID Hardware</Label>
                <Input id="id_modulo" value={moduloData.id_modulo} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type_modulo" className="text-[#64748b]">Tipo</Label>
                <Input id="type_modulo" value={moduloData.type_modulo} readOnly className="bg-muted" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="modulo" className="text-[#64748b]">Nombre del Módulo</Label>
              <Input id="modulo" placeholder="Ej.Sensor humedad sala" value={moduloData.modulo} onChange={(e) => setModuloData({...moduloData, modulo: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ubicacion" className="text-[#64748b]">Ubicación Específica</Label>
              <Input id="ubicacion" placeholder="Ej. Pasillo Norte" value={moduloData.ubicacion} onChange={(e) => setModuloData({...moduloData, ubicacion: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mod_host" className="text-[#64748b]">Host Asignado</Label>
              <Input id="mod_host" placeholder="Ej. 192.168.1.100" value={moduloData.host || "0.0.0.0"} onChange={(e) => setModuloData({...moduloData, host: e.target.value})} />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" className="bg-[#00554f] hover:bg-[#004a45] text-white">
                {editingModulo ? "Guardar Cambios" : "Guardar Sensor"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

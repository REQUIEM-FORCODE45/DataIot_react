import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiSensor, getSensorImageUrl } from "@/api/sensor";
import type { HojaVida } from "@/api/sensor";
import { ArrowLeft, Save, FileText, Upload } from "lucide-react";

const emptyHv: HojaVida = {
  nombre: "",
  marca: "",
  modelo: "",
  serial: "",
  area: "",
  instalacion: "",
  responsable: "",
  verificacion: "",
};

export const SensorHojaVida = () => {
  const { areaId, moduloId } = useParams<{ areaId: string; moduloId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hv, setHv] = useState<HojaVida>(emptyHv);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchSensor = async () => {
      if (!areaId || !moduloId) return;
      setLoading(true);
      try {
        const data = await apiSensor.getSensor(areaId, moduloId);
        if (data.sensor.hv) {
          setHv(data.sensor.hv);
          if (data.sensor.hv.image) {
            setImagePreview(getSensorImageUrl(data.sensor.hv.image));
          }
        }
      } catch (err: any) {
        console.error("Error al cargar sensor:", err);
        setError(err.response?.data?.message || "Error al cargar datos del sensor");
      } finally {
        setLoading(false);
      }
    };
    fetchSensor();
  }, [areaId, moduloId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHv((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaId || !moduloId) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      console.log("Guardando hv:", hv);
      await apiSensor.updateHojaVida(areaId, moduloId, hv);
      console.log("HV guardada, imagen:", imageFile);

      if (imageFile) {
        console.log("Subiendo imagen...");
        await apiSensor.uploadImage(areaId, moduloId, imageFile);
        console.log("Imagen subida, recargando sensor...");
        const data = await apiSensor.getSensor(areaId, moduloId);
        console.log("Sensor recargado:", data);
        if (data.sensor.hv) {
          setHv(data.sensor.hv);
          setImagePreview(data.sensor.hv.image ? getSensorImageUrl(data.sensor.hv.image) : null);
        }
        setImageFile(null);
      }

      setSuccess(true);
      setTimeout(() => navigate(-1), 1500);
    } catch (err: any) {
      console.error("Error al guardar:", err);
      setError(err.response?.data?.message || err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="text-[#00554f] hover:text-[#00554f]">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#00554f] font-medium">Sensor</p>
          <h1 className="text-2xl font-bold tracking-tight text-[#1e293b]">Hoja de Vida</h1>
        </div>
      </div>

      <Card className="rounded-[12px] border border-black/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base text-[#1e293b] flex items-center gap-2">
            <FileText size={18} className="text-[#00554f]" />
            Características del Sensor
          </CardTitle>
          <p className="text-xs text-[#64748b]">
            Sensor: {moduloId} | Área: {areaId}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" name="nombre" value={hv.nombre} onChange={handleChange} placeholder="Nombre del sensor" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marca">Marca</Label>
                <Input id="marca" name="marca" value={hv.marca} onChange={handleChange} placeholder="Marca del equipo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Input id="modelo" name="modelo" value={hv.modelo} onChange={handleChange} placeholder="Modelo del equipo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serial">Serie</Label>
                <Input id="serial" name="serial" value={hv.serial} onChange={handleChange} placeholder="Número de serie" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Área</Label>
                <Input id="area" name="area" value={hv.area} onChange={handleChange} placeholder="Área de instalación" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsable">Responsable</Label>
                <Input id="responsable" name="responsable" value={hv.responsable} onChange={handleChange} placeholder="Responsable del equipo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instalacion">Fecha de Instalación</Label>
                <Input id="instalacion" name="instalacion" type="date" value={hv.instalacion} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="verificacion">Fecha de Verificación</Label>
                <Input id="verificacion" name="verificacion" type="date" value={hv.verificacion} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Imagen del Equipo</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {imagePreview ? (
                  <div className="space-y-3">
                    <img src={imagePreview} alt="Sensor" className="max-h-48 mx-auto rounded" />
                    <div className="flex justify-center">
                      <Input type="file" accept="image/*" onChange={handleImageChange} className="max-w-xs mx-auto hidden" id="image-input" />
                      <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("image-input")?.click()}>
                        Cambiar imagen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <Input type="file" accept="image/*" onChange={handleImageChange} className="max-w-xs mx-auto" />
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">{error}</div>
            )}

            {success && (
              <div className="p-3 rounded-md bg-green-50 text-green-600 text-sm">
                Hoja de vida guardada correctamente
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
              <Button type="submit" disabled={saving} className="bg-[#00554f] hover:bg-[#004a45] text-white gap-2">
                <Save size={16} />
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

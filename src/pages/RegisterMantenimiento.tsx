import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiSensor } from "@/api/sensor";
import { ArrowLeft, Wrench, Upload, Save, Clock } from "lucide-react";


export const RegisterMantenimiento = () => {
  const { areaId, moduloId } = useParams<{ areaId: string; moduloId: string }>();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    fechaMantenimiento: "",
    frecuenciaMantenimiento: "mensual",
    observacionesMantenimiento: "",
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      await apiSensor.addMantenimiento(areaId, moduloId, formData);
      
      if (imageFile) {
        await apiSensor.uploadImage(areaId, moduloId, imageFile);
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (err: any) {
      console.error("Error al guardar mantenimiento:", err);
      setError(err.response?.data?.message || "Error al guardar mantenimiento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="text-[#00554f] hover:text-[#00554f]">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#00554f] font-medium">Mantenimiento</p>
            <h1 className="text-2xl font-bold tracking-tight text-[#1e293b]">Registrar Mantenimiento</h1>
          </div>
        </div>
        {areaId && moduloId && (
          <Button 
            variant="outline" 
            onClick={() => navigate(`/mantenimiento/history/${areaId}/${moduloId}`)}
            className="text-[#00554f] border-[#00554f] hover:bg-[#00554f] hover:text-white gap-2"
          >
            <Clock size={16} />
            Ver Historial
          </Button>
        )}
      </div>

      <Card className="rounded-[12px] border border-black/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base text-[#1e293b] flex items-center gap-2">
            <Wrench size={18} className="text-[#00554f]" />
            Información del Mantenimiento
          </CardTitle>
          <p className="text-xs text-[#64748b]">
            Sensor: {moduloId} | Área: {areaId}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaMantenimiento">Fecha de Mantenimiento</Label>
                <Input 
                  id="fechaMantenimiento" 
                  name="fechaMantenimiento" 
                  type="date"
                  value={formData.fechaMantenimiento}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="frecuenciaMantenimiento">Frecuencia</Label>
                <select 
                  id="frecuenciaMantenimiento" 
                  name="frecuenciaMantenimiento"
                  value={formData.frecuenciaMantenimiento}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="diaria">Diaria</option>
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                  <option value="bimestral">Bimestral</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacionesMantenimiento">Observaciones</Label>
              <textarea 
                id="observacionesMantenimiento" 
                name="observacionesMantenimiento"
                value={formData.observacionesMantenimiento}
                onChange={handleInputChange}
                placeholder="Describe las actividades realizadas..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Imagen del Equipo</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {imagePreview ? (
                  <div className="space-y-2">
                    <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded" />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                    >
                      Cambiar imagen
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageChange}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-md bg-green-50 text-green-600 text-sm">
                Mantenimiento guardado correctamente
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
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

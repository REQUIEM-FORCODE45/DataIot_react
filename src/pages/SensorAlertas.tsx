import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiCommands } from "@/api/Commands";
import { ArrowLeft, Save, Bell, AlertTriangle } from "lucide-react";

const VALUE_OPTIONS = [
  { value: "temp", label: "Temperatura" },
  { value: "humidity", label: "Humedad" },
  { value: "co2", label: "CO2" },
  { value: "value1", label: "CO2 (value1)" },
  { value: "value2", label: "Temperatura (value2)" },
  { value: "value3", label: "Temp-CO2 (value3)" },
  { value: "value4", label: "Humedad (value4)" },
];

const emptyConfig = {
  value: "temp",
  minimo: 0,
  maximo: 100,
  alert: false,
  observacion: "",
};

export const SensorAlertas = () => {
  const { moduloId } = useParams<{ moduloId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState(emptyConfig);
  const [existingConfigId, setExistingConfigId] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!moduloId) return;
      setLoading(true);
      try {
        const response = await apiCommands.getSensorConfigs(moduloId);
        if (response.data.success && response.data.data.length > 0) {
          const existing = response.data.data[0];
          setConfig({
            value: existing.value || "temp",
            minimo: existing.minimo,
            maximo: existing.maximo,
            alert: existing.alert,
            observacion: existing.observacion || "",
          });
          setExistingConfigId(existing.id);
        }
      } catch (err: any) {
        console.error("Error al cargar config:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [moduloId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduloId) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await apiCommands.setSensorConfig({
        id_sensor: moduloId,
        ...config,
      });
      setSuccess(true);
      setTimeout(() => navigate(-1), 1500);
    } catch (err: any) {
      console.error("Error al guardar:", err);
      setError(err.response?.data?.message || "Error al guardar configuración");
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
          <h1 className="text-2xl font-bold tracking-tight text-[#1e293b]">Configurar Alertas</h1>
        </div>
      </div>

      <Card className="rounded-[12px] border border-black/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base text-[#1e293b] flex items-center gap-2">
            <Bell size={18} className="text-[#00554f]" />
            Límites y Alertas
          </CardTitle>
          <p className="text-xs text-[#64748b]">
            Sensor: {moduloId}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Variable</Label>
                <select
                  id="value"
                  name="value"
                  value={config.value}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {VALUE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="minimo">Valor Mínimo</Label>
                <Input
                  id="minimo"
                  name="minimo"
                  type="number"
                  value={config.minimo}
                  onChange={handleChange}
                  placeholder="Valor mínimo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maximo">Valor Máximo</Label>
                <Input
                  id="maximo"
                  name="maximo"
                  type="number"
                  value={config.maximo}
                  onChange={handleChange}
                  placeholder="Valor máximo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacion">Observación</Label>
                <Input
                  id="observacion"
                  name="observacion"
                  value={config.observacion}
                  onChange={handleChange}
                  placeholder="Descripción opcional"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg border border-black/10 bg-[#f8fafc]">
              <input
                type="checkbox"
                id="alert"
                name="alert"
                checked={config.alert}
                onChange={handleChange}
                className="h-5 w-5 rounded border-gray-300 text-[#00554f] focus:ring-[#00554f]"
              />
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className={config.alert ? "text-orange-500" : "text-gray-400"} />
                <Label htmlFor="alert" className="cursor-pointer">
                  Activar alertas cuando el valor esté fuera de los límites
                </Label>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-red-50 text-red-600 text-sm">{error}</div>
            )}

            {success && (
              <div className="p-3 rounded-md bg-green-50 text-green-600 text-sm">
                Configuración guardada correctamente
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

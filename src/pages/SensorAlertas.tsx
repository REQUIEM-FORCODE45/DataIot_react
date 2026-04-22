import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiCommands } from "@/api/Commands";
import { ArrowLeft, Save, Bell, AlertTriangle } from "lucide-react";
import type { SensorHistoryRecord } from "@/types/sensor";

const COMMON_VALUE_KEYS = ["value1", "value2", "value3", "value4", "temp"] as const;

const VALUE_KEY_LABELS: Record<string, string> = {
  value1: "CO2",
  value2: "Temperatura",
  value3: "Temp-CO2",
  value4: "Humedad",
  temp: "Temperatura",
};

const getValueLabel = (valueKey: string): string => VALUE_KEY_LABELS[valueKey] ?? valueKey;

const detectAvailableValueKeys = (records: SensorHistoryRecord[]): string[] => {
  const valueKeysSet = new Set<string>();
  
  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (key === "createAt" || key === "createdAt") continue;
      const value = record[key];
      if (typeof value === "number" || (!isNaN(Number(value)) && value !== null && value !== "")) {
        valueKeysSet.add(key);
      }
    }
  }
  
  return Array.from(valueKeysSet).sort((a, b) => {
    const aIdx = COMMON_VALUE_KEYS.indexOf(a as typeof COMMON_VALUE_KEYS[number]);
    const bIdx = COMMON_VALUE_KEYS.indexOf(b as typeof COMMON_VALUE_KEYS[number]);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.localeCompare(b);
  });
};

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
  const [detectedValueKeys, setDetectedValueKeys] = useState<string[]>([]);

  const valueOptions = useMemo(() => {
    if (detectedValueKeys.length === 0) {
      return [{ value: "temp", label: "Temperatura" }];
    }
    return detectedValueKeys.map((key) => ({ value: key, label: getValueLabel(key) }));
  }, [detectedValueKeys]);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!moduloId) return;
      setLoading(true);
      try {
        const historyResponse = await apiCommands.getSensorHistory(moduloId, 0);
        const availableKeys = detectAvailableValueKeys(historyResponse.data.data ?? []);
        setDetectedValueKeys(availableKeys);
        
        if (availableKeys.length > 0) {
          setConfig((prev) => ({ ...prev, value: availableKeys[0] }));
        }
        
        try {
          const configResponse = await apiCommands.getSensorConfigs(moduloId);
          if (configResponse.data.success && configResponse.data.data.length > 0) {
            const existing = configResponse.data.data[0];
            const savedValue = existing.value || "temp";
            setConfig({
              value: availableKeys.includes(savedValue) ? savedValue : (availableKeys[0] || "temp"),
              minimo: existing.minimo,
              maximo: existing.maximo,
              alert: existing.alert,
              observacion: existing.observacion || "",
            });
          }
        } catch (configErr) {
          console.log("No hay config guardada para este sensor");
        }
      } catch (err: any) {
        console.error("Error al cargar datos del sensor:", err);
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
                  {valueOptions.map((opt) => (
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

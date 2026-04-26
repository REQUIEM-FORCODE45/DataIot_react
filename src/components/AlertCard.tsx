import { memo, useState, useEffect } from "react";
import type { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiCommands } from "@/api/Commands";
import type { Modulo } from "@/types/entidad";
import { Bell, ChevronDown, AlertTriangle } from "lucide-react";

interface AlertHistoryItem {
  id_sensor: string;
  configValue: string;
  value: number;
  limit: number;
  alertType: "maximo" | "minimo";
  createAt: string;
  detectedAt: string;
}

const VALUE_KEY_LABELS: Record<string, string> = {
  value1: "CO2",
  value2: "Temperatura",
  value3: "Temp-CO2",
  value4: "Humedad",
  temp: "Temperatura",
};

const getValueLabel = (valueKey: string): string => VALUE_KEY_LABELS[valueKey] ?? valueKey;

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface AlertCardProps {
  module: Modulo;
  areaId?: string;
}

interface SensorAlertConfig {
  value: string;
  minimo: number;
  maximo: number;
  alert: boolean;
  observacion?: string;
}

export const AlertCard: FC<AlertCardProps> = memo(({ module }) => {
  const moduleId = module.id_modulo ?? module._id ?? module.modulo ?? "";
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<SensorAlertConfig[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [alertHistory, setAlertHistory] = useState<AlertHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hasAlerts, setHasAlerts] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!moduleId) return;
      setLoading(true);
      try {
        const [configRes, historyRes] = await Promise.all([
          apiCommands.getSensorConfigs(moduleId),
          apiCommands.getAlertHistory(moduleId, 10),
        ]);
        if (configRes.data.success && configRes.data.data.length > 0) {
          setConfigs(configRes.data.data);
          setSelectedValue(configRes.data.data[0].value);
        } else {
          setConfigs([]);
        }
        if (historyRes.data.success && historyRes.data.data.length > 0) {
          setAlertHistory(historyRes.data.data);
          setHasAlerts(true);
        } else {
          setAlertHistory([]);
          setHasAlerts(false);
        }
      } catch {
        setConfigs([]);
        setAlertHistory([]);
        setHasAlerts(false);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [moduleId]);

  const selectedConfig = configs.find((c) => c.value === selectedValue);

  const toggleAlert = async () => {
    if (!moduleId || !selectedConfig) return;
    const configKey = `${selectedConfig.value}`;
    setSaving(true);
    setSavingId(configKey);
    try {
      const newAlert = !selectedConfig.alert;
      await apiCommands.setSensorConfig({
        id_sensor: moduleId,
        value: selectedConfig.value,
        minimo: selectedConfig.minimo,
        maximo: selectedConfig.maximo,
        alert: newAlert,
        observacion: selectedConfig.observacion ?? "",
      });
      setConfigs((prev) =>
        prev.map((c) =>
          c.value === selectedConfig.value ? { ...c, alert: newAlert } : c
        )
      );
    } catch (err) {
      console.error("Error toggling alert:", err);
    } finally {
      setSaving(false);
      setSavingId(null);
    }
  };

  const openHistory = async () => {
    setShowHistory(true);
    if (alertHistory.length === 0) {
      setLoadingHistory(true);
      try {
        const res = await apiCommands.getAlertHistory(moduleId, 50);
        if (res.data.success) {
          setAlertHistory(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoadingHistory(false);
      }
    }
  };

  if (loading) {
    return (
      <Card className="rounded-[12px] border border-black/10 bg-white">
        <CardContent className="p-4">
          <div className="h-20 animate-pulse bg-[#f1f5f9] rounded" />
        </CardContent>
      </Card>
    );
  }

  if (configs.length === 0 && !loading) {
    return (
      <Card className="rounded-[12px] border border-black/10 bg-white">
        <CardHeader className="pb-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm font-semibold text-[#1e293b] truncate">
              {moduleId}
            </CardTitle>
            <p className="text-[11px] text-[#94a3b8] truncate">
              {module.modulo ?? "Sin etiqueta"}
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-4">
            <Bell size={24} className="mx-auto text-[#cbd5e1] mb-2" />
            <p className="text-xs text-[#94a3b8]">Sin alertas configuradas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="rounded-[12px] border border-black/10 bg-white">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm font-semibold text-[#1e293b] truncate">
                {moduleId}
              </CardTitle>
              <p className="text-[11px] text-[#94a3b8] truncate">
                {module.modulo ?? "Sin etiqueta"}
              </p>
            </div>
            {hasAlerts && (
              <button
                onClick={openHistory}
                className="flex items-center gap-1 rounded-full bg-[#fef2f2] px-2 py-1 text-[10px] font-medium text-[#dc2626] hover:bg-[#fee2e2]"
              >
                <AlertTriangle size={10} />
                <span>Ver historial</span>
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2.5">
          <div className="relative">
            <select
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
              className="w-full appearance-none rounded-[8px] border border-black/10 bg-white px-3 py-2 pr-8 text-sm font-medium text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#003d3a]/20"
            >
              {configs.map((config) => (
                <option key={config.value} value={config.value}>
                  {getValueLabel(config.value)}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none"
            />
          </div>

          {selectedConfig && (
            <div className="rounded-[8px] border border-black/5 bg-[#f8fafc] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#00554f]">
                  {getValueLabel(selectedConfig.value)}
                </span>
                <Button
                  size="sm"
                  variant={selectedConfig.alert ? "default" : "outline"}
                  onClick={toggleAlert}
                  disabled={saving || savingId === selectedConfig.value}
                  className={`h-6 px-2 gap-1 ${
                    selectedConfig.alert
                      ? "bg-[#00554f] hover:bg-[#004a45] text-white"
                      : "border border-black/10 text-[#64748b] hover:bg-[#f1f5f9]"
                  }`}
                >
                  {savingId === selectedConfig.value ? (
                    <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  ) : selectedConfig.alert ? (
                    <Bell size={10} />
                  ) : (
                    <Bell size={10} className="opacity-50" />
                  )}
                  <span className="text-[10px]">
                    {selectedConfig.alert ? "Activa" : "Inactiva"}
                  </span>
                </Button>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#94a3b8]">Min:</span>
                <span className="font-medium text-[#64748b]">{selectedConfig.minimo}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#94a3b8]">Max:</span>
                <span className="font-medium text-[#64748b]">{selectedConfig.maximo}</span>
              </div>
              {selectedConfig.observacion && (
                <p className="text-[9px] text-[#94a3b8] italic truncate">
                  {selectedConfig.observacion}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-[#dc2626]" />
              Historial de alertas - {moduleId}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {loadingHistory ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 animate-pulse bg-[#f1f5f9] rounded" />
                ))}
              </div>
            ) : alertHistory.length === 0 ? (
              <div className="text-center py-8 text-[#64748b]">
                <Bell size={32} className="mx-auto text-[#cbd5e1] mb-2" />
                <p className="text-sm">No hay alertas registradas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alertHistory.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`rounded-[8px] border p-3 ${
                      alert.alertType === "maximo"
                        ? "border-[#fecaca] bg-[#fef2f2]"
                        : "border-[#bfdbfe] bg-[#eff6ff]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-medium ${
                          alert.alertType === "maximo" ? "text-[#dc2626]" : "text-[#2563eb]"
                        }`}
                      >
                        {alert.alertType === "maximo" ? "Máximo" : "Mínimo"} excedido
                      </span>
                      <span className="text-[10px] text-[#94a3b8]">
                        {formatDate(alert.detectedAt)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-[#64748b]">Valor:</span>
                      <span className="font-semibold text-[#1e293b]">{alert.value}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#94a3b8]">Límite:</span>
                      <span className="font-medium text-[#64748b]">{alert.limit}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-[#94a3b8]">
                      Variable: {getValueLabel(alert.configValue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});
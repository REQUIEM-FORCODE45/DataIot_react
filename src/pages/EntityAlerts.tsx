import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiEntidades } from "@/api/Sedes";
import { apiCommands } from "@/api/Commands";
import { AlertCard } from "@/components/AlertCard";
import type { Entidad, Modulo } from "@/types/entidad";
import { usePermissions } from "@/hooks/usePermissions";
import { ArrowLeft, Layers, Bell, Building2, Search } from "lucide-react";

interface AlertHistoryItem {
  id_sensor: string;
  configValue: string;
  value: number;
  limit: number;
  alertType: "maximo" | "minimo";
  createAt: string;
  detectedAt: string;
}

type AlertAreaGroup = {
  areaId: string;
  areaName: string;
  sedeName?: string;
  modules: Array<{ module: Modulo }>;
};

const getModuleId = (module: Modulo, groupId: string, idx: number): string =>
  module.id_modulo ?? module._id ?? module.modulo ?? `${groupId}-${idx}`;

export const EntityAlerts = () => {
  const { entityId } = useParams<{ entityId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [entity, setEntity] = useState<Entidad | null>(null);
  const [loadingEntity, setLoadingEntity] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [showAlertsDialog, setShowAlertsDialog] = useState(false);
  const [areaAlerts, setAreaAlerts] = useState<AlertHistoryItem[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const { filterEntitiesByAccess } = usePermissions();

  const fetchEntity = useCallback(async () => {
    if (!entityId) return;
    setLoadingEntity(true);
    try {
      const data = await apiEntidades.getAll();
      const filtered = filterEntitiesByAccess(data);
      const found = filtered.find((e) => e._id === entityId) ?? null;
      setEntity(found);
    } finally {
      setLoadingEntity(false);
    }
  }, [entityId]);

  useEffect(() => {
    fetchEntity();
  }, [fetchEntity]);

  const sensorsByArea = useMemo<AlertAreaGroup[]>(() => {
    if (!entity) return [];
    const grouped: AlertAreaGroup[] = [];
    entity.sedes?.forEach((sede) => {
      sede.areas?.forEach((area) => {
        grouped.push({
          areaId: `${sede._id ?? sede.name}-${area._id ?? area.name}`,
          areaName: area.name,
          sedeName: sede.name,
          modules: area.modulos.map((module) => ({ module })),
        });
      });
    });
    return grouped;
  }, [entity]);

  useEffect(() => {
    if (sensorsByArea.length > 0) {
      const areaParam = searchParams.get("area");
      if (areaParam && sensorsByArea.some(a => a.areaId === areaParam)) {
        setSelectedAreaId(areaParam);
      } else if (!selectedAreaId) {
        setSelectedAreaId(sensorsByArea[0].areaId);
      }
    }
  }, [sensorsByArea, selectedAreaId, searchParams]);

  const currentAreaSensors = useMemo(() => {
    if (!selectedAreaId) return new Set<string>();
    const area = sensorsByArea.find(a => a.areaId === selectedAreaId);
    if (!area) return new Set<string>();
    return new Set(area.modules.map(m => m.module.id_modulo ?? m.module._id ?? m.module.modulo ?? ""));
  }, [sensorsByArea, selectedAreaId]);

  const fetchAreaAlerts = useCallback(async () => {
    if (currentAreaSensors.size === 0) return;
    setLoadingAlerts(true);
    try {
      const res = await apiCommands.getAllAlerts(10);
      if (res.data.success && res.data.data.length > 0) {
        const filteredAlerts = res.data.data.filter(alert => 
          currentAreaSensors.has(alert.id_sensor)
        );
        const uniqueBySensor = filteredAlerts.reduce<AlertHistoryItem[]>((acc, alert) => {
          if (!acc.some(a => a.id_sensor === alert.id_sensor)) {
            acc.push(alert);
          }
          return acc;
        }, []);
        if (uniqueBySensor.length > 0) {
          setAreaAlerts(uniqueBySensor);
          setShowAlertsDialog(true);
        }
      }
    } catch {
    } finally {
      setLoadingAlerts(false);
    }
  }, [currentAreaSensors]);

  useEffect(() => {
    if (selectedAreaId && entity) {
      fetchAreaAlerts();
    }
  }, [selectedAreaId, entity]);

  const visibleAreas = useMemo(() => {
    if (!selectedAreaId) return sensorsByArea;
    return sensorsByArea.filter((area) => area.areaId === selectedAreaId);
  }, [sensorsByArea, selectedAreaId]);

  const filteredSensorsByArea = useMemo(() => {
    if (!searchQuery.trim()) return visibleAreas;
    const query = searchQuery.toLowerCase();
    return visibleAreas
      .map((group) => ({
        ...group,
        modules: group.modules.filter((entry) => {
          const moduleId = entry.module.id_modulo ?? entry.module._id ?? entry.module.modulo ?? "";
          const moduleLabel = entry.module.modulo ?? "";
          return (
            moduleId.toLowerCase().includes(query) ||
            moduleLabel.toLowerCase().includes(query) ||
            group.areaName.toLowerCase().includes(query) ||
            (group.sedeName?.toLowerCase().includes(query) ?? false)
          );
        }),
      }))
      .filter((group) => group.modules.length > 0);
  }, [visibleAreas, searchQuery]);

  const filteredTotalModules = filteredSensorsByArea.reduce((sum, g) => sum + g.modules.length, 0);

  const totalModules = filteredTotalModules;
  const totalAreas = filteredSensorsByArea.length;
  const totalSedes = entity?.sedes?.length ?? 0;

  return (
    <>
      <div className="w-full max-w-[1400px] mx-auto px-2 min-w-0 space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/alerts")}
            className="text-[#00554f] hover:text-[#00554f] hover:bg-[#f1f5f9] rounded-[10px]"
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Alertas</p>
            <h1 className="text-xl font-semibold text-[#1e293b]">
              {loadingEntity ? "Cargando..." : entity?.name ?? "Entidad no encontrada"}
            </h1>
          </div>
        </div>

        <div className="rounded-[12px] border border-black/10 bg-[#e7ecf2] px-6 py-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-[12px] border border-black/10 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Sedes</p>
              <div className="flex items-center gap-2 text-2xl font-semibold text-[#00554f]">
                <Building2 size={20} />
                <span>{totalSedes}</span>
              </div>
            </article>
            <article className="rounded-[12px] border border-black/10 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Áreas</p>
              <div className="flex items-center gap-2 text-2xl font-semibold text-[#00554f]">
                <Layers size={20} />
                <span>{totalAreas}</span>
              </div>
            </article>
            <article className="rounded-[12px] border border-black/10 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Sensores</p>
              <div className="flex items-center gap-2 text-2xl font-semibold text-[#00554f]">
                <Bell size={20} />
                <span>{totalModules}</span>
              </div>
            </article>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" size={16} />
          <input
            type="text"
            placeholder="Buscar sensores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-[10px] border border-black/10 bg-white py-2 pl-9 pr-4 text-sm placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#003d3a]/20"
          />
        </div>

        {sensorsByArea.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {sensorsByArea.map((area) => (
              <button
                key={area.areaId}
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set("area", area.areaId);
                  navigate(`/alerts/${entityId}?${newParams.toString()}`, { replace: true });
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedAreaId === area.areaId
                    ? "bg-[#00554f] text-white"
                    : "bg-white border border-black/10 text-[#64748b] hover:bg-[#f1f5f9]"
                }`}
              >
                {area.areaName}
                <span className="ml-1 opacity-70">({area.modules.length})</span>
              </button>
            ))}
          </div>
        )}

        {loadingEntity ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-[12px]" />
            ))}
          </div>
        ) : !entity ? (
          <Card className="rounded-[12px] border border-dashed border-black/10 p-8 text-center text-[#64748b]">
            No tienes acceso a esta entidad.
          </Card>
        ) : filteredSensorsByArea.length === 0 ? (
          <Card className="rounded-[12px] border border-dashed border-black/10 p-8 text-center text-[#64748b]">
            {searchQuery ? "No se encontraron sensores que coincidan con la búsqueda." : "No hay sensores registrados para esta entidad."}
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredSensorsByArea.map((group, groupIndex) => (
              <section key={`${group.areaId}-${groupIndex}`} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Área</p>
                    <h3 className="text-base font-semibold text-[#1e293b] line-clamp-1" title={group.areaName}>
                      {group.areaName}
                    </h3>
                    {group.sedeName && (
                      <p className="text-[11px] text-[#94a3b8]">Sede: {group.sedeName}</p>
                    )}
                  </div>
                  <p className="text-xs text-[#64748b]">{group.modules.length} sensores</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.modules.map((entry, sensorIndex) => {
                    const moduleId = getModuleId(entry.module, group.areaId, sensorIndex);
                    return (
                      <AlertCard
                        key={moduleId}
                        module={entry.module}
                        areaId={group.areaId.split("-")[1]}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showAlertsDialog} onOpenChange={setShowAlertsDialog}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#dc2626]">
              <Bell size={18} />
              Alertas del área
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {loadingAlerts ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 animate-pulse bg-[#f1f5f9] rounded" />
                ))}
              </div>
            ) : areaAlerts.length === 0 ? (
              <div className="text-center py-8 text-[#64748b]">
                <Bell size={32} className="mx-auto text-[#cbd5e1] mb-2" />
                <p className="text-sm">No hay alertas registradas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {areaAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`rounded-[8px] border p-3 ${
                      alert.alertType === "maximo"
                        ? "border-[#fecaca] bg-[#fef2f2]"
                        : "border-[#bfdbfe] bg-[#eff6ff]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#1e293b]">
                        {alert.id_sensor}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          alert.alertType === "maximo"
                            ? "bg-[#dc2626] text-white"
                            : "bg-[#2563eb] text-white"
                        }`}
                      >
                        {alert.alertType === "maximo" ? "Máx" : "Mín"}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-sm">
                      <span className="text-[#64748b]">Valor:</span>
                      <span className="font-semibold text-[#dc2626]">{alert.value}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#94a3b8]">Límite:</span>
                      <span className="font-medium text-[#64748b]">{alert.limit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
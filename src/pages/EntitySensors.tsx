import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiCommands } from "@/api/Commands";
import { apiEntidades } from "@/api/Sedes";
import { SensorCard } from "@/components/SensorCard";
import type { Entidad, Modulo } from "@/types/entidad";
import type { SensorHistoryRecord } from "@/types/sensor";
import { usePermissions } from "@/hooks/usePermissions";
import { ArrowLeft, Layers, Cpu, Building2, Search } from "lucide-react";

type SensorAreaGroup = {
  areaId: string;
  areaName: string;
  sedeName?: string;
  modules: Array<{ module: Modulo }>;
};

const BATCH_SIZE = 3;
const BATCH_DELAY_MS = 150;

const getModuleId = (module: Modulo, groupId: string, idx: number): string =>
  module.id_modulo ?? module._id ?? module.modulo ?? `${groupId}-${idx}`;

export const EntitySensors = () => {
  const { entityId } = useParams<{ entityId: string }>();
  const navigate = useNavigate();
  const [entity, setEntity] = useState<Entidad | null>(null);
  const [loadingEntity, setLoadingEntity] = useState(false);
  const [historyMap, setHistoryMap] = useState<Record<string, SensorHistoryRecord[]>>({});
  const [loadingModules, setLoadingModules] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const batchRef = useRef(false);
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

  const sensorsByArea = useMemo<SensorAreaGroup[]>(() => {
    if (!entity) return [];
    const grouped: SensorAreaGroup[] = [];
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

  const filteredSensorsByArea = useMemo(() => {
    if (!searchQuery.trim()) return sensorsByArea;
    const query = searchQuery.toLowerCase();
    return sensorsByArea
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
  }, [sensorsByArea, searchQuery]);

  const filteredTotalModules = filteredSensorsByArea.reduce((sum, g) => sum + g.modules.length, 0);

  const allModuleIds = useMemo(() => {
    return sensorsByArea.flatMap((group) =>
      group.modules.map((entry, idx) =>
        getModuleId(entry.module, group.areaId, idx)
      )
    );
  }, [sensorsByArea]);

  const fetchHistoryBatch = useCallback(
    async (moduleIds: string[]) => {
      const toFetch = moduleIds.filter(
        (id) => !historyMap[id] && !loadingModules.has(id)
      );
      if (!toFetch.length) return;

      setLoadingModules((prev) => {
        const next = new Set(prev);
        toFetch.forEach((id) => next.add(id));
        return next;
      });

      const results = await Promise.allSettled(
        toFetch.map((moduleId) => apiCommands.getSensorHistory(moduleId))
      );

      const updates: Record<string, SensorHistoryRecord[]> = {};
      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          updates[toFetch[i]] = result.value.data.data ?? [];
        }
      });

      setHistoryMap((prev) => ({ ...prev, ...updates }));
      setLoadingModules((prev) => {
        const next = new Set(prev);
        toFetch.forEach((id) => next.delete(id));
        return next;
      });
    },
    [historyMap, loadingModules]
  );

  useEffect(() => {
    if (!allModuleIds.length || batchRef.current) return;
    batchRef.current = true;

    const batches: string[][] = [];
    for (let i = 0; i < allModuleIds.length; i += BATCH_SIZE) {
      batches.push(allModuleIds.slice(i, i + BATCH_SIZE));
    }

    batches.reduce<Promise<void>>(
      (acc, batch) =>
        acc.then(() => new Promise((res) => setTimeout(res, BATCH_DELAY_MS)).then(() => fetchHistoryBatch(batch))),
      Promise.resolve()
    );
  }, [allModuleIds, fetchHistoryBatch]);

  const totalModules = filteredTotalModules;
  const totalAreas = filteredSensorsByArea.length;
  const totalSedes = entity?.sedes?.length ?? 0;

  return (
    <div className="w-full max-w-[1400px] mx-auto px-2 min-w-0 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/sensors")}
          className="text-[#00554f] hover:text-[#00554f] hover:bg-[#f1f5f9] rounded-[10px]"
        >
          <ArrowLeft size={18} />
        </Button>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#64748b]">Sensores</p>
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
              <Cpu size={20} />
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

      {loadingEntity ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-[12px]" />
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
                    <SensorCard
                      key={moduleId}
                      module={entry.module}
                      history={historyMap[moduleId]}
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
  );
};

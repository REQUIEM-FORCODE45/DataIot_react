import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiEntidades } from "@/api/Sedes";
import type { Entidad } from "@/types/entidad";
import { usePermissions } from "@/hooks/usePermissions";
import { ChevronDown, ChevronRight, Layers, MapPin, Building2, Cpu } from "lucide-react";

const countModules = (entity: Entidad) =>
  entity.sedes?.reduce(
    (sedeAcc, sede) =>
      sedeAcc + (sede.areas?.reduce((areaAcc, area) => areaAcc + (area.modulos?.length ?? 0), 0) ?? 0),
    0
  ) ?? 0;

const countAreas = (entity: Entidad) =>
  entity.sedes?.reduce((sedeAcc, sede) => sedeAcc + (sede.areas?.length ?? 0), 0) ?? 0;

export const Alerts = () => {
  const [entities, setEntities] = useState<Entidad[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  const { filterEntitiesByAccess } = usePermissions();

  const fetchEntities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiEntidades.getAll();
      setEntities(filterEntitiesByAccess(data));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const totalSensors = useMemo(() => entities.reduce((acc, e) => acc + countModules(e), 0), [entities]);
  const totalEntities = entities.length;

  return (
    <div className="w-full max-w-[1400px] mx-auto px-2 min-w-0 space-y-6">
      <section className="rounded-[12px] border border-black/10 bg-gradient-to-r from-[#00554f] to-[#004a45] px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-teal-100 font-medium">Alertas</p>
            <h1 className="text-2xl font-semibold text-white leading-tight mt-1">
              Configuración de Alertas
            </h1>
            <p className="text-sm text-teal-100 mt-1 max-w-2xl">
              Activa y configura las alertas de los sensores por entidad.
            </p>
          </div>
          <Button size="sm" onClick={fetchEntities} className="bg-white text-[#00554f] hover:bg-[#f1f5f9] rounded-[10px] h-9 px-4 font-medium">
            Actualizar
          </Button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <article className="rounded-[12px] border border-white/20 bg-white/10 px-4 py-3 flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.3em] text-teal-100">Entidades</p>
            <div className="flex items-center gap-2 text-2xl font-semibold text-white">
              <Layers size={20} />
              <span>{totalEntities}</span>
            </div>
          </article>
          <article className="rounded-[12px] border border-white/20 bg-white/10 px-4 py-3 flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.3em] text-teal-100">Sensores totales</p>
            <div className="flex items-center gap-2 text-2xl font-semibold text-white">
              <Cpu size={20} />
              <span>{totalSensors}</span>
            </div>
          </article>
          <article className="rounded-[12px] border border-white/20 bg-white/10 px-4 py-3 flex flex-col gap-1">
            <p className="text-xs uppercase tracking-[0.3em] text-teal-100">Estado general</p>
            <div className="flex items-center gap-2 text-2xl font-semibold text-white">
              <span className="w-2.5 h-2.5 rounded-full bg-white inline-block" />
              <span>Operativo</span>
            </div>
          </article>
        </div>
      </section>

      <section className="rounded-[12px] border border-black/10 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-black/10">
          <h2 className="text-lg font-semibold text-[#1e293b]">Entidades</h2>
          <p className="text-sm text-[#64748b] mt-0.5">
            Selecciona una entidad para configurar sus alertas.
          </p>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-[10px]" />
            ))}
          </div>
        ) : entities.length === 0 ? (
          <div className="p-8 text-center text-[#64748b]">No hay entidades registradas aún.</div>
        ) : (
          <div className="divide-y divide-black/5">
            {entities.map((entity) => {
              const open = expanded.has(entity._id);
              const modules = countModules(entity);
              const areas = countAreas(entity);
              const sedes = entity.sedes?.length ?? 0;

              return (
                <div key={entity._id}>
                  <button
                    className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-[#f1f5f9] transition-colors"
                    onClick={() => toggle(entity._id)}
                  >
                    <span className="text-[#00554f] shrink-0">
                      {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </span>
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/alerts/${entity._id}`);
                      }}
                    >
                      <p className="font-semibold text-[#1e293b] truncate">{entity.name}</p>
                      <p className="text-xs text-[#94a3b8]">
                        NIT {entity.nit}-{entity.verif}
                      </p>
                    </div>
                    <div className="flex items-center gap-5 text-xs text-[#64748b] shrink-0">
                      <span className="flex items-center gap-1">
                        <Building2 size={14} /> {sedes} {sedes === 1 ? "sede" : "sedes"}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {areas} {areas === 1 ? "área" : "áreas"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Cpu size={14} /> {modules} {modules === 1 ? "sensor" : "sensores"}
                      </span>
                    </div>
                  </button>

                  {open && (
                    <div className="px-6 pb-5 pl-14 bg-[#f8fafc] border-t border-black/5">
                      <div className="flex flex-wrap gap-6 pt-4">
                        {entity.sedes?.map((sede) => (
                          <div key={sede._id ?? sede.name} className="text-sm">
                            <p className="font-semibold text-[#00554f] text-xs uppercase tracking-[0.2em] mb-2">
                              {sede.name}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {sede.areas?.map((area) => {
                                const areaId = `${sede._id ?? sede.name}-${area._id ?? area.name}`;
                                return (
                                  <button
                                    key={area._id ?? area.name}
                                    onClick={() => navigate(`/alerts/${entity._id}?area=${encodeURIComponent(areaId)}`)}
                                    className="rounded-full bg-white border border-black/10 px-3 py-1 text-xs text-[#475569] hover:bg-[#f1f5f9] hover:border-[#00554f] transition-colors cursor-pointer"
                                  >
                                    {area.name}
                                  </button>
                                );
                              })}
                              {(!sede.areas || sede.areas.length === 0) && (
                                <span className="text-xs text-[#94a3b8]">Sin áreas</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
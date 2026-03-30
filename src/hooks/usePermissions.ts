import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import type { Entidad } from "@/types/entidad";

const normalizeId = (value?: string) => value?.toString() ?? "";

export const usePermissions = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const role = user?.rol;

  const isSuperAdmin = role === "superAdmin";
  const isEntidadAdmin = role === "entidadAdmin";
  const isSedeAdmin = role === "sedeAdmin";
  const isBasicUser = role === "user";

  const canViewSites = Boolean(user);
  const canEditSites = isSuperAdmin || isEntidadAdmin || isSedeAdmin;
  const canViewUsers = isSuperAdmin || isEntidadAdmin;
  const canEditUsers = isSuperAdmin || isEntidadAdmin;

  const allowedSedeIds = useMemo(() => {
    if (!user?.sedes?.length) return [] as string[];
    return user.sedes
      .map((sede) => normalizeId(sede.id_sede) || normalizeId(sede._id))
      .filter(Boolean);
  }, [user?.sedes]);

  const allowedAreaIdsBySede = useMemo(() => {
    const map = new Map<string, string[]>();
    user?.sedes?.forEach((sede) => {
      const sedeId = normalizeId(sede.id_sede) || normalizeId(sede._id);
      if (!sedeId) return;
      const areas = sede.areas?.map((area) => normalizeId(area.id_area) || normalizeId(area._id)) ?? [];
      map.set(sedeId, areas.filter(Boolean));
    });
    return map;
  }, [user?.sedes]);

  const canAccessEntity = (entityId?: string) => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    if (!entityId) return false;
    return user.entidad_id === entityId;
  };

  const filterEntityByAccess = (entity: Entidad): Entidad | null => {
    console.log("user en filterEntityByAccess:", user);
    console.log("allowedSedeIds:", allowedSedeIds);
    console.log("allowedAreaIdsBySede:", allowedAreaIdsBySede);
    if (!user) return null;
    if (!canAccessEntity(entity._id)) return null;
    if (isSuperAdmin || isEntidadAdmin) return entity;

    const filteredSedes = (entity.sedes ?? [])
      .filter((sede) => allowedSedeIds.includes(normalizeId(sede._id)))
      .map((sede) => {
        if (isSedeAdmin) {
          return { ...sede };
        }
        if (isBasicUser) {
          const allowedAreas = allowedAreaIdsBySede.get(normalizeId(sede._id)) ?? [];
          return {
            ...sede,
            areas: (sede.areas ?? []).filter((area) => allowedAreas.includes(normalizeId(area._id))),
          };
        }
        return { ...sede };
      });

    return { ...entity, sedes: filteredSedes };
  };

  const filterEntitiesByAccess = (entities: Entidad[]) => {
    const filtered = entities
      .map((entity) => filterEntityByAccess(entity))
      .filter((entity): entity is Entidad => Boolean(entity));
    return filtered;
  };

  return {
    user,
    role,
    isSuperAdmin,
    isEntidadAdmin,
    isSedeAdmin,
    isBasicUser,
    canViewSites,
    canEditSites,
    canViewUsers,
    canEditUsers,
    allowedSedeIds,
    allowedAreaIdsBySede,
    canAccessEntity,
    filterEntityByAccess,
    filterEntitiesByAccess,
  };
};

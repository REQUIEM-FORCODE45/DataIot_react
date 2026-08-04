import { useState, useEffect, useCallback } from "react";
import type { VehicleData, VehicleFleet, SensorUpdatePayload, VehicleStatus } from "@/types/fleet";
import { backendToVehicleData, computeEstado } from "@/types/fleet";
import { useFleetSocket } from "./hooks/useFleetSocket";
import { apiVehicles } from "@/api/vehicles";
import { apiCommands } from "@/api/Commands";
import { VehiclePanel } from "./components/VehiclePanel";
import { VehicleMap } from "./components/VehicleMap";

const MAX_TRACK_POINTS = 30;

export function FleetTrackingPage() {
  const [fleet, setFleet] = useState<VehicleFleet>({});
  const [routes, setRoutes] = useState<Record<string, [number, number][]>>({});
  const [selectedPlaca, setSelectedPlaca] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildFleet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiVehicles.getAll();
      const vehicles = Array.isArray(res.data) ? res.data : [];
      const fleetMap: VehicleFleet = {};
      const routesMap: Record<string, [number, number][]> = {};

      for (const v of vehicles) {
        const vd = backendToVehicleData(v);
        fleetMap[vd.placa] = vd;
      }

      const placas = Object.keys(fleetMap);
      for (const placa of placas) {
        try {
          const trackingRes = await apiCommands.getLastTracking(placa);
          if (trackingRes.data.data && trackingRes.data.data.length > 0) {
            const t = trackingRes.data.data[0];
            fleetMap[placa] = {
              ...fleetMap[placa],
              latitud: t.lat,
              longitud: t.lng,
              velocidad: t.speed,
              ultima_actualizacion: t.createAt,
              estado: computeEstado(t.speed, t.createAt),
            };
          }
        } catch {
          // vehículo sin datos de tracking aún
        }

        try {
          const historyRes = await apiCommands.getTrackingData(placa, MAX_TRACK_POINTS);
          const points = (historyRes.data.data || [])
            .filter((p) => p.lat != null && p.lng != null)
            .map((p) => ({ lat: p.lat, lng: p.lng, ts: new Date(p.createAt).getTime() }))
            .sort((a, b) => {
              if (Number.isNaN(a.ts) && Number.isNaN(b.ts)) return 0;
              if (Number.isNaN(a.ts)) return 1;
              if (Number.isNaN(b.ts)) return -1;
              return a.ts - b.ts;
            })
            .map((p) => [p.lat, p.lng] as [number, number]);
          if (points.length > 0) {
            routesMap[placa] = points.slice(-MAX_TRACK_POINTS);
          }
        } catch {
          // vehículo sin historial de tracking aún
        }
      }

      setFleet(fleetMap);
      setRoutes(routesMap);
    } catch {
      setError("Error al cargar vehículos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    buildFleet();
  }, [buildFleet]);

  const handleTrackingUpdate = useCallback((data: SensorUpdatePayload) => {
    if (data.type_sensor !== "tracking") return;
    const placa = data.id_sensor;
    if (!placa) return;
    const { payload } = data;

    setFleet((prev: VehicleFleet) => {
      const existing = prev[placa];
      if (!existing) return prev;

      const liveTimestamp = data.timestamp || new Date().toISOString();
      let liveEstado: VehicleStatus;
      if (payload.speed === undefined) {
        liveEstado = existing.estado && existing.estado !== "offline" ? existing.estado : "idle";
      } else if (payload.speed > 0) {
        liveEstado = "moving";
      } else {
        liveEstado = "stopped";
      }

      return {
        ...prev,
        [placa]: {
          ...existing,
          latitud: payload.lat,
          longitud: payload.lng,
          velocidad: payload.speed,
          ultima_actualizacion: liveTimestamp,
          estado: liveEstado,
        },
      };
    });

    setRoutes((prevRoutes) => {
      const current = prevRoutes[placa] ?? [];
      const next: [number, number][] = [...current, [payload.lat, payload.lng]];
      return { ...prevRoutes, [placa]: next.slice(-MAX_TRACK_POINTS) };
    });
  }, []);

  const { isConnected, joinMultipleVehicles } = useFleetSocket({
    onTrackingUpdate: handleTrackingUpdate,
    enabled: !loading,
  });

  useEffect(() => {
    const placas = Object.keys(fleet);
    if (!loading && placas.length > 0) {
      joinMultipleVehicles(placas);
    }
  }, [loading, fleet, joinMultipleVehicles]);

  const handleAddVehicle = useCallback((vehicle: VehicleData) => {
    setFleet((prev) => ({ ...prev, [vehicle.placa]: vehicle }));
    const placas = Object.keys(fleet);
    if (placas.length > 0) {
      joinMultipleVehicles(placas);
    }
  }, [fleet, joinMultipleVehicles]);

  const handleDeleteVehicle = useCallback(async (placa: string, id: string) => {
    if (!window.confirm(`¿Eliminar el vehículo ${placa}?`)) return;
    try {
      await apiVehicles.delete(id);
      setFleet((prev) => {
        const next = { ...prev };
        delete next[placa];
        return next;
      });
      setRoutes((prev) => {
        const next = { ...prev };
        delete next[placa];
        return next;
      });
      if (selectedPlaca === placa) {
        setSelectedPlaca(null);
      }
    } catch {
      setError("Error al eliminar vehículo");
    }
  }, [selectedPlaca]);

  const targetCoords = (() => {
    if (!selectedPlaca || !fleet[selectedPlaca]) return null;
    const v = fleet[selectedPlaca];
    if (v.latitud == null || v.longitud == null) return null;
    return [v.latitud, v.longitud] as [number, number];
  })();

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-slate-800">Rastreo de Flota</h1>
        {isConnected && (
          <span className="inline-flex items-center gap-1 text-xs text-green-600">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            En vivo
          </span>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <div className="flex flex-1 min-h-0 gap-4">
        <VehiclePanel
          fleet={fleet}
          selectedPlaca={selectedPlaca}
          searchQuery={searchQuery}
          loading={loading}
          onSearchChange={setSearchQuery}
          onSelect={setSelectedPlaca}
          onAddVehicle={handleAddVehicle}
          onDeleteVehicle={handleDeleteVehicle}
          onRefresh={buildFleet}
        />
        <VehicleMap
          fleet={fleet}
          selectedPlaca={selectedPlaca}
          targetCoords={targetCoords}
          routes={routes}
        />
      </div>
    </div>
  );
}

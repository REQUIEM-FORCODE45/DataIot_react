import "leaflet/dist/leaflet.css";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useMemo } from "react";
import type { VehicleFleet, VehicleStatus } from "@/types/fleet";
import { MapController } from "./MapController";

interface VehicleMapProps {
  fleet: VehicleFleet;
  selectedPlaca: string | null;
  targetCoords: [number, number] | null;
  routes: Record<string, [number, number][]>;
}

const STATUS_COLOR: Record<string, string> = {
  moving: "#22c55e",
  stopped: "#f59e0b",
  idle: "#3b82f6",
  offline: "#94a3b8",
};

function createVehicleIcon(estado: VehicleStatus | undefined, isSelected: boolean) {
  const color = STATUS_COLOR[estado ?? "offline"];
  const size = isSelected ? 18 : 14;
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:3px solid ${isSelected ? "#fff" : "rgba(255,255,255,0.8)"};border-radius:50%;box-shadow:0 0 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [size + 6, size + 6],
    iconAnchor: [(size + 6) / 2, (size + 6) / 2],
  });
}

function createTrailIcon(alpha: number) {
  return L.divIcon({
    className: "",
    html: `<div style="width:6px;height:6px;background:#00554f;opacity:${alpha};border-radius:50%;"></div>`,
    iconSize: [6, 6],
    iconAnchor: [3, 3],
  });
}

const STATUS_LABEL: Record<string, string> = {
  moving: "En movimiento",
  stopped: "Detenido",
  idle: "Encendido",
  offline: "Desconectado",
};

export function VehicleMap({ fleet, selectedPlaca, targetCoords, routes }: VehicleMapProps) {
  const vehicles = useMemo(
    () => Object.values(fleet).filter((v) => v.latitud != null && v.longitud != null),
    [fleet]
  );

  const selectedRoute = useMemo(
    () => (selectedPlaca && routes[selectedPlaca]?.length ? routes[selectedPlaca] : []),
    [routes, selectedPlaca]
  );

  return (
    <div className="flex-1 min-h-0 rounded-[12px] overflow-hidden border border-black/10 shadow-sm">
      <MapContainer
        center={[1.2136, -77.2811]}
        zoom={13}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController targetCoords={targetCoords} selectedPlaca={selectedPlaca} />

        {selectedRoute.map((pos, i) => {
          const alpha =
            selectedRoute.length === 1 ? 0.9 : 0.15 + (i / (selectedRoute.length - 1)) * 0.75;
          return <Marker key={i} position={pos} icon={createTrailIcon(alpha)} />;
        })}

        {vehicles.map((v) => (
          <Marker
            key={v.placa}
            position={[v.latitud!, v.longitud!]}
            icon={createVehicleIcon(v.estado, selectedPlaca === v.placa)}
          >
            <Popup>
              <div className="text-sm space-y-1 min-w-[180px]">
                <p className="font-bold text-base text-[#00554f]">{v.placa}</p>
                <p><span className="font-medium">VIN:</span> {v.vin_id}</p>
                {v.marca && v.modelo && (
                  <p><span className="font-medium">Vehículo:</span> {v.marca} {v.modelo}</p>
                )}
                {v.conductor && <p><span className="font-medium">Conductor:</span> {v.conductor}</p>}
                <p>
                  <span className="font-medium">Estado:</span>{" "}
                  <span className={
                    v.estado === "moving" ? "text-green-600" :
                    v.estado === "stopped" ? "text-amber-600" :
                    v.estado === "idle" ? "text-blue-600" : "text-slate-400"
                  }>
                    {STATUS_LABEL[v.estado ?? "offline"]}
                  </span>
                </p>
                {v.estado === "moving" && <p><span className="font-medium">Velocidad:</span> {v.velocidad} km/h</p>}
                {v.ultima_actualizacion && (
                  <p className="text-xs text-slate-400 pt-1">
                    {!Number.isNaN(new Date(v.ultima_actualizacion).getTime())
                      ? new Date(v.ultima_actualizacion).toLocaleString("es-CO")
                      : "—"}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

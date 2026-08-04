import type { VehicleData, VehicleStatus } from "@/types/fleet";
import { Trash2 } from "lucide-react";

const STATUS_CONFIG: Record<VehicleStatus, { label: string; color: string; bg: string }> = {
  moving: { label: "En movimiento", color: "bg-green-500", bg: "bg-green-50" },
  stopped: { label: "Detenido", color: "bg-amber-500", bg: "bg-amber-50" },
  idle: { label: "Encendido", color: "bg-blue-500", bg: "bg-blue-50" },
  offline: { label: "Desconectado", color: "bg-slate-400", bg: "bg-slate-50" },
};

function timeAgo(isoString: string): string {
  const parsed = new Date(isoString).getTime();
  if (Number.isNaN(parsed)) return "—";
  const diff = Date.now() - parsed;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${Math.floor(hours / 24)}d`;
}

interface VehicleListItemProps {
  vehicle: VehicleData;
  isSelected: boolean;
  onSelect: (placa: string | null) => void;
  onDelete: (placa: string, id: string) => void;
}

export function VehicleListItem({ vehicle, isSelected, onSelect, onDelete }: VehicleListItemProps) {
  const safeEstado = vehicle.estado ?? "offline";
  const status = STATUS_CONFIG[safeEstado];

  return (
    <button
      onClick={() => onSelect(isSelected ? null : vehicle.placa)}
      className={`w-full text-left px-3 py-2.5 rounded-[10px] transition-colors group ${
        isSelected
          ? "bg-[#00554f] text-white"
          : "hover:bg-slate-50 text-slate-800"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${status.color} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-sm">{vehicle.placa}</span>
            <div className="flex items-center gap-1">
              <span className={`text-xs ${isSelected ? "text-white/80" : "text-slate-500"}`}>
                {vehicle.ultima_actualizacion ? timeAgo(vehicle.ultima_actualizacion) : "—"}
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(vehicle.placa, vehicle._id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    onDelete(vehicle.placa, vehicle._id);
                  }
                }}
                className={`opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 ${isSelected ? "text-white/60 hover:text-white hover:bg-white/20" : "text-slate-400 hover:text-red-500"}`}
                title="Eliminar vehículo"
              >
                <Trash2 size={14} />
              </span>
            </div>
          </div>
          <div className={`text-xs mt-0.5 ${isSelected ? "text-white/70" : "text-slate-500"}`}>
            {vehicle.conductor && <span>{vehicle.conductor} · </span>}
            {vehicle.estado === "moving" ? `${vehicle.velocidad ?? 0} km/h` : status.label}
          </div>
        </div>
      </div>
    </button>
  );
}

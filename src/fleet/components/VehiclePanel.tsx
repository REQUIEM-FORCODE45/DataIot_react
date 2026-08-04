import { useMemo, useState } from "react";
import type { VehicleData, VehicleFleet } from "@/types/fleet";
import { VehicleListItem } from "./VehicleListItem";
import { AddVehicleModal } from "./AddVehicleModal";
import { Button } from "@/components/ui/button";
import { Search, Radio, Square, WifiOff, Plus, RefreshCw, Play } from "lucide-react";

interface VehiclePanelProps {
  fleet: VehicleFleet;
  selectedPlaca: string | null;
  searchQuery: string;
  loading: boolean;
  onSearchChange: (q: string) => void;
  onSelect: (placa: string | null) => void;
  onAddVehicle: (vehicle: VehicleData) => void;
  onDeleteVehicle: (placa: string, id: string) => void;
  onRefresh: () => void;
}

export function VehiclePanel({
  fleet,
  selectedPlaca,
  searchQuery,
  loading,
  onSearchChange,
  onSelect,
  onAddVehicle,
  onDeleteVehicle,
  onRefresh,
}: VehiclePanelProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  const stats = useMemo(() => {
    const values = Object.values(fleet);
    return {
      total: values.length,
      moving: values.filter((v) => v.estado === "moving").length,
      stopped: values.filter((v) => v.estado === "stopped").length,
      idle: values.filter((v) => v.estado === "idle").length,
      offline: values.filter((v) => v.estado === "offline" || !v.estado).length,
    };
  }, [fleet]);

  const filtered = useMemo(() => {
    if (!searchQuery) return Object.values(fleet);
    const q = searchQuery.toLowerCase();
    return Object.values(fleet).filter(
      (v) =>
        v.placa.toLowerCase().includes(q) ||
        (v.conductor && v.conductor.toLowerCase().includes(q)) ||
        v.vin_id.toLowerCase().includes(q)
    );
  }, [fleet, searchQuery]);

  return (
    <div className="w-[360px] flex-shrink-0 flex flex-col bg-white rounded-[12px] border border-black/10 shadow-sm">
      <div className="p-3 border-b border-black/10 space-y-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowAddModal(true)}
            className="bg-[#00554f] hover:bg-[#004a45] text-white rounded-lg shrink-0"
            disabled={loading}
          >
            <Plus size={16} />
            Agregar
          </Button>
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar vehículo..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-black/10 text-sm outline-none focus:border-[#00554f] transition-colors"
            />
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onRefresh}
            disabled={loading}
            className="h-9 w-9 shrink-0"
            title="Refrescar"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>

        <div className="flex gap-2 text-xs text-slate-500 flex-wrap">
          <span className="flex items-center gap-1">
            <Radio size={12} className="text-green-500" />
            {stats.moving}
          </span>
          <span className="flex items-center gap-1">
            <Square size={12} className="text-amber-500" />
            {stats.stopped}
          </span>
          <span className="flex items-center gap-1">
            <Play size={12} className="text-blue-500" />
            {stats.idle}
          </span>
          <span className="flex items-center gap-1">
            <WifiOff size={12} className="text-slate-400" />
            {stats.offline}
          </span>
          <span className="ml-auto font-medium text-slate-700">
            {stats.total} vehículos
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <p className="text-center text-sm text-slate-400 py-8">Cargando vehículos...</p>
        ) : filtered.length > 0 ? (
          filtered.map((v) => (
            <VehicleListItem
              key={v.placa}
              vehicle={v}
              isSelected={selectedPlaca === v.placa}
              onSelect={onSelect}
              onDelete={onDeleteVehicle}
            />
          ))
        ) : (
          <p className="text-center text-sm text-slate-400 py-8">
            No se encontraron vehículos
          </p>
        )}
      </div>

      <AddVehicleModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onAddVehicle={onAddVehicle}
        existingPlacas={Object.keys(fleet).map((p) => p.toLowerCase())}
      />
    </div>
  );
}

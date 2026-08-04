export type VehicleStatus = 'moving' | 'stopped' | 'idle' | 'offline';
export type VehicleType = 'camioneta' | 'moto' | 'camion' | 'automovil' | 'bus' | 'otro';
export type FuelType = 'gasolina' | 'diesel' | 'electrico' | 'hibrido' | 'gnv';

export interface BackendVehicle {
  _id: string;
  vin: string;
  placa: string;
  entidad_id?: string;
  sede_id?: string;
  area_id?: string;
  marca?: string;
  modelo?: string;
  año?: number;
  color?: string;
  tipo?: string;
  combustible?: string;
  num_motor?: string;
  num_chasis?: string;
  capacidad_carga?: number;
  kilometraje_inicial?: number;
  conductor?: string;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleData {
  _id: string;
  vin_id: string;
  placa: string;
  entidad_id?: string;
  sede_id?: string;
  area_id?: string;
  marca?: string;
  modelo?: string;
  año?: number;
  color?: string;
  tipo?: string;
  capacidad_carga?: number;
  numero_motor?: string;
  numero_chasis?: string;
  combustible?: string;
  kilometraje_inicial?: number;
  activo: boolean;
  conductor?: string;
  latitud?: number;
  longitud?: number;
  velocidad?: number;
  direccion?: number;
  estado?: VehicleStatus;
  ultima_actualizacion?: string;
}

export type VehicleFleet = Record<string, VehicleData>;

export interface SensorUpdatePayload {
  id_sensor: string;
  type_sensor: string;
  payload: {
    lat: number;
    lng: number;
    speed?: number;
    altitude?: number;
    createAt?: string;
  };
  timestamp: string;
}

const NORMALIZE_TIPO: Record<string, string> = {
  Camioneta: "camioneta",
  Carro: "automovil",
  Moto: "moto",
  Bus: "bus",
  Camión: "camion",
  Otro: "otro",
};

export function backendToVehicleData(b: BackendVehicle): VehicleData {
  return {
    _id: b._id,
    vin_id: b.vin,
    placa: b.placa,
    entidad_id: b.entidad_id,
    sede_id: b.sede_id,
    area_id: b.area_id,
    marca: b.marca,
    modelo: b.modelo,
    año: b.año,
    color: b.color,
    tipo: b.tipo ? (NORMALIZE_TIPO[b.tipo] ?? b.tipo.toLowerCase()) : undefined,
    capacidad_carga: b.capacidad_carga,
    numero_motor: b.num_motor,
    numero_chasis: b.num_chasis,
    combustible: b.combustible?.toLowerCase(),
    kilometraje_inicial: b.kilometraje_inicial,
    activo: b.activo,
    conductor: b.conductor,
  };
}

export function computeEstado(
  speed: number | undefined,
  lastUpdate: string | undefined
): VehicleStatus {
  if (lastUpdate) {
    const parsed = new Date(lastUpdate).getTime();
    if (!Number.isNaN(parsed) && (Date.now() - parsed) / 60000 > 10) {
      return "offline";
    }
  }
  if (speed !== undefined && speed > 0) return "moving";
  if (speed !== undefined && speed === 0) return "stopped";
  if (lastUpdate) return "idle";
  return "offline";
}

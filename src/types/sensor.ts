export interface SensorConfigDocument {
  id_sensor?: string;
  modulo?: string;
  entidad_id?: string;
  sede?: string;
  area?: string;
  alias?: string;
  [key: string]: unknown;
}

export interface SensorLatestRecord {
  createdAt?: string;
  value1?: number;
  value2?: number;
  value3?: number;
  value4?: number;
  [key: string]: unknown;
}

export interface SensorLatestData {
  _id?: string;
  id_sensor: string;
  modulo_id?: string;
  module?: string;
  entidad_id?: string;
  sede?: string;
  config?: SensorConfigDocument;
  last_record?: SensorLatestRecord;
  last_data?: SensorLatestRecord;
  alias?: string;
  label?: string;
  [key: string]: unknown;
}

export interface SensorHistoryRecord {
  createdAt?: string;
  createAt?: string;
  temp?: number;
  value1?: number;
  value2?: number;
  value3?: number;
  value4?: number;
  [key: string]: unknown;
}

export interface SensorHistoryResponse {
  data: SensorHistoryRecord[];
  config?: SensorConfigDocument[];
}

export interface SensorHistoryGroup {
  data: SensorHistoryRecord[];
  config?: SensorConfigDocument[];
}

export type MultiSensorHistoryResponse = Record<string, SensorHistoryGroup>;

export interface AsyncJobResponse {
  success: boolean;
  jobId: string;
  message: string;
}

export interface JobStatusResponse {
  success: boolean;
  status: "pending" | "processing" | "completed" | "failed";
  result?: Record<string, SensorHistoryGroup>;
  error?: string;
  completedAt?: string;
}

export interface ModuleReading {
  module_id: string;
  last_data_timestamp: string;
  sensor_info: {
    _id: string;
    id_sensor: string;
    ip?: string;
    lastSeen?: string;
    type?: string;
    [key: string]: unknown;
  };
}

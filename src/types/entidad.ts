export interface Modulo {
  _id?: string;
  ubicacion: string;
  host: string;
  type_modulo: string; // Ej. "Temperatura", "Humedad"
  modulo: string;      // Nombre del módulo, ej. "Modulo_Temp_01"
  id_modulo: string;   // Identificador de hardware, ej. "MOD-001"
}

export interface Area {
  _id?: string;
  name: string;
  modulos: Modulo[];
}

export interface Sede {
  _id?: string;
  name: string;
  department: string;
  department_code: string;
  city: string;
  city_code: string;
  address: string;
  host: string[];
  areas: Area[];
}

export interface Entidad {
  _id: string; // Este sí es estricto porque viene de la BD
  name: string;
  nit: string;
  verif: string;
  phone?: string;
  email: string;
  icon_name?: string;
  sedes: Sede[];
}
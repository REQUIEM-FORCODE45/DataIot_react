import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { VehicleData } from "@/types/fleet";
import { backendToVehicleData } from "@/types/fleet";
import type { Entidad } from "@/types/entidad";
import { apiVehicles } from "@/api/vehicles";
import { apiEntidades } from "@/api/Sedes";
import { usePermissions } from "@/hooks/usePermissions";

interface AddVehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddVehicle: (vehicle: VehicleData) => void;
  existingPlacas: string[];
}

const VEHICLE_TYPES = [
  { value: "Camioneta", label: "Camioneta" },
  { value: "Carro", label: "Carro" },
  { value: "Moto", label: "Moto" },
  { value: "Bus", label: "Bus" },
  { value: "Camión", label: "Camión" },
  { value: "Otro", label: "Otro" },
];

const FUEL_TYPES = [
  { value: "Gasolina", label: "Gasolina" },
  { value: "Diesel", label: "Diésel" },
  { value: "Eléctrico", label: "Eléctrico" },
  { value: "GNV", label: "GNV" },
  { value: "Otro", label: "Otro" },
];

const inputClass =
  "w-full h-9 px-3 rounded-lg border border-black/10 text-sm outline-none focus:border-[#00554f] transition-colors bg-white";
const labelClass = "text-xs font-medium text-slate-600";
const errorClass = "text-xs text-red-500 mt-0.5";
const selectClass = inputClass;

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className={labelClass}>
      {children}
    </label>
  );
}

export function AddVehicleModal({
  open,
  onOpenChange,
  onAddVehicle,
  existingPlacas,
}: AddVehicleModalProps) {
  const { filterEntitiesByAccess } = usePermissions();

  const [entidades, setEntidades] = useState<Entidad[]>([]);
  const [loadingJerarquia, setLoadingJerarquia] = useState(false);
  const [jerarquiaError, setJerarquiaError] = useState("");

  const [entidadId, setEntidadId] = useState("");
  const [sedeId, setSedeId] = useState("");
  const [areaId, setAreaId] = useState("");

  const [vin, setVin] = useState("");
  const [placa, setPlaca] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [año, setAño] = useState("");
  const [color, setColor] = useState("");
  const [tipo, setTipo] = useState("");
  const [capacidadCarga, setCapacidadCarga] = useState("");
  const [numMotor, setNumMotor] = useState("");
  const [numChasis, setNumChasis] = useState("");
  const [combustible, setCombustible] = useState("");
  const [kmInicial, setKmInicial] = useState("");
  const [conductor, setConductor] = useState("");
  const [activo, setActivo] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const sedesDisponibles = useMemo(
    () => entidades.find((e) => e._id === entidadId)?.sedes ?? [],
    [entidades, entidadId]
  );

  const areasDisponibles = useMemo(
    () => sedesDisponibles.find((s) => s._id === sedeId)?.areas ?? [],
    [sedesDisponibles, sedeId]
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function loadJerarquia() {
      setLoadingJerarquia(true);
      setJerarquiaError("");
      try {
        const data = await apiEntidades.getAll();
        if (cancelled) return;
        const filtered = filterEntitiesByAccess(data);
        setEntidades(filtered);
        if (filtered.length === 1) {
          setEntidadId(filtered[0]._id);
          if (filtered[0].sedes?.length === 1) {
            setSedeId(filtered[0].sedes[0]._id ?? "");
          }
        }
      } catch {
        if (!cancelled) setJerarquiaError("Error al cargar sedes y áreas");
      } finally {
        if (!cancelled) setLoadingJerarquia(false);
      }
    }

    loadJerarquia();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function resetForm() {
    setEntidadId("");
    setSedeId("");
    setAreaId("");
    setVin("");
    setPlaca("");
    setMarca("");
    setModelo("");
    setAño("");
    setColor("");
    setTipo("");
    setCapacidadCarga("");
    setNumMotor("");
    setNumChasis("");
    setCombustible("");
    setKmInicial("");
    setConductor("");
    setActivo(true);
    setErrors({});
    setServerError("");
  }

  function handleOpenChange(open: boolean) {
    if (!open) resetForm();
    onOpenChange(open);
  }

  async function handleSubmit() {
    const newErrors: Record<string, string> = {};

    if (!entidadId) newErrors.entidad = "Selecciona una entidad";
    if (!sedeId) newErrors.sede = "Selecciona una sede";
    if (!areaId) newErrors.area = "Selecciona un área";

    if (!vin.trim()) newErrors.vin = "VIN es requerido";
    if (!placa.trim()) newErrors.placa = "Placa es requerida";
    else if (existingPlacas.includes(placa.trim().toLowerCase()))
      newErrors.placa = "Ya existe un vehículo con esta placa";

    if (año && (isNaN(Number(año)) || Number(año) < 1900 || Number(año) > 2100))
      newErrors.año = "Año inválido";

    if (capacidadCarga && isNaN(Number(capacidadCarga)))
      newErrors.capacidadCarga = "Debe ser un número";

    if (kmInicial && isNaN(Number(kmInicial)))
      newErrors.kmInicial = "Debe ser un número";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    setServerError("");

    try {
      const res = await apiVehicles.create({
        entidad_id: entidadId,
        sede_id: sedeId,
        area_id: areaId,
        vin: vin.trim(),
        placa: placa.trim().toUpperCase(),
        ...(marca.trim() && { marca: marca.trim() }),
        ...(modelo.trim() && { modelo: modelo.trim() }),
        ...(año && { año: Number(año) }),
        ...(color.trim() && { color: color.trim() }),
        ...(tipo && { tipo }),
        ...(capacidadCarga && { capacidad_carga: Number(capacidadCarga) }),
        ...(numMotor.trim() && { num_motor: numMotor.trim() }),
        ...(numChasis.trim() && { num_chasis: numChasis.trim() }),
        ...(combustible && { combustible }),
        ...(kmInicial && { kilometraje_inicial: Number(kmInicial) }),
        ...(conductor.trim() && { conductor: conductor.trim() }),
        activo,
      });

      if (res.data.success && res.data.vehicle) {
        onAddVehicle(backendToVehicleData(res.data.vehicle));
        resetForm();
        onOpenChange(false);
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setServerError(axiosErr.response?.data?.message || "Error al crear vehículo");
      } else {
        setServerError("Error de conexión al crear vehículo");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agregar Vehículo</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 py-2">
          {entidades.length > 1 && (
            <div className="space-y-1">
              <Label htmlFor="entidad">Entidad *</Label>
              <select
                id="entidad"
                value={entidadId}
                onChange={(e) => {
                  setEntidadId(e.target.value);
                  setSedeId("");
                  setAreaId("");
                }}
                className={`${selectClass} ${errors.entidad ? "border-red-400" : ""}`}
                disabled={submitting || loadingJerarquia}
              >
                <option value="">Seleccionar...</option>
                {entidades.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.name}
                  </option>
                ))}
              </select>
              {errors.entidad && <p className={errorClass}>{errors.entidad}</p>}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="sede">Sede *</Label>
            <select
              id="sede"
              value={sedeId}
              onChange={(e) => {
                setSedeId(e.target.value);
                setAreaId("");
              }}
              className={`${selectClass} ${errors.sede ? "border-red-400" : ""}`}
              disabled={submitting || loadingJerarquia || !entidadId}
            >
              <option value="">
                {loadingJerarquia ? "Cargando..." : "Seleccionar..."}
              </option>
              {sedesDisponibles.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.sede && <p className={errorClass}>{errors.sede}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="area">Área *</Label>
            <select
              id="area"
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              className={`${selectClass} ${errors.area ? "border-red-400" : ""}`}
              disabled={submitting || loadingJerarquia || !sedeId}
            >
              <option value="">
                {loadingJerarquia ? "Cargando..." : "Seleccionar..."}
              </option>
              {areasDisponibles.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
            {errors.area && <p className={errorClass}>{errors.area}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="vin">VIN *</Label>
            <input
              id="vin"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              className={`${inputClass} ${errors.vin ? "border-red-400" : ""}`}
              placeholder="Número de identificación"
              disabled={submitting}
            />
            {errors.vin && <p className={errorClass}>{errors.vin}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="placa">Placa *</Label>
            <input
              id="placa"
              value={placa}
              onChange={(e) => setPlaca(e.target.value)}
              className={`${inputClass} ${errors.placa ? "border-red-400" : ""}`}
              placeholder="ABC-123"
              disabled={submitting}
            />
            {errors.placa && <p className={errorClass}>{errors.placa}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="marca">Marca</Label>
            <input
              id="marca"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              className={inputClass}
              placeholder="Toyota, Chevrolet..."
              disabled={submitting}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="modelo">Modelo</Label>
            <input
              id="modelo"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              className={inputClass}
              placeholder="Hilux, Spark..."
              disabled={submitting}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="año">Año</Label>
            <input
              id="año"
              type="number"
              value={año}
              onChange={(e) => setAño(e.target.value)}
              className={`${inputClass} ${errors.año ? "border-red-400" : ""}`}
              placeholder="2024"
              disabled={submitting}
            />
            {errors.año && <p className={errorClass}>{errors.año}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="color">Color</Label>
            <input
              id="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={inputClass}
              placeholder="Blanco, Rojo..."
              disabled={submitting}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="tipo">Tipo</Label>
            <select
              id="tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className={selectClass}
              disabled={submitting}
            >
              <option value="">Seleccionar...</option>
              {VEHICLE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="combustible">Combustible</Label>
            <select
              id="combustible"
              value={combustible}
              onChange={(e) => setCombustible(e.target.value)}
              className={selectClass}
              disabled={submitting}
            >
              <option value="">Seleccionar...</option>
              {FUEL_TYPES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="numMotor">Número de motor</Label>
            <input
              id="numMotor"
              value={numMotor}
              onChange={(e) => setNumMotor(e.target.value)}
              className={inputClass}
              placeholder="Motor #"
              disabled={submitting}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="numChasis">Número de chasis</Label>
            <input
              id="numChasis"
              value={numChasis}
              onChange={(e) => setNumChasis(e.target.value)}
              className={inputClass}
              placeholder="Chasis #"
              disabled={submitting}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="capacidadCarga">Capacidad de carga (kg)</Label>
            <input
              id="capacidadCarga"
              type="number"
              value={capacidadCarga}
              onChange={(e) => setCapacidadCarga(e.target.value)}
              className={`${inputClass} ${errors.capacidadCarga ? "border-red-400" : ""}`}
              placeholder="0"
              disabled={submitting}
            />
            {errors.capacidadCarga && <p className={errorClass}>{errors.capacidadCarga}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="kmInicial">Kilometraje inicial</Label>
            <input
              id="kmInicial"
              type="number"
              value={kmInicial}
              onChange={(e) => setKmInicial(e.target.value)}
              className={`${inputClass} ${errors.kmInicial ? "border-red-400" : ""}`}
              placeholder="0"
              disabled={submitting}
            />
            {errors.kmInicial && <p className={errorClass}>{errors.kmInicial}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="conductor">Conductor</Label>
            <input
              id="conductor"
              value={conductor}
              onChange={(e) => setConductor(e.target.value)}
              className={inputClass}
              placeholder="Nombre del conductor"
              disabled={submitting}
            />
          </div>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <span className={labelClass}>Activo</span>
              <button
                type="button"
                role="switch"
                aria-checked={activo}
                onClick={() => setActivo(!activo)}
                disabled={submitting}
                className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  activo ? "bg-[#00554f]" : "bg-slate-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                    activo ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-sm text-slate-500">
                {activo ? "Sí" : "No"}
              </span>
            </label>
          </div>
        </div>

        {jerarquiaError && (
          <p className="text-sm text-red-500 text-center">{jerarquiaError}</p>
        )}
        {serverError && (
          <p className="text-sm text-red-500 text-center">{serverError}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loadingJerarquia}>
            {submitting ? "Guardando..." : "Agregar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiSensor } from "@/api/sensor";
import type { Mantenimiento } from "@/api/sensor";
import { ArrowLeft, Clock, Calendar, FileText, Plus } from "lucide-react";


export const MantenimientoHistory = () => {
  const { areaId, moduloId } = useParams<{ areaId: string; moduloId: string }>();
  const navigate = useNavigate();
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMantenimientos = async () => {
      if (!areaId || !moduloId) return;
      setLoading(true);
      try {
        const data = await apiSensor.getMantenimientos(areaId, moduloId);
        setMantenimientos(data.sensor?.mantenimientos || []);
      } catch (err) {
        console.error("Error al cargar mantenimientos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMantenimientos();
  }, [areaId, moduloId]);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="text-[#00554f] hover:text-[#00554f]">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#00554f] font-medium">Mantenimiento</p>
            <h1 className="text-2xl font-bold tracking-tight text-[#1e293b]">Historial de Mantenimientos</h1>
          </div>
        </div>
        <Button 
          onClick={() => navigate(`/mantenimiento/${areaId}/${moduloId}`)}
          className="bg-[#00554f] hover:bg-[#004a45] text-white gap-2"
        >
          <Plus size={16} />
          Nuevo Mantenimiento
        </Button>
      </div>

      <Card className="rounded-[12px] border border-black/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base text-[#1e293b] flex items-center gap-2">
            <Clock size={18} className="text-[#00554f]" />
            Registros
          </CardTitle>
          <p className="text-xs text-[#64748b]">
            {mantenimientos.length} mantenimiento(s) registrado(s)
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : mantenimientos.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <p className="text-sm text-muted-foreground">No hay mantenimientos registrados</p>
              <Button 
                onClick={() => navigate(`/register-mantenimiento/${areaId}/${moduloId}`)}
                variant="outline"
                className="text-[#00554f] border-[#00554f]"
              >
                <Plus size={16} className="mr-2" />
                Registrar primer mantenimiento
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {mantenimientos.map((mant) => (
                <div key={mant._id} className="p-4 rounded-lg border border-black/10 bg-white space-y-2">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-[#00554f]">
                      <Calendar size={14} />
                      <span className="font-medium">
                        {new Date(mant.fecha).toLocaleDateString("es-CO")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock size={14} />
                      <span className="capitalize">{mant.frecuencia}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <FileText size={14} className="text-muted-foreground mt-0.5" />
                    <p className="text-[#475569]">{mant.observaciones}</p>
                  </div>
                  {mant.imagen && (
                    <div className="mt-2">
                      <img 
                        src={mant.imagen} 
                        alt="Imagen del mantenimiento" 
                        className="max-w-[200px] rounded border border-black/10"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

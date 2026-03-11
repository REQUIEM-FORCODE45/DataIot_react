
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Battery, Zap, AlertTriangle } from "lucide-react";

export const Home = () => {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Panel de Control</h2>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Fila de Cards de KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard 
                title="Potencia Total" 
                value="12.5 kW" 
                description="+2.1% desde la última hora" 
                icon={<Zap className="h-4 w-4 text-muted-foreground" />} 
            />
            <StatsCard 
                title="Nivel de Batería" 
                value="85%" 
                description="Estado: Descargando" 
                icon={<Battery className="h-4 w-4 text-muted-foreground" />} 
            />
            <StatsCard 
                title="Dispositivos Activos" 
                value="14" 
                description="Todos los nodos reportando" 
                icon={<Activity className="h-4 w-4 text-muted-foreground" />} 
            />
            <StatsCard 
                title="Alertas Críticas" 
                value="0" 
                description="Sistema estable" 
                icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />} 
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Espacio para Gráfico Principal */}
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Flujo de Energía en Tiempo Real</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-md text-muted-foreground">
                    [Gráfico de Recharts aquí]
                </div>
              </CardContent>
            </Card>

            {/* Lista de Actividad Reciente */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Últimos Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentActivity />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Sub-componente para las tarjetas de estadísticas
const StatsCard = ({ title, value, description, icon }: any) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

// Sub-componente para la lista de actividad
const RecentActivity = () => (
    <div className="space-y-8">
        {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">Sensor_00{i} conectado</p>
                    <p className="text-sm text-muted-foreground">Hace {i * 5} minutos</p>
                </div>
                <div className="ml-auto font-medium text-green-500">Activo</div>
            </div>
        ))}
    </div>
);
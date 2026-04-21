// HomeRouter.tsx
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Routes, Route, Navigate } from "react-router-dom"
import { Sedes } from "@/pages/Sedes"
import { AdminSedes } from "@/components/AdminSedes"
import { AdminAreasHosts } from "@/components/AdminAreasHosts"
import { User } from "@/pages/User"
import { Sensors } from "@/pages/Sensors"
import { EntitySensors } from "@/pages/EntitySensors"
import { EntityCharts } from "@/pages/EntityCharts"
import { RegisterMantenimiento } from "@/pages/RegisterMantenimiento"
import { MantenimientoHistory } from "@/pages/MantenimientoHistory"
import { SensorHojaVida } from "@/pages/SensorHojaVida"
import { SensorAlertas } from "@/pages/SensorAlertas"



export const HomeRouter = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="h-4 w-[1px] bg-slate-200 mx-2" />
          <h1 className="text-sm font-medium">DataIoT - Panel de Control</h1>
        </header>
        
        <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Routes>

            <Route path="/" element={<Sensors />} />
            <Route path="/sites" element={ <Sedes /> } />
            <Route path="/entidades/:id_entidad/sedes" element={<AdminSedes />} />
            <Route path="/entidades/:id_entidad/sedes/:id_sede" element={<AdminAreasHosts />} />
            <Route path="/users" element={<User />} />
            <Route path="/sensors" element={<Sensors />} />
            <Route path="/sensors/:entityId" element={<EntitySensors />} />
            <Route path="/charts" element={<EntityCharts />} />
            <Route path="/mantenimiento/:areaId/:moduloId" element={<RegisterMantenimiento />} />
            <Route path="/mantenimiento/history/:areaId/:moduloId" element={<MantenimientoHistory />} />
            <Route path="/sensor/hoja-vida/:areaId/:moduloId" element={<SensorHojaVida />} />
            <Route path="/sensor/alertas/:moduloId" element={<SensorAlertas />} />
            <Route path="/*" element={<Navigate to="/"/>} />

          </Routes>

        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

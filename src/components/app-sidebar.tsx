import { Activity, Settings, Microscope, ChevronUp, User2, LineChart, Bell } from "lucide-react"
import { useAuthStore } from "@/hooks/useAuthStore"
import { usePermissions } from "@/hooks/usePermissions"
import { Link } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const items = [
  { title: "Sensores", url: "/sensors", icon: Microscope },
  { title: "Alertas", url: "/alerts", icon: Bell },
  { title: "Graficas", url: "/charts", icon: LineChart },
  { title: "Usuarios", url: "/users", icon: Activity, permission: "users" },
  { title: "Sedes", url: "/sites", icon: Settings, permission: "sites" },
]

export function AppSidebar() {
  const { startLogout, user } = useAuthStore();
  const { state } = useSidebar();
  const { canViewUsers, canViewSites } = usePermissions();

  const visibleItems = items.filter((item) => {
    if (item.permission === "users") return canViewUsers;
    if (item.permission === "sites") return canViewSites;
    return true;
  });

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="bg-[#003d3a] border-r border-black/10">
      <SidebarContent className="bg-[#003d3a]">
        <div className="flex items-center px-4 py-4 mb-2">
          {state === "collapsed" ? (
            <img src="/img/favicon.png" alt="DataIoT" className="h-[6vh] object-contain mx-auto" />
          ) : (
            <img src="/img/DataIOT-White.png" alt="DataIoT" className="h-[8vh] object-contain" />
          )}
        </div>
        <SidebarMenu className="px-2 space-y-0.5">
          {visibleItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link
                  to={item.url}
                  className="text-white hover:text-white hover:bg-white/10 data-[active=true]:text-white data-[active=true]:bg-white/15 data-[active=true]:font-semibold rounded-[10px]"
                >
                  <item.icon className="text-[#4ade80] [&_svg]:!stroke-[2.5]" size={18} />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-black/10 bg-[#003d3a]">
        <SidebarMenu className="px-2 py-2">
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="text-[#94a3b8] hover:text-white hover:bg-white/10 rounded-[10px]">
                  <User2 className="text-[#4ade80] [&_svg]:!stroke-[2.5]" size={18} />
                  <span>{user?.name || "Perfil"}</span>
                  <ChevronUp className="ml-auto text-[#64748b]" size={14} />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuItem className="text-[#94a3b8] hover:text-white hover:bg-white/10">
                  <span>Cuenta</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => { startLogout(); }}
                  className="text-[#94a3b8] hover:text-white hover:bg-white/10"
                >
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

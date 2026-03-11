import { 
  LayoutDashboard, 
  Activity, 
  Database, 
  Settings, 
  Microscope,
  Cpu,
  ChevronUp,
  User2
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Link } from "react-router-dom"

// Menú principal
const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Sensores", url: "/sensors", icon: Microscope },
  { title: "Usuarios", url: "/users", icon: Activity },
  { title: "Sedes", url: "/sites", icon: Settings },
]

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="sidebar">
    <SidebarContent>
        <SidebarGroupLabel className="text-sky-500 font-bold">DataIoT Pro</SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              {/* 2. Usamos asChild para que el botón se comporte como un Link de React Router */}
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link to={item.url}> 
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> David Díaz
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuItem><span>Cuenta</span></DropdownMenuItem>
                <DropdownMenuItem><span>Cerrar Sesión</span></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
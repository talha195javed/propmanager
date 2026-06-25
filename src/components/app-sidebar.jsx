import { NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Building2,
  UsersRound,
  UserRound,
  FileText,
  CreditCard,
  Wrench,
  ListChecks,
  MessageSquare,
  ChevronsUpDown,
  LogOut,
  BadgeCheck,
  Bell,
} from "lucide-react"

import { useAuth } from "@/AuthContext"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const navGroups = [
  {
    label: "Platform",
    items: [
      { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
      { title: "Properties", url: "/admin/properties", icon: Building2 },
      { title: "Owners", url: "/admin/owners", icon: UsersRound },
      { title: "Tenants", url: "/admin/tenants", icon: UserRound },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Lease", url: "/admin/lease", icon: FileText },
      { title: "Payments", url: "/admin/payments", icon: CreditCard },
      { title: "Maintenance", url: "/admin/maintenance", icon: Wrench },
      { title: "Tasks", url: "/admin/tasks", icon: ListChecks },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Messages", url: "/admin/messages", icon: MessageSquare },
    ],
  },
]

function BrandLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.49513 22.9912L14.5 15L22.4905 22.9912L22.4905 9.99102L14.5 5L6.49275 9.99095L6.49513 22.9912Z" fill="#2563EB" />
    </svg>
  )
}

// Navy theme matching the design — overrides the default light sidebar palette.
const NAVY_THEME = {
  "--sidebar-background": "225 85% 18%",
  "--sidebar-foreground": "0 0% 100%",
  "--sidebar-accent": "228 32% 36%",
  "--sidebar-accent-foreground": "0 0% 100%",
  "--sidebar-border": "225 40% 20%",
}

export function AppSidebar(props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const initial = user?.fullName?.charAt(0)?.toUpperCase() || "U"

  return (
    <Sidebar collapsible="icon" style={NAVY_THEME} {...props}>
      <SidebarHeader className="py-4">
        <NavLink
          to="/admin/dashboard"
          className="flex items-center justify-center gap-2 group-data-[collapsible=icon]:justify-start"
        >
          <BrandLogo />
          <span className="text-xl font-bold tracking-tight text-white group-data-[collapsible=icon]:hidden">
            PropManager
          </span>
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-white/70">{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-white font-medium hover:bg-sidebar-accent"
                          : "text-white"
                      }
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-white">{user?.fullName || "User"}</span>
                    <span className="truncate text-xs text-white/70">{user?.email || ""}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="right"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                        {initial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user?.fullName || "User"}</span>
                      <span className="truncate text-xs text-muted-foreground">{user?.email || ""}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
                    <BadgeCheck />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
                    <Bell />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

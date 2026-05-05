import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MessageSquarePlus,
  ListChecks,
  Users2,
  Coins,
  Settings,
  Building2,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { currentTenant } from "@/lib/mock-data";

const clientItems = [
  { title: "Dashboard", url: "/client/dashboard", icon: LayoutDashboard },
  { title: "Ask AI", url: "/client/chat", icon: MessageSquarePlus },
  { title: "Tasks", url: "/client/tasks", icon: ListChecks },
  { title: "Leads", url: "/client/leads", icon: Users2 },
  { title: "Credits", url: "/client/credits", icon: Coins },
  { title: "Settings", url: "/client/settings", icon: Settings },
];

const adminItems = [{ title: "Tenants", url: "/admin/tenants", icon: Building2 }];

export function AppSidebar() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const isActive = (p: string) => pathname === p;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-brand-foreground"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold tracking-tight">Intergrai</span>
            <span className="text-[11px] text-muted-foreground">Client AI Platform</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {clientItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {currentTenant.is_intergrai_admin && (
          <SidebarGroup>
            <SidebarGroupLabel>Intergrai Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
            {currentTenant.user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-xs font-medium">{currentTenant.user.name}</span>
            <span className="truncate text-[11px] text-muted-foreground">{currentTenant.name}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

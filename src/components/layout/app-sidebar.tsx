import { Link, useLocation } from "react-router-dom";
import { GraduationCap } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useInboxItems } from "@/features/inbox/use-inbox";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  growthNav,
  primaryNav,
  settingsNav,
  type NavItem,
} from "@/lib/navigation";
import { prefetchRoute } from "@/routes/lazy";

function isActivePath(pathname: string, url: string): boolean {
  if (url === "/") return pathname === "/";
  return pathname === url || pathname.startsWith(`${url}/`);
}

function NavMenu({ items }: { items: NavItem[] }) {
  const { pathname } = useLocation();
  const { data: inbox } = useInboxItems();
  const inboxCount = inbox?.length ?? 0;
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.url}>
          <SidebarMenuButton
            asChild
            isActive={isActivePath(pathname, item.url)}
            tooltip={item.title}
          >
            <Link
              to={item.url}
              onMouseEnter={() => prefetchRoute(item.url)}
              onFocus={() => prefetchRoute(item.url)}
            >
              <item.icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
          {item.url === "/inbox" && inboxCount > 0 ? (
            <SidebarMenuBadge>{inboxCount}</SidebarMenuBadge>
          ) : null}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function AppSidebar() {
  const { pathname } = useLocation();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Career OS">
              <Link to="/">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GraduationCap className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Career OS</span>
                  <span className="text-muted-foreground text-xs">
                    Your work & growth
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <NavMenu items={primaryNav} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Growth</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMenu items={growthNav} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActivePath(pathname, settingsNav.url)}
              tooltip={settingsNav.title}
            >
              <Link
                to={settingsNav.url}
                onMouseEnter={() => prefetchRoute(settingsNav.url)}
                onFocus={() => prefetchRoute(settingsNav.url)}
              >
                <settingsNav.icon />
                <span>{settingsNav.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="flex items-center justify-between gap-2 px-2 group-data-[collapsible=icon]:hidden">
            <span className="text-muted-foreground text-xs">Theme</span>
            <ThemeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

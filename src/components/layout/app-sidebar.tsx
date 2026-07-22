import { Link, useLocation } from "react-router-dom";

import { Logo } from "@/components/logo";

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

/** Subtle per-section icon colors — a Notion-style pop of color. */
const NAV_ICON_COLOR: Record<string, string> = {
  "/": "text-sky-500",
  "/inbox": "text-amber-500",
  "/tasks": "text-blue-500",
  "/activity": "text-violet-500",
  "/growth": "text-emerald-500",
  "/feedback": "text-pink-500",
  "/timeline": "text-orange-500",
  "/tags": "text-teal-500",
  "/graph": "text-indigo-500",
};

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
              <item.icon className={NAV_ICON_COLOR[item.url]} />
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
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip="Career OS"
              className="group-data-[collapsible=icon]:justify-center"
            >
              <Link to="/">
                <Logo className="size-8! shrink-0 rounded-lg" />
                <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
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

        <SidebarGroup className="mt-3 border-t border-sidebar-border/60 pt-3">
          <SidebarGroupLabel>Journey</SidebarGroupLabel>
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

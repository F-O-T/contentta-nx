import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import {
   Sidebar,
   SidebarContent,
   SidebarHeader,
   SidebarProvider,
} from "@packages/ui/components/sidebar";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type * as React from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { SettingsMobileNav } from "./settings-mobile-nav";
import { SettingsSidebar } from "./settings-sidebar";

interface SettingsLayoutProps {
   children: React.ReactNode;
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
   const isMobile = useIsMobile();
   const { pathname } = useLocation();
   const { activeOrganization } = useActiveOrganization();

   const isIndexRoute = pathname.endsWith("/settings");

   // Mobile: show navigation list at index, content with back header otherwise
   if (isMobile) {
      if (isIndexRoute) {
         return <SettingsMobileNav />;
      }

      return (
         <div className="flex h-full flex-col gap-4">
            <Button asChild className="w-fit" size="sm" variant="ghost">
               <Link
                  params={{ slug: activeOrganization.slug }}
                  to="/$slug/settings"
               >
                  <ChevronLeft className="size-4 mr-1" />
                  {translate("dashboard.routes.settings.nav.back-to-settings")}
               </Link>
            </Button>
            <div className="flex-1">{children}</div>
         </div>
      );
   }

   // Desktop: sidebar + content layout
   return (
      <SidebarProvider defaultOpen>
         <div className="flex h-full w-full gap-4">
            <Sidebar
               className="border rounded-xl bg-card shadow-sm"
               collapsible="none"
               variant="inset"
            >
               <SidebarHeader className="px-4 pt-4">
                  <h1 className="text-lg font-semibold font-serif">
                     {translate("dashboard.routes.settings.title")}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                     {translate("dashboard.routes.settings.description")}
                  </p>
               </SidebarHeader>
               <SidebarContent>
                  <SettingsSidebar />
               </SidebarContent>
            </Sidebar>
            <main className="flex-1 min-w-0">{children}</main>
         </div>
      </SidebarProvider>
   );
}

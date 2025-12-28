import { SidebarInset, SidebarProvider } from "@packages/ui/components/sidebar";
import { useIsMobile } from "@packages/ui/hooks/use-mobile";
import { cn } from "@packages/ui/lib/utils";
import type * as React from "react";
import { useEffect } from "react";
import { PWAInstallPrompt } from "@/default/pwa-install-prompt";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useLastOrganization } from "@/hooks/use-last-organization";
import { useIsStandalone } from "@/hooks/use-standalone";
import { AppSidebar } from "./app-sidebar";
import { SiteHeader } from "./site-header";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
   const isMobile = useIsMobile();
   const isStandalone = useIsStandalone();
   const showPWAPrompt = isMobile && !isStandalone;

   const { activeOrganization } = useActiveOrganization();
   const { setLastSlug } = useLastOrganization();

   useEffect(() => {
      if (activeOrganization?.slug) {
         setLastSlug(activeOrganization.slug);
      }
   }, [activeOrganization?.slug, setLastSlug]);

   return (
      <SidebarProvider defaultOpen={false}>
         <AppSidebar variant="inset" />
         <SidebarInset>
            <SiteHeader />
            <div className={cn("p-4 h-full flex-1 overflow-y-auto")}>
               {children}
            </div>
            {showPWAPrompt && <PWAInstallPrompt />}
         </SidebarInset>
      </SidebarProvider>
   );
}

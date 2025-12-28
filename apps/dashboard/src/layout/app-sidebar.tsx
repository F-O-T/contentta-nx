import { Separator } from "@packages/ui/components/separator";
import {
   Sidebar,
   SidebarContent,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from "@packages/ui/components/sidebar";
import { Link, useParams } from "@tanstack/react-router";
import type * as React from "react";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { NavMain } from "./nav-main";
import { OrganizationSwitcher } from "./organization-switcher";

function MontteBranding() {
   const { slug } = useParams({ strict: false }) as { slug: string };

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <SidebarMenuButton
               asChild
               className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
               size="lg"
            >
               <Link params={{ slug }} to="/$slug/home">
                  <div className="flex aspect-square size-8 items-center justify-center">
                     <svg
                        className="size-full"
                        fill="none"
                        viewBox="0 0 1987 1278"
                     >
                        <title>Montte Logo</title>
                        <path
                           d="M455.313 377.152L0.812988 1275.15L904.813 1276.15L455.313 377.152Z"
                           fill="#0C5343"
                        />
                        <path
                           d="M1613.81 1276.15L995.313 1276.65L681.813 656.152L682.313 655.152L994.313 1.15186L1614.81 1276.15H1613.81Z"
                           fill="#42B46E"
                        />
                        <path
                           d="M1394.81 655.152L1533.31 376.652L1985.8 1276.15H1701.81L1394.81 655.152Z"
                           fill="#379255"
                        />
                     </svg>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                     <span className="truncate font-semibold">Montte</span>
                  </div>
               </Link>
            </SidebarMenuButton>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
   const { activeSubscription } = useActiveOrganization();

   const hasProSubscription =
      activeSubscription?.plan?.toLowerCase() === "pro" &&
      (activeSubscription?.status === "active" ||
         activeSubscription?.status === "trialing");

   return (
      <Sidebar collapsible="icon" {...props}>
         <SidebarHeader>
            {hasProSubscription ? <OrganizationSwitcher /> : <MontteBranding />}
         </SidebarHeader>
         <SidebarContent>
            <Separator />
            <NavMain />
         </SidebarContent>
      </Sidebar>
   );
}

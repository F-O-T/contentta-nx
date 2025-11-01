import brandConfig from "@packages/brand/index.json";
import logo from "@packages/brand/logo.svg";
import { Separator } from "@packages/ui/components/separator";
import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarHeader,
   SidebarMenu,
   SidebarMenuItem,
} from "@packages/ui/components/sidebar";
import { Link } from "@tanstack/react-router";
import {
   Bot,
   Building2,
   FilesIcon,
   FileText,
   type LayoutDashboardIcon,
   Lightbulb,
   Target,
   Users,
} from "lucide-react";
import type * as React from "react";
import type { Session } from "@/integrations/clients";
import type { FileRoutesByTo } from "@/routeTree.gen";
import { SidebarUsageMeter } from "@/widgets/subscription/ui/sidebar-usage-meter";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

type NavigationItems = {
   url?: keyof FileRoutesByTo;
   title: string;
   icon: typeof LayoutDashboardIcon;
   subItems?: {
      url: keyof FileRoutesByTo;
      title: string;
      icon?: typeof LayoutDashboardIcon;
   }[];
};

export function AppSidebar({
   session,
   ...props
}: React.ComponentProps<typeof Sidebar> & { session: Session | null }) {
   const navMain: NavigationItems[] = [
      {
         icon: FilesIcon,
         subItems: [
            {
               icon: Bot,
               title: "Content Agents",
               url: "/agents",
            },
            {
               icon: Lightbulb,
               title: "Content Ideas",
               url: "/ideas",
            },
            {
               icon: FileText,
               title: "Created Content",
               url: "/content",
            },
         ],
         title: "Content",
      },
      {
         icon: Target,
         title: "Competitors",
         url: "/competitors",
      },
      {
         icon: Building2,
         subItems: [
            {
               icon: Building2,
               title: "Organization Overview",
               url: "/organization",
            },
            {
               icon: Users,
               title: "Members",
               url: "/organization/members",
            },
            {
               icon: FileText,
               title: "Brand Files",
               url: "/organization/brand",
            },
         ],
         title: "Organization",
      },
   ];

   return (
      <Sidebar collapsible="offcanvas" {...props}>
         <SidebarHeader>
            <SidebarMenu>
               <SidebarMenuItem>
                  <Link className="flex items-center gap-2" to="/home">
                     <figure className="text-primary">
                        <img
                           alt="Project logo"
                           className="w-8 h-8"
                           src={logo}
                        />
                     </figure>

                     <span className="text-lg font-semibold">
                        {brandConfig.name}
                     </span>
                  </Link>
               </SidebarMenuItem>
            </SidebarMenu>
         </SidebarHeader>
         <SidebarContent>
            <Separator />
            <NavMain items={navMain} />
         </SidebarContent>
         <SidebarFooter>
            <SidebarUsageMeter />
            <Separator />
            <NavUser session={session} />
         </SidebarFooter>
      </Sidebar>
   );
}

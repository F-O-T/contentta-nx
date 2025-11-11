import { Separator } from "@packages/ui/components/separator";
import {
   Sidebar,
   SidebarContent,
   SidebarFooter,
   SidebarHeader,
} from "@packages/ui/components/sidebar";
import {
   Bot,
   FilesIcon,
   FileText,
   type LayoutDashboardIcon,
   Lightbulb,
   Target,
} from "lucide-react";
import type * as React from "react";
import type { FileRoutesByTo } from "@/routeTree.gen";
import { SidebarUsageMeter } from "@/widgets/subscription/ui/sidebar-usage-meter";
import { NavMain } from "./nav-main";
import { OrganizationSwitcher } from "./organization-switcher";

type NavigationItems = {
   url?: keyof FileRoutesByTo;
   title: string;
   icon: typeof LayoutDashboardIcon;
   disabled?: boolean;
   subItems?: {
      url: keyof FileRoutesByTo;
      title: string;
      icon?: typeof LayoutDashboardIcon;
      disabled?: boolean;
   }[];
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
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
   ];

   return (
      <Sidebar collapsible="offcanvas" {...props}>
         <SidebarHeader>
            <OrganizationSwitcher />
         </SidebarHeader>
         <SidebarContent>
            <Separator />
            <NavMain items={navMain} />
         </SidebarContent>
         <SidebarFooter>
            <SidebarUsageMeter />
         </SidebarFooter>
      </Sidebar>
   );
}

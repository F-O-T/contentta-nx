import { translate } from "@packages/localization";
import {
   SidebarGroup,
   SidebarGroupContent,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from "@packages/ui/components/sidebar";
import { Link, useLocation } from "@tanstack/react-router";
import { Building, Mail, Users, Users2 } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-active-organization";

const organizationNavItems = [
   {
      href: "/$slug/organization",
      icon: Building,
      id: "overview",
      title: translate("dashboard.routes.organization.nav.overview"),
   },
   {
      href: "/$slug/organization/members",
      icon: Users,
      id: "members",
      title: translate("dashboard.routes.organization.nav.members"),
   },
   {
      href: "/$slug/organization/teams",
      icon: Users2,
      id: "teams",
      title: translate("dashboard.routes.organization.nav.teams"),
   },
   {
      href: "/$slug/organization/invites",
      icon: Mail,
      id: "invites",
      title: translate("dashboard.routes.organization.nav.invites"),
   },
];

export { organizationNavItems };

export function OrganizationSidebar() {
   const { activeOrganization } = useActiveOrganization();
   const { pathname } = useLocation();

   const isActive = (href: string) => {
      const resolvedHref = href.replace("$slug", activeOrganization.slug);
      // Exact match for overview, startsWith for others
      if (href === "/$slug/organization") {
         return pathname === resolvedHref;
      }
      return pathname.startsWith(resolvedHref);
   };

   return (
      <SidebarGroup>
         <SidebarGroupContent>
            <SidebarMenu>
               {organizationNavItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                     <SidebarMenuButton
                        asChild
                        className={
                           isActive(item.href)
                              ? "bg-primary/10 text-primary rounded-lg"
                              : ""
                        }
                     >
                        <Link
                           params={{ slug: activeOrganization.slug }}
                           to={item.href}
                        >
                           <item.icon />
                           <span>{item.title}</span>
                        </Link>
                     </SidebarMenuButton>
                  </SidebarMenuItem>
               ))}
            </SidebarMenu>
         </SidebarGroupContent>
      </SidebarGroup>
   );
}

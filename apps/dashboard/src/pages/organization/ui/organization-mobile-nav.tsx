import { translate } from "@packages/localization";
import { QuickAccessCard } from "@packages/ui/components/quick-access-card";
import { useNavigate } from "@tanstack/react-router";
import { Building, Mail, Users, Users2 } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-active-organization";

const organizationNavItems = [
   {
      description: translate(
         "dashboard.routes.organization.nav.overview.description",
      ),
      href: "/$slug/organization",
      icon: Building,
      id: "overview",
      title: translate("dashboard.routes.organization.nav.overview"),
   },
   {
      description: translate(
         "dashboard.routes.organization.nav.members.description",
      ),
      href: "/$slug/organization/members",
      icon: Users,
      id: "members",
      title: translate("dashboard.routes.organization.nav.members"),
   },
   {
      description: translate(
         "dashboard.routes.organization.nav.teams.description",
      ),
      href: "/$slug/organization/teams",
      icon: Users2,
      id: "teams",
      title: translate("dashboard.routes.organization.nav.teams"),
   },
   {
      description: translate(
         "dashboard.routes.organization.nav.invites.description",
      ),
      href: "/$slug/organization/invites",
      icon: Mail,
      id: "invites",
      title: translate("dashboard.routes.organization.nav.invites"),
   },
];

export function OrganizationMobileNav() {
   const { activeOrganization } = useActiveOrganization();
   const navigate = useNavigate();

   return (
      <div className="grid gap-4">
         {organizationNavItems.map((item) => (
            <QuickAccessCard
               description={item.description}
               icon={<item.icon className="size-4" />}
               key={item.id}
               onClick={() =>
                  navigate({
                     params: { slug: activeOrganization.slug },
                     to: item.href,
                  })
               }
               title={item.title}
            />
         ))}
      </div>
   );
}

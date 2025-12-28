import { translate } from "@packages/localization";
import { QuickAccessCard } from "@packages/ui/components/quick-access-card";
import { useRouter } from "@tanstack/react-router";
import { Building2, Mail, Users } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-active-organization";

export function QuickAccessCards() {
   const router = useRouter();
   const { activeOrganization } = useActiveOrganization();
   const quickAccessItems = [
      {
         description: translate(
            "dashboard.routes.organization.quick-access-section.teams.description",
         ),
         icon: <Building2 className="size-5" />,
         onClick: () =>
            router.navigate({
               params: {
                  slug: activeOrganization.slug,
               },
               to: "/$slug/organization/teams",
            }),
         title: translate(
            "dashboard.routes.organization.quick-access-section.teams.title",
         ),
      },
      {
         description: translate(
            "dashboard.routes.organization.quick-access-section.members.description",
         ),
         icon: <Users className="size-5" />,
         onClick: () =>
            router.navigate({
               params: { slug: activeOrganization.slug },
               to: "/$slug/organization/members",
            }),
         title: translate(
            "dashboard.routes.organization.quick-access-section.members.title",
         ),
      },
      {
         description: translate(
            "dashboard.routes.organization.quick-access-section.invitations.description",
         ),
         icon: <Mail className="size-5" />,
         onClick: () =>
            router.navigate({
               params: { slug: activeOrganization.slug },
               to: "/$slug/organization/invites",
            }),
         title: translate(
            "dashboard.routes.organization.quick-access-section.invitations.title",
         ),
      },
   ];

   return (
      <div className="col-span-1 grid grid-cols-2 gap-4">
         {quickAccessItems.map((item, index) => (
            <QuickAccessCard
               description={item.description}
               icon={item.icon}
               key={`quick-access-${index + 1}`}
               onClick={item.onClick}
               title={item.title}
            />
         ))}
      </div>
   );
}

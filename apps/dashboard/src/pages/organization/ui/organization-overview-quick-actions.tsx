import { translate } from "@packages/localization";
import { QuickAccessCard } from "@packages/ui/components/quick-access-card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { Mail, Settings, UserPlus, Users } from "lucide-react";
import { ManageOrganizationForm } from "@/features/organization/ui/manage-organization-form";
import { SendInvitationForm } from "@/features/organization/ui/send-invitation-form";
import { useActiveOrganization } from "@/hooks/use-active-organization";
import { useSheet } from "@/hooks/use-sheet";
import { useTRPC } from "@/integrations/clients";

export function OrganizationOverviewQuickActions() {
   const { openSheet } = useSheet();
   const router = useRouter();
   const trpc = useTRPC();
   const { activeOrganization } = useActiveOrganization();

   const { data: organizationData } = useSuspenseQuery(
      trpc.organization.getActiveOrganization.queryOptions(),
   );

   const quickActions = [
      {
         description: translate(
            "dashboard.routes.organization.quick-actions.invite-member.description",
         ),
         icon: <UserPlus className="size-6" />,
         onClick: () => openSheet({ children: <SendInvitationForm /> }),
         title: translate(
            "dashboard.routes.organization.quick-actions.invite-member.title",
         ),
      },
      {
         description: translate(
            "dashboard.routes.organization.quick-actions.manage-members.description",
         ),
         icon: <Users className="size-6" />,
         onClick: () =>
            router.navigate({
               params: { slug: activeOrganization.slug },
               to: "/$slug/organization/members",
            }),
         title: translate(
            "dashboard.routes.organization.quick-actions.manage-members.title",
         ),
      },
      {
         description: translate(
            "dashboard.routes.organization.quick-actions.view-invites.description",
         ),
         icon: <Mail className="size-6" />,
         onClick: () =>
            router.navigate({
               params: { slug: activeOrganization.slug },
               to: "/$slug/organization/invites",
            }),
         title: translate(
            "dashboard.routes.organization.quick-actions.view-invites.title",
         ),
      },
      {
         description: translate(
            "dashboard.routes.organization.quick-actions.settings.description",
         ),
         icon: <Settings className="size-6" />,
         onClick: () =>
            openSheet({
               children: (
                  <ManageOrganizationForm
                     organization={organizationData.organization}
                  />
               ),
            }),
         title: translate(
            "dashboard.routes.organization.quick-actions.settings.title",
         ),
      },
   ];

   return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
         {quickActions.map((action, index) => (
            <QuickAccessCard
               description={action.description}
               icon={action.icon}
               key={`org-quick-action-${index + 1}`}
               onClick={action.onClick}
               title={action.title}
            />
         ))}
      </div>
   );
}

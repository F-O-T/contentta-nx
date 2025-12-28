import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { MailPlus } from "lucide-react";
import { SendInvitationForm } from "@/features/organization/ui/send-invitation-form";
import { useSheet } from "@/hooks/use-sheet";

export function InvitesQuickActionsToolbar() {
   const { openSheet } = useSheet();

   return (
      <Button
         onClick={() =>
            openSheet({
               children: <SendInvitationForm />,
            })
         }
      >
         <MailPlus className="size-4" />
         {translate("dashboard.routes.organization.invites-table.actions.send")}
      </Button>
   );
}

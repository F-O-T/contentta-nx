import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { useSheet } from "@/hooks/use-sheet";
import { InviteMemberForm } from "../features/invite-member-form";

export function MembersQuickActionsToolbar() {
   const { openSheet } = useSheet();

   return (
      <Button
         onClick={() =>
            openSheet({
               children: <InviteMemberForm />,
            })
         }
      >
         <Plus className="size-4" />
         {translate(
            "dashboard.routes.organization.members-table.actions.invite",
         )}
      </Button>
   );
}

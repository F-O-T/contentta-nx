import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { ManageContentForm } from "@/features/content/ui/manage-content-form";
import { useSheet } from "@/hooks/use-sheet";

type ContentQuickActionsToolbarProps = {
	agentId?: string;
};

export function ContentQuickActionsToolbar({ agentId }: ContentQuickActionsToolbarProps) {
	const { openSheet } = useSheet();

	return (
		<Button onClick={() => openSheet({ children: <ManageContentForm agentId={agentId} /> })}>
			<Plus className="size-4" />
			{translate("dashboard.routes.content.actions.create")}
		</Button>
	);
}

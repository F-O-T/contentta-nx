import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { ManageWriterForm } from "@/features/writers/ui/manage-writer-form";
import { useSheet } from "@/hooks/use-sheet";

export function WritersQuickActionsToolbar() {
	const { openSheet } = useSheet();

	return (
		<Button onClick={() => openSheet({ children: <ManageWriterForm /> })}>
			<Plus className="size-4" />
			{translate("dashboard.routes.writers.actions.create")}
		</Button>
	);
}

import { translate } from "@packages/localization";
import { Button } from "@packages/ui/components/button";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import { DefaultHeader } from "@/default/default-header";
import { WritersListProvider } from "@/features/writers/lib/writers-list-context";
import { ManageWriterForm } from "@/features/writers/ui/manage-writer-form";
import { useSheet } from "@/hooks/use-sheet";
import { WritersFilterBar, WritersFilterBarSkeleton } from "./writers-filter-bar";
import { WritersListSection } from "./writers-list-section";
import { WritersStats } from "./writers-stats";

function WritersPageContent() {
	const { openSheet } = useSheet();

	const handleCreateWriter = () => {
		openSheet({
			children: <ManageWriterForm />,
		});
	};

	return (
		<main className="space-y-6">
			<DefaultHeader
				actions={
					<Button onClick={handleCreateWriter}>
						<Plus className="size-4" />
						{translate("dashboard.routes.writers.actions.create")}
					</Button>
				}
				description={translate("dashboard.routes.writers.description")}
				title={translate("dashboard.routes.writers.title")}
			/>

			<WritersStats />

			<Suspense fallback={<WritersFilterBarSkeleton />}>
				<WritersFilterBar />
			</Suspense>

			<WritersListSection />
		</main>
	);
}

export function WritersPage() {
	return (
		<WritersListProvider>
			<WritersPageContent />
		</WritersListProvider>
	);
}

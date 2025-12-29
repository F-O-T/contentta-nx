import { translate } from "@packages/localization";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PenLineIcon } from "lucide-react";
import { toast } from "sonner";
import { OnboardingWriterForm } from "@/features/onboarding/ui/onboarding-writer-form";
import { useTRPC } from "@/integrations/clients";

export const Route = createFileRoute("/$slug/onboarding")({
	component: RouteComponent,
});

function RouteComponent() {
	const trpc = useTRPC();
	const navigate = useNavigate({ from: "/$slug/onboarding" });
	const { slug } = Route.useParams();

	const completeOnboarding = useMutation(
		trpc.onboarding.completeOnboarding.mutationOptions({
			onError: () => {
				toast.error(translate("common.errors.default"));
			},
			onSuccess: () => {
				navigate({ params: { slug }, to: "/$slug/home" });
			},
		}),
	);

	const handleWriterCreated = async () => {
		await completeOnboarding.mutateAsync();
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center p-4">
			<div className="w-full max-w-md space-y-8">
				<div className="text-center space-y-4">
					<div className="mx-auto p-4 rounded-full bg-primary/10 w-fit">
						<PenLineIcon className="size-12 text-primary" />
					</div>

					<div className="space-y-2">
						<h1 className="text-3xl font-semibold font-serif">
							{translate("dashboard.routes.onboarding.writer.title")}
						</h1>
						<p className="text-muted-foreground">
							{translate("dashboard.routes.onboarding.writer.description")}
						</p>
					</div>
				</div>

				<div className="p-6 rounded-lg border bg-card">
					<OnboardingWriterForm onSuccess={handleWriterCreated} />
				</div>
			</div>
		</div>
	);
}

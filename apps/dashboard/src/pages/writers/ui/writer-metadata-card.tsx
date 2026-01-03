import { translate } from "@packages/localization";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@packages/ui/components/card";
import { Skeleton } from "@packages/ui/components/skeleton";
import { Calendar, FileText } from "lucide-react";
import { WriterPhotoUpload } from "@/features/writers/ui/writer-photo-upload";

type Writer = {
	id: string;
	personaConfig: {
		metadata: {
			name: string;
			description?: string;
		};
	};
	profilePhotoUrl?: string | null;
	contentCount?: number;
	createdAt: string | Date;
};

type WriterMetadataCardProps = {
	writer: Writer;
};

function MetadataItem({
	icon: Icon,
	label,
	value,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	value: string | number;
}) {
	return (
		<div className="flex items-center gap-3 py-3 border-b last:border-0">
			<div className="flex items-center justify-center size-8 rounded-lg bg-muted">
				<Icon className="size-4 text-muted-foreground" />
			</div>
			<div className="flex-1 min-w-0">
				<p className="text-sm text-muted-foreground">{label}</p>
				<p className="font-medium truncate">{value}</p>
			</div>
		</div>
	);
}

export function WriterMetadataCard({ writer }: WriterMetadataCardProps) {
	const createdDate = new Date(writer.createdAt).toLocaleDateString(undefined, {
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>{translate("dashboard.routes.writers.details.metadata-title")}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Photo and Name Section */}
				<div className="flex flex-col items-center text-center gap-4">
					<WriterPhotoUpload
						agentId={writer.id}
						currentPhotoUrl={writer.profilePhotoUrl}
						name={writer.personaConfig.metadata.name}
						size="lg"
					/>
					<div>
						<h3 className="text-lg font-semibold">
							{writer.personaConfig.metadata.name}
						</h3>
						{writer.personaConfig.metadata.description && (
							<p className="text-sm text-muted-foreground mt-1">
								{writer.personaConfig.metadata.description}
							</p>
						)}
					</div>
				</div>

				{/* Metadata Items */}
				<div>
					<MetadataItem
						icon={FileText}
						label={translate("dashboard.routes.writers.table.content-count")}
						value={writer.contentCount ?? 0}
					/>
					<MetadataItem
						icon={Calendar}
						label={translate("dashboard.routes.writers.details.created")}
						value={createdDate}
					/>
				</div>
			</CardContent>
		</Card>
	);
}

export function WriterMetadataCardSkeleton() {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-6 w-32" />
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="flex flex-col items-center gap-4">
					<Skeleton className="size-24 rounded-full" />
					<div className="text-center">
						<Skeleton className="h-6 w-32 mx-auto" />
						<Skeleton className="h-4 w-48 mx-auto mt-2" />
					</div>
				</div>
				<div>
					<div className="flex items-center gap-3 py-3 border-b">
						<Skeleton className="size-8 rounded-lg" />
						<div className="flex-1">
							<Skeleton className="h-4 w-20 mb-1" />
							<Skeleton className="h-5 w-12" />
						</div>
					</div>
					<div className="flex items-center gap-3 py-3">
						<Skeleton className="size-8 rounded-lg" />
						<div className="flex-1">
							<Skeleton className="h-4 w-24 mb-1" />
							<Skeleton className="h-5 w-32" />
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

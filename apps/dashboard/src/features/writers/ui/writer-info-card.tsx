import { translate } from "@packages/localization";
import { Avatar, AvatarFallback, AvatarImage } from "@packages/ui/components/avatar";
import { Badge } from "@packages/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@packages/ui/components/card";
import { Calendar, MessageSquare, Palette, Target, Users } from "lucide-react";

type Writer = {
	id: string;
	personaConfig: {
		metadata: {
			name: string;
			description?: string;
		};
		instructions?: {
			writingGuidelines?: string;
			audienceProfile?: string;
			tone?: string;
			style?: string;
		};
	};
	profilePhotoUrl?: string | null;
	contentCount: number;
	createdAt: string;
};

type WriterInfoCardProps = {
	writer: Writer;
};

export function WriterInfoCard({ writer }: WriterInfoCardProps) {
	const name = writer.personaConfig.metadata.name;
	const initials = name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start gap-4">
					<Avatar className="size-16">
						<AvatarImage alt={name} src={writer.profilePhotoUrl ?? undefined} />
						<AvatarFallback className="text-xl">{initials}</AvatarFallback>
					</Avatar>
					<div className="flex-1 min-w-0">
						<CardTitle className="text-xl">{name}</CardTitle>
						{writer.personaConfig.metadata.description && (
							<CardDescription className="mt-1">
								{writer.personaConfig.metadata.description}
							</CardDescription>
						)}
						<div className="flex items-center gap-2 mt-2">
							<Badge variant="secondary">
								{writer.contentCount} {translate("dashboard.routes.writers.table.contents")}
							</Badge>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent className="grid gap-4">
				{writer.personaConfig.instructions?.tone && (
					<div className="flex items-start gap-3">
						<MessageSquare className="size-4 text-muted-foreground mt-0.5" />
						<div>
							<p className="text-sm font-medium">
								{translate("dashboard.routes.writers.details.tone")}
							</p>
							<p className="text-sm text-muted-foreground">
								{writer.personaConfig.instructions.tone}
							</p>
						</div>
					</div>
				)}

				{writer.personaConfig.instructions?.style && (
					<div className="flex items-start gap-3">
						<Palette className="size-4 text-muted-foreground mt-0.5" />
						<div>
							<p className="text-sm font-medium">
								{translate("dashboard.routes.writers.details.style")}
							</p>
							<p className="text-sm text-muted-foreground">
								{writer.personaConfig.instructions.style}
							</p>
						</div>
					</div>
				)}

				{writer.personaConfig.instructions?.audienceProfile && (
					<div className="flex items-start gap-3">
						<Target className="size-4 text-muted-foreground mt-0.5" />
						<div>
							<p className="text-sm font-medium">
								{translate("dashboard.routes.writers.details.audience")}
							</p>
							<p className="text-sm text-muted-foreground">
								{writer.personaConfig.instructions.audienceProfile}
							</p>
						</div>
					</div>
				)}

				{writer.personaConfig.instructions?.writingGuidelines && (
					<div className="flex items-start gap-3">
						<Users className="size-4 text-muted-foreground mt-0.5" />
						<div>
							<p className="text-sm font-medium">
								{translate("dashboard.routes.writers.details.guidelines")}
							</p>
							<p className="text-sm text-muted-foreground whitespace-pre-wrap">
								{writer.personaConfig.instructions.writingGuidelines}
							</p>
						</div>
					</div>
				)}

				<div className="flex items-start gap-3">
					<Calendar className="size-4 text-muted-foreground mt-0.5" />
					<div>
						<p className="text-sm font-medium">
							{translate("dashboard.routes.writers.details.created")}
						</p>
						<p className="text-sm text-muted-foreground">
							{new Date(writer.createdAt).toLocaleDateString()}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

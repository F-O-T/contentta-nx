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
import { Link } from "@tanstack/react-router";
import { Calendar, FileText, Hash, Link as LinkIcon, Tag, User } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
	archived: "bg-slate-500/10 text-slate-600 border-slate-200",
	draft: "bg-amber-500/10 text-amber-600 border-amber-200",
	published: "bg-green-500/10 text-green-600 border-green-200",
};

type ContentInfoCardProps = {
	content: {
		id: string;
		meta: {
			title: string;
			description: string;
			slug: string;
			keywords?: string[];
			sources?: string[];
		};
		status: string;
		createdAt: string;
		agent?: {
			id: string;
			name: string;
			profilePhotoUrl?: string | null;
		} | null;
	};
	slug: string;
};

export function ContentInfoCard({ content, slug }: ContentInfoCardProps) {
	const agent = content.agent;
	const initials = agent?.name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-start justify-between gap-4">
					<div className="flex-1 min-w-0">
						<CardTitle className="text-xl truncate">
							{content.meta.title || translate("common.labels.untitled")}
						</CardTitle>
						<CardDescription className="mt-1">
							{content.meta.description}
						</CardDescription>
					</div>
					<Badge className={STATUS_COLORS[content.status]} variant="outline">
						{translate(`common.status.${content.status}`)}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="grid gap-4">
				{agent && (
					<div className="flex items-center gap-3">
						<User className="size-4 text-muted-foreground" />
						<Link
							className="flex items-center gap-2 hover:underline"
							to="/$slug/writers/$writerId"
							params={{ slug, writerId: agent.id }}
						>
							<Avatar className="size-6">
								<AvatarImage alt={agent.name} src={agent.profilePhotoUrl ?? undefined} />
								<AvatarFallback className="text-xs">{initials}</AvatarFallback>
							</Avatar>
							<span className="text-sm">{agent.name}</span>
						</Link>
					</div>
				)}

				<div className="flex items-start gap-3">
					<Hash className="size-4 text-muted-foreground mt-0.5" />
					<div>
						<p className="text-sm font-medium">
							{translate("dashboard.routes.content.details.slug")}
						</p>
						<p className="text-sm text-muted-foreground font-mono">
							/{content.meta.slug}
						</p>
					</div>
				</div>

				{content.meta.keywords && content.meta.keywords.length > 0 && (
					<div className="flex items-start gap-3">
						<Tag className="size-4 text-muted-foreground mt-0.5" />
						<div>
							<p className="text-sm font-medium">
								{translate("dashboard.routes.content.details.keywords")}
							</p>
							<div className="flex flex-wrap gap-1 mt-1">
								{content.meta.keywords.map((keyword) => (
									<Badge key={keyword} variant="secondary" className="text-xs">
										{keyword}
									</Badge>
								))}
							</div>
						</div>
					</div>
				)}

				{content.meta.sources && content.meta.sources.length > 0 && (
					<div className="flex items-start gap-3">
						<LinkIcon className="size-4 text-muted-foreground mt-0.5" />
						<div>
							<p className="text-sm font-medium">
								{translate("dashboard.routes.content.details.sources")}
							</p>
							<ul className="text-sm text-muted-foreground mt-1 space-y-1">
								{content.meta.sources.map((source, index) => (
									<li key={`source-${index + 1}`} className="truncate">
										<a
											className="hover:underline"
											href={source}
											rel="noopener noreferrer"
											target="_blank"
										>
											{source}
										</a>
									</li>
								))}
							</ul>
						</div>
					</div>
				)}

				<div className="flex items-start gap-3">
					<Calendar className="size-4 text-muted-foreground mt-0.5" />
					<div>
						<p className="text-sm font-medium">
							{translate("dashboard.routes.content.details.created")}
						</p>
						<p className="text-sm text-muted-foreground">
							{new Date(content.createdAt).toLocaleDateString()}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

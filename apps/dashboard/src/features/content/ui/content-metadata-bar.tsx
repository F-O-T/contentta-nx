import { translate } from "@packages/localization";
import { Avatar, AvatarFallback, AvatarImage } from "@packages/ui/components/avatar";
import { Badge } from "@packages/ui/components/badge";
import { Button } from "@packages/ui/components/button";
import { Separator } from "@packages/ui/components/separator";
import { cn } from "@packages/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { Calendar, Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type ContentMetadataBarProps = {
	content: {
		meta: {
			slug: string;
			keywords?: string[];
		};
		body?: string | null;
		createdAt: Date;
		agent?: {
			id: string;
			name: string;
			profilePhotoUrl?: string | null;
		} | null;
		stats?: {
			qualityScore: string;
			readTimeMinutes: string;
			wordsCount: string;
		} | null;
	};
	slug: string;
	className?: string;
};

export function ContentMetadataBar({
	content,
	slug,
	className,
}: ContentMetadataBarProps) {
	const [copied, setCopied] = useState(false);

	const agent = content.agent;
	const initials = agent?.name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	// Calculate stats
	const wordCount = content.stats?.wordsCount
		? Number.parseInt(content.stats.wordsCount, 10)
		: content.body?.split(/\s+/).filter(Boolean).length ?? 0;

	const readTime = content.stats?.readTimeMinutes
		? Number.parseInt(content.stats.readTimeMinutes, 10)
		: Math.max(1, Math.ceil(wordCount / 200));

	const handleCopySlug = async () => {
		try {
			await navigator.clipboard.writeText(`/${content.meta.slug}`);
			setCopied(true);
			toast.success("Copied to clipboard");
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error(translate("common.errors.default"));
		}
	};

	const formattedDate = new Date(content.createdAt).toLocaleDateString(
		undefined,
		{
			year: "numeric",
			month: "short",
			day: "numeric",
		},
	);

	const keywords = content.meta.keywords ?? [];

	return (
		<div
			className={cn(
				"flex flex-wrap items-center gap-x-4 gap-y-2 text-sm border-b pb-3",
				className,
			)}
		>
			{/* Agent */}
			{agent && (
				<>
					<Link
						to="/$slug/writers/$writerId"
						params={{ slug, writerId: agent.id }}
						className="flex items-center gap-2 hover:underline"
					>
						<Avatar className="size-5">
							<AvatarImage
								alt={agent.name}
								src={agent.profilePhotoUrl ?? undefined}
							/>
							<AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
						</Avatar>
						<span className="text-muted-foreground">{agent.name}</span>
					</Link>
					<Separator orientation="vertical" className="h-4" />
				</>
			)}

			{/* Slug */}
			<div className="flex items-center gap-1">
				<span className="text-muted-foreground font-mono text-xs">
					/{content.meta.slug}
				</span>
				<Button
					size="icon"
					variant="ghost"
					className="size-5"
					onClick={handleCopySlug}
				>
					{copied ? (
						<Check className="size-3 text-green-500" />
					) : (
						<Copy className="size-3" />
					)}
				</Button>
			</div>

			<Separator orientation="vertical" className="h-4" />

			{/* Date */}
			<div className="flex items-center gap-1.5 text-muted-foreground">
				<Calendar className="size-3" />
				<span>{formattedDate}</span>
			</div>

			<Separator orientation="vertical" className="h-4" />

			{/* Stats */}
			<div className="flex items-center gap-3 text-muted-foreground">
				<span>{wordCount.toLocaleString()} words</span>
				<span>{readTime} min read</span>
			</div>

			{/* Keywords */}
			{keywords.length > 0 && (
				<>
					<Separator orientation="vertical" className="h-4" />
					<div className="flex items-center gap-1">
						{keywords.slice(0, 3).map((keyword) => (
							<Badge key={keyword} variant="secondary" className="text-xs">
								{keyword}
							</Badge>
						))}
						{keywords.length > 3 && (
							<span className="text-xs text-muted-foreground">
								+{keywords.length - 3}
							</span>
						)}
					</div>
				</>
			)}
		</div>
	);
}

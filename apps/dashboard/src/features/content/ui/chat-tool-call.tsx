import { cn } from "@packages/ui/lib/utils";
import {
	Wrench,
	CheckCircle2,
	XCircle,
	Loader2,
	Clock,
	Type,
	Heading,
	List,
	Code,
	Table,
	Image,
	Search,
	Globe,
	BarChart,
	FileText,
	Replace,
	Trash2,
	Paintbrush,
	ChevronDown,
	ChevronUp,
	FileEdit,
	Tag,
	Link2,
	Hash,
} from "lucide-react";
import { useState } from "react";
import type { ToolCall, ToolCallStatus } from "../context/chat-context";

interface ChatToolCallProps {
	toolCall: ToolCall;
	defaultExpanded?: boolean;
}

/**
 * Get icon for a specific tool
 */
function getToolIcon(toolName: string) {
	const iconMap: Record<string, React.ReactNode> = {
		// Editor tools
		insertText: <Type className="size-3.5" />,
		insertHeading: <Heading className="size-3.5" />,
		insertList: <List className="size-3.5" />,
		insertCodeBlock: <Code className="size-3.5" />,
		insertTable: <Table className="size-3.5" />,
		insertImage: <Image className="size-3.5" />,
		replaceText: <Replace className="size-3.5" />,
		deleteText: <Trash2 className="size-3.5" />,
		formatText: <Paintbrush className="size-3.5" />,
		// Frontmatter tools
		editTitle: <FileEdit className="size-3.5" />,
		editDescription: <FileText className="size-3.5" />,
		editSlug: <Link2 className="size-3.5" />,
		editKeywords: <Tag className="size-3.5" />,
		// Analysis tools
		seoScore: <BarChart className="size-3.5" />,
		readability: <FileText className="size-3.5" />,
		keywordDensity: <Hash className="size-3.5" />,
		// Research tools
		webSearch: <Search className="size-3.5" />,
		webCrawl: <Globe className="size-3.5" />,
		serpAnalysis: <Search className="size-3.5" />,
		competitorContent: <FileText className="size-3.5" />,
	};

	return iconMap[toolName] || <Wrench className="size-3.5" />;
}

/**
 * Get human-readable tool name
 */
function getToolLabel(toolName: string): string {
	const labelMap: Record<string, string> = {
		// Editor tools
		insertText: "Insert Text",
		insertHeading: "Insert Heading",
		insertList: "Insert List",
		insertCodeBlock: "Insert Code Block",
		insertTable: "Insert Table",
		insertImage: "Insert Image",
		replaceText: "Replace Text",
		deleteText: "Delete Text",
		formatText: "Format Text",
		// Frontmatter tools
		editTitle: "Edit Title",
		editDescription: "Edit Description",
		editSlug: "Edit Slug",
		editKeywords: "Edit Keywords",
		// Analysis tools
		seoScore: "SEO Analysis",
		readability: "Readability Check",
		keywordDensity: "Keyword Analysis",
		// Research tools
		webSearch: "Web Search",
		webCrawl: "Web Crawl",
		serpAnalysis: "SERP Analysis",
		competitorContent: "Competitor Analysis",
	};

	return (
		labelMap[toolName] ||
		// Fallback: convert camelCase to Title Case
		toolName
			.replace(/([A-Z])/g, " $1")
			.replace(/^./, (str) => str.toUpperCase())
			.trim()
	);
}

/**
 * Get status icon and styling
 */
function getStatusDisplay(status: ToolCallStatus): {
	icon: React.ReactNode;
	className: string;
	label: string;
} {
	switch (status) {
		case "pending":
			return {
				icon: <Clock className="size-3" />,
				className: "text-muted-foreground",
				label: "Pending",
			};
		case "executing":
			return {
				icon: <Loader2 className="size-3 animate-spin" />,
				className: "text-primary",
				label: "Running",
			};
		case "completed":
			return {
				icon: <CheckCircle2 className="size-3" />,
				className: "text-green-500",
				label: "Done",
			};
		case "error":
			return {
				icon: <XCircle className="size-3" />,
				className: "text-destructive",
				label: "Failed",
			};
		default:
			return {
				icon: <Clock className="size-3" />,
				className: "text-muted-foreground",
				label: "Unknown",
			};
	}
}

/**
 * Format args for display
 */
function formatArgs(args: Record<string, unknown>): string {
	const entries = Object.entries(args);
	if (entries.length === 0) return "No arguments";

	return entries
		.map(([key, value]) => {
			if (typeof value === "string") {
				const truncated =
					value.length > 50 ? `${value.slice(0, 50)}...` : value;
				return `${key}: "${truncated}"`;
			}
			if (Array.isArray(value)) {
				return `${key}: [${value.length} items]`;
			}
			return `${key}: ${JSON.stringify(value)}`;
		})
		.join("\n");
}

/**
 * Format result for display
 */
function formatResult(result: unknown): string {
	if (!result) return "No result";
	if (typeof result === "string") return result;
	if (typeof result === "object") {
		try {
			return JSON.stringify(result, null, 2);
		} catch {
			return String(result);
		}
	}
	return String(result);
}

export function ChatToolCall({
	toolCall,
	defaultExpanded = false,
}: ChatToolCallProps) {
	const [isExpanded, setIsExpanded] = useState(defaultExpanded);
	const statusDisplay = getStatusDisplay(toolCall.status);
	const hasDetails = toolCall.args || toolCall.result || toolCall.error;

	return (
		<div
			className={cn(
				"rounded-lg border overflow-hidden transition-all",
				toolCall.status === "completed" && "border-green-500/30",
				toolCall.status === "executing" &&
					"border-primary/50 shadow-sm shadow-primary/10",
				toolCall.status === "error" && "border-destructive/30",
				toolCall.status === "pending" && "border-border",
			)}
		>
			{/* Header */}
			<div
				className={cn(
					"flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors",
					toolCall.status === "completed" && "bg-green-500/5",
					toolCall.status === "executing" && "bg-primary/5",
					toolCall.status === "error" && "bg-destructive/5",
					toolCall.status === "pending" && "bg-muted/30",
					hasDetails && "hover:bg-muted/50",
				)}
				onClick={() => hasDetails && setIsExpanded(!isExpanded)}
			>
				{/* Tool icon with status ring */}
				<div
					className={cn(
						"flex size-6 items-center justify-center rounded-md transition-colors",
						toolCall.status === "executing" && "bg-primary/10 animate-pulse",
						toolCall.status === "completed" && "bg-green-500/10",
						toolCall.status === "error" && "bg-destructive/10",
						toolCall.status === "pending" && "bg-muted",
					)}
				>
					{getToolIcon(toolCall.name)}
				</div>

				{/* Tool name */}
				<span className="font-medium">{getToolLabel(toolCall.name)}</span>

				{/* Spacer */}
				<div className="flex-1" />

				{/* Status badge */}
				<div
					className={cn(
						"flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium",
						toolCall.status === "executing" && "bg-primary/10 text-primary",
						toolCall.status === "completed" && "bg-green-500/10 text-green-600",
						toolCall.status === "error" && "bg-destructive/10 text-destructive",
						toolCall.status === "pending" && "bg-muted text-muted-foreground",
					)}
				>
					{statusDisplay.icon}
					<span>{statusDisplay.label}</span>
				</div>

				{/* Expand toggle */}
				{hasDetails && (
					<button className="p-0.5 hover:bg-muted rounded">
						{isExpanded ? (
							<ChevronUp className="size-3.5 text-muted-foreground" />
						) : (
							<ChevronDown className="size-3.5 text-muted-foreground" />
						)}
					</button>
				)}
			</div>

			{/* Expanded details */}
			{isExpanded && hasDetails && (
				<div className="border-t bg-muted/20 px-3 py-2 text-xs space-y-2">
					{/* Arguments */}
					{toolCall.args && Object.keys(toolCall.args).length > 0 && (
						<div>
							<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
								Arguments
							</div>
							<pre className="bg-muted/50 rounded p-2 text-[11px] overflow-x-auto whitespace-pre-wrap">
								{formatArgs(toolCall.args)}
							</pre>
						</div>
					)}

					{/* Result */}
					{toolCall.result && (
						<div>
							<div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
								Result
							</div>
							<pre className="bg-green-500/5 border border-green-500/20 rounded p-2 text-[11px] overflow-x-auto whitespace-pre-wrap max-h-32">
								{formatResult(toolCall.result)}
							</pre>
						</div>
					)}

					{/* Error */}
					{toolCall.error && (
						<div>
							<div className="text-[10px] font-medium text-destructive uppercase tracking-wider mb-1">
								Error
							</div>
							<pre className="bg-destructive/5 border border-destructive/20 rounded p-2 text-[11px] text-destructive overflow-x-auto whitespace-pre-wrap">
								{toolCall.error}
							</pre>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

interface ChatToolCallListProps {
	toolCalls: ToolCall[];
	className?: string;
}

export function ChatToolCallList({
	toolCalls,
	className,
}: ChatToolCallListProps) {
	if (!toolCalls || toolCalls.length === 0) {
		return null;
	}

	const completedCount = toolCalls.filter(
		(tc) => tc.status === "completed",
	).length;
	const executingCount = toolCalls.filter(
		(tc) => tc.status === "executing",
	).length;
	const errorCount = toolCalls.filter((tc) => tc.status === "error").length;

	return (
		<div className={cn("space-y-2", className)}>
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1.5 text-xs font-medium">
					<Wrench className="size-3.5" />
					<span>Tool Calls</span>
					{executingCount > 0 && (
						<span className="flex items-center gap-1 text-primary ml-1">
							<Loader2 className="size-3 animate-spin" />
							{executingCount} running
						</span>
					)}
				</div>
				<div className="flex items-center gap-2 text-[10px] text-muted-foreground">
					{completedCount > 0 && (
						<span className="flex items-center gap-0.5 text-green-500">
							<CheckCircle2 className="size-3" />
							{completedCount}
						</span>
					)}
					{errorCount > 0 && (
						<span className="flex items-center gap-0.5 text-destructive">
							<XCircle className="size-3" />
							{errorCount}
						</span>
					)}
					<span className="text-muted-foreground">
						{completedCount + errorCount}/{toolCalls.length}
					</span>
				</div>
			</div>

			{/* Tool calls */}
			<div className="space-y-1.5">
				{toolCalls.map((toolCall) => (
					<ChatToolCall key={toolCall.id} toolCall={toolCall} />
				))}
			</div>
		</div>
	);
}

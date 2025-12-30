import type { ToolCall, ToolExecutionResult } from "./editor-tool-executor";

/**
 * Handlers for updating frontmatter fields
 * These are registered by ContentDetailsPage and called when frontmatter tools execute
 */
export interface FrontmatterHandlers {
	updateTitle: (title: string) => void;
	updateDescription: (description: string) => void;
	updateSlug: (slug: string) => void;
	updateKeywords: (keywords: string[]) => void;
}

// Global handlers reference (set by ContentDetailsPage)
let frontmatterHandlers: FrontmatterHandlers | null = null;

/**
 * Register frontmatter handlers from the page component
 */
export function registerFrontmatterHandlers(
	handlers: FrontmatterHandlers,
): void {
	frontmatterHandlers = handlers;
}

/**
 * Unregister frontmatter handlers (called on unmount)
 */
export function unregisterFrontmatterHandlers(): void {
	frontmatterHandlers = null;
}

/**
 * Check if a tool is a frontmatter tool
 */
export function isFrontmatterTool(toolName: string): boolean {
	const frontmatterTools = [
		"editTitle",
		"edit-title",
		"editDescription",
		"edit-description",
		"editSlug",
		"edit-slug",
		"editKeywords",
		"edit-keywords",
	];
	return frontmatterTools.includes(toolName);
}

/**
 * Execute a frontmatter tool call
 */
export async function executeFrontmatterTool(
	toolCall: ToolCall,
): Promise<ToolExecutionResult> {
	const { name, args } = toolCall;

	console.log("[Frontmatter] Executing tool:", name, "with args:", args);
	console.log("[Frontmatter] Handlers registered:", !!frontmatterHandlers);

	if (!frontmatterHandlers) {
		console.error("[Frontmatter] Handlers not registered!");
		return {
			success: false,
			message: "Frontmatter handlers not registered",
		};
	}

	try {
		// Normalize tool name (handle both kebab-case and camelCase)
		const normalizedName = name.replace(/-/g, "").toLowerCase();
		console.log("[Frontmatter] Normalized name:", normalizedName);

		switch (normalizedName) {
			case "edittitle": {
				const title = args.title as string;
				if (!title) {
					return { success: false, message: "Title is required" };
				}
				console.log("[Frontmatter] Calling updateTitle with:", title);
				frontmatterHandlers.updateTitle(title);
				return {
					success: true,
					message: `Updated title to: "${title}"`,
					data: { title },
				};
			}

			case "editdescription": {
				const description = args.description as string;
				console.log("[Frontmatter] Calling updateDescription with:", description);
				frontmatterHandlers.updateDescription(description || "");
				return {
					success: true,
					message: `Updated description`,
					data: { description },
				};
			}

			case "editslug": {
				const slug = args.slug as string;
				if (!slug) {
					return { success: false, message: "Slug is required" };
				}
				console.log("[Frontmatter] Calling updateSlug with:", slug);
				frontmatterHandlers.updateSlug(slug);
				return {
					success: true,
					message: `Updated slug to: "${slug}"`,
					data: { slug },
				};
			}

			case "editkeywords": {
				const keywords = args.keywords as string[];
				if (!Array.isArray(keywords)) {
					return { success: false, message: "Keywords must be an array" };
				}
				console.log("[Frontmatter] Calling updateKeywords with:", keywords);
				frontmatterHandlers.updateKeywords(keywords);
				return {
					success: true,
					message: `Updated keywords: ${keywords.join(", ")}`,
					data: { keywords },
				};
			}

			default:
				console.warn("[Frontmatter] Unknown tool:", name, "normalized:", normalizedName);
				return {
					success: false,
					message: `Unknown frontmatter tool: ${name}`,
				};
		}
	} catch (error) {
		console.error("[Frontmatter] Error executing tool:", error);
		return {
			success: false,
			message:
				error instanceof Error ? error.message : "Frontmatter update failed",
		};
	}
}

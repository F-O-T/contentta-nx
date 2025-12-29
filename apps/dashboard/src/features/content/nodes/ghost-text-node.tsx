import {
	TextNode,
	type EditorConfig,
	type LexicalEditor,
	type LexicalNode,
	type NodeKey,
	type SerializedTextNode,
	type DOMExportOutput,
} from "lexical";

export type SerializedGhostTextNode = SerializedTextNode & {
	uuid: string;
};

/**
 * GhostTextNode - A custom Lexical TextNode for displaying inline ghost text suggestions.
 *
 * This node extends TextNode and is used to show FIM completion suggestions inline
 * with the editor content. Key features:
 * - Renders inline (not absolutely positioned)
 * - Cannot be edited directly (mode: "token")
 * - Excluded from copy operations
 * - Styled with reduced opacity to appear as ghost text
 * - UUID tracking to prevent stale suggestions
 */
export class GhostTextNode extends TextNode {
	__uuid: string;

	static getType(): string {
		return "ghost-text";
	}

	static clone(node: GhostTextNode): GhostTextNode {
		// Don't set mode here - let Lexical handle it via $cloneWithProperties
		const cloned = new GhostTextNode(node.__text, node.__uuid, node.__key);
		return cloned;
	}

	constructor(text: string, uuid: string, key?: NodeKey) {
		super(text, key);
		this.__uuid = uuid;
		// Note: Don't call setMode() here - it causes infinite recursion
		// Mode will be set via $createGhostTextNode after construction
	}

	getUUID(): string {
		return this.__uuid;
	}

	createDOM(config: EditorConfig): HTMLElement {
		const dom = super.createDOM(config);
		dom.classList.add("ghost-text");
		dom.style.opacity = "0.5";
		dom.style.color = "var(--muted-foreground)";
		dom.style.pointerEvents = "none";
		dom.style.userSelect = "none";
		// Prevent editing
		dom.contentEditable = "false";
		return dom;
	}

	updateDOM(
		_prevNode: GhostTextNode,
		_dom: HTMLElement,
		_config: EditorConfig,
	): boolean {
		// Return false to indicate that the DOM doesn't need to be recreated
		// The text content is updated automatically by Lexical
		return false;
	}

	// Prevent copying ghost text
	excludeFromCopy(): boolean {
		return true;
	}

	// Prevent exporting ghost text to HTML (returns empty span)
	exportDOM(_editor: LexicalEditor): DOMExportOutput {
		const element = document.createElement("span");
		return { element };
	}

	static importJSON(serializedNode: SerializedGhostTextNode): GhostTextNode {
		const node = new GhostTextNode(serializedNode.text, serializedNode.uuid);
		node.setMode("token");
		return node;
	}

	exportJSON(): SerializedGhostTextNode {
		return {
			...super.exportJSON(),
			type: "ghost-text",
			uuid: this.__uuid,
		};
	}

	// Prevent splitting this node
	canInsertTextBefore(): boolean {
		return false;
	}

	canInsertTextAfter(): boolean {
		return false;
	}
}

/**
 * Create a new GhostTextNode with the given text and optional UUID.
 * Sets token mode after construction to avoid infinite recursion.
 */
export function $createGhostTextNode(
	text: string,
	uuid?: string,
): GhostTextNode {
	const node = new GhostTextNode(text, uuid ?? crypto.randomUUID());
	// Set mode AFTER construction - this is safe because setMode only recurses
	// when called during clone, which happens when the node is in the editor
	node.setMode("token");
	return node;
}

/**
 * Type guard to check if a node is a GhostTextNode.
 * Uses getType() instead of instanceof to avoid issues with module bundling.
 */
export function $isGhostTextNode(
	node: LexicalNode | null | undefined,
): node is GhostTextNode {
	return node?.getType() === "ghost-text";
}

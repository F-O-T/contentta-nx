"use client";

import { cn } from "@packages/ui/lib/utils";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { TableNode, TableCellNode, TableRowNode } from "@lexical/table";
import {
	$convertFromMarkdownString,
	$convertToMarkdownString,
	CHECK_LIST,
	ELEMENT_TRANSFORMERS,
	MULTILINE_ELEMENT_TRANSFORMERS,
	TEXT_FORMAT_TRANSFORMERS,
	TEXT_MATCH_TRANSFORMERS,
	type ElementTransformer,
} from "@lexical/markdown";
import {
	$createHorizontalRuleNode,
	$isHorizontalRuleNode,
	HorizontalRuleNode,
} from "@lexical/react/LexicalHorizontalRuleNode";
import type { EditorState, LexicalEditor } from "lexical";
import { useCallback, useEffect, useRef } from "react";
import { FIMPlugin } from "../plugins/fim-plugin";
import { EditPlugin } from "../plugins/edit-plugin";
import { ChatPlugin } from "../plugins/chat-plugin";
import { FloatingToolbarPlugin } from "../plugins/floating-toolbar-plugin";
import { MarkdownPastePlugin } from "../plugins/markdown-paste-plugin";
import { GhostTextNode } from "../nodes/ghost-text-node";
import { TooltipProvider } from "@packages/ui/components/tooltip";

type ContentEditorProps = {
	initialContent?: string;
	onChange?: (content: string) => void;
	onBlur?: () => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
};

// Custom transformer for horizontal rule
const HR_TRANSFORMER: ElementTransformer = {
	dependencies: [HorizontalRuleNode],
	export: (node) => {
		return $isHorizontalRuleNode(node) ? "---" : null;
	},
	regExp: /^(---|___|\*\*\*)$/,
	replace: (parentNode) => {
		const node = $createHorizontalRuleNode();
		parentNode.replace(node);
	},
	type: "element",
};

export const EXTENDED_TRANSFORMERS = [
	HR_TRANSFORMER,
	CHECK_LIST,
	...ELEMENT_TRANSFORMERS,
	...MULTILINE_ELEMENT_TRANSFORMERS,
	...TEXT_FORMAT_TRANSFORMERS,
	...TEXT_MATCH_TRANSFORMERS,
];

const theme = {
	paragraph: "mb-2",
	heading: {
		h1: "text-3xl font-bold mb-4",
		h2: "text-2xl font-bold mb-3",
		h3: "text-xl font-bold mb-2",
		h4: "text-lg font-bold mb-2",
		h5: "text-base font-bold mb-1",
	},
	text: {
		bold: "font-bold",
		italic: "italic",
		underline: "underline",
		strikethrough: "line-through",
		code: "bg-muted px-1 py-0.5 rounded font-mono text-sm",
	},
	list: {
		ol: "list-decimal list-inside mb-2",
		ul: "list-disc list-inside mb-2",
		listitem: "ml-4",
		checklist: "list-none pl-0",
		listitemChecked:
			"relative ml-6 line-through text-muted-foreground before:absolute before:-left-6 before:content-['✓'] before:text-green-500",
		listitemUnchecked:
			"relative ml-6 before:absolute before:-left-6 before:content-['☐']",
	},
	quote: "border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground mb-2",
	code: "block bg-muted p-4 rounded-md font-mono text-sm mb-2 overflow-x-auto",
	codeHighlight: {
		atrule: "text-purple-500",
		attr: "text-yellow-500",
		boolean: "text-blue-500",
		builtin: "text-cyan-500",
		cdata: "text-gray-500",
		char: "text-green-500",
		class: "text-yellow-500",
		"class-name": "text-yellow-500",
		comment: "text-gray-500 italic",
		constant: "text-purple-500",
		deleted: "text-red-500",
		doctype: "text-gray-500",
		entity: "text-red-500",
		function: "text-blue-500",
		important: "text-red-500 font-bold",
		inserted: "text-green-500",
		keyword: "text-purple-500",
		namespace: "text-purple-500",
		number: "text-orange-500",
		operator: "text-gray-700",
		prolog: "text-gray-500",
		property: "text-cyan-500",
		punctuation: "text-gray-600",
		regex: "text-red-500",
		selector: "text-green-500",
		string: "text-green-500",
		symbol: "text-purple-500",
		tag: "text-red-500",
		url: "text-blue-500 underline",
		variable: "text-orange-500",
	},
	link: "text-primary underline cursor-pointer",
	horizontalRule: "border-t border-border my-4",
	table: "border-collapse border border-border w-full my-2",
	tableCell: "border border-border p-2",
	tableCellHeader: "bg-muted font-bold border border-border p-2",
	tableRow: "",
};

function onError(error: Error) {
	console.error("Lexical error:", error);
}

export function ContentEditor({
	initialContent,
	onChange,
	onBlur,
	placeholder = "Start writing...",
	disabled = false,
	className,
}: ContentEditorProps) {
	const editorRef = useRef<LexicalEditor | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const initialConfig = {
		namespace: "ContentEditor",
		theme,
		onError,
		nodes: [
			HeadingNode,
			QuoteNode,
			ListNode,
			ListItemNode,
			LinkNode,
			AutoLinkNode,
			CodeNode,
			CodeHighlightNode,
			HorizontalRuleNode,
			TableNode,
			TableCellNode,
			TableRowNode,
			GhostTextNode,
		],
		editable: !disabled,
		editorState: initialContent
			? () => {
					console.log("[DEBUG] Initial markdown content:", initialContent.slice(0, 500));
					$convertFromMarkdownString(initialContent, EXTENDED_TRANSFORMERS);
			  }
			: undefined,
	};

	const handleChange = useCallback(
		(editorState: EditorState) => {
			if (!onChange) return;

			editorState.read(() => {
				const markdown = $convertToMarkdownString(EXTENDED_TRANSFORMERS);
				console.log("[DEBUG] Exported markdown:", markdown.slice(0, 500));
				onChange(markdown);
			});
		},
		[onChange],
	);

	return (
		<LexicalComposer initialConfig={initialConfig}>
			<TooltipProvider>
				<div
					ref={containerRef}
					className={cn(
						"relative flex flex-col border rounded-md bg-background",
						disabled && "opacity-50 pointer-events-none",
						className,
					)}
				>
					<RichTextPlugin
						contentEditable={
							<ContentEditable
								className="flex-1 p-4 outline-none prose prose-sm dark:prose-invert max-w-none overflow-y-auto"
								onBlur={onBlur}
							/>
						}
						placeholder={
							<div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
								{placeholder}
							</div>
						}
						ErrorBoundary={LexicalErrorBoundary}
					/>
					<HistoryPlugin />
					<AutoFocusPlugin />
					<ListPlugin />
					<CheckListPlugin />
					<LinkPlugin />
					<HorizontalRulePlugin />
					<TablePlugin />
					<MarkdownShortcutPlugin transformers={EXTENDED_TRANSFORMERS} />
					<MarkdownPastePlugin />
					<OnChangePlugin onChange={handleChange} />
					<EditorRefPlugin editorRef={editorRef} />
					<FloatingToolbarPlugin containerRef={containerRef} />
					<FIMPlugin containerRef={containerRef} />
					<EditPlugin containerRef={containerRef} />
					<ChatPlugin />
				</div>
			</TooltipProvider>
		</LexicalComposer>
	);
}

// Plugin to capture editor ref
function EditorRefPlugin({
	editorRef,
}: {
	editorRef: React.MutableRefObject<LexicalEditor | null>;
}) {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		editorRef.current = editor;
	}, [editor, editorRef]);

	return null;
}

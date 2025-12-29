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
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import { TRANSFORMERS } from "@lexical/markdown";
import type { EditorState, LexicalEditor } from "lexical";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import { useCallback, useEffect, useRef } from "react";
import { FIMPlugin } from "../plugins/fim-plugin";
import { EditPlugin } from "../plugins/edit-plugin";
import { ChatPlugin } from "../plugins/chat-plugin";
import { GhostTextNode } from "../nodes/ghost-text-node";

type ContentEditorProps = {
	initialContent?: string;
	onChange?: (content: string) => void;
	onBlur?: () => void;
	placeholder?: string;
	disabled?: boolean;
};

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
}: ContentEditorProps) {
	const editorRef = useRef<LexicalEditor | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const isInitializedRef = useRef(false);

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
			GhostTextNode,
		],
		editable: !disabled,
	};

	const handleChange = useCallback(
		(editorState: EditorState) => {
			if (!onChange) return;

			editorState.read(() => {
				const root = $getRoot();
				const textContent = root.getTextContent();
				onChange(textContent);
			});
		},
		[onChange],
	);

	// Initialize content
	useEffect(() => {
		if (editorRef.current && initialContent && !isInitializedRef.current) {
			isInitializedRef.current = true;
			editorRef.current.update(() => {
				const root = $getRoot();
				root.clear();
				const paragraph = $createParagraphNode();
				paragraph.append($createTextNode(initialContent));
				root.append(paragraph);
			});
		}
	}, [initialContent]);

	return (
		<LexicalComposer initialConfig={initialConfig}>
			<div
				ref={containerRef}
				className={cn(
					"relative min-h-[400px] border rounded-md bg-background",
					disabled && "opacity-50 pointer-events-none",
				)}
			>
				<RichTextPlugin
					contentEditable={
						<ContentEditable
							className="min-h-[400px] p-4 outline-none prose prose-sm dark:prose-invert max-w-none"
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
				<LinkPlugin />
				<MarkdownShortcutPlugin transformers={TRANSFORMERS} />
				<OnChangePlugin onChange={handleChange} />
				<EditorRefPlugin editorRef={editorRef} />
				<FIMPlugin containerRef={containerRef} />
				<EditPlugin containerRef={containerRef} />
				<ChatPlugin />
			</div>
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

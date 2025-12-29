"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $generateNodesFromDOM } from "@lexical/html";
import {
	PASTE_COMMAND,
	COMMAND_PRIORITY_HIGH,
	$getSelection,
	$isRangeSelection,
} from "lexical";
import { useEffect } from "react";

/**
 * Simple markdown pattern detection - checks if text likely contains markdown
 */
const MARKDOWN_PATTERNS = [
	/\*\*.+?\*\*/, // **bold**
	/__[^_]+__/, // __bold__
	/(?<!\*)\*[^*\n]+\*(?!\*)/, // *italic* (not **)
	/~~.+?~~/, // ~~strikethrough~~
	/`.+?`/, // `code`
	/^#{1,6}\s/m, // # headings
	/^[-*+]\s/m, // - unordered list
	/^\d+\.\s/m, // 1. ordered list
	/^>\s/m, // > blockquote
	/\[.+?\]\(.+?\)/, // [links](url)
];

function containsMarkdown(text: string): boolean {
	return MARKDOWN_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Convert markdown to HTML for Lexical consumption.
 * Handles common markdown syntax patterns.
 */
function markdownToHtml(markdown: string): string {
	let html = markdown;

	// Process code blocks first (to avoid processing markdown inside them)
	html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
		const escapedCode = code
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
		return `<pre><code class="language-${lang || "plaintext"}">${escapedCode}</code></pre>`;
	});

	// Process inline code (before other inline formatting)
	html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

	// Process headers (must be at line start)
	html = html.replace(/^###### (.+)$/gm, "<h6>$1</h6>");
	html = html.replace(/^##### (.+)$/gm, "<h5>$1</h5>");
	html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
	html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
	html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
	html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

	// Process blockquotes
	html = html.replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>");

	// Process horizontal rules
	html = html.replace(/^(---|\*\*\*|___)$/gm, "<hr>");

	// Process bold (before italic to handle **text** vs *text*)
	html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
	html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");

	// Process italic
	html = html.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");
	html = html.replace(/(?<!_)_([^_\n]+)_(?!_)/g, "<em>$1</em>");

	// Process strikethrough
	html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

	// Process links
	html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

	// Process unordered lists (group consecutive items)
	html = html.replace(
		/((?:^[-*+] .+$\n?)+)/gm,
		(match) => {
			const items = match
				.split("\n")
				.filter((line) => line.trim())
				.map((line) => `<li>${line.replace(/^[-*+] /, "")}</li>`)
				.join("");
			return `<ul>${items}</ul>`;
		},
	);

	// Process ordered lists (group consecutive items)
	html = html.replace(
		/((?:^\d+\. .+$\n?)+)/gm,
		(match) => {
			const items = match
				.split("\n")
				.filter((line) => line.trim())
				.map((line) => `<li>${line.replace(/^\d+\. /, "")}</li>`)
				.join("");
			return `<ol>${items}</ol>`;
		},
	);

	// Wrap remaining plain text lines in paragraphs
	const lines = html.split("\n");
	html = lines
		.map((line) => {
			const trimmed = line.trim();
			if (!trimmed) return "";
			// Don't wrap if already an HTML element
			if (
				trimmed.startsWith("<h") ||
				trimmed.startsWith("<p") ||
				trimmed.startsWith("<ul") ||
				trimmed.startsWith("<ol") ||
				trimmed.startsWith("<li") ||
				trimmed.startsWith("<blockquote") ||
				trimmed.startsWith("<pre") ||
				trimmed.startsWith("<hr")
			) {
				return line;
			}
			return `<p>${line}</p>`;
		})
		.join("\n");

	return html;
}

/**
 * Plugin that converts pasted markdown text into formatted Lexical nodes.
 * Uses HTML intermediate format for reliable conversion.
 */
export function MarkdownPastePlugin() {
	const [editor] = useLexicalComposerContext();

	useEffect(() => {
		return editor.registerCommand(
			PASTE_COMMAND,
			(event) => {
				// Only handle ClipboardEvent
				if (!(event instanceof ClipboardEvent)) {
					return false;
				}

				const clipboardData = event.clipboardData;
				if (!clipboardData) {
					return false;
				}

				// Check if there's HTML content - let Lexical handle rich paste
				const htmlContent = clipboardData.getData("text/html");
				if (htmlContent && htmlContent.trim().length > 0) {
					return false;
				}

				// Get plain text content
				const textContent = clipboardData.getData("text/plain");
				if (!textContent || textContent.trim().length === 0) {
					return false;
				}

				// Check if text contains markdown patterns
				if (!containsMarkdown(textContent)) {
					return false;
				}

				// Prevent default paste
				event.preventDefault();

				// Convert markdown to HTML, then to Lexical nodes
				editor.update(() => {
					const selection = $getSelection();
					if (!$isRangeSelection(selection)) {
						return;
					}

					// Convert markdown to HTML
					const html = markdownToHtml(textContent);

					// Parse HTML to DOM
					const parser = new DOMParser();
					const dom = parser.parseFromString(
						`<body>${html}</body>`,
						"text/html",
					);

					// Generate Lexical nodes from DOM
					const nodes = $generateNodesFromDOM(editor, dom);

					// Insert nodes at current selection
					selection.insertNodes(nodes);
				});

				return true;
			},
			COMMAND_PRIORITY_HIGH,
		);
	}, [editor]);

	return null;
}

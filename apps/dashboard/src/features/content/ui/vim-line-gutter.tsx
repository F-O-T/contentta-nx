"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
	$getRoot,
	$getSelection,
	$isRangeSelection,
	SELECTION_CHANGE_COMMAND,
	COMMAND_PRIORITY_LOW,
} from "lexical";
import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@packages/ui/lib/utils";

interface LineInfo {
	lineNumber: number; // Absolute line number (1-based)
	relativeNumber: number; // Relative to cursor (0 = current line)
	top: number; // Pixel offset from top
	height: number; // Line height in pixels
}

interface VimLineGutterProps {
	enabled: boolean;
	containerRef: React.RefObject<HTMLDivElement | null>;
}

export function VimLineGutter({ enabled, containerRef }: VimLineGutterProps) {
	const [editor] = useLexicalComposerContext();
	const [lines, setLines] = useState<LineInfo[]>([]);
	const [scrollTop, setScrollTop] = useState(0);
	const editableRef = useRef<HTMLElement | null>(null);

	const updateLineInfo = useCallback(() => {
		if (!containerRef.current) return;

		const editable = containerRef.current.querySelector(
			'[contenteditable="true"]',
		);
		if (!editable) return;
		
		editableRef.current = editable as HTMLElement;

		editor.getEditorState().read(() => {
			const root = $getRoot();
			const children = root.getChildren();
			const selection = $getSelection();

			// Find current cursor line
			let currentLineNum = 1;
			if ($isRangeSelection(selection)) {
				const anchorNode = selection.anchor.getNode();
				const topElement = anchorNode.getTopLevelElement();
				if (topElement) {
					const idx = children.indexOf(topElement);
					currentLineNum = idx >= 0 ? idx + 1 : 1;
				}
			}

			// Get DOM positions for each line using offsetTop for scroll-independent positioning
			const lineInfos: LineInfo[] = [];

			for (let index = 0; index < children.length; index++) {
				const child = children[index];
				if (!child) continue;

				const lineNum = index + 1;
				const key = child.getKey();
				const domElement = editor.getElementByKey(key);

				if (domElement) {
					lineInfos.push({
						lineNumber: lineNum,
						relativeNumber: Math.abs(lineNum - currentLineNum),
						top: domElement.offsetTop,
						height: domElement.offsetHeight,
					});
				}
			}

			setLines(lineInfos);
		});
	}, [editor, containerRef]);

	// Handle scroll synchronization
	useEffect(() => {
		if (!enabled) return;
		
		const editable = editableRef.current;
		if (!editable) return;

		const handleScroll = () => {
			setScrollTop(editable.scrollTop);
		};

		editable.addEventListener("scroll", handleScroll);
		return () => editable.removeEventListener("scroll", handleScroll);
	}, [enabled, lines]); // Re-attach when lines change (ensures editableRef is set)

	// Update on selection change
	useEffect(() => {
		if (!enabled) return;

		return editor.registerCommand(
			SELECTION_CHANGE_COMMAND,
			() => {
				updateLineInfo();
				return false;
			},
			COMMAND_PRIORITY_LOW,
		);
	}, [editor, enabled, updateLineInfo]);

	// Update on content change
	useEffect(() => {
		if (!enabled) return;

		return editor.registerUpdateListener(() => {
			updateLineInfo();
		});
	}, [editor, enabled, updateLineInfo]);

	// Initial update
	useEffect(() => {
		if (enabled) {
			// Delay to ensure DOM is ready
			const timeoutId = setTimeout(updateLineInfo, 50);
			return () => clearTimeout(timeoutId);
		}
	}, [enabled, updateLineInfo]);

	if (!enabled) return null;

	return (
		<div className="absolute left-0 top-0 bottom-8 w-12 border-r border-border bg-muted/30 font-mono text-xs select-none pointer-events-none z-10 overflow-hidden">
			{lines.map((line) => (
				<div
					key={`line-${line.lineNumber}`}
					className={cn(
						"absolute right-2 text-right leading-normal",
						line.relativeNumber === 0
							? "text-primary font-bold"
							: "text-muted-foreground",
					)}
					style={{
						top: line.top - scrollTop,
						height: line.height,
						lineHeight: `${line.height}px`,
					}}
				>
					{line.relativeNumber === 0 ? line.lineNumber : line.relativeNumber}
				</div>
			))}
		</div>
	);
}

import { useEffect, useRef } from "react";

interface VimCommandLineProps {
	text: string;
	isVisible: boolean;
}

/**
 * Vim command line component for ex commands
 * Displays at the bottom of the editor when : is pressed
 */
export function VimCommandLine({ text, isVisible }: VimCommandLineProps) {
	const inputRef = useRef<HTMLSpanElement>(null);

	// Auto-focus when visible
	useEffect(() => {
		if (isVisible && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isVisible]);

	if (!isVisible) return null;

	return (
		<div className="absolute bottom-8 left-0 right-0 z-50 border-t bg-background px-3 py-1.5 font-mono text-sm">
			<span className="text-primary">:</span>
			<span ref={inputRef} className="outline-none">
				{text}
			</span>
			<span className="animate-pulse">_</span>
		</div>
	);
}

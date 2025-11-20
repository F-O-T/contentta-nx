import { useEffect, useRef, useState } from "react";

export interface UseTypewriterOptions {
	speed?: number;
	enabled?: boolean;
}

export interface UseTypewriterReturn {
	displayed: string;
	typing: boolean;
}

export function useTypewriter(
	text: string,
	options: UseTypewriterOptions = {},
): UseTypewriterReturn {
	const { speed = 30, enabled = true } = options;
	const [displayed, setDisplayed] = useState("");
	const [typing, setTyping] = useState(false);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (!enabled) {
			setDisplayed(text);
			setTyping(false);
			return;
		}

		setDisplayed("");
		setTyping(true);

		let currentIndex = 0;
		let isCancelled = false;

		function type() {
			if (isCancelled) return;

			if (currentIndex <= text.length) {
				setDisplayed(text.slice(0, currentIndex));
				currentIndex++;
				timeoutRef.current = setTimeout(type, speed);
			} else {
				setTyping(false);
			}
		}

		type();

		return () => {
			isCancelled = true;
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
		};
	}, [text, speed, enabled]);

	return { displayed, typing };
}

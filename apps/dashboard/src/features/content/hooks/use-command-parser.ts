import { useMemo } from "react";

export interface CommandMatch {
	type: "slash" | "mention" | null;
	trigger: string;
	query: string;
	startIndex: number;
	endIndex: number;
}

/**
 * Parse input text for / commands and @ mentions
 * Returns the active command being typed at the cursor position
 */
export function parseCommand(
	inputValue: string,
	cursorPosition: number,
): CommandMatch | null {
	if (!inputValue || cursorPosition < 0) {
		return null;
	}

	// Get text before cursor
	const textBeforeCursor = inputValue.slice(0, cursorPosition);

	// Find the last trigger character before cursor
	const slashIndex = textBeforeCursor.lastIndexOf("/");
	const atIndex = textBeforeCursor.lastIndexOf("@");

	// Determine which trigger is closer to cursor and valid
	let triggerIndex = -1;
	let triggerChar = "";
	let type: "slash" | "mention" | null = null;

	if (slashIndex > atIndex) {
		triggerIndex = slashIndex;
		triggerChar = "/";
		type = "slash";
	} else if (atIndex > slashIndex) {
		triggerIndex = atIndex;
		triggerChar = "@";
		type = "mention";
	}

	// No trigger found
	if (triggerIndex === -1 || type === null) {
		return null;
	}

	// Check if trigger is at start of input or after a space/newline
	const charBeforeTrigger = textBeforeCursor[triggerIndex - 1];
	const isValidStart =
		triggerIndex === 0 ||
		charBeforeTrigger === " " ||
		charBeforeTrigger === "\n";

	if (!isValidStart) {
		return null;
	}

	// Get the query (text after trigger up to cursor)
	const query = textBeforeCursor.slice(triggerIndex + 1);

	// Query should not contain spaces (single command word)
	if (query.includes(" ")) {
		return null;
	}

	return {
		type,
		trigger: triggerChar,
		query,
		startIndex: triggerIndex,
		endIndex: cursorPosition,
	};
}

/**
 * Hook to parse commands from input
 */
export function useCommandParser(
	inputValue: string,
	cursorPosition: number,
): CommandMatch | null {
	return useMemo(() => {
		return parseCommand(inputValue, cursorPosition);
	}, [inputValue, cursorPosition]);
}

/**
 * Replace command in input with the selected command/mention text
 */
export function replaceCommand(
	inputValue: string,
	match: CommandMatch,
	replacement: string,
): string {
	const before = inputValue.slice(0, match.startIndex);
	const after = inputValue.slice(match.endIndex);

	// For slash commands, just replace with empty (command is executed)
	// For mentions, replace with the mention text
	if (match.type === "slash") {
		return before + after;
	}

	return before + replacement + " " + after.trimStart();
}

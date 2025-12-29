/**
 * Vim Key Parser
 *
 * Parses incoming keystrokes into vim commands, handling:
 * - Count prefixes (1-9, then 0)
 * - Register selection ("a, "b, etc.)
 * - Operators (d, c, y, >, <, etc.)
 * - Motions (hjkl, w, b, e, 0, $, etc.)
 * - Text object prefixes (i, a)
 * - Multi-character sequences (f{char}, t{char}, etc.)
 */

// ============================================================================
// Types
// ============================================================================

export type OperatorType =
	| "d" // Delete
	| "c" // Change
	| "y" // Yank
	| ">" // Indent right
	| "<" // Indent left
	| "g~" // Toggle case
	| "gu" // Lowercase
	| "gU" // Uppercase
	| "=" // Format/indent
	| "gq"; // Format text

export type MotionType =
	// Character motions
	| "h"
	| "l"
	| "j"
	| "k"
	// Word motions
	| "w"
	| "W"
	| "b"
	| "B"
	| "e"
	| "E"
	| "ge"
	| "gE"
	// Line motions
	| "0"
	| "^"
	| "$"
	| "g_"
	| "|"
	// Find character
	| "f"
	| "F"
	| "t"
	| "T"
	| ";"
	| ","
	// Search
	| "/"
	| "?"
	| "n"
	| "N"
	| "*"
	| "#"
	// Paragraph/sentence
	| "{"
	| "}"
	| "("
	| ")"
	// File position
	| "gg"
	| "G"
	| "H"
	| "M"
	| "L"
	// Matching
	| "%";

export type TextObjectType =
	| "w" // Word
	| "W" // WORD
	| "s" // Sentence
	| "p" // Paragraph
	| '"' // Double quotes
	| "'" // Single quotes
	| "`" // Backticks
	| "(" // Parentheses
	| ")" // Parentheses (alias)
	| "b" // Parentheses (alias)
	| "[" // Brackets
	| "]" // Brackets (alias)
	| "{" // Braces
	| "}" // Braces (alias)
	| "B" // Braces (alias)
	| "<" // Angle brackets
	| ">" // Angle brackets (alias)
	| "t"; // Tag

export interface ParsedCommand {
	// Complete command info
	type: "motion" | "operator" | "action" | "insert" | "text-object" | "incomplete";

	// Count prefix (e.g., 3 in 3dw)
	count: number;

	// Register (e.g., "a in "adw)
	register: string | null;

	// Operator (d, c, y, etc.)
	operator: OperatorType | null;

	// Motion (hjkl, w, b, etc.)
	motion: MotionType | string | null;

	// Text object modifier (i = inner, a = around)
	textObjectModifier: "i" | "a" | null;

	// Text object (w, ", (, etc.)
	textObject: TextObjectType | null;

	// Character for f/F/t/T/r motions
	char: string | null;

	// What we're waiting for next
	waitingFor: "char" | "motion" | "text-object" | "register-name" | "g-command" | null;

	// Raw key sequence
	sequence: string;
}

// ============================================================================
// Constants
// ============================================================================

const OPERATORS = new Set(["d", "c", "y", ">", "<", "=", "!"]);
const CHAR_MOTIONS = new Set(["f", "F", "t", "T", "r"]);
const TEXT_OBJECT_MODIFIERS = new Set(["i", "a"]);
const TEXT_OBJECTS = new Set([
	"w",
	"W",
	"s",
	"p",
	'"',
	"'",
	"`",
	"(",
	")",
	"b",
	"[",
	"]",
	"{",
	"}",
	"B",
	"<",
	">",
	"t",
]);

const SIMPLE_MOTIONS = new Set([
	"h",
	"j",
	"k",
	"l",
	"w",
	"W",
	"b",
	"B",
	"e",
	"E",
	"0",
	"^",
	"$",
	"{",
	"}",
	"(",
	")",
	"%",
	"G",
	";",
	",",
	"n",
	"N",
	"*",
	"#",
]);

// Insert mode entry commands
const INSERT_COMMANDS = new Set(["i", "I", "a", "A", "o", "O", "s", "S", "C"]);

// Single-char actions (not operators)
const ACTIONS = new Set(["x", "X", "p", "P", "u", ".", "~", "J", "K", "D", "Y"]);

// ============================================================================
// Parser State
// ============================================================================

const initialCommand: ParsedCommand = {
	type: "incomplete",
	count: 1,
	register: null,
	operator: null,
	motion: null,
	textObjectModifier: null,
	textObject: null,
	char: null,
	waitingFor: null,
	sequence: "",
};

// ============================================================================
// Parser Functions
// ============================================================================

/**
 * Create initial parser state
 */
export function createInitialCommand(): ParsedCommand {
	return { ...initialCommand };
}

/**
 * Parse a single key into the command state
 * Returns updated command state
 */
export function parseKey(
	key: string,
	currentState: ParsedCommand,
): ParsedCommand {
	const state = { ...currentState, sequence: currentState.sequence + key };

	// Handle waiting states first
	if (state.waitingFor === "char") {
		// f/F/t/T/r waiting for character
		state.char = key;
		state.waitingFor = null;

		if (state.operator) {
			state.type = "operator";
		} else {
			state.type = "motion";
		}
		return state;
	}

	if (state.waitingFor === "register-name") {
		// " waiting for register name
		if (/^[a-zA-Z0-9"+*]$/.test(key)) {
			state.register = key;
			state.waitingFor = null;
			return state;
		}
		// Invalid register, reset
		return createInitialCommand();
	}

	if (state.waitingFor === "g-command") {
		// g waiting for second character
		if (key === "g") {
			state.motion = "gg";
			state.waitingFor = null;
			state.type = state.operator ? "operator" : "motion";
			return state;
		}
		if (key === "e") {
			state.motion = "ge";
			state.waitingFor = null;
			state.type = state.operator ? "operator" : "motion";
			return state;
		}
		if (key === "E") {
			state.motion = "gE";
			state.waitingFor = null;
			state.type = state.operator ? "operator" : "motion";
			return state;
		}
		if (key === "_") {
			state.motion = "g_";
			state.waitingFor = null;
			state.type = state.operator ? "operator" : "motion";
			return state;
		}
		if (key === "~") {
			state.operator = "g~" as OperatorType;
			state.waitingFor = "motion";
			return state;
		}
		if (key === "u") {
			state.operator = "gu" as OperatorType;
			state.waitingFor = "motion";
			return state;
		}
		if (key === "U") {
			state.operator = "gU" as OperatorType;
			state.waitingFor = "motion";
			return state;
		}
		if (key === "q") {
			state.operator = "gq" as OperatorType;
			state.waitingFor = "motion";
			return state;
		}
		// Unknown g-command, reset
		return createInitialCommand();
	}

	if (state.waitingFor === "text-object") {
		// i/a waiting for text object
		if (TEXT_OBJECTS.has(key)) {
			state.textObject = key as TextObjectType;
			state.waitingFor = null;
			state.type = state.operator ? "operator" : "text-object";
			return state;
		}
		// Invalid text object, reset
		return createInitialCommand();
	}

	// Parse count prefix (1-9 first, then 0)
	if (
		/^[1-9]$/.test(key) ||
		(key === "0" && state.count > 1)
	) {
		if (state.count === 1 && state.sequence.length === 1) {
			state.count = Number.parseInt(key, 10);
		} else {
			state.count = state.count * 10 + Number.parseInt(key, 10);
		}
		return state;
	}

	// Register selection
	if (key === '"' && !state.register && !state.operator) {
		state.waitingFor = "register-name";
		return state;
	}

	// Operators
	if (OPERATORS.has(key)) {
		if (state.operator === key) {
			// Double operator (dd, cc, yy) = line operation
			state.motion = key;
			state.type = "operator";
			return state;
		}
		if (state.operator) {
			// Different operator while one is pending - reset
			return createInitialCommand();
		}
		state.operator = key as OperatorType;
		state.waitingFor = "motion";
		return state;
	}

	// g-prefix commands
	if (key === "g" && !state.waitingFor) {
		state.waitingFor = "g-command";
		return state;
	}

	// Character motions (f, F, t, T, r)
	if (CHAR_MOTIONS.has(key)) {
		state.motion = key;
		state.waitingFor = "char";
		return state;
	}

	// Text object modifiers (i, a) - only after operator
	if (TEXT_OBJECT_MODIFIERS.has(key) && state.operator) {
		state.textObjectModifier = key as "i" | "a";
		state.waitingFor = "text-object";
		return state;
	}

	// Simple motions
	if (SIMPLE_MOTIONS.has(key)) {
		state.motion = key as MotionType;
		state.waitingFor = null;
		state.type = state.operator ? "operator" : "motion";
		return state;
	}

	// Insert commands (not in operator-pending mode)
	if (INSERT_COMMANDS.has(key) && !state.operator) {
		state.type = "insert";
		state.motion = key;
		return state;
	}

	// Single-char actions
	if (ACTIONS.has(key) && !state.operator) {
		state.type = "action";
		state.motion = key;
		return state;
	}

	// Visual mode commands
	if ((key === "v" || key === "V") && !state.operator) {
		state.type = "action";
		state.motion = key;
		return state;
	}

	// Command mode
	if (key === ":" && !state.operator) {
		state.type = "action";
		state.motion = key;
		return state;
	}

	// Unknown key - reset
	return createInitialCommand();
}

/**
 * Check if a command is complete and can be executed
 */
export function isCommandComplete(command: ParsedCommand): boolean {
	return command.type !== "incomplete" && command.waitingFor === null;
}

/**
 * Get a human-readable description of what the parser is waiting for
 */
export function getWaitingDescription(command: ParsedCommand): string | null {
	switch (command.waitingFor) {
		case "char":
			return "character";
		case "motion":
			return "motion";
		case "text-object":
			return "text object";
		case "register-name":
			return "register";
		case "g-command":
			return "g-command";
		default:
			return null;
	}
}

/**
 * Format command for display (e.g., in status line)
 */
export function formatCommand(command: ParsedCommand): string {
	const parts: string[] = [];

	if (command.register) {
		parts.push(`"${command.register}`);
	}

	if (command.count > 1) {
		parts.push(String(command.count));
	}

	if (command.operator) {
		parts.push(command.operator);
	}

	if (command.textObjectModifier) {
		parts.push(command.textObjectModifier);
	}

	if (command.motion && command.motion !== command.operator) {
		parts.push(command.motion);
	}

	if (command.char) {
		parts.push(command.char);
	}

	return parts.join("");
}

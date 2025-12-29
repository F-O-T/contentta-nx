import { AppError } from "@packages/utils/errors";

/**
 * Chat-specific error class extending AppError
 */
export class ChatError extends AppError {
	constructor(
		message: string,
		status: number = 500,
		options?: { cause?: unknown; data?: unknown },
	) {
		super(message, status, options);
		this.name = "ChatError";
	}

	static modelUnavailable(
		message: string = "Chat model is unavailable",
	): ChatError {
		return new ChatError(message, 503);
	}

	static messageTooLong(
		message: string = "Message exceeds maximum length",
	): ChatError {
		return new ChatError(message, 400);
	}

	static contextTooLong(
		message: string = "Context exceeds maximum length",
	): ChatError {
		return new ChatError(message, 400);
	}

	static streamAborted(message: string = "Stream was aborted"): ChatError {
		return new ChatError(message, 499);
	}

	static rateLimited(message: string = "Rate limit exceeded"): ChatError {
		return new ChatError(message, 429);
	}

	static invalidRequest(message: string = "Invalid chat request"): ChatError {
		return new ChatError(message, 400);
	}

	static sessionNotFound(
		message: string = "Chat session not found",
	): ChatError {
		return new ChatError(message, 404);
	}

	static unauthorized(message: string = "Unauthorized"): ChatError {
		return new ChatError(message, 401);
	}
}

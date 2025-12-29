import { AppError } from "@packages/utils/errors";

/**
 * Edit-specific error class extending AppError
 */
export class EditError extends AppError {
	constructor(
		message: string,
		status: number = 500,
		options?: { cause?: unknown; data?: unknown },
	) {
		super(message, status, options);
		this.name = "EditError";
	}

	static modelUnavailable(
		message: string = "Edit model is unavailable",
	): EditError {
		return new EditError(message, 503);
	}

	static selectionTooLong(
		message: string = "Selection exceeds maximum length",
	): EditError {
		return new EditError(message, 400);
	}

	static instructionTooLong(
		message: string = "Instruction exceeds maximum length",
	): EditError {
		return new EditError(message, 400);
	}

	static streamAborted(message: string = "Stream was aborted"): EditError {
		return new EditError(message, 499);
	}

	static rateLimited(message: string = "Rate limit exceeded"): EditError {
		return new EditError(message, 429);
	}

	static invalidRequest(message: string = "Invalid edit request"): EditError {
		return new EditError(message, 400);
	}
}

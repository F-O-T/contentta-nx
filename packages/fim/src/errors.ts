import { AppError } from "@packages/utils/errors";

/**
 * FIM-specific error class extending AppError
 */
export class FIMError extends AppError {
	constructor(
		message: string,
		status: number = 500,
		options?: { cause?: unknown; data?: unknown },
	) {
		super(message, status, options);
		this.name = "FIMError";
	}

	static modelUnavailable(
		message: string = "FIM model is unavailable",
	): FIMError {
		return new FIMError(message, 503);
	}

	static contextTooLong(
		message: string = "Context exceeds maximum length",
	): FIMError {
		return new FIMError(message, 400);
	}

	static streamAborted(message: string = "Stream was aborted"): FIMError {
		return new FIMError(message, 499);
	}

	static rateLimited(message: string = "Rate limit exceeded"): FIMError {
		return new FIMError(message, 429);
	}

	static invalidRequest(message: string = "Invalid FIM request"): FIMError {
		return new FIMError(message, 400);
	}
}

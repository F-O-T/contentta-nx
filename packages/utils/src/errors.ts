import { TRPCError } from "@trpc/server";
import type { ZodObject } from "zod";
import { ZodError, type z } from "zod";

export const ErrorCodes = {
   BAD_REQUEST: "BAD_REQUEST",
   CONFLICT: "CONFLICT",
   FORBIDDEN: "FORBIDDEN",
   INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
   METHOD_NOT_SUPPORTED: "METHOD_NOT_SUPPORTED",
   NOT_FOUND: "NOT_FOUND",
   PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
   PRECONDITION_FAILED: "PRECONDITION_FAILED",
   TIMEOUT: "TIMEOUT",
   TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",
   UNAUTHORIZED: "UNAUTHORIZED",
   UNPROCESSABLE_CONTENT: "UNPROCESSABLE_CONTENT",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class AppError extends Error {
   public status: number;
   public data?: unknown;

   constructor(
      message: string,
      status: number = 500,
      options?: {
         cause?: unknown;
         data?: unknown;
      },
   ) {
      super(message);
      this.name = "AppError";
      this.status = status;
      this.cause = options?.cause;
      this.data = options?.data;

      Error.captureStackTrace?.(this, AppError);
   }

   static database(
      message: string,
      options?: { cause?: unknown; data?: unknown },
   ): AppError {
      return new AppError(message, 500, options);
   }

   static validation(
      message: string,
      options?: { cause?: unknown; data?: unknown },
   ): AppError {
      return new AppError(message, 400, options);
   }

   static notFound(
      message: string,
      options?: { cause?: unknown; data?: unknown },
   ): AppError {
      return new AppError(message, 404, options);
   }

   static unauthorized(
      message: string,
      options?: { cause?: unknown; data?: unknown },
   ): AppError {
      return new AppError(message, 401, options);
   }

   static forbidden(
      message: string,
      options?: { cause?: unknown; data?: unknown },
   ): AppError {
      return new AppError(message, 403, options);
   }

   static conflict(
      message: string,
      options?: { cause?: unknown; data?: unknown },
   ): AppError {
      return new AppError(message, 409, options);
   }

   static tooManyRequests(
      message: string,
      options?: { cause?: unknown; data?: unknown },
   ): AppError {
      return new AppError(message, 429, options);
   }

   static internal(
      message: string,
      options?: { cause?: unknown; data?: unknown },
   ): AppError {
      return new AppError(message, 500, options);
   }
}

export class APIError extends TRPCError {
   constructor(
      code: ErrorCode,
      message: string,
      options?: {
         cause?: unknown;
         data?: unknown;
      },
   ) {
      super({
         code,
         message,
         ...options,
      });
      this.name = "APIError";
   }

   static fromAppError(error: AppError): APIError {
      let code: ErrorCode = ErrorCodes.INTERNAL_SERVER_ERROR;

      switch (error.status) {
         case 400:
            code = ErrorCodes.BAD_REQUEST;
            break;
         case 401:
            code = ErrorCodes.UNAUTHORIZED;
            break;
         case 403:
            code = ErrorCodes.FORBIDDEN;
            break;
         case 404:
            code = ErrorCodes.NOT_FOUND;
            break;
         case 409:
            code = ErrorCodes.CONFLICT;
            break;
         case 422:
            code = ErrorCodes.UNPROCESSABLE_CONTENT;
            break;
         case 429:
            code = ErrorCodes.TOO_MANY_REQUESTS;
            break;
         default:
            code = ErrorCodes.INTERNAL_SERVER_ERROR;
            break;
      }

      return new APIError(code, error.message, { cause: error });
   }

   static database(message: string): APIError {
      return new APIError(
         ErrorCodes.INTERNAL_SERVER_ERROR,
         `Database error: ${message}`,
      );
   }

   static validation(message: string): APIError {
      return new APIError(
         ErrorCodes.BAD_REQUEST,
         `Validation error: ${message}`,
      );
   }
   static unprocessableContent(message: string): APIError {
      return new APIError(ErrorCodes.UNPROCESSABLE_CONTENT, message);
   }

   static notFound(message: string): APIError {
      return new APIError(ErrorCodes.NOT_FOUND, message);
   }

   static unauthorized(message: string): APIError {
      return new APIError(ErrorCodes.UNAUTHORIZED, message);
   }

   static forbidden(message: string): APIError {
      return new APIError(ErrorCodes.FORBIDDEN, message);
   }

   static conflict(message: string): APIError {
      return new APIError(ErrorCodes.CONFLICT, message);
   }

   static tooManyRequests(message: string): APIError {
      return new APIError(ErrorCodes.TOO_MANY_REQUESTS, message);
   }

   static internal(message: string): APIError {
      return new APIError(ErrorCodes.INTERNAL_SERVER_ERROR, message);
   }
}
export function propagateError(err: unknown) {
   if (err instanceof AppError) {
      throw err;
   }
   if (err instanceof APIError) {
      throw err;
   }
   return;
}

export function validateInput<T extends ZodObject>(
   schema: T,
   value: unknown,
): z.infer<T> {
   try {
      return schema.parse(value);
   } catch (e) {
      if (e instanceof ZodError) {
         const errors = e.issues
            .map((err) => `${err.path.join(".")}: ${err.message}`)
            .join("; ");
         throw AppError.validation(`Input validation failed`, {
            cause: errors,
         });
      }
      throw e;
   }
}

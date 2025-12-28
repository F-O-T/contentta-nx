import { z } from "zod";
import type { ContentList, ContentSelect, Locale } from "./types";
import {
	AuthorByAgentIdSchema,
	ContentListResponseSchema,
	ContentSelectSchema,
	GetContentBySlugInputSchema,
	ImageSchema,
	ListContentByAgentInputSchema,
	RelatedSlugsResponseSchema,
	StreamAssistantResponseInputSchema,
} from "./types";

export const ERROR_CODES = {
	MISSING_API_KEY: {
		code: "SDK_E001",
		message: "apiKey is required to initialize the ContentaGenSDK",
	},
	API_REQUEST_FAILED: {
		code: "SDK_E002",
		message: "API request failed",
	},
	INVALID_API_RESPONSE: {
		code: "SDK_E003",
		message: "Invalid API response format.",
	},
	INVALID_INPUT: {
		code: "SDK_E004",
		message: "Invalid input.",
	},
};

export const API_ENDPOINTS = {
	listContentByAgent: "/content",
	getContentBySlug: "/content",
	getRelatedSlugs: "/related-slugs",
	getAuthorByAgentId: "/author",
	getContentImage: "/content/image",
	streamAssistantResponse: "/assistant",
};

const PRODUCTION_API_URL = "https://api.contentagen.com";

export interface SdkConfig {
	apiKey: string;
	locale?: Locale;
	host?: string;
}

export class ContentaGenSDK {
	private baseUrl: string;
	private apiKey: string;
	private locale?: string;

	constructor(config: SdkConfig) {
		if (!config.apiKey) {
			throw new Error("apiKey is required to initialize the ContentaGenSDK");
		}

		const host = config.host || PRODUCTION_API_URL;
		this.baseUrl = host.replace(/\/+$/, "");
		this.apiKey = config.apiKey;
		this.locale = config.locale;
	}

	private getHeaders(): Record<string, string> {
		const headers: Record<string, string> = {
			"sdk-api-key": this.apiKey,
		};

		if (this.locale) {
			headers["x-locale"] = this.locale;
		}

		return headers;
	}

	private buildUrl(path: string): URL {
		const normalizedPath = path.startsWith("/") ? path : `/${path}`;
		return new URL(`${this.baseUrl}/sdk${normalizedPath}`);
	}

	private appendQueryParams(url: URL, params: Record<string, unknown>): void {
		for (const [key, value] of Object.entries(params)) {
			if (value === undefined || value === null) {
				continue;
			}

			if (Array.isArray(value)) {
				let appended = false;
				for (const item of value) {
					if (item === undefined || item === null) {
						continue;
					}
					url.searchParams.append(key, String(item));
					appended = true;
				}
				if (!appended) {
					url.searchParams.delete(key);
				}
				continue;
			}

			url.searchParams.set(key, String(value));
		}
	}

	private transformDates(data: unknown): unknown {
		if (Array.isArray(data)) {
			return data.map((item) => this.transformDates(item));
		}
		if (data && typeof data === "object" && data !== null) {
			const obj: Record<string, unknown> = { ...data };
			for (const key of Object.keys(obj)) {
				if (
					(key === "createdAt" || key === "updatedAt") &&
					typeof obj[key] === "string"
				) {
					obj[key] = new Date(obj[key] as string);
				} else if (
					Array.isArray(obj[key]) ||
					(obj[key] && typeof obj[key] === "object")
				) {
					obj[key] = this.transformDates(obj[key]);
				}
			}
			return obj;
		}
		return data;
	}

	private _parseApiResponse<T>(json: unknown, schema: z.ZodType<T>): T {
		const transformedData = this.transformDates(json);
		return schema.parse(transformedData);
	}

	private async _get<T>(
		path: string,
		params: Record<string, unknown>,
		schema: z.ZodType<T>,
	): Promise<T> {
		const url = this.buildUrl(path);
		this.appendQueryParams(url, params);

		let response: Awaited<ReturnType<typeof fetch>>;
		try {
			response = await fetch(url, {
				headers: this.getHeaders(),
			});
		} catch (cause) {
			const { code, message } = ERROR_CODES.API_REQUEST_FAILED;
			const reason = cause instanceof Error ? cause.message : String(cause);
			throw new Error(`${code}: ${message}. ${reason}`.trim());
		}

		if (!response.ok) {
			const errorText = await response.text();
			const { code, message } = ERROR_CODES.API_REQUEST_FAILED;
			throw new Error(
				`${code}: ${message} (${response.statusText}) - ${errorText}`,
			);
		}

		const json = await response.json();
		return this._parseApiResponse(json, schema);
	}

	async listContentByAgent(
		params: z.input<typeof ListContentByAgentInputSchema>,
	): Promise<ContentList> {
		try {
			const validatedParams = ListContentByAgentInputSchema.parse(params);
			const { agentId, limit, page, status } = validatedParams;
			return this._get(
				`${API_ENDPOINTS.listContentByAgent}/${agentId}`,
				{ limit, page, status },
				ContentListResponseSchema,
			);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const { code, message } = ERROR_CODES.INVALID_INPUT;
				throw new Error(
					`${code}: ${message} for listContentByAgent: ${error.issues.map((e) => e.message).join(", ")}`,
				);
			}
			throw error;
		}
	}

	async getContentBySlug(
		params: z.input<typeof GetContentBySlugInputSchema>,
	): Promise<ContentSelect> {
		try {
			const validatedParams = GetContentBySlugInputSchema.parse(params);
			const { agentId, slug } = validatedParams;
			return this._get(
				`${API_ENDPOINTS.getContentBySlug}/${agentId}/${slug}`,
				{},
				ContentSelectSchema,
			);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const { code, message } = ERROR_CODES.INVALID_INPUT;
				throw new Error(
					`${code}: ${message} for getContentBySlug: ${error.issues.map((e) => e.message).join(", ")}`,
				);
			}
			throw error;
		}
	}

	async getRelatedSlugs(
		params: z.input<typeof GetContentBySlugInputSchema>,
	): Promise<string[]> {
		try {
			const validatedParams = GetContentBySlugInputSchema.parse(params);
			const { agentId, slug } = validatedParams;
			return this._get(
				API_ENDPOINTS.getRelatedSlugs,
				{ agentId, slug },
				RelatedSlugsResponseSchema,
			);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const { code, message } = ERROR_CODES.INVALID_INPUT;
				throw new Error(
					`${code}: ${message} for getRelatedSlugs: ${error.issues.map((e) => e.message).join(", ")}`,
				);
			}
			throw error;
		}
	}

	async getAuthorByAgentId(
		params: Pick<z.input<typeof GetContentBySlugInputSchema>, "agentId">,
	): Promise<z.infer<typeof AuthorByAgentIdSchema>> {
		try {
			const validatedParams = GetContentBySlugInputSchema.pick({
				agentId: true,
			}).parse(params);
			const { agentId } = validatedParams;
			return this._get(
				`${API_ENDPOINTS.getAuthorByAgentId}/${agentId}`,
				{},
				AuthorByAgentIdSchema,
			);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const { code, message } = ERROR_CODES.INVALID_INPUT;
				throw new Error(
					`${code}: ${message} for getAuthorByAgentId: ${error.issues.map((e) => e.message).join(", ")}`,
				);
			}
			throw error;
		}
	}

	async getContentImage(params: {
		contentId: string;
	}): Promise<z.infer<typeof ImageSchema>> {
		try {
			const validatedParams = z
				.object({ contentId: z.string().min(1, "Content ID is required") })
				.parse(params);
			const { contentId } = validatedParams;
			return this._get(
				`${API_ENDPOINTS.getContentImage}/${contentId}`,
				{},
				ImageSchema,
			);
		} catch (error) {
			if (error instanceof z.ZodError) {
				const { code, message } = ERROR_CODES.INVALID_INPUT;
				throw new Error(
					`${code}: ${message} for getContentImage: ${error.issues.map((e) => e.message).join(", ")}`,
				);
			}
			throw error;
		}
	}

	async *streamAssistantResponse(
		params: z.input<typeof StreamAssistantResponseInputSchema>,
	): AsyncGenerator<string, void, unknown> {
		try {
			const validatedParams = StreamAssistantResponseInputSchema.parse(params);

			const { message } = validatedParams;

			const url = this.buildUrl(API_ENDPOINTS.streamAssistantResponse);
			this.appendQueryParams(url, { message });

			const headers = this.getHeaders();

			const response = await fetch(url, {
				method: "GET",
				headers,
			});

			if (!response.ok) {
				const errorText = await response.text();
				const { code, message } = ERROR_CODES.API_REQUEST_FAILED;
				throw new Error(
					`${code}: ${message} (${response.statusText}) - ${errorText}`,
				);
			}

			if (!response.body) {
				throw new Error("Response body is null, cannot create a stream.");
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					break;
				}
				if (!value) {
					continue;
				}
				const chunk = decoder.decode(value, { stream: true });
				if (chunk) {
					yield chunk;
				}
			}
			const trailing = decoder.decode();
			if (trailing) {
				yield trailing;
			}
			if (typeof reader.releaseLock === "function") {
				reader.releaseLock();
			}
		} catch (error) {
			if (error instanceof z.ZodError) {
				const { code, message } = ERROR_CODES.INVALID_INPUT;
				const validationErrors = error.issues.map((e) => e.message).join(", ");
				throw new Error(
					`${code}: ${message} for streamAssistantResponse: ${validationErrors}`,
				);
			}
			throw error;
		}
	}
}

export const createSdk = (config: SdkConfig): ContentaGenSDK => {
	return new ContentaGenSDK(config);
};

export type { ShareStatus } from "./types";
export {
	AuthorByAgentIdSchema,
	ContentListResponseSchema,
	ContentSelectSchema,
	GetContentBySlugInputSchema,
	ImageSchema,
	ListContentByAgentInputSchema,
	ShareStatusValues,
	StreamAssistantResponseInputSchema,
} from "./types";

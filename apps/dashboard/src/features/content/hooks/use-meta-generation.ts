import { useCallback, useState } from "react";
import { clientEnv } from "@packages/environment/client";
import {
	generateSlug,
	type MetaGenerationRequest,
	type MetaGenerationResponse,
} from "../types/streaming-schemas";

export type GenerationType = "description" | "keywords" | "all";

export interface UseMetaGenerationOptions {
	onSuccess?: (result: MetaGenerationResponse) => void;
	onError?: (error: Error) => void;
}

export interface UseMetaGenerationState {
	isGeneratingDescription: boolean;
	isGeneratingKeywords: boolean;
	isGeneratingAll: boolean;
	error: Error | null;
}

export function useMetaGeneration(options?: UseMetaGenerationOptions) {
	const [state, setState] = useState<UseMetaGenerationState>({
		isGeneratingDescription: false,
		isGeneratingKeywords: false,
		isGeneratingAll: false,
		error: null,
	});

	const setLoading = useCallback(
		(type: GenerationType, isLoading: boolean) => {
			setState((prev) => {
				switch (type) {
					case "description":
						return { ...prev, isGeneratingDescription: isLoading };
					case "keywords":
						return { ...prev, isGeneratingKeywords: isLoading };
					case "all":
						return { ...prev, isGeneratingAll: isLoading };
				}
			});
		},
		[],
	);

	const generate = useCallback(
		async (
			type: GenerationType,
			title: string,
			content: string,
		): Promise<MetaGenerationResponse | null> => {
			setLoading(type, true);
			setState((prev) => ({ ...prev, error: null }));

			try {
				const request: MetaGenerationRequest = {
					type,
					title,
					content,
					maxTokens: 256,
					temperature: 0.5,
				};

				const response = await fetch(
					`${clientEnv.VITE_SERVER_URL}/api/meta-generator/generate`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						credentials: "include",
						body: JSON.stringify(request),
					},
				);

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(errorText || `Request failed: ${response.status}`);
				}

				const result: MetaGenerationResponse = await response.json();
				options?.onSuccess?.(result);
				return result;
			} catch (err) {
				const error = err instanceof Error ? err : new Error(String(err));
				setState((prev) => ({ ...prev, error }));
				options?.onError?.(error);
				return null;
			} finally {
				setLoading(type, false);
			}
		},
		[setLoading, options],
	);

	const generateDescription = useCallback(
		async (title: string, content: string) => {
			const result = await generate("description", title, content);
			return result?.description ?? null;
		},
		[generate],
	);

	const generateKeywords = useCallback(
		async (title: string, content: string) => {
			const result = await generate("keywords", title, content);
			return result?.keywords ?? null;
		},
		[generate],
	);

	const generateAll = useCallback(
		async (title: string, content: string) => {
			return generate("all", title, content);
		},
		[generate],
	);

	const generateSlugFromTitle = useCallback((title: string) => {
		return generateSlug(title);
	}, []);

	const isGenerating =
		state.isGeneratingDescription ||
		state.isGeneratingKeywords ||
		state.isGeneratingAll;

	return {
		generateDescription,
		generateKeywords,
		generateAll,
		generateSlugFromTitle,
		isGenerating,
		isGeneratingDescription: state.isGeneratingDescription,
		isGeneratingKeywords: state.isGeneratingKeywords,
		isGeneratingAll: state.isGeneratingAll,
		error: state.error,
	};
}

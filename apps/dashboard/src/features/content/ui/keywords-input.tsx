"use client";

import { Badge } from "@packages/ui/components/badge";
import { Input } from "@packages/ui/components/input";
import { cn } from "@packages/ui/lib/utils";
import { X } from "lucide-react";
import { useCallback, useState, type KeyboardEvent, type ChangeEvent } from "react";

type KeywordsInputProps = {
	value: string[];
	onChange: (keywords: string[]) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	maxKeywords?: number;
};

export function KeywordsInput({
	value,
	onChange,
	placeholder = "Add keyword...",
	disabled = false,
	className,
	maxKeywords = 10,
}: KeywordsInputProps) {
	const [inputValue, setInputValue] = useState("");

	const addKeyword = useCallback(
		(keyword: string) => {
			const trimmed = keyword.trim().toLowerCase();
			if (!trimmed) return;
			if (value.includes(trimmed)) return;
			if (value.length >= maxKeywords) return;

			onChange([...value, trimmed]);
			setInputValue("");
		},
		[value, onChange, maxKeywords],
	);

	const removeKeyword = useCallback(
		(keyword: string) => {
			onChange(value.filter((k) => k !== keyword));
		},
		[value, onChange],
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter" || e.key === ",") {
				e.preventDefault();
				addKeyword(inputValue);
			} else if (e.key === "Backspace" && !inputValue && value.length > 0) {
				const lastKeyword = value[value.length - 1];
				if (lastKeyword) {
					removeKeyword(lastKeyword);
				}
			}
		},
		[inputValue, value, addKeyword, removeKeyword],
	);

	const handleInputChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			const val = e.target.value;
			// If user types comma, treat it as adding a keyword
			if (val.includes(",")) {
				const parts = val.split(",");
				for (const part of parts) {
					if (part.trim()) {
						addKeyword(part);
					}
				}
			} else {
				setInputValue(val);
			}
		},
		[addKeyword],
	);

	const handleBlur = useCallback(() => {
		if (inputValue.trim()) {
			addKeyword(inputValue);
		}
	}, [inputValue, addKeyword]);

	return (
		<div
			className={cn(
				"flex flex-wrap gap-1.5 rounded-md border bg-background p-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
				disabled && "opacity-50 cursor-not-allowed",
				className,
			)}
		>
			{value.map((keyword) => (
				<Badge
					key={keyword}
					variant="secondary"
					className="flex items-center gap-1 pr-1"
				>
					{keyword}
					{!disabled && (
						<button
							type="button"
							onClick={() => removeKeyword(keyword)}
							className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
							aria-label={`Remove ${keyword}`}
						>
							<X className="size-3" />
						</button>
					)}
				</Badge>
			))}
			{!disabled && value.length < maxKeywords && (
				<Input
					type="text"
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					onBlur={handleBlur}
					placeholder={value.length === 0 ? placeholder : ""}
					disabled={disabled}
					className="flex-1 min-w-[120px] border-0 p-0 h-6 focus-visible:ring-0 focus-visible:ring-offset-0"
				/>
			)}
		</div>
	);
}

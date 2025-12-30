import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * Calculate Flesch-Kincaid Reading Ease score
 * Higher scores = easier to read (60-70 is ideal for general audience)
 */
function calculateFleschKincaid(text: string): {
	readingEase: number;
	gradeLevel: number;
} {
	// Clean text and split into sentences and words
	const cleanText = text.replace(/[^\w\s.!?]/g, "");
	const sentences = cleanText.split(/[.!?]+/).filter(Boolean);
	const words = cleanText.split(/\s+/).filter(Boolean);

	if (words.length === 0 || sentences.length === 0) {
		return { readingEase: 0, gradeLevel: 0 };
	}

	// Count syllables (simplified algorithm)
	const countSyllables = (word: string): number => {
		const w = word.toLowerCase();
		if (w.length <= 3) return 1;

		// Count vowel groups
		const vowelGroups = w.match(/[aeiouy]+/g) || [];
		let count = vowelGroups.length;

		// Adjust for silent e
		if (w.endsWith("e")) count--;

		// At least 1 syllable
		return Math.max(1, count);
	};

	const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
	const avgWordsPerSentence = words.length / sentences.length;
	const avgSyllablesPerWord = totalSyllables / words.length;

	// Flesch-Kincaid Reading Ease
	const readingEase = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

	// Flesch-Kincaid Grade Level
	const gradeLevel = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;

	return {
		readingEase: Math.max(0, Math.min(100, Math.round(readingEase * 10) / 10)),
		gradeLevel: Math.max(0, Math.round(gradeLevel * 10) / 10),
	};
}

/**
 * Get readability level description
 */
function getReadabilityLevel(score: number): string {
	if (score >= 90) return "Very Easy (5th grade)";
	if (score >= 80) return "Easy (6th grade)";
	if (score >= 70) return "Fairly Easy (7th grade)";
	if (score >= 60) return "Standard (8th-9th grade)";
	if (score >= 50) return "Fairly Difficult (10th-12th grade)";
	if (score >= 30) return "Difficult (College)";
	return "Very Difficult (College Graduate)";
}

export const readabilityTool = createTool({
	id: "readability",
	description:
		"Analyzes the readability of the blog post content using Flesch-Kincaid scores and provides suggestions for improvement.",
	inputSchema: z.object({
		content: z.string().describe("The blog post content to analyze"),
		targetAudience: z
			.enum(["general", "technical", "academic", "casual"])
			.optional()
			.default("general")
			.describe("Target audience for the content"),
	}),
	outputSchema: z.object({
		fleschKincaidReadingEase: z.number(),
		fleschKincaidGradeLevel: z.number(),
		readabilityLevel: z.string(),
		targetScore: z.object({
			min: z.number(),
			max: z.number(),
			description: z.string(),
		}),
		isOnTarget: z.boolean(),
		suggestions: z.array(z.string()),
		metrics: z.object({
			sentenceCount: z.number(),
			wordCount: z.number(),
			avgWordsPerSentence: z.number(),
			avgSyllablesPerWord: z.number(),
			complexWordCount: z.number(),
			complexWordPercentage: z.number(),
		}),
	}),
	execute: async (inputData) => {
		const { content, targetAudience } = inputData;

		// Calculate scores
		const { readingEase, gradeLevel } = calculateFleschKincaid(content);
		const readabilityLevel = getReadabilityLevel(readingEase);

		// Get target scores based on audience
		const targetScores = {
			general: { min: 60, max: 70, description: "Easy to read for general audience" },
			technical: { min: 40, max: 60, description: "Technical but accessible" },
			academic: { min: 30, max: 50, description: "Academic/professional level" },
			casual: { min: 70, max: 80, description: "Very easy, conversational" },
		} as const;

		// targetAudience always has a value due to .default("general") in schema
		const targetScore = targetScores[targetAudience];
		const isOnTarget = readingEase >= targetScore.min && readingEase <= targetScore.max;

		// Calculate metrics
		const cleanText = content.replace(/[^\w\s.!?]/g, "");
		const sentences = cleanText.split(/[.!?]+/).filter(Boolean);
		const words = cleanText.split(/\s+/).filter(Boolean);

		const countSyllables = (word: string): number => {
			const w = word.toLowerCase();
			if (w.length <= 3) return 1;
			const vowelGroups = w.match(/[aeiouy]+/g) || [];
			let count = vowelGroups.length;
			if (w.endsWith("e")) count--;
			return Math.max(1, count);
		};

		// Complex words = 3+ syllables
		const complexWords = words.filter((w: string) => countSyllables(w) >= 3);
		const totalSyllables = words.reduce((sum: number, word: string) => sum + countSyllables(word), 0);

		// Generate suggestions
		const suggestions: string[] = [];

		if (readingEase < targetScore.min) {
			suggestions.push("Simplify your language - use shorter words and sentences");

			const avgWordsPerSentence = words.length / sentences.length;
			if (avgWordsPerSentence > 20) {
				suggestions.push(`Average sentence length is ${Math.round(avgWordsPerSentence)} words. Try to keep it under 20.`);
			}

			if (complexWords.length / words.length > 0.2) {
				suggestions.push("Too many complex words (3+ syllables). Replace with simpler alternatives.");
			}

			suggestions.push("Break long sentences into shorter ones");
			suggestions.push("Use active voice instead of passive voice");
		} else if (readingEase > targetScore.max && targetAudience !== "casual") {
			suggestions.push("Content may be too simple for your target audience");
			suggestions.push("Consider adding more technical depth or detail");
		}

		if (sentences.some((s) => s.split(/\s+/).length > 40)) {
			suggestions.push("Some sentences are very long. Consider breaking them up.");
		}

		return {
			fleschKincaidReadingEase: readingEase,
			fleschKincaidGradeLevel: gradeLevel,
			readabilityLevel,
			targetScore,
			isOnTarget,
			suggestions,
			metrics: {
				sentenceCount: sentences.length,
				wordCount: words.length,
				avgWordsPerSentence: Math.round((words.length / sentences.length) * 10) / 10,
				avgSyllablesPerWord: Math.round((totalSyllables / words.length) * 100) / 100,
				complexWordCount: complexWords.length,
				complexWordPercentage: Math.round((complexWords.length / words.length) * 1000) / 10,
			},
		};
	},
});

export function getReadabilityInstructions(): string {
	return `
## READABILITY TOOL
Analyzes how easy the content is to read using Flesch-Kincaid scores.

**When to use:** After writing, to ensure content matches audience expectations

**Parameters:**
- content (string): The blog post content
- targetAudience (enum): Who the content is for
  - "general": General public (score 60-70 ideal)
  - "technical": Tech-savvy readers (score 40-60 ideal)
  - "academic": Professional/scholarly (score 30-50 ideal)
  - "casual": Very easy reading (score 70-80 ideal)

**Returns:**
- fleschKincaidReadingEase: Score 0-100 (higher = easier)
- fleschKincaidGradeLevel: US school grade level
- readabilityLevel: Human-readable description
- isOnTarget: Whether score matches target audience
- suggestions: Improvement recommendations
- metrics: Sentence count, word count, complexity stats
`;
}

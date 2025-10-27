import slugfy from "slugify";

export function createDescriptionFromText({
   text,
   maxLength = 160,
}: {
   text: string;
   maxLength: number;
}) {
   function truncateWithEllipsis(text: string, maxLength: number): string {
      if (text.length <= maxLength) {
         return text;
      }

      const ELLIPSIS = "...";
      const truncationPoint = maxLength - ELLIPSIS.length;
      const truncatedText = text.substring(0, truncationPoint);
      const lastSpaceIndex = truncatedText.lastIndexOf(" ");

      const cutoffPoint = lastSpaceIndex > 0 ? lastSpaceIndex : truncationPoint;
      return text.substring(0, cutoffPoint) + ELLIPSIS;
   }

   function removeMarkdownHeadersAndLinks(text: string): string {
      return text
         .replace(/^#{1,6}\s.+$/gm, "") // Remove markdown headers
         .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Replace markdown links with text
         .trim();
   }
   function extractFirstParagraph(text: string): string {
      return text.split("\n\n")[0] || "";
   }

   const cleanText = removeMarkdownHeadersAndLinks(text);
   const firstParagraph = extractFirstParagraph(cleanText);
   const metaDescription = truncateWithEllipsis(firstParagraph, maxLength);

   return metaDescription;
}

export function getKeywordsFromText({
   text,
   minLength = 4,
}: {
   text: string;
   minLength?: number;
}) {
   const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length >= (minLength ?? 4));

   const frequency = new Map<string, number>();
   words.forEach((word) => {
      frequency.set(word, (frequency.get(word) || 0) + 1);
   });

   const keywords = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map((entry) => entry[0]);

   return keywords;
}
export function createSlug(name: string): string {
   return slugfy(name, { lower: true, strict: true });
}

export function countWords(text: string) {
   return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
}

export function calculateReadTimeMinutes(wordCount: number): number {
   const wordsPerMinute = 200; // Average reading speed
   return Math.ceil(wordCount / wordsPerMinute);
}

export function formatStringForDisplay(value: string) {
   if (!value) return "Not specified";
   return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function calculateTextStats(content: string) {
   const wordCount = countWords(content);
   const readTime = calculateReadTimeMinutes(wordCount);

   return {
      wordsCount: wordCount.toString(),
      readTimeMinutes: readTime.toString(),
   };
}

export function calculateReadabilityScore({ text }: { text: string }) {
   const countSyllables = (word: string): number => {
      word = word.toLowerCase().replace(/[^a-z]/g, "");
      if (word.length <= 3) return 1;

      const vowels = word.match(/[aeiouy]+/g);
      let count = vowels ? vowels.length : 1;

      if (word.endsWith("e")) count--;
      if (word.endsWith("le") && word.length > 2) count++;

      return Math.max(count, 1);
   };

   const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
   const words = text.split(/\s+/).filter((w) => w.length > 0);
   const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

   const avgWordsPerSentence = words.length / sentences.length;
   const avgSyllablesPerWord = syllables / words.length;

   const score =
      206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

   function getReadabilityLevel(score: number): string {
      if (score >= 90) return "Very Easy";
      if (score >= 80) return "Easy";
      if (score >= 70) return "Fairly Easy";
      if (score >= 60) return "Standard";
      if (score >= 50) return "Fairly Difficult";
      if (score >= 30) return "Difficult";
      return "Very Difficult";
   }
   const level = getReadabilityLevel(score);

   return { score, level };
}

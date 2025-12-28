/**
 * Shared duplicate detection logic for transactions.
 * Used across API (bank-accounts router) and Dashboard (import flow).
 */

/**
 * Weights for duplicate detection scoring (total: 6)
 */
export const WEIGHTS = {
   amount: 3, // Most important - exact match
   date: 2, // Important - within tolerance
   description: 1, // Less important - similarity
} as const;

/**
 * Maximum possible score (sum of all weights)
 */
export const MAX_SCORE = WEIGHTS.amount + WEIGHTS.date + WEIGHTS.description;

/**
 * Threshold percentage for considering a match as duplicate (80%)
 */
export const THRESHOLD_PERCENTAGE = 0.8;

/**
 * Date tolerance in days for matching transactions
 */
export const DATE_TOLERANCE_DAYS = 1;

/**
 * Stop words to filter out from descriptions (Portuguese and English)
 */
const STOP_WORDS = new Set([
   "de",
   "da",
   "do",
   "para",
   "com",
   "em",
   "no",
   "na",
   "os",
   "as",
   "um",
   "uma",
   "the",
   "a",
   "an",
   "of",
   "to",
   "in",
   "for",
   "on",
   "at",
]);

/**
 * Regex to remove special characters while preserving accented characters
 */
const SPECIAL_CHARS_REGEX = /[^\w\sáàâãéèêíìîóòôõúùûç]/g;

/**
 * Transaction-like object for duplicate detection
 */
export interface DuplicateDetectionTransaction {
   date: Date;
   amount: number;
   description: string;
}

/**
 * Result of duplicate score calculation
 */
export interface DuplicateScoreResult {
   score: number;
   scorePercentage: number;
   passed: boolean;
}

/**
 * Checks if two dates are within the specified tolerance.
 * @param date1 - First date
 * @param date2 - Second date
 * @param toleranceDays - Number of days tolerance (defaults to DATE_TOLERANCE_DAYS)
 * @returns True if dates are within tolerance
 */
export function datesWithinTolerance(
   date1: Date,
   date2: Date,
   toleranceDays = DATE_TOLERANCE_DAYS,
): boolean {
   const diffMs = Math.abs(date1.getTime() - date2.getTime());
   const diffDays = diffMs / (1000 * 60 * 60 * 24);
   return diffDays <= toleranceDays;
}

/**
 * Extracts key tokens from description for similarity matching.
 * Removes common stop words and normalizes text.
 * @param description - Transaction description
 * @returns Array of normalized tokens
 */
export function extractDescriptionTokens(description: string): string[] {
   return description
      .toLowerCase()
      .replace(SPECIAL_CHARS_REGEX, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

/**
 * Calculates Jaccard similarity between two sets of tokens.
 * @param tokens1 - First set of tokens
 * @param tokens2 - Second set of tokens
 * @returns Similarity score between 0 and 1
 */
export function calculateTokenSimilarity(
   tokens1: string[],
   tokens2: string[],
): number {
   if (tokens1.length === 0 || tokens2.length === 0) return 0;

   const set1 = new Set(tokens1);
   const set2 = new Set(tokens2);

   let intersectionSize = 0;
   for (const token of set1) {
      if (set2.has(token)) intersectionSize++;
   }

   const unionSize = set1.size + set2.size - intersectionSize;
   if (unionSize === 0) return 0;

   return intersectionSize / unionSize;
}

/**
 * Calculates duplicate score between two transactions.
 * Uses weighted scoring based on amount (exact), date (within tolerance), and description (similarity).
 * @param candidate - Transaction to check
 * @param target - Transaction to compare against
 * @returns Score details with percentage and pass/fail status
 */
export function calculateDuplicateScore(
   candidate: DuplicateDetectionTransaction,
   target: DuplicateDetectionTransaction,
): DuplicateScoreResult {
   let score = 0;

   // Amount match (exact)
   if (candidate.amount === target.amount) {
      score += WEIGHTS.amount;
   }

   // Date match (within tolerance)
   if (datesWithinTolerance(candidate.date, target.date)) {
      score += WEIGHTS.date;
   }

   // Description similarity
   const candidateTokens = extractDescriptionTokens(candidate.description);
   const targetTokens = extractDescriptionTokens(target.description);
   const similarity = calculateTokenSimilarity(candidateTokens, targetTokens);

   // Add weighted description score based on similarity
   if (similarity >= 0.5) {
      score += WEIGHTS.description * similarity;
   }

   const scorePercentage = score / MAX_SCORE;
   const passed = scorePercentage >= THRESHOLD_PERCENTAGE;

   return { score, scorePercentage, passed };
}

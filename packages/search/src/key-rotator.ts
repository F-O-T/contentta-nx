import type { KeyUsage, ProviderId } from "./types";

// In-memory storage for key usage (could be moved to Redis for persistence)
const keyUsageMap = new Map<string, KeyUsage>();

// Rate limit reset duration (1 hour for most providers)
const RATE_LIMIT_RESET_MS = 60 * 60 * 1000;

// Daily reset time (midnight UTC)
function getStartOfDay(): Date {
	const now = new Date();
	return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Parse comma-separated API keys from environment variable
 */
export function parseApiKeys(envValue: string | undefined): string[] {
	if (!envValue) return [];
	return envValue
		.split(",")
		.map((k) => k.trim())
		.filter((k) => k.length > 0);
}

/**
 * Initialize key usage tracking for a set of keys
 */
export function initializeKeys(provider: ProviderId, keys: string[]): void {
	for (const key of keys) {
		const id = `${provider}:${key}`;
		if (!keyUsageMap.has(id)) {
			keyUsageMap.set(id, {
				key,
				provider,
				requestsToday: 0,
				lastUsed: new Date(0),
				rateLimited: false,
			});
		}
	}
}

/**
 * Get the next available key for a provider using least-recently-used strategy
 */
export function getNextKey(provider: ProviderId, keys: string[]): string | null {
	if (keys.length === 0) return null;

	const now = new Date();
	const startOfDay = getStartOfDay();

	// Get usage info for all keys
	const keyInfos: KeyUsage[] = keys.map((key) => {
		const id = `${provider}:${key}`;
		const usage = keyUsageMap.get(id);

		if (!usage) {
			// Initialize if not tracked
			const newUsage: KeyUsage = {
				key,
				provider,
				requestsToday: 0,
				lastUsed: new Date(0),
				rateLimited: false,
			};
			keyUsageMap.set(id, newUsage);
			return newUsage;
		}

		// Reset daily counter if it's a new day
		if (usage.lastUsed < startOfDay) {
			usage.requestsToday = 0;
		}

		// Check if rate limit should be cleared
		if (usage.rateLimited && usage.resetAt && usage.resetAt < now) {
			usage.rateLimited = false;
			usage.resetAt = undefined;
		}

		return usage;
	});

	// Filter out rate-limited keys
	const availableKeys = keyInfos.filter((k) => !k.rateLimited);

	if (availableKeys.length === 0) {
		// All keys are rate limited, return null
		return null;
	}

	// Sort by: least recently used, then lowest daily usage
	availableKeys.sort((a, b) => {
		// Primary: least recently used
		const timeDiff = a.lastUsed.getTime() - b.lastUsed.getTime();
		if (timeDiff !== 0) return timeDiff;

		// Secondary: lowest requests today
		return a.requestsToday - b.requestsToday;
	});

	const firstKey = availableKeys[0];
	return firstKey ? firstKey.key : null;
}

/**
 * Record that a key was used
 */
export function recordKeyUsage(provider: ProviderId, key: string): void {
	const id = `${provider}:${key}`;
	const usage = keyUsageMap.get(id);

	if (usage) {
		usage.requestsToday++;
		usage.lastUsed = new Date();
	}
}

/**
 * Mark a key as rate limited
 */
export function markKeyRateLimited(provider: ProviderId, key: string): void {
	const id = `${provider}:${key}`;
	const usage = keyUsageMap.get(id);

	if (usage) {
		usage.rateLimited = true;
		usage.resetAt = new Date(Date.now() + RATE_LIMIT_RESET_MS);
	}
}

/**
 * Get the count of available (non-rate-limited) keys for a provider
 */
export function getAvailableKeyCount(provider: ProviderId, keys: string[]): number {
	const now = new Date();

	return keys.filter((key) => {
		const id = `${provider}:${key}`;
		const usage = keyUsageMap.get(id);

		if (!usage) return true; // Not tracked yet, assume available

		// Check if rate limit expired
		if (usage.rateLimited && usage.resetAt && usage.resetAt < now) {
			return true;
		}

		return !usage.rateLimited;
	}).length;
}

/**
 * Get usage statistics for all keys of a provider
 */
export function getKeyStats(provider: ProviderId, keys: string[]): KeyUsage[] {
	return keys.map((key) => {
		const id = `${provider}:${key}`;
		return (
			keyUsageMap.get(id) || {
				key,
				provider,
				requestsToday: 0,
				lastUsed: new Date(0),
				rateLimited: false,
			}
		);
	});
}

/**
 * Clear all rate limits (useful for testing)
 */
export function clearAllRateLimits(): void {
	for (const usage of keyUsageMap.values()) {
		usage.rateLimited = false;
		usage.resetAt = undefined;
	}
}

/**
 * Reset all usage counters (useful for testing)
 */
export function resetAllUsage(): void {
	keyUsageMap.clear();
}

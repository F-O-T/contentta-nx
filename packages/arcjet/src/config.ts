import arcjet, {
   detectBot,
   fixedWindow,
   shield,
   tokenBucket,
   validateEmail,
} from "@arcjet/bun";
import { serverEnv } from "@packages/environment/server";

const ARCJET_KEY = serverEnv.ARCJET_KEY;

export const arcjetInstance = ARCJET_KEY
   ? arcjet({
        key: ARCJET_KEY,
        characteristics: ["ip.src"],
        rules: [
           shield({
              mode: "DRY_RUN",
           }),
        ],
     })
   : null;

export const AUTH_RATE_LIMITS = {
   SIGNUP: tokenBucket({
      mode: "DRY_RUN",
      refillRate: 5,
      interval: 3600,
      capacity: 5,
   }),
   LOGIN: tokenBucket({
      mode: "DRY_RUN",
      refillRate: 10,
      interval: 900,
      capacity: 10,
   }),
   PASSWORD_RESET: tokenBucket({
      mode: "DRY_RUN",
      refillRate: 3,
      interval: 3600,
      capacity: 3,
   }),
   GENERAL: tokenBucket({
      mode: "DRY_RUN",
      refillRate: 100,
      interval: 60,
      capacity: 100,
   }),
   OAUTH: fixedWindow({
      mode: "DRY_RUN",
      max: 30,
      window: "1m",
   }),
};

export const BOT_DETECTION = detectBot({
   mode: "DRY_RUN",
   allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR", "CATEGORY:PREVIEW"],
});

export const EMAIL_VALIDATION = validateEmail({
   mode: "DRY_RUN",
   block: ["DISPOSABLE", "INVALID", "NO_MX_RECORDS"],
});

export const TRPC_RATE_LIMITS = {
   PUBLIC: tokenBucket({
      mode: "DRY_RUN",
      refillRate: 60,
      interval: 60,
      capacity: 200,
   }),
   PROTECTED: tokenBucket({
      mode: "DRY_RUN",
      refillRate: 100,
      interval: 60,
      capacity: 300,
   }),
};

/**
 * Exact routes require the normalized path to match exactly.
 * Prefix routes allow matching paths that start with the route
 * (e.g., "/callback/google" matches prefix "/callback").
 */
const ROUTE_MATCHERS = {
   SIGNUP: {
      exact: new Set(["/sign-up", "/email-otp/send-verification-otp"]),
      prefix: [] as string[],
   },
   LOGIN: {
      exact: new Set(["/sign-in", "/email-otp/verify-email"]),
      prefix: [] as string[],
   },
   PASSWORD_RESET: {
      exact: new Set(["/forgot-password", "/reset-password"]),
      prefix: [] as string[],
   },
   OAUTH: {
      exact: new Set(["/google", "/oauth"]),
      prefix: ["/callback"],
   },
} as const;

function normalizePath(pathname: string): string {
   const queryIndex = pathname.indexOf("?");
   let path = queryIndex === -1 ? pathname : pathname.slice(0, queryIndex);
   if (path.length > 1 && path.endsWith("/")) {
      path = path.slice(0, -1);
   }
   return path;
}

function matchesRoute(
   normalizedPath: string,
   matcher: { exact: Set<string>; prefix: readonly string[] },
): boolean {
   if (matcher.exact.has(normalizedPath)) {
      return true;
   }
   for (const prefixRoute of matcher.prefix) {
      if (
         normalizedPath === prefixRoute ||
         normalizedPath.startsWith(`${prefixRoute}/`)
      ) {
         return true;
      }
   }
   return false;
}

export function getAuthEndpointRateLimit(pathname: string) {
   const normalizedPath = normalizePath(pathname);

   if (matchesRoute(normalizedPath, ROUTE_MATCHERS.SIGNUP)) {
      return AUTH_RATE_LIMITS.SIGNUP;
   }

   if (matchesRoute(normalizedPath, ROUTE_MATCHERS.LOGIN)) {
      return AUTH_RATE_LIMITS.LOGIN;
   }

   if (matchesRoute(normalizedPath, ROUTE_MATCHERS.PASSWORD_RESET)) {
      return AUTH_RATE_LIMITS.PASSWORD_RESET;
   }

   if (matchesRoute(normalizedPath, ROUTE_MATCHERS.OAUTH)) {
      return AUTH_RATE_LIMITS.OAUTH;
   }

   return AUTH_RATE_LIMITS.GENERAL;
}

export function isSignupEndpoint(pathname: string): boolean {
   const normalizedPath = normalizePath(pathname);
   return matchesRoute(normalizedPath, ROUTE_MATCHERS.SIGNUP);
}

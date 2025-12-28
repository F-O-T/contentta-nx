const SENSITIVE_KEYS = [
   "password",
   "confirmpassword",
   "token",
   "accesstoken",
   "refreshtoken",
   "apiKey",
   "apikey",
   "secret",
   "api_key",
   "auth",
   "authorization",
   "ssn",
   "email",
   "phone",
].map((s) => s.toLowerCase());

const SENSITIVE_SUBSTRINGS = [
   "password",
   "secret",
   "token",
   "api_key",
   "api",
   "auth",
   "authorization",
   "ssn",
   "email",
   "phone",
];

const MASK = "********";

function maskString(): string {
   return MASK;
}

function isLikelyEmail(value: string): boolean {
   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isLikelyPhone(value: string): boolean {
   const digits = value.replace(/\D/g, "");
   return digits.length >= 7 && /^[\d\s()+\-.]+$/.test(value);
}

function isLikelySecret(value: string): boolean {
   if (value.length < 20) return false;
   return /^[A-Za-z0-9_\-+/=]+$/.test(value);
}

function shouldMaskKey(key: string): boolean {
   const lower = key.toLowerCase();
   if (SENSITIVE_KEYS.includes(lower)) return true;
   return SENSITIVE_SUBSTRINGS.some((sub) => lower.includes(sub));
}

function cloneAndSanitize(value: unknown): unknown {
   if (value === null || value === undefined) return value;

   if (Array.isArray(value)) {
      return value.map(cloneAndSanitize);
   }

   if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
         try {
            if (shouldMaskKey(k)) {
               out[k] = MASK;
            } else {
               out[k] = cloneAndSanitize(v);
            }
         } catch (e) {
            console.error("Error sanitizing key:", k, e);
            out[k] = MASK;
         }
      }
      return out;
   }

   if (typeof value === "string") {
      if (
         isLikelyEmail(value) ||
         isLikelyPhone(value) ||
         isLikelySecret(value)
      ) {
         return maskString();
      }
      return value;
   }

   return value;
}

export function sanitizeData<T>(data: T): T {
   if (!data || typeof data !== "object") {
      return data;
   }

   if (Array.isArray(data)) {
      return cloneAndSanitize(data) as unknown as T;
   }

   const topObj = { ...(data as Record<string, unknown>) };
   const sanitized = cloneAndSanitize(topObj) as T;

   return sanitized;
}

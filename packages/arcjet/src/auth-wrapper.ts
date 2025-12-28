import type { ArcjetDecision } from "@arcjet/bun";
import type { AuthInstance } from "@packages/authentication/server";
import {
   arcjetInstance,
   BOT_DETECTION,
   EMAIL_VALIDATION,
   getAuthEndpointRateLimit,
   isSignupEndpoint,
} from "./config";

async function extractEmailFromRequest(
   request: Request,
): Promise<{ email: string | undefined }> {
   try {
      const body = (await request.clone().json()) as Record<string, unknown>;
      const email = typeof body?.email === "string" ? body.email : undefined;
      return { email };
   } catch {
      return { email: undefined };
   }
}

export async function wrapAuthHandler(
   authInstance: AuthInstance,
): Promise<(request: Request) => Promise<Response>> {
   return async (request: Request): Promise<Response> => {
      if (!arcjetInstance) {
         return authInstance.handler(request);
      }

      try {
         const url = new URL(request.url);
         const pathname = url.pathname;

         const rateLimitRule = getAuthEndpointRateLimit(pathname);
         const isSignup = isSignupEndpoint(pathname);

         let decision: ArcjetDecision;

         if (isSignup && request.method === "POST") {
            const { email } = await extractEmailFromRequest(request);
            const trimmedEmail = email?.trim();

            if (trimmedEmail) {
               const aj = arcjetInstance
                  .withRule(rateLimitRule)
                  .withRule(BOT_DETECTION)
                  .withRule(EMAIL_VALIDATION);

               decision = await aj.protect(request, {
                  requested: 1,
                  email: trimmedEmail,
               });
            } else {
               const aj = arcjetInstance
                  .withRule(rateLimitRule)
                  .withRule(BOT_DETECTION);

               decision = await aj.protect(request, { requested: 1 });
            }
         } else {
            const aj = arcjetInstance
               .withRule(rateLimitRule)
               .withRule(BOT_DETECTION);

            decision = await aj.protect(request, { requested: 1 });
         }

         console.log(
            `[Arcjet Auth] ${pathname} - ${decision.conclusion} - ${decision.reason.type}`,
         );

         if (decision.isDenied()) {
            const reason = decision.reason;

            if (reason.isRateLimit()) {
               const retryAfterSeconds = reason.resetTime
                  ? Math.max(
                       0,
                       Math.ceil(
                          (reason.resetTime.getTime() - Date.now()) / 1000,
                       ),
                    )
                  : 60;

               return new Response(
                  JSON.stringify({
                     error: "Too many requests. Please try again later.",
                     retryAfter: retryAfterSeconds,
                  }),
                  {
                     status: 429,
                     headers: {
                        "Content-Type": "application/json",
                        "Retry-After": retryAfterSeconds.toString(),
                     },
                  },
               );
            }

            if (reason.isBot()) {
               return new Response(
                  JSON.stringify({
                     error: "Automated requests are not permitted.",
                  }),
                  {
                     status: 403,
                     headers: {
                        "Content-Type": "application/json",
                     },
                  },
               );
            }

            if (reason.isEmail()) {
               return new Response(
                  JSON.stringify({
                     error: "Invalid email address.",
                     details: {
                        emailTypes: reason.emailTypes,
                     },
                  }),
                  {
                     status: 400,
                     headers: {
                        "Content-Type": "application/json",
                     },
                  },
               );
            }

            if (reason.isShield()) {
               return new Response(
                  JSON.stringify({
                     error: "Request blocked for security reasons.",
                  }),
                  {
                     status: 403,
                     headers: {
                        "Content-Type": "application/json",
                     },
                  },
               );
            }

            return new Response(
               JSON.stringify({
                  error: "Access denied.",
               }),
               {
                  status: 403,
                  headers: {
                     "Content-Type": "application/json",
                  },
               },
            );
         }

         return authInstance.handler(request);
      } catch (error) {
         console.error("[Arcjet Auth] Error during protection:", error);
         return authInstance.handler(request);
      }
   };
}

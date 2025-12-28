import { stripe } from "@better-auth/stripe";
import { createBetterAuthStorage } from "@packages/cache/better-auth";
import { createRedisConnection } from "@packages/cache/connection";
import type { DatabaseInstance } from "@packages/database/client";
import {
   createDefaultOrganization,
   findMemberByUserId,
} from "@packages/database/repositories/auth-repository";
import { getDomain, isProduction } from "@packages/environment/helpers";
import { serverEnv } from "@packages/environment/server";
import type { StripeClient } from "@packages/stripe";
import { PlanName } from "@packages/stripe/constants";
import {
   type ResendClient,
   type SendEmailOTPOptions,
   sendEmailOTP,
   sendMagicLinkEmail,
   sendOrganizationInvitation,
} from "@packages/transactional/client";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { type BetterAuthOptions, betterAuth } from "better-auth/minimal";
import {
   admin,
   anonymous,
   apiKey,
   emailOTP,
   lastLoginMethod,
   magicLink,
   openAPI,
   organization,
   twoFactor,
} from "better-auth/plugins";
import { type BuiltInLocales, localization } from "better-auth-localization";

// Initialize Redis connection for session caching
const redis = createRedisConnection(serverEnv.REDIS_URL);
export const ORGANIZATION_LIMIT = 3;

export interface AuthOptions {
   db: DatabaseInstance;
   resendClient: ResendClient;
   stripeClient: StripeClient;
   STRIPE_WEBHOOK_SECRET: string;
}
const getCrossSubDomainCookiesConfig = () => {
   if (isProduction) {
      return {
         domain: ".contentta.com",
         enabled: true,
      };
   }
   return { enabled: false };
};

export const getAuthOptions = (
   db: AuthOptions["db"],
   resendClient: AuthOptions["resendClient"],
   stripeClient: AuthOptions["stripeClient"],
   STRIPE_WEBHOOK_SECRET: AuthOptions["STRIPE_WEBHOOK_SECRET"],
) =>
   ({
      account: {
         accountLinking: {
            enabled: true,
            trustedProviders: ["google"],
         },
      },
      advanced: {
         crossSubDomainCookies: getCrossSubDomainCookiesConfig(),
         database: { generateId: "uuid" },
      },
      secondaryStorage: createBetterAuthStorage(redis),
      database: drizzleAdapter(db, {
         provider: "pg",
      }),
      databaseHooks: {
         session: {
            create: {
               before: async (session) => {
                  try {
                     const member = await findMemberByUserId(
                        db,
                        session.userId,
                     );

                     if (member?.organizationId) {
                        console.log(
                           `Setting activeOrganizationId for user ${session.userId} to ${member.organizationId}`,
                        );
                        return {
                           data: {
                              ...session,
                              activeOrganizationId: member.organizationId,
                           },
                        };
                     }
                  } catch (error) {
                     console.error(
                        "Error in session create before hook:",
                        error,
                     );
                     return {
                        data: {
                           ...session,
                        },
                     };
                  }
               },
            },
         },
         user: {
            create: {
               after: async (user) => {
                  try {
                     await createDefaultOrganization(db, user.id, user.name);
                  } catch (error) {
                     console.error(
                        "Error creating default organization for user:",
                        error,
                     );
                  }
               },
            },
         },
      },
      emailAndPassword: {
         enabled: true,
         requireEmailVerification: true,
      },
      emailVerification: {
         autoSignInAfterVerification: true,
         sendOnSignUp: true,
      },
      experimental: {
         joins: true,
      },
      plugins: [
         stripe({
            createCustomerOnSignUp: true,
            stripeClient,
            stripeWebhookSecret: STRIPE_WEBHOOK_SECRET,

            subscription: {
               authorizeReference: async ({ user, referenceId }) => {
                  const membership = await db.query.member.findFirst({
                     where: (member, { eq, and }) =>
                        and(
                           eq(member.organizationId, referenceId),
                           eq(member.userId, user.id),
                        ),
                  });
                  if (!membership) {
                     return false;
                  }
                  return (
                     membership.role === "owner" || membership.role === "admin"
                  );
               },
               enabled: true,
               getCheckoutSessionParams: async () => ({
                  params: {
                     allow_promotion_codes: true,
                  },
               }),
               plans: [
                  {
                     annualDiscountPriceId:
                        serverEnv.STRIPE_PRO_ANNUAL_PRICE_ID,
                     freeTrial: {
                        days: 14,
                     },
                     name: PlanName.PRO,
                     priceId: serverEnv.STRIPE_PRO_PRICE_ID,
                  },
               ],
            },
         }),
         localization({
            defaultLocale: "pt-BR", // Use built-in Portuguese translations
            fallbackLocale: "default", // Fallback to English,
            getLocale: async (request) => {
               try {
                  const userLocale = request?.headers.get(
                     "x-user-locale",
                  ) as BuiltInLocales;

                  return userLocale || "pt-BR";
               } catch (error) {
                  console.warn("Error detecting locale:", error);
                  return "default"; // Safe fallback
               }
            },
         }),
         admin(),
         anonymous({
            emailDomainName: "anon.contentta.com",
            onLinkAccount: async ({ anonymousUser, newUser }) => {
               console.log(
                  `Anonymous user ${anonymousUser.user.id} linked to ${newUser.user.id}`,
               );
            },
         }),
         magicLink({
            expiresIn: 60 * 15, // 15 minutes
            async sendMagicLink({ email, url }) {
               await sendMagicLinkEmail(resendClient, {
                  email,
                  magicLinkUrl: url,
               });
            },
         }),
         emailOTP({
            expiresIn: 60 * 10,
            otpLength: 6,
            sendVerificationOnSignUp: true,
            async sendVerificationOTP({
               email,
               otp,
               type,
            }: SendEmailOTPOptions) {
               await sendEmailOTP(resendClient, { email, otp, type });
            },
         }),
         openAPI(),
         lastLoginMethod(),
         organization({
            organizationLimit: ORGANIZATION_LIMIT,
            schema: {
               organization: {
                  additionalFields: {
                     context: {
                        defaultValue: "personal",
                        input: true,
                        required: false,
                        type: "string",
                     },
                     description: {
                        defaultValue: "",
                        input: true,
                        required: false,
                        type: "string",
                     },
                     onboardingCompleted: {
                        defaultValue: false,
                        input: true,
                        required: false,
                        type: "boolean",
                     },
                  },
               },
               team: {
                  additionalFields: {
                     description: {
                        defaultValue: "",
                        input: true,
                        required: false,
                        type: "string",
                     },
                  },
               },
            },
            async sendInvitationEmail(data) {
               const inviteLink = `${getDomain()}/callback/organization/invitation/${data.id}`;
               await sendOrganizationInvitation(resendClient, {
                  email: data.email,
                  invitedByEmail: data.inviter.user.email,
                  invitedByUsername: data.inviter.user.name,
                  inviteLink,
                  teamName: data.organization.name,
               });
            },
            teams: {
               allowRemovingAllTeams: false,
               enabled: true,
               maximumMembersPerTeam: 50,
               maximumTeams: 10,
            },
         }),
         twoFactor({
            issuer: "Contentta",
            skipVerificationOnEnable: false,
            totpOptions: {
               digits: 6,
               period: 30,
            },
            backupCodeOptions: {
               amount: 10,
               length: 10,
            },
         }),
         apiKey({
            enableSessionForAPIKeys: true,
            defaultPrefix: "contentta",
            rateLimit: {
               enabled: true,
               timeWindow: 60,
               maxRequests: 500,
            },
         }),
      ],

      secret: serverEnv.BETTER_AUTH_SECRET,
      session: {
         storeSessionInDatabase: true,
         cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
         },
      },
      socialProviders: {
         google: {
            clientId: serverEnv.BETTER_AUTH_GOOGLE_CLIENT_ID as string,
            clientSecret: serverEnv.BETTER_AUTH_GOOGLE_CLIENT_SECRET as string,
            prompt: "select_account" as const,
         },
      },
      trustedOrigins: serverEnv.BETTER_AUTH_TRUSTED_ORIGINS.split(","),
      user: {
         changeEmail: {
            enabled: true,
         },
         additionalFields: {
            telemetryConsent: {
               defaultValue: true,
               input: true,
               required: true,
               type: "boolean",
            },
            deletionScheduledAt: {
               defaultValue: null,
               input: true,
               required: false,
               type: "date",
            },
            deletionType: {
               defaultValue: null,
               input: true,
               required: false,
               type: "string",
            },
            // E2E Encryption fields
            encryptionEnabled: {
               defaultValue: false,
               input: true,
               required: false,
               type: "boolean",
            },
            encryptionSalt: {
               defaultValue: null,
               input: true,
               required: false,
               type: "string",
            },
            encryptionKeyHash: {
               defaultValue: null,
               input: true,
               required: false,
               type: "string",
            },
         },
      },
   }) satisfies BetterAuthOptions;

export const createAuth = (options: AuthOptions) => {
   const authOptions = getAuthOptions(
      options.db,
      options.resendClient,
      options.stripeClient,
      options.STRIPE_WEBHOOK_SECRET,
   );
   return betterAuth(authOptions);
};

export type AuthInstance = ReturnType<typeof createAuth>;

import type { DatabaseInstance } from "@packages/database/client";
import {
   sendEmailOTP,
   sendOrganizationInvitation,
   type ResendClient,
   type SendEmailOTPOptions,
} from "@packages/transactional/client";
import { serverEnv } from "@packages/environment/server";
import type { PaymentClient } from "@packages/payment/client";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import {
   emailOTP,
   openAPI,
   admin,
   organization,
   apiKey,
} from "better-auth/plugins";
import { getDomain, isProduction } from "@packages/environment/helpers";
import { POLAR_PLANS, POLAR_PLAN_SLUGS } from "@packages/payment/plans";
import { polar, portal, checkout, usage } from "@polar-sh/better-auth";
import { findMemberByUserId } from "@packages/database/repositories/auth-repository";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getCustomerState } from "@packages/payment/ingestion";
export interface AuthOptions {
   db: DatabaseInstance;
   polarClient: PaymentClient;
   resendClient: ResendClient;
}

export interface AuthPluginOptions {
   polar: ReturnType<typeof polar>;
   emailOTP: ReturnType<typeof emailOTP>;
   openAPI: ReturnType<typeof openAPI>;
   organization: ReturnType<typeof organization>;
   apiKey: ReturnType<typeof apiKey>;
}
export const getAuthOptions = (
   db: DatabaseInstance,
   resendClient: ResendClient,
   polarClient: PaymentClient,
) =>
   ({
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
      },
      plugins: [
         admin(),
         polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
               portal(),
               checkout({
                  successUrl: `${getDomain()}/profile`,
                  authenticatedUsersOnly: true,
                  products: [
                     POLAR_PLANS[POLAR_PLAN_SLUGS.BASIC],
                     POLAR_PLANS[POLAR_PLAN_SLUGS.HOBBY],
                  ],
               }),
               usage(),
            ],
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
         organization({
            organizationLimit: 1,
            teams: {
               enabled: true,
               maximumTeams: 10,
               maximumMembersPerTeam: 50,
               allowRemovingAllTeams: false,
            },
            allowUserToCreateOrganization: async (user) => {
               const state = await getCustomerState(polarClient, user.id);
               return state?.activeSubscriptions.length > 0;
            },
            async sendInvitationEmail(data) {
               const inviteLink = `${getDomain()}/callback/organization/invitation/${data.id}`;
               await sendOrganizationInvitation(resendClient, {
                  email: data.email,
                  invitedByUsername: data.inviter.user.name,
                  invitedByEmail: data.inviter.user.email,
                  teamName: data.organization.name,
                  inviteLink,
               });
            },
         }),
         apiKey({
            rateLimit: {
               enabled: true,
               timeWindow: 1000 * 60 * 60, // 1 hour
               maxRequests: 500, // 500 requests per hour
            },
            enableSessionForAPIKeys: true,
            enableMetadata: true,
            apiKeyHeaders: "sdk-api-key",
         }),
      ],
      socialProviders: {
         google: {
            prompt: "select_account" as const,
            clientId: serverEnv.BETTER_AUTH_GOOGLE_CLIENT_ID as string,
            clientSecret: serverEnv.BETTER_AUTH_GOOGLE_CLIENT_SECRET as string,
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

      secret: serverEnv.BETTER_AUTH_SECRET,
      trustedOrigins: serverEnv.BETTER_AUTH_TRUSTED_ORIGINS.split(","),
      advanced: {
         crossSubDomainCookies: {
            enabled: isProduction,
            domain: ".contentagen.com",
         },
      },
      session: {
         cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
         },
      },
   }) satisfies BetterAuthOptions;

export const createAuth = (options: AuthOptions) => {
   const authOptions = getAuthOptions(
      options.db,
      options.resendClient,
      options.polarClient,
   );
   return betterAuth(authOptions);
};
export type AuthInstance = ReturnType<typeof createAuth>;

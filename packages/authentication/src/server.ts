import type { DatabaseInstance } from "@packages/database/client";
import { findMemberByUserId } from "@packages/database/repositories/auth-repository";
import { getDomain, isProduction } from "@packages/environment/helpers";
import { serverEnv } from "@packages/environment/server";
import type { PaymentClient } from "@packages/payment/client";
import { getCustomerState } from "@packages/payment/ingestion";
import { POLAR_PLAN_SLUGS, POLAR_PLANS } from "@packages/payment/plans";
import {
   type ResendClient,
   type SendEmailOTPOptions,
   sendEmailOTP,
   sendOrganizationInvitation,
} from "@packages/transactional/client";
import { checkout, polar, portal, usage } from "@polar-sh/better-auth";
import { type BetterAuthOptions, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
   admin,
   apiKey,
   emailOTP,
   openAPI,
   organization,
} from "better-auth/plugins";
export interface AuthOptions {
   db: DatabaseInstance;
   polarClient: PaymentClient;
   resendClient: ResendClient;
}

export const getAuthOptions = (
   db: DatabaseInstance,
   resendClient: ResendClient,
   polarClient: PaymentClient,
) =>
   ({
      advanced: {
         crossSubDomainCookies: {
            domain: ".contentagen.com",
            enabled: isProduction,
         },
      },
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
      emailAndPassword: {
         enabled: true,
         requireEmailVerification: true,
      },
      emailVerification: {
         autoSignInAfterVerification: true,
         sendOnSignUp: true,
      },
      plugins: [
         admin(),
         polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
               portal(),
               checkout({
                  authenticatedUsersOnly: true,
                  products: [
                     POLAR_PLANS[POLAR_PLAN_SLUGS.BASIC],
                     POLAR_PLANS[POLAR_PLAN_SLUGS.HOBBY],
                  ],
                  successUrl: `${getDomain()}/profile`,
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
            allowUserToCreateOrganization: async (user) => {
               const state = await getCustomerState(polarClient, user.id);
               return state?.activeSubscriptions.length > 0;
            },
            organizationLimit: 1,
            schema: {
               organization: {
                  additionalFields: {
                     description: {
                        defaultValue: "",
                        input: true,
                        required: false,
                        type: "string",
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
         apiKey({
            apiKeyHeaders: "sdk-api-key",
            enableMetadata: true,
            enableSessionForAPIKeys: true,
            rateLimit: {
               enabled: true,
               maxRequests: 500, // 500 requests per hour
               timeWindow: 1000 * 60 * 60, // 1 hour
            },
         }),
      ],

      secret: serverEnv.BETTER_AUTH_SECRET,
      session: {
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

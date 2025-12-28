import { wrapAuthHandler } from "@packages/arcjet/auth-wrapper";
import { createAuth } from "@packages/authentication/server";
import { serverEnv as env } from "@packages/environment/server";
import { getStripeClient } from "@packages/stripe";
import { getResendClient } from "@packages/transactional/client";
import { db } from "./database";

export const resendClient = getResendClient(env.RESEND_API_KEY);
export const stripeClient = getStripeClient(env.STRIPE_SECRET_KEY);

const authInstance = createAuth({
   db,
   resendClient,
   STRIPE_WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET,
   stripeClient,
});

const protectedHandler = await wrapAuthHandler(authInstance);

export const auth = {
   ...authInstance,
   handler: protectedHandler,
};

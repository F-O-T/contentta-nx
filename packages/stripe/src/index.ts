import type { ServerEnv } from "@packages/environment/server";
import Stripe from "stripe";

export const getStripeClient = (
   STRIPE_SECRET_KEY: ServerEnv["STRIPE_SECRET_KEY"],
): Stripe => {
   return new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2025-12-15.clover", // Latest API version as of Stripe SDK v20.0.0
   });
};

export type StripeClient = ReturnType<typeof getStripeClient>;

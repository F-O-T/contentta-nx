import { betterAuth } from "better-auth";
import { createDb } from "../../database/src/client";
import { serverEnv } from "../../environment/src/server";
import { getStripeClient } from "../../stripe/src/index";
import { getResendClient } from "../../transactional/src/client";
import { getAuthOptions } from "./server";
/**
 * @internal
 *
 * This export is needed strictly for the CLI to work with
 *     pnpm auth:schema:generate
 *
 * It should not be imported or used for any other purpose.
 *
 * The documentation for better-auth CLI can be found here:
 * - https://www.better-auth.com/docs/concepts/cli
 */
export const auth = betterAuth({
   ...getAuthOptions(
      createDb(),
      getResendClient(serverEnv.RESEND_API_KEY),
      getStripeClient(serverEnv.STRIPE_SECRET_KEY),
      serverEnv.STRIPE_WEBHOOK_SECRET,
   ),
}) as ReturnType<typeof betterAuth>;

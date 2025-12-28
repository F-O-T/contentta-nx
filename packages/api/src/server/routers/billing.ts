import { APIError } from "@packages/utils/errors";
import type Stripe from "stripe";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

export const billingRouter = router({
   getInvoices: protectedProcedure
      .input(
         z
            .object({
               limit: z.number().min(1).max(100).optional().default(10),
            })
            .optional(),
      )
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         if (!resolvedCtx.stripeClient) {
            throw APIError.internal("Stripe client not configured");
         }

         // Get the user's stripe customer ID from Better Auth
         const user = await resolvedCtx.auth.api.getSession({
            headers: resolvedCtx.headers,
         });

         if (!user?.user?.id) {
            throw APIError.unauthorized("User not found");
         }

         // Get the stripe customer ID from the user table
         const userRecord = await resolvedCtx.db.query.user.findFirst({
            where: (users, { eq }) => eq(users.id, user.user.id),
         });

         if (!userRecord?.stripeCustomerId) {
            // Return empty array if user has no Stripe customer
            return [];
         }

         try {
            const invoices = await resolvedCtx.stripeClient.invoices.list({
               customer: userRecord.stripeCustomerId,
               limit: input?.limit ?? 10,
            });

            return invoices.data.map((invoice: Stripe.Invoice) => ({
               id: invoice.id,
               number: invoice.number,
               amountPaid: invoice.amount_paid,
               amountDue: invoice.amount_due,
               currency: invoice.currency,
               status: invoice.status,
               created: invoice.created,
               periodStart: invoice.period_start,
               periodEnd: invoice.period_end,
               invoicePdf: invoice.invoice_pdf ?? null,
               hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
               paymentMethod: null as {
                  brand: string | undefined;
                  last4: string | undefined;
               } | null,
            }));
         } catch (error) {
            console.error("Failed to fetch invoices:", error);
            throw APIError.internal("Failed to fetch invoices");
         }
      }),

   getUpcomingInvoice: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;

      if (!resolvedCtx.stripeClient) {
         throw APIError.internal("Stripe client not configured");
      }

      const user = await resolvedCtx.auth.api.getSession({
         headers: resolvedCtx.headers,
      });

      if (!user?.user?.id) {
         throw APIError.unauthorized("User not found");
      }

      const userRecord = await resolvedCtx.db.query.user.findFirst({
         where: (users, { eq }) => eq(users.id, user.user.id),
      });

      if (!userRecord?.stripeCustomerId) {
         return null;
      }

      try {
         const upcoming = await resolvedCtx.stripeClient.invoices.createPreview(
            {
               customer: userRecord.stripeCustomerId,
            },
         );

         return {
            amountDue: upcoming.amount_due,
            currency: upcoming.currency,
            periodStart: upcoming.period_start,
            periodEnd: upcoming.period_end,
            nextPaymentAttempt: upcoming.next_payment_attempt,
            lines: upcoming.lines.data.map((line: Stripe.InvoiceLineItem) => ({
               description: line.description,
               amount: line.amount,
               quantity: line.quantity,
            })),
         };
      } catch (error) {
         // If no upcoming invoice exists (e.g., canceled subscription), return null
         console.error("Failed to fetch upcoming invoice:", error);
         return null;
      }
   }),
});

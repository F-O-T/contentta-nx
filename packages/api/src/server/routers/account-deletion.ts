import { deleteAllUserData } from "@packages/database/repositories/user-deletion-repository";
import { accountDeletionRequest } from "@packages/database/schema";
import { sendDeletionScheduledEmail } from "@packages/transactional/client";
import { APIError } from "@packages/utils/errors";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const RequestDeletionInput = z.object({
   type: z.enum(["immediate", "grace_period"]),
   password: z.string(),
   reason: z.string().optional(),
});

export const accountDeletionRouter = router({
   /**
    * Get deletion status for current user
    */
   getDeletionStatus: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user?.id;

      if (!userId) {
         throw APIError.notFound("User not found");
      }

      const deletionRequest =
         await resolvedCtx.db.query.accountDeletionRequest.findFirst({
            where: (req, { and, eq }) =>
               and(eq(req.userId, userId), eq(req.status, "pending")),
         });

      return deletionRequest;
   }),

   /**
    * Request account deletion
    * Supports both immediate and grace period (30 days) deletion
    */
   requestDeletion: protectedProcedure
      .input(RequestDeletionInput)
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user?.id;
         const userEmail = resolvedCtx.session?.user?.email;

         if (!userId || !userEmail) {
            throw APIError.notFound("User not found");
         }

         // Verify password first
         try {
            await resolvedCtx.auth.api.signInEmail({
               body: {
                  email: userEmail,
                  password: input.password,
               },
            });
         } catch {
            throw APIError.unauthorized("Invalid password");
         }

         if (input.type === "immediate") {
            // Get user's Stripe customer ID from database
            const userRecord = await resolvedCtx.db.query.user.findFirst({
               where: (users, { eq }) => eq(users.id, userId),
            });

            // Cancel any active Stripe subscriptions before deleting
            if (resolvedCtx.stripeClient && userRecord?.stripeCustomerId) {
               try {
                  const subscriptions =
                     await resolvedCtx.stripeClient.subscriptions.list({
                        customer: userRecord.stripeCustomerId,
                        status: "active",
                     });

                  for (const subscription of subscriptions.data) {
                     await resolvedCtx.stripeClient.subscriptions.cancel(
                        subscription.id,
                        {
                           invoice_now: false,
                           prorate: false,
                        },
                     );
                  }
               } catch (error) {
                  console.error(
                     "Failed to cancel Stripe subscriptions:",
                     error,
                  );
                  // Continue with deletion even if Stripe fails
               }
            }

            // Delete all user data immediately (across all organizations)
            await deleteAllUserData(resolvedCtx.db, userId);

            // Delete user account via Better Auth (this will cascade delete sessions, accounts, etc.)
            await resolvedCtx.auth.api.deleteUser({
               headers: resolvedCtx.headers,
               body: {},
            });

            // Create deletion audit record AFTER user is deleted
            // No FK constraint so this record survives and serves as audit trail
            await resolvedCtx.db.insert(accountDeletionRequest).values({
               userId,
               userEmail,
               type: "immediate",
               reason: input.reason,
               requestedAt: new Date(),
               completedAt: new Date(),
               status: "completed",
            });

            return { success: true, type: "immediate" };
         } else {
            // Grace period deletion - schedule for 30 days from now
            const scheduledDate = new Date();
            scheduledDate.setDate(scheduledDate.getDate() + 30);

            await resolvedCtx.db.insert(accountDeletionRequest).values({
               userId,
               userEmail,
               type: "grace_period",
               reason: input.reason,
               requestedAt: new Date(),
               scheduledDeletionAt: scheduledDate,
               status: "pending",
            });

            // Send confirmation email
            if (resolvedCtx.resendClient) {
               const userName = resolvedCtx.session?.user?.name || "Usuário";
               const formattedDate = scheduledDate.toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
               });

               try {
                  await sendDeletionScheduledEmail(resolvedCtx.resendClient, {
                     email: userEmail,
                     userName,
                     scheduledDate: formattedDate,
                     cancelUrl: `${resolvedCtx.request.headers.get("origin") || "https://app.montte.co"}/settings/profile`,
                  });
               } catch (error) {
                  console.error(
                     "Failed to send deletion scheduled email:",
                     error,
                  );
                  // Continue even if email fails - deletion is already scheduled
               }
            }

            return {
               success: true,
               type: "grace_period",
               scheduledDeletionAt: scheduledDate,
            };
         }
      }),

   /**
    * Cancel a scheduled deletion
    */
   cancelDeletion: protectedProcedure.mutation(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user?.id;

      if (!userId) {
         throw APIError.notFound("User not found");
      }

      const deletionRequest =
         await resolvedCtx.db.query.accountDeletionRequest.findFirst({
            where: (req, { and, eq }) =>
               and(eq(req.userId, userId), eq(req.status, "pending")),
         });

      if (!deletionRequest) {
         throw APIError.notFound("No pending deletion request found");
      }

      if (deletionRequest.type === "immediate") {
         throw APIError.validation("Cannot cancel immediate deletion");
      }

      await resolvedCtx.db
         .update(accountDeletionRequest)
         .set({
            status: "cancelled",
            cancelledAt: new Date(),
         })
         .where(eq(accountDeletionRequest.id, deletionRequest.id));

      return { success: true };
   }),
});

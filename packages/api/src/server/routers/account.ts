import {
   deleteFile,
   generatePresignedPutUrl,
   streamFileForProxy,
   verifyFileExists,
} from "@packages/files/client";
import { APIError } from "@packages/utils/errors";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const ALLOWED_AVATAR_TYPES = [
   "image/jpeg",
   "image/png",
   "image/webp",
   "image/avif",
];
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

const RequestAvatarUploadUrlInput = z.object({
   contentType: z.string().refine((val) => ALLOWED_AVATAR_TYPES.includes(val), {
      message: "File type must be JPEG, PNG, WebP, or AVIF",
   }),
   fileName: z.string(),
   fileSize: z.number().max(MAX_AVATAR_SIZE, "File size must be less than 5MB"),
});

const ConfirmAvatarUploadInput = z.object({
   storageKey: z.string(),
});

const CancelAvatarUploadInput = z.object({
   storageKey: z.string(),
});

export const accountRouter = router({
   /**
    * Verify user's current password
    * Uses Better Auth's signInCredential internally to validate
    */
   verifyPassword: protectedProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         const user = resolvedCtx.session?.user;

         if (!user?.email) {
            throw APIError.notFound("User not found");
         }

         try {
            // Use Better Auth's signInEmail to verify credentials
            // This validates the password against the stored hash
            await resolvedCtx.auth.api.signInEmail({
               body: {
                  email: user.email,
                  password: input.password,
               },
            });

            // If we get here without throwing, password is valid
            return { valid: true };
         } catch {
            // Password is incorrect
            return { valid: false };
         }
      }),

   /**
    * Check if user has a credential account (has password set)
    */
   hasPassword: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user?.id;

      if (!userId) {
         throw APIError.notFound("User not found");
      }

      const credentialAccount = await resolvedCtx.db.query.account.findFirst({
         where: (account, { and, eq }) =>
            and(
               eq(account.userId, userId),
               eq(account.providerId, "credential"),
            ),
      });

      return { hasPassword: !!credentialAccount };
   }),

   /**
    * Set password for OAuth users (converts to credential+OAuth hybrid account)
    */
   setPassword: protectedProcedure
      .input(z.object({ newPassword: z.string().min(8) }))
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         await resolvedCtx.auth.api.setPassword({
            body: { newPassword: input.newPassword },
            headers: resolvedCtx.headers,
         });

         return { success: true };
      }),

   /**
    * Get all linked accounts for current user
    */
   getLinkedAccounts: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user?.id;

      if (!userId) {
         throw APIError.notFound("User not found");
      }

      const accounts = await resolvedCtx.db.query.account.findMany({
         where: (account, { eq }) => eq(account.userId, userId),
         columns: {
            id: true,
            providerId: true,
            accountId: true,
            createdAt: true,
         },
      });

      return accounts;
   }),

   /**
    * Export all user data as JSON
    * Includes: profile, agents, brands, content, and notification preferences
    */
   exportUserData: protectedProcedure.mutation(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const userId = resolvedCtx.session?.user?.id;
      const organizationId = resolvedCtx.session?.session?.activeOrganizationId;

      if (!userId || !organizationId) {
         throw APIError.notFound("User or organization not found");
      }

      const db = resolvedCtx.db;

      // Fetch all user data in parallel
      const [userProfile, agents, brands, content, notificationPreferences] =
         await Promise.all([
            // User profile
            db.query.user.findFirst({
               where: (user, { eq }) => eq(user.id, userId),
               columns: {
                  id: true,
                  name: true,
                  email: true,
                  emailVerified: true,
                  image: true,
                  createdAt: true,
                  updatedAt: true,
               },
            }),

            // Agents
            db.query.agent.findMany({
               where: (agent, { eq }) =>
                  eq(agent.organizationId, organizationId),
            }),

            // Brands
            db.query.brand.findMany({
               where: (brand, { eq }) =>
                  eq(brand.organizationId, organizationId),
            }),

            // Content (via agents)
            (async () => {
               const orgAgents = await db.query.agent.findMany({
                  where: (agent, { eq }) =>
                     eq(agent.organizationId, organizationId),
               });
               const agentIds = orgAgents.map((a) => a.id);
               if (agentIds.length === 0) return [];
               return db.query.content.findMany({
                  where: (content, { inArray }) =>
                     inArray(content.agentId, agentIds),
               });
            })(),

            // Notification preferences
            db.query.notificationPreference.findFirst({
               where: (prefs, { eq }) => eq(prefs.userId, userId),
            }),
         ]);

      return {
         exportedAt: new Date().toISOString(),
         version: "1.0",
         user: userProfile,
         data: {
            agents,
            brands,
            content,
            notificationPreferences,
         },
      };
   }),

   /**
    * Get user avatar as base64
    */
   getAvatar: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const user = resolvedCtx.session?.user;

      if (!user?.image) {
         return null;
      }

      // If image is already a full URL (external), return it as-is
      if (user.image.startsWith("http")) {
         return { url: user.image };
      }

      // Otherwise, it's a storage key - fetch from MinIO
      const bucketName = resolvedCtx.minioBucket;
      const key = user.image;

      try {
         const { buffer, contentType } = await streamFileForProxy(
            key,
            bucketName,
            resolvedCtx.minioClient,
         );
         const base64 = buffer.toString("base64");
         return {
            contentType,
            data: `data:${contentType};base64,${base64}`,
         };
      } catch (error) {
         console.error("Error fetching user avatar:", error);
         return null;
      }
   }),

   /**
    * Request presigned URL for avatar upload
    */
   requestAvatarUploadUrl: protectedProcedure
      .input(RequestAvatarUploadUrlInput)
      .mutation(async ({ ctx, input }) => {
         const { fileName, contentType, fileSize } = input;
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user?.id;

         if (!userId) {
            throw APIError.notFound("User not found");
         }

         const timestamp = Date.now();
         const storageKey = `users/${userId}/avatar/${timestamp}-${fileName}`;
         const bucketName = resolvedCtx.minioBucket;
         const minioClient = resolvedCtx.minioClient;

         const presignedUrl = await generatePresignedPutUrl(
            storageKey,
            bucketName,
            minioClient,
            300, // 5 minutes
         );

         return { presignedUrl, storageKey, contentType, fileSize };
      }),

   /**
    * Confirm avatar upload and update user profile
    */
   confirmAvatarUpload: protectedProcedure
      .input(ConfirmAvatarUploadInput)
      .mutation(async ({ ctx, input }) => {
         const { storageKey } = input;
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user?.id;
         const currentImage = resolvedCtx.session?.user?.image;

         if (!userId) {
            throw APIError.notFound("User not found");
         }

         // Validate storage key belongs to this user
         if (!storageKey.startsWith(`users/${userId}/avatar/`)) {
            throw APIError.validation("Invalid storage key for this user");
         }

         const bucketName = resolvedCtx.minioBucket;
         const minioClient = resolvedCtx.minioClient;

         // Verify file was uploaded
         const fileInfo = await verifyFileExists(
            storageKey,
            bucketName,
            minioClient,
         );

         if (!fileInfo) {
            throw APIError.validation("File was not uploaded successfully");
         }

         // Delete old avatar if it exists and is a storage key (not external URL)
         if (
            currentImage &&
            !currentImage.startsWith("http") &&
            currentImage !== storageKey
         ) {
            try {
               await deleteFile(currentImage, bucketName, minioClient);
            } catch (error) {
               console.error("Error deleting old avatar:", error);
            }
         }

         // Update user profile with new avatar
         try {
            await resolvedCtx.auth.api.updateUser({
               body: { image: storageKey },
               headers: resolvedCtx.headers,
            });
         } catch (error) {
            console.error("Error updating user avatar:", error);
            // Cleanup the uploaded file
            try {
               await deleteFile(storageKey, bucketName, minioClient);
            } catch (cleanupError) {
               console.error("Error cleaning up uploaded file:", cleanupError);
            }
            throw APIError.internal("Failed to update user avatar");
         }

         return { success: true };
      }),

   /**
    * Cancel avatar upload and cleanup
    */
   cancelAvatarUpload: protectedProcedure
      .input(CancelAvatarUploadInput)
      .mutation(async ({ ctx, input }) => {
         const { storageKey } = input;
         const resolvedCtx = await ctx;
         const userId = resolvedCtx.session?.user?.id;

         if (!userId) {
            throw APIError.notFound("User not found");
         }

         // Validate storage key belongs to this user
         if (!storageKey.startsWith(`users/${userId}/avatar/`)) {
            throw APIError.validation("Invalid storage key for this user");
         }

         const bucketName = resolvedCtx.minioBucket;
         const minioClient = resolvedCtx.minioClient;

         try {
            await deleteFile(storageKey, bucketName, minioClient);
         } catch (error) {
            console.error("Error deleting cancelled upload:", error);
         }

         return { success: true };
      }),
});

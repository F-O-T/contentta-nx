import { ORGANIZATION_LIMIT } from "@packages/authentication/server";
import {
   findOrganizationById,
   updateOrganization,
} from "@packages/database/repositories/auth-repository";
import {
   deleteFile,
   generatePresignedPutUrl,
   streamFileForProxy,
   verifyFileExists,
} from "@packages/files/client";
import { APIError, propagateError } from "@packages/utils/errors";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const ALLOWED_LOGO_TYPES = [
   "image/jpeg",
   "image/png",
   "image/webp",
   "image/avif",
];
const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB

const RequestLogoUploadUrlInput = z.object({
   contentType: z.string().refine((val) => ALLOWED_LOGO_TYPES.includes(val), {
      message: "File type must be JPEG, PNG, WebP, or AVIF",
   }),
   fileName: z.string(),
   fileSize: z.number().max(MAX_LOGO_SIZE, "File size must be less than 5MB"),
});

const ConfirmLogoUploadInput = z.object({
   storageKey: z.string(),
});

const CancelLogoUploadInput = z.object({
   storageKey: z.string(),
});

export const organizationRouter = router({
   // Queries
   getActiveOrganizationMembers: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;

      try {
         const organization = await resolvedCtx.auth.api.getFullOrganization({
            headers: resolvedCtx.headers,
         });

         return organization?.members || [];
      } catch (error) {
         console.error("Failed to get organization members:", error);
         propagateError(error);
         throw APIError.internal("Failed to retrieve organization members");
      }
   }),

   getLogo: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;

      const organization = await resolvedCtx.auth.api.getFullOrganization({
         headers: resolvedCtx.headers,
      });

      if (!organization?.logo) {
         return null;
      }

      const bucketName = resolvedCtx.minioBucket;
      const key = organization.logo;

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
         console.error("Error fetching organization logo:", error);
         return null;
      }
   }),

   getOrganizationLimit: protectedProcedure.query(async () => {
      return ORGANIZATION_LIMIT;
   }),

   getActiveOrganization: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;

      const organization = await resolvedCtx.auth.api.getFullOrganization({
         headers: resolvedCtx.headers,
      });

      const subscriptions = await resolvedCtx.auth.api.listActiveSubscriptions({
         headers: resolvedCtx.headers,
         query: { referenceId: organization?.id },
      });

      const activeSubscription = subscriptions.find(
         (subscription) =>
            subscription.status === "active" ||
            subscription.status === "trialing",
      );

      return {
         organization: organization,
         activeSubscription: activeSubscription ?? null,
      };
   }),

   getOrganizations: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;

      try {
         // First, list all organizations for the user
         const organizations = await resolvedCtx.auth.api.listOrganizations({
            headers: resolvedCtx.headers,
         });

         if (!organizations || organizations.length === 0) {
            return [];
         }

         return organizations;
      } catch (error) {
         console.error("Failed to get organizations:", error);
         propagateError(error);
         throw APIError.internal("Failed to retrieve organizations");
      }
   }),

   getRecentInvites: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.session?.session?.activeOrganizationId;

      if (!organizationId) {
         throw APIError.notFound("No active organization found");
      }

      try {
         const data = await resolvedCtx.auth.api.listInvitations({
            headers: resolvedCtx.headers,
            query: {
               organizationId,
            },
         });

         // Return the most recent 3 invites
         return data.slice(0, 3);
      } catch (error) {
         console.error("Failed to get recent invites:", error);
         propagateError(error);
         throw APIError.internal("Failed to retrieve recent invites");
      }
   }),

   listTeams: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.session?.session?.activeOrganizationId;
      if (!organizationId) {
         throw APIError.notFound("No active organization found");
      }
      try {
         const teams = await resolvedCtx.auth.api.listOrganizationTeams({
            headers: resolvedCtx.headers,
            query: {
               organizationId,
            },
         });

         return teams;
      } catch (error) {
         console.error("Failed to list teams:", error);
         propagateError(error);
         throw APIError.internal("Failed to retrieve teams");
      }
   }),

   listTeamsByOrganizationId: protectedProcedure
      .input(z.object({ organizationId: z.string() }))
      .query(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;
         try {
            const teams = await resolvedCtx.auth.api.listOrganizationTeams({
               headers: resolvedCtx.headers,
               query: {
                  organizationId: input.organizationId,
               },
            });

            return teams;
         } catch (error) {
            console.error("Failed to list teams:", error);
            propagateError(error);
            throw APIError.internal("Failed to retrieve teams");
         }
      }),

   // Logo upload mutations (require server-side MinIO access)
   uploadLogo: protectedProcedure
      .input(RequestLogoUploadUrlInput)
      .mutation(async ({ ctx, input }) => {
         const { fileName, contentType, fileSize } = input;
         const resolvedCtx = await ctx;

         const organization = await resolvedCtx.auth.api.getFullOrganization({
            headers: resolvedCtx.headers,
         });

         if (!organization?.id) {
            throw APIError.notFound("No active organization found");
         }

         const organizationId = organization.id;
         const timestamp = Date.now();
         const storageKey = `organizations/${organizationId}/logo/${timestamp}-${fileName}`;
         const bucketName = resolvedCtx.minioBucket;
         const minioClient = resolvedCtx.minioClient;

         const presignedUrl = await generatePresignedPutUrl(
            storageKey,
            bucketName,
            minioClient,
            300,
         );

         return { presignedUrl, storageKey, contentType, fileSize };
      }),

   confirmLogoUpload: protectedProcedure
      .input(ConfirmLogoUploadInput)
      .mutation(async ({ ctx, input }) => {
         const { storageKey } = input;
         const resolvedCtx = await ctx;

         const organization = await resolvedCtx.auth.api.getFullOrganization({
            headers: resolvedCtx.headers,
         });

         if (!organization?.id) {
            throw APIError.notFound("No active organization found");
         }

         const organizationId = organization.id;
         const bucketName = resolvedCtx.minioBucket;
         const minioClient = resolvedCtx.minioClient;
         const db = resolvedCtx.db;

         if (!storageKey.startsWith(`organizations/${organizationId}/logo/`)) {
            throw APIError.validation(
               "Invalid storage key for this organization",
            );
         }

         const fileInfo = await verifyFileExists(
            storageKey,
            bucketName,
            minioClient,
         );

         if (!fileInfo) {
            throw APIError.validation("File was not uploaded successfully");
         }

         const currentOrganization = await findOrganizationById(
            db,
            organizationId,
         );

         if (
            currentOrganization?.logo &&
            currentOrganization.logo !== storageKey
         ) {
            try {
               await deleteFile(
                  currentOrganization.logo,
                  bucketName,
                  minioClient,
               );
            } catch (error) {
               console.error("Error deleting old organization logo:", error);
            }
         }

         try {
            await updateOrganization(db, organizationId, { logo: storageKey });
         } catch (error) {
            console.error("Error updating organization logo:", error);
            try {
               await deleteFile(storageKey, bucketName, minioClient);
            } catch (cleanupError) {
               console.error("Error cleaning up uploaded file:", cleanupError);
            }
            throw APIError.internal("Failed to update organization logo");
         }

         return { success: true };
      }),

   cancelLogoUpload: protectedProcedure
      .input(CancelLogoUploadInput)
      .mutation(async ({ ctx, input }) => {
         const { storageKey } = input;
         const resolvedCtx = await ctx;

         const organization = await resolvedCtx.auth.api.getFullOrganization({
            headers: resolvedCtx.headers,
         });

         if (!organization?.id) {
            throw APIError.notFound("No active organization found");
         }

         const organizationId = organization.id;

         if (!storageKey.startsWith(`organizations/${organizationId}/logo/`)) {
            throw APIError.validation(
               "Invalid storage key for this organization",
            );
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

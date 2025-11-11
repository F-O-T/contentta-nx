import { getTotalAgents } from "@packages/database/repositories/agent-repository";
import {
   findOrganizationById,
   updateOrganization,
} from "@packages/database/repositories/auth-repository";
import { streamFileForProxy, uploadFile } from "@packages/files/client";
import { compressImage } from "@packages/files/image-helper";
import { APIError, propagateError } from "@packages/utils/errors";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const OrganizationLogoUploadInput = z.object({
   contentType: z.string(),
   fileBuffer: z.base64(), // base64 encoded
   fileName: z.string(),
});

export const organizationRouter = router({
   createOrganization: protectedProcedure
      .input(
         z.object({
            name: z.string().min(1, "Organization name is required"),
            slug: z.string().min(1, "Organization slug is required"),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         try {
            const organization = await resolvedCtx.auth.api.createOrganization({
               body: {
                  name: input.name,
                  slug: input.slug,
               },
               headers: resolvedCtx.headers,
            });

            return organization;
         } catch (error) {
            console.error("Failed to create organization:", error);
            propagateError(error);
            throw APIError.internal("Failed to create organization");
         }
      }),

   deleteOrganization: protectedProcedure.mutation(async ({ ctx }) => {
      const resolvedCtx = await ctx;

      // Get current organization info
      const organization = await resolvedCtx.auth.api.getFullOrganization({
         headers: resolvedCtx.headers,
      });

      if (!organization?.id) {
         throw new Error("No active organization found");
      }

      const organizationId = organization.id;

      try {
         await resolvedCtx.auth.api.deleteOrganization({
            body: { organizationId },
            headers: resolvedCtx.headers,
         });

         return { success: true };
      } catch (error) {
         console.error("Failed to delete organization:", error);
         propagateError(error);
         throw APIError.internal("Failed to delete organization");
      }
   }),
   editOrganization: protectedProcedure
      .input(
         z.object({
            description: z.string().optional(),
            name: z.string().min(1, "Organization name is required"),
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         try {
            const updatedOrganization =
               await resolvedCtx.auth.api.updateOrganization({
                  body: {
                     data: {
                        description: input.description,
                        name: input.name,
                     },
                  },
                  headers: resolvedCtx.headers,
               });

            return updatedOrganization;
         } catch (error) {
            console.error("Failed to edit organization:", error);
            propagateError(error);
            throw APIError.internal("Failed to edit organization");
         }
      }),

   getActiveOrganization: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organization = await resolvedCtx.auth.api.getFullOrganization({
         headers: resolvedCtx.headers,
      });
      return organization;
   }),

   getActiveOrganizationAuthors: protectedProcedure.query(async ({ ctx }) => {
      const resolvedCtx = await ctx;
      const organizationId = resolvedCtx.session?.session?.activeOrganizationId;
      const db = resolvedCtx.db;
      if (!organizationId) {
         throw new Error("No active organization found");
      }

      try {
         // Get total agents for organization
         const totalAgents = await getTotalAgents(db, {
            organizationId,
         });

         return totalAgents;
      } catch (error) {
         console.error("Failed to get organization overview stats:", error);
         throw new Error("Failed to retrieve organization statistics");
      }
   }),
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

         // Get the active organization ID
         const activeOrganizationId =
            resolvedCtx.session?.session?.activeOrganizationId;

         // Filter out the active organization from the list
         const otherOrganizations = organizations.filter(
            (org) => org.id !== activeOrganizationId,
         );

         return otherOrganizations;
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
         throw new Error("No active organization found");
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
         throw new Error("No active organization found");
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

   setActiveOrganization: protectedProcedure
      .input(
         z.object({
            organizationId: z.string().optional(), // Empty string for personal account
         }),
      )
      .mutation(async ({ ctx, input }) => {
         const resolvedCtx = await ctx;

         try {
            await resolvedCtx.auth.api.setActiveOrganization({
               body: {
                  organizationId: input.organizationId,
               },
               headers: resolvedCtx.headers,
            });

            return { success: true };
         } catch (error) {
            console.error("Failed to set active organization:", error);
            propagateError(error);
            throw APIError.internal("Failed to set active organization");
         }
      }),

   uploadLogo: protectedProcedure
      .input(OrganizationLogoUploadInput)
      .mutation(async ({ ctx, input }) => {
         const { fileName, fileBuffer } = input;
         const resolvedCtx = await ctx;

         // Get current organization info
         const organization = await resolvedCtx.auth.api.getFullOrganization({
            headers: resolvedCtx.headers,
         });

         if (!organization?.id) {
            throw new Error("No active organization found");
         }

         const organizationId = organization.id;
         const db = resolvedCtx.db;

         // Get current organization from database to check for existing logo
         const currentOrganization = await findOrganizationById(
            db,
            organizationId,
         );

         // Delete old logo if it exists
         if (currentOrganization?.logo) {
            try {
               const bucketName = resolvedCtx.minioBucket;
               const minioClient = resolvedCtx.minioClient;
               await minioClient.removeObject(
                  bucketName,
                  currentOrganization.logo,
               );
            } catch (error) {
               console.error("Error deleting old organization logo:", error);
               // Continue with upload even if deletion fails
            }
         }

         const key = `organizations/${organizationId}/logo/${fileName}`;
         const buffer = Buffer.from(fileBuffer, "base64");

         // Compress the image
         const compressedBuffer = await compressImage(buffer, {
            format: "webp",
            quality: 80,
         });

         const bucketName = resolvedCtx.minioBucket;
         const minioClient = resolvedCtx.minioClient;

         // Upload to S3/Minio
         const url = await uploadFile(
            key,
            compressedBuffer,
            "image/webp",
            bucketName,
            minioClient,
         );

         // Update organization logo directly in database
         try {
            await updateOrganization(db, organizationId, { logo: key });
         } catch (error) {
            console.error("Error updating organization logo:", error);
            // If database update fails, try to clean up uploaded file
            try {
               await minioClient.removeObject(bucketName, key);
            } catch (cleanupError) {
               console.error("Error cleaning up uploaded file:", cleanupError);
            }
            throw new Error("Failed to update organization logo");
         }

         return { key, url };
      }),
});

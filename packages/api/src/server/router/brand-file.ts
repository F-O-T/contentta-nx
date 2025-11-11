import {
   getBrandById,
   updateBrand,
} from "@packages/database/repositories/brand-repository";
import { getFile, listFiles } from "@packages/files/client";
import { deleteAllBrandKnowledgeByExternalIdAndType } from "@packages/rag/repositories/brand-knowledge-repository";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const BrandFileDeleteInput = z.object({
   fileName: z.string(),
});

export const brandFileRouter = router({
   delete: protectedProcedure
      .input(z.object({ brandId: z.uuid() }).and(BrandFileDeleteInput))
      .mutation(async ({ ctx, input }) => {
         const { brandId, fileName } = input;
         const key = `${brandId}/${fileName}`;
         const bucketName = (await ctx).minioBucket;
         const resolvedCtx = await ctx;
         await deleteAllBrandKnowledgeByExternalIdAndType(
            resolvedCtx.ragClient,
            brandId,
            "document",
         );
         await deleteAllBrandKnowledgeByExternalIdAndType(
            resolvedCtx.ragClient,
            brandId,
            "feature",
         );

         await resolvedCtx.minioClient.removeObject(bucketName, key);
         const brand = await getBrandById(resolvedCtx.db, brandId);
         const uploadedFiles = (
            Array.isArray(brand.uploadedFiles) ? brand.uploadedFiles : []
         ).filter((f) => f.fileName !== fileName);
         await updateBrand(resolvedCtx.db, brandId, {
            uploadedFiles,
         });
         return { success: true };
      }),

   deleteAllFiles: protectedProcedure
      .input(z.object({ brandId: z.uuid() }))
      .mutation(async ({ ctx, input }) => {
         const { brandId } = input;
         const resolvedCtx = await ctx;

         // Get the brand to check current uploaded files
         const brand = await getBrandById(resolvedCtx.db, brandId);
         const uploadedFiles = Array.isArray(brand.uploadedFiles)
            ? brand.uploadedFiles
            : [];

         if (uploadedFiles.length === 0) {
            return { message: "No files to delete", success: true };
         }

         // Delete files from MinIO bucket
         const bucketName = resolvedCtx.minioBucket;
         const deletePromises = uploadedFiles.map(async (file) => {
            const key = `${brandId}/${file.fileName}`;
            try {
               await resolvedCtx.minioClient.removeObject(bucketName, key);
            } catch (error) {
               console.error(`Failed to delete file ${key}:`, error);
            }
         });

         await Promise.all(deletePromises);

         // Delete from ChromaDB collection
         try {
            await deleteAllBrandKnowledgeByExternalIdAndType(
               resolvedCtx.ragClient,
               brandId,
               "document",
            );
         } catch (error) {
            console.error("Failed to delete from ChromaDB:", error);
         }

         // Update brand's uploadedFiles to empty array
         await updateBrand(resolvedCtx.db, brandId, {
            uploadedFiles: [],
         });

         return {
            message: `Successfully deleted ${uploadedFiles.length} files`,
            success: true,
         };
      }),

   getFileContent: protectedProcedure
      .input(z.object({ brandId: z.uuid(), fileName: z.string() }))
      .query(async ({ ctx, input }) => {
         const minioClient = (await ctx).minioClient;
         const bucketName = (await ctx).minioBucket;
         const key = `${input.brandId}/${input.fileName}`;
         const stream = await getFile(key, bucketName, minioClient);
         const chunks: Buffer[] = [];
         for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
         }
         const content = Buffer.concat(chunks).toString("utf-8");
         return { content };
      }),

   listBrandFiles: protectedProcedure
      .input(z.object({ brandId: z.uuid() }))
      .query(async ({ ctx, input }) => {
         const minioClient = (await ctx).minioClient;
         const bucketName = (await ctx).minioBucket;
         const prefix = `${input.brandId}/`;
         const files = await listFiles(bucketName, prefix, minioClient);
         return { files };
      }),
});

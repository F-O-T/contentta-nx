import type { MinioClient } from "./client";

export async function cleanupOrphanedFiles(
   bucketName: string,
   prefix: string,
   olderThanHours: number,
   minioClient: MinioClient,
   isReferencedInDb: (key: string) => Promise<boolean>,
): Promise<number> {
   const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
   let deletedCount = 0;

   const stream = minioClient.listObjectsV2(bucketName, prefix, true);

   for await (const obj of stream) {
      if (!obj.name || !obj.lastModified) {
         continue;
      }

      if (obj.lastModified > cutoffTime) {
         continue;
      }

      const isReferenced = await isReferencedInDb(obj.name);
      if (!isReferenced) {
         try {
            await minioClient.removeObject(bucketName, obj.name);
            deletedCount++;
         } catch (error) {
            console.error(`Failed to delete orphaned file: ${obj.name}`, error);
         }
      }
   }

   return deletedCount;
}

export interface CleanupResult {
   deletedCount: number;
   errors: string[];
   prefix: string;
}

export async function cleanupAllOrphanedFiles(
   bucketName: string,
   minioClient: MinioClient,
   olderThanHours: number,
   dbCheckers: {
      checkOrganizationLogo: (key: string) => Promise<boolean>;
      checkTransactionAttachment: (key: string) => Promise<boolean>;
      checkBillAttachment: (key: string) => Promise<boolean>;
   },
): Promise<CleanupResult[]> {
   const results: CleanupResult[] = [];

   const prefixes = [
      { prefix: "organizations/", checker: dbCheckers.checkOrganizationLogo },
      {
         prefix: "transactions/",
         checker: dbCheckers.checkTransactionAttachment,
      },
      { prefix: "bills/", checker: dbCheckers.checkBillAttachment },
   ];

   for (const { prefix, checker } of prefixes) {
      const errors: string[] = [];
      let deletedCount = 0;

      try {
         deletedCount = await cleanupOrphanedFiles(
            bucketName,
            prefix,
            olderThanHours,
            minioClient,
            checker,
         );
      } catch (error) {
         errors.push(error instanceof Error ? error.message : String(error));
      }

      results.push({ deletedCount, errors, prefix });
   }

   return results;
}

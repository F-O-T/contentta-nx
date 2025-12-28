import { Client } from "minio";
import { z } from "zod";

export const EnvSchema = z.object({
   DATABASE_URL: z.string(),
   MINIO_ACCESS_KEY: z.string(),
   MINIO_BUCKET: z.string(),
   MINIO_ENDPOINT: z.string(),
   MINIO_SECRET_KEY: z.string(),
});

export function parseEndpoint(endpointUrl: string) {
   const fullUrl = endpointUrl.startsWith("http")
      ? endpointUrl
      : `http://${endpointUrl}`;

   try {
      const url = new URL(fullUrl);
      const useSSL = url.protocol === "https:";
      const port = url.port ? parseInt(url.port, 10) : useSSL ? 443 : 9000;

      return {
         endPoint: url.hostname,
         port,
         useSSL,
      };
   } catch {
      return {
         endPoint: "localhost",
         port: 9000,
         useSSL: false,
      };
   }
}

export interface CleanupResult {
   deletedCount: number;
   errors: string[];
   prefix: string;
}

export async function cleanupOrphanedFiles(
   bucketName: string,
   prefix: string,
   olderThanHours: number,
   minioClient: Client,
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
            console.log(`Deleted orphaned file: ${obj.name}`);
         } catch (error) {
            console.error(`Failed to delete orphaned file: ${obj.name}`, error);
         }
      }
   }

   return deletedCount;
}

export async function runCleanup() {
   const startTime = new Date();
   console.log(
      `[${startTime.toISOString()}] Starting orphaned files cleanup...`,
   );

   const env = EnvSchema.parse(Bun.env);

   const { endPoint, port, useSSL } = parseEndpoint(env.MINIO_ENDPOINT);
   const minioClient = new Client({
      accessKey: env.MINIO_ACCESS_KEY,
      endPoint,
      port,
      secretKey: env.MINIO_SECRET_KEY,
      useSSL,
   });

   const bucketName = env.MINIO_BUCKET;
   const olderThanHours = 24;

   const checkOrganizationLogo = async (key: string): Promise<boolean> => {
      const result = await Bun.sql`
         SELECT 1 FROM organization WHERE logo = ${key} LIMIT 1
      `;
      return result.length > 0;
   };

   const checkTransactionAttachment = async (key: string): Promise<boolean> => {
      const result = await Bun.sql`
         SELECT 1 FROM transaction_attachment WHERE storage_key = ${key} LIMIT 1
      `;
      if (result.length > 0) return true;

      const legacyResult = await Bun.sql`
         SELECT 1 FROM transaction WHERE attachment_key = ${key} LIMIT 1
      `;
      return legacyResult.length > 0;
   };

   const checkBillAttachment = async (key: string): Promise<boolean> => {
      const result = await Bun.sql`
         SELECT 1 FROM bill_attachment WHERE storage_key = ${key} LIMIT 1
      `;
      return result.length > 0;
   };

   const prefixes = [
      { checker: checkOrganizationLogo, prefix: "organizations/" },
      { checker: checkTransactionAttachment, prefix: "transactions/" },
      { checker: checkBillAttachment, prefix: "bills/" },
   ];

   const results: CleanupResult[] = [];

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

   const totalDeleted = results.reduce((sum, r) => sum + r.deletedCount, 0);
   const totalErrors = results.flatMap((r) => r.errors);
   const endTime = new Date();
   const durationMs = endTime.getTime() - startTime.getTime();

   console.log(`
╔════════════════════════════════════════════════════════════════╗
║              ORPHANED FILES CLEANUP COMPLETED                  ║
╠════════════════════════════════════════════════════════════════╣
║  Duration: ${String(durationMs).padEnd(10)}ms                              ║
║  Total Deleted: ${String(totalDeleted).padEnd(10)}                              ║
║  Errors: ${String(totalErrors.length).padEnd(10)}                                   ║
╠════════════════════════════════════════════════════════════════╣
║  Results by prefix:                                            ║
${results.map((r) => `║    ${r.prefix.padEnd(20)} - Deleted: ${String(r.deletedCount).padEnd(5)} Errors: ${r.errors.length}     ║`).join("\n")}
╚════════════════════════════════════════════════════════════════╝
`);

   if (totalErrors.length > 0) {
      console.error("Errors encountered:", totalErrors);
   }

   return { results, totalDeleted, totalErrors, durationMs };
}

if (import.meta.main) {
   runCleanup();
}

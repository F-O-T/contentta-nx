import type { ServerEnv } from "@packages/environment/server";
import { Client } from "minio";

export const parseEndpoint = (endpointUrl: string) => {
   // 1. Ensure the URL has a protocol so the URL constructor works correctly.
   const fullUrl = endpointUrl.startsWith("http")
      ? endpointUrl
      : `http://${endpointUrl}`;

   try {
      const url = new URL(fullUrl);

      // 2. Determine SSL from the protocol
      const useSSL = url.protocol === "https:";

      // 3. Get the port, defaulting based on the protocol if not specified
      const port = url.port ? parseInt(url.port, 10) : useSSL ? 443 : 9000;

      return {
         endPoint: url.hostname,
         port,
         useSSL,
      };
   } catch (error) {
      console.error(`Invalid endpoint URL provided: ${endpointUrl} - ${error}`);
      return {
         endPoint: "localhost",
         port: 9000,
         useSSL: false,
      };
   }
};
export function getMinioClient(
   env: Pick<
      ServerEnv,
      "MINIO_ENDPOINT" | "MINIO_ACCESS_KEY" | "MINIO_SECRET_KEY"
   >,
): Client {
   const { endPoint, port, useSSL } = parseEndpoint(env.MINIO_ENDPOINT);

   const internalClient = new Client({
      accessKey: env.MINIO_ACCESS_KEY,
      endPoint,
      port,
      secretKey: env.MINIO_SECRET_KEY,
      useSSL, // Set to true in production with HTTPS
   });
   return internalClient;
}
export type MinioClient = ReturnType<typeof getMinioClient>;
export async function uploadFile(
   fileName: string,
   fileBuffer: Buffer,
   contentType: string,
   bucketName: string,
   minioClient: MinioClient,
): Promise<string> {
   const bucketExists = await minioClient.bucketExists(bucketName);
   if (!bucketExists) {
      await minioClient.makeBucket(bucketName);
   }
   await minioClient.putObject(
      bucketName,
      fileName,
      fileBuffer,
      fileBuffer.length,
      {
         "Content-Type": contentType,
      },
   );
   // Return the file URL (now using server proxy)
   return fileName;
}

export async function getFile(
   fileName: string,
   bucketName: string,
   minioClient: MinioClient,
): Promise<NodeJS.ReadableStream> {
   // Get file from MinIO
   const stream = await minioClient.getObject(bucketName, fileName);
   return stream;
}

export async function listFiles(
   bucketName: string,
   prefix: string,
   minioClient: MinioClient,
): Promise<string[]> {
   const files: string[] = [];
   const stream = minioClient.listObjectsV2(bucketName, prefix, true);
   for await (const obj of stream) {
      if (obj.name) files.push(obj.name.replace(prefix, ""));
   }
   return files;
}

export async function streamFileForProxy(
   fileName: string,
   bucketName: string,
   minioClient: MinioClient,
): Promise<{ buffer: Buffer; contentType: string }> {
   const stream = await minioClient.getObject(bucketName, fileName);
   const chunks: Buffer[] = [];
   for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
   }
   const buffer = Buffer.concat(chunks);
   let contentType = "image/jpeg";
   try {
      const stat = await minioClient.statObject(bucketName, fileName);
      if (stat.metaData?.["content-type"]) {
         contentType = stat.metaData["content-type"];
      }
   } catch (err) {
      console.error("Error fetching file metadata:", err);
      // fallback to default
   }
   return { buffer, contentType };
}

export async function getFileInfo(
   fileName: string,
   bucketName: string,
   minioClient: MinioClient,
): Promise<{ size: number; contentType: string }> {
   const stat = await minioClient.statObject(bucketName, fileName);
   return { contentType: stat.metaData["content-type"], size: stat.size };
}

export async function generatePresignedPutUrl(
   fileName: string,
   bucketName: string,
   minioClient: MinioClient,
   expirySeconds = 300,
): Promise<string> {
   const bucketExists = await minioClient.bucketExists(bucketName);
   if (!bucketExists) {
      await minioClient.makeBucket(bucketName);
   }
   return minioClient.presignedPutObject(bucketName, fileName, expirySeconds);
}

export async function verifyFileExists(
   fileName: string,
   bucketName: string,
   minioClient: MinioClient,
): Promise<{ exists: boolean; size: number; contentType: string } | null> {
   try {
      const stat = await minioClient.statObject(bucketName, fileName);
      return {
         contentType:
            stat.metaData?.["content-type"] ?? "application/octet-stream",
         exists: true,
         size: stat.size,
      };
   } catch {
      return null;
   }
}

export async function deleteFile(
   fileName: string,
   bucketName: string,
   minioClient: MinioClient,
): Promise<void> {
   await minioClient.removeObject(bucketName, fileName);
}

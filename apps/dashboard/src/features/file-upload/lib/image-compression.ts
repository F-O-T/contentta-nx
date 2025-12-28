export interface CompressImageOptions {
   format?: "jpeg" | "webp" | "png";
   quality?: number;
   maxWidth?: number;
   maxHeight?: number;
}

export async function compressImage(
   file: File,
   options: CompressImageOptions = {},
): Promise<Blob> {
   const {
      format = "webp",
      quality = 0.8,
      maxWidth = 1024,
      maxHeight = 1024,
   } = options;

   const imageBitmap = await createImageBitmap(file);

   let { width, height } = imageBitmap;
   const aspectRatio = width / height;

   if (width > maxWidth) {
      width = maxWidth;
      height = Math.round(width / aspectRatio);
   }

   if (height > maxHeight) {
      height = maxHeight;
      width = Math.round(height * aspectRatio);
   }

   const canvas = document.createElement("canvas");
   canvas.width = width;
   canvas.height = height;

   const ctx = canvas.getContext("2d");
   if (!ctx) {
      throw new Error("Failed to get canvas context");
   }

   ctx.drawImage(imageBitmap, 0, 0, width, height);
   imageBitmap.close();

   const mimeType = `image/${format}`;

   return new Promise((resolve, reject) => {
      canvas.toBlob(
         (blob) => {
            if (blob) {
               resolve(blob);
            } else {
               reject(new Error("Failed to compress image"));
            }
         },
         mimeType,
         quality,
      );
   });
}

export function getCompressedFileName(
   originalName: string,
   format: string,
): string {
   const lastDotIndex = originalName.lastIndexOf(".");
   const baseName =
      lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName;
   return `${baseName}.${format}`;
}

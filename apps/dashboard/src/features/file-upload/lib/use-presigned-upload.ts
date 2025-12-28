import { useCallback, useState } from "react";

export interface UploadProgress {
   loaded: number;
   total: number;
   percentage: number;
}

export interface UsePresignedUploadReturn {
   uploadToPresignedUrl: (
      presignedUrl: string,
      file: File | Blob,
      contentType: string,
   ) => Promise<void>;
   isUploading: boolean;
   progress: UploadProgress | null;
   error: string | null;
   reset: () => void;
}

export function usePresignedUpload(): UsePresignedUploadReturn {
   const [isUploading, setIsUploading] = useState(false);
   const [progress, setProgress] = useState<UploadProgress | null>(null);
   const [error, setError] = useState<string | null>(null);

   const reset = useCallback(() => {
      setIsUploading(false);
      setProgress(null);
      setError(null);
   }, []);

   const uploadToPresignedUrl = useCallback(
      async (
         presignedUrl: string,
         file: File | Blob,
         contentType: string,
      ): Promise<void> => {
         setIsUploading(true);
         setError(null);
         setProgress({ loaded: 0, total: file.size, percentage: 0 });

         try {
            const response = await fetch(presignedUrl, {
               method: "PUT",
               body: file,
               headers: {
                  "Content-Type": contentType,
               },
            });

            if (!response.ok) {
               throw new Error(`Upload failed with status: ${response.status}`);
            }

            setProgress({
               loaded: file.size,
               total: file.size,
               percentage: 100,
            });
         } catch (err) {
            const errorMessage =
               err instanceof Error ? err.message : "Upload failed";
            setError(errorMessage);
            throw err;
         } finally {
            setIsUploading(false);
         }
      },
      [],
   );

   return {
      uploadToPresignedUrl,
      isUploading,
      progress,
      error,
      reset,
   };
}

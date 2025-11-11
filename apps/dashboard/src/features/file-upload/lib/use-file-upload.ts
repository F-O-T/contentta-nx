import { useState } from "react";
import { toast } from "sonner";

interface FileUploadOptions {
   /** Maximum file size in bytes (default: 5MB) */
   maxSize?: number;
   /** Accepted file types (default: all images) */
   acceptedTypes?: string[];
   /** Custom error message for invalid file types */
   typeErrorMessage?: string;
   /** Custom error message for oversized files */
   sizeErrorMessage?: string;
}

interface FileUploadState {
   filePreview: string | undefined;
   selectedFile: File | null;
   isUploading: boolean;
   error: string | null;
}

export const useFileUpload = (options: FileUploadOptions = {}) => {
   const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      acceptedTypes = ["image/*"],
      typeErrorMessage = "Please select a valid file type",
      sizeErrorMessage = `File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`,
   } = options;

   const [state, setState] = useState<FileUploadState>({
      error: null,
      filePreview: undefined,
      isUploading: false,
      selectedFile: null,
   });

   const validateFile = (file: File): string | null => {
      // Check file type
      if (acceptedTypes.length > 0) {
         const isValidType = acceptedTypes.some((type) => {
            if (type.endsWith("/*")) {
               return file.type.startsWith(type.slice(0, -2));
            }
            return file.type === type || file.name.endsWith(type);
         });

         if (!isValidType) {
            return typeErrorMessage;
         }
      }

      // Check file size
      if (file.size > maxSize) {
         return sizeErrorMessage;
      }

      return null;
   };

   const handleFileSelect = (
      files: File[] | null,
      onSuccess?: (file: File) => void,
   ) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      if (!file) return;
      const validationError = validateFile(file);

      if (validationError) {
         toast.error(validationError);
         setState((prev) => ({ ...prev, error: validationError }));
         return;
      }

      // Create preview for images
      if (file.type.startsWith("image/")) {
         const reader = new FileReader();
         reader.onload = (e) => {
            const result = e.target?.result;
            if (typeof result === "string") {
               setState((prev) => ({
                  ...prev,
                  error: null,
                  filePreview: result,
                  selectedFile: file,
               }));
               onSuccess?.(file);
            }
         };
         reader.readAsDataURL(file);
      } else {
         setState((prev) => ({
            ...prev,
            error: null,
            selectedFile: file,
         }));
         onSuccess?.(file);
      }
   };

   const clearFile = () => {
      setState({
         error: null,
         filePreview: undefined,
         isUploading: false,
         selectedFile: null,
      });
   };

   const setUploading = (isUploading: boolean) => {
      setState((prev) => ({ ...prev, isUploading }));
   };

   const setError = (error: string | null) => {
      setState((prev) => ({ ...prev, error }));
   };

   const convertToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
         const reader = new FileReader();
         reader.onload = () => {
            const result = reader.result as string;
            const base64Data = result.split(",")[1];
            if (!base64Data) {
               reject(new Error("Failed to extract base64 data"));
               return;
            }
            resolve(base64Data);
         };
         reader.onerror = reject;
         reader.readAsDataURL(file);
      });
   };

   return {
      ...state,
      clearFile,
      convertToBase64,
      handleFileSelect,
      setError,
      setUploading,
      validateFile,
   };
};

export function sanitizeDocumentType(type: string): string {
   return type
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

export function formatFileSize(bytes: number): string {
   if (bytes === 0) return "0 B";
   const k = 1024;
   const sizes = ["B", "KB", "MB", "GB"];
   const i = Math.floor(Math.log(bytes) / Math.log(k));
   return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

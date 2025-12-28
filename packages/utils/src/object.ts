export function getNestedValue(
   obj: Record<string, unknown>,
   path: string,
): unknown {
   const parts = path.split(".");
   let current: unknown = obj;

   for (const part of parts) {
      if (current === null || current === undefined) {
         return undefined;
      }
      if (typeof current !== "object") {
         return undefined;
      }
      current = (current as Record<string, unknown>)[part];
   }

   return current;
}

export function interpolateTemplate(
   template: string,
   data: Record<string, unknown>,
): string {
   return template.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
      const value = getNestedValue(data, path.trim());
      return value !== undefined ? String(value) : "";
   });
}

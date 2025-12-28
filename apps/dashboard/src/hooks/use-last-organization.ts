import { useCallback } from "react";

const STORAGE_KEY = "montte:last-organization-slug";

export function useLastOrganization() {
   const getLastSlug = useCallback((): string | null => {
      try {
         return localStorage.getItem(STORAGE_KEY);
      } catch {
         return null;
      }
   }, []);

   const setLastSlug = useCallback((slug: string) => {
      try {
         localStorage.setItem(STORAGE_KEY, slug);
      } catch {
         // localStorage not available
      }
   }, []);

   return { getLastSlug, setLastSlug };
}

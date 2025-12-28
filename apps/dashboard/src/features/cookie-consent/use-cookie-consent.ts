import { useEffect, useState } from "react";

const STORAGE_KEY = "montte-cookie-consent";

export type ConsentStatus = "accepted" | "declined" | null;

export function useCookieConsent() {
   const [consent, setConsent] = useState<ConsentStatus>(null);
   const [isHydrated, setIsHydrated] = useState(false);

   useEffect(() => {
      try {
         const stored = localStorage.getItem(STORAGE_KEY);
         if (stored === "accepted" || stored === "declined") {
            setConsent(stored as ConsentStatus);
         }
      } catch (error) {
         console.error(
            "Failed to read cookie consent from localStorage:",
            error,
         );
      } finally {
         setIsHydrated(true);
      }
   }, []);

   const accept = () => {
      try {
         localStorage.setItem(STORAGE_KEY, "accepted");
      } catch (error) {
         console.error("Failed to save cookie consent to localStorage:", error);
      }
      setConsent("accepted");
   };

   const decline = () => {
      try {
         localStorage.setItem(STORAGE_KEY, "declined");
      } catch (error) {
         console.error("Failed to save cookie consent to localStorage:", error);
      }
      setConsent("declined");
   };

   const reset = () => {
      try {
         localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
         console.error(
            "Failed to remove cookie consent from localStorage:",
            error,
         );
      }
      setConsent(null);
   };

   return { consent, accept, decline, reset, isHydrated };
}

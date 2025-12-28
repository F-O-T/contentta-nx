import { useEffect, useState } from "react";

export function useIsStandalone() {
   const [isStandalone, setIsStandalone] = useState(false);

   useEffect(() => {
      const checkStandalone = () => {
         const isIOSStandalone =
            (navigator as unknown as { standalone?: boolean }).standalone ===
            true;
         const isStandaloneMedia = window.matchMedia(
            "(display-mode: standalone)",
         ).matches;
         const isWindowControlsOverlay = window.matchMedia(
            "(display-mode: window-controls-overlay)",
         ).matches;

         return isIOSStandalone || isStandaloneMedia || isWindowControlsOverlay;
      };

      setIsStandalone(checkStandalone());

      const mediaQuery = window.matchMedia("(display-mode: standalone)");
      const handler = () => setIsStandalone(checkStandalone());
      mediaQuery.addEventListener("change", handler);

      return () => mediaQuery.removeEventListener("change", handler);
   }, []);

   return isStandalone;
}

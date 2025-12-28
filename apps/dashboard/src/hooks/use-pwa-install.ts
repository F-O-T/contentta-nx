import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
   prompt: () => Promise<void>;
   userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function usePWAInstall() {
   const [deferredPrompt, setDeferredPrompt] =
      useState<BeforeInstallPromptEvent | null>(null);
   const [canInstall, setCanInstall] = useState(false);
   const [hasPrompted, setHasPrompted] = useState(false);

   useEffect(() => {
      // Listen for beforeinstallprompt event
      const handler = (e: Event) => {
         e.preventDefault();
         setDeferredPrompt(e as BeforeInstallPromptEvent);
         setCanInstall(true);
      };

      window.addEventListener("beforeinstallprompt", handler);

      // Check if already prompted
      const prompted = localStorage.getItem("pwa-install-prompted");
      setHasPrompted(!!prompted);

      return () => window.removeEventListener("beforeinstallprompt", handler);
   }, []);

   const installPWA = async () => {
      if (!deferredPrompt) return false;

      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;

      localStorage.setItem("pwa-install-prompted", "true");
      setHasPrompted(true);
      setDeferredPrompt(null);

      return result.outcome === "accepted";
   };

   const dismissPrompt = () => {
      localStorage.setItem("pwa-install-prompted", "true");
      setHasPrompted(true);
   };

   return {
      canInstall: canInstall && !hasPrompted,
      dismissPrompt,
      installPWA,
   };
}

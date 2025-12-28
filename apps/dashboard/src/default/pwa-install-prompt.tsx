import { Button } from "@packages/ui/components/button";
import { cn } from "@packages/ui/lib/utils";
import { Download, X } from "lucide-react";
import { useState } from "react";
import { useHaptic } from "@/hooks/use-haptic";
import { usePWAInstall } from "@/hooks/use-pwa-install";

export function PWAInstallPrompt() {
   const { canInstall, installPWA, dismissPrompt } = usePWAInstall();
   const { trigger: haptic } = useHaptic();
   const [isVisible, setIsVisible] = useState(true);

   if (!canInstall || !isVisible) {
      return null;
   }

   const handleInstall = async () => {
      haptic("medium");
      const accepted = await installPWA();
      if (accepted) {
         setIsVisible(false);
      }
   };

   const handleDismiss = () => {
      haptic("light");
      dismissPrompt();
      setIsVisible(false);
   };

   return (
      <div
         className={cn(
            "fixed left-0 right-0 z-40",
            "bottom-[calc(4rem+env(safe-area-inset-bottom))]",
            "px-4 pb-3",
            "animate-in slide-in-from-bottom-5 duration-300",
         )}
      >
         <div
            className={cn(
               "bg-card border rounded-2xl shadow-lg",
               "backdrop-blur-xl",
               "p-4",
               "flex items-center gap-3",
            )}
         >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
               <Download className="size-6 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
               <p className="text-sm font-semibold">Instalar Aplicativo</p>
               <p className="text-xs text-muted-foreground">
                  Adicione à tela inicial para acesso rápido
               </p>
            </div>

            <div className="flex items-center gap-2">
               <Button
                  className="h-9 rounded-xl font-medium"
                  onClick={handleInstall}
                  size="sm"
               >
                  Instalar
               </Button>
               <Button
                  className="size-9 rounded-xl"
                  onClick={handleDismiss}
                  size="icon"
                  variant="ghost"
               >
                  <X className="size-4" />
               </Button>
            </div>
         </div>
      </div>
   );
}

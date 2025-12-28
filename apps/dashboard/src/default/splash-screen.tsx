import { cn } from "@packages/ui/lib/utils";
import { useEffect, useState } from "react";
import { useIsStandalone } from "@/hooks/use-standalone";

export function SplashScreen({ children }: { children: React.ReactNode }) {
   const isStandalone = useIsStandalone();
   const [showSplash, setShowSplash] = useState(false);
   const [fadeOut, setFadeOut] = useState(false);

   useEffect(() => {
      if (isStandalone && !sessionStorage.getItem("montte:splash-shown")) {
         setShowSplash(true);
         sessionStorage.setItem("montte:splash-shown", "true");

         const fadeTimer = setTimeout(() => setFadeOut(true), 1000);
         const hideTimer = setTimeout(() => setShowSplash(false), 1400);

         return () => {
            clearTimeout(fadeTimer);
            clearTimeout(hideTimer);
         };
      }
   }, [isStandalone]);

   if (!showSplash) return <>{children}</>;

   return (
      <>
         <div
            className={cn(
               "fixed inset-0 z-[100] flex items-center justify-center",
               "bg-[#050816] transition-opacity duration-400",
               fadeOut && "opacity-0 pointer-events-none",
            )}
         >
            <div className="flex flex-col items-center gap-6">
               <div
                  className={cn(
                     "relative",
                     "animate-in zoom-in-50 fade-in duration-700",
                  )}
               >
                  <svg
                     className="w-32 h-20"
                     fill="none"
                     viewBox="0 0 1987 1278"
                  >
                     <title>Montte Logo</title>
                     <path
                        className="animate-in fade-in slide-in-from-left-4 duration-500 delay-100"
                        d="M455.313 377.152L0.812988 1275.15L904.813 1276.15L455.313 377.152Z"
                        fill="#0C5343"
                     />
                     <path
                        className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200"
                        d="M1613.81 1276.15L995.313 1276.65L681.813 656.152L682.313 655.152L994.313 1.15186L1614.81 1276.15H1613.81Z"
                        fill="#42B46E"
                     />
                     <path
                        className="animate-in fade-in slide-in-from-right-4 duration-500 delay-300"
                        d="M1394.81 655.152L1533.31 376.652L1985.8 1276.15H1701.81L1394.81 655.152Z"
                        fill="#379255"
                     />
                  </svg>
                  <div
                     className={cn(
                        "absolute inset-0 blur-2xl opacity-50",
                        "bg-gradient-to-r from-[#0C5343] via-[#42B46E] to-[#379255]",
                        "animate-pulse",
                     )}
                  />
               </div>
               <span
                  className={cn(
                     "text-white/80 font-medium text-lg tracking-wide",
                     "animate-in fade-in duration-500 delay-500",
                  )}
               >
                  Montte
               </span>
            </div>
         </div>
         {children}
      </>
   );
}

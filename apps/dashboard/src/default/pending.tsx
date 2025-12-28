import { Typewriter } from "@packages/ui/components/typewriter";

export function PendingComponent({ message }: { message?: string }) {
   return (
      <div className="relative h-full w-full ">
         <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center gap-4 ">
               <div className="flex-shrink-0">
                  <img
                     alt="Content Agent Mascot"
                     className="w-16 h-16 shadow-lg animate-bounce"
                  />
               </div>
               <div className="flex-1 px-4 py-3 bg-accent rounded-2xl shadow-lg border border-primary transition-all duration-300 ease-in-out">
                  <Typewriter
                     message={
                        message ||
                        "Please wait while we prepare your dashboard..."
                     }
                  />
               </div>
            </div>
         </div>
      </div>
   );
}

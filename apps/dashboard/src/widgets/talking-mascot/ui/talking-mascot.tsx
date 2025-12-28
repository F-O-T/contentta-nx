import mascot from "@packages/brand/logo.svg";
import { Typewriter } from "@packages/ui/components/typewriter";
import type React from "react";

interface TalkingMascotProps {
   message: string;
   children?: React.ReactNode;
}

export function TalkingMascot({ message, children }: TalkingMascotProps) {
   return (
      <div className="flex items-start gap-4 w-full" id="mascot-speech">
         <div className="flex-shrink-0">
            <img
               alt="Content Agent Mascot"
               className="w-10 h-10 rounded-full shadow-lg"
               src={mascot}
            />
         </div>
         <div className="flex-1 px-4 py-2 bg-accent rounded-2xl shadow-lg border border-primary transition-all duration-300 ease-in-out">
            <Typewriter message={message} />
            {children}
         </div>
      </div>
   );
}

import type { ReactNode } from "react";

interface DefaultHeaderProps {
   title: string;
   description: ReactNode;
   actions?: ReactNode;
}

export function DefaultHeader({
   title,
   description,
   actions,
}: DefaultHeaderProps) {
   return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
         <div className="flex flex-col gap-2 min-w-0 flex-1 max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-serif leading-tight truncate">
               {title}
            </h1>
            <div className="text-base md:text-lg text-muted-foreground font-sans leading-relaxed">
               {description}
            </div>
         </div>
         {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
         )}
      </div>
   );
}
